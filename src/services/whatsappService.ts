// WhatsApp Messaging Service Layer for Amrit Yoga Center ERP
// Supports dynamic templates, direct wa.me click-to-chat links, and Meta Cloud API payloads

import { formatINR, generateWhatsAppLink } from '../lib/formatters';
import { WhatsAppLog } from '../types';

export interface WhatsAppTemplateParams {
  studentName?: string;
  amount?: number;
  dueDate?: string;
  daysOverdue?: number;
  receiptNo?: string;
  paymentDate?: string;
  paymentMethod?: string;
  batchName?: string;
  planName?: string;
  period?: string;
  nextDueDate?: string;
  trialDate?: string;
  trialTime?: string;
  trainerName?: string;
  centerName?: string;
  centerPhone?: string;
  centerAddress?: string;
  upiId?: string;
}

export type WhatsAppTemplateType =
  | 'fee_reminder'
  | 'overdue_reminder'
  | 'payment_receipt'
  | 'trial_reminder'
  | 'welcome_student';

export class WhatsAppService {
  private defaultCenterName = 'Amrit Yoga Center';
  private defaultCenterPhone = '+91 98230 45678';
  private defaultCenterAddress = 'Near Love Garden, Subhash Nagar, Bhilwara, Rajasthan 311001';
  private defaultUpiId = 'amrityoga@icici';

  /**
   * Build message text dynamically based on template and data
   */
  generateMessage(template: WhatsAppTemplateType, params: WhatsAppTemplateParams): string {
    const center = params.centerName || this.defaultCenterName;
    const phone = params.centerPhone || this.defaultCenterPhone;
    const address = params.centerAddress || this.defaultCenterAddress;
    const upi = params.upiId || this.defaultUpiId;
    const name = params.studentName || 'Student';
    const amountStr = params.amount ? formatINR(params.amount) : '₹0';

    switch (template) {
      case 'fee_reminder':
        return `Namaste ${name} ji 🙏\n\nThis is a gentle reminder that your membership renewal fee of *${amountStr}* for *${center}* is due on *${params.dueDate || 'your scheduled due date'}*${params.period ? ` (Coverage: *${params.period}*)` : ''}.\n\nYou can pay via UPI to:\n📲 UPI ID: *${upi}*\nOr pay at the center reception counter.\n\nThank you,\n${center}\n📞 ${phone}`;

      case 'overdue_reminder':
        return `Namaste ${name} ji 🙏\n\nYour membership renewal fee of *${amountStr}* for *${center}* is currently overdue by *${params.daysOverdue || 5} days*${params.dueDate ? ` (Scheduled due date: *${params.dueDate}*)` : ''}.\n\nKindly complete your renewal payment at the earliest to maintain your active batch slot.\n\n📲 Pay via UPI: *${upi}*\n(Please share screenshot after payment)\n\nThank you,\n${center}\n📞 ${phone}`;

      case 'payment_receipt':
        return `Namaste ${name} ji 🙏\n\nWe have received your advance payment of *${amountStr}* for *${params.batchName || 'Regular Yoga Batch'}*.\n\n📄 *Receipt No:* ${params.receiptNo || 'AYC-REC'}\n📅 *Payment Date:* ${params.paymentDate || 'Today'}${params.period ? `\n📆 *Coverage Period:* ${params.period}` : ''}${params.nextDueDate ? `\n📌 *Next Due Date:* ${params.nextDueDate}` : ''}\n💳 *Payment Mode:* ${params.paymentMethod || 'UPI'}\n\nThank you for practicing with *${center}*.\nHave a healthy and peaceful day ahead! 🧘\n📞 ${phone}`;

      case 'trial_reminder':
        return `Namaste ${name} ji 🙏\n\nYour complimentary Yoga Trial Class at *${center}* is scheduled for:\n\n📅 *Date:* ${params.trialDate}\n⏰ *Time:* ${params.trialTime}\n🧘 *Batch:* ${params.batchName || 'Yoga Batch'}\n👨‍🏫 *Instructor:* ${params.trainerName || 'Yoga Acharya'}\n\n📍 *Address:* ${address}\n\n*Tips:* Please arrive 10 minutes early and wear comfortable stretching clothes. Mat is provided.\n\nSee you soon!\n${center}\n📞 ${phone}`;

      case 'welcome_student':
        return `Namaste ${name} ji 🙏\n\nA warm welcome to the *${center}* family!\n\nYour membership enrollment is confirmed for:\n🧘 *Batch:* ${params.batchName || 'Yoga Batch'}\n📋 *Plan:* ${params.planName || 'Monthly Regular'}${params.period ? `\n📆 *First Cycle:* ${params.period}` : ''}${params.nextDueDate ? `\n📌 *Next Renewal Due:* ${params.nextDueDate}` : ''}\n\nPlease bring a water bottle and small hand towel. Consistency in practice is the key to wellness!\n\nWarm regards,\n${center}\n📞 ${phone}`;

      default:
        return `Namaste ${name} ji 🙏\n\nGreetings from ${center}. For any inquiries, please contact us at ${phone}.`;
    }
  }

  /**
   * Get direct wa.me link for browser / mobile dispatch
   */
  getDirectChatLink(phone: string, template: WhatsAppTemplateType, params: WhatsAppTemplateParams): string {
    const message = this.generateMessage(template, params);
    return generateWhatsAppLink(phone, message);
  }

  /**
   * Generates standard Meta WhatsApp Cloud API JSON payload ready for production webhook
   */
  buildMetaCloudApiPayload(toPhoneNumber: string, template: WhatsAppTemplateType, params: WhatsAppTemplateParams) {
    const cleanPhone = toPhoneNumber.replace(/\D/g, '');
    const internationalRecipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: internationalRecipient,
      type: 'template',
      template: {
        name: template,
        language: { code: 'en_IN' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: params.studentName || 'Student' },
              { type: 'text', text: params.amount ? formatINR(params.amount) : '0' },
            ],
          },
        ],
      },
    };
  }

  /**
   * Open WhatsApp in new tab with prefilled message
   */
  sendDirect(phone: string, template: WhatsAppTemplateType, params: WhatsAppTemplateParams): WhatsAppLog {
    const message = this.generateMessage(template, params);
    const link = generateWhatsAppLink(phone, message);
    window.open(link, '_blank', 'noopener,noreferrer');

    const log: WhatsAppLog = {
      id: `wal-${Date.now()}`,
      phone,
      templateName: template,
      messageBody: message,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };

    return log;
  }
}

export const whatsappService = new WhatsAppService();
