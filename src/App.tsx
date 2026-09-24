import React, { useState, useEffect } from 'react';
import { BusCompany, StopItem, FavoriteItem, DisplayTheme, Language } from './types/bus';
import { BigDisplay } from './components/BigDisplay';
import { RouteSelectorModal } from './components/RouteSelectorModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { GithubGuideModal } from './components/GithubGuideModal';
import {
  getFavorites,
  saveFavorites,
  addFavorite,
  removeFavorite,
  updateFavoriteLabel,
  getStoredTheme,
  saveStoredTheme,
  getStoredLang,
  saveStoredLang,
  getAudioAlertEnabled,
  saveAudioAlertEnabled,
  getLastSelected,
  saveLastSelected,
} from './services/storage';

// Default starter route (KMB 1A - iconic HK bus route from Sau Mau Ping to Star Ferry)
const DEFAULT_SELECTION = {
  company: 'kmb' as BusCompany,
  route: '1A',
  bound: 'O',
  serviceType: '1',
  stop: {
    stopId: 'A3ADFCDF8487ADB9',
    seq: 1,
    name_tc: '中秀茂坪 (KT975)',
    name_en: 'Sau Mau Ping (Central) (KT975)',
  },
  dest_tc: '尖沙咀碼頭',
  dest_en: 'Star Ferry',
};

export default function App() {
  const [currentSelection, setCurrentSelection] = useState(() => {
    const saved = getLastSelected();
    return saved || DEFAULT_SELECTION;
  });

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getFavorites());
  const [theme, setTheme] = useState<DisplayTheme>(() => getStoredTheme());
  const [lang, setLang] = useState<Language>(() => getStoredLang());
  const [audioAlertEnabled, setAudioAlertEnabled] = useState<boolean>(() => getAudioAlertEnabled());

  // Modal controls
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isGithubGuideOpen, setIsGithubGuideOpen] = useState(false);

  // Sync last selected to local storage
  useEffect(() => {
    saveLastSelected(currentSelection);
  }, [currentSelection]);

  // Check if current stop is in favorites
  const isCurrentFavorite = favorites.some(
    (f) =>
      f.company === currentSelection.company &&
      f.route === currentSelection.route &&
      f.bound === currentSelection.bound &&
      f.stopId === currentSelection.stop.stopId
  );

  const currentFavoriteItem = favorites.find(
    (f) =>
      f.company === currentSelection.company &&
      f.route === currentSelection.route &&
      f.bound === currentSelection.bound &&
      f.stopId === currentSelection.stop.stopId
  );

  // Toggle favorite for current active stop
  const handleToggleFavorite = () => {
    if (isCurrentFavorite && currentFavoriteItem) {
      handleDeleteFavorite(currentFavoriteItem.id);
    } else {
      const added = addFavorite({
        company: currentSelection.company,
        route: currentSelection.route,
        bound: currentSelection.bound,
        serviceType: currentSelection.serviceType,
        stopId: currentSelection.stop.stopId,
        stopSeq: currentSelection.stop.seq,
        stopName_tc: currentSelection.stop.name_tc,
        stopName_en: currentSelection.stop.name_en,
        dest_tc: currentSelection.dest_tc,
        dest_en: currentSelection.dest_en,
        nlbRouteId: currentSelection.nlbRouteId,
      });
      setFavorites(getFavorites());
    }
  };

  const handleDeleteFavorite = (id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  };

  const handleUpdateFavoriteLabel = (id: string, label: string) => {
    updateFavoriteLabel(id, label);
    setFavorites(getFavorites());
  };

  const handleImportFavorites = (imported: FavoriteItem[]) => {
    saveFavorites(imported);
    setFavorites(imported);
  };

  // Select favorite to view in big screen
  const handleSelectFavorite = (fav: FavoriteItem) => {
    setCurrentSelection({
      company: fav.company,
      route: fav.route,
      bound: fav.bound,
      serviceType: fav.serviceType,
      stop: {
        stopId: fav.stopId,
        seq: fav.stopSeq,
        name_tc: fav.stopName_tc,
        name_en: fav.stopName_en,
      },
      dest_tc: fav.dest_tc,
      dest_en: fav.dest_en,
      nlbRouteId: fav.nlbRouteId,
    });
  };

  // Theme change
  const handleChangeTheme = (newTheme: DisplayTheme) => {
    setTheme(newTheme);
    saveStoredTheme(newTheme);
  };

  // Language toggle
  const handleToggleLang = () => {
    const nextLang = lang === 'tc' ? 'en' : 'tc';
    setLang(nextLang);
    saveStoredLang(nextLang);
  };

  // Audio alert toggle
  const handleToggleAudio = () => {
    const nextVal = !audioAlertEnabled;
    setAudioAlertEnabled(nextVal);
    saveAudioAlertEnabled(nextVal);
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans">
      {/* MONUMENTAL BIG DISPLAY SCREEN */}
      <BigDisplay
        company={currentSelection.company}
        route={currentSelection.route}
        bound={currentSelection.bound}
        serviceType={currentSelection.serviceType}
        stop={currentSelection.stop}
        dest_tc={currentSelection.dest_tc}
        dest_en={currentSelection.dest_en}
        nlbRouteId={currentSelection.nlbRouteId}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={handleToggleFavorite}
        onOpenSelector={() => setIsSelectorOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        favoritesCount={favorites.length}
        theme={theme}
        onChangeTheme={handleChangeTheme}
        lang={lang}
        onToggleLang={handleToggleLang}
        audioAlertEnabled={audioAlertEnabled}
        onToggleAudioAlert={handleToggleAudio}
        onOpenGithubGuide={() => setIsGithubGuideOpen(true)}
      />

      {/* ROUTE & STOP SELECTOR MODAL */}
      <RouteSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={(selected) => {
          setCurrentSelection(selected);
        }}
        lang={lang}
        initialCompany={currentSelection.company}
      />

      {/* FAVORITES DRAWER */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        currentFavId={currentFavoriteItem?.id}
        onSelectFavorite={handleSelectFavorite}
        onDeleteFavorite={handleDeleteFavorite}
        onUpdateLabel={handleUpdateFavoriteLabel}
        onImportFavorites={handleImportFavorites}
        onOpenSelector={() => setIsSelectorOpen(true)}
        lang={lang}
      />

      {/* GITHUB PAGES DEPLOYMENT GUIDE */}
      <GithubGuideModal
        isOpen={isGithubGuideOpen}
        onClose={() => setIsGithubGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}
