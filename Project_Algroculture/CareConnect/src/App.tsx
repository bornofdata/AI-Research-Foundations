import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HealthTab } from './components/HealthTab';
import { HomeTab } from './components/HomeTab';
import { VisitsTab } from './components/VisitsTab';
import { InboxTab } from './components/InboxTab';
import { MoreTab } from './components/MoreTab';
import { TrendAnalysisModal } from './components/TrendAnalysisModal';
import { PdfReportModal } from './components/PdfReportModal';
import { AskFollowUpModal } from './components/AskFollowUpModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NOTIFICATIONS, LAB_REPORTS } from './data/mockData';
import { TabType, LabReport, NotificationItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Active Modals
  const [activePdfReport, setActivePdfReport] = useState<LabReport | null>(null);
  const [activeTrendReport, setActiveTrendReport] = useState<LabReport | null>(null);
  const [activeAskFollowUpReport, setActiveAskFollowUpReport] = useState<LabReport | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSendMessage = (text: string) => {
    // Navigate to inbox tab or show feedback
    setActiveTab('inbox');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-fixed selection:text-on-primary-fixed antialiased">
      {/* Fixed Top Header */}
      <Header
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Tab Content Viewport */}
      {activeTab === 'health' && (
        <HealthTab
          onOpenPdf={(report) => setActivePdfReport(report)}
          onOpenTrends={(report) => setActiveTrendReport(report)}
          onOpenAskFollowUp={(report) => setActiveAskFollowUpReport(report)}
        />
      )}

      {activeTab === 'home' && <HomeTab onNavigateToTab={setActiveTab} />}

      {activeTab === 'visits' && <VisitsTab />}

      {activeTab === 'inbox' && <InboxTab />}

      {activeTab === 'more' && <MoreTab />}

      {/* Modals & Overlays */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      {activeTrendReport && (
        <TrendAnalysisModal
          isOpen={!!activeTrendReport}
          onClose={() => setActiveTrendReport(null)}
          selectedReport={activeTrendReport}
        />
      )}

      {activePdfReport && (
        <PdfReportModal
          isOpen={!!activePdfReport}
          onClose={() => setActivePdfReport(null)}
          report={activePdfReport}
        />
      )}

      {activeAskFollowUpReport && (
        <AskFollowUpModal
          isOpen={!!activeAskFollowUpReport}
          onClose={() => setActiveAskFollowUpReport(null)}
          selectedReport={activeAskFollowUpReport}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
