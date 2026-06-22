import { useState, useEffect } from "react";
import { Dream } from "./types";
import { initialDreams } from "./mockData";
import { Moon, Sparkles, MessageCircle, Mic, Plus, HelpCircle, Eye } from "lucide-react";
import Onboarding from "./components/Onboarding";
import BottomNav from "./components/BottomNav";
import DreamRecorder from "./components/DreamRecorder";
import DreamList from "./components/DreamList";
import DreamDetail from "./components/DreamDetail";
import DreamReport from "./components/DreamReport";
import DreamCalendar from "./components/DreamCalendar";
import MyProfile from "./components/MyProfile";
import { motion, AnimatePresence } from "motion/react";
import { THEME_STYLES, ThemeStyle } from "./theme";

// Feature imports
import SymbolDictionary from "./components/SymbolDictionary";
import DreamPlaza from "./components/DreamPlaza";

export default function App() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("home"); // "home" | "logs" | "analysis" | "calendar" | "profile"
  const [appTheme, setAppTheme] = useState<string>("cosmic");
  
  // High fidelity flow states
  const [isRecordingNewDream, setIsRecordingNewDream] = useState<boolean>(false);
  const [selectedDreamForDetails, setSelectedDreamForDetails] = useState<Dream | null>(null);
  const [isAnalysisUnlocked, setIsAnalysisUnlocked] = useState<boolean>(false);
  const [initialLaunchDate, setInitialLaunchDate] = useState<string>("");
  const [subconsciousLabView, setSubconsciousLabView] = useState<"symbol" | "plaza" | null>(null);
  const [randomShuffleDream, setRandomShuffleDream] = useState<Dream | null>(null);
  const [selectedSymbolWord, setSelectedSymbolWord] = useState<{ word: string; meaning: string } | null>(null);

  // Initialize data on start
  useEffect(() => {
    // Check onboarding completed state
    const onboarded = localStorage.getItem("dream_mirror_onboarded_v1");
    if (onboarded === "true") {
      setHasCompletedOnboarding(true);
    }

    // Load active theme
    const savedTheme = localStorage.getItem("dream_mirror_app_theme");
    if (savedTheme && THEME_STYLES[savedTheme]) {
      setAppTheme(savedTheme);
    }

    // Check unlocked analysis state
    const unlockedStat = localStorage.getItem("dream_mirror_analyzed_unlocked");
    if (unlockedStat === "true") {
      setIsAnalysisUnlocked(true);
    }

    // Check dreams collection in indexDB / localStorage
    const saved = localStorage.getItem("dream_mirror_dreams_v1");
    if (saved) {
      try {
        setDreams(JSON.parse(saved));
      } catch {
        setDreams(initialDreams);
        localStorage.setItem("dream_mirror_dreams_v1", JSON.stringify(initialDreams));
      }
    } else {
      setDreams(initialDreams);
      localStorage.setItem("dream_mirror_dreams_v1", JSON.stringify(initialDreams));
    }
  }, []);

  const saveDreamsToLocal = (updatedList: Dream[]) => {
    setDreams(updatedList);
    localStorage.setItem("dream_mirror_dreams_v1", JSON.stringify(updatedList));
  };

  // Skip or complete onboarding
  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem("dream_mirror_onboarded_v1", "true");
  };

  const handleAddNewDream = (newDream: Dream) => {
    const updated = [newDream, ...dreams];
    saveDreamsToLocal(updated);
    setIsRecordingNewDream(false);
    setSelectedDreamForDetails(newDream); // immediately inspect the awesome AI output!
  };

  const handleUpdateDream = (updatedDream: Dream) => {
    const updated = dreams.map((d) => (d.id === updatedDream.id ? updatedDream : d));
    saveDreamsToLocal(updated);
    setSelectedDreamForDetails(updatedDream);
  };

  const handleDeleteDream = (id: string) => {
    const updated = dreams.filter((d) => d.id !== id);
    saveDreamsToLocal(updated);
    setSelectedDreamForDetails(null);
    setActiveTab("logs");
  };

  const handleTriggerAdUnlock = () => {
    setIsAnalysisUnlocked(true);
    localStorage.setItem("dream_mirror_analyzed_unlocked", "true");
  };

  const handleResetData = () => {
    saveDreamsToLocal(initialDreams);
    setIsAnalysisUnlocked(false);
    localStorage.removeItem("dream_mirror_analyzed_unlocked");
    localStorage.removeItem("dream_mirror_cached_report_state");
    localStorage.removeItem("dream_mirror_cached_gpt_overview");
    localStorage.removeItem("dream_mirror_cached_analyzed_dream_ids");
    setActiveTab("home");
    setSelectedDreamForDetails(null);
  };

  const handleBackToOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem("dream_mirror_onboarded_v1");
  };

  // Unlock analytics automatically if they have 5+ dreams naturally
  const isUnlockedNaturally = isAnalysisUnlocked || dreams.length >= 5;
  const theme = THEME_STYLES[appTheme] || THEME_STYLES.cosmic;

  return (
    <div 
      id="app-root-container"
      className={`min-h-screen flex flex-col font-sans select-none antialiased relative transition-colors duration-500 overflow-x-hidden ${theme.appBg}`}
    >
      {/* Background Starry Glimmer overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,33,88,0.18),transparent_60%)] pointer-events-none" />

      {/* Show onboarding slider first if not dismissed */}
      {!hasCompletedOnboarding && (
        <Onboarding onComplete={handleCompleteOnboarding} />
      )}

      {/* Primary Container Shell */}
      {hasCompletedOnboarding && (
        <div className={`flex-1 flex flex-col w-full max-w-md mx-auto min-h-screen shadow-2xl relative pb-28 border-x transition-colors duration-500 ${theme.containerBg} ${theme.borderBase}`}>
          
          {/* Main Top Header Block */}
          {!isRecordingNewDream && !selectedDreamForDetails && (
            <header className={`px-5 py-4 border-b flex items-center justify-between sticky top-0 z-30 transition-colors duration-500 ${theme.headerBg} ${theme.borderBase}`}>
              <div className="flex items-center space-x-2">
                <Moon className={`w-5 h-5 rotate-12 ${theme.id === "zen" ? "text-stone-800" : "text-indigo-400"}`} />
                <span className={`font-sans font-black text-lg tracking-tight ${theme.id === "zen" ? "text-stone-950 font-black" : "bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent"}`}>
                  DreamMirror
                </span>
              </div>
              <div className={`flex items-center space-x-2 text-[10px] font-bold px-3 py-1 rounded-full border ${theme.badgeBg}`}>
                <Sparkles className={`w-3 h-3 animate-spin mr-1 ${theme.id === "zen" ? "text-stone-600" : "text-indigo-400"}`} />
                AI 성찰 구동
              </div>
            </header>
          )}

          {/* Router Stage views with Animate Presence */}
          <main className="flex-1">
            {isRecordingNewDream ? (
              <DreamRecorder
                onSave={handleAddNewDream}
                onCancel={() => setIsRecordingNewDream(false)}
                existingDreamCount={dreams.length}
                theme={theme}
              />
            ) : selectedDreamForDetails ? (
              <DreamDetail
                dream={selectedDreamForDetails}
                onBack={() => setSelectedDreamForDetails(null)}
                onDelete={handleDeleteDream}
                onUpdate={handleUpdateDream}
                theme={theme}
              />
            ) : (
              <div className="fade-in">
                {activeTab === "home" && (
                  <div className={`px-5 pt-6 pb-20 space-y-6 ${theme.id === "cosmic" ? "space-y-8" : "space-y-6"}`}>
                    
                    {/* [시안 2] 네온 보이지 (Neon Voyage - neo-aura) 전용: 최상단 AI 한눈에 요약 위젯 */}
                    {theme.id === "neo-aura" && (
                      <div className="p-5 rounded-2xl bg-[#141021] border-2 border-[#d946ef]/30 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-violet-500/15 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#f472b6] font-mono flex items-center gap-1.5 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI UNCONSCIOUS TELEMETRY
                          </h4>
                          <span className="text-[10px] py-0.5 px-2 bg-pink-950/50 text-[#f472b6] border border-pink-900/40 rounded font-mono font-bold">
                            CALIBRATED ACTIVE
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3.5 mb-4">
                          <div className="bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <span className="text-[10px] text-zinc-500 block">무의식 조화도</span>
                            <span className="text-lg font-black text-rose-400 font-mono">89.2%</span>
                            <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-[#f43f5e]" style={{ width: "89%" }} />
                            </div>
                          </div>
                          
                          <div className="bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <span className="text-[10px] text-zinc-500 block">선명도 모멘텀</span>
                            <span className="text-lg font-black text-fuchsia-400 font-mono">Lv. {dreams.length > 0 ? (dreams.reduce((acc, current) => acc + current.vividness, 0) / dreams.length).toFixed(1) : "0.0"}</span>
                            <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-fuchsia-500 animate-pulse" style={{ width: `${dreams.length > 0 ? (dreams.reduce((acc, curr) => acc + curr.vividness, 0) / (dreams.length * 5)) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Recent 3-day dynamic sparkline index (Small interactive SVG) */}
                        <div className="bg-black/30 p-3 rounded-xl border border-zinc-900 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-zinc-400 block font-bold leading-none mb-1">최근 무의식 주기 트렌드</span>
                            <span className="text-[11px] text-[#f472b6] font-black">{dreams.length}개 조각 디코드 완료</span>
                          </div>
                          {/* Beautiful Micro sparkline graph */}
                          <div className="h-7 w-20">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
                              <path
                                d={dreams.length > 1 
                                  ? `M ${dreams.slice(-5).map((dr, idx) => `${(idx / Math.max(1, dreams.slice(-5).length - 1)) * 100} ${30 - (dr.vividness * 5)}`).join(" L ")}`
                                  : "M 0 15 L 25 10 L 50 20 L 75 5 L 100 15"
                                }
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_0_4px_rgba(244,63,94,0.5)]"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* [시안 3] 드림 스토리 저널 (Dream Story Journal - zen) 전용: 책 표지식 캘린더 및 슬라이더 */}
                    {theme.id === "zen" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-stone-950 font-serif">무의식 서재의 서적들 (Journal Slipcases)</h4>
                          <span className="text-[11px] font-black text-stone-700">옆으로 쓸어 정독하기 &rarr;</span>
                        </div>
                        
                        {/* Beautiful horizontal book collection slider */}
                        <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none px-1">
                          {dreams.length > 0 ? (
                            dreams.slice(0, 5).map((dr) => (
                              <div
                                key={dr.id}
                                onClick={() => setSelectedDreamForDetails(dr)}
                                className="snap-start shrink-0 w-[130px] h-[200px] rounded-r-xl bg-[#F6F2E9] border border-stone-300 shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between p-3.5 relative group overflow-hidden"
                                style={{
                                  boxShadow: "2px 4px 10px rgba(45,42,38,0.12), inset 8px 0 12px rgba(45,42,38,0.06)"
                                }}
                              >
                                {/* Textured paper look */}
                                <div className="absolute inset-0 bg-stone-950/[0.02] pointer-events-none" />
                                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-[#E6DEC9] border-r border-[#D5CBAA]" />
                                
                                <div className="pl-2.5">
                                  <div className="text-[10px] font-black text-stone-650 font-serif leading-none mt-1">
                                    {dr.createdAt.split("-")[1]}.{dr.createdAt.split("-")[2]}
                                  </div>
                                  <div className="text-xs font-black text-stone-950 font-serif leading-snug line-clamp-3 mt-2 pr-1 group-hover:text-stone-900 transition-colors">
                                    {dr.title}
                                  </div>
                                </div>

                                <div className="pl-2.5 flex flex-col justify-end">
                                  <div className="w-5 h-0.5 bg-stone-350 my-2" />
                                  <span className="text-[10px] font-serif text-stone-800 font-bold truncate">
                                    {dr.emotions[0] || "공허"}의 서
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            /* Placeholder beautiful empty vintage journals */
                            [1, 2, 3].map((val) => (
                              <div
                                key={val}
                                className="snap-start shrink-0 w-[130px] h-[200px] rounded-r-xl bg-[#FAF7F0] border border-stone-300 shadow-xs flex flex-col justify-between p-3.5 relative"
                                style={{
                                  boxShadow: "2px 4px 8px rgba(45,42,38,0.05), inset 8px 0 8px rgba(45,42,38,0.03)"
                                }}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-stone-300" />
                                <div className="pl-2.5">
                                  <div className="text-[10px] font-sans text-stone-605 font-bold">Vol. 0{val}</div>
                                  <div className="text-xs font-black text-stone-800 font-serif leading-snug mt-2">
                                    {val === 1 ? "아직 쓰이지 않은 심상" : val === 2 ? "새겨질 기록의 여백" : "조용히 기다리는 잠"}
                                  </div>
                                </div>
                                <div className="pl-2.5 text-[9px] font-serif text-stone-600 font-black">
                                  DreamMirror
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hero Morning Card Step 2 */}
                    <div className={`p-6 rounded-3xl relative overflow-hidden shadow-xl border transition-all ${
                      theme.id === "zen" 
                        ? "bg-gradient-to-tr from-[#F2EDE1] via-[#FAF7F0] to-[#FAF7F0] border-stone-250 p-7 shadow-xs" 
                        : theme.id === "neo-aura"
                          ? "bg-[#181423] border-[#d946ef]/20"
                          : "bg-gradient-to-tr from-[#13173D] via-[#101438] to-[#0D102C] border-indigo-500/10 p-8 md:p-9 rounded-[32px] shadow-2xl" /* [시안 1] 미니멀 아우라: 극대 여백으로 커진 패딩과 두꺼운 기하학 라운딩 */
                    }`}>
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Moon className={`w-24 h-24 ${theme.id === "zen" ? "text-stone-800" : "text-indigo-300"}`} />
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-2xl mb-1.5 block">⛅</span>
                        <h1 className={`tracking-tight ${
                          theme.id === "zen" 
                            ? "text-xl text-stone-950 font-black font-serif mb-2" 
                            : theme.id === "cosmic"
                              ? "text-2xl font-black text-white mb-3" /* [시안 1] 미니멀 아우라: 커진 타이틀 폰트크기 */
                              : "text-xl font-bold text-white mb-2"
                        }`}>
                          어젯밤 꿈, 기록하기
                        </h1>
                        
                        {/* 텍스트 밀도 50% 축소 옵션 (미니멀 아우라일 때 서브텍스트 극도로 슬림화) */}
                        <p className={`leading-relaxed font-medium ${
                          theme.id === "cosmic"
                            ? "text-[12px] text-indigo-305/45 font-sans" /* 미니멀아우라: 텍스트 밝기와 설명 밀도 50% 축소 지향 */
                            : theme.id === "zen"
                              ? "text-[13px] text-stone-600 font-serif leading-loose" 
                              : "text-[13px] text-indigo-200/80 font-sans"
                        }`}>
                          꿈 속 등장하는 상징물들은 당신의 억눌린 심리 혹은 기대를 상기시킵니다.
                        </p>
                      </div>
 
                      {/* AI Dream analytics ready indicators */}
                      <div className={`my-5 p-4 rounded-2xl border ${theme.id === "zen" ? "bg-white border-stone-200 shadow-sm" : "bg-black/25 border-indigo-950"}`}>
                        <div className={`flex justify-between items-center mb-2 text-xs ${theme.textSecondary}`}>
                          <span className="flex items-center gap-1.5 font-bold">
                            <Sparkles className={`w-3.5 h-3.5 animate-pulse ${theme.id === "zen" ? "text-amber-850" : "text-indigo-400"}`} />
                            최근 꿈 축적도
                          </span>
                          <span className="font-mono font-bold text-[13px]">{dreams.length} / 5</span>
                        </div>
                        
                        <div className={`w-full h-2.5 rounded-full overflow-hidden border ${theme.id === "zen" ? "bg-stone-100 border-stone-200/50" : "bg-slate-900 border-indigo-950"}`}>
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              theme.id === "zen"
                                ? "bg-stone-800"
                                : theme.id === "neo-aura"
                                  ? "bg-gradient-to-r from-[#d946ef] to-[#ec4899]"
                                  : "bg-gradient-to-r from-indigo-500 to-indigo-400"
                            }`} 
                            style={{ width: `${Math.min((dreams.length / 5) * 100, 100)}%` }}
                          />
                        </div>
 
                        <div className={`flex justify-between text-[10px] mt-2 font-bold ${theme.textSecondary}`}>
                          <span>최소 5개 입력</span>
                          <span>{dreams.length >= 5 ? "종합 분석 보고서 사용 가능 🎉" : "추가 기록 시 분석 리포트 오픈"}</span>
                        </div>
                      </div>
 
                      {/* Mic Button triggers step 3 (최소 높이 확대 -> p-4.5) */}
                      <button
                        id="btn-recorder-trigger"
                        onClick={() => setIsRecordingNewDream(true)}
                        className={`w-full font-black flex items-center justify-center space-x-2 text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer ${
                          theme.id === "cosmic" 
                            ? "py-4.5 rounded-[22px] text-base" /* 미니멀아우라: 큼직한 터치 영역 및 듬직하고 시원한 버튼 */
                            : "py-4 rounded-2xl"
                        } ${theme.accentBtn}`}
                      >
                        <Mic className="w-4.5 h-4.5 shrink-0" />
                        <span>오늘의 꿈 기록 시작하기</span>
                      </button>
                    </div>

                    {/* UX ROADMAP 3 & 4 단계: Interactive Playground Zone */}
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div className="flex justify-between items-center px-1">
                        <h3 className={`text-xs font-black uppercase tracking-wider font-mono ${theme.accentText}`}>키워드로 꿈 알아보기</h3>
                    
                      </div>

                      {/* Bubbles Curation (Roadmap Item 4) */}
                      <div className={`p-4 rounded-[28px] border ${theme.cardBg} space-y-3`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black ${theme.id === "zen" ? "text-stone-700" : "text-indigo-200"}`}>🔮 키워드 큐레이션</span>
                          <span className={`text-[9px] ${theme.textMuted} font-mono`}>터치해서 상징 뜻 풀이</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {[
                            { word: "비행 🕊️", meaning: "자유, 소원 성취의 표현이거나 바쁜 현실 세계로부터 탈출하고 싶은 영혼의 포부입니다." },
                            { word: "시험 📝", meaning: "준비되지 않은 느낌, 평가받는 불안감 또는 다가올 인생 관문의 중압감을 뜻합니다." },
                            { word: "바다 🌊", meaning: "심층에 숨겨진 거대한 감정과 무의식의 영역으로 지혜나 창의성의 확장을 예견합니다." },
                            { word: "미로 🌀", meaning: "현재 정신적/심리적 방황 시기이거나 풀리지 않는 일상의 선택을 고민하고 있음을 상징합니다." },
                            { word: "추락 🪂", meaning: "통제력을 잃을 것 같은 불안, 삶의 지탱 수준이 약해지고 있다는 심리적 거울상입니다." },
                            { word: "열쇠 🔑", meaning: "새로운 기회와 솔루션의 발현상이며, 오랫동안 닫혀있던 자아 비밀을 허물고 여는 계기를 의미합니다." }
                          ].map((sym) => (
                            <button
                              key={sym.word}
                              onClick={() => setSelectedSymbolWord(sym)}
                              className={`text-[11px] font-bold py-1.5 px-3 rounded-full transition-all active:scale-[0.96] hover:scale-[1.03] cursor-pointer border ${theme.badgeBg}`}
                            >
                              {sym.word}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shake to Shuffle (Roadmap Item 3) */}
                      <div className={`p-4 rounded-[28px] border text-center relative overflow-hidden ${
                        theme.id === "zen" ? "bg-amber-50/40 border-stone-250/60" : "bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border-indigo-900/40"
                      }`}>
                        <div className="relative z-10 space-y-2">
                          <span className="text-2xl animate-pulse inline-block">🎲</span>
                          <h4 className={`text-xs font-black ${theme.id === "zen" ? "text-[#1c1917]" : "text-white"}`}>무의식 세션 흔들기 (Shuffle Oracle)</h4>
                          <p className={`text-[11px] font-sans ${theme.textSecondary}`}>기록한 꿈들 중 랜덤하게 요약을 볼 수 있어요.</p>
                          
                          <button
                            onClick={() => {
                              if (dreams.length === 0) {
                                alert("기록된 꿈이 아직 없습니다! 먼저 첫 꿈을 기록해 보세요.");
                                return;
                              }
                              const randomIdx = Math.floor(Math.random() * dreams.length);
                              setRandomShuffleDream(dreams[randomIdx]);
                            }}
                            className={`px-4.5 py-2 font-mono rounded-2xl text-[11px] font-extrabold cursor-pointer border hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-1.5 ${
                              theme.id === "zen" ? "bg-stone-850 text-white border-stone-800" : "bg-[#f43f5e] text-white border-pink-600 shadow-md shadow-pink-500/20"
                            }`}
                          >
                            <span>무작위 주파수 교감 흔들기 </span>
                            <span className="animate-bounce font-mono">🎲</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick overview widget lists of recent dreams */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <h3 className={`text-xs font-black uppercase tracking-wider font-mono ${theme.accentText}`}>가장 최근의 무의식 조각</h3>
                        <button 
                          onClick={() => setActiveTab("logs")}
                          className={`text-[11px] font-black tracking-tight ${theme.accentText} hover:underline`}
                        >
                          전체보기 &gt;
                        </button>
                      </div>

                      <div className="space-y-3">
                        {dreams.slice(0, 3).map((dr) => (
                          <div
                            key={dr.id}
                            id={`home-widget-${dr.id}`}
                            onClick={() => setSelectedDreamForDetails(dr)}
                            className={`p-4 rounded-3xl border flex justify-between items-center cursor-pointer transition-all ${theme.cardBg} ${theme.id === "zen" ? "" : "hover:bg-indigo-950/30"}`}
                          >
                            <div className="truncate pr-3">
                              <span className={`text-[9px] font-bold block font-mono ${theme.textMuted}`}>{dr.createdAt}</span>
                              <h4 className={`text-[13px] font-black mt-1 truncate ${theme.id === "zen" ? "text-stone-900" : "text-indigo-100"}`}>{dr.title}</h4>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1.5 rounded-xl shrink-0 border uppercase font-extrabold ${theme.badgeBg}`}>
                              🔎 엿보기
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily advice banner */}
                    <div className={`p-4 rounded-3xl shadow-sm border flex items-start space-x-3.5 ${
                      theme.id === "zen" 
                        ? "bg-[#FAF7F0] border-stone-200" 
                        : "bg-[#1A182F]/75 border-[#3C2F6E]/30"
                    }`}>
                      <span className="text-lg shrink-0">💡</span>
                      <div>
                        <h4 className={`text-xs font-black mb-1 ${theme.id === "zen" ? "text-stone-900" : "text-[#A594F9]"}`}>무의식 관리 비법</h4>
                        <p className={`text-[11px] leading-relaxed font-sans ${theme.textSecondary}`}>
                          자기 전 30분은 격렬한 매체 시청을 피하고, 가벼운 책을 읽으며 백색소음을 실행해 보세요. 더 평화롭고 상쾌한 아침 수치(🙂)를 마주조우할 수 있습니다.
                        </p>
                      </div>
                    </div>

                    {/* Feature Lab Grid & Active Component Stage */}
                    <div className="mt-6 space-y-4 pb-4">
                      <div className={`border-t my-2 pt-4 ${theme.borderBase}`} />
                      
                      {subconsciousLabView ? (
                        /* Render Selected Lab Component */
                        <div className="space-y-4">
                          <div className={`flex justify-between items-center p-2 rounded-xl border ${theme.id === "zen" ? "bg-[#FAF7F0] border-stone-200" : "bg-[#0E112A]/60 border-indigo-950/40"}`}>
                            <span className={`text-[10px] uppercase font-bold tracking-widest pl-2 font-mono ${theme.accentText}`}>
                              {subconsciousLabView === "symbol" && "📖 원형 상징 백과 사전"}
                              {subconsciousLabView === "plaza" && "🏛️ 익명 무의식 광장 공유"}
                            </span>
                            <button
                              onClick={() => setSubconsciousLabView(null)}
                              className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer border ${theme.badgeBg}`}
                            >
                              ← 연구소 목록
                            </button>
                          </div>

                          <div className="fade-in">
                            {subconsciousLabView === "symbol" && <SymbolDictionary theme={theme} />}
                            {subconsciousLabView === "plaza" && <DreamPlaza userDreams={dreams} theme={theme} />}
                          </div>
                        </div>
                      ) : (
                        /* Render Lab Selection Cards Grid */
                        <div className="space-y-3">
                          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono px-1 ${theme.accentText}`}>
                            🌌 무의식 심층 연구소 (Lab)
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setSubconsciousLabView("symbol")}
                              className={`p-4 rounded-3xl text-left transition-all cursor-pointer group active:scale-[0.98] border ${theme.cardBg}`}
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-115 transition-transform">📖</div>
                              <h4 className={`text-xs font-black ${theme.id === "zen" ? "text-stone-900" : "text-white"}`}>상징 백과사전</h4>
                              <p className={`text-[10px] leading-normal mt-0.5 font-sans font-semibold ${theme.textSecondary}`}>키워드 상징 원형 탐색</p>
                            </button>

                            <button
                              onClick={() => setSubconsciousLabView("plaza")}
                              className={`p-4 rounded-3xl text-left transition-all cursor-pointer group active:scale-[0.98] border ${theme.cardBg}`}
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-115 transition-transform">🏛️</div>
                              <h4 className={`text-xs font-black ${theme.id === "zen" ? "text-stone-900" : "text-white"}`}>익명 게시판</h4>
                              <p className={`text-[10px] leading-normal mt-0.5 font-sans font-semibold ${theme.textSecondary}`}>꿈 공유 보드</p>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "logs" && (
                  <DreamList
                    dreams={dreams}
                    onSelect={setSelectedDreamForDetails}
                    onDelete={handleDeleteDream}
                    theme={theme}
                  />
                )}

                {activeTab === "analysis" && (
                  <DreamReport
                    dreams={dreams}
                    onTriggerAd={handleTriggerAdUnlock}
                    isUnlocked={isUnlockedNaturally}
                    theme={theme}
                  />
                )}

                {activeTab === "calendar" && (
                  <DreamCalendar
                    dreams={dreams}
                    onSelectDream={setSelectedDreamForDetails}
                    onAddNewDreamWithDate={(dateStr) => {
                      setIsRecordingNewDream(true);
                    }}
                    theme={theme}
                  />
                )}

                {activeTab === "profile" && (
                  <MyProfile
                    totalDreams={dreams.length}
                    unlocked={isUnlockedNaturally}
                    onResetMocks={handleResetData}
                    onBackToOnboarding={handleBackToOnboarding}
                    appTheme={appTheme}
                    setAppTheme={setAppTheme}
                    theme={theme}
                  />
                )}
              </div>
            )}
          </main>

          {/* Fixed bottom navigation panel */}
          {!isRecordingNewDream && !selectedDreamForDetails && (
            <BottomNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              analysisUnlocked={isUnlockedNaturally}
              theme={theme}
            />
          )}

          {/* Overlay 1: Real-time Word Symbol Dictionary Lookup Modal (Roadmap item 4) */}
          {selectedSymbolWord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className={`w-full max-w-sm rounded-[36px] p-6.5 border shadow-2xl ${
                theme.id === "zen" ? "bg-[#FAF7F0] border-stone-300 text-stone-900" : "bg-[#0E112A] border-indigo-950 text-white"
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-2xl animate-spin">🔮</span>
                  <div className="text-right">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-905/20 px-2 py-0.5 rounded font-black font-mono">
                      상징 백과사전 연동
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black tracking-tight mb-2">원형 상징: {selectedSymbolWord.word}</h3>
                
                <p className={`text-xs leading-relaxed font-semibold mb-6 ${theme.textSecondary}`}>
                  {selectedSymbolWord.meaning}
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Automate search! Set logs tab and search bar query.
                      const cleanWord = selectedSymbolWord.word.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, "").trim();
                      setActiveTab("logs");
                      setSelectedSymbolWord(null);
                      setTimeout(() => {
                        const inputEl = document.getElementById("dream-search") as HTMLInputElement;
                        if (inputEl) {
                          inputEl.value = cleanWord;
                          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                        }
                      }, 250);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      theme.id === "zen" ? "bg-stone-850 text-white hover:bg-stone-800" : "bg-[#f43f5e] hover:bg-[#ec4899] text-white"
                    }`}
                  >
                    <span>이 상징으로 내 꿈 기록 필터링하기</span>
                    <span>&rarr;</span>
                  </button>

                  <button
                    onClick={() => setSelectedSymbolWord(null)}
                    className={`w-full py-3 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      theme.id === "zen" ? "hover:bg-stone-150 border-stone-250 text-stone-600" : "bg-indigo-950/20 border-indigo-900/40 text-indigo-300/80 hover:bg-indigo-950/50"
                    }`}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay 2: Shake-to-shuffle random oracle (Roadmap item 3) */}
          {randomShuffleDream && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className={`w-full max-w-sm rounded-[36px] p-6.5 border shadow-2xl overflow-y-auto max-h-[90vh] ${
                theme.id === "zen" ? "bg-[#FAF7F0] border-stone-300 text-stone-900" : "bg-[#0E112A] border-indigo-950 text-white"
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-2xl animate-bounce">🎲</span>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black font-mono">
                      무작위 무의식 인공주파수 오라클
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`text-[9px] font-bold block font-mono ${theme.textMuted}`}>기록일자: {randomShuffleDream.createdAt}</span>
                  <h3 className="text-sm font-black tracking-tight mt-1">소환된 무의식: {randomShuffleDream.title || "무제"}</h3>
                </div>

                <div className={`p-4 rounded-2xl mb-4.5 border leading-relaxed text-xs font-serif ${
                  theme.id === "zen" ? "bg-white border-stone-200 text-stone-600" : "bg-black/30 border-indigo-950/50 text-indigo-100"
                }`}>
                  "{randomShuffleDream.content}"
                </div>

                <div className="space-y-1.5 mb-5 text-left">
                  <span className={`text-[10px] font-bold block ${theme.textSecondary}`}>오라클 무의식 처방조언</span>
                  <p className={`text-[11px] leading-relaxed italic ${theme.textSecondary}`}>
                    이 꿈의 선명도는 {randomShuffleDream.vividness}/5 성급입니다. 감정 {randomShuffleDream.emotions.join(", ")} 정취를 보이고 있습니다. 
                    {randomShuffleDream.analysis?.summary || "의식을 무겁게 묶어두는 감정을 털어버리고 맑은 아침 정서를 가다듬으세요."}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedDreamForDetails(randomShuffleDream);
                      setRandomShuffleDream(null);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer text-center ${
                      theme.id === "zen" ? "bg-stone-850 text-white hover:bg-stone-800" : "bg-indigo-600 hover:bg-indigo-550 text-white"
                    }`}
                  >
                    이 꿈 세부 심층분석 보기
                  </button>

                  <button
                    onClick={() => {
                      // pick a new random one
                      const idx = Math.floor(Math.random() * dreams.length);
                      setRandomShuffleDream(dreams[idx]);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      theme.id === "zen" ? "hover:bg-stone-150 border-stone-250 text-stone-600" : "bg-indigo-950/20 border-indigo-900/40 text-indigo-300/80 hover:bg-indigo-950/50"
                    }`}
                  >
                    🎲 다른 꿈으로 다시 흔들기
                  </button>

                  <button
                    onClick={() => setRandomShuffleDream(null)}
                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-400 py-1 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
