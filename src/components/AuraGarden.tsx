import { useState, useEffect } from "react";
import { Sparkles, Flower2, Heart, HelpCircle, Info } from "lucide-react";
import { Dream } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuraGardenProps {
  dreams: Dream[];
}

const AURA_CONFIGS: Record<string, { color: string; rgb: string; title: string; desc: string; element: string }> = {
  "공포": { color: "from-red-600 to-red-950", rgb: "239, 68, 68", title: "붉은 생염 (Crimson Flame)", desc: "강한 자극, 잠재된 공포심, 혹은 억눌러 온 원초적인 경고 본능을 투사합니다.", element: "불꽃 🌋" },
  "불안": { color: "from-indigo-600 to-indigo-950", rgb: "99, 102, 241", title: "시클라멘 섀도우 (Indigo Shadow)", desc: "평가에 대한 걱정, 미래 예측 불안, 조바심을 조율하는 안전장치의 표명입니다.", element: "안개 🌫️" },
  "슬픔": { color: "from-blue-600 to-blue-950", rgb: "59, 130, 246", title: "사파이어 오션 (Sapphire Ocean)", desc: "정서적 유실, 잔잔한 단절감, 혹은 지나간 아쉬움을 흘러보내는 무의식적 정화입니다.", element: "물방울 💧" },
  "분노": { color: "from-orange-500 to-orange-950", rgb: "249, 115, 22", title: "선셋 블레이즈 (Amber Blaze)", desc: "현실 상황의 부당함에 반응하는 뜨거운 돌파 에너지와 경계 심리의 표출입니다.", element: "마그마 ☄️" },
  "우울": { color: "from-slate-500 to-slate-900", rgb: "100, 116, 139", title: "차콜 더스트 (Charcoal Dust)", desc: "활동성 둔화 및 심리적 휴식기가 필요함을 외치는 동면 중인 수면 지표입니다.", element: "대지 🪵" },
  "안도": { color: "from-teal-500 to-teal-950", rgb: "20, 184, 166", title: "미스틱 에메랄드 (Teal Emerald)", desc: "폭풍우가 지나간 뒤 마음을 매끄럽게 보완하고 휴식을 취하려는 면역계의 안도입니다.", element: "바람 🍃" },
  "행복": { color: "from-yellow-500 to-yellow-950", rgb: "234, 179, 8", title: "솔라 오라 (Sunny Solar)", desc: "자신감 배양, 일상의 활력, 내적인 조화가 이상적으로 발현되는 온화한 파동입니다.", element: "햇살 ☀️" },
  "설렘": { color: "from-pink-500 to-pink-950", rgb: "236, 72, 153", title: "코스믹 피치 (Cosmic Peach)", desc: "기대 충족, 새로운 영역에 대한 흥미, 호기심 어린 자아가 연출하는 긍정적 기포입니다.", element: "꽃잎 🌸" },
  "혼란": { color: "from-purple-500 to-purple-950", rgb: "168, 85, 247", title: "아메시스트 볼텍스 (Amethyst Nebula)", desc: "해묵은 결정 고비, 과부하된 정보 처리, 모순된 감정들이 소용돌이치는 혼합 정서입니다.", element: "은하수 🌌" }
};

export default function AuraGarden({ dreams }: AuraGardenProps) {
  const [selectedAura, setSelectedAura] = useState<string | null>(null);
  const [emotionDistribution, setEmotionDistribution] = useState<Array<{ name: string; percentage: number; count: number }>>([]);
  const [primaryEmotion, setPrimaryEmotion] = useState<string>("안도");

  useEffect(() => {
    if (!dreams || dreams.length === 0) return;

    // Aggregate emotions
    const counts: Record<string, number> = {};
    let totalEmotions = 0;

    dreams.forEach(d => {
      if (d.emotions && Array.isArray(d.emotions)) {
        d.emotions.forEach(em => {
          counts[em] = (counts[em] || 0) + 1;
          totalEmotions++;
        });
      }
    });

    if (totalEmotions === 0) {
      setEmotionDistribution([{ name: "안도", percentage: 100, count: 1 }]);
      setPrimaryEmotion("안도");
      return;
    }

    const compiled = Object.keys(counts).map(key => ({
      name: key,
      count: counts[key],
      percentage: Math.round((counts[key] / totalEmotions) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    setEmotionDistribution(compiled);
    if (compiled.length > 0) {
      setPrimaryEmotion(compiled[0].name);
    }
  }, [dreams]);

  const activeConfig = AURA_CONFIGS[selectedAura || primaryEmotion] || AURA_CONFIGS["안도"];

  return (
    <div id="aura-garden-root" className="bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Flower2 className="w-4 h-4 text-pink-400 rotate-45" />
          누적 오라 컬러 정원 (Aura Garden)
        </h3>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-950 border border-indigo-900 rounded-full text-indigo-400">
          실시간 아우라
        </span>
      </div>

      <p className="text-[11px] text-indigo-200/50 leading-relaxed font-sans mb-5">
        누적된 무의식 감정들의 가파른 수면 흐름을 분석하여 차크라 멜로디에 마주선 3D 오라 보충 필드를 가꿔나갑니다.
      </p>

      {/* Big Interactive Visualizer stage */}
      <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-full bg-[#080A18]/90 border border-indigo-950 flex items-center justify-center p-6 mb-6 overflow-hidden">
        {/* Dynamic Glowing Aura Balls inside back field */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAura || primaryEmotion}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.5 }}
            style={{
              background: `radial-gradient(circle, rgba(${activeConfig.rgb}, 0.55) 0%, rgba(${activeConfig.rgb}, 0.15) 45%, transparent 70%)`
            }}
            className="absolute inset-0 w-full h-full rounded-full animate-pulse pointer-events-none filter blur-xl"
          />
        </AnimatePresence>

        {/* Outer orbital decorative ring */}
        <div className="absolute inset-4 rounded-full border border-indigo-900/15 border-dashed animate-[spin_60s_linear_infinite]" />
        <div className="absolute inset-10 rounded-full border border-indigo-500/5 animate-[spin_25s_linear_infinite]" />

        {/* Floating Interactive Aura Seeds */}
        <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-4">
          {emotionDistribution.map((em, index) => {
            const config = AURA_CONFIGS[em.name] || AURA_CONFIGS["안도"];
            const isTarget = (selectedAura || primaryEmotion) === em.name;
            const size = Math.max(34, Math.min(80, em.percentage * 1.5));
            
            return (
              <motion.button
                key={em.name}
                onClick={() => setSelectedAura(em.name)}
                whileHover={{ scale: 1.15 }}
                className={`relative rounded-full bg-gradient-to-tr ${config.color} border flex flex-col items-center justify-center shadow-lg cursor-pointer select-none transition-all duration-300 ${
                  isTarget ? "border-white ring-4 ring-indigo-500/25 scale-110 z-10" : "border-indigo-900/50 opacity-80"
                }`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              >
                {/* Floating energy glow detail */}
                <span className="text-xs font-black text-white pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {em.name}
                </span>
                <span className="text-[8px] font-mono font-black text-indigo-200/90 pointer-events-none drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
                  {em.percentage}%
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Aura Deep Insight Desk */}
      <div className="bg-[#0B0D1B] border border-indigo-950 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm">🔮</span>
          <h4 className="text-xs font-bold text-indigo-100 flex items-center justify-between w-full">
            <span>{activeConfig.title} 아우라</span>
            <span className="text-[10px] text-pink-400 font-mono font-black bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
              특질: {activeConfig.element}
            </span>
          </h4>
        </div>
        <p className="text-[11px] leading-relaxed text-indigo-300/80 font-sans font-medium">
          {activeConfig.desc}
        </p>

        {selectedAura && (
          <button
            onClick={() => setSelectedAura(null)}
            className="mt-3 text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors block text-right w-full font-bold uppercase tracking-wider font-mono"
          >
            ← 기본 종합아우라 보기
          </button>
        )}
      </div>
    </div>
  );
}
