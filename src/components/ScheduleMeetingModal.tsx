import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Bell, Video, CheckCircle2 } from 'lucide-react';
import { Meeting, MeetingAttendee, Note } from '../types';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => Promise<void>;
  isGoogleConnected: boolean;
  allNotes: Note[];
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const LOCATION_PRESETS = ['Google Meet', 'Zoom', 'Room A', 'Room B', 'Ruang Konferensi'];

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  isGoogleConnected,
  allNotes,
}) => {
  // Default date to today or tomorrow
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState('Google Meet');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [syncWithGoogle, setSyncWithGoogle] = useState(isGoogleConnected);
  const [popup10, setPopup10] = useState(true);
  const [popup30, setPopup30] = useState(true);
  const [email60, setEmail60] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setSyncWithGoogle(isGoogleConnected);
  }, [isGoogleConnected]);

  if (!isOpen) return null;

  // Calculate end time
  const calculateEndTime = (start: string, duration: number) => {
    try {
      const [h, m] = start.split(':').map((n) => parseInt(n, 10));
      const totalMinutes = h * 60 + m + duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    } catch {
      return '10:30';
    }
  };

  const handleImportNote = (note: Note) => {
    if (!title) setTitle(note.title);
    setDescription((prev) => (prev ? `${prev}\n\nAgenda dari Catatan:\n${note.content}` : note.content));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime) return;

    setIsSubmitting(true);
    try {
      const endTime = calculateEndTime(startTime, durationMinutes);

      const attendees: MeetingAttendee[] = attendeesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((email) => ({
          email,
          name: email.split('@')[0],
        }));

      const popupMinutes: number[] = [];
      if (popup10) popupMinutes.push(10);
      if (popup30) popupMinutes.push(30);

      const emailMinutes: number[] = [];
      if (email60) emailMinutes.push(60);

      await onSchedule({
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        location: location.trim(),
        meetLink: location.toLowerCase().includes('zoom')
          ? 'https://zoom.us/j/scheduled'
          : location.toLowerCase().includes('meet')
          ? 'https://meet.google.com/new'
          : undefined,
        attendees,
        status: 'scheduled',
        reminders: {
          popupMinutes,
          emailMinutes,
          soundAlert,
        },
        syncedWithGoogle: syncWithGoogle,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setAttendeesInput('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Jadwalkan Meeting Tim</h3>
              <p className="text-xs text-slate-500">Terintegrasi Google Calendar & Pengingat Otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama / Topik Meeting <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="cth: Client kickoff / Weekly team sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium outline-hidden transition-all"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Jam Mulai
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden"
              />
            </div>
          </div>

          {/* Duration Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Durasi ({durationMinutes} Menit · Berakhir jam {calculateEndTime(startTime, durationMinutes)})
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                    durationMinutes === mins
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins} Menit
                </button>
              ))}
            </div>
          </div>

          {/* Location / Platform */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Lokasi / Media Pertemuan
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Google Meet / Zoom / Room A"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocation(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    location === preset
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Quick Note Import */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Deskripsi Agenda / Rencana Pembahasan
              </label>
              {allNotes.length > 0 && (
                <div className="relative group">
                  <span className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">
                    + Impor dari Catatan
                  </span>
                  <div className="absolute right-0 top-6 w-60 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-hover:block z-30 text-xs">
                    <div className="font-semibold text-slate-700 pb-1 mb-1 border-b border-slate-100">
                      Pilih Catatan untuk Agenda:
                    </div>
                    {allNotes.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleImportNote(n)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer truncate font-medium text-slate-800"
                      >
                        📌 {n.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <textarea
              rows={3}
              placeholder="Tuliskan tujuan meeting, bahasan project scope, sprint review, dsb..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden resize-none"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Peserta / Email Anggota Tim (Pisahkan koma)
            </label>
            <input
              type="text"
              placeholder="alex@acme.com, sarah@team.internal, kevin@lead.com"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm outline-hidden"
            />
          </div>

          {/* Automatic Reminder Section */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Fitur Pengingat Otomatis (Automatic Reminder)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={popup10}
                  onChange={(e) => setPopup10(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Pengingat Pop-up 10m sebelum</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={popup30}
                  onChange={(e) => setPopup30(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Pengingat Pop-up 30m sebelum</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={email60}
                  onChange={(e) => setEmail60(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Email reminder 1 jam sebelum</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soundAlert}
                  onChange={(e) => setSoundAlert(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Bunyikan Nada Chime Otomatis</span>
              </label>
            </div>
          </div>

          {/* Google Calendar sync option */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-xs shadow-2xs">
                G
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Sinkronkan ke Google Calendar</div>
                <div className="text-[11px] text-slate-500">
                  {isGoogleConnected
                    ? 'Otomatis buat event resmi dan undang peserta'
                    : 'Google Calendar belum terhubung (dapat dihubungkan nanti)'}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncWithGoogle}
              onChange={(e) => setSyncWithGoogle(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Jadwalkan Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
