import { useState, useEffect } from "react";
import { Sparkles, BarChart3, AlertTriangle, ShieldAlert, Zap, Clock, Users, MapPin, Eye, Play, CheckCircle2 } from "lucide-react";
import { Dream } from "../types";
import { generateReport } from "../api";

interface DreamReportProps {
  dreams: Dream[];
  onTriggerAd: () => void;
  isUnlocked: boolean;
}

export default function DreamReport({ dreams, onTriggerAd, isUnlocked }: DreamReportProps) {
  const [reportState, setReportState] = useState<any>(() => {
    const saved = localStorage.getItem("dream_mirror_cached_report_state");
    return saved ? JSON.parse(saved) : null;
  });
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [gptOverview, setGptOverview] = useState<string>(() => {
    return localStorage.getItem("dream_mirror_cached_gpt_overview") || "";
  });
  const [loadingGpt, setLoadingGpt] = useState(false);
  const [analyzedDreamIds, setAnalyzedDreamIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("dream_mirror_cached_analyzed_dream_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const handleSimulateAd = () => {
    setIsAdPlaying(true);
    setAdCountdown(10); // 10s interactive video ad simulation
    
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(interval);
          setIsAdPlaying(false);
          setAdCountdown(null);
          onTriggerAd(); // unlock reports!
          return null;
        }
      });
    }, 1000);
  };

  const handleRunAnalysis = async () => {
    if (dreams.length === 0) return;
    setLoadingGpt(true);

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
        const data = await generateReport(dreams);
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
    <div id="dream-report-root" className="px-5 pb-24 text-white">
      {/* Simulation Fullscreen Interstitial Ad */}
      {isAdPlaying && (
        <div id="simulation-ad" className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 text-white select-none">
          <div className="flex justify-between items-center">
            <span className="text-xs bg-indigo-900 border border-indigo-700 px-3 py-1 rounded-full font-bold">
              스폰서 제휴 영상 광고 🎥 (광고주: 침구 수면도서)
            </span>
            <div className="bg-[#1A1D2E] text-xs px-3 py-1.5 rounded-lg border border-indigo-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>{adCountdown}초 뒤 리포트 잠금 해제</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="p-8 rounded-full bg-slate-900 border border-indigo-500/30 animate-pulse mb-6">
              <Play className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="text-xl font-extrabold mb-1.5 text-indigo-100">Dream Pillow Sleep</h2>
            <p className="text-xs text-indigo-200/50 mb-6 max-w-xs">"수면 만족도 185% 증가! 인체공학적 디자인으로 악몽 빈도를 감소시켜 드립니다."</p>
            <div className="py-2.5 px-6 rounded-xl bg-indigo-600 text-xs font-bold shadow-lg">쿠팡 파트너스 최저가 보러가기 🛍️</div>
          </div>

          <p className="text-center text-[10px] text-gray-500">※ 이 광고 시청은 개발자 자립 및 무료 꿈 해몽 분석 구동에 직결됩니다.</p>
        </div>
      )}

      {/* Header */}
      <div className="pt-6 pb-4">
        <h2 className="text-2xl font-black text-indigo-100 flex items-center gap-2">
          당신의 꿈 분석 리포트
          <span className="text-xs bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded font-mono">
            v1.0 BETA
          </span>
        </h2>
        <p className="text-xs text-indigo-300/50">누적된 무의식 테마와 장기 스트레스 감지 보고서</p>
      </div>

      {/* Unlock wall block if NOT unlocked */}
      {!unlockedWithDefault ? (
        <div id="report-locked-wall" className="mt-8 text-center bg-indigo-950/20 border-2 border-dashed border-indigo-900/60 p-8 rounded-3xl">
          <AlertTriangle className="w-12 h-12 text-yellow-500/70 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold mb-2 text-indigo-100">꿈 데이터 5개 이상 필요</h3>
          <p className="text-xs text-indigo-200/50 leading-relaxed mb-6 max-w-xs mx-auto">
            정밀 분석을 위해 최소 5개 이상의 꿈 아카이브가 필요합니다. (현재 등록된 꿈 {dreams.length}/5)
            <br />
            대신 광고 시청 후 AI 분석 보고서를 무료 체험 하실 수 있습니다!
          </p>

          <button
            id="btn-ad-unlock"
            onClick={handleSimulateAd}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-bold flex items-center justify-center space-x-2 text-sm shadow-xl"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>수면 영양 광고 시청하고 즉시 분석 잠금 해제</span>
          </button>
        </div>
      ) : (
        /* Report analysis graphs if unlocked */
        <div id="unlocked-report-view" className="space-y-6">
          
          {!reportState ? (
            <div className="bg-[#12142B]/80 border border-indigo-500/20 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden my-6">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Sparkles className="w-24 h-24 text-indigo-300" />
              </div>

              <div className="p-4 rounded-full bg-indigo-950/80 border border-indigo-850/40 w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
                🔮
              </div>
              
              <h3 className="text-sm font-black text-indigo-100 mb-1.5 font-sans">무의식 종합 성찰 리포트 생성</h3>
              <p className="text-xs text-indigo-200/50 leading-relaxed mb-6 max-w-sm mx-auto font-sans">
                현재 아카이빙에 안전하게 보관된 <span className="font-bold text-indigo-300">{dreams.length}개</span>의 꿈 기록을 통합하여 깊은 우울/불안 패턴, 단골 침입 장소, 숨겨진 등장인물 관계지수를 계산해 냅니다.
              </p>

              <button
                onClick={handleRunAnalysis}
                disabled={loadingGpt}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] transition-all cursor-pointer font-sans text-white border border-indigo-500/35"
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
              <div className="bg-gradient-to-b from-[#13173A] to-[#0E1029] border border-indigo-500/20 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex items-center space-x-1.5 mb-3">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-300 animate-spin" />
                  <h3 className="text-sm font-black text-indigo-200 font-sans">AI 무의식 종합 브리핑 조망</h3>
                </div>
                
                {loadingGpt ? (
                  <div className="py-6 flex flex-col items-center gap-2 font-sans">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-900 border-t-indigo-400 animate-spin" />
                    <span className="text-[10px] text-indigo-300/50">데이터 종합 심리를 스캔 중...</span>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-indigo-200/90 font-sans font-sans">
                    {gptOverview || "종합분석 결과, 현재 시험 및 발표 등의 학업/업무 평가적인 스트레스가 꿈 내 불안 지표에 영향을 미치고 있습니다. 또한 골목길이나 기이한 상징물 추격은 해방에 대한 원초적인 갈망을 시사합니다. 최근 이완을 위해 가벼운 스트레칭과 명상을 시도해 보세요. (이 분석은 의료적 판단이 아닙니다.)"}
                  </p>
                )}
              </div>

          {/* 1. Emotion circular percentage chart */}
          {reportState && (
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5">
              <h4 className="text-xs font-bold text-indigo-300 mb-4 tracking-wider flex items-center justify-between">
                <span>정서 및 감정 비율 (EMOTIONS)</span>
                <span className="text-[10px] py-0.5 px-2 bg-indigo-950 border border-indigo-900 text-indigo-400">가장 잦음: {reportState.emotionRatios[0]?.label || "불안"}</span>
              </h4>

              {/* Grid with doughnut simulation using CSS circles or straight bars */}
              <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
                {/* Simulated SVG Doughnut */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#1A1D3A" strokeWidth="12" fill="transparent" />
                    {/* Circle partition simulations */}
                    <circle cx="50" cy="50" r="38" stroke="#6366F1" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="0" className="transition-all duration-1000" />
                    <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="100" className="transition-all duration-1000" />
                    <circle cx="50" cy="50" r="38" stroke="#EC4899" strokeWidth="12" fill="transparent" strokeDasharray="238" strokeDashoffset="180" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold tracking-tight">Emotional</span>
                    <span className="text-[10px] text-indigo-300/50">꿈속 주된 감정</span>
                  </div>
                </div>

                {/* Listing of stats */}
                <div className="w-full space-y-3">
                  {reportState.emotionRatios.slice(0, 4).map((em: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: em.color }} />
                          {em.label}
                        </span>
                        <span className="font-bold text-indigo-400 font-mono">{em.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#161937] h-2 rounded-full overflow-hidden">
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
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5">
              <h4 className="text-xs font-bold text-indigo-300 mb-4 tracking-wider">반복 장소 TOP 3</h4>
              <div className="grid grid-cols-3 gap-3">
                {reportState.locationTop3.map((loc: any, idx: number) => (
                  <div key={idx} className="bg-indigo-950/40 border border-indigo-900/30 rounded-2xl p-4 text-center relative overflow-hidden">
                    <MapPin className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                    <span className="text-sm font-black block text-indigo-100 mb-1">{loc.name}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900/50">{loc.count}회 감지</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Repeated Nightmare escape Pattern (Chase) */}
          {reportState && (
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5">
              <h4 className="text-xs font-bold text-indigo-300 mb-3 tracking-wider">반복 악몽 탐지 (추격/도망 빈도)</h4>
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-950 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-rose-300 block">최근 악몽 중 추격 패턴 발생수</span>
                  <span className="text-[11px] text-rose-200/50 mt-0.5">전체 꿈 {dreams.length}개 중 추격 정밀 감지는 {reportState.chaseCount}회</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-rose-400 font-mono block">{reportState.chasePercentage}%</span>
                  <span className="text-[10px] text-rose-300/40 font-bold uppercase tracking-widest">반복률</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Relationship index */}
          {reportState && (
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5">
              <h4 className="text-xs font-bold text-indigo-300 mb-4 tracking-wider flex items-center justify-between">
                <span>등장인물 관계 분석 (PEOPLE)</span>
                <span className="text-[11px] text-indigo-400/60 font-semibold font-mono">가장 잦음: {reportState.relationshipCounts[0]?.name || "엄마"}</span>
              </h4>
              <div className="space-y-3">
                {reportState.relationshipCounts.slice(0, 3).map((rel: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-100 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {rel.name}
                    </span>
                    <span className="font-bold text-indigo-400 font-mono bg-[#161937] px-2.5 py-1 rounded border border-indigo-900/40">{rel.count}회 등장</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Label */}
          <div className="border border-indigo-[#1A1D3D] bg-indigo-950/20 p-4 rounded-2xl flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400/60 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-indigo-300/40">
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
