import { BusCompany, RouteItem, StopItem, EtaItem } from '../types/bus';

// In-memory caches to make UI snappy
const routeCache: { [key in BusCompany]?: RouteItem[] } = {};
const stopCache: Map<string, { name_tc: string; name_en: string; lat?: number; lng?: number }> = new Map();
let kmbAllStopsLoaded = false;
let kmbAllStopsLoadingPromise: Promise<void> | null = null;

const KMB_BASE = 'https://data.etabus.gov.hk/v1/transport/kmb';
const CTB_BASE = 'https://rt.data.gov.hk/v2/transport/citybus';
const NLB_BASE = 'https://rt.data.gov.hk/v2/transport/nlb';

// Helper to pre-fetch KMB all stops in background
async function ensureKmbAllStops(): Promise<void> {
  if (kmbAllStopsLoaded) return;
  if (kmbAllStopsLoadingPromise) return kmbAllStopsLoadingPromise;

  kmbAllStopsLoadingPromise = (async () => {
    try {
      const res = await fetch(`${KMB_BASE}/stop`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          for (const s of json.data) {
            stopCache.set(`kmb_${s.stop}`, {
              name_tc: s.name_tc || s.name_en,
              name_en: s.name_en || s.name_tc,
              lat: s.lat ? parseFloat(s.lat) : undefined,
              lng: s.long ? parseFloat(s.long) : undefined,
            });
          }
          kmbAllStopsLoaded = true;
        }
      }
    } catch (e) {
      console.warn('Failed to load full KMB stop dictionary, will fallback to individual stop lookup', e);
    } finally {
      kmbAllStopsLoadingPromise = null;
    }
  })();

  return kmbAllStopsLoadingPromise;
}

// 1. Get Routes for Company
export async function getRoutes(company: BusCompany): Promise<RouteItem[]> {
  if (routeCache[company]) {
    return routeCache[company]!;
  }

  if (company === 'kmb') {
    // Start loading kmb stop dictionary in background without blocking
    ensureKmbAllStops().catch(() => {});

    const res = await fetch(`${KMB_BASE}/route/`);
    if (!res.ok) throw new Error(`KMB API error (${res.status})`);
    const json = await res.json();
    const list: RouteItem[] = (json.data || []).map((item: any) => ({
      id: `kmb_${item.route}_${item.bound}_${item.service_type}`,
      company: 'kmb' as BusCompany,
      route: item.route,
      bound: item.bound, // 'O' | 'I'
      serviceType: String(item.service_type || '1'),
      orig_tc: item.orig_tc,
      orig_en: item.orig_en,
      dest_tc: item.dest_tc,
      dest_en: item.dest_en,
    }));

    routeCache.kmb = list;
    return list;
  }

  if (company === 'ctb') {
    const res = await fetch(`${CTB_BASE}/route/ctb`);
    if (!res.ok) throw new Error(`Citybus API error (${res.status})`);
    const json = await res.json();
    const rawList = json.data || [];

    // In Citybus API, each route has outbound and inbound
    const list: RouteItem[] = [];
    for (const item of rawList) {
      // Outbound (from orig to dest)
      list.push({
        id: `ctb_${item.route}_outbound_1`,
        company: 'ctb',
        route: item.route,
        bound: 'outbound',
        serviceType: '1',
        orig_tc: item.orig_tc,
        orig_en: item.orig_en,
        dest_tc: item.dest_tc,
        dest_en: item.dest_en,
      });

      // Inbound (return direction)
      list.push({
        id: `ctb_${item.route}_inbound_1`,
        company: 'ctb',
        route: item.route,
        bound: 'inbound',
        serviceType: '1',
        orig_tc: item.dest_tc,
        orig_en: item.dest_en,
        dest_tc: item.orig_tc,
        dest_en: item.orig_en,
      });
    }

    routeCache.ctb = list;
    return list;
  }

  if (company === 'nlb') {
    const res = await fetch(`${NLB_BASE}/route.php?action=list`);
    if (!res.ok) throw new Error(`NLB API error (${res.status})`);
    const json = await res.json();
    const rawList = json.routes || [];

    const list: RouteItem[] = rawList.map((item: any) => {
      const partsC = (item.routeName_c || '').split('>');
      const partsE = (item.routeName_e || '').split('>');
      const origC = partsC[0]?.trim() || '';
      const destC = partsC[1]?.trim() || origC;
      const origE = partsE[0]?.trim() || '';
      const destE = partsE[1]?.trim() || origE;

      return {
        id: `nlb_${item.routeId}`,
        company: 'nlb' as BusCompany,
        route: item.routeNo,
        bound: 'outbound',
        serviceType: '1',
        orig_tc: origC,
        orig_en: origE,
        dest_tc: destC,
        dest_en: destE,
        nlbRouteId: item.routeId,
      };
    });

    routeCache.nlb = list;
    return list;
  }

  return [];
}

// 2. Get Stops for Route & Direction
export async function getRouteStops(
  company: BusCompany,
  route: string,
  bound: string,
  serviceType = '1',
  nlbRouteId?: string
): Promise<StopItem[]> {
  if (company === 'kmb') {
    const dir = bound === 'O' || bound === 'outbound' ? 'outbound' : 'inbound';
    const res = await fetch(`${KMB_BASE}/route-stop/${encodeURIComponent(route)}/${dir}/${serviceType}`);
    if (!res.ok) throw new Error(`Failed to load KMB stops for ${route}`);
    const json = await res.json();
    const data = json.data || [];

    // Ensure stops are named
    await ensureKmbAllStops();

    const stops: StopItem[] = [];
    const missingStopIds: string[] = [];

    for (const item of data) {
      const stopId = item.stop;
      const cached = stopCache.get(`kmb_${stopId}`);
      if (cached) {
        stops.push({
          stopId,
          seq: Number(item.seq),
          name_tc: cached.name_tc,
          name_en: cached.name_en,
          lat: cached.lat,
          lng: cached.lng,
        });
      } else {
        missingStopIds.push(stopId);
        stops.push({
          stopId,
          seq: Number(item.seq),
          name_tc: `巴士站 ${item.seq}`,
          name_en: `Bus Stop ${item.seq}`,
        });
      }
    }

    // Fetch missing stops if any
    if (missingStopIds.length > 0) {
      Promise.all(
        missingStopIds.slice(0, 15).map(async (sid) => {
          try {
            const stopRes = await fetch(`${KMB_BASE}/stop/${sid}`);
            if (stopRes.ok) {
              const sJson = await stopRes.json();
              if (sJson.data) {
                stopCache.set(`kmb_${sid}`, {
                  name_tc: sJson.data.name_tc,
                  name_en: sJson.data.name_en,
                  lat: parseFloat(sJson.data.lat),
                  lng: parseFloat(sJson.data.long),
                });
              }
            }
          } catch (_) {}
        })
      ).catch(() => {});
    }

    return stops.sort((a, b) => a.seq - b.seq);
  }

  if (company === 'ctb') {
    const dir = bound === 'I' || bound === 'inbound' ? 'inbound' : 'outbound';
    const res = await fetch(`${CTB_BASE}/route-stop/ctb/${encodeURIComponent(route)}/${dir}`);
    if (!res.ok) throw new Error(`Failed to load Citybus stops for ${route}`);
    const json = await res.json();
    const data = json.data || [];

    if (data.length === 0) {
      return [];
    }

    // Fetch stop info for this route's stops
    const stopPromises = data.map(async (item: any) => {
      const stopId = item.stop;
      const cached = stopCache.get(`ctb_${stopId}`);
      if (cached) {
        return {
          stopId,
          seq: Number(item.seq),
          name_tc: cached.name_tc,
          name_en: cached.name_en,
          lat: cached.lat,
          lng: cached.lng,
        };
      }

      try {
        const sRes = await fetch(`${CTB_BASE}/stop/${stopId}`);
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.data) {
            const sData = {
              name_tc: sJson.data.name_tc,
              name_en: sJson.data.name_en,
              lat: sJson.data.lat ? parseFloat(sJson.data.lat) : undefined,
              lng: sJson.data.long ? parseFloat(sJson.data.long) : undefined,
            };
            stopCache.set(`ctb_${stopId}`, sData);
            return {
              stopId,
              seq: Number(item.seq),
              name_tc: sData.name_tc,
              name_en: sData.name_en,
              lat: sData.lat,
              lng: sData.lng,
            };
          }
        }
      } catch (err) {
        console.error('Stop detail fetch failed', err);
      }

      return {
        stopId,
        seq: Number(item.seq),
        name_tc: `巴士站 ${item.seq}`,
        name_en: `Stop ${item.seq}`,
      };
    });

    const stops = await Promise.all(stopPromises);
    return stops.sort((a, b) => a.seq - b.seq);
  }

  if (company === 'nlb') {
    const rId = nlbRouteId || route;
    const res = await fetch(`${NLB_BASE}/stop.php?action=list&routeId=${encodeURIComponent(rId)}`);
    if (!res.ok) throw new Error(`Failed to load NLB stops for route ${route}`);
    const json = await res.json();
    const rawStops = json.stops || [];

    return rawStops.map((s: any, idx: number) => ({
      stopId: s.stopId,
      seq: idx + 1,
      name_tc: s.stopName_c || s.stopLocation_c || `站點 ${idx + 1}`,
      name_en: s.stopName_e || s.stopLocation_e || `Stop ${idx + 1}`,
      lat: s.latitude ? parseFloat(s.latitude) : undefined,
      lng: s.longitude ? parseFloat(s.longitude) : undefined,
    }));
  }

  return [];
}

// 3. Fetch ETAs for selected Stop & Route
export async function getETA(
  company: BusCompany,
  stopId: string,
  route: string,
  serviceType = '1',
  bound = 'O',
  nlbRouteId?: string
): Promise<EtaItem[]> {
  const now = Date.now();

  if (company === 'kmb') {
    // /eta/{stop_id}/{route}/{service_type}
    const res = await fetch(`${KMB_BASE}/eta/${stopId}/${encodeURIComponent(route)}/${serviceType}`);
    if (!res.ok) throw new Error('KMB ETA error');
    const json = await res.json();
    const rawList: any[] = json.data || [];

    // Filter by direction if provided
    const targetDir = bound === 'outbound' || bound === 'O' ? 'O' : 'I';
    const filtered = rawList.filter((item) => !item.dir || item.dir === targetDir);
    const sourceList = filtered.length > 0 ? filtered : rawList;

    return sourceList
      .filter((item) => item.eta)
      .map((item) => {
        const etaDate = new Date(item.eta);
        const diffMinutes = Math.round((etaDate.getTime() - now) / 60000);
        const rmk = (item.rmk_tc || '').toLowerCase();
        const isScheduled = rmk.includes('原定') || rmk.includes('scheduled');

        return {
          eta: item.eta,
          minutesUntil: diffMinutes,
          dest_tc: item.dest_tc,
          dest_en: item.dest_en,
          rmk_tc: item.rmk_tc || '',
          rmk_en: item.rmk_en || '',
          isScheduled,
          seq: Number(item.eta_seq || 1),
          company: 'kmb' as BusCompany,
          coDisplayName: item.co || 'KMB',
          dataTimestamp: item.data_timestamp,
          wheelchair: item.w_wheelchair === 'Y',
        };
      })
      .sort((a, b) => {
        const timeA = a.eta ? new Date(a.eta).getTime() : 0;
        const timeB = b.eta ? new Date(b.eta).getTime() : 0;
        return timeA - timeB;
      });
  }

  if (company === 'ctb') {
    // /eta/ctb/{stop_id}/{route}
    const res = await fetch(`${CTB_BASE}/eta/ctb/${stopId}/${encodeURIComponent(route)}`);
    if (!res.ok) throw new Error('Citybus ETA error');
    const json = await res.json();
    const rawList: any[] = json.data || [];

    const targetDir = bound === 'outbound' || bound === 'O' ? 'O' : 'I';
    const filtered = rawList.filter((item) => !item.dir || item.dir === targetDir);
    const sourceList = filtered.length > 0 ? filtered : rawList;

    return sourceList
      .filter((item) => item.eta)
      .map((item) => {
        const etaDate = new Date(item.eta);
        const diffMinutes = Math.round((etaDate.getTime() - now) / 60000);
        const rmk = (item.rmk_tc || '').toLowerCase();
        const isScheduled = rmk.includes('原定') || rmk.includes('scheduled');

        return {
          eta: item.eta,
          minutesUntil: diffMinutes,
          dest_tc: item.dest_tc,
          dest_en: item.dest_en,
          rmk_tc: item.rmk_tc || '',
          rmk_en: item.rmk_en || '',
          isScheduled,
          seq: Number(item.eta_seq || 1),
          company: 'ctb' as BusCompany,
          coDisplayName: 'Citybus',
          dataTimestamp: item.data_timestamp,
        };
      })
      .sort((a, b) => {
        const timeA = a.eta ? new Date(a.eta).getTime() : 0;
        const timeB = b.eta ? new Date(b.eta).getTime() : 0;
        return timeA - timeB;
      });
  }

  if (company === 'nlb') {
    const rId = nlbRouteId || route;
    const res = await fetch(`${NLB_BASE}/stop.php?action=estimatedArrivals&routeId=${encodeURIComponent(rId)}&stopId=${encodeURIComponent(stopId)}`);
    if (!res.ok) throw new Error('NLB ETA error');
    const json = await res.json();
    const list: any[] = json.estimatedArrivals || [];

    return list
      .map((item, idx) => {
        // NLB format: "2026-09-24 19:40:00"
        let etaIso: string | null = null;
        let diffMinutes: number | null = null;
        if (item.estimatedArrivalTime) {
          const cleanDate = item.estimatedArrivalTime.replace(' ', 'T') + '+08:00';
          const etaDate = new Date(cleanDate);
          etaIso = cleanDate;
          diffMinutes = Math.round((etaDate.getTime() - now) / 60000);
        }

        const isDeparted = item.departed === '1' || item.departed === 1;
        const noGPS = item.noGPS === '1' || item.noGPS === 1;

        return {
          eta: etaIso,
          minutesUntil: diffMinutes,
          dest_tc: item.routeVariantName || '',
          dest_en: item.routeVariantName || '',
          rmk_tc: isDeparted ? '已開出' : noGPS ? '預定班次' : '實時班次',
          rmk_en: isDeparted ? 'Departed' : noGPS ? 'Scheduled' : 'Live GPS',
          isScheduled: noGPS,
          seq: idx + 1,
          company: 'nlb' as BusCompany,
          coDisplayName: 'NLB',
          dataTimestamp: item.generateTime,
          wheelchair: item.wheelChair === 1 || item.wheelChair === '1',
        };
      })
      .filter((item) => item.eta !== null)
      .sort((a, b) => {
        const timeA = a.eta ? new Date(a.eta).getTime() : 0;
        const timeB = b.eta ? new Date(b.eta).getTime() : 0;
        return timeA - timeB;
      });
  }

  return [];
}
