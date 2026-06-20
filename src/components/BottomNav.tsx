import { Home, Calendar, ClipboardList, BarChart3, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  analysisUnlocked: boolean;
}

export default function BottomNav({ activeTab, setActiveTab, analysisUnlocked }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "홈", icon: Home },
    { id: "logs", label: "기록", icon: ClipboardList },
    { id: "analysis", label: "분석", icon: BarChart3, isLockAware: true },
    { id: "calendar", label: "캘린더", icon: Calendar },
    { id: "profile", label: "마이", icon: User },
  ];

  return (
    <div 
      id="bottom-nav-container"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E112A] border-t border-indigo-950/80 px-4 pb-safe-bottom"
    >
      <div className="max-w-md mx-auto flex justify-between items-center py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-center group"
            >
              <div 
                className={`p-1 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-indigo-400 scale-110" 
                    : "text-indigo-200/50 group-hover:text-indigo-200/80"
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
                
                {tab.isLockAware && !analysisUnlocked && (
                  <span className="absolute top-1 right-5.5 w-2 h-2 rounded-full bg-amber-500 border border-[#0E112A]" />
                )}
              </div>
              
              <span 
                className={`text-[10px] font-medium transition-all ${
                  isActive 
                    ? "text-indigo-300 scale-105" 
                    : "text-indigo-200/40"
                }`}
              >
                {tab.label}
              </span>
              
              {isActive && (
                <span className="absolute bottom-0 w-5 h-0.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
