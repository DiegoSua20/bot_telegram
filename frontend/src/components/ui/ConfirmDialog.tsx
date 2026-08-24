import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Input';

interface ConfirmOptions {
  title: string;
  message: string;
  requireReason?: boolean;
  reasonLabel?: string;
  danger?: boolean;
  confirmLabel?: string;
}

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, options, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const [reason, setReason] = useState('');

  if (!options) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={options.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={options.danger ? 'danger' : 'primary'}
            loading={loading}
            disabled={options.requireReason && reason.trim().length < 5}
            onClick={() => onConfirm(reason)}
          >
            {options.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{options.message}</p>
      {options.requireReason && (
        <div className="mt-3">
          <Textarea
            label={options.reasonLabel ?? 'Motivo'}
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describa el motivo (minimo 5 caracteres)"
          />
        </div>
      )}
    </Modal>
  );
}
