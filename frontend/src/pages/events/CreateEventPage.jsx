import RouteModal from '../../components/ui/RouteModal';
import EventFormWizard from '../../components/events/EventFormWizard';

export default function CreateEventPage() {
  return (
    <RouteModal
      title="Create Event"
      description="Plan the event, configure registration and ticketing, then publish when you are ready."
      fallbackPath="/events"
      size="xl"
      bodyClassName="space-y-5"
    >
      <EventFormWizard fallbackPath="/events" />
    </RouteModal>
  );
}
