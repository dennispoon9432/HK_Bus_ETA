import { FavoriteItem, DisplayTheme, Language } from '../types/bus';

const FAVORITES_KEY = 'hk_bus_favorites_v1';
const THEME_KEY = 'hk_bus_theme_v1';
const LANG_KEY = 'hk_bus_lang_v1';
const LAST_SELECTED_KEY = 'hk_bus_last_selected_v1';
const AUDIO_ALERT_KEY = 'hk_bus_audio_alert_v1';

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
}

export function saveFavorites(favorites: FavoriteItem[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

export function addFavorite(item: Omit<FavoriteItem, 'id' | 'createdAt'>): FavoriteItem {
  const favorites = getFavorites();
  // Check if exists
  const existing = favorites.find(
    (f) =>
      f.company === item.company &&
      f.route === item.route &&
      f.bound === item.bound &&
      f.stopId === item.stopId
  );

  if (existing) {
    return existing;
  }

  const newFav: FavoriteItem = {
    ...item,
    id: `${item.company}_${item.route}_${item.bound}_${item.stopId}_${Date.now()}`,
    createdAt: Date.now(),
  };

  const updated = [newFav, ...favorites];
  saveFavorites(updated);
  return newFav;
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites().filter((f) => f.id !== id);
  saveFavorites(favorites);
}

export function updateFavoriteLabel(id: string, label: string): void {
  const favorites = getFavorites().map((f) => (f.id === id ? { ...f, customLabel: label } : f));
  saveFavorites(favorites);
}

export function getStoredTheme(): DisplayTheme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'led-amber' || saved === 'cyber-dark' || saved === 'clean-light' || saved === 'bus-stop-green') {
    return saved as DisplayTheme;
  }
  return 'led-amber'; // Default authentic HK LED display
}

export function saveStoredTheme(theme: DisplayTheme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredLang(): Language {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'en' || saved === 'tc') {
    return saved as Language;
  }
  return 'tc'; // Default Hong Kong Traditional Chinese
}

export function saveStoredLang(lang: Language): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function getAudioAlertEnabled(): boolean {
  return localStorage.getItem(AUDIO_ALERT_KEY) === 'true';
}

export function saveAudioAlertEnabled(enabled: boolean): void {
  localStorage.setItem(AUDIO_ALERT_KEY, String(enabled));
}

export function getLastSelected(): any | null {
  try {
    const raw = localStorage.getItem(LAST_SELECTED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastSelected(data: any): void {
  try {
    localStorage.setItem(LAST_SELECTED_KEY, JSON.stringify(data));
  } catch {}
}

const ALARM_KEY = 'hk_bus_alarm_v1';

export function getStoredAlarm(): any | null {
  try {
    const raw = localStorage.getItem(ALARM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredAlarm(alarm: any | null): void {
  try {
    if (alarm) {
      localStorage.setItem(ALARM_KEY, JSON.stringify(alarm));
    } else {
      localStorage.removeItem(ALARM_KEY);
    }
  } catch {}
}
