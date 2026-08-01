import React from 'react';
import { Home, Calendar, Mail, Stethoscope, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreadMessagesCount = 1,
}) => {
  return (
    <nav className="fixed bottom-0 w-full z-40 flex justify-around items-center px-2 py-2.5 bg-surface-container shadow-[0_-4px_24px_rgba(0,49,120,0.06)] rounded-t-xl border-t border-outline-variant/30 backdrop-blur-md">
      {/* Home */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          activeTab === 'home'
            ? 'bg-primary-container text-on-primary-container px-4 py-1.5'
            : 'text-on-surface-variant hover:bg-surface-variant/50'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Home</span>
      </button>

      {/* Visits */}
      <button
        onClick={() => setActiveTab('visits')}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          activeTab === 'visits'
            ? 'bg-primary-container text-on-primary-container px-4 py-1.5'
            : 'text-on-surface-variant hover:bg-surface-variant/50'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Visits</span>
      </button>

      {/* Inbox */}
      <button
        onClick={() => setActiveTab('inbox')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          activeTab === 'inbox'
            ? 'bg-primary-container text-on-primary-container px-4 py-1.5'
            : 'text-on-surface-variant hover:bg-surface-variant/50'
        }`}
      >
        <Mail className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Inbox</span>
        {unreadMessagesCount > 0 && activeTab !== 'inbox' && (
          <div className="absolute top-1.5 right-2 w-2 h-2 bg-error rounded-full" />
        )}
      </button>

      {/* Health (Lab Results) */}
      <button
        onClick={() => setActiveTab('health')}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          activeTab === 'health'
            ? 'bg-primary-container text-on-primary-container px-4 py-1.5'
            : 'text-on-surface-variant hover:bg-surface-variant/50'
        }`}
      >
        <Stethoscope className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">Health</span>
      </button>

      {/* More */}
      <button
        onClick={() => setActiveTab('more')}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-90 ${
          activeTab === 'more'
            ? 'bg-primary-container text-on-primary-container px-4 py-1.5'
            : 'text-on-surface-variant hover:bg-surface-variant/50'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-tight mt-0.5">More</span>
      </button>
    </nav>
  );
};
