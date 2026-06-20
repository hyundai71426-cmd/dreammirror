import { useState, useEffect, useRef } from "react";
import { Play, Pause, Headphones, Clock, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SoundscapeProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const SOUNDSCAPE_PROFILES: SoundscapeProfile[] = [
  { id: "ocean", name: "심해와 파도 소리", emoji: "🌊", description: "서서히 해변을 적시고 쓸려 내려가는 파도 소리 (브라운 노이즈 & 9초 스웰 리듬 필터링)" },
  { id: "rain", name: "따뜻한 치유의 빗소리", emoji: "🌧️", description: "차분하게 지붕 위를 두드리는 숲속 가벼운 소생 소낙비 (화이트/브라운 이중 텍스처 노이즈)" },
  { id: "wind", name: "솔바람 은하수 노래", emoji: "🍃", description: "고요한 깊은 밤 침엽수림 사이로 부드럽게 넘나드는 불규칙한 솔나무 바람 흔들림" }
];

export default function WindDownPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeProfile, setActiveProfile] = useState<SoundscapeProfile>(SOUNDSCAPE_PROFILES[0]);
  const [timerMinutes, setTimerMinutes] = useState<number>(10);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Custom Nature soundscape buffer nodes
  const noiseSourceRef1 = useRef<AudioBufferSourceNode | null>(null);
  const noiseSourceRef2 = useRef<AudioBufferSourceNode | null>(null);
  const lfoRef1 = useRef<OscillatorNode | null>(null);
  const lfoRef2 = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  
  // Progress countdown interval ref
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopSynthesizer();
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Quick switch between profiles with smooth hot restart
  useEffect(() => {
    if (isPlaying) {
      try {
        if (noiseSourceRef1.current) noiseSourceRef1.current.stop();
        if (noiseSourceRef2.current) noiseSourceRef2.current.stop();
        if (lfoRef1.current) lfoRef1.current.stop();
        if (lfoRef2.current) lfoRef2.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
      } catch (_) {}

      noiseSourceRef1.current = null;
      noiseSourceRef2.current = null;
      lfoRef1.current = null;
      lfoRef2.current = null;
      gainRef.current = null;
      audioCtxRef.current = null;

      startSynthesizer();
    }
  }, [activeProfile]);

  // Sync Timer Countdown
  useEffect(() => {
    if (isTimerActive && secondsRemaining > 0 && isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handlePause();
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerActive, secondsRemaining, isPlaying]);

  const startSynthesizer = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create high quality cyclic sound buffers (6 seconds)
      const whiteNoiseSize = ctx.sampleRate * 6;
      const whiteBuffer = ctx.createBuffer(1, whiteNoiseSize, ctx.sampleRate);
      const whiteData = whiteBuffer.getChannelData(0);
      for (let i = 0; i < whiteNoiseSize; i++) {
        whiteData[i] = Math.random() * 2 - 1;
      }

      const brownBuffer = ctx.createBuffer(1, whiteNoiseSize, ctx.sampleRate);
      const brownData = brownBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < whiteNoiseSize; i++) {
        const white = Math.random() * 2 - 1;
        brownData[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = brownData[i];
        brownData[i] *= 3.5; // Compensate for natural level envelope loss of brown noise
      }

      // Master volume configuration with cozy entry animation
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.2); // safe volume limit to prevent spike
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      if (activeProfile.id === "ocean") {
        // --- 1. OCEAN WAVES ---
        // deep filtered brown noise
        const source = ctx.createBufferSource();
        source.buffer = brownBuffer;
        source.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(320, ctx.currentTime);
        lowpass.Q.setValueAtTime(0.8, ctx.currentTime);

        // LFO (approx. 9 second tide fluctuation)
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.11, ctx.currentTime);

        const lfoFilterGain = ctx.createGain();
        lfoFilterGain.gain.setValueAtTime(170, ctx.currentTime); // sweep 150Hz ~ 490Hz

        const lfoVolumeGain = ctx.createGain();
        lfoVolumeGain.gain.setValueAtTime(0.08, ctx.currentTime); // synched wave volume breeze

        lfo.connect(lfoFilterGain);
        lfoFilterGain.connect(lowpass.frequency);

        lfo.connect(lfoVolumeGain);

        const soundGain = ctx.createGain();
        soundGain.gain.setValueAtTime(0.18, ctx.currentTime);
        lfoVolumeGain.connect(soundGain.gain);

        source.connect(lowpass);
        lowpass.connect(soundGain);
        soundGain.connect(masterGain);

        source.start();
        lfo.start();

        noiseSourceRef1.current = source;
        lfoRef1.current = lfo;

      } else if (activeProfile.id === "rain") {
        // --- 2. SERENE RAINFALL ---
        // Combination of low brown rumble and high white rain droplets
        const rumbleSource = ctx.createBufferSource();
        rumbleSource.buffer = brownBuffer;
        rumbleSource.loop = true;

        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = "lowpass";
        rumbleFilter.frequency.setValueAtTime(450, ctx.currentTime);

        const rumbleGain = ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.15, ctx.currentTime);

        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(masterGain);

        // Pitter patter drops
        const whiteSource = ctx.createBufferSource();
        whiteSource.buffer = whiteBuffer;
        whiteSource.loop = true;

        const dropFilter = ctx.createBiquadFilter();
        dropFilter.type = "bandpass";
        dropFilter.frequency.setValueAtTime(1600, ctx.currentTime);
        dropFilter.Q.setValueAtTime(1.8, ctx.currentTime);

        const dropGain = ctx.createGain();
        dropGain.gain.setValueAtTime(0.02, ctx.currentTime);

        // Slightly modulate drops to simulate gusty air
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.3, ctx.currentTime);

        const lfoRainGain = ctx.createGain();
        lfoRainGain.gain.setValueAtTime(0.012, ctx.currentTime);

        lfo.connect(lfoRainGain);
        lfoRainGain.connect(dropGain.gain);

        whiteSource.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(masterGain);

        rumbleSource.start();
        whiteSource.start();
        lfo.start();

        noiseSourceRef1.current = rumbleSource;
        noiseSourceRef2.current = whiteSource;
        lfoRef1.current = lfo;

      } else if (activeProfile.id === "wind") {
        // --- 3. WHISPERING FOREST WIND ---
        // Resonant sweeping pine storm wind
        const source = ctx.createBufferSource();
        source.buffer = whiteBuffer;
        source.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(450, ctx.currentTime);
        bandpass.Q.setValueAtTime(2.4, ctx.currentTime);

        // Slow organic asymmetrical modulating waveforms
        const lfo1 = ctx.createOscillator();
        lfo1.type = "sine";
        lfo1.frequency.setValueAtTime(0.07, ctx.currentTime); // 14s sweep

        const lfo1Gain = ctx.createGain();
        lfo1Gain.gain.setValueAtTime(180, ctx.currentTime);

        lfo1.connect(lfo1Gain);
        lfo1Gain.connect(bandpass.frequency);

        const lfo2 = ctx.createOscillator();
        lfo2.type = "sine";
        lfo2.frequency.setValueAtTime(0.15, ctx.currentTime); // 6s sweep

        const lfo2Gain = ctx.createGain();
        lfo2Gain.gain.setValueAtTime(120, ctx.currentTime);

        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(bandpass.frequency);

        // Vary wind howling intensity volume
        const windVolumeGain = ctx.createGain();
        windVolumeGain.gain.setValueAtTime(0.12, ctx.currentTime);

        const lfoVolMod = ctx.createGain();
        lfoVolMod.gain.setValueAtTime(0.06, ctx.currentTime);
        lfo2.connect(lfoVolMod);
        lfoVolMod.connect(windVolumeGain.gain);

        source.connect(bandpass);
        bandpass.connect(windVolumeGain);
        windVolumeGain.connect(masterGain);

        source.start();
        lfo1.start();
        lfo2.start();

        noiseSourceRef1.current = source;
        lfoRef1.current = lfo1;
        lfoRef2.current = lfo2;
      }

    } catch (e) {
      console.error("Failed to start nature noise synthesizer:", e);
    }
  };

  const stopSynthesizer = () => {
    if (gainRef.current && audioCtxRef.current) {
      try {
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, audioCtxRef.current.currentTime);
        gainRef.current.gain.linearRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.3);
      } catch (_) {}
    }

    setTimeout(() => {
      try {
        if (noiseSourceRef1.current) {
          noiseSourceRef1.current.stop();
          noiseSourceRef1.current.disconnect();
        }
        if (noiseSourceRef2.current) {
          noiseSourceRef2.current.stop();
          noiseSourceRef2.current.disconnect();
        }
        if (lfoRef1.current) {
          lfoRef1.current.stop();
          lfoRef1.current.disconnect();
        }
        if (lfoRef2.current) {
          lfoRef2.current.stop();
          lfoRef2.current.disconnect();
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      } catch (_) {}

      noiseSourceRef1.current = null;
      noiseSourceRef2.current = null;
      lfoRef1.current = null;
      lfoRef2.current = null;
      gainRef.current = null;
      audioCtxRef.current = null;
    }, 350);
  };

  const handlePlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    startSynthesizer();

    if (!isTimerActive) {
      setSecondsRemaining(timerMinutes * 60);
      setIsTimerActive(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopSynthesizer();
  };

  const formatCountdown = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const selectMinutes = (mins: number) => {
    setTimerMinutes(mins);
    if (isPlaying) {
      setSecondsRemaining(mins * 60);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  };

  return (
    <div id="wind-down-player-root" className="bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Headphones className="w-4 h-4 text-emerald-400" />
          입면 지원 이완 사운드스케이프
        </h3>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-900/50 rounded-full text-emerald-400">
          WEB SYNTH
        </span>
      </div>

      <p className="text-[11px] text-indigo-200/50 leading-relaxed font-sans mb-5">
        수면 입문 시 도래하는 잡념과 스트레스를 세타(θ) 바이노럴 비트로 사박사박 잠재웁니다. 이어폰 사용 시 효과가 배가됩니다.
      </p>

      {/* Main active audio profile panel card */}
      <div className="bg-[#080B1C]/80 border border-indigo-950/60 p-4 rounded-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Dynamic Breathing Circle behind playing status */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.42, 0.15] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute w-36 h-36 rounded-full bg-emerald-500/10 filter blur-xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        <span className="text-4xl mb-2">{activeProfile.emoji}</span>
        <h4 className="text-sm font-extrabold text-white">{activeProfile.name} Mode</h4>
        <p className="text-[10px] text-indigo-300/60 leading-relaxed max-w-xs mt-1.5">
          {activeProfile.description}
        </p>

        {/* Display Timer Status */}
        <div className="my-5 flex flex-col items-center font-mono">
          <span className="text-2xl font-black text-emerald-300 tracking-wider">
            {isPlaying && isTimerActive ? formatCountdown(secondsRemaining) : `${timerMinutes}:00`}
          </span>
          <span className="text-[8px] text-indigo-400/50 mt-1 uppercase font-bold tracking-widest">
            {isPlaying ? "자동 오프 대기 수치" : "설정 타이머 시간"}
          </span>
        </div>

        {/* Floating audio status bar */}
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl border-4 border-red-500/30"
          >
            <Pause className="w-5 h-5 fill-white" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl border-4 border-emerald-500/30"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}
      </div>

      {/* Select alternative profiles in bottom horizontal slider */}
      <div className="grid grid-cols-3 gap-2 my-4">
        {SOUNDSCAPE_PROFILES.map((p) => {
          const isAct = p.id === activeProfile.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                isAct 
                  ? "bg-indigo-950/40 border-emerald-500/50 text-white" 
                  : "bg-[#090B19]/30 border-indigo-950 text-indigo-300/40 opacity-70 hover:opacity-100"
              }`}
            >
              <span className="text-xs">{p.emoji}</span>
              <span className="text-[10px] font-extrabold mt-1 truncate max-w-full text-center">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sleep Timer Settings horizontal row */}
      <div className="bg-[#0B0D1B] border border-indigo-950/60 rounded-xl p-3 flex justify-between items-center text-xs">
        <span className="text-[10px] text-indigo-400/70 font-bold flex items-center gap-1 font-sans">
          <Clock className="w-3.5 h-3.5" />
          수면 유도 타이머
        </span>

        <div className="flex items-center gap-1.5 font-mono">
          {[5, 10, 20, 30].map((mins) => {
            const isMatch = timerMinutes === mins;
            return (
              <button
                key={mins}
                onClick={() => selectMinutes(mins)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  isMatch ? "bg-emerald-500 text-white" : "bg-indigo-950/40 text-indigo-300/50 hover:text-indigo-300"
                }`}
              >
                {mins}분
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
