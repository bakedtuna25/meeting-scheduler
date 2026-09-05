import React from 'react';
import { Bell, BellRing, Video, Clock, X, Volume2 } from 'lucide-react';
import { Meeting } from '../types';
import { playChimeSound, requestNotificationPermission } from '../services/reminderService';

interface NotificationBannerProps {
  upcomingMeeting: Meeting | null;
  minutesLeft: number;
  onOpenDetails: (meeting: Meeting) => void;
  permissionGranted: boolean;
  onRequestPermission: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  upcomingMeeting,
  minutesLeft,
  onOpenDetails,
  permissionGranted,
  onRequestPermission,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || !upcomingMeeting) {
    if (!permissionGranted) {
      return (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Aktifkan Pengingat Otomatis:</strong> Izinkan notifikasi browser agar Anda
              tidak melewatkan meeting tim.
            </span>
          </div>
          <button
            onClick={onRequestPermission}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Aktifkan Sekarang
          </button>
        </div>
      );
    }
    return null;
  }

  // If meeting is within 60 minutes
  if (minutesLeft > 60 || minutesLeft < -30) return null;

  const isVerySoon = minutesLeft <= 15 && minutesLeft >= 0;

  return (
    <div
      className={`border-b px-4 py-2.5 transition-colors text-xs flex items-center justify-between ${
        isVerySoon
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-blue-50 border-blue-200 text-blue-950'
      }`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isVerySoon ? 'bg-rose-600 text-white animate-pulse' : 'bg-blue-600 text-white'
          }`}
        >
          <BellRing className="w-4 h-4" />
        </div>
        <div className="truncate">
          <span className="font-bold">
            {minutesLeft <= 0
              ? 'Meeting sedang berlangsung sekarang:'
              : `Meeting dimulai dalam ${minutesLeft} menit:`}
          </span>{' '}
          <span
            onClick={() => onOpenDetails(upcomingMeeting)}
            className="font-semibold underline cursor-pointer hover:opacity-80"
          >
            {upcomingMeeting.title}
          </span>{' '}
          <span className="opacity-75">
            ({upcomingMeeting.startTime} · {upcomingMeeting.location})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => playChimeSound()}
          className="p-1 rounded text-slate-500 hover:text-slate-800"
          title="Uji suara chime"
        >
          <Volume2 className="w-4 h-4" />
        </button>
        {upcomingMeeting.meetLink && (
          <a
            href={upcomingMeeting.meetLink}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs"
          >
            <Video className="w-3 h-3" /> Masuk Meet
          </a>
        )}
        <button
          onClick={() => onOpenDetails(upcomingMeeting)}
          className="px-2.5 py-1 bg-white/80 hover:bg-white text-slate-800 border border-slate-200 rounded-lg font-medium"
        >
          Buka
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
