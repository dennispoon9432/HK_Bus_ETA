import React from 'react';
import { Language } from '../types/bus';
import {
  X,
  HelpCircle,
  Bus,
  Star,
  BellRing,
  Zap,
  Volume2,
  Sun,
  Languages,
  Maximize,
  Globe,
  CheckCircle2,
  Tv
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: <span className="text-xl">🚌</span>,
      name_tc: '換路線 / 站點 (Change Route & Stop)',
      name_en: 'Change Route & Stop',
      desc_tc:
        '即時搜尋並切換九巴 (KMB)、城巴 (Citybus) 及新大嶼山巴士 (NLB) 全港路線，自由選取搭乘分站。',
      desc_en:
        'Search and switch any bus route across KMB, Citybus, and NLB. Pick your boarding stop anytime.',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    },
    {
      icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
      name_tc: '常用收藏 (Favorites)',
      name_en: 'Favorites Bookmark',
      desc_tc:
        '把每天上班、上學或回家最常用的巴士站加入書籤，開啟 App 即可一鍵快速切換，無需每次重新搜尋。',
      desc_en:
        'Save frequent routes and stops. Switch instantly with one tap without searching again.',
      color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    },
    {
      icon: <BellRing className="w-5 h-5 text-amber-400" />,
      name_tc: '到站鬧鐘提醒 (Arrival Alarm)',
      name_en: 'Arrival Alarm Reminder',
      desc_tc:
        '為第 1 班車或之後的班次（如第 2 班）設定到站前 X 分鐘鬧鐘（例如出門前 5 分鐘）。倒數歸零時會觸發全螢幕警告、持續響鬧與廣東話/英語語音宣讀！',
      desc_en:
        'Set an alarm for the 1st or subsequent trips (e.g. 5 mins before arrival). Rings loudly with voice announcement and snooze options.',
      color: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      name_tc: '防待機 / 螢幕長亮 (Keep Screen Awake)',
      name_en: 'Keep Screen Awake (Wake Lock)',
      desc_tc:
        '調用瀏覽器 Screen Wake Lock API，防止手機、平板或電腦螢幕變暗或進入睡眠待機，最適合放在玄關或書桌作為常亮實時巴士顯示屏。（註：若在內嵌預覽視窗被瀏覽器安全政策攔截，直接在獨立瀏覽器分頁或部署後的網站打開即可完美生效）',
      desc_en:
        'Keeps your tablet or phone screen on without sleeping. Perfect for desk/wall displays. (Note: browser iframe policies may restrict it in preview, but it works in a regular browser tab).',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    },
    {
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
      name_tc: '語音提醒 (Arrival Audio Chime)',
      name_en: 'Arrival Audio & Voice',
      desc_tc:
        '開啟後，當巴士抵達剩餘 3 分鐘或即將到站時，系統會自動播放提示鐘聲並透過語音宣讀路線與剩餘時間。點擊按鈕時會播放測試提示音確認已啟動。',
      desc_en:
        'Plays a chime and speaks arrival announcements when bus is within 3 minutes of arrival. Clicking it plays a test sound.',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    },
    {
      icon: <Sun className="w-5 h-5 text-neutral-300" />,
      name_tc: '色彩風格切換 (Themes)',
      name_en: 'Display Themes',
      desc_tc:
        '循環切換 4 種顯示主題：經典香港巴士琥珀 LED 點陣燈箱、賽博藍黑高對比、站牌綠光，以及明亮日間模式。',
      desc_en:
        'Cycle between 4 themes: Classic HK Amber LED, Cyber Dark, Bus Stop Green, and Clean Light.',
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    },
    {
      icon: <Languages className="w-5 h-5 text-neutral-300" />,
      name_tc: '語言切換 (Language Toggle)',
      name_en: 'Language Toggle (TC / EN)',
      desc_tc:
        '即時切換繁體中文與英文介面，路線終點站、巴士站名及語音廣播均同步切換。',
      desc_en:
        'Instantly switch between Traditional Chinese and English for all bus stops, destinations, and voice announcements.',
      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
    },
    {
      icon: <Maximize className="w-5 h-5 text-neutral-300" />,
      name_tc: '全螢幕模式 (Fullscreen)',
      name_en: 'Fullscreen Mode',
      desc_tc:
        '一鍵隱藏所有瀏覽器工具列，讓巨大數字填滿整個螢幕。（若在預覽內嵌視窗被阻擋，在新分頁或 GitHub Pages 網址直接開啟即可全螢幕）。',
      desc_en:
        'Maximize the giant numbers to fill your entire display. (In embedded preview frames, open in standalone tab for full browser support).',
      color: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
    },
    {
      icon: <Globe className="w-5 h-5 text-amber-400" />,
      name_tc: 'GitHub Pages 免費部署 (Free Hosting Guide)',
      name_en: 'Deploy to GitHub Pages',
      desc_tc:
        '教學如何將此專案免費託管至你的專屬網址（例如 username.github.io/HK_Bus_ETA），零伺服器費用，全家人都可以用手機或舊 iPad 訪問。',
      desc_en:
        'Step-by-step guide to deploy this app free of charge to your own GitHub Pages domain.',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {lang === 'tc' ? '頂部功能按鈕詳細說明' : 'Top Bar Buttons & Features Guide'}
              </h2>
              <p className="text-xs text-neutral-400">
                {lang === 'tc'
                  ? '各按鈕用途與為什麼在預覽視窗按某些按鈕看似沒反應的解答'
                  : 'Purpose of each button and browser permission guidelines'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note about why some buttons may not trigger inside preview iframe */}
        <div className="px-5 sm:px-6 pt-4 pb-2 space-y-2.5">
          {/* App Icon & Add to Home Screen card */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3.5">
            <img
              src="apple-touch-icon.png"
              alt="HK Bus ETA App Icon"
              className="w-14 h-14 rounded-2xl shadow-lg border border-amber-500/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {lang === 'tc' ? '手機桌面 App 圖示' : 'Mobile Home Screen Icon'}
                </span>
                <span className="text-xs text-neutral-400 font-mono">HK · ETA · 雙層巴士</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {lang === 'tc'
                  ? '📱 加到主畫面：iPhone (Safari 點下方「分享」按鈕 ➔ 選擇「加入主畫面」)；Android (Chrome 點右上角「⋮」 ➔ 選擇「安裝應用程式」或「加至主畫面」)。'
                  : '📱 Add to Home Screen: iPhone (Safari tap Share ➔ "Add to Home Screen"); Android (Chrome tap ⋮ ➔ "Install app" or "Add to Home screen").'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200/90 flex items-start gap-2.5">
            <Tv className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{lang === 'tc' ? '💡 為什麼有些按鈕在預覽按了看似沒反應？' : '💡 Why did some buttons feel inactive in preview?'}</strong>
              <p className="mt-0.5 text-neutral-300">
                {lang === 'tc'
                  ? '「螢幕常亮」與「全螢幕」受瀏覽器安全限制，在開發預覽內嵌視窗會被阻擋。將網址在手機瀏覽器直接打開或加入主畫面後即可 100% 正常運作！'
                  : 'Screen Wake Lock and Fullscreen are restricted by preview iframes. Open directly on your phone or Add to Home Screen for full functionality!'}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 space-y-3">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-start gap-3.5 hover:border-neutral-700 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'tc' ? item.name_tc : item.name_en}
                  </h3>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {lang === 'tc' ? item.desc_tc : item.desc_en}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {lang === 'tc' ? '香港巴士實時到站看板 · 專為家用常亮設計' : 'HK Bus ETA Live Display'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors"
          >
            {lang === 'tc' ? '明白，返回看板' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
