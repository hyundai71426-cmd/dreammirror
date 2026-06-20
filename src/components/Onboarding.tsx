import { useState } from "react";
import { Sparkles, Moon, Mic, ShieldAlert, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: (
        <div className="relative">
          <Moon className="w-24 h-24 text-indigo-400 animate-pulse" />
          <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
        </div>
      ),
      title: "DreamMirror",
      tagline: "당신의 꿈은 생각보다\n많은 이야기를 하고 있습니다.",
      description: "매일 아침 눈부신 무의식의 거울 속을 비춰보며 진정한 자아와 숨은 정서적 패턴을 직면해 보세요.",
    },
    {
      icon: (
        <div className="p-8 rounded-full bg-indigo-950/50 border border-indigo-700/50 animate-pulse">
          <Mic className="w-16 h-16 text-indigo-400" />
        </div>
      ),
      title: "꿈은 몇 분 만에 사라집니다",
      tagline: "기억나는 즉시\n빠르게 녹음하거나 기록하세요.",
      description: "침대 맡에서 생생한 기억이 휘발되기 전에 간편한 음성 녹음과 텍스트 기록으로 온전하게 수집하세요.",
    },
    {
      icon: (
        <div className="p-8 rounded-full bg-slate-900 border border-indigo-500/30">
          <Sparkles className="w-16 h-16 text-indigo-300" />
        </div>
      ),
      title: "AI가 꿈의 패턴을 분석합니다",
      tagline: "반복적인 인물, 감정,\n악몽 빈도를 정밀하게 추적합니다.",
      description: "누적된 꿈 데이터를 통해 상징적 단서와 관계성, 정서 주기 보고서를 한눈에 구조화하여 파악하세요.",
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div 
      id="onboarding-container" 
      className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-[#0B0D1B] via-[#0E122E] to-[#070914] text-white p-6 select-none"
    >
      {/* Top skip button */}
      <div className="flex justify-end pt-4">
        <button 
          id="btn-skip-onboarding"
          onClick={onComplete}
          className="text-sm font-medium text-indigo-300/60 hover:text-indigo-300 transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* Main Swipe Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Step Icon */}
            <div className="mb-10 flex items-center justify-center min-h-[140px]">
              {steps[currentStep].icon}
            </div>

            {/* Title & Tagline */}
            <h1 className="text-xl font-bold tracking-tight text-indigo-200 mb-4 font-sans">
              {steps[currentStep].title}
            </h1>
            
            <p className="text-2xl font-semibold tracking-normal text-white whitespace-pre-line leading-relaxed mb-6">
              {steps[currentStep].tagline}
            </p>

            {/* Detailed description */}
            <p className="text-sm text-indigo-200/70 leading-relaxed font-sans max-w-sm">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Nav Controls */}
      <div className="pb-10 max-w-md w-full mx-auto flex flex-col items-center">
        {/* Step dots */}
        <div className="flex space-x-2.5 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentStep === index ? "w-8 bg-indigo-500" : "w-2.5 bg-indigo-950 border border-indigo-800"
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          id="btn-onboarding-next"
          onClick={handleNext}
          className="w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-950/50 flex items-center justify-center space-x-2"
        >
          <span>{currentStep === steps.length - 1 ? "시작하기" : "다음"}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Disclaimer Warning label */}
        <div className="mt-4 flex items-center space-x-1.5 opacity-50">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="text-[10px]">자가이해를 돕는 도구로 의료 연구용이 아닙니다.</span>
        </div>
      </div>
    </div>
  );
}
