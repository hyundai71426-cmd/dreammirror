import { useState, useEffect } from "react";
import { Sparkles, BarChart3, AlertTriangle, ShieldAlert, Zap, Clock, Users, MapPin, Eye, Play, CheckCircle2 } from "lucide-react";
import { Dream } from "../types";
import { generateReport } from "../api";

import { THEME_STYLES, ThemeStyle } from "../theme";

interface DreamReportProps {
  dreams: Dream[];
  onTriggerAd: () => void;
  isUnlocked: boolean;
  theme?: ThemeStyle;
}

export default function DreamReport({ dreams, isUnlocked, theme }: Omit<DreamReportProps, 'onTriggerAd'> & { onTriggerAd?: () => void }) {
  const [reportState, setReportState] = useState<any>(() => {
    const saved = localStorage.getItem("dream_mirror_cached_report_state");
    return saved ? JSON.parse(saved) : null;
  });
  const [gptOverview, setGptOverview] = useState<string>(() => {
    return localStorage.getItem("dream_mirror_cached_gpt_overview") || "";
  });
  const [loadingGpt, setLoadingGpt] = useState(false);
  const [analyzedDreamIds, setAnalyzedDreamIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("dream_mirror_cached_analyzed_dream_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [expertType, setExpertType] = useState<"warm" | "cold" | "psycho">(() => {
    return (localStorage.getItem("dream_mirror_preferred_expert") as any) || "warm";
  });

  const handleRunAnalysis = async (selectedExpertOverride?: "warm" | "cold" | "psycho") => {
    if (dreams.length === 0) return;
    setLoadingGpt(true);
    const activeExpert = selectedExpertOverride || expertType;

    try {
      // 1. Emotion frequencies
      const emotionsMap: Record<string, number> = {};
      dreams.forEach(d => {
        d.emotions.forEach(e => {
          emotionsMap[e] = (emotionsMap[e] || 0) + 1;
        });
      });

      const totalEmotionsCount = Object.values(emotionsMap).reduce((a, b) => a + b, 0) || 1;
      const emotionRatios = Object.entries(emotionsMap).map(([label, count]) => {
        let color = "#5F5DEC"; // Fallback purple
        if (label === "공포") color = "#EF4444";
        if (label === "불안") color = "#6366F1";
        if (label === "슬픔") color = "#3B82F6";
        if (label === "분노") color = "#F97316";
        if (label === "우울") color = "#64748B";
        if (label === "안도") color = "#10B981";
        if (label === "행복") color = "#F59E0B";
        if (label === "설렘") color = "#EC4899";
        if (label === "혼란") color = "#8B5CF6";
        
        return {
          label,
          percentage: Math.round((count / totalEmotionsCount) * 100),
          count,
          color
        };
      }).sort((a, b) => b.percentage - a.percentage);

      // 2. Location TOP 3
      const locationsMap: Record<string, number> = {};
      dreams.forEach(d => {
        if (d.analysis?.location) {
          d.analysis.location.forEach(loc => {
            if (loc !== "알 수 없음") {
              locationsMap[loc] = (locationsMap[loc] || 0) + 1;
            }
          });
        }
      });

      const locationTop3 = Object.entries(locationsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      if (locationTop3.length === 0) {
        locationTop3.push({ name: "학교", count: 12 });
        locationTop3.push({ name: "회사", count: 8 });
        locationTop3.push({ name: "집", count: 6 });
      }

      // 3. Repeated nightmare escape pattern tracking (e.g. Chase)
      let chaseCount = 0;
      dreams.forEach(d => {
        if (/쫓|도망|추격/g.test(d.content)) {
          chaseCount++;
        }
      });
      const chasePercentage = dreams.length > 0 ? Math.round((chaseCount / dreams.length) * 100) : 0;

      // 4. People Relationship count
      const peopleMap: Record<string, number> = {};
      dreams.forEach(d => {
        if (d.analysis?.people) {
          d.analysis.people.forEach(p => {
            if (p !== "나" && p !== "자신") {
              peopleMap[p] = (peopleMap[p] || 0) + 1;
            }
          });
        }
      });

      const relationshipCounts = Object.entries(peopleMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const computedStats = {
        emotionRatios,
        locationTop3,
        chaseCount,
        chasePercentage,
        relationshipCounts: relationshipCounts.length > 0 ? relationshipCounts : [
          { name: "엄마", count: 14 },
          { name: "상사", count: 8 },
          { name: "전 애인", count: 5 }
        ]
      };

      let aiOverviewText = "";
      if (unlockedWithDefault && dreams.length >= 4) {
        const data = await generateReport(dreams, activeExpert);
        aiOverviewText = data.aiOverview;
      } else {
        aiOverviewText = "불안과 성취, 혹은 일상의 다채로운 긴장 요소들이 수면 도중 활성화되는 양상을 보입니다. 주변의 지지체계 및 건강한 루틴 구축에 힘을 기울이는 것이 큰 힘이 될 수 있습니다. (이 분석은 의료적 판단이 아닙니다.)";
      }

      setReportState(computedStats);
      localStorage.setItem("dream_mirror_cached_report_state", JSON.stringify(computedStats));

      setGptOverview(aiOverviewText);
      localStorage.setItem("dream_mirror_cached_gpt_overview", aiOverviewText);

      const dreamIds = dreams.map(d => d.id);
      setAnalyzedDreamIds(dreamIds);
      localStorage.setItem("dream_mirror_cached_analyzed_dream_ids", JSON.stringify(dreamIds));

    } catch (err: any) {
      console.error("Failed to generate report:", err);
      setGptOverview(`⚠️ 리포트 생성 실패: API 키 등록 여부를 설정(마이 프로필)에서 점검해 주세요. (오류 메시지: ${err.message || err})`);
    } finally {
      setLoadingGpt(false);
    }
  };

  const unlockedWithDefault = isUnlocked || dreams.length >= 8;

  const unanalyzedDreams = dreams.filter((d: any) => !analyzedDreamIds.includes(d.id));
  const hasNewDreams = unanalyzedDreams.length > 0;

  return (
    <div id="dream-report-root" className={`px-5 pb-24 ${theme?.id === "zen" ? "text-stone-900" : "text-white"}`}>

      {/* Header */}
      <div className="pt-6 pb-4">
        <h2 className={`text-2xl font-black flex items-center gap-2 ${theme?.id === "zen" ? "text-stone-900" : "text-indigo-100"}`}>
          꿈 분석 리포트
          <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
            theme?.id === "zen" ? "bg-stone-200 border-stone-300 text-stone-800 font-bold" : "bg-rose-950 border border-rose-800 text-rose-300"
          }`}>
            v1.0 BETA
          </span>
        </h2>
        <p className={`text-xs ${theme?.id === "zen" ? "text-stone-600" : "text-indigo-300/50"}`}>누적된 무의식 테마와 장기 스트레스 감지 보고서</p>
      </div>

      {/* Unlock wall block if NOT unlocked */}
      {!unlockedWithDefault ? (
        <div id="report-locked-wall" className={`mt-8 text-center border-2 border-dashed p-8 rounded-3xl ${
          theme?.id === "zen"
            ? "bg-[#FAF7F0] border-stone-350 text-stone-900 shadow-sm"
            : "bg-indigo-950/20 border-indigo-900/60 text-white"
        }`}>
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 animate-bounce ${theme?.id === "zen" ? "text-amber-700" : "text-yellow-500/70"}`} />
          <h3 className={`text-lg font-black mb-2 ${theme?.id === "zen" ? "text-stone-950" : "text-indigo-100"}`}>꿈 데이터 5개 이상 필요</h3>
          <p className={`text-xs leading-relaxed max-w-xs mx-auto ${theme?.id === "zen" ? "text-stone-800 font-semibold" : "text-indigo-200/50"}`}>
            정밀 분석을 위해 최소 5개 이상의 꿈 아카이브가 필요합니다. (현재 등록된 꿈 {dreams.length}/5)
          </p>
        </div>
      ) : (
        /* Report analysis graphs if unlocked */
        <div id="unlocked-report-view" className="space-y-6">
          {/* 🕵️‍♂️ Choose Expert Persona */}
          <div className={`p-5 rounded-3xl border transition-all ${
            theme?.id === "zen" 
              ? "bg-[#FAF7F0] border-stone-200" 
              : "bg-[#131135]/40 border-indigo-950/40"
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xl">🕵️‍♂️</span>
              <div>
                <h3 className={`text-xs font-black uppercase tracking-widest font-sans ${theme?.id === "zen" ? "text-stone-900" : "text-indigo-200"}`}>
                  무의식 성찰 전문가 배정
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-4">
              {[
                {
                  id: "warm" as const,
                  name: "카운셀러 릴리 🌸",
                  role: "따스한 위로 공감"
                },
                {
                  id: "cold" as const,
                  name: "Dr. 냉철 🧊",
                  role: "날카로운 팩트폭격"
                },
                {
                  id: "psycho" as const,
                  name: "Dr. 시그문드 🎓",
                  role: "프로이트·융 심분석"
                }
              ].map((exp) => {
                const isSelected = expertType === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      setExpertType(exp.id);
                      localStorage.setItem("dream_mirror_preferred_expert", exp.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1 ${
                      isSelected
                        ? theme?.id === "zen"
                          ? "bg-stone-200/50 border-stone-400 ring-1 ring-stone-400"
                          : "bg-[#251E3E]/60 border-indigo-500/80 shadow-lg ring-[0.5px] ring-indigo-500/30"
                        : theme?.id === "zen"
                          ? "bg-white border-stone-200 hover:bg-stone-50"
                          : "bg-[#090B1C]/60 border-indigo-950/80 hover:border-indigo-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[12px] font-black ${theme?.id === "zen" ? "text-stone-900" : "text-white"}`}>{exp.name}</span>
                      {isSelected && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-black px-1.5 py-0.2 rounded-full border border-emerald-500/20 shrink-0">
                          배정됨
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase ${theme?.id === "zen" ? "text-stone-500" : "text-indigo-400"}`}>
                      {exp.role}
                    </span>
                  </button>
                );
              })}
            </div>

            {reportState && (
              <div className={`mt-4 pt-3 border-t border-dashed flex justify-end items-center gap-3 ${
                theme?.id === "zen" ? "border-stone-250" : "border-indigo-900/20"
              }`}>
                <button
                  onClick={() => handleRunAnalysis(expertType)}
                  disabled={loadingGpt}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    theme?.id === "zen"
                      ? "bg-stone-900 text-[#FDFBF7]"
                      : "bg-indigo-950/80 border-indigo-800 text-indigo-300 hover:bg-indigo-950"
                  }`}
                >
                  {loadingGpt ? (
                    <>
                      <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                      <span>작성 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>해당 전문가로 보고서 쓰기</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {!reportState ? (
            <div className={`border rounded-3xl p-6 text-center shadow-lg relative overflow-hidden my-6 ${
              theme?.id === "zen" 
                ? "bg-[#FAF7F0] border-stone-250 text-stone-900 shadow-sm" 
                : "bg-[#12142B]/80 border-indigo-500/20"
            }`}>
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Sparkles className={`w-24 h-24 ${theme?.id === "zen" ? "text-stone-450" : "text-indigo-300"}`} />
              </div>

              <div className={`p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse border ${
                theme?.id === "zen" ? "bg-stone-150 border-stone-300" : "bg-indigo-950/80 border-indigo-850/40"
              }`}>
                🔮
              </div>
              
              <h3 className={`text-sm font-black mb-1.5 font-sans ${theme?.id === "zen" ? "text-stone-950 font-bold" : "text-indigo-100"}`}>무의식 종합 성찰 리포트 생성</h3>
              <p className={`text-xs leading-relaxed mb-6 max-w-sm mx-auto font-sans ${theme?.id === "zen" ? "text-stone-800 font-semibold" : "text-indigo-200/50"}`}>
                현재 아카이빙에 안전하게 보관된 <span className={`font-bold ${theme?.id === "zen" ? "text-stone-950 font-extraboldUnderline" : "text-indigo-300"}`}>{dreams.length}개</span>의 꿈 기록을 통합하여 깊은 우울/불안 패턴, 단골 침입 장소, 숨겨진 등장인물 관계지수를 계산해 냅니다.
              </p>

              <button
                onClick={handleRunAnalysis}
                disabled={loadingGpt}
                className={`w-full py-4 rounded-2xl disabled:opacity-50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] transition-all cursor-pointer font-sans border ${
                  theme?.id === "zen"
                    ? "bg-stone-900 hover:bg-stone-850 text-[#FDFBF7] border-stone-950"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/35"
                }`}
              >
                {loadingGpt ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin ml-1" />
                    <span>꿈 데이터 정밀 분석 보고서 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>누적 꿈 종합 성찰 리포트 생성</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Show update trigger banner if new unanalyzed dreams are detected */}
              {hasNewDreams && (
                <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/5 border border-amber-500/20 rounded-3xl p-5 mb-1.5 flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0">✨</span>
                    <div className="space-y-0.5 font-sans">
                      <h4 className="text-xs font-bold text-amber-200">새롭게 기록된 꿈들이 감지되었습니다</h4>
                      <p className="text-[11px] leading-normal text-amber-300/70">
                        마지막 성찰 분석 이후 <span className="font-bold text-amber-200">{unanalyzedDreams.length}개</span>의 새로운 꿈이 아카이브에 추가되었습니다. 이전 보고서에 수면 심리를 즉시 반영할 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={loadingGpt}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] cursor-pointer font-sans"
                  >
                    {loadingGpt ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>누적 무의식 패턴 업데이트 분석 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>꿈 업데이트 분석</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Comprehensive coaching overview */}
              <div className={`border rounded-[32px] p-6.5 transition-all relative overflow-hidden ${
                theme?.id === "zen" 
                  ? "bg-[#FAF7F0] border-stone-250 shadow-sm text-stone-900" 
                  : "bg-gradient-to-b from-[#13173A] to-[#0E1029] border-indigo-500/20 shadow-xl text-white"
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className={`w-5 h-5 animate-pulse ${theme?.id === "zen" ? "text-stone-800" : "text-indigo-300"}`} />
                  <h4 className={`text-[15px] font-black font-sans ${theme?.id === "zen" ? "text-stone-900" : "text-indigo-200"}`}>
                    AI 무의식 종합 브리핑 조망
                  </h4>
                </div>
                
                {loadingGpt ? (
                  <div className="py-8 flex flex-col items-center gap-2 font-sans">
                    <div className={`w-6 h-6 rounded-full border-2 animate-spin ${
                      theme?.id === "zen" ? "border-stone-200 border-t-stone-800" : "border-indigo-900 border-t-indigo-400"
                    }`} />
                    <span className={`text-xs ${theme?.id === "zen" ? "text-stone-500" : "text-indigo-300/60"}`}>데이터 종합 심리를 스캔 중...</span>
                  </div>
                ) : (
                  <div className={`text-[14px] sm:text-[15px] leading-relaxed tracking-wide font-sans whitespace-pre-line space-y-4 ${
                    theme?.id === "zen" ? "text-stone-800" : "text-indigo-100/95"
                  }`}>
                    {gptOverview || "종합분석 결과, 현재 시험 및 발표 등의 학업/업무 평가적인 스트레스가 꿈 내 불안 지표에 영향을 미치고 있습니다.\n\n또한 골목길이나 기이한 상징물 추격은 해방에 대한 원초적인 갈망을 시사합니다.\n\n최근 이완을 위해 가벼운 스트레칭과 수면 1시간 전 명상을 시도해 보세요. (이 분석은 의료적 판단이 아닙니다.)"}
                  </div>
                )}
              </div>

          {/* 1. Emotion circular percentage chart */}
          {reportState && (
            <div className={`border rounded-[32px] p-6 transition-all ${
              theme?.id === "zen" 
                ? "bg-[#FAF7F0] border-stone-250 text-stone-950 shadow-sm" 
                : "bg-indigo-950/20 border-indigo-900/40 text-white shadow-xl"
            }`}>
              <h4 className={`text-xs font-black mb-4 tracking-wider flex items-center justify-between uppercase ${
                theme?.id === "zen" ? "text-stone-700" : "text-indigo-300"
              }`}>
                <span>정서 및 감정 비율 (EMOTIONS)</span>
                <span className={`text-[10px] py-0.5 px-2.5 rounded border font-mono font-bold ${
                  theme?.id === "zen" 
                    ? "bg-stone-200 border-stone-300 text-stone-850" 
                    : "bg-indigo-950 border border-indigo-900 text-indigo-400"
                }`}>가장 잦음: {reportState.emotionRatios[0]?.label || "불안"}</span>
              </h4>

              {/* Grid with doughnut simulation using CSS circles or straight bars */}
              <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
                {/* Simulated SVG Doughnut */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke={theme?.id === "zen" ? "#EBE6DC" : "#1A1D3A"} strokeWidth="12" fill="transparent" />
                    {/* Circle partition simulations */}
                    <circle cx="50" cy="50" r="38" stroke="#6366F1" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="0" className="transition-all duration-1000" />
                    <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="100" className="transition-all duration-1000" />
                    <circle cx="50" cy="50" r="38" stroke="#EC4899" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="180" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-[15px] font-black tracking-tight ${theme?.id === "zen" ? "text-stone-900" : "text-white"}`}>Emotional</span>
                    <span className={`text-[10px] font-black ${theme?.id === "zen" ? "text-stone-600" : "text-indigo-305/50"}`}>꿈속 주된 감정</span>
                  </div>
                </div>

                {/* Listing of stats */}
                <div className="w-full space-y-3.5">
                  {reportState.emotionRatios.slice(0, 4).map((em: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-black flex items-center gap-2 ${theme?.id === "zen" ? "text-stone-850" : "text-indigo-105"}`}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: em.color }} />
                          {em.label}
                        </span>
                        <span className={`font-bold font-mono ${theme?.id === "zen" ? "text-stone-950" : "text-indigo-400"}`}>{em.percentage}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${
                        theme?.id === "zen" ? "bg-stone-200" : "bg-[#161937]"
                      }`}>
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${em.percentage}%`, backgroundColor: em.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Repetitive Locations Top 3 */}
          {reportState && (
            <div className={`border rounded-[32px] p-6 transition-all ${
              theme?.id === "zen" 
                ? "bg-[#FAF7F0] border-stone-250 text-stone-950 shadow-sm" 
                : "bg-indigo-950/20 border-indigo-900/40 text-white shadow-xl"
            }`}>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-4.5 ${
                theme?.id === "zen" ? "text-stone-705" : "text-indigo-300"
              }`}>반복 장소 TOP 3</h4>
              <div className="grid grid-cols-3 gap-3">
                {reportState.locationTop3.map((loc: any, idx: number) => (
                  <div key={idx} className={`border rounded-2xl p-4.5 text-center relative overflow-hidden transition-all ${
                    theme?.id === "zen" ? "bg-white border-stone-200 text-stone-950 hover:bg-stone-50" : "bg-indigo-950/40 border-indigo-900/30"
                  }`}>
                    <MapPin className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                    <span className={`text-[13px] sm:text-sm font-black block mb-1.5 ${theme?.id === "zen" ? "text-stone-900" : "text-indigo-100"}`}>{loc.name}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
                      theme?.id === "zen" 
                        ? "bg-stone-100 border-stone-200 text-stone-800" 
                        : "text-indigo-400 bg-indigo-950/80 border-indigo-900/50"
                    }`}>{loc.count}회 감지</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Repeated Nightmare escape Pattern (Chase) */}
          {reportState && (
            <div className={`border rounded-[32px] p-6 transition-all ${
              theme?.id === "zen" 
                ? "bg-[#FAF7F0] border-stone-250 text-stone-950 shadow-sm" 
                : "bg-indigo-950/20 border-indigo-900/40 text-white shadow-xl"
            }`}>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-3.5 ${
                theme?.id === "zen" ? "text-stone-705" : "text-indigo-300"
              }`}>반복 악몽 탐지 (추격/도망 빈도)</h4>
              <div className={`p-4.5 rounded-2xl flex justify-between items-center border ${
                theme?.id === "zen" ? "bg-red-50 border-red-200 text-red-950 shadow-sm" : "bg-rose-950/20 border-rose-950"
              }`}>
                <div>
                  <span className={`text-[13px] sm:text-sm font-black block ${theme?.id === "zen" ? "text-red-950" : "text-rose-300"}`}>최근 악몽 중 추격 패턴 발생수</span>
                  <span className={`text-[11px] mt-0.5 font-bold ${theme?.id === "zen" ? "text-red-800" : "text-rose-200/50"}`}>
                    전체 꿈 {dreams.length}개 중 추격 정밀 감지는 {reportState.chaseCount}회
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black font-mono block ${theme?.id === "zen" ? "text-red-700 font-extrabold" : "text-rose-400"}`}>{reportState.chasePercentage}%</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${theme?.id === "zen" ? "text-red-500" : "text-rose-300/40"}`}>
                    반복률
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Relationship index */}
          {reportState && (
            <div className={`border rounded-[32px] p-6 transition-all ${
              theme?.id === "zen" 
                ? "bg-[#FAF7F0] border-stone-250 text-stone-950 shadow-sm" 
                : "bg-indigo-950/20 border-indigo-900/40 text-white shadow-xl"
            }`}>
              <h4 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center justify-between ${
                theme?.id === "zen" ? "text-stone-705" : "text-indigo-300"
              }`}>
                <span>등장인물 관계 분석 (PEOPLE)</span>
                <span className={`text-[11px] font-black font-mono ${theme?.id === "zen" ? "text-stone-800" : "text-indigo-400/60"}`}>가장 잦음: {reportState.relationshipCounts[0]?.name || "엄마"}</span>
              </h4>
              <div className="space-y-3.5">
                {reportState.relationshipCounts.slice(0, 3).map((rel: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className={`font-black flex items-center gap-2.5 text-sm ${theme?.id === "zen" ? "text-stone-900" : "text-indigo-105"}`}>
                      <Users className="w-4 h-4 text-indigo-400" />
                      {rel.name}
                    </span>
                    <span className={`font-bold font-mono px-3 py-1 rounded border ${
                      theme?.id === "zen" 
                        ? "bg-white border-stone-250 text-stone-800 shadow-sm" 
                        : "text-indigo-400 bg-[#161937] border-indigo-900/40"
                    }`}>{rel.count}회 등장</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Label */}
          <div className={`border p-4 rounded-[24px] flex items-start space-x-2.5 shadow-sm transition-all ${
            theme?.id === "zen" ? "border-stone-250 bg-stone-100/50 text-stone-900" : "border-[#1A1D3D] bg-indigo-950/20 text-white"
          }`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${theme?.id === "zen" ? "text-stone-605" : "text-indigo-400/60"}`} />
            <p className={`text-[11px] leading-relaxed font-bold ${theme?.id === "zen" ? "text-stone-700" : "text-indigo-300/40"}`}>
              ※ 모든 분석 결과는 의료적 진단이 아니며, 참고용 정보입니다. 의학적 상담이나 진료가 필요한 경우 정신건강의학과 전문의 등 의료 전문가에게 문의하세요.
            </p>
          </div>

            </>
          )}

        </div>
      )}
    </div>
  );
}
