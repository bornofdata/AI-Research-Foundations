import React from 'react';
import { Bell } from 'lucide-react';
import { PATIENT_INFO } from '../data/mockData';

interface HeaderProps {
  unreadCount: number;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ unreadCount, onOpenNotifications }) => {
  return (
    <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-40 flex justify-between items-center px-5 py-4 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm">
          <img
            src={PATIENT_INFO.avatar}
            alt={PATIENT_INFO.name}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-headline-md text-xl md:text-2xl font-bold text-primary tracking-tight">
          CareConnect
        </span>
      </div>

      <button
        onClick={onOpenNotifications}
        className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150 text-primary"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
        )}
      </button>
    </header>
  );
};
