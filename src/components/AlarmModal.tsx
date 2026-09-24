import React, { useState } from 'react';
import { BusAlarm, EtaItem, Language } from '../types/bus';
import { soundManager } from '../utils/sound';
import {
  Bell,
  BellRing,
  Volume2,
  X,
  Check,
  Clock,
  Trash2,
  AlertTriangle,
  Radio,
  ArrowRight
} from 'lucide-react';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: string;
  stopName: string;
  destName: string;
  selectedTripIndex: number;
  selectedEta: EtaItem | undefined;
  activeAlarm: BusAlarm | null;
  onSetAlarm: (alarm: BusAlarm) => void;
  onCancelAlarm: () => void;
  lang: Language;
}

const PRESET_MINUTES = [2, 3, 5, 8, 10, 15];

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  onClose,
  route,
  stopName,
  destName,
  selectedTripIndex,
  selectedEta,
  activeAlarm,
  onSetAlarm,
  onCancelAlarm,
  lang,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    activeAlarm ? activeAlarm.alertMinutes : 5
  );
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(
    activeAlarm ? activeAlarm.voiceEnabled : true
  );
  const [isTestingSound, setIsTestingSound] = useState(false);

  if (!isOpen) return null;

  const currentMinutesUntil = selectedEta?.minutesUntil ?? null;

  const handleTestSound = () => {
    setIsTestingSound(true);
    soundManager.playAlarmBurst();
    soundManager.triggerVibrate();
    setTimeout(() => {
      setIsTestingSound(false);
    }, 1200);
  };

  const handleSave = () => {
    const alertMinutes = isCustom
      ? Math.max(1, Math.min(60, parseInt(customMinutes, 10) || 5))
      : selectedMinutes;

    const newAlarm: BusAlarm = {
      id: `${route}_${selectedTripIndex}_${Date.now()}`,
      route,
      stopId: selectedEta?.eta || 'default',
      tripIndex: selectedTripIndex,
      targetEta: selectedEta?.eta || null,
      alertMinutes,
      enabled: true,
      triggered: false,
      voiceEnabled,
    };

    onSetAlarm(newAlarm);
    onClose();
  };

  const formatClockTime = (etaIso: string | null | undefined) => {
    if (!etaIso) return '';
    try {
      const d = new Date(etaIso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">
                {lang === 'tc' ? '設定到站鬧鐘提醒' : 'Bus Arrival Alarm'}
              </h3>
              <p className="text-xs text-neutral-400">
                {lang === 'tc' ? '在指定班次抵達前發出響鬧' : 'Get sound & voice alerts before bus arrives'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Selected Trip Info Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {lang === 'tc' ? '目標監測班次' : 'Target Departure'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                {lang === 'tc' ? `第 ${selectedTripIndex + 1} 班車` : `Trip #${selectedTripIndex + 1}`}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">{route}</span>
              <span className="text-xs text-neutral-400 truncate">➔ {destName}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/80">
              <span className="text-neutral-400">{stopName}</span>
              <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentMinutesUntil !== null
                    ? currentMinutesUntil <= 0
                      ? lang === 'tc'
                        ? '即將抵達'
                        : 'Arriving'
                      : `${currentMinutesUntil} ${lang === 'tc' ? '分鐘後' : 'mins'}`
                    : '--'}
                </span>
                {selectedEta?.eta && (
                  <span className="text-neutral-500 font-normal">
                    (~{formatClockTime(selectedEta.eta)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trigger Minutes Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
              {lang === 'tc' ? '到站前幾多分提醒你？' : 'Alert me before arrival:'}
            </label>

            {/* Quick Chips */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MINUTES.map((mins) => {
                const isSelected = !isCustom && selectedMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedMinutes(mins);
                    }}
                    className={`py-3 px-3 rounded-2xl border text-center font-mono font-bold text-sm transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="text-lg">{mins}</div>
                    <div className="text-[11px] font-sans font-medium opacity-90">
                      {lang === 'tc' ? '分鐘前' : 'mins before'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
              >
                {lang === 'tc' ? '＋ 自訂其他分鐘數' : '+ Custom minutes'}
              </button>

              {isCustom && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="5"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-24 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono text-center font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-neutral-400">
                    {lang === 'tc' ? '分鐘前觸發鬧鐘 (1-60)' : 'minutes before (1-60)'}
                  </span>
                </div>
              )}
            </div>

            {/* Hint message */}
            {currentMinutesUntil !== null &&
              ((isCustom ? parseInt(customMinutes, 10) : selectedMinutes) >= currentMinutesUntil) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {lang === 'tc'
                      ? '注意：設定分鐘數大於或等於目前剩餘時間，鬧鐘將會立即響起！'
                      : 'Note: Target time is already reached; alarm will trigger immediately!'}
                  </span>
                </div>
              )}
          </div>

          {/* Audio & Voice options */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'tc' ? '同時語音宣讀路線及時間' : 'Speech announcement'}</span>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Test Alarm Sound button */}
            <button
              type="button"
              onClick={handleTestSound}
              disabled={isTestingSound}
              className="w-full py-2 px-3 rounded-xl border border-neutral-700 bg-neutral-800/70 hover:bg-neutral-700 text-xs font-bold text-neutral-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Bell className={`w-3.5 h-3.5 ${isTestingSound ? 'text-amber-400 animate-spin' : ''}`} />
              <span>
                {isTestingSound
                  ? lang === 'tc'
                    ? '正在播放鬧鐘音效 (逼逼逼)...'
                    : 'Playing alarm sample...'
                  : lang === 'tc'
                  ? '試聽鬧鐘音效 (Web Audio 警報聲)'
                  : 'Test Alarm Sound Sample'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          {activeAlarm ? (
            <button
              type="button"
              onClick={() => {
                onCancelAlarm();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-red-800/80 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{lang === 'tc' ? '取消鬧鐘' : 'Cancel Alarm'}</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 font-bold text-xs transition-colors"
            >
              {lang === 'tc' ? '關閉' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>
                {activeAlarm
                  ? lang === 'tc'
                    ? '更新鬧鐘'
                    : 'Update Alarm'
                  : lang === 'tc'
                  ? '開啟鬧鐘'
                  : 'Activate Alarm'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
