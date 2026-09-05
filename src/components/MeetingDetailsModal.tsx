import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  NotebookPen,
  Bell,
  CheckCircle,
  Plus,
  Volume2,
  Trash2,
} from 'lucide-react';
import { Meeting, Note } from '../types';
import { playChimeSound, sendDesktopNotification } from '../services/reminderService';

interface MeetingDetailsModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  linkedNotes: Note[];
  allNotes: Note[];
  onAddNoteForMeeting: (meetingId: string) => void;
  onLinkExistingNote: (noteId: string, meetingId: string) => void;
  onUnlinkNote: (noteId: string) => void;
  onToggleStatus: (meetingId: string, currentStatus: Meeting['status']) => void;
  onDeleteMeeting: (meetingId: string) => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  meeting,
  isOpen,
  onClose,
  linkedNotes,
  allNotes,
  onAddNoteForMeeting,
  onLinkExistingNote,
  onUnlinkNote,
  onToggleStatus,
  onDeleteMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  if (!isOpen || !meeting) return null;

  // Filter unlinked notes that could be assigned
  const unlinkedNotes = allNotes.filter((n) => n.meetingId !== meeting.id);

  const handleTestReminder = () => {
    playChimeSound();
    sendDesktopNotification(
      `🔔 Pengingat Meeting: ${meeting.title}`,
      `Meeting dijadwalkan pada ${meeting.date} pukul ${meeting.startTime} (${meeting.location}). Bersiaplah!`
    );
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                  meeting.status === 'completed'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {meeting.status}
              </span>
              {meeting.syncedWithGoogle && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tersinkron Google Calendar
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1.5">{meeting.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 px-6 gap-6 text-sm font-medium text-slate-500">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 relative cursor-pointer ${
              activeTab === 'info'
                ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                : 'hover:text-slate-700'
            }`}
          >
            Detail & Jadwal
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                : 'hover:text-slate-700'
            }`}
          >
            <NotebookPen className="w-4 h-4 text-amber-500" />
            Catatan & Notulen ({linkedNotes.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'info' ? (
            <div className="space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Deskripsi / Agenda
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {meeting.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Tanggal</div>
                    <div className="font-semibold text-slate-800">{meeting.date}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Waktu & Durasi</div>
                    <div className="font-semibold text-slate-800">
                      {meeting.startTime} - {meeting.endTime} ({meeting.durationMinutes}m)
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Lokasi / Platform</div>
                    <div className="font-semibold text-slate-800">{meeting.location}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Jumlah Peserta</div>
                    <div className="font-semibold text-slate-800">
                      {meeting.attendees.length || 1} orang
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendees List */}
              {meeting.attendees.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Daftar Peserta
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {meeting.attendees.map((att, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200"
                      >
                        {att.name ? `${att.name} (${att.email})` : att.email}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External links */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {meeting.meetLink && (
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" /> Masuk ke Google Meet / Zoom
                  </a>
                )}
                {meeting.calendarHtmlLink && (
                  <a
                    href={meeting.calendarHtmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" /> Buka di Google Calendar
                  </a>
                )}
                <button
                  onClick={handleTestReminder}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Test suara chime dan notifikasi desktop"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  {testNotificationSent ? 'Pengingat Terkirim! 🔔' : 'Uji Coba Pengingat'}
                </button>
              </div>
            </div>
          ) : (
            /* Meeting Notes / Notulen Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Notulen & Hal Penting yang Dibahas
                  </h4>
                  <p className="text-xs text-slate-500">
                    Catatan ini dialihfungsikan khusus untuk mengingat keputusan rapat ini.
                  </p>
                </div>
                <button
                  onClick={() => onAddNoteForMeeting(meeting.id)}
                  className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Notulen
                </button>
              </div>

              {/* Linked Notes List */}
              {linkedNotes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <NotebookPen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Belum ada notulen untuk meeting ini.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Buat catatan baru atau alihkan catatan yang sudah ada di bawah.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-950 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{note.title}</div>
                        <div className="text-xs text-slate-700 whitespace-pre-line mt-1">
                          {note.content}
                        </div>
                      </div>
                      <button
                        onClick={() => onUnlinkNote(note.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 shrink-0 p-1"
                        title="Lepas dari meeting ini"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Option to attach existing notes */}
              {unlinkedNotes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    + Alihkan Catatan yang Sudah Ada ke Meeting Ini
                  </button>
                  {showAttachDropdown && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="font-medium text-slate-500 px-1">Pilih catatan bebas:</div>
                      {unlinkedNotes.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onLinkExistingNote(n.id, meeting.id);
                            setShowAttachDropdown(false);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs cursor-pointer flex items-center justify-between text-slate-800 font-medium"
                        >
                          <span>📌 {n.title}</span>
                          <span className="text-[10px] text-blue-600 uppercase font-bold">Hubungkan</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => onDeleteMeeting(meeting.id)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus Jadwal
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(meeting.id, meeting.status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                meeting.status === 'completed'
                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {meeting.status === 'completed' ? 'Batalkan Selesai' : 'Tandai Rapat Selesai'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
