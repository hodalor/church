import { useAuth } from './useAuth';
import { useCapabilities } from './useCapabilities';

const createRoles = new Set([
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'media_team',
  'care_leader',
  'branch_pastor',
]);

const viewRoles = new Set([
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'media_team',
  'care_leader',
  'branch_pastor',
  'volunteer_leader',
]);

export const useCommunicationAccess = () => {
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();

  const canViewCommunication = viewRoles.has(role) && hasCapability('communication.view');
  const canCreateCommunication = createRoles.has(role) && hasCapability('communication.create');
  const canModifyCommunication = createRoles.has(role) && hasCapability('communication.modify');
  const canDeleteCommunication = createRoles.has(role) && hasCapability('communication.delete');

  return {
    canViewCommunication,
    canCreateCommunication,
    canModifyCommunication,
    canDeleteCommunication,
  };
};

export default useCommunicationAccess;
