import React from 'react';
import { X, Bell, Check, FileText, MessageSquare, Calendar } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-outline-variant animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-on-surface">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-secondary font-semibold hover:underline flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.read
                  ? 'bg-surface-container-low/50 border-outline-variant/40'
                  : 'bg-primary-fixed/20 border-primary-fixed text-on-surface'
              }`}
            >
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-surface-container text-primary shrink-0 h-fit">
                  {item.type === 'lab' && <FileText className="w-4 h-4" />}
                  {item.type === 'message' && <MessageSquare className="w-4 h-4" />}
                  {item.type === 'appointment' && <Calendar className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-on-surface">{item.title}</h4>
                    <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-snug">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
