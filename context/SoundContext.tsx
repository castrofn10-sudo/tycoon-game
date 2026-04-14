import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Web Audio API Sound Engine ────────────────────────────────────

function createWebAudioEngine() {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();

    function playTone(
      frequencies: number[],
      duration: number,
      volume: number,
      type: OscillatorType = "sine",
      delay = 0,
    ) {
      if (volume <= 0) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = type;
        filter.type = "lowpass";
        filter.frequency.value = 2000;
        filter.Q.value = 0.7;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        if (frequencies.length === 1) {
          osc.frequency.setValueAtTime(frequencies[0], now);
        } else {
          frequencies.forEach((f, i) => {
            const t = now + (i / frequencies.length) * duration;
            osc.frequency.setValueAtTime(f, t);
          });
        }

        osc.start(now);
        osc.stop(now + duration + 0.05);
      } catch {}
    }

    function playClick(vol: number) {
      playTone([800, 500], 0.06, vol, "triangle");
    }

    function playSuccess(vol: number) {
      playTone([523], 0.08, vol * 0.8, "sine", 0);
      playTone([659], 0.08, vol * 0.8, "sine", 0.08);
      playTone([784], 0.15, vol * 0.8, "sine", 0.16);
    }

    function playError(vol: number) {
      playTone([300, 220], 0.18, vol, "sawtooth");
    }

    function playAdvance(vol: number) {
      playTone([440, 523], 0.12, vol * 0.7, "sine");
    }

    function playUnlock(vol: number) {
      playTone([523], 0.07, vol * 0.7, "sine", 0);
      playTone([659], 0.07, vol * 0.7, "sine", 0.07);
      playTone([784], 0.07, vol * 0.7, "sine", 0.14);
      playTone([1047], 0.2, vol * 0.9, "sine", 0.21);
    }

    function playBuild(vol: number) {
      playTone([220, 277, 330], 0.20, vol * 0.7, "triangle", 0);
      playTone([440], 0.25, vol * 0.8, "sine", 0.20);
    }

    // Lo-fi ambient: warm low drone + subtle noise texture
    let ambientNodes: AudioNode[] = [];
    let ambientGain: GainNode | null = null;

    function startAmbient(vol: number) {
      stopAmbient();
      if (vol <= 0) return;

      try {
        const masterGain = ctx.createGain();
        masterGain.gain.value = vol * 0.08;
        masterGain.connect(ctx.destination);
        ambientGain = masterGain;

        // Low drone oscillator (G1 = 49 Hz)
        const drone = ctx.createOscillator();
        drone.type = "sine";
        drone.frequency.value = 49;
        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = "lowpass";
        droneFilter.frequency.value = 200;
        droneFilter.Q.value = 1.5;
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.5;
        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(masterGain);
        drone.start();
        ambientNodes.push(drone, droneFilter, droneGain);

        // Warmer harmonic (G2 = 98 Hz)
        const harm = ctx.createOscillator();
        harm.type = "triangle";
        harm.frequency.value = 98;
        const harmFilter = ctx.createBiquadFilter();
        harmFilter.type = "lowpass";
        harmFilter.frequency.value = 400;
        const harmGain = ctx.createGain();
        harmGain.gain.value = 0.15;
        harm.connect(harmFilter);
        harmFilter.connect(harmGain);
        harmGain.connect(masterGain);
        harm.start();
        ambientNodes.push(harm, harmFilter, harmGain);

        // Soft noise layer
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.value = 300;
        noiseFilter.Q.value = 0.3;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04;
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseSource.start();
        ambientNodes.push(noiseSource, noiseFilter, noiseGain);

        // Slow LFO modulation on drone
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.05; // very slow
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 8;
        lfo.connect(lfoGain);
        lfoGain.connect(drone.frequency);
        lfo.start();
        ambientNodes.push(lfo, lfoGain);
      } catch {}
    }

    function stopAmbient() {
      ambientNodes.forEach((n) => {
        try { (n as any).stop?.(); } catch {}
        try { n.disconnect(); } catch {}
      });
      ambientNodes = [];
      if (ambientGain) {
        try { ambientGain.disconnect(); } catch {}
        ambientGain = null;
      }
    }

    function setAmbientVolume(vol: number) {
      if (ambientGain) {
        ambientGain.gain.setTargetAtTime(vol * 0.08, ctx.currentTime, 0.5);
      }
    }

    function resume() {
      if (ctx.state === "suspended") ctx.resume();
    }

    return { playClick, playSuccess, playError, playAdvance, playUnlock, playBuild, startAmbient, stopAmbient, setAmbientVolume, resume };
  } catch {
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────

const SFX_VOL_KEY = "@megacorp_sfx_vol";
const MUSIC_VOL_KEY = "@megacorp_music_vol";
const AMBIENT_KEY = "@megacorp_ambient";

type SoundContextType = {
  sfxVolume: number;
  musicVolume: number;
  ambientEnabled: boolean;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setAmbientEnabled: (v: boolean) => void;
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playAdvance: () => void;
  playUnlock: () => void;
  playBuild: () => void;
};

const SoundContext = createContext<SoundContextType>({
  sfxVolume: 0.7,
  musicVolume: 0.5,
  ambientEnabled: true,
  setSfxVolume: () => {},
  setMusicVolume: () => {},
  setAmbientEnabled: () => {},
  playClick: () => {},
  playSuccess: () => {},
  playError: () => {},
  playAdvance: () => {},
  playUnlock: () => {},
  playBuild: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [sfxVolume, setSfxVol] = useState(0.7);
  const [musicVolume, setMusicVol] = useState(0.5);
  const [ambientEnabled, setAmbient] = useState(true);
  const engine = useRef<ReturnType<typeof createWebAudioEngine>>(null);
  const started = useRef(false);

  useEffect(() => {
    // Load persisted settings
    Promise.all([
      AsyncStorage.getItem(SFX_VOL_KEY),
      AsyncStorage.getItem(MUSIC_VOL_KEY),
      AsyncStorage.getItem(AMBIENT_KEY),
    ]).then(([sfx, music, amb]) => {
      if (sfx !== null) setSfxVol(parseFloat(sfx));
      if (music !== null) setMusicVol(parseFloat(music));
      if (amb !== null) setAmbient(amb === "true");
    });

    // Create audio engine
    engine.current = createWebAudioEngine();
  }, []);

  // Start/stop ambient based on settings
  useEffect(() => {
    if (!engine.current) return;
    if (ambientEnabled && musicVolume > 0) {
      engine.current.startAmbient(musicVolume);
    } else {
      engine.current.stopAmbient();
    }
  }, [ambientEnabled, musicVolume]);

  // Update ambient volume when changed
  useEffect(() => {
    engine.current?.setAmbientVolume(musicVolume);
  }, [musicVolume]);

  const setSfxVolume = useCallback((v: number) => {
    setSfxVol(v);
    AsyncStorage.setItem(SFX_VOL_KEY, String(v));
  }, []);

  const setMusicVolume = useCallback((v: number) => {
    setMusicVol(v);
    AsyncStorage.setItem(MUSIC_VOL_KEY, String(v));
    engine.current?.setAmbientVolume(v);
  }, []);

  const setAmbientEnabled = useCallback((v: boolean) => {
    setAmbient(v);
    AsyncStorage.setItem(AMBIENT_KEY, String(v));
    if (v) engine.current?.startAmbient(musicVolume);
    else engine.current?.stopAmbient();
  }, [musicVolume]);

  // Resume audio context on user interaction (browser policy)
  const ensureStarted = useCallback(() => {
    if (!started.current) {
      engine.current?.resume();
      if (ambientEnabled && musicVolume > 0) {
        engine.current?.startAmbient(musicVolume);
      }
      started.current = true;
    }
  }, [ambientEnabled, musicVolume]);

  const playClick = useCallback(() => {
    ensureStarted();
    engine.current?.playClick(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  const playSuccess = useCallback(() => {
    ensureStarted();
    engine.current?.playSuccess(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  const playError = useCallback(() => {
    ensureStarted();
    engine.current?.playError(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  const playAdvance = useCallback(() => {
    ensureStarted();
    engine.current?.playAdvance(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  const playUnlock = useCallback(() => {
    ensureStarted();
    engine.current?.playUnlock(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  const playBuild = useCallback(() => {
    ensureStarted();
    engine.current?.playBuild(sfxVolume);
  }, [sfxVolume, ensureStarted]);

  return (
    <SoundContext.Provider value={{
      sfxVolume, musicVolume, ambientEnabled,
      setSfxVolume, setMusicVolume, setAmbientEnabled,
      playClick, playSuccess, playError, playAdvance, playUnlock, playBuild,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
