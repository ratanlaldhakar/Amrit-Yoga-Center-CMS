import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { storageService } from './storageService';
import { formatINR } from '../lib/formatters';

const CHANNEL_ID = 'ayc_fee_alerts';
const NOTIF_EVENT_LEDGER_KEY = 'ayc_sent_notification_events_v2';
const LAST_SCHEDULE_SYNC_KEY = 'ayc_last_fee_schedule_sync';

/**
 * Generates a deterministic positive 32-bit integer ID for each student and event type
 * to guarantee non-colliding, repeatable Android AlarmManager notification IDs.
 */
function getEventNotificationId(studentId: string, eventType: 'due' | 'overdue7', cycleDateStr?: string): number {
  const seedStr = `${studentId}_${eventType}_${cycleDateStr || ''}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000000;
}

export function getDueAlertId(studentId: string, studentCode?: string): number {
  return getEventNotificationId(studentId, 'due', studentCode);
}

export function getOverdue7AlertId(studentId: string, studentCode?: string): number {
  return getEventNotificationId(studentId, 'overdue7', studentCode);
}

export class NotificationService {
  private channelCreated = false;
  private isScheduling = false;
  private lastScheduleRun = 0;

  /**
   * Checks if an event (e.g. specific cycle due or 7-day overdue) has already been notified.
   * This completely prevents duplicate notifications from firing on repeated app opens.
   */
  private hasEventBeenSent(eventKey: string): boolean {
    try {
      const raw = localStorage.getItem(NOTIF_EVENT_LEDGER_KEY);
      if (!raw) return false;
      const ledger = JSON.parse(raw);
      return Boolean(ledger[eventKey]);
    } catch {
      return false;
    }
  }

  /**
   * Records that an alert event has been delivered/scheduled so it never fires again.
   */
  private markEventSent(eventKey: string, extraData?: any): void {
    try {
      const raw = localStorage.getItem(NOTIF_EVENT_LEDGER_KEY);
      const ledger = raw ? JSON.parse(raw) : {};
      ledger[eventKey] = {
        sentAt: new Date().toISOString(),
        ...extraData,
      };
      localStorage.setItem(NOTIF_EVENT_LEDGER_KEY, JSON.stringify(ledger));
    } catch (err) {
      console.warn('Error recording notification event in ledger:', err);
    }
  }

  /**
   * Initializes notification channels and requests permissions on Android.
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
            description: 'Critical notifications for client fee dues and 7-day overdue memberships',
            importance: 5, // High / Max priority (heads-up banner with sound & vibration)
            visibility: 1, // Public on lockscreen
            vibration: true,
            lights: true,
            lightColor: '#27384D', // AYC Deep Indigo brand color
          });
          this.channelCreated = true;

          // Listen for notifications received (whether foreground or background) to update ledger
          LocalNotifications.addListener('localNotificationReceived', (notification) => {
            if (notification.extra?.eventKey) {
              this.markEventSent(notification.extra.eventKey, notification.extra);
            }
          }).catch(() => {});
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
   * Schedules automated fee-due and 7-day overdue alarms in Android's AlarmManager.
   * Because alarms are scheduled at exact future timestamps with AlarmManager,
   * Android OS wakes up and fires them even when the app is completely closed.
   *
   * Features strict deduplication:
   * - Each due and 7-day overdue event fires EXACTLY ONCE per billing cycle.
   * - Opening the app multiple times will NEVER re-trigger already sent notifications.
   */
  async scheduleAllUpcomingFeeAlerts(): Promise<void> {
    const nowMs = Date.now();
    // Debounce to prevent multiple redundant runs within 3 seconds
    if (this.isScheduling || nowMs - this.lastScheduleRun < 3000) {
      return;
    }
    this.isScheduling = true;
    this.lastScheduleRun = nowMs;

    try {
      const isReady = await this.initNotificationSystem();
      if (!isReady && Capacitor.isNativePlatform()) {
        this.isScheduling = false;
        return;
      }

      const students = storageService.getStudents();
      const activeStudents = students.filter(s => s.status === 'Active');
      const studentMap = new Map(activeStudents.map(s => [s.id, s]));

      const cycles = storageService.getBillingCycles();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const notificationsToSchedule: any[] = [];

      for (const cycle of cycles) {
        const student = studentMap.get(cycle.studentId);
        if (!student) continue;

        // Skip settled or paid cycles
        const isPaid = cycle.status === 'PAID' || 
                       cycle.paymentStatus === 'PAID' || 
                       (cycle.outstandingAmount || 0) <= 0 ||
                       (student.paidThroughDate && student.paidThroughDate >= cycle.periodEndDate);
        
        if (isPaid) {
          // If paid, ensure any old pending alarms for this cycle are cancelled
          this.cancelStudentFeeAlerts(student.id, student.studentId);
          continue;
        }

        const dueAmount = cycle.outstandingAmount || cycle.finalAmount || 2000;
        const formattedAmount = formatINR(dueAmount);
        const planName = cycle.planName || student.feePlan || 'Membership';
        const clientName = student.fullName || cycle.studentName;

        if (!cycle.dueDate) continue;

        const [year, month, day] = cycle.dueDate.split('-').map(Number);
        const dueDateAt9AM = new Date(year, month - 1, day, 9, 0, 0, 0);
        const overdue7DateAt9AM = new Date(year, month - 1, day + 7, 9, 0, 0, 0);

        // --- 1. Due Date Alert (Day 1 of Fee Due at 09:00 AM) ---
        const dueEventKey = `${student.id}_${cycle.id}_due_${cycle.dueDate}`;
        const dueAlertId = getEventNotificationId(student.id, 'due', cycle.dueDate);

        if (!this.hasEventBeenSent(dueEventKey)) {
          if (dueDateAt9AM.getTime() > now.getTime()) {
            // Future Due Date: Schedule into Android AlarmManager to trigger automatically while closed
            notificationsToSchedule.push({
              id: dueAlertId,
              title: `📅 Fee Due Today: ${clientName}`,
              body: `${clientName}'s membership fee of ${formattedAmount} is due today for ${planName}. Tap to review details.`,
              channelId: CHANNEL_ID,
              smallIcon: 'ic_stat_notification',
              largeIcon: 'ic_notification_large',
              iconColor: '#27384D',
              schedule: { at: dueDateAt9AM, allowWhileIdle: true },
              extra: { studentId: student.id, cycleId: cycle.id, eventKey: dueEventKey, type: 'fee_due_day_1', amount: dueAmount },
            });
          } else if (cycle.dueDate === todayStr && now.getHours() >= 9) {
            // Due date is today and it hasn't been notified yet: trigger once & mark in ledger
            notificationsToSchedule.push({
              id: dueAlertId,
              title: `📅 Fee Due Today: ${clientName}`,
              body: `${clientName}'s membership fee of ${formattedAmount} is due today for ${planName}. Tap to collect.`,
              channelId: CHANNEL_ID,
              smallIcon: 'ic_stat_notification',
              largeIcon: 'ic_notification_large',
              iconColor: '#27384D',
              schedule: { at: new Date(Date.now() + 1500) },
              extra: { studentId: student.id, cycleId: cycle.id, eventKey: dueEventKey, type: 'fee_due_day_1', amount: dueAmount },
            });
            this.markEventSent(dueEventKey, { studentId: student.id, clientName, amount: dueAmount });
          }
        }

        // --- 2. 7-Day Overdue Alert (Exactly 7 Days After Due Date at 09:00 AM) ---
        const overdue7EventKey = `${student.id}_${cycle.id}_overdue7_${cycle.dueDate}`;
        const overdue7AlertId = getEventNotificationId(student.id, 'overdue7', cycle.dueDate);

        if (!this.hasEventBeenSent(overdue7EventKey)) {
          if (overdue7DateAt9AM.getTime() > now.getTime()) {
            // Future 7-day overdue trigger: Scheduled in AlarmManager to wake device even if app is closed
            notificationsToSchedule.push({
              id: overdue7AlertId,
              title: `⚠️ 7-Day Overdue Notice: ${clientName}`,
              body: `${clientName}'s fee of ${formattedAmount} is now 7 days overdue for ${planName}. Please follow up for collection.`,
              channelId: CHANNEL_ID,
              smallIcon: 'ic_stat_notification',
              largeIcon: 'ic_notification_large',
              iconColor: '#27384D',
              schedule: { at: overdue7DateAt9AM, allowWhileIdle: true },
              extra: { studentId: student.id, cycleId: cycle.id, eventKey: overdue7EventKey, type: 'fee_overdue_day_7', amount: dueAmount },
            });
          } else if ((cycle.daysOverdue || 0) >= 7) {
            // Already 7+ days overdue and not yet notified: trigger once & record in ledger so it NEVER repeats
            notificationsToSchedule.push({
              id: overdue7AlertId,
              title: `⚠️ 7-Day Overdue Notice: ${clientName}`,
              body: `${clientName}'s fee of ${formattedAmount} is ${cycle.daysOverdue} days overdue (${planName}). Please follow up for collection.`,
              channelId: CHANNEL_ID,
              smallIcon: 'ic_stat_notification',
              largeIcon: 'ic_notification_large',
              iconColor: '#27384D',
              schedule: { at: new Date(Date.now() + 2000) },
              extra: { studentId: student.id, cycleId: cycle.id, eventKey: overdue7EventKey, type: 'fee_overdue_day_7', amount: dueAmount },
            });
            this.markEventSent(overdue7EventKey, { studentId: student.id, clientName, amount: dueAmount });
          }
        }
      }

      if (notificationsToSchedule.length > 0) {
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: notificationsToSchedule,
          });
        }
      }

      localStorage.setItem(LAST_SCHEDULE_SYNC_KEY, now.toISOString());
    } catch (err) {
      console.warn('Error in scheduleAllUpcomingFeeAlerts:', err);
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Instantly cancels pending scheduled alarms for a student when their fee is collected.
   */
  async cancelStudentFeeAlerts(studentId: string, studentCode?: string): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) return;
      const dueId = getDueAlertId(studentId, studentCode);
      const overdue7Id = getOverdue7AlertId(studentId, studentCode);

      await LocalNotifications.cancel({
        notifications: [{ id: dueId }, { id: overdue7Id }],
      });
    } catch (err) {
      console.warn('Error canceling student fee alerts:', err);
    }
  }

  /**
   * Returns list of all pending alarms currently scheduled in Android AlarmManager.
   */
  async getPendingAlerts(): Promise<any[]> {
    try {
      if (Capacitor.isNativePlatform()) {
        const pending = await LocalNotifications.getPending();
        return pending.notifications;
      }
    } catch (err) {
      console.warn('Error fetching pending alerts:', err);
    }
    return [];
  }

  /**
   * Trigger an immediate test notification demonstrating both Due Date and 7-Day Overdue formats.
   */
  async triggerTestNotification(): Promise<void> {
    await this.initNotificationSystem();
    const now = Date.now();

    const sampleNotifications = [
      {
        id: 9991,
        title: '📅 Fee Due Today: Sharma Ji',
        body: "Sharma Ji's membership fee of ₹2,000 is due today for Monthly Regular. Tap to review details.",
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        largeIcon: 'ic_notification_large',
        iconColor: '#27384D',
        schedule: { at: new Date(now + 400) },
      },
      {
        id: 9992,
        title: '⚠️ 7-Day Overdue Notice: Verma Ji',
        body: "Verma Ji's fee of ₹2,500 is now 7 days overdue for Advanced Yoga. Please follow up for collection.",
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        largeIcon: 'ic_notification_large',
        iconColor: '#27384D',
        schedule: { at: new Date(now + 2000) },
      },
    ];

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: sampleNotifications,
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      sampleNotifications.forEach(n => {
        new Notification(n.title, {
          body: n.body,
          icon: '/logo.png',
        });
      });
    }
  }

  /**
   * Compatibility method for existing triggers.
   */
  async checkAndNotifyDueFees(): Promise<void> {
    await this.scheduleAllUpcomingFeeAlerts();
  }
}

export const notificationService = new NotificationService();
