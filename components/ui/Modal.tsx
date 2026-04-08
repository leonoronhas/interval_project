"use client";

import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal = ({ open, onClose, children }: Props) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-[640px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

type ModalHeaderProps = {
  onClose: () => void;
  children: React.ReactNode;
};

export const ModalHeader = ({ onClose, children }: ModalHeaderProps) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
    <div className="flex items-center gap-3">{children}</div>
    <button
      onClick={onClose}
      className="text-muted hover:text-ink transition-colors text-[20px] leading-none"
    >
      ×
    </button>
  </div>
);

export const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-y-auto flex flex-col gap-4 px-5 py-4">{children}</div>
);
