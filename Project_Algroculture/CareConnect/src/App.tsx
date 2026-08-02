import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { buildPatientContext } from './lib/buildPatientContext';
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
import { ScanReportModal } from './components/ScanReportModal';
import { VisitPrepModal } from './components/VisitPrepModal';
import { SecondOpinionModal } from './components/SecondOpinionModal';
import { AppointmentRequestModal } from './components/AppointmentRequestModal';
import { SymptomLogModal } from './components/SymptomLogModal';
import { SymptomCheckerModal } from './components/SymptomCheckerModal';
import { VitalsLogModal } from './components/VitalsLogModal';
import { TimelineModal } from './components/TimelineModal';
import { LabCompareModal } from './components/LabCompareModal';
import { WearableImportModal } from './components/WearableImportModal';
import { LabShareModal } from './components/LabShareModal';
import { SignInPage } from './components/SignInPage';
import { usePatientData } from './hooks/usePatientData';
import { useTheme } from './hooks/useTheme';
import { useMedicationReminders } from './hooks/useMedicationReminders';
import { TabType, LabReport, Appointment, NotificationItem, Message } from './types';

const clerkEnabled = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function AppShell() {
  const { patientData, notificationState } = useAppData();
  const { patient, labReports, appointments, messages, medications, historicalTrends, loading } = patientData;
  const { notifications, setNotifications } = notificationState;
  const { isDark, toggleTheme } = useTheme();

  // Run the medication reminder interval globally so alerts fire on any tab
  useMedicationReminders();

  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activePdfReport, setActivePdfReport] = useState<LabReport | null>(null);
  const [activeTrendReport, setActiveTrendReport] = useState<LabReport | null>(null);
  const [activeAskFollowUpReport, setActiveAskFollowUpReport] = useState<LabReport | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatReport, setAiChatReport] = useState<LabReport | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [prepAppointment, setPrepAppointment] = useState<Appointment | null>(null);
  const [symptomLogOpen, setSymptomLogOpen] = useState(false);
  const [symptomCheckerOpen, setSymptomCheckerOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [vitalsLogOpen, setVitalsLogOpen] = useState(false);
  const [vitalsRefreshKey, setVitalsRefreshKey] = useState(0);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [apptRequestOpen, setApptRequestOpen] = useState(false);
  const [secondOpinionReport, setSecondOpinionReport] = useState<LabReport | null>(null);
  const [wearableImportOpen, setWearableImportOpen] = useState(false);
  const [shareReport, setShareReport] = useState<LabReport | null>(null);

  // Build patient context once; passed to AI-powered components
  const patientContext = useMemo(
    () => buildPatientContext(undefined, medications, historicalTrends),
    [medications, historicalTrends],
  );

  const handleApptRequestSent = (aiDraftedMessage: string) => {
    const newMsg: Message = {
      id: `appt-${Date.now()}`,
      senderName: patient.name,
      senderRole: 'Patient',
      senderAvatar: '',
      text: `Appointment Request\n\n${aiDraftedMessage}`,
      timestamp: 'Just now',
      isDoctor: false,
    };
    setPendingMessages((prev) => [...prev, newMsg]);
    setActiveTab('inbox');
  };

  const handleRefillSent = (aiDraftedMessage: string, medicationName: string) => {
    const newMsg: Message = {
      id: `refill-${Date.now()}`,
      senderName: patient.name,
      senderRole: 'Patient',
      senderAvatar: '',
      text: `Prescription Refill Request — ${medicationName}\n\n${aiDraftedMessage}`,
      timestamp: 'Just now',
      isDoctor: false,
    };
    setPendingMessages((prev) => [...prev, newMsg]);
    setActiveTab('inbox');
  };

  // Load AI-generated smart alerts once after data is ready
  const alertsFetched = useRef(false);
  useEffect(() => {
    if (loading || alertsFetched.current) return;
    alertsFetched.current = true;
    fetch('/api/smart-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientContext }),
    })
      .then((r) => r.json())
      .then(({ alerts }) => {
        if (!Array.isArray(alerts) || alerts.length === 0) return;
        const aiNotifications: NotificationItem[] = alerts.map((a, i) => ({
          id: `ai-alert-${i}`,
          title: a.title,
          description: a.description,
          time: 'AI · Just now',
          read: false,
          type: (a.type as NotificationItem['type']) ?? 'lab',
        }));
        setNotifications((prev) => [...aiNotifications, ...prev]);
      })
      .catch(() => { /* non-fatal */ });
  }, [loading, patientContext]);

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
          onOpenScan={() => setScanOpen(true)}
          onOpenCompare={() => setCompareOpen(true)}
          onOpenSecondOpinion={(report) => setSecondOpinionReport(report)}
          onShareReport={(report) => setShareReport(report)}
        />
      )}
      {activeTab === 'home' && (
        <HomeTab
          patient={patient}
          appointments={appointments}
          labReports={labReports}
          medications={medications}
          onNavigateToTab={setActiveTab}
          patientContext={patientContext}
          onOpenSymptomLog={() => setSymptomLogOpen(true)}
          onOpenTimeline={() => setTimelineOpen(true)}
          onOpenVitalsLog={() => setVitalsLogOpen(true)}
          vitalsRefreshKey={vitalsRefreshKey}
          onOpenSymptomChecker={() => setSymptomCheckerOpen(true)}
          onOpenVitalsImport={() => setWearableImportOpen(true)}
        />
      )}
      {activeTab === 'visits' && (
        <VisitsTab
          appointments={appointments}
          onPrepVisit={(apt) => setPrepAppointment(apt)}
          onRequestAppointment={() => setApptRequestOpen(true)}
        />
      )}
      {activeTab === 'inbox' && <InboxTab messages={[...messages, ...pendingMessages]} patientContext={patientContext} />}
      {activeTab === 'more' && <MoreTab patient={patient} medications={medications} isDark={isDark} toggleTheme={toggleTheme} labReports={labReports} appointments={appointments} patientContext={patientContext} onRefillSent={handleRefillSent} />}

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

      <ScanReportModal isOpen={scanOpen} onClose={() => setScanOpen(false)} />
      <LabCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        labReports={labReports}
      />
      <SymptomLogModal isOpen={symptomLogOpen} onClose={() => setSymptomLogOpen(false)} />
      <SymptomCheckerModal
        isOpen={symptomCheckerOpen}
        onClose={() => setSymptomCheckerOpen(false)}
        patientContext={patientContext}
        onNavigateToInbox={() => setActiveTab('inbox')}
        onOpenSymptomLog={() => { setSymptomCheckerOpen(false); setSymptomLogOpen(true); }}
      />
      <VitalsLogModal
        isOpen={vitalsLogOpen}
        onClose={() => setVitalsLogOpen(false)}
        onSaved={() => { setVitalsRefreshKey((k) => k + 1); setVitalsLogOpen(false); }}
      />
      <TimelineModal
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        labReports={labReports}
        appointments={appointments}
        messages={messages}
        medications={medications}
      />

      <AppointmentRequestModal
        isOpen={apptRequestOpen}
        onClose={() => setApptRequestOpen(false)}
        patientContext={patientContext}
        onRequestSent={handleApptRequestSent}
      />

      {prepAppointment && (
        <VisitPrepModal
          isOpen={!!prepAppointment}
          onClose={() => setPrepAppointment(null)}
          appointment={prepAppointment}
          patientContext={patientContext}
        />
      )}

      <SecondOpinionModal
        isOpen={!!secondOpinionReport}
        onClose={() => setSecondOpinionReport(null)}
        report={secondOpinionReport}
        patientContext={patientContext}
      />

      <WearableImportModal
        isOpen={wearableImportOpen}
        onClose={() => setWearableImportOpen(false)}
        onImported={() => { setVitalsRefreshKey((k) => k + 1); setWearableImportOpen(false); }}
      />

      <LabShareModal
        isOpen={!!shareReport}
        onClose={() => setShareReport(null)}
        report={shareReport}
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
