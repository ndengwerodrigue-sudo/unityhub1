const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

let transporter = null;

function getConfig() {
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  return {
    smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    smtpPort,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    brevoApiKey: process.env.BREVO_API_KEY || process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@unityhub.com',
    fromName: process.env.FROM_NAME || 'Unity Hub',
    frontendUrl: (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || 'http://localhost:3000')
      .split(',')[0]
      .trim(),
  };
}

function isConfigured() {
  const { smtpUser, smtpPass, brevoApiKey } = getConfig();
  return !!(brevoApiKey || (smtpUser && smtpPass));
}

function getTransporter() {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = getConfig();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  return transporter;
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtmlTemplate({ senderName, recipientName, subject, messageBody, opportunityTitle, company }) {
  const { frontendUrl } = getConfig();
  const inboxUrl = `${frontendUrl}/opportunities/messages`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <tr>
          <td style="padding:32px 32px 0">
            <p style="font-size:22px;font-weight:700;color:#059669;margin:0">Unity Hub</p>
          </td>
        </tr>
        <tr><td style="padding:24px 32px">
          <h2 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 4px">${escapeHtml(subject)}</h2>
          ${opportunityTitle ? `<p style="font-size:13px;color:#6b7280;margin:0 0 16px">Re: ${escapeHtml(opportunityTitle)}${company ? ` · ${escapeHtml(company)}` : ''}</p>` : ''}
          <p style="font-size:14px;color:#374151;margin:0 0 8px">Hello ${escapeHtml(recipientName)},</p>
          ${senderName ? `<p style="font-size:13px;color:#6b7280;margin:0 0 16px"><strong>${escapeHtml(senderName)}</strong> sent you a message:</p>` : ''}
          <div style="background-color:#f9fafb;border-left:3px solid #059669;padding:16px 20px;border-radius:8px;margin:0 0 16px">
            <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;white-space:pre-wrap">${escapeHtml(messageBody)}</p>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 24px;line-height:1.5">
            Reply in your <a href="${inboxUrl}" style="color:#059669;text-decoration:underline">Unity Hub inbox</a>.
          </p>
        </td></tr>
        <tr>
          <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
            <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5">
              Sent via Unity Hub Opportunities messaging.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText({ senderName, recipientName, subject, messageBody, opportunityTitle, company }) {
  const { frontendUrl } = getConfig();
  return [
    subject,
    opportunityTitle ? `Re: ${opportunityTitle}${company ? ` · ${company}` : ''}` : '',
    '',
    `Hello ${recipientName},`,
    senderName ? `${senderName} sent you a message:` : '',
    '',
    messageBody,
    '',
    `Reply in Unity Hub: ${frontendUrl}/opportunities/messages`,
  ].filter(Boolean).join('\n');
}

function parseBrevoError(body, status) {
  if (!body) return `Brevo API error (${status})`;
  if (body.code === 'unauthorized' && body.message?.includes('IP address')) {
    return 'Brevo blocked this server IP. Add your IP in Brevo → Security → Authorized IPs, or disable IP restrictions.';
  }
  return body.message || body.error || `Brevo API error (${status})`;
}

async function sendViaBrevoApi({ recipientEmail, recipientName, senderName, senderEmail, subject, html, text }) {
  const { brevoApiKey, fromEmail, fromName } = getConfig();
  if (!brevoApiKey) return null;

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (senderEmail) {
    payload.replyTo = { email: senderEmail, name: senderName || senderEmail };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': brevoApiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseBrevoError(body, response.status));
  }
  return { provider: 'brevo-api', messageId: body.messageId || null };
}

async function sendViaSmtp({ recipientEmail, senderEmail, subject, html, text }) {
  const { fromEmail, fromName } = getConfig();
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: recipientEmail,
    subject,
    html,
    text,
  };
  if (senderEmail) mailOptions.replyTo = senderEmail;
  const info = await getTransporter().sendMail(mailOptions);
  return { provider: 'smtp', messageId: info.messageId || null };
}

async function verifyEmailConfig() {
  const config = getConfig();
  const result = {
    configured: isConfigured(),
    fromEmail: config.fromEmail,
    brevoApiKeySet: !!config.brevoApiKey,
    smtpUserSet: !!config.smtpUser,
    smtpOk: false,
    brevoApiOk: false,
    error: null,
  };

  if (!result.configured) {
    result.error = 'Email not configured. Set BREVO_API_KEY or SMTP_USER + SMTP_PASS in .env';
    return result;
  }

  if (config.brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': config.brevoApiKey },
      });
      const body = await res.json().catch(() => ({}));
      result.brevoApiOk = res.ok;
      if (!res.ok) result.error = parseBrevoError(body, res.status);
    } catch (err) {
      result.error = err.message;
    }
  }

  if (config.smtpUser && config.smtpPass) {
    try {
      await getTransporter().verify();
      result.smtpOk = true;
      if (!result.error) result.error = null;
    } catch (err) {
      if (!result.error) result.error = `SMTP: ${err.message}`;
    }
  }

  return result;
}

async function sendEmail({
  recipientEmail,
  recipientName,
  senderName,
  senderEmail,
  subject,
  messageBody,
  opportunityTitle,
  company,
  messageId,
  conversationId,
}) {
  if (!recipientEmail || !String(recipientEmail).includes('@')) {
    return { status: 'failed', error: 'Recipient email is missing or invalid' };
  }

  if (!isConfigured()) {
    console.warn('[EmailService] Email not configured — skipping send');
    const log = await EmailLog.create({
      messageId,
      conversationId,
      recipientEmail,
      senderName,
      subject,
      bodyHtml: buildHtmlTemplate({ senderName, recipientName, subject, messageBody, opportunityTitle, company }),
    });
    await EmailLog.markFailed(log.id, 'Email not configured');
    return { status: 'skipped', error: 'Email not configured. Add BREVO_API_KEY to .env', logId: log.id };
  }

  const html = buildHtmlTemplate({ senderName, recipientName, subject, messageBody, opportunityTitle, company });
  const text = buildPlainText({ senderName, recipientName, subject, messageBody, opportunityTitle, company });

  const log = await EmailLog.create({
    messageId,
    conversationId,
    recipientEmail,
    senderName,
    subject,
    bodyHtml: html,
  });

  const errors = [];

  if (getConfig().brevoApiKey) {
    try {
      const result = await sendViaBrevoApi({
        recipientEmail,
        recipientName,
        senderName,
        senderEmail,
        subject,
        html,
        text,
      });
      await EmailLog.markSent(log.id);
      return { status: 'sent', logId: log.id, provider: result.provider, messageId: result.messageId };
    } catch (err) {
      console.error('[EmailService] Brevo API failed:', err.message);
      errors.push(`API: ${err.message}`);
    }
  }

  if (getConfig().smtpUser && getConfig().smtpPass) {
    try {
      const result = await sendViaSmtp({ recipientEmail, senderEmail, subject, html, text });
      await EmailLog.markSent(log.id);
      return { status: 'sent', logId: log.id, provider: result.provider, messageId: result.messageId };
    } catch (err) {
      console.error('[EmailService] SMTP failed:', err.message);
      errors.push(`SMTP: ${err.message}`);
    }
  }

  const errorMessage = errors.join(' | ') || 'No email transport available';
  await EmailLog.markFailed(log.id, errorMessage);
  return { status: 'failed', error: errorMessage, logId: log.id };
}

async function sendApplicationNotification({
  recipientEmail,
  recipientName,
  applicantName,
  opportunityTitle,
  company,
  applicationId,
  messagePreview,
}) {
  const subject = `New application: ${opportunityTitle}`;
  const messageBody = `${applicantName} applied for "${opportunityTitle}"${company ? ` at ${company}` : ''}.\n\n${messagePreview || ''}`.trim();
  return sendEmail({
    recipientEmail,
    recipientName,
    senderName: 'Unity Hub',
    subject,
    messageBody,
    opportunityTitle,
    company,
    conversationId: null,
    messageId: null,
  });
}

module.exports = {
  sendEmail,
  sendApplicationNotification,
  buildHtmlTemplate,
  verifyEmailConfig,
  isConfigured,
};
