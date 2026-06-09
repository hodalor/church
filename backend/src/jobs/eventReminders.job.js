import cron from 'node-cron';
import {
  createEventReminderNotifications,
  getReminderWindowEvents,
} from '../modules/events/event.service.js';

const buildReminderTime = (event) => event.startTime || new Date(event.startDate).toLocaleTimeString();

export const processEventReminders = async () => {
  const now = new Date();
  const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const startingSoonStart = new Date(now.getTime() + 60 * 60 * 1000);
  const startingSoonEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [tomorrowEvents, startingSoonEvents] = await Promise.all([
    getReminderWindowEvents(tomorrowStart, tomorrowEnd),
    getReminderWindowEvents(startingSoonStart, startingSoonEnd),
  ]);

  for (const event of tomorrowEvents) {
    await createEventReminderNotifications(
      event,
      `Reminder: ${event.title} is tomorrow at ${buildReminderTime(event)}!`,
    );
  }

  for (const event of startingSoonEvents) {
    await createEventReminderNotifications(
      event,
      `Starting soon: ${event.title} begins at ${buildReminderTime(event)}.`,
    );
  }

  console.log(
    `Event reminders processed: tomorrow=${tomorrowEvents.length}, startingSoon=${startingSoonEvents.length}`,
  );
};

export const startEventRemindersJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      await processEventReminders();
    } catch (error) {
      console.error('Event reminder job failed:', error);
    }
  });
};
