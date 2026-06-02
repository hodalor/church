import { useMemo, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  confirmText,
  children,
}) {
  const [confirmationValue, setConfirmationValue] = useState('');
  const isConfirmDisabled = useMemo(() => {
    if (!confirmText) {
      return false;
    }

    return confirmationValue.trim() !== confirmText;
  }, [confirmText, confirmationValue]);

  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-white/65">{message}</p>
        {confirmText ? (
          <Input
            label={`Type "${confirmText}" to confirm`}
            value={confirmationValue}
            onChange={(event) => setConfirmationValue(event.target.value)}
          />
        ) : null}
        {children}
        <div className="flex justify-end gap-3">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onConfirm} disabled={isConfirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
