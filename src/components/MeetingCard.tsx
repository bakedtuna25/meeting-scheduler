import React from 'react';
import { Clock, MapPin, Users, Video, Calendar, MoreVertical, CheckCircle, ExternalLink, NotebookPen } from 'lucide-react';
import { Meeting, Note } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  linkedNotes?: Note[];
  onOpenDetails: (meeting: Meeting) => void;
  onOpenAddNoteForMeeting: (meeting: Meeting) => void;
  onToggleStatus: (meetingId: string, currentStatus: Meeting['status']) => void;
  onDeleteMeeting: (meetingId: string) => void;
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  linkedNotes = [],
  onOpenDetails,
  onOpenAddNoteForMeeting,
  onToggleStatus,
  onDeleteMeeting,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  // Parse date for badge
  const parseDateBadge = () => {
    try {
      const parts = meeting.date.split('-');
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return {
          month: MONTH_NAMES[monthIdx] || 'SEP',
          day: day || 10,
        };
      }
    } catch (e) {
      // fallback
    }
    return { month: 'SEP', day: 10 };
  };

  const { month, day } = parseDateBadge();
  const isVideo = meeting.location.toLowerCase().includes('zoom') || meeting.location.toLowerCase().includes('meet') || !!meeting.meetLink;

  return (
    <div
      id={`meeting-card-${meeting.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-5 transition-all duration-200 shadow-xs hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Left Date Badge (matches screenshot exactly: dark navy container, uppercase month, bold day) */}
        <div
          id={`date-badge-${meeting.id}`}
          className="w-14 h-16 rounded-xl bg-[#0f172a] text-white flex flex-col items-center justify-center shrink-0 shadow-xs select-none"
        >
          <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase leading-none mb-1">
            {month}
          </span>
          <span className="text-2xl font-black text-white leading-none tracking-tight">
            {day}
          </span>
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                onClick={() => onOpenDetails(meeting)}
                className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
              >
                {meeting.title}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                {meeting.description || 'Tidak ada deskripsi agenda.'}
              </p>
            </div>

            {/* Top Right Actions */}
            <div className="relative">
              <button
                id={`btn-menu-${meeting.id}`}
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Opsi meeting"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs text-slate-700">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenDetails(meeting);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Detail & Notulen
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenAddNoteForMeeting(meeting);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-amber-700"
                    >
                      <NotebookPen className="w-3.5 h-3.5 text-amber-500" /> Tambah Catatan Rapat
                    </button>
                    {meeting.calendarHtmlLink && (
                      <a
                        href={meeting.calendarHtmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-blue-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Cal
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onToggleStatus(meeting.id, meeting.status);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      {meeting.status === 'completed' ? 'Kembalikan ke Jadwal' : 'Tandai Selesai'}
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteMeeting(meeting.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                    >
                      Hapus Meeting
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Metadata Row matching screenshot: 14:00 · 60m | Room A / Zoom | 1 / 3 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {meeting.startTime} · {meeting.durationMinutes}m
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              {isVideo ? (
                <Video className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="truncate max-w-[120px]">{meeting.location}</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{meeting.attendees?.length || 1}</span>
            </div>

            {meeting.syncedWithGoogle && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Calendar
              </span>
            )}
          </div>

          {/* Bottom row: Status badge pill and quick actions */}
          <div className="flex items-center justify-between mt-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                id={`status-badge-${meeting.id}`}
                onClick={() => onToggleStatus(meeting.id, meeting.status)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  meeting.status === 'completed'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : meeting.status === 'in_progress'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200/90 hover:bg-blue-100/70'
                }`}
              >
                {meeting.status === 'completed'
                  ? 'Completed'
                  : meeting.status === 'in_progress'
                  ? 'In Progress'
                  : 'Scheduled'}
              </button>

              {linkedNotes.length > 0 && (
                <button
                  onClick={() => onOpenDetails(meeting)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                  title="Ada catatan terkait meeting ini"
                >
                  <NotebookPen className="w-3 h-3 text-amber-600" />
                  <span>{linkedNotes.length} Notulen</span>
                </button>
              )}
            </div>

            {/* Quick Join or Add Note shortcut */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddNoteForMeeting(meeting)}
                className="text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1"
                title="Tambah catatan untuk meeting ini"
              >
                + Notulen
              </button>
              {meeting.meetLink && (
                <a
                  href={meeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Video className="w-3 h-3" /> Join
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
