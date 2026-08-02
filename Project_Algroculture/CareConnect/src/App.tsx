import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
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
import { SignInPage } from './components/SignInPage';
import { usePatientData } from './hooks/usePatientData';
import { TabType, LabReport, NotificationItem } from './types';

const clerkEnabled = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function AppShell() {
  const { patientData, notificationState } = useAppData();
  const { patient, labReports, appointments, messages, medications, historicalTrends, loading } = patientData;
  const { notifications, setNotifications } = notificationState;

  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activePdfReport, setActivePdfReport] = useState<LabReport | null>(null);
  const [activeTrendReport, setActiveTrendReport] = useState<LabReport | null>(null);
  const [activeAskFollowUpReport, setActiveAskFollowUpReport] = useState<LabReport | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatReport, setAiChatReport] = useState<LabReport | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const openAIChat = (report?: LabReport) => {
    setAiChatReport(report ?? null);
    setAiChatOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Loading your health data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-fixed selection:text-on-primary-fixed antialiased">
      <Header
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {activeTab === 'health' && (
        <HealthTab
          labReports={labReports}
          onOpenPdf={(report) => setActivePdfReport(report)}
          onOpenTrends={(report) => setActiveTrendReport(report)}
          onOpenAskFollowUp={(report) => openAIChat(report)}
        />
      )}
      {activeTab === 'home' && (
        <HomeTab
          patient={patient}
          appointments={appointments}
          labReports={labReports}
          onNavigateToTab={setActiveTab}
        />
      )}
      {activeTab === 'visits' && <VisitsTab appointments={appointments} />}
      {activeTab === 'inbox' && <InboxTab messages={messages} />}
      {activeTab === 'more' && <MoreTab patient={patient} medications={medications} />}

      {/* Global AI FAB */}
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
          onSendMessage={() => setActiveTab('inbox')}
        />
      )}

      <AIChatModal
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        focusedReport={aiChatReport}
        medications={medications}
        historicalTrends={historicalTrends}
      />

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// Thin hook to bridge Clerk-aware and non-Clerk data loading
function useAppData() {
  const patientData = usePatientData();
  const [notifications, setNotifications] = useState<NotificationItem[]>(patientData.notifications);

  // Keep notifications in sync when the hook reloads
  React.useEffect(() => {
    setNotifications(patientData.notifications);
  }, [patientData.notifications]);

  return { patientData, notificationState: { notifications, setNotifications } };
}

export default function App() {
  // If Clerk is configured, gate behind auth; otherwise run in dev/mock mode.
  if (clerkEnabled) {
    return <AuthGatedApp />;
  }
  return <AppShell />;
}

function AuthGatedApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <SignInPage />;
  }

  return <AppShell />;
}
