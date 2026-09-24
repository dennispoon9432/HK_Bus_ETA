import React from 'react';
import { BusAlarm, EtaItem, Language } from '../types/bus';
import { BellRing, VolumeX, Clock, ArrowRight, Check } from 'lucide-react';

interface AlarmRingingOverlayProps {
  isOpen: boolean;
  alarm: BusAlarm | null;
  eta: EtaItem | undefined;
  route: string;
  stopName: string;
  destName: string;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  lang: Language;
}

export const AlarmRingingOverlay: React.FC<AlarmRingingOverlayProps> = ({
  isOpen,
  alarm,
  eta,
  route,
  stopName,
  destName,
  onDismiss,
  onSnooze,
  lang,
}) => {
  if (!isOpen || !alarm) return null;

  const minutesRemaining = eta?.minutesUntil ?? alarm.alertMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-neutral-900 border-2 border-red-500 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden text-neutral-100 flex flex-col animate-bounce-short">
        {/* Animated Top Danger Bar */}
        <div className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-6 py-3 flex items-center justify-center gap-2 text-neutral-950 font-black tracking-wider uppercase text-sm animate-pulse">
          <BellRing className="w-5 h-5 animate-spin" />
          <span>{lang === 'tc' ? '⏰ 巴士到站鬧鐘提醒！' : '⏰ BUS ARRIVAL ALARM!'}</span>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          {/* Animated Alarm Icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-pulse">
              <BellRing className="w-12 h-12 animate-wiggle" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white font-mono text-xs items-center justify-center font-bold">
                !
              </span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs text-amber-400 font-mono font-bold">
              <span>{lang === 'tc' ? `第 ${alarm.tripIndex + 1} 班車` : `Trip #${alarm.tripIndex + 1}`}</span>
              <span>·</span>
              <span>
                {lang === 'tc'
                  ? `設定 ${alarm.alertMinutes} 分鐘前提醒`
                  : `Set for ${alarm.alertMinutes}m alert`}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {route}{' '}
              <span className="text-lg sm:text-xl font-normal text-neutral-400">➔ {destName}</span>
            </h2>

            <p className="text-base sm:text-lg text-amber-300 font-bold">
              {minutesRemaining <= 0
                ? lang === 'tc'
                  ? '巴士即將抵達站點！'
                  : 'Bus is arriving at the stop right now!'
                : lang === 'tc'
                ? `巴士預計還有 ${minutesRemaining} 分鐘到站！`
                : `Bus arriving in approximately ${minutesRemaining} minutes!`}
            </p>

            <p className="text-xs text-neutral-400">
              {lang === 'tc' ? '候車站點：' : 'Stop: '}
              <strong className="text-neutral-200">{stopName}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-base shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <VolumeX className="w-5 h-5" />
              <span>{lang === 'tc' ? '關閉鬧鐘 / 明白' : 'Dismiss Alarm'}</span>
            </button>

            {/* Snooze 2 min Button */}
            <button
              type="button"
              onClick={() => onSnooze(2)}
              className="py-3 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-bold text-xs sm:text-sm border border-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{lang === 'tc' ? '稍後 2 分鐘再提醒' : 'Snooze 2 mins'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
