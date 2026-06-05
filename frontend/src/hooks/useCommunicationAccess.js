import { useCapabilities } from './useCapabilities';

export const useCommunicationAccess = () => {
  const { hasAnyCapability } = useCapabilities();

  const canViewCommunication = hasAnyCapability(['communication.view', 'communication.overview.view']);
  const canCreateCommunication = hasAnyCapability([
    'communication.create',
    'communication.broadcasts.create',
    'communication.polls.create',
  ]);
  const canModifyCommunication = hasAnyCapability([
    'communication.modify',
    'communication.broadcasts.send',
    'communication.templates.modify',
    'communication.polls.modify',
    'communication.prayer_requests.respond',
  ]);
  const canDeleteCommunication = hasAnyCapability(['communication.delete']);
  const canViewBroadcasts = hasAnyCapability(['communication.view', 'communication.broadcasts.view']);
  const canCreateBroadcasts = hasAnyCapability([
    'communication.create',
    'communication.broadcasts.create',
  ]);
  const canSendBroadcasts = hasAnyCapability([
    'communication.modify',
    'communication.broadcasts.send',
  ]);
  const canViewTemplates = hasAnyCapability(['communication.view', 'communication.templates.view']);
  const canCreateTemplates = hasAnyCapability([
    'communication.create',
    'communication.templates.create',
  ]);
  const canModifyTemplates = hasAnyCapability([
    'communication.modify',
    'communication.templates.modify',
  ]);
  const canViewPrayerRequests = hasAnyCapability([
    'communication.view',
    'communication.prayer_requests.view',
  ]);
  const canRespondPrayerRequests = hasAnyCapability([
    'communication.modify',
    'communication.prayer_requests.respond',
  ]);
  const canViewPolls = hasAnyCapability(['communication.view', 'communication.polls.view']);
  const canCreatePolls = hasAnyCapability(['communication.create', 'communication.polls.create']);
  const canModifyPolls = hasAnyCapability(['communication.modify', 'communication.polls.modify']);
  const canViewInbox = hasAnyCapability(['notifications.view', 'communication.inbox.view']);

  return {
    canViewCommunication,
    canCreateCommunication,
    canModifyCommunication,
    canDeleteCommunication,
    canViewBroadcasts,
    canCreateBroadcasts,
    canSendBroadcasts,
    canViewTemplates,
    canCreateTemplates,
    canModifyTemplates,
    canViewPrayerRequests,
    canRespondPrayerRequests,
    canViewPolls,
    canCreatePolls,
    canModifyPolls,
    canViewInbox,
  };
};

export default useCommunicationAccess;
