import React, { useState, useEffect, useMemo } from 'react';
import { BusCompany, RouteItem, StopItem, Language } from '../types/bus';
import { getRoutes, getRouteStops } from '../services/busApi';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import {
  Search,
  X,
  MapPin,
  Compass,
  ArrowRight,
  Loader2,
  Navigation,
  ChevronRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface RouteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: {
    company: BusCompany;
    route: string;
    bound: string;
    serviceType: string;
    stop: StopItem;
    dest_tc: string;
    dest_en: string;
    nlbRouteId?: string;
  }) => void;
  lang: Language;
  initialCompany?: BusCompany;
}

export const RouteSelectorModal: React.FC<RouteSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  lang,
  initialCompany = 'kmb',
}) => {
  const [activeCompany, setActiveCompany] = useState<BusCompany>(initialCompany);
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [selectedBound, setSelectedBound] = useState<string>('O');

  const [stops, setStops] = useState<StopItem[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [stopSearch, setStopSearch] = useState('');

  // Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load routes when company changes
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setIsLoadingRoutes(true);
    setSelectedRoute(null);
    setStops([]);

    getRoutes(activeCompany)
      .then((data) => {
        if (!isCancelled) {
          setRoutes(data);
          setIsLoadingRoutes(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
          setIsLoadingRoutes(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeCompany, isOpen]);

  // Request user location on demand
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationError(lang === 'tc' ? '瀏覽器不支援定位' : 'Geolocation not supported');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed', err);
        setLocationError(lang === 'tc' ? '無法獲取位置' : 'Location unavailable');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Group or filter routes
  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return routes.slice(0, 50); // initial top 50
    return routes.filter(
      (r) =>
        r.route.toUpperCase().includes(q) ||
        r.dest_tc.includes(q) ||
        r.dest_en.toUpperCase().includes(q) ||
        r.orig_tc.includes(q) ||
        r.orig_en.toUpperCase().includes(q)
    );
  }, [routes, searchQuery]);

  // Handle route selection -> load directions and stops
  const handleSelectRoute = async (routeItem: RouteItem) => {
    setSelectedRoute(routeItem);
    setSelectedBound(routeItem.bound);
    await loadStops(routeItem.company, routeItem.route, routeItem.bound, routeItem.serviceType, routeItem.nlbRouteId);
  };

  const loadStops = async (
    comp: BusCompany,
    route: string,
    bound: string,
    serviceType = '1',
    nlbRouteId?: string
  ) => {
    setIsLoadingStops(true);
    try {
      const stopList = await getRouteStops(comp, route, bound, serviceType, nlbRouteId);
      setStops(stopList);
    } catch (e) {
      console.error('Failed to load stops', e);
      setStops([]);
    } finally {
      setIsLoadingStops(false);
    }
  };

  // Handle direction switch
  const handleDirectionSwitch = async (newBound: string) => {
    if (!selectedRoute) return;
    setSelectedBound(newBound);
    await loadStops(
      selectedRoute.company,
      selectedRoute.route,
      newBound,
      selectedRoute.serviceType,
      selectedRoute.nlbRouteId
    );
  };

  // Filter stops by text and sort nearest if location exists
  const processedStops = useMemo(() => {
    let list = [...stops];
    if (stopSearch.trim()) {
      const q = stopSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name_tc.toLowerCase().includes(q) ||
          s.name_en.toLowerCase().includes(q) ||
          String(s.seq) === q
      );
    }
    return list.map((s) => {
      let distanceKm: number | null = null;
      if (userLocation && s.lat && s.lng) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng);
      }
      return { ...s, distanceKm };
    });
  }, [stops, stopSearch, userLocation]);

  // Nearest stop
  const nearestStop = useMemo(() => {
    if (!userLocation) return null;
    let closest: (StopItem & { distanceKm?: number | null }) | null = null;
    for (const s of processedStops) {
      if (s.distanceKm !== null && s.distanceKm !== undefined) {
        if (!closest || (closest.distanceKm && s.distanceKm < closest.distanceKm)) {
          closest = s;
        }
      }
    }
    return closest;
  }, [processedStops, userLocation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              🚌
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {lang === 'tc' ? '選擇香港巴士路線' : 'Select HK Bus Route'}
              </h2>
              <p className="text-xs text-neutral-400">
                {selectedRoute
                  ? lang === 'tc'
                    ? `已選路線: ${selectedRoute.route} · 請選擇乘搭巴士站`
                    : `Selected: ${selectedRoute.route} · Choose your bus stop`
                  : lang === 'tc'
                  ? '即時獲取九巴/城巴/嶼巴官方到站數據'
                  : 'Real-time arrival from KMB, Citybus & NLB'}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!selectedRoute ? (
            /* STEP 1: SELECT COMPANY & ROUTE */
            <div className="space-y-5">
              {/* Company Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  {lang === 'tc' ? '1. 選擇巴士營辦商' : '1. Select Bus Operator'}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* KMB */}
                  <button
                    type="button"
                    onClick={() => setActiveCompany('kmb')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      activeCompany === 'kmb'
                        ? 'bg-red-950/70 border-red-500 text-red-100 shadow-lg shadow-red-950/50'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                    <span>{lang === 'tc' ? '九巴 / 龍運' : 'KMB / LWB'}</span>
                  </button>

                  {/* Citybus */}
                  <button
                    type="button"
                    onClick={() => setActiveCompany('ctb')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      activeCompany === 'ctb'
                        ? 'bg-yellow-950/70 border-yellow-400 text-yellow-100 shadow-lg shadow-yellow-950/50'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                    <span>{lang === 'tc' ? '城巴' : 'Citybus'}</span>
                  </button>

                  {/* NLB */}
                  <button
                    type="button"
                    onClick={() => setActiveCompany('nlb')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                      activeCompany === 'nlb'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/50'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span>{lang === 'tc' ? '嶼巴' : 'NLB'}</span>
                  </button>
                </div>
              </div>

              {/* Route Search Input & Quick Keypad */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  {lang === 'tc' ? '2. 輸入或搜尋路線編號' : '2. Search Route Number'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeCompany === 'kmb'
                        ? lang === 'tc'
                          ? '例如: 1A, 104, 968, 68X, 290A...'
                          : 'e.g. 1A, 104, 968, 68X...'
                        : activeCompany === 'ctb'
                        ? lang === 'tc'
                          ? '例如: 1, 102, 796X, E21A, A21...'
                          : 'e.g. 1, 102, 796X, E21A...'
                        : lang === 'tc'
                        ? '例如: 1, 11, 38, B2P...'
                        : 'e.g. 1, 11, 38...'
                    }
                    className="w-full pl-11 pr-10 py-3.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-base placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 uppercase font-mono font-medium"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Keypad chips for fast mobile clicking */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-neutral-500 font-medium mr-1">{lang === 'tc' ? '常用:' : 'Quick:'}</span>
                  {['1', '2', '3', '6', '7', '8', '9', 'A', 'E', 'X', 'N', 'P', 'B'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setSearchQuery((prev) => prev + char)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md font-mono font-semibold transition-colors"
                    >
                      {char}
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery((prev) => prev.slice(0, -1))}
                      className="px-2.5 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-amber-400 rounded-md font-medium transition-colors"
                    >
                      ← {lang === 'tc' ? '刪除' : 'Del'}
                    </button>
                  )}
                </div>
              </div>

              {/* Route Search Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {lang === 'tc' ? '路線列表' : 'Routes'} ({filteredRoutes.length})
                  </span>
                  {isLoadingRoutes && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {lang === 'tc' ? '載入路線中...' : 'Loading routes...'}
                    </span>
                  )}
                </div>

                {isLoadingRoutes ? (
                  <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-sm">
                      {lang === 'tc' ? '正在載入香港巴士路線...' : 'Fetching Hong Kong bus routes...'}
                    </p>
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 bg-neutral-950/40 rounded-xl border border-neutral-800 p-6">
                    <p className="text-sm font-medium">
                      {lang === 'tc' ? `找不到符合 "${searchQuery}" 的路線` : `No routes matching "${searchQuery}"`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {lang === 'tc' ? '請嘗試切換巴士公司或調整搜尋字詞' : 'Try switching bus company or check spelling'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredRoutes.map((r) => {
                      const isKmb = r.company === 'kmb';
                      const isCtb = r.company === 'ctb';
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRoute(r)}
                          className="flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm sm:text-base shrink-0 ${
                                isKmb
                                  ? 'bg-red-600 text-white shadow-sm shadow-red-950'
                                  : isCtb
                                  ? 'bg-yellow-400 text-neutral-950 font-bold'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {r.route}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {lang === 'tc'
                                  ? `${r.orig_tc} ➔ ${r.dest_tc}`
                                  : `${r.orig_en} ➔ ${r.dest_en}`}
                              </p>
                              <p className="text-[11px] text-neutral-400 truncate">
                                {lang === 'tc'
                                  ? `往 ${r.dest_tc}`
                                  : `To ${r.dest_en}`}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 shrink-0 ml-1 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: SELECT DIRECTION & BUS STOP */
            <div className="space-y-5">
              {/* Back to route selection bar */}
              <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-lg font-mono font-black text-base ${
                      selectedRoute.company === 'kmb'
                        ? 'bg-red-600 text-white'
                        : selectedRoute.company === 'ctb'
                        ? 'bg-yellow-400 text-neutral-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {selectedRoute.route}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'tc'
                        ? `${selectedRoute.orig_tc} ➔ ${selectedRoute.dest_tc}`
                        : `${selectedRoute.orig_en} ➔ ${selectedRoute.dest_en}`}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {selectedRoute.company.toUpperCase()} ·{' '}
                      {lang === 'tc' ? '共' : 'Total'}{' '}
                      <strong className="text-amber-400">{stops.length}</strong>{' '}
                      {lang === 'tc' ? '個分站' : 'stops'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoute(null);
                    setStops([]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-medium text-neutral-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {lang === 'tc' ? '重新選擇路線' : 'Change Route'}
                </button>
              </div>

              {/* Direction Selector (Bound) */}
              {selectedRoute.company !== 'nlb' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    {lang === 'tc' ? '選擇行車方向' : 'Select Bound / Direction'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDirectionSwitch('outbound')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedBound === 'outbound' || selectedBound === 'O'
                          ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'tc' ? '去程 (Outbound)' : 'Outbound'}</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">
                        {lang === 'tc' ? `往: ${selectedRoute.dest_tc}` : `To: ${selectedRoute.dest_en}`}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectionSwitch('inbound')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedBound === 'inbound' || selectedBound === 'I'
                          ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/50'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'tc' ? '回程 (Inbound)' : 'Inbound'}</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">
                        {lang === 'tc' ? `往: ${selectedRoute.orig_tc}` : `To: ${selectedRoute.orig_en}`}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Stop filter and Geolocation helper */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={stopSearch}
                    onChange={(e) => setStopSearch(e.target.value)}
                    placeholder={
                      lang === 'tc'
                        ? '快速搜尋巴士站名、街名、地標...'
                        : 'Filter stops by name or street...'
                    }
                    className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  {stopSearch && (
                    <button
                      type="button"
                      onClick={() => setStopSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Locate Nearest Button */}
                <button
                  type="button"
                  onClick={handleLocateUser}
                  disabled={isLocating}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-amber-400 rounded-xl transition-colors shrink-0"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    {isLocating
                      ? lang === 'tc'
                        ? '正在定位...'
                        : 'Locating...'
                      : lang === 'tc'
                      ? '尋找最近的巴士站'
                      : 'Find Nearest Stop'}
                  </span>
                </button>
              </div>

              {locationError && (
                <p className="text-xs text-red-400">{locationError}</p>
              )}

              {/* Stops list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {lang === 'tc' ? '選擇乘搭分站' : 'Select Boarding Stop'} (
                    {processedStops.length})
                  </span>
                  {nearestStop && (
                    <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {lang === 'tc' ? '最近站點:' : 'Nearest:'}{' '}
                      {lang === 'tc' ? nearestStop.name_tc : nearestStop.name_en} (
                      {formatDistance(nearestStop.distanceKm!)})
                    </span>
                  )}
                </div>

                {isLoadingStops ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-3 text-neutral-400">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-sm">
                      {lang === 'tc' ? '正在載入沿途各分站...' : 'Loading route stops...'}
                    </p>
                  </div>
                ) : processedStops.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 bg-neutral-950/40 rounded-xl border border-neutral-800">
                    <p className="text-sm font-medium">
                      {lang === 'tc' ? '未找到相符的分站' : 'No matching stops found'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto bg-neutral-950">
                    {processedStops.map((stop) => {
                      const isClosest = nearestStop?.stopId === stop.stopId;
                      return (
                        <button
                          key={stop.stopId}
                          type="button"
                          onClick={() => {
                            const destName_tc =
                              selectedBound === 'inbound' || selectedBound === 'I'
                                ? selectedRoute.orig_tc
                                : selectedRoute.dest_tc;
                            const destName_en =
                              selectedBound === 'inbound' || selectedBound === 'I'
                                ? selectedRoute.orig_en
                                : selectedRoute.dest_en;

                            onSelect({
                              company: selectedRoute.company,
                              route: selectedRoute.route,
                              bound: selectedBound,
                              serviceType: selectedRoute.serviceType,
                              stop,
                              dest_tc: destName_tc,
                              dest_en: destName_en,
                              nlbRouteId: selectedRoute.nlbRouteId,
                            });
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between p-3.5 hover:bg-neutral-900 transition-all text-left group ${
                            isClosest
                              ? 'bg-amber-950/25 border-l-4 border-amber-400'
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 group-hover:bg-amber-500 group-hover:text-black font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors">
                              {stop.seq}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                  {lang === 'tc' ? stop.name_tc : stop.name_en}
                                </h4>
                                {isClosest && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                    {lang === 'tc' ? '最近站點' : 'Closest'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">
                                {lang === 'tc' ? stop.name_en : stop.name_tc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 ml-3">
                            {stop.distanceKm !== null && stop.distanceKm !== undefined && (
                              <span className="text-xs font-mono font-medium text-amber-400/90 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {formatDistance(stop.distanceKm)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-neutral-400 group-hover:text-amber-400 flex items-center gap-1">
                              {lang === 'tc' ? '查看到站' : 'View ETA'}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
