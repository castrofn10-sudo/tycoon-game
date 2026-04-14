import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useState, useEffect } from "react";

export type SaveSlot = {
  id: string;
  slotNumber: number;
  companyName: string;
  netWorth: number;
  money: number;
  companies: number;
  employees: number;
  products: number;
  researchCount: number;
  lastPlayed: string;
  world: string;
  difficulty: string;
  year: number;
  startingMoney: number;
  victoryMode: "sandbox" | "goals";
  selectedGoals: string[];
  characterId: string;
  homeCountry?: string;
  founderAttrs?: number[];
};

type Settings = {
  musicVolume: number;
  sfxVolume: number;
  quality: "low" | "medium" | "high";
  autoSave: boolean;
  showTips: boolean;
  notifNews: boolean;
  notifEvents: boolean;
  notifDaily: boolean;
  notifPopups: boolean;
  notifAchievements: boolean;
  notifMarket: boolean;
  docEnabled: boolean;
};

type GameContextType = {
  saves: SaveSlot[];
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  addSave: (slot: Omit<SaveSlot, "id">) => SaveSlot;
  updateSave: (id: string, patch: Partial<SaveSlot>) => void;
  deleteSave: (id: string) => void;
  resetAll: () => void;
};

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.8,
  sfxVolume: 0.8,
  quality: "high",
  autoSave: true,
  showTips: true,
  notifNews: true,
  notifEvents: true,
  notifDaily: false,
  notifPopups: true,
  notifAchievements: true,
  notifMarket: true,
  docEnabled: true,
};

const SAVES_KEY = "@tycoon_saves";
const SETTINGS_KEY = "@tycoon_settings";

const GameContext = createContext<GameContextType>({
  saves: [],
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  addSave: (slot) => ({ ...slot, id: "" }),
  updateSave: () => {},
  deleteSave: () => {},
  resetAll: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.multiGet([SAVES_KEY, SETTINGS_KEY])
      .then(([[, sv], [, st]]) => {
        if (sv) {
          try {
            const parsed = JSON.parse(sv);
            if (Array.isArray(parsed)) setSaves(parsed);
          } catch { /* corrupted saves — keep empty */ }
        }
        if (st) {
          try {
            const parsed = JSON.parse(st);
            if (parsed && typeof parsed === "object") {
              setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
          } catch { /* corrupted settings — use defaults */ }
        }
      })
      .catch(() => { /* storage unavailable — silent fallback */ });
  }, []);

  const persistSaves = (next: SaveSlot[]) => {
    setSaves(next);
    AsyncStorage.setItem(SAVES_KEY, JSON.stringify(next));
  };

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addSave = useCallback(
    (slot: Omit<SaveSlot, "id">): SaveSlot => {
      const next: SaveSlot = { ...slot, id: Date.now().toString() };
      persistSaves([...saves, next]);
      return next;
    },
    [saves]
  );

  const updateSave = useCallback(
    (id: string, patch: Partial<SaveSlot>) => {
      const next = saves.map((s) =>
        s.id === id ? { ...s, ...patch, lastPlayed: new Date().toLocaleDateString() } : s
      );
      persistSaves(next);
    },
    [saves]
  );

  const deleteSave = useCallback(
    (id: string) => {
      persistSaves(saves.filter((s) => s.id !== id));
    },
    [saves]
  );

  const resetAll = useCallback(() => {
    setSaves([]);
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.multiRemove([SAVES_KEY, SETTINGS_KEY]);
  }, []);

  return (
    <GameContext.Provider value={{ saves, settings, updateSettings, addSave, updateSave, deleteSave, resetAll }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
