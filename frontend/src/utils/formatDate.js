export const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};
