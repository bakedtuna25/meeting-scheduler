import React from 'react';
import { Pin, MoreHorizontal, Calendar, ArrowRightLeft, Trash2, Edit3, CheckSquare } from 'lucide-react';
import { Note, Meeting } from '../types';

interface NoteCardProps {
  note: Note;
  allMeetings: Meeting[];
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onReassignMeeting: (noteId: string, meetingId: string | undefined) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  allMeetings,
  onEdit,
  onDelete,
  onTogglePin,
  onReassignMeeting,
}) => {
  const [showOptions, setShowOptions] = React.useState(false);
  const [isReassigning, setIsReassigning] = React.useState(false);

  // Exact color palettes matching the screenshot:
  const colorStyles: Record<string, { bg: string; border: string; text: string; pinColor: string }> = {
    yellow: {
      bg: 'bg-[#fef9c3]',
      border: 'border-[#fef08a]',
      text: 'text-amber-950',
      pinColor: 'text-slate-600',
    },
    blue: {
      bg: 'bg-[#e0f2fe]',
      border: 'border-[#bae6fd]',
      text: 'text-sky-950',
      pinColor: 'text-slate-600',
    },
    green: {
      bg: 'bg-[#dcfce7]',
      border: 'border-[#bbf7d0]',
      text: 'text-emerald-950',
      pinColor: 'text-slate-600',
    },
    pink: {
      bg: 'bg-[#fce7f3]',
      border: 'border-[#fbcfe8]',
      text: 'text-pink-950',
      pinColor: 'text-slate-600',
    },
    purple: {
      bg: 'bg-[#f3e8ff]',
      border: 'border-[#e9d5ff]',
      text: 'text-purple-950',
      pinColor: 'text-slate-600',
    },
  };

  const style = colorStyles[note.color] || colorStyles.yellow;
  const linkedMeeting = allMeetings.find((m) => m.id === note.meetingId);

  // Parse lines for bullet formatting
  const contentLines = note.content.split('\n');

  return (
    <div
      id={`note-card-${note.id}`}
      className={`group relative rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md border ${style.bg} ${style.border} ${style.text} flex flex-col justify-between min-h-[170px]`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4
            onClick={() => onEdit(note)}
            className="font-bold text-base leading-snug tracking-tight hover:opacity-80 cursor-pointer break-words flex-1"
          >
            {note.title}
          </h4>

          <div className="flex items-center gap-1 shrink-0">
            {/* Pin Icon button (shows pushpin matching screenshot) */}
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                note.isPinned
                  ? 'opacity-100 rotate-45 text-slate-700'
                  : 'opacity-0 group-hover:opacity-60 hover:opacity-100 text-slate-500'
              }`}
              title={note.isPinned ? 'Lepas Pin' : 'Pin Catatan'}
            >
              <Pin className="w-4 h-4 fill-current" />
            </button>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-70 hover:opacity-100 text-slate-700 hover:bg-black/5 transition-opacity"
                title="Pilihan Catatan"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs">
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        onEdit(note);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit Catatan
                    </button>
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        setIsReassigning(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-blue-600"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Alihfungsikan ke Meeting
                    </button>
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        onTogglePin(note.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Pin className="w-3.5 h-3.5 text-slate-500" /> {note.isPinned ? 'Lepas Sematan' : 'Sematkan (Pin)'}
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        onDelete(note.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Catatan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content lines */}
        <div
          onClick={() => onEdit(note)}
          className="mt-2 text-sm leading-relaxed whitespace-pre-line cursor-pointer opacity-90 break-words"
        >
          {contentLines.map((line, idx) => (
            <div key={idx} className={line.startsWith('-') ? 'pl-2' : ''}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Linked Meeting Tag or Reassign prompt */}
      <div className="mt-4 pt-2 border-t border-black/5">
        {isReassigning ? (
          <div className="bg-white/90 p-2 rounded-xl border border-slate-200 shadow-xs space-y-1.5 text-xs">
            <div className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Hubungkan ke Meeting:</span>
              <button
                onClick={() => setIsReassigning(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <select
              value={note.meetingId || ''}
              onChange={(e) => {
                onReassignMeeting(note.id, e.target.value || undefined);
                setIsReassigning(false);
              }}
              className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
            >
              <option value="">(Bebas / Catatan Umum)</option>
              {allMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  📅 {m.title} ({m.date})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            {linkedMeeting ? (
              <div
                onClick={() => setIsReassigning(true)}
                className="inline-flex items-center gap-1 font-medium opacity-75 hover:opacity-100 cursor-pointer truncate max-w-[85%] bg-black/5 px-2 py-0.5 rounded-md"
                title={`Dialihfungsikan untuk meeting: ${linkedMeeting.title}`}
              >
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">{linkedMeeting.title}</span>
              </div>
            ) : (
              <button
                onClick={() => setIsReassigning(true)}
                className="text-[11px] opacity-60 hover:opacity-100 transition-opacity font-medium hover:underline flex items-center gap-1"
                title="Alihkan catatan ini menjadi pengingat/notulen meeting"
              >
                <ArrowRightLeft className="w-3 h-3" />
                + Alihkan ke Meeting
              </button>
            )}

            {note.purpose === 'meeting_minutes' && (
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 bg-black/10 px-1.5 py-0.5 rounded">
                Notulen
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
