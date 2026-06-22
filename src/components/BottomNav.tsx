import { Home, Calendar, ClipboardList, BarChart3, User } from "lucide-react";
import { ThemeStyle } from "../theme";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  analysisUnlocked: boolean;
  theme?: ThemeStyle;
}

export default function BottomNav({ activeTab, setActiveTab, analysisUnlocked, theme }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "홈", icon: Home },
    { id: "logs", label: "기록", icon: ClipboardList },
    { id: "analysis", label: "분석", icon: BarChart3, isLockAware: true },
    { id: "calendar", label: "캘린더", icon: Calendar },
    { id: "profile", label: "마이", icon: User },
  ];

  const hasTheme = !!theme;
  const navBg = hasTheme ? theme.headerBg : "bg-[#0E112A]";
  const navBorder = hasTheme ? theme.borderBase : "border-indigo-950/80";

  return (
    <div 
      id="bottom-nav-container"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t px-4 pb-safe-bottom transition-colors duration-500 ${navBg} ${navBorder}`}
    >
      <div className="max-w-md mx-auto flex justify-between items-center py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          let activeIconColor = "text-indigo-400 scale-110";
          let inactiveIconColor = "text-indigo-200/50 group-hover:text-indigo-200/80";
          let activeLabelColor = "text-indigo-300 scale-105";
          let inactiveLabelColor = "text-indigo-200/40";
          let bottomPillColor = "bg-indigo-400";

          if (hasTheme) {
            if (theme.id === "zen") {
              activeIconColor = "text-stone-900 scale-110";
              inactiveIconColor = "text-stone-400 group-hover:text-stone-600";
              activeLabelColor = "text-stone-850 font-bold scale-105";
              inactiveLabelColor = "text-stone-400/60";
              bottomPillColor = "bg-stone-800";
            } else if (theme.id === "neo-aura") {
              activeIconColor = "text-[#f43f5e] scale-110";
              inactiveIconColor = "text-slate-500 group-hover:text-slate-300";
              activeLabelColor = "text-[#f43f5e] font-bold scale-105";
              inactiveLabelColor = "text-slate-500/60";
              bottomPillColor = "bg-[#f43f5e]";
            }
          }
          
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-center group cursor-pointer"
            >
              <div 
                className={`p-1 rounded-xl transition-all duration-200 ${
                  isActive ? activeIconColor : inactiveIconColor
                }`}
              >
                <Icon className="w-5.2 h-5.2" />
                
                {tab.isLockAware && !analysisUnlocked && (
                  <span className={`absolute top-1 right-5.5 w-2 h-2 rounded-full border ${
                    hasTheme && theme.id === "zen" 
                      ? "bg-amber-600 border-white" 
                      : "bg-amber-500 border-[#0E112A]"
                  }`} />
                )}
              </div>
              
              <span 
                className={`text-[10px] font-medium transition-all ${
                  isActive ? activeLabelColor : inactiveLabelColor
                }`}
              >
                {tab.label}
              </span>
              
              {isActive && (
                <span className={`absolute bottom-0 w-6 h-0.5 rounded-full ${bottomPillColor}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
