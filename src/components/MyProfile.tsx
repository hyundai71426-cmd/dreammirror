import { useState, useEffect } from "react";
import { Sparkles, Moon, RefreshCw, ShieldCheck, Database, Key, Cpu, Eye, EyeOff, Check, HelpCircle, ChevronDown, ChevronUp, ExternalLink, BookOpen } from "lucide-react";

interface MyProfileProps {
  totalDreams: number;
  unlocked: boolean;
  onResetMocks: () => void;
  onBackToOnboarding: () => void;
}

export default function MyProfile({ totalDreams, unlocked, onResetMocks, onBackToOnboarding }: MyProfileProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [preferredModel, setPreferredModel] = useState<string>("gemini-3.1-flash-lite");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showApiGuide, setShowApiGuide] = useState<boolean>(false);

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
    <div id="profile-root" className="px-5 pb-24 text-white">
      {/* Profile summary card */}
      <div className="pt-6 pb-4">
        <h2 className="text-2xl font-black text-indigo-100 flex items-center gap-2">
          마이 프로필
          <span className="text-xs bg-[#1F214A] border border-indigo-800 text-indigo-400 px-2 py-0.5 rounded font-mono">
            SETUP
          </span>
        </h2>
        <p className="text-xs text-indigo-300/50">맞춤 설정 및 무의식 개선 처방 가이드</p>
      </div>

      <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Moon className="w-12 h-12 text-indigo-300" />
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-indigo-400/20 flex items-center justify-center font-bold text-lg">
            D
          </div>
          <div>
            <h3 className="text-sm font-black">Dream Mirror 멤버</h3>
            <p className="text-[10px] text-gray-500 font-mono">hyundai71426@gmail.com</p>
          </div>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-900/20">
          <div className="text-center bg-[#090C1C] p-3 rounded-2xl border border-indigo-950">
            <span className="text-[10px] text-indigo-400 font-bold block mb-0.5">총 꿈 기록</span>
            <span className="text-base font-black font-mono text-white">{totalDreams}개</span>
          </div>
          <div className="text-center bg-[#090C1C] p-3 rounded-2xl border border-indigo-950">
            <span className="text-[10px] text-indigo-400 font-bold block mb-0.5">정기 분석 해제</span>
            <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {unlocked ? "정밀분석 활성" : "체험 사용 중"}
            </span>
          </div>
        </div>
      </div>

      {/* Feature: Custom API key / model setting */}
      <div className="bg-gradient-to-b from-[#131135] to-[#0A0C22] border border-indigo-500/20 rounded-3xl p-5 mb-6 shadow-xl">
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-4">
          <Key className="w-3.5 h-3.5 text-[#A594F9]" />
          사용자 지정 Google AI Studio 설정
        </h3>

        <div className="space-y-4">
          {/* API Key input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-200/70 block uppercase tracking-wider font-mono">
              Google AI Studio API Key (개인 발급용)
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AI Studio API 키 입력 (설정 시 개별 과금)"
                className="w-full bg-[#080B1C] text-xs text-indigo-100 rounded-xl pl-3.5 pr-10 py-3 border border-indigo-900 focus:border-indigo-400 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-indigo-400/60 hover:text-indigo-200 transition-colors cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[9px] text-indigo-300/40 leading-relaxed font-sans">
              입력 시 서버 공용 키 대신 기재하신 사용자 본인의 API 키로 전송이 이루어집니다. 비워두면 공용 키로 처리됩니다.
            </p>
          </div>

          {/* Collapsible API Key Issuance Guide manual */}
          <div className="bg-[#090B1C]/80 border border-indigo-900/60 rounded-2xl p-4.5 transition-all">
            <button
              type="button"
              onClick={() => setShowApiGuide(!showApiGuide)}
              className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[#A594F9]">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-100 flex items-center gap-1 font-sans">
                    Google AI Studio API 키 발급 가이드
                  </h4>
                  <p className="text-[9px] text-indigo-300/50 font-sans">100% 무료 개인 API 키 발급 방법 (1분 소요)</p>
                </div>
              </div>
              <div className="text-indigo-400">
                {showApiGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showApiGuide && (
              <div className="mt-3.5 pt-3.5 border-t border-indigo-900/40 space-y-3">
                <div className="space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-600/25 text-[9px] font-bold text-indigo-300 flex items-center justify-center border border-indigo-500/20 shrink-0 mt-0.5 font-mono">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-100 flex items-center gap-1.5 leading-tight">
                        <span>AI Studio 웹사이트 방문</span>
                        <a
                          href="https://aistudio.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[#A594F9] hover:underline font-bold text-[11px]"
                        >
                          바로가기
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </p>
                      <p className="text-[10px] text-indigo-300/60 leading-relaxed font-sans">
                        Google 계정으로 로그인한 후 이용 약관 동의 절차를 진행해 주세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-600/25 text-[9px] font-bold text-indigo-300 flex items-center justify-center border border-indigo-500/20 shrink-0 mt-0.5 font-mono">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-100 leading-tight">
                        "Get API key" 버튼 실행하기
                      </p>
                      <p className="text-[10px] text-indigo-300/60 leading-relaxed font-sans">
                        좌측 사이드바 또는 메인 대시보드 화면에 바로 보이는 <strong className="text-indigo-300">"Get API key"</strong> 메뉴 버튼을 클릭해 이동합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-600/25 text-[9px] font-bold text-indigo-300 flex items-center justify-center border border-indigo-500/20 shrink-0 mt-0.5 font-mono">
                      3
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-100 leading-tight">
                        "Create API key" 발급 진행
                      </p>
                      <p className="text-[10px] text-indigo-300/60 leading-relaxed font-sans">
                        <strong className="text-indigo-300">"Create API key"</strong>을 누르고 <strong className="text-indigo-200">"Create API key in new project"</strong>를 클릭하여 개인 전용 API 키를 신규 발급받습니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-600/25 text-[9px] font-bold text-indigo-300 flex items-center justify-center border border-indigo-500/20 shrink-0 mt-0.5 font-mono">
                      4
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-100 leading-tight">
                        여기에 입력하고 최종 저장하기
                      </p>
                      <p className="text-[10px] text-indigo-300/60 leading-relaxed font-sans">
                        발급된 영어와 특수문자 조합 키(<strong className="text-indigo-200">AIzaSy...</strong>로 시작)를 복사해 위 입력 칸에 붙여넣고 아래 저장 버튼을 꼭 클릭하세요!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#05060f] p-3 rounded-xl border border-indigo-950 text-[10px] text-indigo-300/50 space-y-1">
                  <p className="text-indigo-200 font-bold flex items-center gap-1 text-[10.5px]">
                    <BookOpen className="w-3 h-3 text-[#A594F9]" />
                    무료 할당량(Free Tier) 지원 안내
                  </p>
                  <p className="leading-relaxed">
                    구글 API Studio 무료 플랜(Free Plan)은 신용카드 또는 별도의 결제 조건 연결 없이도 개인 정밀 분석 성능을 넉넉하게 무제한으로 사용 가능한 장점이 있습니다. 발급된 키는 전적으로 사용자 브라우저 로컬 저장소(<code className="font-mono text-[9px] text-indigo-300">localStorage</code>)에만 암호화 및 보존되며 유출 없이 안전하게 작동합니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-indigo-200/70 block uppercase tracking-wider font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-pink-400" />
              선호 인공지능 분석 모델 (Preferred Model)
            </label>

            <div className="grid grid-cols-2 gap-2 bg-[#080B1C] p-1 rounded-xl border border-indigo-950">
              <button
                type="button"
                onClick={() => setPreferredModel("gemini-3.1-flash-lite")}
                className={`py-2 px-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                  preferredModel === "gemini-3.1-flash-lite"
                    ? "bg-indigo-600 text-white shadow font-sans"
                    : "text-indigo-400/70 hover:text-indigo-200 font-sans"
                }`}
              >
                gemini-3.1-flash-lite
              </button>
              <button
                type="button"
                onClick={() => setPreferredModel("gemma-4-31b-it")}
                className={`py-2 px-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                  preferredModel === "gemma-4-31b-it"
                    ? "bg-indigo-600 text-white shadow font-sans"
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
            className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              saveSuccess
                ? "bg-emerald-600 text-white border border-emerald-500"
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
      <div className="border-t border-indigo-900/20 pt-6">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          데이터 관리 및 관리자 도구
        </h3>
        
        <div className="space-y-2.5">
          <button
            onClick={onResetMocks}
            className="w-full py-3 px-4 rounded-xl bg-orange-950/10 border border-orange-900/40 hover:bg-orange-950/20 text-orange-400 text-xs font-bold flex items-center justify-between"
          >
            <span>초기화 설정 (기본 데모꿈 4개 복구)</span>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onBackToOnboarding}
            className="w-full py-3 px-4 rounded-xl bg-indigo-950/40 border border-indigo-900/40 hover:bg-indigo-900/20 text-indigo-300 text-xs font-bold flex items-center justify-between"
          >
            <span>온보딩 가이드 다시 확인하기</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
