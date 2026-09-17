import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { MessageSquare, Copy, ExternalLink, Check } from 'lucide-react';
import { whatsappService, WhatsAppTemplateType, WhatsAppTemplateParams } from '../../services/whatsappService';
import { useToast } from '../../context/ToastContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  recipientName: string;
  template: WhatsAppTemplateType;
  params: WhatsAppTemplateParams;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  phone,
  recipientName,
  template,
  params,
}) => {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const generated = whatsappService.generateMessage(template, {
        ...params,
        studentName: recipientName,
      });
      setMessage(generated);
      setCopied(false);
    }
  }, [isOpen, template, params, recipientName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const recipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opening WhatsApp chat for ${recipientName}...`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Message"
      subtitle={`Preview message for ${recipientName} (+91 ${phone})`}
      maxWidth="md"
      actions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in WhatsApp
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Recipient: <strong className="text-slate-800">{recipientName}</strong></span>
          <span className="font-mono">📱 +91 {phone}</span>
        </div>

        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Message Body (Editable)
          </label>
          <textarea
            rows={8}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full text-xs font-sans text-slate-800 p-3 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white leading-relaxed font-mono"
          />
        </div>

        <p className="text-[11px] text-slate-400">
          Clicking "Open in WhatsApp" will launch WhatsApp Web or App with this personalized message pre-filled.
        </p>
      </div>
    </Modal>
  );
};
