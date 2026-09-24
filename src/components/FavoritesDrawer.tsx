import React, { useState, useEffect } from 'react';
import { FavoriteItem, Language, EtaItem } from '../types/bus';
import { getETA } from '../services/busApi';
import {
  X,
  Star,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  Clock,
  ArrowRight,
  RefreshCw,
  Bus,
  Plus
} from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  currentFavId?: string;
  onSelectFavorite: (fav: FavoriteItem) => void;
  onDeleteFavorite: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onImportFavorites: (imported: FavoriteItem[]) => void;
  onOpenSelector: () => void;
  lang: Language;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  currentFavId,
  onSelectFavorite,
  onDeleteFavorite,
  onUpdateLabel,
  onImportFavorites,
  onOpenSelector,
  lang,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [liveEtas, setLiveEtas] = useState<{ [favId: string]: { nextMins: number | null; rmk: string; loading: boolean } }>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Fetch quick mini ETAs for all favorites when drawer opens
  useEffect(() => {
    if (!isOpen || favorites.length === 0) return;
    refreshAllEtas();
  }, [isOpen, favorites]);

  const refreshAllEtas = async () => {
    setIsRefreshingAll(true);
    const newLive: { [favId: string]: { nextMins: number | null; rmk: string; loading: boolean } } = {};

    favorites.forEach((f) => {
      newLive[f.id] = { nextMins: null, rmk: '', loading: true };
    });
    setLiveEtas({ ...newLive });

    await Promise.all(
      favorites.map(async (fav) => {
        try {
          const list = await getETA(
            fav.company,
            fav.stopId,
            fav.route,
            fav.serviceType,
            fav.bound,
            fav.nlbRouteId
          );
          const first = list[0];
          newLive[fav.id] = {
            nextMins: first ? first.minutesUntil : null,
            rmk: first ? (lang === 'tc' ? first.rmk_tc : first.rmk_en) : '',
            loading: false,
          };
        } catch (e) {
          newLive[fav.id] = {
            nextMins: null,
            rmk: lang === 'tc' ? '無資料' : 'No data',
            loading: false,
          };
        }
      })
    );

    setLiveEtas({ ...newLive });
    setIsRefreshingAll(false);
  };

  // Export favorites to JSON file
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hk_bus_favorites_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import favorites from JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportFavorites(parsed);
          alert(lang === 'tc' ? `已成功匯入 ${parsed.length} 個常用收藏!` : `Successfully imported ${parsed.length} favorites!`);
        }
      } catch (err) {
        alert(lang === 'tc' ? '匯入檔案格式錯誤' : 'Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartEdit = (f: FavoriteItem) => {
    setEditingId(f.id);
    setEditingText(f.customLabel || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateLabel(id, editingText.trim());
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col h-full text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">
                {lang === 'tc' ? '常用巴士站收藏' : 'Favorite Stops'}
              </h3>
              <p className="text-xs text-neutral-400">
                {favorites.length} {lang === 'tc' ? '個已儲存站點' : 'saved stops'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAllEtas}
              disabled={isRefreshingAll || favorites.length === 0}
              className="p-2 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors"
              title={lang === 'tc' ? '重新載入即時到站時間' : 'Refresh all ETAs'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar (Add, Export, Import) */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-950/50 border-b border-neutral-800 text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenSelector();
            }}
            className="flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'tc' ? '新增收藏站點' : 'Add New Stop'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={favorites.length === 0}
              className="flex items-center gap-1 text-neutral-400 hover:text-white disabled:opacity-40 transition-colors"
              title={lang === 'tc' ? '匯出備份 JSON' : 'Export favorites'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'tc' ? '匯出' : 'Export'}</span>
            </button>
            <label className="flex items-center gap-1 text-neutral-400 hover:text-white cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'tc' ? '匯入' : 'Import'}</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Favorites list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
                <Star className="w-7 h-7 text-neutral-500" />
              </div>
              <h4 className="text-base font-bold text-neutral-200 mb-1">
                {lang === 'tc' ? '暫無儲存的常用站點' : 'No favorites yet'}
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs mb-4">
                {lang === 'tc'
                  ? '在任何路線站點的超大螢幕畫面上，點擊星星圖標即可將它儲存到這裡，隨時一鍵查看！'
                  : 'Click the star button on any bus stop arrival screen to pin it here for quick glance.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenSelector();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors"
              >
                {lang === 'tc' ? '立即選擇第一條路線' : 'Select a Bus Route Now'}
              </button>
            </div>
          ) : (
            favorites.map((fav) => {
              const isCurrent = currentFavId === fav.id;
              const live = liveEtas[fav.id];
              const isKmb = fav.company === 'kmb';
              const isCtb = fav.company === 'ctb';

              return (
                <div
                  key={fav.id}
                  className={`group relative rounded-xl border p-3.5 transition-all ${
                    isCurrent
                      ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left click area to activate */}
                    <div
                      onClick={() => {
                        onSelectFavorite(fav);
                        onClose();
                      }}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
                            isKmb
                              ? 'bg-red-600 text-white'
                              : isCtb
                              ? 'bg-yellow-400 text-neutral-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {fav.route}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                          {fav.company.toUpperCase()}
                        </span>
                        {fav.customLabel ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate max-w-[120px]">
                            {fav.customLabel}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {lang === 'tc' ? fav.stopName_tc : fav.stopName_en}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {lang === 'tc'
                          ? fav.orig_tc
                            ? `行車方向：${fav.orig_tc} > ${fav.dest_tc}`
                            : `往: ${fav.dest_tc}`
                          : fav.orig_en
                          ? `Direction: ${fav.orig_en} > ${fav.dest_en}`
                          : `To: ${fav.dest_en}`}
                      </p>
                    </div>

                    {/* Right: Live ETA pill */}
                    <div
                      onClick={() => {
                        onSelectFavorite(fav);
                        onClose();
                      }}
                      className="cursor-pointer text-right shrink-0"
                    >
                      {live?.loading ? (
                        <span className="text-xs text-neutral-500 font-mono animate-pulse">
                          ...
                        </span>
                      ) : live?.nextMins !== null && live?.nextMins !== undefined ? (
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-lg font-mono font-black tracking-tight leading-tight ${
                              live.nextMins <= 2
                                ? 'text-emerald-400 animate-pulse'
                                : 'text-amber-400'
                            }`}
                          >
                            {live.nextMins <= 0
                              ? lang === 'tc'
                                ? '即將到'
                                : 'Arriving'
                              : `${live.nextMins} ${lang === 'tc' ? '分鐘' : 'min'}`}
                          </span>
                          {live.rmk && (
                            <span className="text-[10px] text-neutral-400 truncate max-w-[80px]">
                              {live.rmk}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500">
                          {lang === 'tc' ? '無到站資料' : 'No ETA'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit label & Delete controls */}
                  {editingId === fav.id ? (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder={lang === 'tc' ? '自訂備註 (例如: 屋企樓下, 公司)' : 'Custom nickname'}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(fav.id)}
                        className="p-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5 font-bold" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                      <button
                        onClick={() => handleStartEdit(fav)}
                        className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{fav.customLabel ? (lang === 'tc' ? '修改備註' : 'Edit label') : (lang === 'tc' ? '新增備註' : 'Add label')}</span>
                      </button>

                      <button
                        onClick={() => onDeleteFavorite(fav.id)}
                        className="flex items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors"
                        title={lang === 'tc' ? '刪除收藏' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{lang === 'tc' ? '移除' : 'Remove'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
