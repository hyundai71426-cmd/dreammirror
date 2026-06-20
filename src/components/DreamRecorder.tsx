import { useState, useEffect, useRef } from "react";
import { Mic, Square, Sparkles, Check, Flame, Star, BookOpen, AlertCircle, ArrowLeft, ArrowRight, Save, Clock } from "lucide-react";
import { Dream, DreamAnalysis } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DreamRecorderProps {
  onSave: (dream: Dream) => void;
  onCancel: () => void;
  existingDreamCount: number;
}

// Emoticons for emotions
const EMOTIONS = [
  { id: "공포", emoji: "😨", label: "공포", color: "bg-red-950/40 border-red-800 text-red-200" },
  { id: "불안", emoji: "😰", label: "불안", color: "bg-indigo-950/40 border-indigo-800 text-indigo-200" },
  { id: "슬픔", emoji: "😢", label: "슬픔", color: "bg-blue-950/40 border-blue-800 text-blue-200" },
  { id: "분노", emoji: "😡", label: "분노", color: "bg-orange-950/40 border-orange-800 text-orange-200" },
  { id: "우울", emoji: "😔", label: "우울", color: "bg-slate-950/40 border-slate-800 text-slate-300" },
  { id: "안도", emoji: "😌", label: "안도", color: "bg-teal-950/40 border-teal-800 text-teal-200" },
  { id: "행복", emoji: "🙂", label: "행복", color: "bg-yellow-950/40 border-yellow-800 text-yellow-200" },
  { id: "설렘", emoji: "🥰", label: "설렘", color: "bg-pink-950/40 border-pink-800 text-pink-200" },
  { id: "혼란", emoji: "🤪", label: "혼란", color: "bg-purple-950/40 border-purple-800 text-purple-200" }
];

export default function DreamRecorder({ onSave, onCancel, existingDreamCount }: DreamRecorderProps) {
  // Steps:
  // "ready" -> "recording" -> "text_editing" -> "emotion_select" -> "additional_info" -> "ai_analyzing"
  const [step, setStep] = useState<"ready" | "recording" | "text_editing" | "emotion_select" | "additional_info" | "ai_analyzing" | "completed">("ready");
  
  const [seconds, setSeconds] = useState(0);
  const [audioInputSimulated, setAudioInputSimulated] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dreamTitle, setDreamTitle] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [nightmareScore, setNightmareScore] = useState<number>(3);
  const [vividness, setVividness] = useState<number>(3);
  const [sleepScore, setSleepScore] = useState<number>(3);
  
  // Real or mock generated details
  const [generatedAnalysis, setGeneratedAnalysis] = useState<DreamAnalysis | null>(null);
  
  // Simulated recording waveform
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(24).fill(12));
  
  // Timer and animation references
  const timerRef = useRef<any>(null);
  const waveRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Suggested preset prompts to help user type/mock quickly
  const PRESET_DREAMS = [
    {
      title: "바닷속 무한 비행",
      content: "바다의 수면 바로 위를 끝없이 날아다니는 꿈을 꿨다. 마주오는 바닷바람이 정말 상쾌했고, 저 아래로 헤엄치는 고래와 돌고래들이 아름답게 비쳤다. 자유롭게 고도를 조절하면서 날았는데 눈부신 오색 빛깔 산호초가 찬란했고 완전히 행복한 하루였다.",
      emotions: ["행복", "설렘", "안도"]
    },
    {
      title: "동물의 집단 추격",
      content: "길을 걷고 있는데 갑자기 수십 마리의 정체불명 야생 동물이나 표범 늑대 떼가 나를 보고 쫓아오기 시작했다. 가까스로 부서진 낡은 오벨리스크 건물 옥상으로 올라가 문을 닫아 잠갔는데, 밖에서 문을 뚫으려 긁는 소리가 사방에 울려 온몸이 마비될 정도로 엄청 공포스럽고 심장이 멎기 직전이었다.",
      emotions: ["공포", "불안", "혼란"]
    }
  ];

  // Start sound wave simulation
  useEffect(() => {
    if (step === "recording") {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

      waveRef.current = setInterval(() => {
        setWaveHeights(Array(24).fill(0).map(() => Math.floor(Math.random() * 32) + 6));
      }, 110);
    } else {
      clearInterval(timerRef.current);
      clearInterval(waveRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(waveRef.current);
    };
  }, [step]);

  // Handle Speech Recognition Simulation or microphone
  const startRecording = () => {
    setSeconds(0);
    setTranscript("");
    setStep("recording");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "ko-KR";

        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setTranscript(currentTranscript);
          }
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
        };

        rec.onend = () => {
          console.log("Speech recognition ended");
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const stopRecording = () => {
    setStep("text_editing");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    }
    // Only if transcript is empty, fallback to the preset text so they still have something to see if they didn't speak
    if (!transcript.trim()) {
      setTranscript("준비되지 않은 발표를 하러 많은 관중들이 있는 대강당 무대에 올라갔다. 피피티 슬라이드를 켜려는데 자꾸 마우스가 버벅대고 전원이 꺼지더니 노트북이 검게 굳어버렸다. 주위 회사 동료들과 무서운 상사의 가시 돋친 따가운 눈길들이 일제히 나에게 쏠리고 내 머리는 아득히 희고 멍해지며 너무나 불안하고 소스라치게 부끄러웠다.");
      setDreamTitle("무대 위에서의 기계 고장");
    } else {
      const cleanTitle = transcript.length > 20 ? transcript.substring(0, 18) + "..." : transcript;
      setDreamTitle(cleanTitle || "녹음된 꿈 이야기");
    }
  };

  // Skip recording, write directly
  const writeDirectly = () => {
    setTranscript("");
    setDreamTitle("");
    setStep("text_editing");
  };

  const selectPreset = (p: typeof PRESET_DREAMS[0]) => {
    setTranscript(p.content);
    setDreamTitle(p.title);
    setSelectedEmotions(p.emotions);
    setStep("text_editing");
  };

  const handleNextFromText = () => {
    if (!transcript.trim()) {
      alert("꿈 내용을 간략히 입력해 주세요.");
      return;
    }
    setStep("emotion_select");
  };

  const handleNextFromEmotion = () => {
    setStep("additional_info");
  };

  // Call API or Fallback to create analysis
  const handleSaveAndAnalyze = async () => {
    setStep("ai_analyzing");
    
    // Simulate tick marks sequence step-by-step for cool futuristic UI
    const tickTimeouts = [1000, 2000, 2800, 3500];
    
    try {
      const customApiKey = localStorage.getItem("gemini_api_key") || "";
      const customModel = localStorage.getItem("gemini_preferred_model") || "gemini-3.1-flash-lite";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) headers["x-gemini-api-key"] = customApiKey;
      if (customModel) headers["x-gemini-model"] = customModel;

      // Call backend API for real Gemini synthesis
      const response = await fetch("/api/analyze-dream", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: transcript,
          emotions: selectedEmotions
        })
      });

      const result = await response.json();
      
      setTimeout(() => {
        const dateStr = new Date().toISOString().split("T")[0];
        const newDream: Dream = {
          id: `dream-${Date.now()}`,
          title: result.title || dreamTitle || "지정되지 않은 제목",
          content: transcript,
          sleepScore: sleepScore,
          vividness: vividness,
          nightmareScore: nightmareScore,
          createdAt: dateStr,
          emotions: selectedEmotions.length > 0 ? selectedEmotions : (result.analysis?.emotion || ["불안"]),
          analysis: result.analysis || {
            people: ["나"],
            location: ["알 수 없음"],
            theme: ["심리적 반사"],
            emotion: selectedEmotions,
            summary: "꿈에 감정이 녹아들어 있습니다. 천천히 무의식을 탐미하세요."
          }
        };

        onSave(newDream);
        setStep("completed");
      }, 4000);

    } catch (e) {
      console.error("AI Dream analysis failed, fallback active:", e);
      // Fallback
      setTimeout(() => {
        const dateStr = new Date().toISOString().split("T")[0];
        const newDream: Dream = {
          id: `dream-${Date.now()}`,
          title: dreamTitle || "기록된 꿈",
          content: transcript,
          sleepScore: sleepScore,
          vividness: vividness,
          nightmareScore: nightmareScore,
          createdAt: dateStr,
          emotions: selectedEmotions,
          analysis: {
            people: ["나"],
            location: ["일상"],
            theme: ["심리적 잔상"],
            emotion: selectedEmotions,
            summary: "일상의 긴장을 해소하고 정서적 균형을 찾으려 하는 내적 투영일 수 있습니다. (참고용 정보입니다.)"
          }
        };
        onSave(newDream);
        setStep("completed");
      }, 4000);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleEmotion = (id: string) => {
    if (selectedEmotions.includes(id)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== id));
    } else {
      setSelectedEmotions([...selectedEmotions, id]);
    }
  };

  return (
    <div id="dream-recorder" className="pb-24 max-w-md mx-auto text-white">
      {/* Step 1: Initial mic page */}
      {step === "ready" && (
        <div id="record-ready-screen" className="flex flex-col items-center px-4 pt-8">
          <div className="w-full flex items-center justify-between mb-8">
            <button id="btn-record-cancel" onClick={onCancel} className="p-2 -ml-2 text-indigo-400">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-xs tracking-widest uppercase text-indigo-400/80 font-mono">STEP 2 / 11 · 꿈 기록</span>
            <div className="w-6 h-6" />
          </div>

          <div className="text-center mt-6 mb-10">
            <span className="text-yellow-400 text-3xl mb-2 block animate-pulse">☀️</span>
            <h2 className="text-2xl font-bold tracking-tight mb-2">좋은 아침입니다</h2>
            <p className="text-sm text-indigo-200/70">어젯밤 꿈은 기억나시나요?</p>
          </div>

          {/* Big Recording Circle */}
          <div className="relative my-6 flex items-center justify-center">
            {/* Pulsing Back Glow */}
            <div className="absolute w-[200px] h-[200px] rounded-full bg-indigo-500/10 animate-ping duration-2000" />
            <div className="absolute w-[160px] h-[160px] rounded-full bg-indigo-600/20 blur-xl" />
            
            <button
              id="btn-trigger-record"
              onClick={startRecording}
              className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 flex flex-col items-center justify-center shadow-2xl border-4 border-indigo-400/30 hover:scale-105 active:scale-95 transition-all outline-none"
            >
              <Mic className="w-12 h-12 mb-2 text-white drop-shadow-md animate-bounce" />
              <span className="text-xs font-bold text-indigo-100">꿈 녹음하기</span>
            </button>
          </div>

          {/* Text Quick write option & Presets */}
          <div className="w-full mt-12 bg-indigo-950/30 rounded-2xl p-5 border border-indigo-900/40 text-center">
            <div className="text-xs text-indigo-400 font-bold mb-3">작성하기 팁</div>
            <p className="text-xs text-indigo-200/50 mb-4">음성 녹음이 쑥스럽거나 텍스트로 바로 적고 싶으실 땐 타이핑 모드를 이용해 보세요.</p>
            
            <button
              id="btn-write-directly"
              onClick={writeDirectly}
              className="py-2.5 px-6 rounded-xl border border-indigo-800 bg-indigo-950/40 hover:bg-indigo-900/40 text-xs font-semibold text-indigo-200 transition-colors w-full"
            >
              키보드로 직접 입력하기 📝
            </button>

            {/* Quick Presets for Demo */}
            <div className="mt-5 border-t border-indigo-950/80 pt-4 text-left">
              <span className="text-[11px] font-bold text-indigo-400 block mb-2">빠른 테스트 샘플 (선택 가능):</span>
              <div className="space-y-2">
                {PRESET_DREAMS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPreset(p)}
                    className="w-full text-left p-2 rounded-lg bg-indigo-950/20 hover:bg-indigo-900/30 border border-indigo-900/20 text-xs flex items-center justify-between"
                  >
                    <span className="truncate text-indigo-300 font-medium">{p.title}</span>
                    <span className="text-[10px] text-indigo-200/40 shrink-0">샘플로 채우기 &gt;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Live simulation of voice recording */}
      {step === "recording" && (
        <div id="recording-active-screen" className="flex flex-col items-center px-4 pt-8">
          <div className="w-full flex justify-between items-center mb-16">
            <div className="w-6 h-6" />
            <span className="text-xs tracking-widest uppercase text-red-400 font-mono animate-pulse flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              녹음 중...
            </span>
            <div className="w-6 h-6" />
          </div>

          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-widest font-mono mb-2">{formatTimer(seconds)}</h1>
            <p className="text-xs text-indigo-300/60">목소리로 지난밤 꿈 속 세밀한 감정과 장면들을 들려주세요.</p>
          </div>

          {/* Sound wave visualizer bars */}
          <div className="flex justify-center items-end space-x-1.5 h-32 w-full max-w-[240px] mb-8">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}px` }}
                className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-300 transition-all duration-100"
              />
            ))}
          </div>

          {/* Real-time transcribed text display */}
          <div className="w-full max-w-xs mb-10 px-4 py-3.5 bg-indigo-950/40 rounded-2xl border border-indigo-900/30 text-center min-h-[64px] flex items-center justify-center">
            {transcript ? (
              <p className="text-[13px] text-indigo-100 font-medium leading-relaxed italic">
                "{transcript}"
              </p>
            ) : (
              <p className="text-xs text-indigo-300/40 animate-pulse font-medium">
                말씀하시면 여기에 실시간으로 자막이 직접 나타납니다... 🎙️
              </p>
            )}
          </div>

          {/* Pause Button */}
          <button
            id="btn-stop-recording"
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-red-600 shadow-xl border-4 border-red-400/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-white"
          >
            <Square className="w-7 h-7 fill-white" />
          </button>
          <span className="text-xs text-red-200/60 mt-3 font-semibold">녹음 정지</span>
        </div>
      )}

      {/* Step 3: Text Conversion & Suggestions */}
      {step === "text_editing" && (
        <div id="text-edit-screen" className="px-5 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep("ready")} className="p-2 -ml-2 text-indigo-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-indigo-300">STEP 4 · 텍스트 변환 및 편집</span>
            <button
              onClick={handleNextFromText}
              className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-3 py-1.5 rounded-lg border border-indigo-800 hover:bg-indigo-950"
            >
              다음
            </button>
          </div>

          <div className="mb-5 bg-indigo-900/20 border border-indigo-950 rounded-2xl p-4">
            <label className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold block mb-2">제목 (AI 추천 또는 입력)</label>
            <input
              id="input-dream-title"
              type="text"
              value={dreamTitle}
              onChange={(e) => setDreamTitle(e.target.value)}
              placeholder="예: 어두운 숲속의 미로"
              className="w-full bg-[#080B1B] text-sm text-white rounded-xl py-3 px-4 outline-none border border-indigo-900/60 focus:border-indigo-500 font-sans font-medium"
            />
          </div>

          <div className="bg-indigo-900/20 border border-indigo-950 rounded-2xl p-4">
            <label className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold block mb-2">꿈 기록 내용</label>
            <textarea
              id="input-dream-content"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="이곳에 꿈속에서 일어난 세밀한 스토리라인을 직접 타이핑하여 기록해 보세요..."
              rows={8}
              className="w-full bg-[#080B1B] text-sm leading-relaxed text-indigo-100 rounded-xl py-3 px-4 border border-indigo-900/50 focus:border-indigo-500 outline-none resize-none font-sans"
            />
            <p className="text-[10px] text-indigo-400/60 mt-1">💡 등장인물, 장소, 사소한 단서도 세세하게 기록하면 분석의 정밀도가 올라갑니다.</p>
            <p className="text-[10px] text-indigo-300/40 mt-1 flex items-center gap-1">🔑 개인 Google AI Studio API 키 발급 가이드는 <strong className="text-indigo-400/60">"마이 프로필"</strong> 탭에서 편리하게 확인하실 수 있습니다.</p>
          </div>

          <div className="mt-8">
            <button
              id="btn-text-next"
              onClick={handleNextFromText}
              className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
            >
              <span>다음과정 감정 선택으로</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Emotion Select Grid */}
      {step === "emotion_select" && (
        <div id="emotion-select-screen" className="px-5 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep("text_editing")} className="p-2 -ml-2 text-indigo-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-indigo-300">STEP 5 · 주된 감정 선택</span>
            <button
              onClick={handleNextFromEmotion}
              className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-3 py-1.5 rounded-lg border border-indigo-800 hover:bg-indigo-950"
            >
              다음
            </button>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-1">이 꿈에서 가장 강한 감정은?</h3>
            <p className="text-xs text-indigo-300/60">복수 선택 가능</p>
          </div>

          {/* Grids */}
          <div className="grid grid-cols-3 gap-3 my-6">
            {EMOTIONS.map((e) => {
              const isSelected = selectedEmotions.includes(e.id);
              return (
                <button
                  key={e.id}
                  id={`emotion-badge-${e.id}`}
                  onClick={() => toggleEmotion(e.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? "border-indigo-400 bg-indigo-900/60 saturate-120 scale-105" 
                      : `${e.color} saturate-75 opacity-70 hover:opacity-100`
                  }`}
                >
                  <span className="text-3xl mb-2">{e.emoji}</span>
                  <span className="text-xs font-semibold">{e.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              id="btn-emotion-next"
              onClick={handleNextFromEmotion}
              disabled={selectedEmotions.length === 0}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                selectedEmotions.length > 0 
                  ? "bg-indigo-600 hover:bg-indigo-500" 
                  : "bg-indigo-950 border border-indigo-900/40 text-indigo-300/40 cursor-not-allowed"
              }`}
            >
              <span>추가 정보 입력으로</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Additional Info (Nightmare Rate & Vividness) */}
      {step === "additional_info" && (
        <div id="additional-info-screen" className="px-5 pt-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep("emotion_select")} className="p-2 -ml-2 text-indigo-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-indigo-400">STEP 6 · 세부 정보 입력</span>
            <div className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-1">추가 정보를 완성해주세요</h3>
            <p className="text-xs text-indigo-300/60">더 상세한 통계 리포트 생성을 돕습니다.</p>
          </div>

          {/* Nightmare intensity slider/row */}
          <div className="mb-8 bg-indigo-950/40 rounded-2xl p-5 border border-indigo-900/30">
            <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-4">
              <Flame className="w-4 h-4 text-orange-400" />
              악몽 빈도 및 스트레스 강도는?
            </label>
            <div className="flex justify-between items-center px-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setNightmareScore(lvl)}
                  type="button"
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${
                    nightmareScore === lvl
                      ? "bg-gradient-to-tr from-amber-600 to-red-500 border-white text-white scale-110 shadow-lg"
                      : "bg-[#0B0D1B] border-indigo-900 text-indigo-300/60 hover:border-indigo-400"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-indigo-400/70 mt-3 px-2 font-semibold">
              <span>아주 약함 🙂</span>
              <span>매우 힘든 악몽 😨</span>
            </div>
          </div>

          {/* Vividness Index Rating */}
          <div className="mb-8 bg-indigo-950/40 rounded-2xl p-5 border border-indigo-900/30">
            <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-4">
              <Star className="w-4 h-4 text-yellow-400" />
              얼마나 생생하게 기억나나요?
            </label>
            <div className="flex justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setVividness(star)}
                  type="button"
                  className="transition-transform active:scale-90"
                >
                  <Star 
                    className={`w-9 h-9 ${
                      star <= vividness ? "fill-yellow-400 text-yellow-400 filter drop-shadow-md" : "text-indigo-950 fill-indigo-950 stroke-indigo-800"
                    }`} 
                  />
                </button>
              ))}
            </div>
            <div className="text-center text-[11px] text-yellow-300/70 mt-3 font-semibold">
              {vividness === 1 && "희미해요 🌫️"}
              {vividness === 2 && "듬성듬성 기억나요 🤔"}
              {vividness === 3 && "평범하게 생각나요 📝"}
              {vividness === 4 && "선명하게 기억나요 🌟"}
              {vividness === 5 && "현실처럼 생생해요 🔥"}
            </div>
          </div>

          {/* Sleep Score Rating */}
          <div className="mb-8 bg-indigo-950/40 rounded-2xl p-5 border border-indigo-900/30">
            <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-4">
              <Clock className="w-4 h-4 text-emerald-400" />
              어젯밤 수면 만족도 (개운한 정도)?
            </label>
            <div className="flex justify-between items-center px-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSleepScore(s)}
                  type="button"
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    sleepScore === s
                      ? "bg-indigo-500 border-indigo-300 text-white scale-105"
                      : "bg-[#0B0D1B] border-indigo-950 text-indigo-300/40 hover:border-indigo-800"
                  }`}
                >
                  {s}점
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              id="btn-recorder-save"
              onClick={handleSaveAndAnalyze}
              className="w-full py-4 text-base font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-black/40 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>꿈 분석 및 저장하기 (AI 리포트)</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Beautiful AI analyzing simulation view with ticks */}
      {step === "ai_analyzing" && (
        <div id="ai-processing-screen" className="px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-12">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-900 border-t-indigo-400 animate-spin flex items-center justify-center" />
            <Sparkles className="w-8 h-8 text-indigo-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>

          <h3 className="text-xl font-bold mb-2 text-indigo-100">저장 중입니다 🌙</h3>
          <p className="text-sm text-indigo-200/50 mb-10">AI가 당신의 무의식을 심층적으로 조망하고 있습니다.</p>

          {/* Sequential items */}
          <div className="w-full max-w-xs text-left bg-indigo-950/40 border border-indigo-900/30 p-5 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-indigo-100/90 font-medium">인물 추출 중...</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center animate-pulse">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-indigo-100/90 font-medium">장소 상징물 분석 중...</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800/40 animate-pulse" />
              <span className="text-indigo-300/50">정서 및 핵심 감정 맵핑 중...</span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800/40" />
              <span className="text-indigo-300/40">장기 반복 수면 패턴 탐색 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
