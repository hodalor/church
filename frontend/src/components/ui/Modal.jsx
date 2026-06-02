import { X } from 'lucide-react';
import Button from './Button';

const sizeClasses = {
  md: 'max-w-xl lg:max-w-[35vw]',
  lg: 'max-w-3xl lg:max-w-[52vw]',
  xl: 'max-w-5xl lg:max-w-[70vw]',
};

export default function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
  size = 'md',
  className = '',
  bodyClassName = '',
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020617]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-5 lg:items-center lg:px-6 lg:py-6">
      <div
        className={`my-auto w-full ${sizeClasses[size] || sizeClasses.md} max-h-[92vh] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1120] text-white shadow-[0_24px_64px_rgba(0,0,0,0.42)] ${className}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/8 bg-[#0b1120] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.2rem] font-semibold text-white sm:text-[1.45rem]">{title}</h3>
            {description ? <p className="mt-1 text-[13px] leading-5 text-white/55">{description}</p> : null}
          </div>
          <Button variant="subtle" onClick={onClose} className="h-10 w-10 shrink-0 rounded-xl px-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className={`max-h-[calc(92vh-5.5rem)] overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
