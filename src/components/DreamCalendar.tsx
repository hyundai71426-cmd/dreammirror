import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Eye } from "lucide-react";
import { Dream } from "../types";
import { ThemeStyle } from "../theme";

interface DreamCalendarProps {
  dreams: Dream[];
  onSelectDream: (dream: Dream) => void;
  onAddNewDreamWithDate: (dateStr: string) => void;
  theme?: ThemeStyle;
}

export default function DreamCalendar({ dreams, onSelectDream, onAddNewDreamWithDate, theme }: DreamCalendarProps) {
  // Simple calendar component initialized to June 2026 to align with the prompt's mocked dates
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 1-indexed, so 6 is June

  const months = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get total days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Get start day of week (0 for Sun, 6 for Sat)
  const getStartDayOfWeek = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDay = getStartDayOfWeek(currentYear, currentMonth);

  // Generate date list with padding
  const calendarDays: { day: number | null; dateString: string | null }[] = [];
  
  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ day: null, dateString: null });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = currentMonth.toString().padStart(2, "0");
    const dayStr = d.toString().padStart(2, "0");
    calendarDays.push({
      day: d,
      dateString: `${currentYear}-${monthStr}-${dayStr}`
    });
  }

  // Group dreams by date for calendar lookups
  const dreamsByDate: Record<string, Dream[]> = {};
  dreams.forEach((dream) => {
    if (dream.createdAt) {
      if (!dreamsByDate[dream.createdAt]) {
        dreamsByDate[dream.createdAt] = [];
      }
      dreamsByDate[dream.createdAt].push(dream);
    }
  });

  // Get emoji based on worst dream logged on that day
  const getDayMoodEmoji = (dateStr: string) => {
    const list = dreamsByDate[dateStr];
    if (!list || list.length === 0) return null;
    
    // Sort so nightmare rate 4-5 gets 😨, rate 1 is 🙂, others on 😐
    const worstNightmare = Math.max(...list.map(d => d.nightmareScore || 0));
    
    if (worstNightmare >= 4) return "😨";
    if (worstNightmare <= 1) return "🙂";
    return "😐";
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>("2026-06-19");

  const selectedDayDreams = selectedCalendarDate ? (dreamsByDate[selectedCalendarDate] || []) : [];
  const isZen = theme?.id === "zen";

  return (
    <div id="dream-calendar-root" className={`px-4 pb-24 ${isZen ? "text-stone-900" : "text-white"}`}>
      {/* Calendar Header */}
      <div className="pt-6 pb-4">
        <h2 className={`text-2xl font-black flex items-center gap-2 ${isZen ? "text-stone-950 font-black" : "text-indigo-100"}`}>
          꿈 달력
          <span className={`text-xs py-0.5 px-2.5 rounded-full font-mono font-bold border ${
            isZen 
              ? "bg-stone-200 border-stone-300 text-stone-700" 
              : "bg-indigo-950 border-indigo-805 text-indigo-400"
          }`}>
            CALENDAR
          </span>
        </h2>
        <p className={`text-xs ${isZen ? "text-stone-500 font-medium" : "text-indigo-300/50"}`}>매달 수면 속 감정 지도를 일기식으로 비추기</p>
      </div>

      {/* Calendar Box */}
      <div className={`rounded-3xl p-5 mb-6 border ${
        isZen 
          ? "bg-[#FAF7F0] border-stone-250 shadow-sm"
          : "bg-indigo-950/20 border-indigo-900/40"
      }`}>
        
        {/* Month Selector */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handlePrevMonth} 
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isZen 
                ? "border-stone-300 hover:bg-stone-205 text-stone-800 bg-white" 
                : "border-indigo-900 hover:bg-indigo-950 text-indigo-300"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`text-base font-black font-mono tracking-wider ${isZen ? "text-stone-900" : "text-indigo-100"}`}>
            {currentYear}년 {months[currentMonth]}
          </span>
          <button 
            onClick={handleNextMonth} 
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isZen 
                ? "border-stone-300 hover:bg-stone-205 text-stone-800 bg-white" 
                : "border-indigo-900 hover:bg-indigo-950 text-indigo-300"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of Week Label */}
        <div className={`grid grid-cols-7 gap-y-2 text-center text-xs font-bold mb-3 uppercase tracking-wider font-mono ${
          isZen ? "text-stone-500 font-bold" : "text-indigo-300/40"
        }`}>
          <span>일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-x-2 gap-y-3 text-center">
          {calendarDays.map((cal, idx) => {
            if (!cal.day || !cal.dateString) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const hasDreams = !!dreamsByDate[cal.dateString];
            const moodEmoji = getDayMoodEmoji(cal.dateString);
            const isSelected = selectedCalendarDate === cal.dateString;

            return (
              <button
                key={`day-${cal.day}`}
                id={`calendar-day-${cal.day}`}
                onClick={() => setSelectedCalendarDate(cal.dateString)}
                className={`h-11 rounded-1.5xl flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                  isSelected
                    ? isZen
                      ? "bg-stone-900 text-[#FDFBF7] font-black scale-105 shadow-sm border border-stone-950"
                      : "bg-indigo-600 font-extrabold scale-105 shadow-md shadow-indigo-950 text-white"
                    : hasDreams
                      ? isZen
                        ? "bg-white border-2 border-stone-800 text-stone-950 font-black shadow-xs"
                        : "bg-indigo-950/60 border border-indigo-800 text-indigo-100 font-bold"
                      : isZen
                        ? "bg-stone-150/80 hover:bg-stone-200 text-stone-400"
                        : "bg-[#0B0D1B]/50 hover:bg-slate-900/50 text-indigo-300/40"
                }`}
              >
                <span className="text-xs">{cal.day}</span>
                {moodEmoji && (
                  <span className="text-[11px] absolute -bottom-1 text-center scale-105">{moodEmoji}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mood Indicators footer */}
        <div className={`flex justify-center space-x-4 border-t mt-6 pt-4 text-[10px] font-bold ${
          isZen 
            ? "border-stone-200 text-stone-500" 
            : "border-indigo-900/10 text-indigo-300/50"
        }`}>
          <span className="flex items-center gap-1">🙂 좋은 꿈</span>
          <span className="flex items-center gap-1">😐 일반 꿈</span>
          <span className="flex items-center gap-1">😨 악몽</span>
          <span className="flex items-center gap-1">🔘 기록 없음</span>
        </div>
      </div>

      {/* Day summary list */}
      <div className="space-y-4">
        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 ${
          isZen ? "text-stone-850" : "text-indigo-400"
        }`}>
          <CalIcon className="w-3.5 h-3.5" />
          {selectedCalendarDate} 꿈 기록 모음
        </h3>

        {selectedDayDreams.length > 0 ? (
          selectedDayDreams.map((dr) => (
            <div
              key={dr.id}
              onClick={() => onSelectDream(dr)}
              className={`border rounded-2xl p-4 flex justify-between items-center transition-all cursor-pointer ${
                isZen 
                  ? "bg-white border-stone-250 shadow-xs hover:bg-stone-50 text-stone-900" 
                  : "bg-indigo-950/20 border-indigo-900/40 hover:bg-indigo-950/30 text-white"
              }`}
            >
              <div>
                <h4 className={`text-sm font-bold mb-1 ${isZen ? "text-stone-900" : "text-white"}`}>{dr.title}</h4>
                <div className="flex gap-1.5">
                  {dr.emotions.map((em, index) => (
                    <span 
                      key={index} 
                      className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                        isZen 
                          ? "bg-stone-100 border-stone-250 text-stone-700 font-bold" 
                          : "bg-indigo-900/50 border border-indigo-800/40 text-indigo-300 font-bold"
                      }`}
                    >
                      {em}
                    </span>
                  ))}
                </div>
              </div>
              <Eye className={`w-4 h-4 ${isZen ? "text-stone-400" : "text-indigo-400/50"}`} />
            </div>
          ))
        ) : (
          <div className={`rounded-2xl p-6 text-center border ${
            isZen 
              ? "bg-stone-100 border-stone-200" 
              : "bg-indigo-950/10 border-indigo-900/10"
          }`}>
            <p className={`text-xs mb-3 ${isZen ? "text-stone-500 font-semibold" : "text-indigo-300/40"}`}>
              해당 선택한 날짜에 기록된 꿈이 존재하지 않습니다.
            </p>
            {selectedCalendarDate && (
              <button
                onClick={() => onAddNewDreamWithDate(selectedCalendarDate)}
                className={`py-2 px-4 rounded-xl text-[11px] font-black border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  isZen
                    ? "bg-stone-900 text-[#FDFBF7] hover:bg-stone-800 border-stone-950"
                    : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-800"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                이 날짜에 새 꿈 남기기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
