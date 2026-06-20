import { useState, useEffect } from "react";
import { Users, Send, Sparkles, Heart, MessageSquare, ThumbsUp, HelpCircle } from "lucide-react";
import { Dream } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SharedPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  emotions: string[];
  vividness: number;
  reactions: {
    like: number;
    wonder: number;
    support: number;
  };
}

const INITIAL_SHARED_POSTS: SharedPost[] = [
  {
    id: "share-1",
    title: "구름을 이불 삼아 누워있는 꿈 ☁️",
    content: "온 세상이 새하얗고 몽글몽글한 구름으로 뒤덮여 있었다. 가만히 누웠는데 매트리스보다 수백 배 포근했고 가슴 깊은 곳이 말랑해지며 아무런 스트레스도 생각나지 않는 극상의 평온함을 느꼈다.",
    createdAt: "방금 전",
    emotions: ["행복", "안도"],
    vividness: 4,
    reactions: { like: 12, wonder: 3, support: 15 }
  },
  {
    id: "share-2",
    title: "나와 똑같은 사람이 쫓아오는 꿈 👥",
    content: "골목길을 미치듯이 도망치는데, 날 뒤쫓는 정체불명의 추격자의 얼굴을 보니까 놀랍게도 나 자신이었다. 옷차림만 슬프고 무섭게 정장 차림을 한 또 다른 나의 눈망울이 나를 노려봤다. 너무 놀라 소리 지르며 깼다.",
    createdAt: "2시간 전",
    emotions: ["공포", "불안", "혼란"],
    vividness: 5,
    reactions: { like: 4, wonder: 28, support: 9 }
  },
  {
    id: "share-3",
    title: "물속에 잠긴 거대 피아노 🎹",
    content: "바닷속 온화한 푸른 조류 안에서 집채만 한 거대 검은 건반의 피아노가 오케스트라 사운드를 내며 스스로 연주되고 있었다. 깊지만 전혀 숨이 차거나 답답하지 않고 몸이 신비롭게 위아래로 서서히 노닐었다.",
    createdAt: "5시간 전",
    emotions: ["설렘", "혼란"],
    vividness: 3,
    reactions: { like: 18, wonder: 24, support: 7 }
  }
];

interface DreamPlazaProps {
  userDreams: Dream[];
}

export default function DreamPlaza({ userDreams }: DreamPlazaProps) {
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [selectedUserDreamId, setSelectedUserDreamId] = useState("");
  const [isSuccessShare, setIsSuccessShare] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dream_mirror_plaza_v1");
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch {
        setPosts(INITIAL_SHARED_POSTS);
      }
    } else {
      setPosts(INITIAL_SHARED_POSTS);
      localStorage.setItem("dream_mirror_plaza_v1", JSON.stringify(INITIAL_SHARED_POSTS));
    }
  }, []);

  const savePostsToLocal = (updated: SharedPost[]) => {
    setPosts(updated);
    localStorage.setItem("dream_mirror_plaza_v1", JSON.stringify(updated));
  };

  const handleShareOnPlaza = () => {
    if (!selectedUserDreamId) return;

    const targetDream = userDreams.find(d => d.id === selectedUserDreamId);
    if (!targetDream) return;

    // Check duplicate share
    const alreadyShared = posts.some(p => p.title === targetDream.title && p.content === targetDream.content);
    if (alreadyShared) {
      alert("이미 광장에 공유된 꿈 기록입니다.");
      return;
    }

    const newShare: SharedPost = {
      id: `share-user-${Date.now()}`,
      title: `${targetDream.title} 🔮`,
      content: targetDream.content,
      createdAt: "방금 전",
      emotions: targetDream.emotions,
      vividness: targetDream.vividness,
      reactions: { like: 0, wonder: 1, support: 0 }
    };

    const updated = [newShare, ...posts];
    savePostsToLocal(updated);
    setIsSuccessShare(true);
    setSelectedUserDreamId("");

    setTimeout(() => {
      setIsSuccessShare(false);
    }, 3000);
  };

  const handleInteract = (postId: string, type: "like" | "wonder" | "support") => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [type]: p.reactions[type] + 1
          }
        };
      }
      return p;
    });
    savePostsToLocal(updated);
  };

  return (
    <div id="dream-plaza-root" className="bg-[#12142B]/40 border border-indigo-500/10 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
      <div className="flex items-center space-x-1.5 mb-4">
        <Users className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest font-mono">
          익명 무의식 공유 광장 (Dream Plaza)
        </h3>
      </div>

      <p className="text-[11px] text-indigo-200/50 leading-relaxed font-sans mb-5">
        이름을 감춘 채 다른 수면자들이 지나간 기나긴 밤의 심연들을 들여다봅니다. 따뜻한 공감과 지지의 파장을 나눠보세요.
      </p>

      {/* Share My Dream Interface Component */}
      {userDreams.length > 0 ? (
        <div className="bg-[#0B0D1B]/80 border border-indigo-950 p-4 rounded-2xl mb-6">
          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block mb-2">
            나의 어젯밤 꿈 광장에 익명 기부하기
          </span>

          <div className="flex gap-2">
            <select
              value={selectedUserDreamId}
              onChange={(e) => setSelectedUserDreamId(e.target.value)}
              className="flex-1 bg-[#080B1B] text-xs text-indigo-100 rounded-xl px-3 py-2 border border-indigo-900/50 outline-none focus:border-indigo-500"
            >
              <option value="">꿈 기록 선택...</option>
              {userDreams.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.createdAt})
                </option>
              ))}
            </select>

            <button
              onClick={handleShareOnPlaza}
              disabled={!selectedUserDreamId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-xs font-black text-white shrink-0 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              공유
            </button>
          </div>

          <AnimatePresence>
            {isSuccessShare && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-emerald-400 text-[10px] text-center font-bold"
              >
                🎉 내 무의식의 한 조각이 광장에 익명으로 고이 올라갔습니다!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-4 bg-indigo-950/20 border border-indigo-900/20 rounded-2xl text-center mb-6 text-[10px] text-indigo-300/40">
          꿈을 하나 이상 저장해야 익명 기부가 오픈됩니다. 🌙
        </div>
      )}

      {/* Shared Posts List Section */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-2xl bg-[#090B19]/90 border border-indigo-950 hover:border-indigo-900/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold text-indigo-400 font-mono">
                  {post.createdAt} · 익명의 수면자
                </span>
                <span className="text-[8px] bg-indigo-950 border border-indigo-900/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                  선명도 ⭐{post.vividness}
                </span>
              </div>

              <h4 className="text-xs font-bold text-indigo-100 flex items-center gap-1.5 leading-snug">
                {post.title}
              </h4>

              <p className="text-[11px] leading-relaxed text-indigo-200/70 font-sans mt-2 whitespace-pre-line">
                {post.content}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {post.emotions.map(em => (
                  <span
                    key={em}
                    className="text-[9px] font-bold text-indigo-300/60 font-sans bg-indigo-900/10 border border-indigo-900/30 px-2 py-0.5 rounded-lg"
                  >
                    #{em}
                  </span>
                ))}
              </div>
            </div>

            {/* Reactions control block */}
            <div className="mt-3.5 pt-3 border-t border-indigo-950/50 flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#5c608f] text-[9px] font-black uppercase">공감 신호 증폭</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleInteract(post.id, "like")}
                  className="px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/30 hover:border-indigo-500/50 text-[#858CE0] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🫂</span>
                  <span>{post.reactions.like}</span>
                </button>

                <button
                  onClick={() => handleInteract(post.id, "wonder")}
                  className="px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/30 hover:border-indigo-500/50 text-[#C19CF0] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🔮</span>
                  <span>{post.reactions.wonder}</span>
                </button>

                <button
                  onClick={() => handleInteract(post.id, "support")}
                  className="px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/30 hover:border-indigo-500/50 text-[#F5B5B5] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🧸</span>
                  <span>{post.reactions.support}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
