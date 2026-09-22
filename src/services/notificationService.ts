import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { storageService } from './storageService';
import { formatINR } from '../lib/formatters';

const CHANNEL_ID = 'ayc_fee_alerts';
const LAST_NOTIFIED_KEY = 'ayc_last_fee_notification_time';
const LAST_NOTIFIED_COUNT_KEY = 'ayc_last_fee_notification_count';

export class NotificationService {
  private channelCreated = false;

  /**
   * Initializes notification channels and requests permissions on app launch.
   */
  async initNotificationSystem(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // 1. Check and request notification permissions
        const currentPerm = await LocalNotifications.checkPermissions();
        if (currentPerm.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') {
            console.warn('Notification permission not granted by user.');
            return false;
          }
        }

        // 2. Create high-importance alert channel for heads-up alerts with sound & vibration
        if (!this.channelCreated) {
          await LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: 'Fee Due & Overdue Alerts',
            description: 'Critical notifications for client fee dues and overdue memberships',
            importance: 5, // High / Max priority (heads-up banner with sound & vibration)
            visibility: 1, // Public on lockscreen
            vibration: true,
            lights: true,
            lightColor: '#E05A2B', // AYC Brand color
          });
          this.channelCreated = true;
        }
        return true;
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        // Web desktop fallback
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        return Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('Error initializing notification system:', err);
    }
    return false;
  }

  /**
   * Scans for overdue and due fees, and sends forceful system notifications to device.
   * @param force - If true, bypasses throttle and forces notification dispatch.
   */
  async checkAndNotifyDueFees(force: boolean = false): Promise<void> {
    try {
      const records = storageService.getFeeRecords();
      const students = storageService.getStudents();
      const studentMap = new Map(students.map(s => [s.id, s]));
      const todayStr = new Date().toISOString().split('T')[0];

      const overdueRecords = records
        .filter(r => {
          if ((r.status !== 'OVERDUE' && r.paymentStatus !== 'OVERDUE') || (r.outstandingAmount || 0) <= 0) {
            return false;
          }
          const student = studentMap.get(r.studentId);
          if (student) {
            if (student.status !== 'Active') return false;
            if (student.paidThroughDate && student.paidThroughDate >= todayStr) return false;
            if (student.billingStatus === 'PAID') return false;
          }
          return true;
        })
        .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));

      const dueTodayRecords = records.filter(r => {
        if (r.status === 'OVERDUE' || r.paymentStatus === 'OVERDUE' || (r.outstandingAmount || 0) <= 0) {
          return false;
        }
        const isDue = (r.status === 'DUE TODAY' || r.status === 'PENDING' || r.dueDate === todayStr);
        if (!isDue) return false;
        const student = studentMap.get(r.studentId);
        if (student) {
          if (student.status !== 'Active') return false;
          if (student.paidThroughDate && student.paidThroughDate >= todayStr) return false;
          if (student.billingStatus === 'PAID') return false;
        }
        return true;
      });

      const totalPendingCount = overdueRecords.length + dueTodayRecords.length;
      if (totalPendingCount === 0) {
        return;
      }

      // Check throttle (only notify once every 1 hour unless forced or count changed)
      const now = Date.now();
      const lastNotifiedStr = localStorage.getItem(LAST_NOTIFIED_KEY);
      const lastCountStr = localStorage.getItem(LAST_NOTIFIED_COUNT_KEY);
      const lastNotified = lastNotifiedStr ? parseInt(lastNotifiedStr, 10) : 0;
      const lastCount = lastCountStr ? parseInt(lastCountStr, 10) : 0;

      const oneHourMs = 60 * 60 * 1000;
      const shouldNotify = force || 
        (now - lastNotified > oneHourMs) || 
        (totalPendingCount > lastCount);

      if (!shouldNotify) {
        return;
      }

      const totalOverdueAmount = overdueRecords.reduce((sum, r) => sum + (r.outstandingAmount || 0), 0);
      const notificationsToSchedule: any[] = [];

      // 1. Overall Summary Alert
      let summaryTitle = `⚠️ Amrit Yoga Center: Fee Due Alert`;
      let summaryBody = '';
      if (overdueRecords.length > 0 && dueTodayRecords.length > 0) {
        summaryBody = `${overdueRecords.length} clients overdue (${formatINR(totalOverdueAmount)}) & ${dueTodayRecords.length} due today. Tap to collect.`;
      } else if (overdueRecords.length > 0) {
        summaryBody = `Action Required: ${overdueRecords.length} clients have overdue fees (${formatINR(totalOverdueAmount)}). Please collect.`;
      } else {
        summaryBody = `${dueTodayRecords.length} client(s) fee due today. Tap to collect.`;
      }

      notificationsToSchedule.push({
        id: 1001,
        title: summaryTitle,
        body: summaryBody,
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 500) }, // 500ms delay
        extra: { type: 'fee_summary', count: totalPendingCount },
      });

      // 2. Individual Urgent Alert for Top Overdue Client
      if (overdueRecords.length > 0) {
        const topClient = overdueRecords[0];
        notificationsToSchedule.push({
          id: 1002,
          title: `🚨 Urgent Overdue: ${topClient.studentName}`,
          body: `Fee of ${formatINR(topClient.outstandingAmount)} is ${topClient.daysOverdue || 1} days overdue for ${topClient.planName || 'Yoga'}.`,
          channelId: CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 1500) }, // 1.5s delay
          extra: { studentId: topClient.studentId, type: 'student_overdue' },
        });
      }

      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule,
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        // Desktop Browser Web Notification fallback
        notificationsToSchedule.forEach(n => {
          new Notification(n.title, {
            body: n.body,
            icon: '/favicon.png',
          });
        });
      }

      localStorage.setItem(LAST_NOTIFIED_KEY, now.toString());
      localStorage.setItem(LAST_NOTIFIED_COUNT_KEY, totalPendingCount.toString());
    } catch (err) {
      console.warn('Failed to schedule fee due notifications:', err);
    }
  }

  /**
   * Trigger an immediate test notification to verify device sound, banner, and permissions.
   */
  async triggerTestNotification(): Promise<void> {
    await this.initNotificationSystem();
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: '🧘 Amrit Yoga Center Notifications Active',
            body: 'Fee due and overdue alerts are enabled with high-priority sound and vibration.',
            channelId: CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 300) },
          },
        ],
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🧘 Amrit Yoga Center Notifications Active', {
        body: 'Fee due and overdue alerts are active.',
        icon: '/favicon.png',
      });
    }
  }
}

export const notificationService = new NotificationService();
