import React, { useState } from 'react';
import { X, Pin, Calendar, Tag, Sparkles } from 'lucide-react';
import { Note, NoteColor, NotePurpose, Meeting } from '../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingNote?: Note | null;
  allMeetings: Meeting[];
  initialMeetingId?: string;
}

const COLORS: { value: NoteColor; label: string; bg: string; border: string }[] = [
  { value: 'yellow', label: 'Kuning', bg: 'bg-[#fef9c3]', border: 'border-amber-300' },
  { value: 'blue', label: 'Biru', bg: 'bg-[#e0f2fe]', border: 'border-sky-300' },
  { value: 'green', label: 'Hijau', bg: 'bg-[#dcfce7]', border: 'border-emerald-300' },
  { value: 'pink', label: 'Pink', bg: 'bg-[#fce7f3]', border: 'border-pink-300' },
  { value: 'purple', label: 'Ungu', bg: 'bg-[#f3e8ff]', border: 'border-purple-300' },
];

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingNote,
  allMeetings,
  initialMeetingId,
}) => {
  const [title, setTitle] = useState(editingNote?.title || '');
  const [content, setContent] = useState(editingNote?.content || '');
  const [color, setColor] = useState<NoteColor>(editingNote?.color || 'yellow');
  const [isPinned, setIsPinned] = useState(editingNote?.isPinned || false);
  const [purpose, setPurpose] = useState<NotePurpose>(editingNote?.purpose || 'general');
  const [meetingId, setMeetingId] = useState<string>(
    editingNote?.meetingId || initialMeetingId || ''
  );

  React.useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setColor(editingNote.color);
      setIsPinned(editingNote.isPinned);
      setPurpose(editingNote.purpose);
      setMeetingId(editingNote.meetingId || '');
    } else {
      setTitle('');
      setContent('');
      setColor('yellow');
      setIsPinned(false);
      setPurpose(initialMeetingId ? 'meeting_minutes' : 'general');
      setMeetingId(initialMeetingId || '');
    }
  }, [editingNote, initialMeetingId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const linkedMeeting = allMeetings.find((m) => m.id === meetingId);

    onSave(
      {
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
        purpose,
        meetingId: meetingId || undefined,
        meetingTitle: linkedMeeting ? linkedMeeting.title : undefined,
      },
      editingNote?.id
    );
    onClose();
  };

  const addBulletHelper = () => {
    setContent((prev) => (prev ? prev + '\n- ' : '- '));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h3 className="font-bold text-slate-900 text-lg">
              {editingNote ? 'Edit Catatan' : 'Tambah Catatan Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Judul Catatan
            </label>
            <input
              type="text"
              required
              placeholder="cth: Agenda ideas / Follow up / Notulen Rapat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium outline-hidden transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Isi Catatan / Poin Pembahasan
              </label>
              <button
                type="button"
                onClick={addBulletHelper}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                + Tambah Poin (- )
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Tulis poin-poin ide, agenda rapat, atau hal-hal penting yang dibahas..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden transition-all resize-none"
            />
          </div>

          {/* Color Picker matching screenshot */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Warna Sticky Note
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.bg} ${c.border} border-2 transition-transform ${
                    color === c.value
                      ? 'scale-115 ring-2 ring-slate-400 ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Dual-purpose: Link note to a meeting for minutes/reminder */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Alihfungsikan untuk Meeting
              </label>
              <span className="text-[11px] text-slate-500">Opsional</span>
            </div>
            <select
              value={meetingId}
              onChange={(e) => {
                setMeetingId(e.target.value);
                if (e.target.value && purpose === 'general') {
                  setPurpose('meeting_minutes');
                }
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-100 outline-hidden"
            >
              <option value="">(Bebas / Catatan Tim Umum)</option>
              {allMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  📅 {m.title} — {m.date} ({m.startTime})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 leading-tight">
              Catatan ini akan tersimpan dan tampil langsung di bawah agenda meeting tersebut.
            </p>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between pt-1">
            <label
              onClick={() => setIsPinned(!isPinned)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              Sematkan di Atas (Pin Note)
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors"
              >
                {editingNote ? 'Simpan Perubahan' : 'Tambah Catatan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
