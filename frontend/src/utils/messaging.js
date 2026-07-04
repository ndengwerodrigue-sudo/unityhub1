import api, { getApiBaseUrl } from '../api/axios';

export function attachmentUrl(attachment) {
  if (!attachment) return '#';
  const raw = attachment.filePath || attachment.file_path || '';
  if (raw.startsWith('http')) return raw;
  const filename = raw.split(/[\\/]/).pop() || attachment.fileName || attachment.file_name;
  return `${getApiBaseUrl()}/uploads/message-attachments/${filename}`;
}

export async function ensureConversation({ opportunityId, otherUserId, applicationId }) {
  const res = await api.post('/conversations/start', {
    opportunityId,
    otherUserId,
    applicationId,
  });
  return res.data.conversation;
}
