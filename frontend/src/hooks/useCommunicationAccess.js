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

  return {
    canViewCommunication,
    canCreateCommunication,
    canModifyCommunication,
    canDeleteCommunication,
  };
};

export default useCommunicationAccess;
