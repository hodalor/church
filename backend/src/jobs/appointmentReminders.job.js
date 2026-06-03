import cron from 'node-cron';
import {
  createAppointmentReminderNotifications,
  getReminderWindowAppointments,
  markAppointmentReminderSent,
} from '../modules/pastoralCare/pastoral.service.js';

const processAppointmentReminders = async () => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
  const appointments = await getReminderWindowAppointments(windowStart, windowEnd);
  const processedIds = [];

  for (const appointment of appointments) {
    await createAppointmentReminderNotifications(appointment);
    processedIds.push(appointment._id);
  }

  await markAppointmentReminderSent(processedIds);
  console.log(`Appointment reminders processed: ${processedIds.length}`);
};

export const startAppointmentRemindersJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      await processAppointmentReminders();
    } catch (error) {
      console.error('Appointment reminder job failed:', error);
    }
  });
};

export { processAppointmentReminders };
