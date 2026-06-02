import { useNavigate } from 'react-router-dom';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import TenantFormModal from '../../components/tenants/TenantFormModal';

export default function CreateTenantPage() {
  const navigate = useNavigate();

  return (
    <SuperAdminShell>
      <TenantFormModal
        isOpen
        onClose={() => navigate('/superadmin/tenants', { replace: true })}
        onCreated={() => navigate('/superadmin/tenants', { replace: true })}
      />
    </SuperAdminShell>
  );
}
