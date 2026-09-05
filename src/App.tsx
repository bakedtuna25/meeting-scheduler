import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  NotebookPen,
  Bell,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Volume2,
  CalendarCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Meeting, Note, MeetingStatus } from './types';
import { INITIAL_MEETINGS, INITIAL_NOTES } from './data/initialData';
import { MeetingCard } from './components/MeetingCard';
import { NoteCard } from './components/NoteCard';
import { AddNoteModal } from './components/AddNoteModal';
import { ScheduleMeetingModal } from './components/ScheduleMeetingModal';
import { MeetingDetailsModal } from './components/MeetingDetailsModal';
import { NotificationBanner } from './components/NotificationBanner';
import {
  getStoredToken,
  saveToken,
  clearStoredToken,
  requestGoogleCalendarToken,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  OAUTH_CLIENT_ID,
} from './services/googleCalendar';
import {
  playChimeSound,
  requestNotificationPermission,
  sendDesktopNotification,
  formatMinutesUntil,
} from './services/reminderService';

export default function App() {
  // Local state persistence
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const saved = localStorage.getItem('teamsync_meetings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MEETINGS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('teamsync_notes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTES;
  });

  // Google Calendar Auth State
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncingGcal, setIsSyncingGcal] = useState(false);
  const [gcalError, setGcalError] = useState<string | null>(null);

  // Filter tabs for Meetings matching screenshot: [ Upcoming | All | Completed ]
  const [meetingTab, setMeetingTab] = useState<'upcoming' | 'all' | 'completed'>('upcoming');

  // Notes filter
  const [notesFilter, setNotesFilter] = useState<'all' | 'pinned' | 'linked'>('all');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [initialMeetingIdForNote, setInitialMeetingIdForNote] = useState<string | undefined>(undefined);
  const [selectedMeetingForDetails, setSelectedMeetingForDetails] = useState<Meeting | null>(null);

  // Notification / Reminder permissions & triggers
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const triggeredRemindersRef = useRef<Set<string>>(new Set());

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('teamsync_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('teamsync_notes', JSON.stringify(notes));
  }, [notes]);

  // Check stored OAuth token on startup
  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      setGoogleToken(stored.accessToken);
    }
  }, []);

  // Automatic Reminder Engine: Background ticker every 20 seconds
  useEffect(() => {
    const checkUpcomingMeetings = () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
        .getDate()
        .toString()
        .padStart(2, '0')}`;

      meetings.forEach((meeting) => {
        if (meeting.status === 'completed' || meeting.status === 'cancelled') return;

        const { minutesLeft } = formatMinutesUntil(meeting.date, meeting.startTime);

        // Check configured reminder thresholds (e.g. 10m, 30m, or start 0m)
        const thresholds = meeting.reminders?.popupMinutes || [10, 30];

        thresholds.forEach((thresh) => {
          const reminderKey = `${meeting.id}-${thresh}m`;
          // If within 1 minute of threshold
          if (minutesLeft <= thresh && minutesLeft > thresh - 2 && !triggeredRemindersRef.current.has(reminderKey)) {
            triggeredRemindersRef.current.add(reminderKey);

            if (meeting.reminders?.soundAlert) {
              playChimeSound();
            }

            sendDesktopNotification(
              `🔔 Pengingat Meeting: ${meeting.title}`,
              `Meeting dimulai dalam ${minutesLeft} menit (${meeting.startTime}) di ${meeting.location}. Siapkan notulen rapat!`
            );
          }
        });

        // Exact start time notification
        const startKey = `${meeting.id}-start`;
        if (minutesLeft <= 0 && minutesLeft >= -2 && !triggeredRemindersRef.current.has(startKey)) {
          triggeredRemindersRef.current.add(startKey);
          if (meeting.reminders?.soundAlert) {
            playChimeSound();
          }
          sendDesktopNotification(
            `🚀 Meeting Dimulai: ${meeting.title}`,
            `Pertemuan sedang berlangsung di ${meeting.location}. Buka notulen rapat untuk mencatat poin pembahasan.`
          );
        }
      });
    };

    checkUpcomingMeetings();
    const interval = setInterval(checkUpcomingMeetings, 20000);
    return () => clearInterval(interval);
  }, [meetings]);

  // Imminent meeting for top banner
  const nearestUpcomingMeeting = useMemo(() => {
    let nearest: { meeting: Meeting; minutesLeft: number } | null = null;

    meetings.forEach((m) => {
      if (m.status === 'completed' || m.status === 'cancelled') return;
      const { minutesLeft } = formatMinutesUntil(m.date, m.startTime);
      if (minutesLeft >= -15 && minutesLeft <= 60) {
        if (!nearest || minutesLeft < nearest.minutesLeft) {
          nearest = { meeting: m, minutesLeft };
        }
      }
    });

    return nearest;
  }, [meetings]);

  // Connect Google Calendar flow
  const handleConnectGoogleCalendar = () => {
    setGcalError(null);
    requestGoogleCalendarToken(
      OAUTH_CLIENT_ID,
      async (token) => {
        setGoogleToken(token);
        await syncEventsFromGoogle(token);
      },
      (err) => {
        console.error('Google OAuth error:', err);
        setGcalError(err.message || 'Gagal menghubungkan Google Calendar.');
      }
    );
  };

  const handleDisconnectGoogle = () => {
    clearStoredToken();
    setGoogleToken(null);
  };

  // Sync events from Google Calendar
  const syncEventsFromGoogle = async (token = googleToken) => {
    if (!token) return;
    setIsSyncingGcal(true);
    setGcalError(null);
    try {
      const gcalEvents = await fetchGoogleCalendarEvents(token);
      setMeetings((prev) => {
        // Merge without duplicating
        const existingIds = new Set(prev.map((m) => m.googleEventId).filter(Boolean));
        const newEvents = gcalEvents.filter((ge) => !existingIds.has(ge.googleEventId));
        return [...prev, ...newEvents];
      });
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        setGoogleToken(null);
        setGcalError('Sesi Google Calendar telah kedaluwarsa. Silakan hubungkan kembali.');
      } else {
        setGcalError(err.message || 'Gagal menyinkronkan event dari Google Calendar.');
      }
    } finally {
      setIsSyncingGcal(false);
    }
  };

  // Request browser notification permission
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      playChimeSound();
      sendDesktopNotification('🔔 Notifikasi Aktif', 'Pengingat meeting otomatis sekarang siap digunakan!');
    }
  };

  // Schedule new meeting handler
  const handleScheduleMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => {
    let googleEventId: string | undefined = undefined;
    let calendarHtmlLink: string | undefined = undefined;
    let meetLink = meetingData.meetLink;

    if (meetingData.syncedWithGoogle && googleToken) {
      try {
        const result = await createGoogleCalendarEvent(googleToken, meetingData);
        googleEventId = result.eventId;
        calendarHtmlLink = result.htmlLink;
        if (result.hangoutLink) {
          meetLink = result.hangoutLink;
        }
      } catch (err: any) {
        console.error('Failed to create in Google Calendar', err);
        setGcalError(`Jadwal disimpan lokal, namun gagal sync ke Google Calendar: ${err.message}`);
      }
    }

    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet-${Date.now()}`,
      googleEventId,
      calendarHtmlLink,
      meetLink,
      createdAt: new Date().toISOString(),
    };

    setMeetings((prev) => [newMeeting, ...prev]);
  };

  // Toggle meeting status
  const handleToggleMeetingStatus = (meetingId: string, currentStatus: MeetingStatus) => {
    const nextStatus: MeetingStatus = currentStatus === 'completed' ? 'scheduled' : 'completed';
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, status: nextStatus } : m))
    );
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    const target = meetings.find((m) => m.id === meetingId);
    if (target?.googleEventId && googleToken) {
      deleteGoogleCalendarEvent(googleToken, target.googleEventId).catch((e) =>
        console.error('Delete gcal error', e)
      );
    }
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    if (selectedMeetingForDetails?.id === meetingId) {
      setSelectedMeetingForDetails(null);
    }
  };

  // Note CRUD
  const handleSaveNote = (
    noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
            : n
        )
      );
    } else {
      const newNote: Note = {
        ...noteData,
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const handleTogglePinNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleReassignNoteMeeting = (noteId: string, meetingId: string | undefined) => {
    const linkedMeeting = meetings.find((m) => m.id === meetingId);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              meetingId,
              meetingTitle: linkedMeeting?.title,
              purpose: meetingId ? 'meeting_minutes' : 'general',
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  // Filtered Meetings matching tabs: [ Upcoming | All | Completed ]
  const filteredMeetings = useMemo(() => {
    if (meetingTab === 'completed') {
      return meetings.filter((m) => m.status === 'completed');
    }
    if (meetingTab === 'upcoming') {
      return meetings.filter((m) => m.status !== 'completed');
    }
    return meetings;
  }, [meetings, meetingTab]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (notesFilter === 'pinned') {
      result = result.filter((n) => n.isPinned);
    } else if (notesFilter === 'linked') {
      result = result.filter((n) => !!n.meetingId);
    }

    // Sort pinned notes to top
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, notesFilter]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-blue-500 selection:text-white pb-20">
      {/* Top Notification Banner for Imminent Meetings */}
      <NotificationBanner
        upcomingMeeting={nearestUpcomingMeeting?.meeting || null}
        minutesLeft={nearestUpcomingMeeting?.minutesLeft || 0}
        onOpenDetails={(m) => setSelectedMeetingForDetails(m)}
        permissionGranted={notificationPermissionGranted}
        onRequestPermission={handleRequestPermission}
      />

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center font-black shadow-xs">
              <CalendarCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                TeamSync
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                Jadwal Meeting & Catatan Pembahasan
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Google Calendar Status & Connect Button */}
            {googleToken ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl px-2.5 py-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-900 hidden sm:inline">
                  Google Calendar Aktif
                </span>
                <button
                  onClick={() => syncEventsFromGoogle()}
                  disabled={isSyncingGcal}
                  className="p-1 text-emerald-700 hover:text-emerald-900 rounded hover:bg-emerald-100 transition-colors"
                  title="Sinkronkan ulang dari Google Calendar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGcal ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="text-[10px] text-slate-400 hover:text-rose-600 ml-1"
                  title="Putuskan sambungan Google"
                >
                  Putus
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogleCalendar}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                title="Hubungkan akun Google Calendar Anda"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Hubungkan</span> Google Calendar
              </button>
            )}

            {/* Test Chime Sound button */}
            <button
              onClick={() => {
                playChimeSound();
                if (!notificationPermissionGranted) {
                  handleRequestPermission();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              title="Uji coba suara pengingat meeting"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* + Schedule Meeting Button */}
            <button
              id="btn-schedule-meeting"
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Meeting</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error alert if any */}
      {gcalError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
            <span>{gcalError}</span>
            <button onClick={() => setGcalError(null)} className="text-amber-700 font-bold ml-2">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Matches layout in Screenshot */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Meetings (Col-span 7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header row: "Meetings" title and Tabs matching screenshot */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Meetings
              </h2>

              {/* Filter Tabs matching screenshot: [ Upcoming | All | Completed ] */}
              <div
                id="meetings-filter-tabs"
                className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200/60"
              >
                <button
                  onClick={() => setMeetingTab('upcoming')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    meetingTab === 'upcoming'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setMeetingTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    meetingTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMeetingTab('completed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    meetingTab === 'completed'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Meeting Cards List matching screenshot */}
            <div className="space-y-4">
              {filteredMeetings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Tidak ada meeting pada tab ini</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {meetingTab === 'upcoming'
                      ? 'Semua jadwal meeting telah selesai atau belum dibuat.'
                      : 'Belum ada meeting yang tercatat.'}
                  </p>
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    + Buat Jadwal Baru
                  </button>
                </div>
              ) : (
                filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    linkedNotes={notes.filter((n) => n.meetingId === meeting.id)}
                    onOpenDetails={(m) => setSelectedMeetingForDetails(m)}
                    onOpenAddNoteForMeeting={(m) => {
                      setInitialMeetingIdForNote(m.id);
                      setEditingNote(null);
                      setIsAddNoteModalOpen(true);
                    }}
                    onToggleStatus={handleToggleMeetingStatus}
                    onDeleteMeeting={handleDeleteMeeting}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Column: Notes (Col-span 5) matching screenshot */}
          <div className="lg:col-span-5 space-y-4">
            {/* Header row: "📝 Notes" */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-slate-900" />
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Notes
                </h2>
              </div>

              {/* Small filter pills */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <button
                  onClick={() => setNotesFilter('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    notesFilter === 'all'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                >
                  Semua ({notes.length})
                </button>
                <button
                  onClick={() => setNotesFilter('linked')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    notesFilter === 'linked'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'hover:text-slate-800'
                  }`}
                  title="Catatan yang dialihfungsikan untuk meeting"
                >
                  Notulen ({notes.filter((n) => !!n.meetingId).length})
                </button>
              </div>
            </div>

            {/* "+ Add a note" Dashed Card matching the screenshot */}
            <div
              id="btn-add-note-card"
              onClick={() => {
                setEditingNote(null);
                setInitialMeetingIdForNote(undefined);
                setIsAddNoteModalOpen(true);
              }}
              className="border-2 border-dashed border-slate-300/80 hover:border-slate-400 bg-white/50 hover:bg-white rounded-2xl py-3.5 px-4 text-center text-slate-400 hover:text-slate-700 font-medium text-sm transition-all cursor-pointer select-none flex items-center justify-center gap-2 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>+ Add a note</span>
            </div>

            {/* Grid of Colorful Sticky Notes matching screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  allMeetings={meetings}
                  onEdit={(n) => {
                    setEditingNote(n);
                    setIsAddNoteModalOpen(true);
                  }}
                  onDelete={handleDeleteNote}
                  onTogglePin={handleTogglePinNote}
                  onReassignMeeting={handleReassignNoteMeeting}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleMeeting}
        isGoogleConnected={!!googleToken}
        allNotes={notes}
      />

      {/* Add / Edit Note Modal */}
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => {
          setIsAddNoteModalOpen(false);
          setEditingNote(null);
          setInitialMeetingIdForNote(undefined);
        }}
        onSave={handleSaveNote}
        editingNote={editingNote}
        allMeetings={meetings}
        initialMeetingId={initialMeetingIdForNote}
      />

      {/* Meeting Details & Meeting Minutes Modal */}
      <MeetingDetailsModal
        meeting={selectedMeetingForDetails}
        isOpen={!!selectedMeetingForDetails}
        onClose={() => setSelectedMeetingForDetails(null)}
        linkedNotes={
          selectedMeetingForDetails
            ? notes.filter((n) => n.meetingId === selectedMeetingForDetails.id)
            : []
        }
        allNotes={notes}
        onAddNoteForMeeting={(mId) => {
          setInitialMeetingIdForNote(mId);
          setEditingNote(null);
          setIsAddNoteModalOpen(true);
        }}
        onLinkExistingNote={(noteId, mId) => handleReassignNoteMeeting(noteId, mId)}
        onUnlinkNote={(noteId) => handleReassignNoteMeeting(noteId, undefined)}
        onToggleStatus={handleToggleMeetingStatus}
        onDeleteMeeting={handleDeleteMeeting}
      />
    </div>
  );
}
