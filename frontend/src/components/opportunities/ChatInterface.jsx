import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Send, Paperclip, CheckCheck, Loader2, FileText, Image,
  X, ExternalLink, Phone, MoreHorizontal, ArrowLeft, Mail,
} from 'lucide-react';
import api from '../../api/axios';
import { cn } from '../../lib/cn';
import Avatar from '../ui/Avatar';
import { attachmentUrl } from '../../utils/messaging';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/zip',
];

export default function ChatInterface({ conversationId, currentUserId, onBack, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const msgRes = await api.get(`/conversations/${conversationId}/messages`);
    setMessages(msgRes.data.messages || []);
    onMessageSent?.();
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    Promise.all([
      api.get(`/conversations/${conversationId}`),
      api.get(`/conversations/${conversationId}/messages`),
    ]).then(([convRes, msgRes]) => {
      setConversation(convRes.data.conversation);
      setParticipants(convRes.data.participants || []);
      setTimeline(convRes.data.timeline || []);
      setMessages(msgRes.data.messages || []);
    }).catch((err) => {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      toast.error(`Failed to load conversation: ${errMsg}`);
    }).finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let failures = 0;
    pollRef.current = setInterval(() => {
      if (failures >= 3) return;
      loadMessages()
        .then(() => { failures = 0; })
        .catch(() => { failures += 1; });
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [conversationId]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || sending || !conversationId) return;
    setSending(true);
    const msgText = newMessage.trim() || '(attachment)';
    setNewMessage('');
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, {
        message: msgText,
        messageType: sendEmail ? 'both' : 'internal',
        sendEmail,
      });
      const sentMsg = res.data.message;

      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('messageId', sentMsg.id);
          await api.post('/messages/upload', formData);
        }
        setUploading(false);
        setAttachments([]);
        await loadMessages();
      } else {
        setMessages((prev) => [...prev, sentMsg]);
      }

      if (sendEmail && res.data.emailStatus) {
        const { status, error } = res.data.emailStatus;
        if (status === 'sent') {
          toast.success('Message saved and email delivered');
        } else {
          toast.error(error || 'Message saved in chat, but email could not be delivered');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      toast.error(`Failed to send: ${errMsg}`);
      setNewMessage(msgText === '(attachment)' ? '' : msgText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 10MB limit`);
        continue;
      }
      valid.push(file);
    }
    setAttachments((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (type) => (type?.startsWith('image/') ? Image : FileText);

  const other = participants.find((p) => String(p.user_id) !== String(currentUserId));
  const me = participants.find((p) => String(p.user_id) === String(currentUserId));

  if (!conversationId) return null;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="px-4 py-3 border-b border-border/60 bg-surface/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button type="button" onClick={onBack} className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Avatar src={other?.avatar} name={other?.name} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{other?.name || 'Unknown'}</p>
            {other?.email && <p className="text-[11px] text-subtle truncate">{other.email}</p>}
            <p className="text-xs text-muted truncate">
              Re:{' '}
              <Link to={`/opportunities/${conversation?.opportunityId}`} className="text-emerald-400 hover:underline">
                {conversation?.opportunityTitle}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {other?.phone && other?.whatsapp_opt_in && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await api.post(`/conversations/${conversationId}/whatsapp-link`);
                  window.open(res.data.waLink, '_blank');
                  toast.success('WhatsApp opened');
                } catch (e) {
                  toast.error(e.response?.data?.message || 'WhatsApp link failed');
                }
              }}
              className="p-2 rounded-lg text-muted hover:text-emerald-400 hover:bg-white/5"
              title="Contact via WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className={cn('p-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5', showTimeline && 'text-emerald-400')}
            title="Activity timeline"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTimeline && (
        <div className="border-b border-border/60 bg-surface/10 p-4 max-h-48 overflow-y-auto scrollbar-thin">
          <h4 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Activity</h4>
          <div className="space-y-2">
            {timeline.map((event, i) => (
              <div key={event.id || i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-1.5 shrink-0" />
                <div>
                  <p className="text-foreground">{event.description}</p>
                  <p className="text-subtle">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
            {timeline.length === 0 && <p className="text-xs text-subtle">No activity yet</p>}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted">No messages yet</p>
            <p className="text-xs text-subtle mt-1">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = String(msg.senderId || msg.sender_id) === String(currentUserId);
            const attachmentsList = msg.attachments || [];
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5',
                  isMine
                    ? 'bg-emerald-600/20 border border-emerald-500/20 rounded-br-md'
                    : 'bg-surface/50 border border-border/60 rounded-bl-md'
                )}>
                  {!isMine && (
                    <p className="text-[11px] text-emerald-400/70 font-medium mb-1">{msg.senderName || msg.sender_name}</p>
                  )}
                  {(msg.messageBody || msg.message_body) !== '(attachment)' && (
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.messageBody || msg.message_body}</p>
                  )}
                  {attachmentsList.length > 0 && (
                    <div className={cn('space-y-1.5', (msg.messageBody || msg.message_body) !== '(attachment)' && 'mt-2 border-t border-border/40 pt-2')}>
                      {attachmentsList.map((att) => {
                        const Icon = getFileIcon(att.fileType || att.file_type);
                        return (
                          <a
                            key={att.id}
                            href={attachmentUrl(att)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-xs text-emerald-400 hover:underline"
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{att.fileName || att.file_name}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
                    <span className="text-[10px] text-subtle">
                      {format(new Date(msg.createdAt || msg.created_at), 'h:mm a')}
                    </span>
                    {isMine && msg.deliveryStatus === 'failed' && (
                      <span className="text-[10px] text-rose-400" title="Email delivery failed">Email failed</span>
                    )}
                    {isMine && msg.deliveryStatus === 'delivered' && (
                      <Mail className="w-3 h-3 text-emerald-400" title="Email delivered" />
                    )}
                    {isMine && (
                      <CheckCheck className={cn('w-3 h-3', (msg.readAt || msg.read_at) ? 'text-emerald-400' : 'text-subtle')} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border/60 bg-surface/10">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-background/50 rounded-lg px-2.5 py-1.5 border border-border/60">
                <FileText className="w-3.5 h-3.5 text-muted" />
                <span className="text-xs text-muted truncate max-w-[120px]">{file.name}</span>
                <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="p-0.5 text-subtle hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border/60 bg-surface/20">
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="rounded border-border text-emerald-500 focus:ring-emerald-500/30"
          />
          <Mail className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs text-muted">Also notify via email</span>
        </label>
        <div className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-muted hover:text-emerald-400 hover:bg-white/5 transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp,.zip"
          />
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-background/50 border border-border/70 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 [color-scheme:dark]"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={(!newMessage.trim() && attachments.length === 0) || sending || !conversationId}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white disabled:opacity-40 transition-opacity shrink-0"
          >
            {uploading || sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-subtle mt-1.5 pl-1">
          Enter to send · Shift+Enter for new line · PDF, DOCX, images up to 10MB
        </p>
      </div>
    </div>
  );
}
