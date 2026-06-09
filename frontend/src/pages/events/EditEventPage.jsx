import { useParams } from 'react-router-dom';
import RouteModal from '../../components/ui/RouteModal';
import EventFormWizard from '../../components/events/EventFormWizard';

export default function EditEventPage() {
  const { eventId } = useParams();

  return (
    <RouteModal
      title="Edit Event"
      description="Update event information, ticketing, and publishing options."
      fallbackPath={eventId ? `/events/${eventId}` : '/events'}
      size="xl"
      bodyClassName="space-y-5"
    >
      <EventFormWizard eventId={eventId} fallbackPath={eventId ? `/events/${eventId}` : '/events'} />
    </RouteModal>
  );
}
