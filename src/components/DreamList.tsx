import { useState } from "react";
import { Search, Star, Sparkles, Filter, Trash2, Calendar, Smile, AlertCircle } from "lucide-react";
import { Dream } from "../types";

interface DreamListProps {
  dreams: Dream[];
  onSelect: (dream: Dream) => void;
  onDelete: (id: string) => void;
}

export default function DreamList({ dreams, onSelect, onDelete }: DreamListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<string>("all");

  const EMOTIONS_FILTER_LIST = [
    { value: "all", label: "전체 감정" },
    { value: "공포", label: "😨 공포" },
    { value: "불안", label: "😰 불안" },
    { value: "슬픔", label: "😢 슬픔" },
    { value: "행복", label: "🙂 행복" },
    { value: "설렘", label: "🥰 설렘" },
    { value: "혼란", label: "🤪 혼란" },
  ];

  // Filter dreams based on text search and emotion tag
  const filteredDreams = dreams.filter((dream) => {
    const textMatch = 
      dream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const emotionMatch = 
      selectedEmotionFilter === "all" ||
      dream.emotions.includes(selectedEmotionFilter);

    return textMatch && emotionMatch;
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
    <div id="dream-list-root" className="px-4 pb-24 text-white">
      {/* List Header */}
      <div className="pt-6 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-indigo-100 flex items-center gap-2">
          내 꿈 목록
          <span className="text-xs py-1 px-2.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono">
            {filteredDreams.length}개
          </span>
        </h2>
        <p className="text-xs text-indigo-300/50">차곡차곡 기록해 나가는 무의식의 아카이브</p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-indigo-400/50 absolute left-4.5 top-1/2 -translate-y-1/2" />
        <input
          id="dream-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="꿈 내용, 인물, 장소 단어 검색..."
          className="w-full bg-indigo-950/20 border border-indigo-900/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-indigo-100 outline-none placeholder-indigo-300/30 focus:border-indigo-400 focus:bg-indigo-950/40 transition-colors"
        />
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-none">
        <Filter className="w-4 h-4 text-indigo-400/40 shrink-0" />
        {EMOTIONS_FILTER_LIST.map((em) => (
          <button
            key={em.value}
            id={`filter-pill-${em.value}`}
            onClick={() => setSelectedEmotionFilter(em.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedEmotionFilter === em.value
                ? "bg-indigo-600 text-white shadow-md scale-105"
                : "bg-indigo-950/40 border border-indigo-900/60 text-indigo-300/60 hover:text-indigo-200"
            }`}
          >
            {em.label}
          </button>
        ))}
      </div>

      {/* List content */}
      <div className="space-y-4">
        {filteredDreams.length > 0 ? (
          filteredDreams.map((dream) => (
            <div
              key={dream.id}
              id={`dream-card-${dream.id}`}
              onClick={() => onSelect(dream)}
              className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5 hover:border-indigo-500/50 hover:bg-indigo-950/30 transition-all duration-300 cursor-pointer relative group overflow-hidden"
            >
              {/* Subtle light effect top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

              {/* Date & Drag indicators */}
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateString(dream.createdAt)}
                </span>
                
                {/* Vividness Display */}
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= dream.vividness ? "fill-yellow-400 text-yellow-400" : "text-indigo-950 fill-indigo-950"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-extrabold text-white mb-2 tracking-tight group-hover:text-indigo-300 transition-colors">
                {dream.title || "지정되지 않은 제목"}
              </h3>

              {/* Snippet */}
              <p className="text-xs text-indigo-200/60 line-clamp-2 leading-relaxed mb-4">
                {dream.content}
              </p>

              {/* Badges and Delete action */}
              <div className="flex justify-between items-center pt-2 border-t border-indigo-900/20">
                <div className="flex flex-wrap gap-1.5">
                  {dream.emotions.map((em, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1B1D3D] text-indigo-300 border border-indigo-800/40 flex items-center gap-1"
                    >
                      <Smile className="w-2.5 h-2.5 opacity-75" />
                      {em}
                    </span>
                  ))}
                  {dream.analysis?.location && dream.analysis.location[0] && (
                    <span className="px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/30 text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                      📍 {dream.analysis.location[0]}
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
                  className="p-1 text-indigo-400/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-indigo-950/10 border border-indigo-900/10 rounded-3xl">
            <AlertCircle className="w-12 h-12 text-indigo-500/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-indigo-300/60">기록 및 검색된 꿈이 없습니다.</p>
            <p className="text-xs text-indigo-200/30 mt-1">홈 화면에서 마이크 버튼을 눌러 오늘 아침의 꿈을 들려주세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
