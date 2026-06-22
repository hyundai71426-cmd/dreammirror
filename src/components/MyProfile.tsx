import { useState, useEffect } from "react";
import { Sparkles, Moon, RefreshCw, ShieldCheck, Database, Key, Cpu, Eye, EyeOff, Check, HelpCircle, ChevronDown, ChevronUp, ExternalLink, BookOpen } from "lucide-react";
import { THEME_STYLES, ThemeStyle } from "../theme";

interface MyProfileProps {
  totalDreams: number;
  unlocked: boolean;
  onResetMocks: () => void;
  onBackToOnboarding: () => void;
  appTheme: string;
  setAppTheme: (theme: string) => void;
  theme: ThemeStyle;
}

export default function MyProfile({ totalDreams, unlocked, onResetMocks, onBackToOnboarding, appTheme, setAppTheme, theme }: MyProfileProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [preferredModel, setPreferredModel] = useState<string>("gemini-3.1-flash-lite");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showApiGuide, setShowApiGuide] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    const savedModel = localStorage.getItem("gemini_preferred_model") || "gemini-3.1-flash-lite";
    setApiKey(savedKey);
    setPreferredModel(savedModel);
    
    // Automatically keep guide open if no custom key is configured yet to guide the user
    if (!savedKey) {
      setShowApiGuide(true);
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("gemini_api_key", apiKey.trim());
    localStorage.setItem("gemini_preferred_model", preferredModel);
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  return (
    <div id="profile-root" className={`px-5 pb-24 ${theme.textPrimary}`}>
      {/* Profile summary card */}
      <div className="pt-6 pb-4">
        <h2 className={`font-black flex items-center gap-2 ${theme.titleSize}`}>
          마이 프로필
          <span className={`text-[10px] border px-2 py-0.5 rounded font-mono ${theme.badgeBg}`}>
            SETUP
          </span>
        </h2>
        <p className={`text-xs ${theme.textMuted} mt-1`}>맞춤 설정 및 무의식 개선 처방 가이드</p>
      </div>

      <div className={`${theme.cardBg} rounded-3xl p-5 mb-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Moon className={`w-12 h-12 ${theme.id === "zen" ? "text-stone-800" : "text-indigo-300"}`} />
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-13 h-13 rounded-full flex items-center justify-center font-black text-lg ${theme.id === "zen" ? "bg-stone-200 text-stone-900 border border-stone-300" : "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white border border-indigo-400/20"}`}>
            D
          </div>
          <div>
            <h3 className="text-sm font-black">Dream Mirror 멤버</h3>
          </div>
        </div>

        {/* Stats card */}
        <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${theme.borderBase}`}>
          <div className={`text-center p-3 rounded-2xl border ${theme.id === "zen" ? "bg-[#FAF7F0] border-stone-200" : "bg-[#090C1C]/40 border-indigo-950/60"}`}>
            <span className={`text-[10px] font-bold block mb-0.5 ${theme.accentText}`}>총 꿈 기록</span>
            <span className={`text-base font-black font-mono ${theme.textPrimary}`}>{totalDreams}개</span>
          </div>
          <div className={`text-center p-3 rounded-2xl border ${theme.id === "zen" ? "bg-[#FAF7F0] border-stone-200" : "bg-[#090C1C]/40 border-indigo-950/60"}`}>
            <span className={`text-[10px] font-bold block mb-0.5 ${theme.accentText}`}>정기 분석 해제</span>
            <span className="text-xs font-black text-emerald-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {unlocked ? "정밀분석 활성" : "체험 사용 중"}
            </span>
          </div>
        </div>
      </div>

      {/* Feature: Theme Selection Card */}
      <div className={`rounded-3xl p-5 mb-6 border ${theme.id === "zen" ? "bg-[#FAF7F0] border-stone-200" : "bg-gradient-to-b from-[#131135] to-[#0A0C22] border-indigo-500/25"} shadow-xl`}>
        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 font-mono mb-4.5 ${theme.accentText}`}>
          <Sparkles className="w-3.5 h-3.5" />
          디자인 테마
        </h3>

        <div className="space-y-3">
          {Object.values(THEME_STYLES).map((t) => {
            const isSelected = appTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setAppTheme(t.id);
                  localStorage.setItem("dream_mirror_app_theme", t.id);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all relative flex items-center space-x-3.5 cursor-pointer ${
                  isSelected
                    ? theme.id === "zen"
                      ? "bg-stone-200/50 border-stone-400 ring-1 ring-stone-400"
                      : "bg-[#251E3E]/60 border-indigo-500 shadow-lg ring-1 ring-indigo-500/30"
                    : theme.id === "zen"
                      ? "bg-white border-stone-150 hover:bg-stone-50"
                      : "bg-[#090B1C]/60 border-indigo-950/80 hover:border-indigo-900/60"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isSelected
                    ? "bg-indigo-500/15 border border-indigo-500/20"
                    : "bg-black/10 border border-transparent"
                }`}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[13px] font-black ${theme.textPrimary}`}>{t.name}</span>
                    {isSelected && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                        적용 중
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] leading-relaxed truncate mt-1 ${theme.textSecondary}`}>{t.desc}</p>
                </div>
                {/* Circle preview color dots */}
                <div className="flex space-x-0.5 shrink-0 pl-1">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature: Custom API key / model setting */}
      <div className={`rounded-3xl p-5 mb-6 border ${theme.id === "zen" ? "bg-[#FAF7F0] border-stone-200" : "bg-gradient-to-b from-[#131135] to-[#0A0C22] border-indigo-500/25"} shadow-xl`}>
        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 font-mono mb-4 ${theme.accentText}`}>
          <Key className="w-3.5 h-3.5" />
          사용자 지정 Google AI Studio 설정
        </h3>

        <div className="space-y-4">
          {/* API Key input */}
          <div className="space-y-1.5">
            <label className={`text-[10px] font-bold block uppercase tracking-wider font-mono ${theme.textSecondary}`}>
              Google AI Studio API Key (개인 발급용)
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AI Studio API 키 입력 (100% 무료)"
                className={`w-full text-xs rounded-xl pl-3.5 pr-10 py-3.5 border outline-none font-mono ${
                  theme.id === "zen"
                    ? "bg-white text-stone-900 border-stone-300 focus:border-stone-600"
                    : "bg-[#080B1C] text-indigo-100 border-indigo-900 focus:border-indigo-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3 transition-colors cursor-pointer ${theme.id === "zen" ? "text-stone-400 hover:text-stone-600" : "text-indigo-400/60 hover:text-indigo-200"}`}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className={`text-[10px] leading-relaxed font-sans ${theme.textSecondary}`}>
              입력 시 서버 공용 키 대신 기재하신 사용자 본인의 API 키로 전송이 이루어집니다. 비워두면 공용 키로 처리됩니다.
            </p>
          </div>

          {/* Collapsible API Key Issuance Guide manual */}
          <div className={`border rounded-2xl p-4.5 transition-all ${theme.id === "zen" ? "bg-white border-stone-250" : "bg-[#090B1C]/80 border-indigo-900/60"}`}>
            <button
              type="button"
              onClick={() => setShowApiGuide(!showApiGuide)}
              className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg border ${theme.id === "zen" ? "bg-stone-100 border-stone-200 text-stone-700" : "bg-indigo-500/10 border-indigo-500/20 text-[#A594F9]"}`}>
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-extrabold flex items-center gap-1 font-sans ${theme.textPrimary}`}>
                    Google AI Studio API 키 발급 가이드
                  </h4>
                  <p className={`text-[9px] font-sans ${theme.textSecondary}`}>100% 무료 개인 API 키 발급 방법 (1분 소요)</p>
                </div>
              </div>
              <div className={theme.id === "zen" ? "text-stone-500" : "text-indigo-400"}>
                {showApiGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showApiGuide && (
              <div className={`mt-3.5 pt-3.5 border-t space-y-3.5 ${theme.id === "zen" ? "border-stone-150" : "border-indigo-900/40"}`}>
                <div className="space-y-4">
                  <div className="flex gap-2.5 items-start">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border shrink-0 mt-0.5 font-mono ${theme.id === "zen" ? "bg-stone-100 text-stone-700 border-stone-250" : "bg-indigo-600/25 text-indigo-300 border-indigo-500/20"}`}>
                      1
                    </span>
                    <div className="space-y-1">
                      <p className={`text-xs font-black flex items-center gap-1.5 leading-tight ${theme.textPrimary}`}>
                        <span>AI Studio 웹사이트 방문</span>
                        <a
                          href="https://aistudio.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-indigo-500 dark:text-[#A594F9] hover:underline font-extrabold text-[11px]"
                        >
                          바로가기
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </p>
                      <p className={`text-[10px] leading-relaxed font-sans ${theme.textSecondary}`}>
                        Google 계정으로 로그인한 후 이용 약관 동의 절차를 진행해 주세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border shrink-0 mt-0.5 font-mono ${theme.id === "zen" ? "bg-stone-100 text-stone-700 border-stone-250" : "bg-indigo-600/25 text-indigo-300 border-indigo-500/20"}`}>
                      2
                    </span>
                    <div className="space-y-1">
                      <p className={`text-xs font-black leading-tight ${theme.textPrimary}`}>
                        "Get API key" 버튼 실행하기
                      </p>
                      <p className={`text-[10px] leading-relaxed font-sans ${theme.textSecondary}`}>
                        좌측 사이드바 또는 메인 대시보드 화면에 바로 보이는 <strong className={theme.id === "zen" ? "text-stone-850" : "text-indigo-300"}>"Get API key"</strong> 메뉴 버튼을 클릭해 이동합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border shrink-0 mt-0.5 font-mono ${theme.id === "zen" ? "bg-stone-100 text-stone-700 border-stone-250" : "bg-indigo-600/25 text-indigo-300 border-indigo-500/20"}`}>
                      3
                    </span>
                    <div className="space-y-1">
                      <p className={`text-xs font-black leading-tight ${theme.textPrimary}`}>
                        "Create API key" 발급 진행
                      </p>
                      <p className={`text-[10px] leading-relaxed font-sans ${theme.textSecondary}`}>
                        <strong className={theme.id === "zen" ? "text-stone-850" : "text-indigo-300"}>"Create API key"</strong>을 누르고 <strong className="text-indigo-500 dark:text-indigo-200">"Create API key in new project"</strong>를 클릭하여 개인 전용 API 키를 신규 발급받습니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border shrink-0 mt-0.5 font-mono ${theme.id === "zen" ? "bg-stone-100 text-stone-700 border-stone-250" : "bg-indigo-600/25 text-indigo-300 border-indigo-500/20"}`}>
                      4
                    </span>
                    <div className="space-y-1">
                      <p className={`text-xs font-black leading-tight ${theme.textPrimary}`}>
                        여기에 입력하고 최종 저장하기
                      </p>
                      <p className={`text-[10px] leading-relaxed font-sans ${theme.textSecondary}`}>
                        발급된 영어와 특수문자 조합 키(<strong className="text-indigo-500 dark:text-indigo-200">AIzaSy...</strong>로 시작)를 복사해 위 입력 칸에 붙여넣고 아래 저장 버튼을 꼭 클릭하세요!
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border text-[10px] space-y-1 ${theme.id === "zen" ? "bg-stone-50 border-stone-200" : "bg-[#05060f]/60 border-indigo-950"}`}>
                  <p className={`font-black flex items-center gap-1.5 text-[10.5px] ${theme.id === "zen" ? "text-stone-800" : "text-indigo-200"}`}>
                    <BookOpen className="w-3 h-3 text-[#A594F9]" />
                    무료 할당량(Free Tier) 지원 안내
                  </p>
                  <p className={`leading-relaxed ${theme.id === "zen" ? "text-stone-600" : "text-indigo-300/60"}`}>
                    구글 API Studio 무료 플랜(Free Plan)은 신용카드 또는 별도의 결제 조건 연결 없이도 개인 정밀 분석 성능을 넉넉하게 무제한으로 사용 가능한 장점이 있습니다. 발급된 키는 전적으로 사용자 브라우저 로컬 저장소(<code className="font-mono text-[9px]">localStorage</code>)에만 암호화 및 보존되며 유출 없이 안전하게 작동합니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <label className={`text-[10px] font-bold block uppercase tracking-wider font-mono flex items-center gap-1 ${theme.textSecondary}`}>
              <Cpu className="w-3 h-3 text-pink-400" />
              gemini 500회 호출, gemma 1500회 호출 (Preferred Model)
            </label>

            <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${theme.id === "zen" ? "bg-white border-stone-250" : "bg-[#080B1C] border-indigo-950"}`}>
              <button
                type="button"
                onClick={() => setPreferredModel("gemini-3.1-flash-lite")}
                className={`py-2 px-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer text-center ${
                  preferredModel === "gemini-3.1-flash-lite"
                    ? "bg-indigo-600 text-white shadow font-sans"
                    : theme.id === "zen"
                      ? "text-stone-500 hover:text-stone-900 font-sans"
                      : "text-indigo-400/70 hover:text-indigo-200 font-sans"
                }`}
              >
                gemini-3.1-flash-lite
              </button>
              <button
                type="button"
                onClick={() => setPreferredModel("gemma-4-31b-it")}
                className={`py-2 px-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer text-center ${
                  preferredModel === "gemma-4-31b-it"
                    ? "bg-indigo-600 text-white shadow font-sans"
                    : theme.id === "zen"
                      ? "text-stone-500 hover:text-stone-900 font-sans"
                      : "text-indigo-400/70 hover:text-indigo-200 font-sans"
                }`}
              >
                gemma-4-31b-it
              </button>
            </div>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveSettings}
            className={`w-full py-4 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              saveSuccess
                ? "bg-emerald-600 text-white border border-emerald-500"
                : theme.id === "zen"
                  ? "bg-stone-900 hover:bg-stone-800 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>저장 완료! (무의식에 반영됨)</span>
              </>
            ) : (
              <span>💾 맞춤 AI 설정 로컬저장 및 변경</span>
            )}
          </button>
        </div>
      </div>

      {/* Settings / Reset option */}
      <div className={`border-t pt-6 ${theme.borderBase}`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${theme.textSecondary}`}>
          <Database className="w-3.5 h-3.5" />
          데이터 관리 및 관리자 도구
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className={`w-full py-3.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              theme.id === "zen"
                ? "bg-orange-50 border-orange-200 hover:bg-orange-100/50 text-orange-850"
                : "bg-orange-950/10 border-orange-900/40 hover:bg-orange-950/25 text-orange-400"
            }`}
          >
            <span>초기화 설정 (기본 데모꿈 4개 복구)</span>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onBackToOnboarding}
            className={`w-full py-3.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              theme.id === "zen"
                ? "bg-stone-100 border-stone-250 hover:bg-stone-200 text-stone-800"
                : "bg-indigo-950/40 border-indigo-900/40 hover:bg-indigo-900/20 text-indigo-300"
            }`}
          >
            <span>온보딩 가이드 다시 확인하기</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            onClick={() => setShowResetConfirm(false)}
          />
          
          {/* Modal Container */}
          <div className={`relative w-full max-w-sm rounded-[24px] border p-6 shadow-2xl overflow-hidden transition-all duration-300 ${
            theme.id === "zen"
              ? "bg-[#FAF7F0] border-stone-250 text-stone-900"
              : "bg-[#0A0D22] border-indigo-500/20 text-white"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${
                theme.id === "zen" ? "bg-orange-100 text-orange-755" : "bg-orange-950/40 text-orange-400"
              }`}>
                <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h4 className="text-sm font-black tracking-tight">수면 꿈 데이터 초기화</h4>
            </div>
            
            <p className={`text-xs leading-relaxed mb-6 ${
              theme.id === "zen" ? "text-stone-600" : "text-indigo-200"
            }`}>
              정말 꿈 데이터를 모두 초기화하시겠습니까?<br />
              현재 새로 추가한 꿈 일지들과 리포팅 상태가 모두 지워지며, 최초인 기본 데모꿈 4개 데이터 세트로 안전하게 복구됩니다.
            </p>
            
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme.id === "zen"
                    ? "bg-stone-200 hover:bg-stone-300/80 text-stone-700"
                    : "bg-indigo-950/50 hover:bg-indigo-900/30 text-indigo-300"
                }`}
              >
                취소
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetMocks();
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  theme.id === "zen"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10"
                }`}
              >
                초기화 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
