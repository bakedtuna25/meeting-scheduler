import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Key,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_AI_STUDIO_CLIENT_ID,
  USER_CUSTOM_CLIENT_ID,
  getActiveClientId,
  setActiveClientId,
} from '../services/googleCalendar';

interface OAuthOriginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectWithId: (clientId: string) => void;
}

export const OAuthOriginModal: React.FC<OAuthOriginModalProps> = ({
  isOpen,
  onClose,
  onConnectWithId,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState(getActiveClientId());
  const [customIdInput, setCustomIdInput] = useState(getActiveClientId());

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-nd5cnjhbpry2oy543z26zi-910044422099.asia-southeast1.run.app';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUseAiStudioId = () => {
    setActiveClientId(DEFAULT_AI_STUDIO_CLIENT_ID);
    setSelectedId(DEFAULT_AI_STUDIO_CLIENT_ID);
    setCustomIdInput(DEFAULT_AI_STUDIO_CLIENT_ID);
    onConnectWithId(DEFAULT_AI_STUDIO_CLIENT_ID);
    onClose();
  };

  const handleSaveCustomId = () => {
    if (!customIdInput.trim()) return;
    setActiveClientId(customIdInput.trim());
    setSelectedId(customIdInput.trim());
    onConnectWithId(customIdInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Solusi Error 400: origin_mismatch
              </h3>
              <p className="text-xs text-slate-500">
                Penyebab & Opsi Pengaturan Google OAuth Client ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Explanation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 leading-relaxed">
            <strong className="text-slate-900 font-semibold block mb-1">
              Mengapa Error 400 Terjadi?
            </strong>
            Google OAuth mewajibkan URL website tempat aplikasi berjalan didaftarkan pada kolom{' '}
            <span className="font-semibold text-slate-800">
              "Authorized JavaScript origins" (Asal JavaScript yang diizinkan)
            </span>{' '}
            di Google Cloud Console untuk Client ID yang Anda gunakan.
          </div>

          {/* Current Origin Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Asal (JavaScript Origin) Aplikasi Anda Saat Ini:
            </label>
            <div className="flex items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <code className="text-xs text-blue-700 font-mono flex-1 break-all select-all">
                {currentOrigin}
              </code>
              <button
                onClick={handleCopyOrigin}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 1: Instant AI Studio Client ID */}
          <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-emerald-950">
                  Opsi 1: Pakai Client ID Bawaan (Langsung Berhasil)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                Rekomendasi
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Client ID resmi ini sudah otomatis dikonfigurasi dan diizinkan oleh sistem AI Studio
              untuk domain aplikasi ini. Tidak perlu mendaftarkan origin secara manual di Google Cloud Console.
            </p>
            <div className="pt-2">
              <button
                onClick={handleUseAiStudioId}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                Gunakan Client ID Bawaan & Login Sekarang
              </button>
            </div>
          </div>

          {/* Option 2: Use custom client ID */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-600" />
              <span className="font-bold text-sm text-slate-900">
                Opsi 2: Tetap Gunakan Client ID Anda Sendiri
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Jika Anda ingin tetap menggunakan Client ID dari Google Cloud Console Anda:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li>
                Buka{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Pilih project Anda (misal project <code className="font-mono">964469019418</code>).</li>
              <li>Klik nama <strong>OAuth 2.0 Client ID</strong> Anda.</li>
              <li>
                Pada bagian <strong>Authorized JavaScript origins</strong> (Asal JavaScript yang diizinkan), tambahkan URL di atas:{' '}
                <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px] font-mono select-all">
                  {currentOrigin}
                </code>
              </li>
              <li>Klik tombol <strong>Save / Simpan</strong>.</li>
            </ol>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client ID Google Kustom Anda:
              </label>
              <input
                type="text"
                value={customIdInput}
                onChange={(e) => setCustomIdInput(e.target.value)}
                placeholder="cth: 964469019418-....apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 font-mono text-[11px] outline-hidden"
              />
            </div>

            <button
              onClick={handleSaveCustomId}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Simpan & Coba Login dengan Client ID Ini
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
