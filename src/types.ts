export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MeetingReminderSettings {
  popupMinutes: number[]; // e.g. [10, 30]
  emailMinutes: number[]; // e.g. [60]
  soundAlert: boolean;
}

export interface MeetingAttendee {
  email: string;
  name?: string;
  responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
}

export interface Meeting {
  id: string;
  googleEventId?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  durationMinutes: number; // e.g. 30, 60
  location: string; // e.g. "Room A", "Zoom", "Google Meet"
  meetLink?: string;
  calendarHtmlLink?: string;
  attendees: MeetingAttendee[];
  status: MeetingStatus;
  reminders: MeetingReminderSettings;
  syncedWithGoogle: boolean;
  createdAt: string;
  notesIds?: string[];
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export type NotePurpose = 'general' | 'agenda' | 'follow_up' | 'parking_lot' | 'meeting_minutes';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  meetingId?: string; // ID of meeting it is linked to
  meetingTitle?: string;
  purpose: NotePurpose;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAuthState {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  isLoading: boolean;
  error: string | null;
}
