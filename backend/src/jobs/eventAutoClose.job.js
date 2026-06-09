import cron from 'node-cron';
import { autoCloseEvent, getEventsToAutoClose } from '../modules/events/event.service.js';

export const processEventAutoClose = async () => {
  const events = await getEventsToAutoClose();

  for (const event of events) {
    await autoCloseEvent(event);
  }

  console.log(`Event auto-close processed: ${events.length}`);
};

export const startEventAutoCloseJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      await processEventAutoClose();
    } catch (error) {
      console.error('Event auto-close job failed:', error);
    }
  });
};
