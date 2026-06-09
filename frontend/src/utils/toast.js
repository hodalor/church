import toast from 'react-hot-toast';

const baseStyle = {
  borderRadius: '16px',
  padding: '12px 16px',
  fontSize: '14px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
};

export const showSuccessToast = (message) =>
  toast.success(message, {
    style: {
      ...baseStyle,
      background: '#C9A84C',
      color: '#1E2A4A',
    },
  });

export const showErrorToast = (message) =>
  toast.error(message, {
    style: {
      ...baseStyle,
      background: '#7f1d1d',
      color: '#fff5f5',
    },
  });

export const showInfoToast = (message) =>
  toast(message, {
    icon: 'i',
    style: {
      ...baseStyle,
      background: '#1E2A4A',
      color: '#F8F7F4',
      border: '1px solid rgba(201, 168, 76, 0.35)',
    },
  });
