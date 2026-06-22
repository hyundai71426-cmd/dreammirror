import { useState } from "react";
import { Search, Star, Sparkles, Filter, Trash2, Calendar, Smile, AlertCircle } from "lucide-react";
import { Dream } from "../types";
import { ThemeStyle } from "../theme";

interface DreamListProps {
  dreams: Dream[];
  onSelect: (dream: Dream) => void;
  onDelete: (id: string) => void;
  theme?: ThemeStyle;
}

export default function DreamList({ dreams, onSelect, onDelete, theme }: DreamListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>("all");
  const [vividnessFilter, setVividnessFilter] = useState<string>("all"); // "all" | "high" | "moderate"
  const [sleepFilter, setSleepFilter] = useState<string>("all"); // "all" | "good" | "poor"

  const EMOTIONS_FILTER_LIST = [
    { value: "all", label: "전체 감정" },
    { value: "공포", label: "😨 공포" },
    { value: "불안", label: "😰 불안" },
    { value: "슬픔", label: "😢 슬픔" },
    { value: "행복", label: "🙂 행복" },
    { value: "설렘", label: "🥰 설렘" },
    { value: "혼란", label: "🤪 혼란" },
  ];

  const hasTheme = !!theme;

  // Filter dreams based on text search, emotion tag, vividness and sleep score
  const filteredDreams = dreams.filter((dream) => {
    const textMatch = 
      dream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const emotionMatch = 
      selectedEmotionFilter === "all" ||
      dream.emotions.includes(selectedEmotionFilter);

    const vividnessMatch =
      vividnessFilter === "all" ||
      (vividnessFilter === "high" && dream.vividness >= 4) ||
      (vividnessFilter === "moderate" && dream.vividness < 4);

    const sleepMatch =
      sleepFilter === "all" ||
      (sleepFilter === "good" && dream.sleepScore >= 4) ||
      (sleepFilter === "poor" && dream.sleepScore < 4);

    return textMatch && emotionMatch && vividnessMatch && sleepMatch;
  });

  const getDayOfWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[date.getDay()];
    } catch {
      return "월";
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parseInt(parts[1])}월 ${parseInt(parts[2])}일 (${getDayOfWeek(dateStr)})`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="dream-list-root" className={`px-4 pb-24 transition-all duration-300 ${hasTheme && theme.id === "zen" ? "text-stone-900" : "text-white"}`}>
      {/* List Header */}
      <div className="pt-6 pb-4">
        <h2 className={`text-2xl font-black tracking-tight mb-1 flex items-center gap-2 ${hasTheme && theme.id === "zen" ? "text-stone-950 font-black" : "text-indigo-100"}`}>
          내 꿈 목록
          <span className={`text-[11px] py-1 px-2.5 rounded-full uppercase font-mono font-black border ${hasTheme ? theme.badgeBg : "bg-indigo-950 border-indigo-800 text-indigo-400"}`}>
            {filteredDreams.length}개
          </span>
        </h2>
        <p className={`text-xs ${hasTheme && theme.id === "zen" ? "text-stone-500 font-medium" : "text-indigo-300/50"}`}>
          차곡차곡 기록해 나가는 무의식의 아카이브
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className={`w-5 h-5 absolute left-4.5 top-1/2 -translate-y-1/2 ${hasTheme && theme.id === "zen" ? "text-stone-400" : "text-indigo-400/50"}`} />
        <input
          id="dream-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="꿈 내용, 인물, 장소 단어 검색..."
          className={`w-full rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all border ${
            hasTheme && theme.id === "zen" 
              ? "bg-white border-stone-250 text-stone-900 placeholder-stone-400 focus:border-stone-400" 
              : hasTheme && theme.id === "neo-aura"
                ? "bg-black/40 border-pink-500/20 text-slate-100 placeholder-slate-600 focus:border-[#f43f5e]"
                : "bg-indigo-950/20 border-indigo-900/40 text-indigo-100 placeholder-indigo-300/30 focus:border-indigo-400"
          }`}
        />
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3.5 scrollbar-none">
        <Filter className={`w-4 h-4 shrink-0 ${hasTheme && theme.id === "zen" ? "text-stone-400" : "text-indigo-400/40"}`} />
        {EMOTIONS_FILTER_LIST.map((em) => {
          const isSel = selectedEmotionFilter === em.value;
          let pillStyle = "";
          
          if (isSel) {
            pillStyle = hasTheme 
              ? theme.id === "zen" 
                ? "bg-stone-850 text-white shadow-sm" 
                : theme.id === "neo-aura"
                  ? "bg-[#f43f5e] text-white shadow-md shadow-rose-500/25"
                  : "bg-indigo-600 text-white shadow-md"
              : "bg-indigo-600 text-white shadow-md";
          } else {
            pillStyle = hasTheme
              ? theme.id === "zen"
                ? "bg-stone-100 text-stone-500 border border-stone-200/55 hover:text-stone-800"
                : theme.id === "neo-aura"
                  ? "bg-black/30 border border-slate-850 text-slate-400 hover:text-slate-200"
                  : "bg-indigo-950/40 border border-indigo-900/60 text-indigo-300/60 hover:text-indigo-200"
              : "bg-indigo-950/40 border border-indigo-900/60 text-indigo-300/60 hover:text-indigo-200";
          }

          return (
            <button
              key={em.value}
              id={`filter-pill-${em.value}`}
              onClick={() => setSelectedEmotionFilter(em.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${pillStyle}`}
            >
              {em.label}
            </button>
          );
        })}
      </div>

      {/* UX ROADMAP 1: Dynamic Vividness & Sleep Score Sub-filters */}
      <div className={`p-4 rounded-2xl mb-5 space-y-3.5 border transition-all ${
        hasTheme && theme.id === "zen"
          ? "bg-[#FAF7F0] border-stone-200 text-stone-800"
          : theme.id === "neo-aura"
            ? "bg-[#141021]/60 border-[#d946ef]/15 text-slate-200"
            : "bg-indigo-950/20 border-indigo-900/40 text-indigo-200"
      }`}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
            <span>⚙️</span>
            <span>MOBILE UX 1차 주 정밀 세부 필터링</span>
          </span>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-black font-mono">
            적용중
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Vividness selector dial */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold block ${hasTheme && theme.id === "zen" ? "text-stone-500" : "text-indigo-400"}`}>
              무의식 선명도 (Vividness)
            </span>
            <div className={`grid grid-cols-3 p-0.5 rounded-lg border text-[10px] font-bold ${
              hasTheme && theme.id === "zen" ? "bg-white border-stone-200" : "bg-black/30 border-indigo-950/65"
            }`}>
              {[
                { id: "all", label: "전체" },
                { id: "high", label: "선명(4+)" },
                { id: "moderate", label: "흐림" }
              ].map((opt) => {
                const active = vividnessFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setVividnessFilter(opt.id)}
                    className={`py-1 rounded-md text-[10px] text-center transition-all ${
                      active
                        ? hasTheme && theme.id === "zen"
                          ? "bg-stone-800 text-white font-black"
                          : hasTheme && theme.id === "neo-aura"
                            ? "bg-[#f43f5e] text-white font-black"
                            : "bg-indigo-655 text-white font-black"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sleep score selector dial */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold block ${hasTheme && theme.id === "zen" ? "text-stone-500" : "text-indigo-400"}`}>
              수면 만족도 (Sleep Score)
            </span>
            <div className={`grid grid-cols-3 p-0.5 rounded-lg border text-[10px] font-bold ${
              hasTheme && theme.id === "zen" ? "bg-white border-stone-200" : "bg-black/30 border-indigo-950/65"
            }`}>
              {[
                { id: "all", label: "전체" },
                { id: "good", label: "개운(4+)" },
                { id: "poor", label: "피로" }
              ].map((opt) => {
                const active = sleepFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSleepFilter(opt.id)}
                    className={`py-1 rounded-md text-[10px] text-center transition-all ${
                      active
                        ? hasTheme && theme.id === "zen"
                          ? "bg-stone-800 text-white font-black"
                          : hasTheme && theme.id === "neo-aura"
                            ? "bg-[#f43f5e] text-white font-black"
                            : "bg-indigo-655 text-white font-black"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* List content */}
      <div className="space-y-5">
        {filteredDreams.length > 0 ? (
          filteredDreams.map((dream) => {
            // Render depending on themes
            if (theme && theme.id === "cosmic") {
              // [시안 1] 미니멀 아우라 (Minimalist Aura)
              // - 큼직한 타이포그래피 (text-xl~text-2xl), 극도의 여백
              // - 텍스트 밀도 축소 (짧은 데코레이션 배제, 간결화)
              // - 넉넉한 내부 여백 (p-7 md:p-8)
              return (
                <div
                  key={dream.id}
                  id={`dream-card-${dream.id}`}
                  onClick={() => onSelect(dream)}
                  className="rounded-[32px] p-7 md:p-8 bg-[#0B0D1B]/40 border border-indigo-950/40 hover:border-indigo-500/30 hover:bg-[#0B0D1B]/80 transition-all duration-300 cursor-pointer relative group overflow-hidden shadow-xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A594F9]/60 font-mono">
                      {formatDateString(dream.createdAt)}
                    </span>
                    <span className="text-[10px] font-bold py-1 px-2.5 rounded-full bg-indigo-950 border border-indigo-800/40 text-indigo-400 font-mono uppercase">
                      VIVID: {dream.vividness} / 5
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-3 leading-snug group-hover:text-indigo-300 transition-colors">
                    {dream.title || "무제"}
                  </h3>

                  {/* 텍스트 밀도 50% 축소: 아주 가볍고 짧은 스니펫 제공으로 숨통을 틔움 */}
                  <p className="text-[12px] leading-relaxed text-indigo-300/50 line-clamp-1 mb-6">
                    {dream.content}
                  </p>

                  <div className="flex justify-between items-center pt-5 border-t border-indigo-950/30">
                    <div className="flex flex-wrap gap-1.5">
                      {dream.emotions.slice(0, 2).map((em, index) => (
                        <span
                          key={index}
                          className="px-3.5 py-2 rounded-full text-[11px] font-black bg-[#15132d] text-indigo-300 border border-indigo-800/20 flex items-center gap-1.5"
                        >
                          ✨ {em}
                        </span>
                      ))}
                    </div>

                    <button
                      id={`btn-delete-dream-${dream.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("정말로 이 꿈 기록을 삭제하시겠습니까?")) {
                          onDelete(dream.id);
                        }
                      }}
                      className="w-11 h-11 rounded-full bg-indigo-950/40 border border-indigo-900/30 font-bold flex items-center justify-center text-indigo-550 hover:text-red-400 hover:bg-indigo-900/45 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            } else if (theme && theme.id === "neo-aura") {
              // [시안 2] 네온 보이지 (Neon Voyage)
              // - 픽토그램 중심의 데이터화, 네온 그라데이션 컬러칩, 명도 대비 극대화
              // - 3D 둥글둥글한 비주얼 위젯
              return (
                <div
                  key={dream.id}
                  id={`dream-card-${dream.id}`}
                  onClick={() => onSelect(dream)}
                  className="rounded-2xl p-5 bg-[#141021] border-2 border-fuchsia-900/30 hover:border-fuchsia-500/70 hover:shadow-[0_0_15px_rgba(217,70,239,0.15)] transition-all duration-300 cursor-pointer relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-15">
                    <Sparkles className="w-12 h-12 text-[#f43f5e]" />
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[11px] font-bold text-[#f472b6] bg-black/40 px-2.5 py-1 rounded-md border border-fuchsia-950">
                      {formatDateString(dream.createdAt)}
                    </span>
                    <div className="flex space-x-1 py-1 px-2.5 rounded-full bg-pink-950/30 border border-pink-900/30">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= dream.vividness ? "fill-pink-500 text-pink-500" : "text-zinc-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-white mb-2.5 tracking-tight group-hover:text-fuchsia-400 transition-colors">
                    {dream.title || "기록되지 않은 꿈"}
                  </h3>

                  <p className="text-[13px] leading-relaxed text-zinc-300 mb-4 line-clamp-2">
                    {dream.content}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-fuchsia-950/40">
                    {/* 입체적 네온 컬러 그라데이션이 제공되는 비주얼 크고 둥글둥글 칩 */}
                    <div className="flex flex-wrap gap-2">
                      {dream.emotions.map((em, index) => {
                        let emoEmoji = "🔮";
                        if (em === "분노") emoEmoji = "😡";
                        if (em === "불안") emoEmoji = "😟";
                        if (em === "안도") emoEmoji = "😌";
                        if (em === "슬픔") emoEmoji = "😢";
                        if (em === "기쁨") emoEmoji = "🥰";
                        if (em === "경이") emoEmoji = "🌌";
                        if (em === "혼란") emoEmoji = "🤪";
                        return (
                          <span
                            key={index}
                            className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-fuchsia-950 to-pink-950 text-pink-300 border border-pink-550/30 flex items-center gap-1 shadow-md shadow-pink-950/20"
                          >
                            <span>{emoEmoji}</span>
                            <span>{em}</span>
                          </span>
                        );
                      })}
                      {dream.analysis?.location && dream.analysis.location[0] && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#1E112D] to-black border border-purple-900/50 text-[#f472b6]">
                          🔑 {dream.analysis.location[0]}
                        </span>
                      )}
                    </div>

                    <button
                      id={`btn-delete-dream-${dream.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("정말로 이 꿈 기록을 삭제하시겠습니까?")) {
                          onDelete(dream.id);
                        }
                      }}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-pink-950/20 transition-all"
                    >
                      <Trash2 className="w-4.2 h-4.2" />
                    </button>
                  </div>
                </div>
              );
            } else {
              // [시안 3] 드림 스토리 저널 (Dream Story Journal - Zen)
              // - 책 표지나 서적 일기장 레이아웃, 여유로운 자간과 넉넉한 행간(leading-loose)
              return (
                <div
                  key={dream.id}
                  id={`dream-card-${dream.id}`}
                  onClick={() => onSelect(dream)}
                  className="rounded-3xl p-6 bg-[#FAF7F0] border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all duration-300 cursor-pointer relative group overflow-hidden flex"
                >
                  {/* Faux book spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-stone-300" />
                  
                  <div className="pl-4 w-full">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateString(dream.createdAt)}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-stone-150 rounded-md border border-stone-250 text-stone-600 font-mono">
                        Vol.{dream.vividness}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-stone-900 mb-2 leading-snug font-serif tracking-tight group-hover:text-amber-850 transition-colors">
                      {dream.title || "어느 수면의 정취"}
                    </h3>

                    {/* 행간 조율: 넉넉한 줄간격(leading-loose)으로 가독성 최우선 */}
                    <p className="text-[13px] leading-loose tracking-wide text-stone-600 mb-4 font-serif font-medium line-clamp-3">
                      {dream.content}
                    </p>

                    <div className="flex justify-between items-center pt-3.5 border-t border-stone-200/60">
                      <div className="flex flex-wrap gap-1.5">
                        {dream.emotions.map((em, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80 flex items-center gap-1"
                          >
                            📖 {em}
                          </span>
                        ))}
                      </div>

                      <button
                        id={`btn-delete-dream-${dream.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("정말로 이 꿈 기록을 삭제하시겠습니까?")) {
                            onDelete(dream.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })
        ) : (
          <div className={`text-center py-20 border rounded-3xl ${
            hasTheme && theme.id === "zen" ? "bg-stone-50 border-stone-200" : "bg-indigo-950/10 border-indigo-900/10"
          }`}>
            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${hasTheme && theme.id === "zen" ? "text-stone-300" : "text-indigo-500/30"}`} />
            <p className={`text-sm font-bold ${hasTheme && theme.id === "zen" ? "text-stone-850" : "text-indigo-305"}`}>기록 및 검색된 꿈이 없습니다.</p>
            <p className={`text-xs mt-1 leading-relaxed px-4 ${hasTheme && theme.id === "zen" ? "text-stone-400" : "text-indigo-200/40"}`}>
              홈 화면에서 마이크 버튼을 눌러 오늘 아침의 꿈을 들려주세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
