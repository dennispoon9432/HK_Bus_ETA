export type BusCompany = 'kmb' | 'ctb' | 'nlb';

export interface RouteItem {
  id: string; // unique key
  company: BusCompany;
  route: string;
  bound: 'O' | 'I' | 'inbound' | 'outbound';
  serviceType: string;
  orig_tc: string;
  orig_en: string;
  dest_tc: string;
  dest_en: string;
  nlbRouteId?: string;
}

export interface StopItem {
  stopId: string;
  seq: number;
  name_tc: string;
  name_en: string;
  lat?: number;
  lng?: number;
}

export interface EtaItem {
  eta: string | null; // ISO string or null
  minutesUntil: number | null;
  dest_tc: string;
  dest_en: string;
  rmk_tc: string;
  rmk_en: string;
  isScheduled: boolean;
  seq: number;
  company: BusCompany;
  coDisplayName: string;
  dataTimestamp?: string;
  wheelchair?: boolean;
}

export interface FavoriteItem {
  id: string;
  company: BusCompany;
  route: string;
  bound: string;
  serviceType: string;
  stopId: string;
  stopSeq: number;
  stopName_tc: string;
  stopName_en: string;
  dest_tc: string;
  dest_en: string;
  customLabel?: string;
  nlbRouteId?: string;
  createdAt: number;
}

export type DisplayTheme = 'led-amber' | 'cyber-dark' | 'clean-light' | 'bus-stop-green';
export type Language = 'tc' | 'en';

export interface BusAlarm {
  id: string;
  route: string;
  stopId: string;
  tripIndex: number; // 0 for 1st bus, 1 for 2nd, etc.
  targetEta: string | null; // ISO string
  alertMinutes: number; // minutes before arrival to trigger alarm
  enabled: boolean;
  triggered: boolean;
  voiceEnabled: boolean;
}
