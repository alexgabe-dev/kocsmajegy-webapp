import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-card dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-border shadow-xl animate-slideUp"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground dark:text-gray-100 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors button-effect"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-4rem)] text-foreground dark:text-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;