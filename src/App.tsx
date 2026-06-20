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

// Feature imports
import AuraGarden from "./components/AuraGarden";
import SymbolDictionary from "./components/SymbolDictionary";
import DreamPlaza from "./components/DreamPlaza";
import WindDownPlayer from "./components/WindDownPlayer";

export default function App() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("home"); // "home" | "logs" | "analysis" | "calendar" | "profile"
  
  // High fidelity flow states
  const [isRecordingNewDream, setIsRecordingNewDream] = useState<boolean>(false);
  const [selectedDreamForDetails, setSelectedDreamForDetails] = useState<Dream | null>(null);
  const [isAnalysisUnlocked, setIsAnalysisUnlocked] = useState<boolean>(false);
  const [initialLaunchDate, setInitialLaunchDate] = useState<string>("");
  const [subconsciousLabView, setSubconsciousLabView] = useState<"garden" | "symbol" | "plaza" | "audio" | null>(null);

  // Initialize data on start
  useEffect(() => {
    // Check onboarding completed state
    const onboarded = localStorage.getItem("dream_mirror_onboarded_v1");
    if (onboarded === "true") {
      setHasCompletedOnboarding(true);
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
    if (confirm("데모 분석 데이터(꿈 4개)로 아카이브를 리셋하시겠습니까?\n이전의 신규 추가는 지워집니다.")) {
      saveDreamsToLocal(initialDreams);
      setIsAnalysisUnlocked(false);
      localStorage.removeItem("dream_mirror_analyzed_unlocked");
      localStorage.removeItem("dream_mirror_cached_report_state");
      localStorage.removeItem("dream_mirror_cached_gpt_overview");
      localStorage.removeItem("dream_mirror_cached_analyzed_dream_ids");
      setActiveTab("home");
      setSelectedDreamForDetails(null);
    }
  };

  const handleBackToOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem("dream_mirror_onboarded_v1");
  };

  // Unlock analytics automatically if they have 5+ dreams naturally
  const isUnlockedNaturally = isAnalysisUnlocked || dreams.length >= 5;

  return (
    <div 
      id="app-root-container"
      className="min-h-screen bg-[#070914] text-white flex flex-col font-sans select-none antialiased relative selection:bg-indigo-500/30 overflow-x-hidden"
    >
      {/* Background Starry Glimmer overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,33,88,0.22),transparent_60%)] pointer-events-none" />

      {/* Show onboarding slider first if not dismissed */}
      {!hasCompletedOnboarding && (
        <Onboarding onComplete={handleCompleteOnboarding} />
      )}

      {/* Primary Container Shell */}
      {hasCompletedOnboarding && (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto bg-[#0B0D1B] min-h-screen shadow-2xl relative pb-28 border-x border-indigo-950/20">
          
          {/* Main Top Header Block */}
          {!isRecordingNewDream && !selectedDreamForDetails && (
            <header className="px-5 py-4 border-b border-indigo-950/60 flex items-center justify-between bg-[#0E112A]/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5 text-indigo-400 rotate-12" />
                <span className="font-sans font-black text-lg tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
                  DreamMirror
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-spin mr-1" />
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
              />
            ) : selectedDreamForDetails ? (
              <DreamDetail
                dream={selectedDreamForDetails}
                onBack={() => setSelectedDreamForDetails(null)}
                onDelete={handleDeleteDream}
                onUpdate={handleUpdateDream}
              />
            ) : (
              <div className="fade-in">
                {activeTab === "home" && (
                  <div className="px-5 pt-6 pb-20 space-y-6">
                    {/* Hero Morning Card Step 2 */}
                    <div className="bg-gradient-to-tr from-[#13173D] via-[#101438] to-[#0D102C] border border-indigo-500/10 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Moon className="w-24 h-24 text-indigo-300" />
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-yellow-400 text-2xl mb-1.5 block">⛅</span>
                        <h1 className="text-xl font-bold text-white mb-1.5 tracking-tight">어젯밤 꿈, 늦기 전에 비춰보세요</h1>
                        <p className="text-xs text-indigo-300/60 leading-relaxed font-sans font-medium">
                          꿈 속 등장하는 자잘한 동물, 가족과의 갈등, 상징물들은 당신의 억눌린 심리 혹은 기대를 상기시킵니다.
                        </p>
                      </div>

                      {/* AI Dream analytics ready indicators */}
                      <div className="my-5 bg-[#0B0D1B] p-4 rounded-2xl border border-indigo-950">
                        <div className="flex justify-between items-center mb-1.5 text-xs text-indigo-300">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            최근 아카이빙 축적도
                          </span>
                          <span className="font-mono font-bold">{dreams.length} / 5</span>
                        </div>
                        
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-indigo-950">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((dreams.length / 5) * 100, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[9px] text-[#5c608f] mt-2 font-bold">
                          <span>최소 5개 입력</span>
                          <span>{dreams.length >= 5 ? "종합 분석 보고서 사용 가능 🎉" : "추가 기록 시 분석 리포트 오픈"}</span>
                        </div>
                      </div>

                      {/* Mic Button triggers step 3 */}
                      <button
                        id="btn-recorder-trigger"
                        onClick={() => setIsRecordingNewDream(true)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-bold flex items-center justify-center space-x-2 text-sm shadow-xl cursor-pointer"
                      >
                        <Mic className="w-4.5 h-4.5" />
                        <span>오늘의 꿈 기록 시작하기</span>
                      </button>
                    </div>

                    {/* Quick overview widget lists of recent dreams */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">가장 최근의 무의식 조각</h3>
                        <button 
                          onClick={() => setActiveTab("logs")}
                          className="text-[11px] text-indigo-400/80 hover:text-indigo-300 transition-colors"
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
                            className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 hover:border-indigo-800 transition-all flex justify-between items-center cursor-pointer"
                          >
                            <div className="truncate pr-3">
                              <span className="text-[9px] font-bold text-indigo-400/60 block font-mono">{dr.createdAt}</span>
                              <h4 className="text-xs font-black text-indigo-200 mt-0.5 truncate">{dr.title}</h4>
                            </div>
                            <span className="text-[10px] px-2 py-1 bg-indigo-950 border border-indigo-800/60 text-indigo-300 rounded-lg shrink-0">
                              🔎 엿보기
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily advice banner */}
                    <div className="bg-[#1A182F] border border-[#3C2F6E]/30 p-4 rounded-2xl flex items-start space-x-3">
                      <span className="text-base">💡</span>
                      <div>
                        <h4 className="text-xs font-bold text-[#A594F9] mb-1">무의식 관리 비법</h4>
                        <p className="text-[10px] leading-relaxed text-[#D2C8E9]">
                          자기 전 30분은 격렬한 매체 시청을 피하고, 가벼운 책을 읽으며 백색소음을 실행해 보세요. 더 평화롭고 상쾌한 아침 수치(🙂)를 마주조우할 수 있습니다.
                        </p>
                      </div>
                    </div>

                    {/* Feature Lab Grid & Active Component Stage */}
                    <div className="mt-6 space-y-4 pb-4">
                      <div className="border-t border-indigo-950/40 my-2 pt-4" />
                      
                      {subconsciousLabView ? (
                        /* Render Selected Lab Component */
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-[#0E112A]/60 p-2 rounded-xl border border-indigo-950/40">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#A594F9]/80 font-mono pl-2">
                              {subconsciousLabView === "garden" && "🌳 오라 컬러 정원 가꾸기"}
                              {subconsciousLabView === "symbol" && "📖 원형 상징 백과 사전"}
                              {subconsciousLabView === "plaza" && "🏛️ 익명 무의식 광장 공유"}
                              {subconsciousLabView === "audio" && "🎧 긴장 이완 사운드스케이프"}
                            </span>
                            <button
                              onClick={() => setSubconsciousLabView(null)}
                              className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 font-bold px-3 py-1.5 rounded-lg hover:text-white hover:bg-indigo-900 transition-colors cursor-pointer"
                            >
                              ← 연구소 목록으로
                            </button>
                          </div>

                          <div className="fade-in">
                            {subconsciousLabView === "garden" && <AuraGarden dreams={dreams} />}
                            {subconsciousLabView === "symbol" && <SymbolDictionary />}
                            {subconsciousLabView === "plaza" && <DreamPlaza userDreams={dreams} />}
                            {subconsciousLabView === "audio" && <WindDownPlayer />}
                          </div>
                        </div>
                      ) : (
                        /* Render Lab Selection Cards Grid */
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                            🌌 무의식 심층 성찰 연구소 (Lab)
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setSubconsciousLabView("garden")}
                              className="p-4 rounded-2xl bg-gradient-to-tr from-[#131135]/90 to-[#0A0C22]/80 border border-indigo-500/10 hover:border-indigo-500/30 text-left transition-all cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🌳</div>
                              <h4 className="text-xs font-black text-indigo-100">오라 컬러 정원</h4>
                              <p className="text-[9px] text-indigo-300/40 leading-normal mt-0.5 font-sans font-semibold">감정 축적 시각 비주얼</p>
                            </button>

                            <button
                              onClick={() => setSubconsciousLabView("symbol")}
                              className="p-4 rounded-2xl bg-gradient-to-tr from-[#131135]/90 to-[#0A0C22]/80 border border-indigo-500/10 hover:border-indigo-500/30 text-left transition-all cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">📖</div>
                              <h4 className="text-xs font-black text-indigo-100">상징 백과사전</h4>
                              <p className="text-[9px] text-indigo-300/40 leading-normal mt-0.5 font-sans font-semibold">키워드 상징 원형 탐색</p>
                            </button>

                            <button
                              onClick={() => setSubconsciousLabView("plaza")}
                              className="p-4 rounded-2xl bg-[#131135]/90 border border-indigo-500/10 hover:border-indigo-500/30 text-left transition-all cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🏛️</div>
                              <h4 className="text-xs font-black text-indigo-100">익명 소통 광장</h4>
                              <p className="text-[9px] text-indigo-300/40 leading-normal mt-0.5 font-sans font-semibold">공감의 무의식 공유 보드</p>
                            </button>

                            <button
                              onClick={() => setSubconsciousLabView("audio")}
                              className="p-4 rounded-2xl bg-gradient-to-tr from-[#131135]/90 to-[#0A0C22]/80 border border-indigo-500/10 hover:border-indigo-500/30 text-left transition-all cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🎧</div>
                              <h4 className="text-xs font-black text-indigo-100">입면 이완 음악</h4>
                              <p className="text-[9px] text-indigo-300/40 leading-normal mt-0.5 font-sans font-semibold">수면 전 긴장 이완 비트</p>
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
                  />
                )}

                {activeTab === "analysis" && (
                  <DreamReport
                    dreams={dreams}
                    onTriggerAd={handleTriggerAdUnlock}
                    isUnlocked={isUnlockedNaturally}
                  />
                )}

                {activeTab === "calendar" && (
                  <DreamCalendar
                    dreams={dreams}
                    onSelectDream={setSelectedDreamForDetails}
                    onAddNewDreamWithDate={(dateStr) => {
                      setIsRecordingNewDream(true);
                    }}
                  />
                )}

                {activeTab === "profile" && (
                  <MyProfile
                    totalDreams={dreams.length}
                    unlocked={isUnlockedNaturally}
                    onResetMocks={handleResetData}
                    onBackToOnboarding={handleBackToOnboarding}
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
            />
          )}

        </div>
      )}
    </div>
  );
}
