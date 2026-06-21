import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

export default function RouteModal({
  title,
  description,
  fallbackPath,
  size = 'xl',
  tone = 'light',
  children,
  className = '',
  bodyClassName = '',
}) {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen
      title={title}
      description={description}
      size={size}
      tone={tone}
      className={className}
      bodyClassName={bodyClassName}
      onClose={() => navigate(fallbackPath, { replace: true })}
    >
      {children}
    </Modal>
  );
}
