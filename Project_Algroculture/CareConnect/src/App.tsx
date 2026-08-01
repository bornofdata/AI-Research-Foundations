import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
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
import { AIChatModal } from './components/AIChatModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NOTIFICATIONS } from './data/mockData';
import { TabType, LabReport, NotificationItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Report-detail modals
  const [activePdfReport, setActivePdfReport] = useState<LabReport | null>(null);
  const [activeTrendReport, setActiveTrendReport] = useState<LabReport | null>(null);
  const [activeAskFollowUpReport, setActiveAskFollowUpReport] = useState<LabReport | null>(null);

  // AI chat — focusedReport=null means global (full patient context)
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatReport, setAiChatReport] = useState<LabReport | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSendMessage = () => {
    setActiveTab('inbox');
  };

  const openAIChat = (report?: LabReport) => {
    setAiChatReport(report ?? null);
    setAiChatOpen(true);
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
          onOpenAskFollowUp={(report) => openAIChat(report)}
        />
      )}

      {activeTab === 'home' && <HomeTab onNavigateToTab={setActiveTab} />}

      {activeTab === 'visits' && <VisitsTab />}

      {activeTab === 'inbox' && <InboxTab />}

      {activeTab === 'more' && <MoreTab />}

      {/* Global AI Chat FAB — visible on all tabs */}
      {!aiChatOpen && (
        <button
          onClick={() => openAIChat()}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-full shadow-xl hover:bg-primary/90 active:scale-95 transition-all"
          aria-label="Open AI Health Assistant"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold">Ask AI</span>
        </button>
      )}

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

      <AIChatModal
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        focusedReport={aiChatReport}
      />

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
