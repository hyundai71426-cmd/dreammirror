import { useState } from "react";
import { Search, Sparkles, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { lookUpSymbol } from "../api";

interface SymbolData {
  core: string;
  explanation: string;
  advice: string;
}

export default function SymbolDictionary() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymbolData | null>(null);

  const SUGGESTED_TAGS = ["뱀", "물", "학교", "추격", "이빨", "절벽", "날다"];

  const handleLookup = async (word: string) => {
    const targetWord = word.trim() || keyword.trim();
    if (!targetWord) return;

    if (word) {
      setKeyword(word);
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await lookUpSymbol(targetWord);
      setResult(data);
    } catch (e) {
      console.error("Symbol lookup failed:", e);
      setResult({
        core: "심리적 긴장의 투영",
        explanation: "꿈 속 인지 상징은 상황에 따른 변칙성이 강합니다. 마음 깊은 성찰적 기틀로 자신만의 감정의 흐름과 연동해 상상해 보세요.",
        advice: "그 대상에 대해 느꼈던 찰나의 촉감이나 분위기를 기록으로 복원하는 것을 권합니다."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="symbol-dictionary-root" className="bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
      <div className="flex items-center space-x-1.5 mb-4">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest font-mono">
          꿈 무의식 상징 원형 백과사전
        </h3>
      </div>

      <p className="text-[11px] text-indigo-200/50 leading-relaxed font-sans mb-4">
        꿈에 자꾸 침입하는 신비한 사물이나 동물, 혹은 환경적 열쇠 상징을 탐색하여 숨겨진 의도와 방향성을 해독합니다.
      </p>

      {/* Input row */}
      <div className="relative mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup("")}
          placeholder="주요 상징 검색 (예: 뱀, 추격, 절벽...)"
          className="w-full bg-[#080B1B] text-xs text-white rounded-2xl py-3.5 pl-4 pr-12 outline-none border border-indigo-900/60 focus:border-indigo-400 transition-colors font-sans"
        />
        <button
          onClick={() => handleLookup("")}
          disabled={loading || !keyword.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Tags suggest row */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleLookup(tag)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-950/50 border border-indigo-900/40 text-indigo-300/80 hover:text-indigo-200 hover:border-indigo-500 hover:bg-indigo-900 transition-all cursor-pointer font-sans"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Results block wrapper */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-10 text-center flex flex-col items-center gap-2"
          >
            <div className="w-5 h-5 rounded-full border-2 border-indigo-950 border-t-indigo-400 animate-spin" />
            <span className="text-[10px] text-indigo-400 font-bold font-mono">무의식 인류학 원형 해독 중...</span>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-indigo-500/20 bg-indigo-950/20 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-1.5 border-b border-indigo-900/40 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse animate-spin" />
              <h4 className="text-xs font-bold text-indigo-200">
                원형: <span className="text-cyan-300">{result.core}</span>
              </h4>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 block font-mono">심리 상징적 연관성</span>
                <p className="text-[11px] leading-relaxed text-indigo-100 font-sans mt-0.5">
                  {result.explanation}
                </p>
              </div>

              <div className="bg-[#0B0D1B]/50 p-2.5 rounded-xl border border-indigo-900/20">
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  💡 자아 성찰 실천 제언
                </span>
                <p className="text-[11px] leading-relaxed text-amber-200/90 font-sans mt-0.5">
                  {result.advice}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
