import { useState } from "react";
import { ArrowLeft, Trash2, Heart, ShieldAlert, Sparkles, Star, UserPlus, MapPin, KeyRound, Clock, Edit3, Check } from "lucide-react";
import { Dream } from "../types";

interface DreamDetailProps {
  dream: Dream;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate: (dream: Dream) => void;
}

export default function DreamDetail({ dream, onBack, onDelete, onUpdate }: DreamDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(dream.title);
  const [editContent, setEditContent] = useState(dream.content);

  // Freud vs Jung Perspectives
  const [loadingPerspectives, setLoadingPerspectives] = useState(false);
  const [perspectives, setPerspectives] = useState<{ freud: string; jung: string } | null>(null);
  const [activePerspTab, setActivePerspTab] = useState<"freud" | "jung">("freud");

  // Character Chatbot
  const [activeChatChar, setActiveChatChar] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "char"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const fetchPerspectives = async () => {
    if (perspectives) return;
    setLoadingPerspectives(true);
    try {
      const customApiKey = localStorage.getItem("gemini_api_key") || "";
      const customModel = localStorage.getItem("gemini_preferred_model") || "gemini-3.1-flash-lite";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) headers["x-gemini-api-key"] = customApiKey;
      if (customModel) headers["x-gemini-model"] = customModel;

      const response = await fetch("/api/analyze-perspectives", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: dream.title, content: dream.content })
      });
      const data = await response.json();
      setPerspectives(data);
    } catch (e) {
      console.error("Perspective analysis failed:", e);
      setPerspectives({
        freud: "지그문트 프로이트학파적 시점: 꿈 내용의 이면에는 억압된 충동과 원초적 리비도가 자아의 검열을 피해 우회적으로 표출되어 있습니다.",
        jung: "칼 융학파적 시점: 본 꿈의 이미지들은 자아의 일지적 과중을 보정하고, 무의식적 그림자(Shadow)를 통합해 온전한 자기존엄(Self)으로 가려는 정신적 보상 작용입니다."
      });
    } finally {
      setLoadingPerspectives(false);
    }
  };

  const startCharacterChat = (charName: string) => {
    setActiveChatChar(charName);
    setChatHistory([
      {
        role: "char",
        text: `안녕? 나는 네 꿈속의 '${charName}'이야. 비록 무정형의 스토리라인 속이었지만, 네 마음속 투영으로서 너와 중요한 이야기를 나누고 싶어서 찾아왔어. 최근에 마음 상태나 고민거리가 있었니?`
      }
    ]);
    setChatInput("");
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeChatChar || sendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setSendingChat(true);

    try {
      const customApiKey = localStorage.getItem("gemini_api_key") || "";
      const customModel = localStorage.getItem("gemini_preferred_model") || "gemini-3.1-flash-lite";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) headers["x-gemini-api-key"] = customApiKey;
      if (customModel) headers["x-gemini-model"] = customModel;

      const response = await fetch("/api/chat-character", {
        method: "POST",
        headers,
        body: JSON.stringify({
          character: activeChatChar,
          dreamContent: dream.content,
          userInput: userMsg,
          chatHistory: chatHistory.map(h => ({ sender: h.role === "user" ? "user" : "character", text: h.text }))
        })
      });

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: "char", text: data.response || "내면에 울림이 지나갑니다. 가슴을 들여다 보세요." }]);
    } catch (e) {
      console.error("Character chat failed:", e);
      setChatHistory(prev => [...prev, { role: "char", text: `${activeChatChar}의 환영이 흐려지고 있습니다. 나중에 다시 마음속 메아리를 두드려 주세요.` }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleUpdateSubmit = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목과 내용을 채워주세요.");
      return;
    }
    const updated: Dream = {
      ...dream,
      title: editTitle,
      content: editContent
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const getDayOfWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[date.getDay()];
    } catch {
      return "월";
    }
  };

  return (
    <div id="dream-detail-root" className="px-5 pb-24 text-white">
      {/* Top action bar */}
      <div className="flex justify-between items-center py-5">
        <button id="btn-back-to-list" onClick={onBack} className="p-2 -ml-2 text-indigo-400 hover:text-indigo-200 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-xs font-semibold tracking-wider text-indigo-400 font-mono">꿈 상세 분석 🔮</span>
        
        <div className="flex items-center space-x-1">
          <button
            id="btn-edit-toggle"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-indigo-400 hover:text-indigo-200 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            id="btn-detail-delete"
            onClick={() => {
              if (confirm("정말로 이 꿈 기록을 영구 삭제하시겠습니까?")) {
                onDelete(dream.id);
              }
            }}
            className="p-2 text-indigo-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit screen */
        <div className="space-y-4">
          <h3 className="text-lg font-bold mb-3">꿈 기록 직접 수정</h3>
          
          <div className="bg-indigo-900/20 border border-indigo-950 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block mb-1">꿈 제목</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#080B1B] text-sm text-white rounded-xl py-2.5 px-4 outline-none border border-indigo-900/60 focus:border-indigo-400"
            />
          </div>

          <div className="bg-indigo-900/20 border border-indigo-950 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block mb-1">꿈 스토리 내용</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full bg-[#080B1B] text-sm leading-relaxed text-indigo-100 rounded-xl py-2.5 px-4 outline-none border border-indigo-900/60 focus:border-indigo-400 resize-none"
            />
          </div>

          <button
            onClick={handleUpdateSubmit}
            className="w-full py-3 bg-indigo-600 rounded-xl font-bold flex items-center justify-center space-x-1.5 hover:bg-indigo-500 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>수정사항 저장하기</span>
          </button>
        </div>
      ) : (
        /* Read Screen */
        <div>
          {/* Metadata */}
          <div className="mb-4">
            <span className="text-xs bg-indigo-950 border border-indigo-800 text-indigo-400 px-3 py-1 rounded-full font-bold">
              {dream.createdAt} ({getDayOfWeek(dream.createdAt)})
            </span>
            
            <h1 className="text-2xl font-black text-white mt-3 mb-2 tracking-tight">
              {dream.title || "무제"}
            </h1>

            {/* Custom emotional pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              {dream.emotions.map((em) => (
                <span 
                  key={em} 
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-900/50 text-indigo-300 flex items-center gap-1.5"
                >
                  🎭 {em}
                </span>
              ))}
            </div>
          </div>

          {/* Key Metrics row */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-3 flex justify-between items-center">
              <span className="text-xs text-indigo-300">악몽 강도</span>
              <span className="text-xs font-bold text-red-400">🔥 {dream.nightmareScore || 1} / 5</span>
            </div>
            <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-3 flex justify-between items-center">
              <span className="text-xs text-indigo-300">기억 선명도</span>
              <span className="text-xs font-bold text-yellow-400">⭐ {dream.vividness || 1} / 5</span>
            </div>
          </div>

          {/* Dream narrative content */}
          <div className="bg-indigo-950/10 border border-indigo-900/20 rounded-3xl p-5 mb-6">
            <h3 className="text-xs font-bold text-indigo-400 mb-2 tracking-wider">나의 꿈 나레이션</h3>
            <p className="text-sm leading-relaxed text-indigo-100/90 whitespace-pre-line font-sans">
              {dream.content}
            </p>
          </div>

          {/* AI Structured analysis box */}
          {dream.analysis && (
            <div className="bg-gradient-to-b from-[#13173A] to-[#0E1029] border border-indigo-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <Sparkles className="w-16 h-16 text-indigo-300" />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1 px-2 bg-indigo-500/15 border border-indigo-400/30 rounded-lg text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-300 animate-spin" />
                  AI 분석 요약
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Characters */}
                <div className="flex items-start pb-2.5 border-b border-indigo-950/60">
                  <span className="w-16 text-indigo-300/80 font-bold shrink-0 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    인물:
                  </span>
                  <span className="text-indigo-100/90 font-medium">
                    {dream.analysis.people && dream.analysis.people.length > 0 
                      ? dream.analysis.people.join(", ") 
                      : "나"}
                  </span>
                </div>

                {/* Places */}
                <div className="flex items-start pb-2.5 border-b border-indigo-950/60">
                  <span className="w-16 text-indigo-300/80 font-bold shrink-0 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    장소:
                  </span>
                  <span className="text-indigo-100/90 font-medium">
                    {dream.analysis.location && dream.analysis.location.length > 0 
                      ? dream.analysis.location.join(", ") 
                      : "일상 공간"}
                  </span>
                </div>

                {/* Themes */}
                <div className="flex items-start pb-4">
                  <span className="w-16 text-indigo-300/80 font-bold shrink-0 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    주요 무의식:
                  </span>
                  <span className="text-indigo-100/90 font-medium">
                    {dream.analysis.theme && dream.analysis.theme.length > 0 
                      ? dream.analysis.theme.join(", ") 
                      : "심리적 성찰"}
                  </span>
                </div>

                {/* AI advice summary block */}
                <div className="bg-indigo-950/40 border border-indigo-900/30 p-4 rounded-2xl relative">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    💡 무의식 거울의 조망
                  </h4>
                  <p className="text-xs text-indigo-200/80 leading-relaxed font-sans font-medium">
                    {dream.analysis.summary || "꿈의 상징성을 조망하며 편안히 성찰해 보세요."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature 1: Freud vs Jung Psychological Perspectives */}
          <div className="mt-6 bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-3">
              <span>⚖️</span> 심리학파별 다각도 해석 (프로이트 vs. 융)
            </h3>
            <p className="text-[10px] text-indigo-200/50 leading-relaxed mb-4">
              동일한 무의식 조각을 두고 정신분석학과 분석심리학이 제시하는 두 거장의 서로 다른 처방적 시선을 오가며 성찰해 보세요.
            </p>

            {!perspectives ? (
              <button
                onClick={fetchPerspectives}
                disabled={loadingPerspectives}
                className="w-full py-3 rounded-2xl bg-indigo-950 border border-indigo-800 hover:border-indigo-500 hover:bg-indigo-900/40 text-xs font-extrabold text-indigo-200 flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {loadingPerspectives ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-900 border-t-indigo-400 animate-spin" />
                    <span>정신분석 위원회 소집 중...</span>
                  </div>
                ) : (
                  <>
                    <span>⚡ 프로이트 vs 융 심층 소집 분석하기</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                {/* Horizontal tabs */}
                <div className="grid grid-cols-2 gap-2 bg-[#080A18] p-1 rounded-xl border border-indigo-950">
                  <button
                    onClick={() => setActivePerspTab("freud")}
                    className={`py-2 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      activePerspTab === "freud"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-indigo-400/70 hover:text-indigo-200"
                    }`}
                  >
                    프로이트 (소망 억압설)
                  </button>
                  <button
                    onClick={() => setActivePerspTab("jung")}
                    className={`py-2 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      activePerspTab === "jung"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-indigo-400/70 hover:text-indigo-200"
                    }`}
                  >
                    융 (원형 보상이론)
                  </button>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-2xl text-xs leading-relaxed text-indigo-200/90 font-sans transition-all">
                  {activePerspTab === "freud" ? (
                    <div>
                      <span className="text-[10px] font-bold text-red-400 block mb-1">Sigmund Freud 🎩</span>
                      <p className="font-sans font-medium">{perspectives.freud}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 block mb-1">Carl Jung 🧭</span>
                      <p className="font-sans font-medium">{perspectives.jung}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feature 7: Subconscious Projection Chatbot Terminal */}
          <div className="mt-6 bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-2">
              <span>💬</span> 무의식 등장인물 페르소나 메신저
            </h3>
            <p className="text-[10px] text-indigo-200/50 leading-relaxed mb-4">
              내 머릿속 기억 상에서 탄생한 자아의 투영 및 그림자 인격과 소울 다이얼로그를 연결하여 상징을 정면으로 물어봅니다.
            </p>

            {/* List of Chatable Characters */}
            {!activeChatChar ? (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-[#5c608f] uppercase block tracking-wider font-mono">대화 가능한 무의식 개체 :</span>
                <div className="flex flex-wrap gap-2">
                  {(dream.analysis?.people && dream.analysis.people.length > 0
                    ? dream.analysis.people
                    : ["나의 그림자(Shadow)", "내면아기(Inner Child)", "수면 가이드"]
                  ).map((charName) => (
                    <button
                      key={charName}
                      onClick={() => startCharacterChat(charName)}
                      className="px-3 py-2 rounded-xl bg-indigo-950 border border-indigo-900/60 hover:border-indigo-400 text-[11px] font-black text-indigo-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      🗣️ {charName} 대화하기
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#080B1C]/95 border border-indigo-950 rounded-2xl p-4 flex flex-col h-[320px] justify-between relative">
                {/* Chat header */}
                <div className="flex justify-between items-center border-b border-indigo-950/80 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-indigo-200">{activeChatChar} 프레임 수신 중...</span>
                  </div>
                  <button
                    onClick={() => setActiveChatChar(null)}
                    className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-2.5 py-1 rounded-lg font-bold hover:text-red-400"
                  >
                    주파수 끊기 ❌
                  </button>
                </div>

                {/* Chat message bubbles scroll window */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-2.5 pr-1 font-sans text-xs scrollbar-none">
                  {chatHistory.map((ch, idx) => {
                    const isUser = ch.role === "user";
                    return (
                      <div
                        key={idx}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed font-sans font-medium ${
                            isUser
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-indigo-950 border border-indigo-900 text-indigo-100 rounded-tl-none font-sans"
                          }`}
                        >
                          <p>{ch.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {sendingChat && (
                    <div className="flex justify-start">
                      <div className="bg-indigo-950/50 border border-indigo-900/30 px-3 py-2 rounded-2xl text-[10px] text-indigo-400 flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
                        <span>생각 정리 중...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form row */}
                <div className="flex gap-1.5 pt-2 border-t border-indigo-950/80">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="무의식에게 메시지 보내기..."
                    className="flex-1 bg-indigo-950 text-xs text-white rounded-xl px-3 py-2.5 outline-none border border-indigo-900 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={sendingChat || !chatInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-black text-white rounded-xl cursor-pointer shrink-0"
                  >
                    전송
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer Warning */}
          <div className="mt-8 mb-4 border border-indigo-950/40 bg-indigo-950/20 p-4 rounded-2xl flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400/60 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-indigo-300/40">
              ※ 모든 분석 결과는 의료적 진단이 아니며, 참고용 정보입니다. 의학적 상담이나 진료가 필요한 경우 정신건강의학과 전문의 등 의료 전문가에게 문의하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
