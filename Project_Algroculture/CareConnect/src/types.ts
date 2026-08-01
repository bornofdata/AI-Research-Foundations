export interface TestParameter {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  markerPercentage?: number; // 0 to 100 for range bar
  status: 'normal' | 'optimal' | 'review' | 'high' | 'low';
  statusLabel: string; // e.g. "Normal", "Optimal", "Review"
  lowLabel?: string;
  normalLabel?: string;
  highLabel?: string;
  referenceRange?: string;
}

export interface PhysicianNote {
  doctorName: string;
  doctorRole: string;
  doctorAvatar: string;
  message: string;
  timestamp: string;
}

export interface LabReport {
  id: string;
  title: string;
  date: string;
  shortDate: string;
  orderNumber: string;
  labLocation: string;
  status: 'normal' | 'review' | 'attention';
  statusText: string;
  parameters: TestParameter[];
  physicianNote?: PhysicianNote;
}

export interface Appointment {
  id: string;
  doctorName: string;
  doctorRole: string;
  doctorAvatar: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isDoctor: boolean;
  unread?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'lab' | 'appointment' | 'message' | 'system';
}

export type TabType = 'home' | 'visits' | 'inbox' | 'health' | 'more';
