import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BusCompany, EtaItem, DisplayTheme, Language, StopItem, BusAlarm } from '../types/bus';
import { getETA } from '../services/busApi';
import { soundManager } from '../utils/sound';
import { getStoredAlarm, saveStoredAlarm } from '../services/storage';
import { AlarmModal } from './AlarmModal';
import { AlarmRingingOverlay } from './AlarmRingingOverlay';
import { HelpGuideModal } from './HelpGuideModal';
import {
  Star,
  RefreshCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  MapPin,
  Compass,
  AlertCircle,
  Accessibility,
  Clock,
  Radio,
  Zap,
  Info,
  HelpCircle,
  Bell,
  BellRing,
  CheckCircle2,
  ListOrdered,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface BigDisplayProps {
  company: BusCompany;
  route: string;
  bound: string;
  serviceType: string;
  stop: StopItem;
  dest_tc: string;
  dest_en: string;
  nlbRouteId?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenSelector: () => void;
  onOpenFavorites: () => void;
  favoritesCount: number;
  theme: DisplayTheme;
  onChangeTheme: (theme: DisplayTheme) => void;
  lang: Language;
  onToggleLang: () => void;
  audioAlertEnabled: boolean;
  onToggleAudioAlert: () => void;
  onOpenGithubGuide: () => void;
}

export const BigDisplay: React.FC<BigDisplayProps> = ({
  company,
  route,
  bound,
  serviceType,
  stop,
  dest_tc,
  dest_en,
  nlbRouteId,
  isFavorite,
  onToggleFavorite,
  onOpenSelector,
  onOpenFavorites,
  favoritesCount,
  theme,
  onChangeTheme,
  lang,
  onToggleLang,
  audioAlertEnabled,
  onToggleAudioAlert,
  onOpenGithubGuide,
}) => {
  const [etas, setEtas] = useState<EtaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockSentinelRef = useRef<any>(null);

  // Selected trip index to display on big screen (0 = 1st bus, 1 = 2nd bus, etc.)
  const [selectedTripIndex, setSelectedTripIndex] = useState<number>(0);

  // Alarm states
  const [alarm, setAlarm] = useState<BusAlarm | null>(() => getStoredAlarm());
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [alarmTargetIndex, setAlarmTargetIndex] = useState<number>(0);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);

  // Help & Info modal
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Toast feedback notification
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Notification sound tracking so we don't repeat chime constantly
  const chimedEtaRef = useRef<string | null>(null);

  // Reset selected trip index if route or stop changes
  useEffect(() => {
    setSelectedTripIndex(0);
  }, [route, stop.stopId, bound]);

  // 1. Fetch ETAs
  const fetchArrivalTimes = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      setError(null);

      try {
        const list = await getETA(company, stop.stopId, route, serviceType, bound, nlbRouteId);
        setEtas(list);
        setLastUpdated(new Date());
        setSecondsUntilRefresh(20);

        // Regular arrival chime check (for 1st bus if general audio alert is enabled)
        if (audioAlertEnabled && list.length > 0) {
          const first = list[0];
          if (first.minutesUntil !== null && first.minutesUntil <= 3 && first.minutesUntil >= 0) {
            const key = `${first.eta}_${first.minutesUntil}`;
            if (chimedEtaRef.current !== key) {
              chimedEtaRef.current = key;
              soundManager.playChime();
              if (first.minutesUntil === 0) {
                soundManager.speakETA(
                  lang === 'tc'
                    ? `${route} 號巴士即將到站`
                    : `Bus ${route} is arriving now`,
                  lang
                );
              } else {
                soundManager.speakETA(
                  lang === 'tc'
                    ? `${route} 號巴士還有 ${first.minutesUntil} 分鐘到站`
                    : `Bus ${route} arrives in ${first.minutesUntil} minutes`,
                  lang
                );
              }
            }
          }
        }
      } catch (err: any) {
        console.error('ETA fetch error:', err);
        setError(
          lang === 'tc'
            ? '暫時未能連接巴士開放數據伺服器，請稍後再試'
            : 'Could not connect to HK Open Data API. Retrying...'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [company, stop.stopId, route, serviceType, bound, nlbRouteId, audioAlertEnabled, lang]
  );

  // Trigger initial fetch and listen to prop changes
  useEffect(() => {
    fetchArrivalTimes();
  }, [fetchArrivalTimes]);

  // Alarm checking logic
  const checkAlarmTrigger = useCallback(
    (currentEtas: EtaItem[]) => {
      if (!alarm || !alarm.enabled || alarm.triggered || currentEtas.length === 0) {
        return;
      }

      // Check if current route matches alarm route
      if (alarm.route !== route) {
        return;
      }

      // Find the specific trip that was targeted
      const targetTrip =
        currentEtas[alarm.tripIndex] ||
        currentEtas.find((e) => e.eta === alarm.targetEta);

      if (
        targetTrip &&
        targetTrip.minutesUntil !== null &&
        targetTrip.minutesUntil <= alarm.alertMinutes
      ) {
        // Trigger the alarm!
        const updatedAlarm: BusAlarm = { ...alarm, triggered: true };
        setAlarm(updatedAlarm);
        saveStoredAlarm(updatedAlarm);
        setIsAlarmRinging(true);
        soundManager.startAlarm();

        if (alarm.voiceEnabled) {
          const tripLabel =
            alarm.tripIndex === 0
              ? lang === 'tc'
                ? '最快到站班次'
                : '1st departure'
              : lang === 'tc'
              ? `第 ${alarm.tripIndex + 1} 班車`
              : `Trip #${alarm.tripIndex + 1}`;

          const voiceText =
            targetTrip.minutesUntil <= 0
              ? lang === 'tc'
                ? `鬧鐘提醒：${route} 號巴士${tripLabel}即將到達站點，請準備上車！`
                : `Alarm: Bus ${route} ${tripLabel} is arriving at the stop right now!`
              : lang === 'tc'
              ? `鬧鐘提醒：${route} 號巴士${tripLabel}還有 ${targetTrip.minutesUntil} 分鐘到達，請準備！`
              : `Alarm: Bus ${route} ${tripLabel} arrives in ${targetTrip.minutesUntil} minutes!`;

          soundManager.speakETA(voiceText, lang);
        }
      }
    },
    [alarm, route, lang]
  );

  // Check alarm whenever ETAs change
  useEffect(() => {
    if (etas.length > 0) {
      checkAlarmTrigger(etas);
    }
  }, [etas, checkAlarmTrigger]);

  // Auto-refresh countdown timer (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchArrivalTimes(true);
          return 20;
        }
        return prev - 1;
      });

      // Also periodically check alarm in case minutes ticked down
      if (etas.length > 0) {
        checkAlarmTrigger(etas);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchArrivalTimes, checkAlarmTrigger, etas]);

  // Wake Lock handler
  const toggleWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      showToast(
        lang === 'tc'
          ? '您的瀏覽器不支援螢幕常亮功能（Screen Wake Lock API）'
          : 'Screen Wake Lock API is not supported on this browser',
        'warn'
      );
      return;
    }

    try {
      if (isWakeLockActive && wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
        setIsWakeLockActive(false);
        showToast(
          lang === 'tc' ? '已關閉螢幕防待機模式' : 'Screen Wake Lock turned off',
          'info'
        );
      } else {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        setIsWakeLockActive(true);
        showToast(
          lang === 'tc'
            ? '✅ 螢幕防待機已開啟！螢幕將保持長亮不休眠'
            : '✅ Screen Wake Lock active! Screen will stay on',
          'success'
        );
        sentinel.addEventListener('release', () => {
          setIsWakeLockActive(false);
          wakeLockSentinelRef.current = null;
        });
      }
    } catch (err: any) {
      console.warn('Wake lock error:', err);
      setIsWakeLockActive(false);
      showToast(
        lang === 'tc'
          ? 'ℹ️ 內嵌預覽視窗被瀏覽器安全政策限制常亮。在獨立分頁或已部署的 GitHub Pages 上打開即可完美生效！'
          : 'ℹ️ Wake Lock restricted by preview iframe security. Works in standalone browser tab or GitHub Pages!',
        'info'
      );
    }
  };

  // Fullscreen handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        showToast(
          lang === 'tc' ? '已進入全螢幕模式' : 'Entered fullscreen mode',
          'success'
        );
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        showToast(
          lang === 'tc' ? '已退出全螢幕' : 'Exited fullscreen mode',
          'info'
        );
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
      showToast(
        lang === 'tc'
          ? 'ℹ️ 內嵌視窗被瀏覽器限制全螢幕。請在獨立分頁或 GitHub Pages 網址直接打開，即可一鍵全螢幕！'
          : 'ℹ️ Fullscreen restricted in embedded preview frame. Open in a standalone tab or GitHub Pages!',
        'info'
      );
    }
  };

  // Sound toggle with immediate chime feedback
  const handleToggleAudio = () => {
    const willEnable = !audioAlertEnabled;
    onToggleAudioAlert();
    if (willEnable) {
      soundManager.playChime();
      showToast(
        lang === 'tc'
          ? '🔊 到站語音提示已開啟！(當巴士還有 3 分鐘時發出提示音及宣讀)'
          : '🔊 Arrival audio alerts enabled! (Chimes & speaks at <= 3 min)',
        'success'
      );
    } else {
      showToast(
        lang === 'tc' ? '🔇 已關閉語音提示 (靜音模式)' : '🔇 Audio alert muted',
        'info'
      );
    }
  };

  // Theme cycle with toast feedback
  const handleCycleTheme = () => {
    const themes: DisplayTheme[] = ['led-amber', 'cyber-dark', 'bus-stop-green', 'clean-light'];
    const themeNames: Record<DisplayTheme, { tc: string; en: string }> = {
      'led-amber': { tc: '經典琥珀 LED 點陣', en: 'Classic Amber LED' },
      'cyber-dark': { tc: '賽博黑金高對比', en: 'Cyber Dark' },
      'bus-stop-green': { tc: '巴士站牌綠光', en: 'Bus Stop Green' },
      'clean-light': { tc: '明亮日間白底', en: 'Clean Light' },
    };
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    onChangeTheme(nextTheme);
    showToast(
      lang === 'tc'
        ? `🎨 切換色彩主題：${themeNames[nextTheme].tc}`
        : `🎨 Theme switched: ${themeNames[nextTheme].en}`,
      'info'
    );
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Alarm Handlers
  const handleOpenAlarmModal = (tripIndex: number) => {
    setAlarmTargetIndex(tripIndex);
    setIsAlarmModalOpen(true);
  };

  const handleSetAlarm = (newAlarm: BusAlarm) => {
    setAlarm(newAlarm);
    saveStoredAlarm(newAlarm);
  };

  const handleCancelAlarm = () => {
    soundManager.stopAlarm();
    setAlarm(null);
    saveStoredAlarm(null);
    setIsAlarmRinging(false);
  };

  const handleDismissAlarm = () => {
    soundManager.stopAlarm();
    setIsAlarmRinging(false);
  };

  const handleSnoozeAlarm = (additionalMinutes: number) => {
    soundManager.stopAlarm();
    setIsAlarmRinging(false);
    if (alarm) {
      const currentRemaining =
        etas[alarm.tripIndex]?.minutesUntil ?? alarm.alertMinutes;
      const newAlertMins = Math.max(1, currentRemaining - additionalMinutes);
      const updatedAlarm: BusAlarm = {
        ...alarm,
        alertMinutes: newAlertMins,
        triggered: false,
      };
      setAlarm(updatedAlarm);
      saveStoredAlarm(updatedAlarm);
    }
  };

  // Calculate safely selected active ETA
  const activeTripIndex =
    etas.length > 0 ? Math.min(selectedTripIndex, etas.length - 1) : 0;
  const activeEta = etas[activeTripIndex];

  // Format exact arrival clock time (e.g. 19:42)
  const formatClockTime = (etaIso: string | null | undefined) => {
    if (!etaIso) return '';
    try {
      const d = new Date(etaIso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  // Theme color styles
  const isLight = theme === 'clean-light';

  // Check if alarm is currently configured on this active trip
  const isAlarmForActiveTrip =
    alarm &&
    alarm.enabled &&
    alarm.route === route &&
    alarm.tripIndex === activeTripIndex;

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-300 relative select-none ${
        theme === 'led-amber'
          ? 'theme-led-amber matrix-grid'
          : theme === 'cyber-dark'
          ? 'theme-cyber-dark'
          : theme === 'bus-stop-green'
          ? 'theme-bus-stop-green matrix-grid'
          : 'theme-clean-light'
      }`}
    >
      {/* TOP HEADER CONTROLS BAR */}
      <header
        className={`w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b backdrop-blur-md z-20 ${
          isLight
            ? 'bg-white/90 border-slate-200 text-slate-800'
            : 'bg-black/60 border-neutral-800 text-neutral-200'
        }`}
      >
        {/* Left: Quick Switch Route & Favorites */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSelector}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
              isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
            }`}
          >
            <span>🚌</span>
            <span>{lang === 'tc' ? '換路線 / 站點' : 'Change Route / Stop'}</span>
          </button>

          <button
            onClick={onOpenFavorites}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
              isLight
                ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">{lang === 'tc' ? '常用收藏' : 'Favorites'}</span>
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {favoritesCount}
            </span>
          </button>
        </div>

        {/* Right: Actions & Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ALARM BUTTON IN HEADER */}
          <button
            onClick={() => handleOpenAlarmModal(activeTripIndex)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              alarm && alarm.enabled && !alarm.triggered
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                : isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title={
              alarm && alarm.enabled
                ? lang === 'tc'
                  ? `已設定第 ${alarm.tripIndex + 1} 班車還有 ${alarm.alertMinutes} 分鐘時提醒`
                  : `Alarm active for trip #${alarm.tripIndex + 1}`
                : lang === 'tc'
                ? '設定到站鬧鐘提醒'
                : 'Set arrival alarm'
            }
          >
            {alarm && alarm.enabled && !alarm.triggered ? (
              <BellRing className="w-3.5 h-3.5 animate-wiggle" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {alarm && alarm.enabled && !alarm.triggered
                ? lang === 'tc'
                  ? `鬧鐘: 第${alarm.tripIndex + 1}班 (${alarm.alertMinutes}分前)`
                  : `Alarm #${alarm.tripIndex + 1} (${alarm.alertMinutes}m)`
                : lang === 'tc'
                ? '鬧鐘提醒'
                : 'Alarm'}
            </span>
          </button>

          {/* Keep Screen Awake / WakeLock */}
          <button
            onClick={toggleWakeLock}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isWakeLockActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : isLight
                ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
            title={
              lang === 'tc'
                ? isWakeLockActive
                  ? '螢幕長亮已開啟 (防止待機)'
                  : '開啟螢幕長亮'
                : isWakeLockActive
                ? 'Screen awake active'
                : 'Keep screen awake'
            }
          >
            <Zap className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span className="hidden md:inline">
              {isWakeLockActive
                ? lang === 'tc'
                  ? '長亮中'
                  : 'Awake'
                : lang === 'tc'
                ? '防待機'
                : 'Keep On'}
            </span>
          </button>

          {/* Audio Chime alert toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
              audioAlertEnabled
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : isLight
                ? 'border-slate-300 text-slate-500 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
            title={
              lang === 'tc'
                ? audioAlertEnabled
                  ? '到站語音提示已啟用 (點擊靜音)'
                  : '開啟到站提示音 (<=3分鐘提示)'
                : 'Toggle arrival audio announcement'
            }
          >
            {audioAlertEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {audioAlertEnabled ? (lang === 'tc' ? '語音' : 'Sound') : (lang === 'tc' ? '靜音' : 'Mute')}
            </span>
          </button>

          {/* Theme Switcher Cycle */}
          <button
            onClick={handleCycleTheme}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title={lang === 'tc' ? '切換螢幕色彩風格' : 'Change display theme'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {lang === 'tc' ? 'EN' : '繁中'}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title={lang === 'tc' ? '全螢幕模式' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Feature Guide / Help button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-colors text-xs font-bold ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
            title={lang === 'tc' ? '頂部各按鈕功能說明' : 'Top Bar Features Guide'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">{lang === 'tc' ? '說明' : 'Help'}</span>
          </button>

          {/* GitHub Pages free hosting guide */}
          <button
            onClick={onOpenGithubGuide}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title={lang === 'tc' ? 'GitHub Pages 免費部署說明' : 'GitHub Pages guide'}
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </header>

      {/* MAIN GLANCEABLE DISPLAY SECTION */}
      <main className="flex-1 flex flex-col justify-between items-center px-4 sm:px-8 py-3 max-w-7xl mx-auto w-full z-10">
        {/* ROUTE & DESTINATION BOARD */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            {/* Operator & Route Badge */}
            <div
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-mono font-black text-2xl sm:text-4xl lg:text-5xl tracking-tight shadow-xl flex items-center justify-center shrink-0 border-2 ${
                company === 'kmb'
                  ? 'bg-red-600 border-red-400 text-white shadow-red-950/60'
                  : company === 'ctb'
                  ? 'bg-yellow-400 border-yellow-300 text-neutral-950 shadow-yellow-950/40'
                  : 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/60'
              }`}
            >
              {route}
            </div>

            {/* Destination & Direction */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wider text-amber-400/90 uppercase mb-0.5">
                <Compass className="w-3.5 h-3.5" />
                <span>{lang === 'tc' ? '行車方向' : 'Towards'}</span>
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white truncate tracking-tight">
                {lang === 'tc' ? dest_tc : dest_en}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 truncate">
                {lang === 'tc' ? dest_en : dest_tc}
              </p>
            </div>
          </div>

          {/* Current Stop, Alarm pill, and Favorite Pin */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
            <div className="flex items-center gap-2.5 text-left md:text-right">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 md:order-2" />
              <div>
                <div className="flex items-center md:justify-end gap-1.5 text-xs text-neutral-400 font-medium">
                  <span>
                    {lang === 'tc' ? '候車站點' : 'Bus Stop'} #{stop.seq}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
                  {lang === 'tc' ? stop.name_tc : stop.name_en}
                </h2>
              </div>
            </div>

            {/* Favorite Star Button */}
            <button
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
              }`}
              title={
                isFavorite
                  ? lang === 'tc'
                    ? '已儲存為常用站點 (點擊取消)'
                    : 'Saved to favorites'
                  : lang === 'tc'
                  ? '儲存為常用站點'
                  : 'Add to favorites'
              }
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* TRIP SELECTOR TABS BAR (Allows selecting subsequent departures) */}
        {etas.length > 1 && (
          <div className="w-full pt-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold tracking-wider uppercase text-neutral-400">
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'tc' ? '選擇要最大化放大的班次：' : 'Select Departure to Maximize:'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 p-1 rounded-2xl bg-neutral-900/90 border border-neutral-800 max-w-2xl w-full">
              {etas.map((item, idx) => {
                const isSelected = activeTripIndex === idx;
                const hasAlarm =
                  alarm &&
                  alarm.enabled &&
                  alarm.route === route &&
                  alarm.tripIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTripIndex(idx)}
                    className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
                        #{idx + 1}
                      </span>
                      <span>
                        {idx === 0
                          ? lang === 'tc'
                            ? '最快到達'
                            : '1st Bus'
                          : idx === 1
                          ? lang === 'tc'
                            ? '下班車'
                            : '2nd Bus'
                          : lang === 'tc'
                          ? `第 ${idx + 1} 班`
                          : `Trip #${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasAlarm && (
                        <BellRing
                          className={`w-3 h-3 ${isSelected ? 'text-neutral-950 animate-bounce' : 'text-amber-400'}`}
                        />
                      )}
                      <span className="font-black">
                        {item.minutesUntil !== null
                          ? item.minutesUntil <= 0
                            ? lang === 'tc'
                              ? '即將'
                              : 'Now'
                            : `${item.minutesUntil}m`
                          : '--'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GIANT ARRIVAL NUMBER SECTION ("AS BIG AS POSSIBLE") */}
        <div className="my-auto py-4 sm:py-8 flex flex-col items-center justify-center text-center w-full">
          {isLoading && etas.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-amber-400">
              <RefreshCw className="w-16 h-16 animate-spin" />
              <p className="text-base font-semibold tracking-wider uppercase font-mono">
                {lang === 'tc' ? '正在查詢實時到站時間...' : 'Fetching Live Hong Kong Bus ETA...'}
              </p>
            </div>
          ) : error && etas.length === 0 ? (
            <div className="py-16 px-6 max-w-md bg-red-950/30 border border-red-800/60 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">
                {lang === 'tc' ? '未能獲取到站時間' : 'Failed to load ETA'}
              </h3>
              <p className="text-xs text-neutral-300">{error}</p>
              <button
                onClick={() => fetchArrivalTimes()}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {lang === 'tc' ? '重試連接' : 'Retry'}
              </button>
            </div>
          ) : !activeEta || activeEta.minutesUntil === null ? (
            <div className="py-12 flex flex-col items-center space-y-3">
              <div className="font-mono text-5xl sm:text-7xl font-black text-neutral-500">
                {lang === 'tc' ? '暫無班次' : 'NO BUS'}
              </div>
              <p className="text-sm text-neutral-400 max-w-sm">
                {lang === 'tc'
                  ? '目前沒有即時預計班次或此路線已過服務時間'
                  : 'No scheduled trips currently available for this route/stop'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              {/* If selected trip is NOT the first bus, show prominent banner */}
              {activeTripIndex > 0 && (
                <div className="mb-2 sm:mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold shadow-lg animate-fade-in">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {lang === 'tc'
                      ? `已放大顯示：第 ${activeTripIndex + 1} 班車（非最快到站）`
                      : `Viewing Departure #${activeTripIndex + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTripIndex(0)}
                    className="ml-2 px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 text-xs font-black hover:bg-amber-400 transition-colors"
                  >
                    {lang === 'tc' ? '↩ 回最快班次' : '↩ 1st Bus'}
                  </button>
                </div>
              )}

              {/* Giant Arrival Display Block */}
              {activeEta.minutesUntil <= 0 ? (
                /* ARRIVING NOW */
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-pulse text-sm sm:text-base font-bold uppercase tracking-wider">
                    <Radio className="w-4 h-4 animate-ping" />
                    <span>
                      {lang === 'tc'
                        ? `第 ${activeTripIndex + 1} 班車 · 即將抵達站點`
                        : `TRIP #${activeTripIndex + 1} ARRIVING AT STOP`}
                    </span>
                  </div>
                  <div className="font-mono font-black text-6xl sm:text-8xl md:text-9xl lg:text-[14rem] tracking-tighter leading-none text-emerald-400 led-glow">
                    {lang === 'tc' ? '即將到站' : 'ARRIVING'}
                  </div>
                </div>
              ) : (
                /* MINUTES NUMBER AS BIG AS POSSIBLE */
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-baseline justify-center gap-2 sm:gap-4">
                    <span className="font-mono font-black text-8xl sm:text-[14rem] md:text-[18rem] lg:text-[22rem] tracking-tighter leading-none select-none led-glow">
                      {activeEta.minutesUntil}
                    </span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-wide uppercase opacity-90">
                        {lang === 'tc' ? '分鐘' : 'MIN'}
                      </span>
                      <span className="text-xs sm:text-sm lg:text-base font-mono text-neutral-400 font-semibold mt-1">
                        ~{formatClockTime(activeEta.eta)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status, Remarks, and Alarm Quick Trigger */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-4 text-xs sm:text-sm font-semibold">
                {/* Trip Sequence Badge */}
                <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                  {lang === 'tc' ? `第 ${activeTripIndex + 1} 班車` : `Trip #${activeTripIndex + 1}`}
                </span>

                {/* Live vs Scheduled Badge */}
                <span
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                    activeEta.isScheduled
                      ? 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {activeEta.isScheduled ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {activeEta.rmk_tc
                      ? lang === 'tc'
                        ? activeEta.rmk_tc
                        : activeEta.rmk_en || activeEta.rmk_tc
                      : activeEta.isScheduled
                      ? lang === 'tc'
                        ? '原定班次'
                        : 'Scheduled'
                      : lang === 'tc'
                      ? '實時衛星定位班次'
                      : 'Real-time GPS Tracked'}
                  </span>
                </span>

                {/* Wheelchair accessible indicator */}
                {activeEta.wheelchair && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-400">
                    <Accessibility className="w-3.5 h-3.5" />
                    <span>{lang === 'tc' ? '無障礙低地台' : 'Accessible'}</span>
                  </span>
                )}

                {/* DEDICATED ALARM BUTTON FOR THIS SELECTED TRIP */}
                <button
                  type="button"
                  onClick={() => handleOpenAlarmModal(activeTripIndex)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isAlarmForActiveTrip && !alarm?.triggered
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-neutral-900/90 border-neutral-700 text-amber-400 hover:bg-neutral-800 hover:border-amber-400/60'
                  }`}
                >
                  {isAlarmForActiveTrip && !alarm?.triggered ? (
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isAlarmForActiveTrip && !alarm?.triggered
                      ? lang === 'tc'
                        ? `⏰ 鬧鐘已設定 (剩 ${alarm.alertMinutes} 分鐘響)`
                        : `⏰ Alarm Set (${alarm.alertMinutes}m)`
                      : lang === 'tc'
                      ? `⏰ 為此班次設定鬧鐘`
                      : `⏰ Set Alarm for Trip #${activeTripIndex + 1}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ALL UPCOMING DEPARTURES CARDS (Clickable to switch & with alarm shortcuts) */}
        {etas.length > 0 && (
          <div className="w-full max-w-5xl py-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'tc' ? '所有預計班次列表' : 'All Upcoming Trips'}</span>
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {lang === 'tc' ? '點擊班次卡片即可放大顯示' : 'Click any card to maximize on big screen'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {etas.map((item, idx) => {
                const isSelected = activeTripIndex === idx;
                const tripAlarm =
                  alarm &&
                  alarm.enabled &&
                  alarm.route === route &&
                  alarm.tripIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTripIndex(idx)}
                    className={`flex flex-col justify-between p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
                        : 'bg-neutral-900/80 border-neutral-800 text-white hover:border-neutral-700'
                    }`}
                  >
                    {/* Top Row: Trip Badge & Maximized indicator */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-neutral-300">
                          #{idx + 1}
                        </span>
                        <span className="text-xs text-neutral-400 font-medium">
                          {idx === 0
                            ? lang === 'tc'
                              ? '最快班次'
                              : '1st Bus'
                            : idx === 1
                            ? lang === 'tc'
                              ? '下班車'
                              : '2nd Bus'
                            : lang === 'tc'
                            ? `第 ${idx + 1} 班`
                            : `Trip #${idx + 1}`}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'tc' ? '大螢幕顯示中' : 'Maximized'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 hover:text-amber-400">
                          {lang === 'tc' ? '點擊放大 ➔' : 'Click to show ➔'}
                        </span>
                      )}
                    </div>

                    {/* Middle: Big Countdown Minutes & Clock */}
                    <div className="flex items-baseline justify-between py-1">
                      <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                        {item.minutesUntil !== null
                          ? item.minutesUntil <= 0
                            ? lang === 'tc'
                              ? '即將抵達'
                              : 'Arriving'
                            : `${item.minutesUntil} ${lang === 'tc' ? '分鐘' : 'min'}`
                          : '--'}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono font-semibold">
                        ~{formatClockTime(item.eta)}
                      </span>
                    </div>

                    {/* Bottom: Remarks and Quick Alarm Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                      <span className="truncate max-w-[120px]">
                        {item.rmk_tc
                          ? lang === 'tc'
                            ? item.rmk_tc
                            : item.rmk_en
                          : item.isScheduled
                          ? lang === 'tc'
                            ? '預定班次'
                            : 'Scheduled'
                          : lang === 'tc'
                          ? '實時班次'
                          : 'Real-time'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAlarmModal(idx);
                        }}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          tripAlarm && !alarm?.triggered
                            ? 'bg-amber-500 text-neutral-950 border-amber-400'
                            : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                        title={lang === 'tc' ? '為此班次設定鬧鐘' : 'Set alarm for this departure'}
                      >
                        <Bell className="w-3 h-3" />
                        <span>
                          {tripAlarm && !alarm?.triggered
                            ? `${alarm.alertMinutes}m`
                            : lang === 'tc'
                            ? '鬧鐘'
                            : 'Alarm'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER & REFRESH STATUS BAR */}
      <footer
        className={`w-full px-4 sm:px-6 py-2.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium z-20 ${
          isLight
            ? 'bg-white/90 border-slate-200 text-slate-600'
            : 'bg-black/60 border-neutral-800 text-neutral-400'
        }`}
      >
        {/* Left: Last updated timestamp and status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            {lang === 'tc' ? '最後更新:' : 'Last updated:'}{' '}
            <strong className="font-mono text-neutral-200">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </strong>
          </span>
          <span className="text-neutral-500">·</span>
          <span>
            {lang === 'tc' ? '香港政府運輸署開放數據' : 'HK Transport Open Data'}
          </span>
        </div>

        {/* Right: Auto-refresh countdown & Manual trigger */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-400">
            {lang === 'tc' ? `${secondsUntilRefresh} 秒後自動更新` : `Auto-refresh in ${secondsUntilRefresh}s`}
          </span>

          <button
            onClick={() => fetchArrivalTimes(false)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold transition-all ${
              isLight
                ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{lang === 'tc' ? '立即更新' : 'Refresh'}</span>
          </button>
        </div>
      </footer>

      {/* FLOATING TOAST FEEDBACK NOTIFICATION */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto px-4 py-2.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fade-in backdrop-blur-md bg-neutral-900/95 border-amber-500/50 text-neutral-100">
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-white p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* TOP BAR & FEATURES HELP GUIDE MODAL */}
      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        lang={lang}
      />

      {/* ALARM CONFIGURATION MODAL */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        route={route}
        stopName={lang === 'tc' ? stop.name_tc : stop.name_en}
        destName={lang === 'tc' ? dest_tc : dest_en}
        selectedTripIndex={alarmTargetIndex}
        selectedEta={etas[alarmTargetIndex]}
        activeAlarm={
          alarm && alarm.route === route && alarm.tripIndex === alarmTargetIndex
            ? alarm
            : null
        }
        onSetAlarm={handleSetAlarm}
        onCancelAlarm={handleCancelAlarm}
        lang={lang}
      />

      {/* ACTIVE RINGING ALARM OVERLAY */}
      <AlarmRingingOverlay
        isOpen={isAlarmRinging}
        alarm={alarm}
        eta={alarm ? etas[alarm.tripIndex] : undefined}
        route={route}
        stopName={lang === 'tc' ? stop.name_tc : stop.name_en}
        destName={lang === 'tc' ? dest_tc : dest_en}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
        lang={lang}
      />
    </div>
  );
};
