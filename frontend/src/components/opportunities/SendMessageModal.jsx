import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Mail, Phone, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ensureConversation } from '../../utils/messaging';
import Button from '../ui/Button';
import { cn } from '../../lib/cn';

const DELIVERY_OPTIONS = [
  { value: 'internal', label: 'In-app', icon: MessageSquare, desc: 'Unity Hub messaging' },
  { value: 'email', label: 'Email', icon: Mail, desc: 'Send via email' },
  { value: 'both', label: 'Both', icon: Check, desc: 'In-app + email' },
];

export default function SendMessageModal({
  isOpen,
  onClose,
  conversationId: initialConversationId,
  opportunityId,
  receiverId,
  receiverName,
  receiverPhone,
  whatsappOptIn,
  applicationId,
  onSent,
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('internal');
  const [conversationId, setConversationId] = useState(initialConversationId);

  const resolveConversation = async () => {
    if (conversationId) return conversationId;
    if (!opportunityId || !receiverId) {
      throw new Error('Missing conversation details');
    }
    const conv = await ensureConversation({ opportunityId, otherUserId: receiverId, applicationId });
    setConversationId(conv.id);
    return conv.id;
  };

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const convId = await resolveConversation();
      const payload = {
        message: message.trim(),
        messageType: deliveryMethod,
        sendEmail: deliveryMethod === 'email' || deliveryMethod === 'both',
      };
      const res = await api.post(`/conversations/${convId}/messages`, payload);
      const emailStatus = res.data.emailStatus;
      if (deliveryMethod === 'email' || deliveryMethod === 'both') {
        if (emailStatus?.status === 'sent') {
          toast.success(deliveryMethod === 'email' ? 'Email delivered' : 'Message and email delivered');
        } else if (emailStatus?.status === 'failed' || emailStatus?.status === 'skipped') {
          toast.error(emailStatus.error || 'Message saved in chat, but email could not be delivered');
        } else {
          toast.success('Message sent');
        }
      } else {
        toast.success('Message sent');
      }
      setMessage('');
      onSent?.(convId);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const convId = await resolveConversation();
      const res = await api.post(`/conversations/${convId}/whatsapp-link`, {
        customMessage: message.trim() || undefined,
      });
      window.open(res.data.waLink, '_blank');
      toast.success('WhatsApp chat opened');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'WhatsApp link failed');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg rounded-2xl border border-border/60 bg-surface overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Send message</h3>
                  <p className="text-xs text-muted">To: {receiverName}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-2">Delivery</p>
              <div className="grid grid-cols-3 gap-2">
                {DELIVERY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeliveryMethod(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors text-center',
                        deliveryMethod === opt.value
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-border/60 text-muted hover:border-border hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your message…"
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/70 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 [color-scheme:dark]"
                autoFocus
              />
              <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
                <div className="flex gap-2">
                  <Button
                    onClick={send}
                    disabled={!message.trim() || sending}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 gap-2"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending…' : 'Send'}
                  </Button>
                  {receiverPhone && whatsappOptIn && (
                    <Button variant="secondary" onClick={handleWhatsApp} disabled={sending} className="gap-2">
                      <Phone className="w-4 h-4" /> WhatsApp
                    </Button>
                  )}
                </div>
                <p className="text-xs text-subtle hidden sm:block">Enter to send</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
