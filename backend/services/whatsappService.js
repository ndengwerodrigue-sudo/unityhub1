const db = require('../db');

const WHATSAPP_BASE_URL = 'https://wa.me';

function generateWaLink(phoneNumber, text) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  return `${WHATSAPP_BASE_URL}/${cleanPhone}?text=${encoded}`;
}

function buildMessageTemplate({ recipientName, senderName, opportunityTitle, company, customMessage, senderRole }) {
  if (customMessage) return customMessage;
  if (senderRole === 'owner') {
    return `Hello ${recipientName}, I'm ${senderName} from ${company || 'the hiring team'}. I'm reaching out regarding your application for "${opportunityTitle}" on Unity Hub. I'd like to discuss the next steps with you.`;
  }
  if (senderRole === 'applicant') {
    return `Hello ${recipientName}, I'm ${senderName}. I'm following up on my application for "${opportunityTitle}" on Unity Hub. I'd love to connect and learn more about the opportunity.`;
  }
  return `Hello ${recipientName}, I'm ${senderName}. I'm contacting you regarding "${opportunityTitle}" on Unity Hub.`;
}

async function logWhatsApp({ messageId, conversationId, recipientPhone, messageBody, waLink }) {
  const result = await db.query(
    `INSERT INTO whatsapp_logs (message_id, conversation_id, recipient_phone, message_body, wa_link, status)
     VALUES ($1, $2, $3, $4, $5, 'generated') RETURNING *`,
    [messageId || null, conversationId || null, recipientPhone, messageBody, waLink]
  );
  return result.rows[0];
}

async function generateWhatsAppLink({ recipientPhone, recipientName, senderName, opportunityTitle, company, customMessage, messageId, conversationId, senderRole }) {
  const messageBody = buildMessageTemplate({ recipientName, senderName, opportunityTitle, company, customMessage, senderRole });
  const waLink = generateWaLink(recipientPhone, messageBody);
  const log = await logWhatsApp({ messageId, conversationId, recipientPhone, messageBody, waLink });
  return { waLink, logId: log.id, messageBody };
}

module.exports = { generateWhatsAppLink, buildMessageTemplate };
