import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK lazily if key is available
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    return new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return null;
}

// Resilient helper to handle model availability or transient API errors (e.g. 503 / 429) gracefully
async function generateContentWithFallback(
  gemini: GoogleGenAI,
  params: {
    contents: string;
    config: any;
    preferredModel?: string;
  }
) {
  const models = [];
  if (params.preferredModel) {
    models.push(params.preferredModel);
  }
  models.push("gemma-4-31b-it", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash");
  
  let lastError: any = null;
  const uniqueModels = Array.from(new Set(models));

  for (const model of uniqueModels) {
    // Retry up to 2 times for each model in case of transient errors (like 503 or 429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMessage = typeof err === "object" && err !== null ? (err.message || JSON.stringify(err)) : String(err);
        const isTransient = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("429") || errorMessage.includes("demand");
        
        if (isTransient && attempt < 2) {
          console.warn(`Model ${model} experienced temporary error (attempt ${attempt}/2). Retrying in 300ms...`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
        
        console.warn(`Model ${model} call failed on final attempt. Trying next fallback model if available.`);
        break; // proceed to next model
      }
    }
  }
  throw lastError || new Error("All generative attempts failed");
}

// Fallback logic for local extraction when Gemini is not configured
function performLocalExtraction(content: string, emotions: string[]) {
  const peopleSet = new Set<string>();
  const locationSet = new Set<string>();
  const themeSet = new Set<string>();

  // Extract people keys
  if (/엄마|어머니/i.test(content)) peopleSet.add("엄마");
  if (/아빠|아버지/i.test(content)) peopleSet.add("아빠");
  if (/선생님|교사/i.test(content)) peopleSet.add("선생님");
  if (/친구|동창/i.test(content)) peopleSet.add("친구");
  if (/상사|팀장|사장/i.test(content)) peopleSet.add("상사");
  if (/동료|회사 동료/i.test(content)) peopleSet.add("회사 동료");
  if (/전 애인|남자친구|여자친구/i.test(content)) peopleSet.add("전 애인");
  if (/괴한|범인|정체불명/i.test(content)) peopleSet.add("정체불명의 괴한");
  if (peopleSet.size === 0) peopleSet.add("나");

  // Extract location keys
  if (/학교|교실/i.test(content)) locationSet.add("학교");
  if (/회사|사무실|대강당/i.test(content)) locationSet.add("회사");
  if (/집|안방|거실/i.test(content)) locationSet.add("집");
  if (/바다|해변/i.test(content)) locationSet.add("바다");
  if (/산|계곡/i.test(content)) locationSet.add("산");
  if (/길|골목길|도로/i.test(content)) locationSet.add("골목길");
  if (/우주|하늘/i.test(content)) locationSet.add("하늘");
  if (locationSet.size === 0) locationSet.add("알 수 없음");

  // Extract theme keys
  if (/시험|성적|문제/i.test(content)) themeSet.add("평가와 대처");
  if (/쫓|도망|추격/i.test(content)) themeSet.add("탈출/현실 도피");
  if (/발표|실패|고장/i.test(content)) themeSet.add("실수와 사회적 시선");
  if (/날|비행|하늘/i.test(content)) themeSet.add("자유와 상쾌함");
  if (themeSet.size === 0) themeSet.add("일상적 심리적 잔상");

  // Title generation
  let title = "오늘의 꿈 기록";
  if (/시험|성적/i.test(content)) title = "준비되지 않은 시험";
  else if (/쫓|도망/i.test(content)) title = "누군가에게 쫓김";
  else if (/발표|프레젠테이션/i.test(content)) title = "망가진 발표 계획";
  else if (/날|비행/i.test(content)) title = "하늘을 자유롭게 나는 꿈";
  else {
    const spaceIndex = content.slice(0, 15).lastIndexOf(" ");
    title = content.slice(0, spaceIndex > 0 ? spaceIndex : 12) + "...";
  }

  // Summary generation
  const peopleStr = Array.from(peopleSet).join(", ");
  const locStr = Array.from(locationSet).join(", ");
  const themeStr = Array.from(themeSet).join(", ");
  const summary = `꿈에서 [${locStr}]을(를) 배경으로 [${peopleStr}]이(가) 나타났습니다. 주로 [${themeStr}] 주제와 연관된 상황이 전개되었습니다. 최근 수면 상태와 일상의 스트레스를 반영하는 것일 수 있으니 마음을 편안히 가다듬는 것을 추천합니다.`;

  return {
    title,
    analysis: {
      people: Array.from(peopleSet),
      location: Array.from(locationSet),
      theme: Array.from(themeSet),
      emotion: emotions || ["불안"],
      summary: summary
    }
  };
}

// 1. Dream Analysis API (Uses Gemini or local extraction)
app.post("/api/analyze-dream", async (req, res) => {
  try {
    const { content, emotions } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      // Local heuristic processing as a robust fallback
      const localResult = performLocalExtraction(content, emotions);
      return res.json(localResult);
    }

    const systemInstruction = `
      당신은 사용자의 꿈 기록을 심리학적으로 분석하여 무의식과 감정 패턴을 구조화하는 전문 AI 꿈 분석가입니다.
      반드시 의료적 진단을 삼가세요.
      우울증, ADHD, PTSD 등 정신의학적 병명을 절대 진단하거나 단정하지 마십시오.
      대신 다음 지침을 지키십시오.
      - "반복되는 패턴이 관찰됩니다."
      - "최근 꿈에서는 [감정]과 관련된 표현이 증가했습니다."
      - "이 분석은 의료 진단이 아니며, 참고용 정보입니다."
      
      반드시 다음 JSON 스키마를 준수하여 JSON 결과만 한글로 리턴하세요:
      {
        "title": "꿈 내용을 요약한 한글 제목 (최대 12자)",
        "analysis": {
          "people": ["등장인물 배열, 예: 엄마, 친구, 상사, 선생님, 나 등"],
          "location": ["상징적인 장소 배열, 예: 학교, 해변, 회사, 집 등"],
          "theme": ["추상적인 핵심 주제 배열, 예: 평가, 속박, 자유, 거절 등"],
          "emotion": ["선택된 감정을 묘사하는 감정 키워드 배열"],
          "summary": "안내에 따라 정서를 지지하고 무의식적인 단서를 차분하게 요약해 주는 2-3줄의 따뜻한 통찰력 있는 문구 (이 분석은 의료 진단이 아닙니다를 강조해야 함)"
        }
      }
    `;

    const prompt = `
      사용자의 꿈 기록:
      "${content}"
      
      사용자가 직접 지정한 감정들:
      ${JSON.stringify(emotions)}
    `;

    const response = await generateContentWithFallback(gemini, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
      preferredModel: customModel
    });

    const responseText = response.text || "";
    const parsed = JSON.parse(responseText.trim());
    return res.json(parsed);

  } catch (error: any) {
    console.error("Gemini analysis error, falling back to local extraction:", error);
    // Graceful fallback to guarantee smooth execution
    const localResult = performLocalExtraction(req.body.content || "", req.body.emotions || []);
    return res.json(localResult);
  }
});

// 1.5. Audio Transcription API (Uses Gemini server-side to transcribe recorded voice)
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "audio (base64 string) is required" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      return res.status(400).json({ error: "Gemini API key is not configured in the workspace settings." });
    }

    // gemini-2.5-flash is our default model as recommended in guidelines - fast, inexpensive, supports multimodal audio
    const modelToUse = customModel || "gemini-2.5-flash";

    console.log(`Transcribing audio of mimetype: ${mimeType || "audio/webm"} using ${modelToUse}...`);

    const response = await gemini.models.generateContent({
      model: modelToUse,
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audio
          }
        },
        "Please transcribe this recorded audio into clean, high-quality Korean text. The user is recording their voice describing a dream they had. Return ONLY the direct transcription text. Do NOT add any surrounding quotes, introductory remarks (like 'Here is the transcript:'), explanations, bullet points, or polite endings. Only output the Korean text representing exactly what is said. If the audio has only noise, hum, or silence with absolutely no words, return an empty string."
      ]
    });

    const transcription = response.text?.trim() || "";
    console.log("Transcription result:", transcription);
    return res.json({ text: transcription });

  } catch (error: any) {
    console.error("Gemini audio transcription error:", error);
    return res.status(500).json({ error: error.message || "Failed to transcribe audio using Gemini API" });
  }
});

// 2. Aggregate Report Generation (Unlocks patterns for 5+ dreams)
app.post("/api/generate-report", async (req, res) => {
  try {
    const { dreams } = req.body;
    if (!dreams || !Array.isArray(dreams)) {
      return res.status(400).json({ error: "Dreams list is required" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      // Local report heuristic backup
      return res.json({
        aiOverview: "최근 기록된 꿈들을 살펴보았을 때 일상의 긴장감이나 무의식적 바람이 고스란히 묻어납니다. 반복되는 인물과 장소들은 현실 공간의 상호작용 지점들을 대변할 수 있습니다. 마이 페이지나 캘린더에서 본인의 수면 환경을 점검하고, 규칙적인 입면 습관을 이행해보세요. 본 리포트는 참고용 안내서일 뿐, 정신건강의학과 전문의 등의 의료용 진단을 대체할 수 없습니다."
      });
    }

    const systemInstruction = `
      당신은 누적된 꿈 데이터를 종합하여 개인 장기 무의식 보고서를 작성해 주는 동반 상담 AI입니다.
      반드시 의료적 명칭(우울증, PTSD 등)을 진단하는 것은 금지됩니다. 따뜻한 성찰과 공감적 제언을 건네며, "본 분석은 임상의나 전문가의 의료 진단이 아니며, 자가이해를 위한 정보입니다"라는 취지를 녹여주세요.
      답변은 한글로 150자~200자 내외로 정돈되고 다정한 존댓말로 요약해주세요.
    `;

    const prompt = `
      회원의 꿈 기록 데이터셋:
      ${JSON.stringify(dreams.map((d: any) => ({
        title: d.title,
        content: d.content,
        emotions: d.emotions,
        vividness: d.vividness,
        analysis: d.analysis
      }))).slice(0, 4000)}
    `;

    const response = await generateContentWithFallback(gemini, {
      contents: prompt,
      config: {
        systemInstruction,
      },
      preferredModel: customModel
    });

    return res.json({ aiOverview: response.text || "" });

  } catch (error: any) {
    console.error("Gemini report error, fallback overview used:", error);
    return res.json({
      aiOverview: "최근 기록된 꿈들을 살펴보았을 때 일상의 긴장감이나 무의식적 바람이 고스란히 묻어납니다. 반복되는 인물과 장소들은 현실 공간의 상호작용 지점들을 대변할 수 있습니다. 마이 페이지나 캘린더에서 본인의 수면 환경을 점검하고, 규칙적인 입면 습관을 이행해보세요. 본 리포트는 참고용 안내서일 뿐, 정신건강의학과 전문의 등의 의료용 진단을 대체할 수 없습니다."
    });
  }
});

// 3. Perspectives Analysis API (Freud vs Jung)
app.post("/api/analyze-perspectives", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      return res.json({
        freud: "지그문트 프로이트학파적 관점에서 이 꿈의 내러티브는 일상의 검열된 욕망이나 충동의 변칙적 발현으로 해석됩니다. 억제된 상징 속 감정을 직시해 보십시오.",
        jung: "칼 융학파적 관점에서 이 꿈은 숨은 심리적 그늘(shadow)을 받아들이고 자아의 균형을 맞추기 위한 수면 내부의 보상 조율 작용입니다."
      });
    }

    const systemInstruction = `
      당신은 사용자의 꿈 요약 제목과 세부 꿈 내용을 프로이트 학파(억압된 무의식적 깊은 욕망, 방어기제)와 융 학파(집단 무의식, 그림자, 보상 작용, 자아 통합)의 다른 관점으로 나누어 따뜻하고 조리 있게 비교 분석해주는 꿈 자문학자입니다.
      반드시 의료적 진단을 내리거나 정신과 진단을 특정하지 마세요.
      반드시 다음 JSON 스키마 형식으로만 응답하세요:
      {
        "freud": "프로이트의 심층 정신분석적 관점 해석 (마치 프로이트가 조언하듯 한글 3-4줄)",
        "jung": "칼 융의 분석심리학적 관점 해석 (마치 융이 조언하듯 한글 3-4줄)"
      }
    `;

    const prompt = `꿈 제목: "${title}"\n꿈 내용: "${content}"`;
    const response = await generateContentWithFallback(gemini, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      },
      preferredModel: customModel
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (error) {
    console.error("Gemini perspective analysis error, fallback triggered:", error);
    return res.json({
      freud: "지그문트 프로이트학파적 관점에서 이 꿈의 내러티브는 일상의 검열된 욕망이나 충동의 변칙적 발현으로 해석됩니다. 억제된 상징 속 감정을 직시해 보십시오.",
      jung: "칼 융학파적 관점에서 이 꿈은 숨은 심리적 그늘(shadow)을 받아들이고 자아의 균형을 맞추기 위한 수면 내부의 보상 조율 작용입니다."
    });
  }
});

// 4. Dream Archetype Symbol Encyclopedia API
app.post("/api/look-up-symbol", async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      // Local symbol index fallback
      const dict: Record<string, any> = {
        "뱀": {
          core: "치유와 탈피, 잠재의식적 성적 에너제틱 자극",
          explanation: "뱀은 허물을 벗고 새로 태어나는 강력한 생명력과 치유의 원형입니다. 또한 현실의 교활한 방해물이나 비합리적 유혹을 뜻하기도 합니다.",
          advice: "오래된 습관이나 미련을 탈피하고, 변환기를 맞이할 마음의 여지를 열어두세요."
        },
        "물": {
          core: "무의식의 광대함과 정서적 깊이",
          explanation: "물은 인류의 시원적 원천이자 표출되지 못한 거대한 잠재된 감정의 흐름을 대변합니다.",
          advice: "최근 감정 기복이 있었다면, 그 잔잔한 근원을 돌아보는 시간을 가지세요."
        }
      };

      const normalized = keyword.trim();
      const findKey = Object.keys(dict).find(k => normalized.includes(k) || k.includes(normalized));
      if (findKey) {
        return res.json(dict[findKey]);
      }

      return res.json({
        core: "심리적 변화의 신호탄",
        explanation: `'${normalized}'(은)는 일상생활의 밀접한 미련이나 당신 자아의 고유한 행동 동기를 감추어 둔 주관적 촉매 상징입니다. 주변과의 감정 흐름을 연결시켜 줍니다.`,
        advice: "이 이면에 숨겨진 당신만의 사소한 상호작용 연결고리를 상상해 보세요."
      });
    }

    const systemInstruction = `
      당신은 사용자가 꿈속에서 겪은 특이한 주제어(예: '뱀', '절벽', '하늘', '이빨' 등) 고유의 전형적 심리 상징적 의미를 해석해주는 꿈 원형 대사전 자문가입니다.
      어떠한 경우에도 의료적인 질환(우울증 완화, 처방전 등)을 언급하지 마십시오. 따뜻한 조언 형식이어야 합니다.
      반드시 다음 JSON 형식만으로 한글 대답을 생성하세요:
      {
        "core": "핵심 상징 요약 (예: 영적인 치유와 변화의 상징)",
        "explanation": "이 주제어가 꿈에 등장했을 때의 전형적인 심리학적 혹은 정신인류학적 의미 (한글 2~3줄)",
        "advice": "이 꿈의 상징을 실생활의 자기계발이나 정서 조율에 적용하는 지혜 어린 제언 (한글 1~2줄)"
      }
    `;

    const prompt = `사용자가 조회하려는 꿈 상징 단어: "${keyword}"`;
    const response = await generateContentWithFallback(gemini, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
      preferredModel: customModel
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (error) {
    console.error("Gemini symbol dict error, using generic response:", error);
    return res.json({
      core: "의식의 표출적 잔상",
      explanation: "인코딩된 꿈 상징은 고유한 자아 주관성에 따라 특유의 적응 형태를 드러내는 성질이 있습니다. 마음 속 깊은 물결에 귀를 기울이세요.",
      advice: "해당 단어에 대해 드는 본인만의 주관적 인상과 감정을 정돈해보는 걸 추천합니다."
    });
  }
});

// 5. Intelligent Character Chatbot API (Subconscious projection dialogue flow)
app.post("/api/chat-character", async (req, res) => {
  try {
    const { character, dreamContent, userInput, chatHistory } = req.body;
    if (!character || !dreamContent || !userInput) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const customModel = req.headers["x-gemini-model"] as string | undefined;

    const gemini = getGeminiClient(customApiKey);
    if (!gemini) {
      // Local fallback dialog
      const fallbacks: Record<string, string[]> = {
        "엄마": [
          "나는 네 꿈속에 나타난 너의 엄마란다. 현실의 엄마일 수도 있고, 네가 의지가 필요한 모성적 원천일 수도 있지. 네 부담감이 꿈에서 표출되었구나. 무엇이 널 그렇게 걱정하게 하니?",
          "괜찮아, 다 잘 될 거야. 꿈속에서의 불화는 오히려 마음의 고비를 극복하는 성장 진통과 같아. 마주보고 얘기해서 고맙구나."
        ],
        "정체불명의 괴한": [
          "내가 무섭지? 사실 나는 네가 외면하고 질질 끌어오던 너의 불안과 '그림자(Shadow)'야. 쫓아온 건 널 해치려 해서가 아니라, 마침내 직시해야 할 일이 있음을 경고한 거란다.",
          "도망치는 걸 멈추고 나를 보렴. 뇌리에 남은 골목길의 속박은 네가 현실에서 마주하지 않는 어떤 진실일까?"
        ],
        "상사": [
          "이봐, 일을 더 꼼꼼히 하라고! 아 참, 꿈에서조차 내가 널 다그쳤다니 너도 참 스트레스가 극에 달했군. 사실 내가 널 억누른다기보단 실패하고 싶지 않은 너 스스로의 기준이 높은 건 아닐까?",
          "지적에 상처받지 마. 너는 충분히 잘하고 있어. 이 무의식 공간에서나마 압박을 내려놓고 마음껏 쉼표를 찍어보라고."
        ]
      };

      const normalizedChar = character.trim();
      const answerPool = fallbacks[normalizedChar] || [
        `안녕? 나는 꿈속에 등장한 '${normalizedChar}'이야. 너의 뇌리에서 탄생한 무의식의 거울 같은 존재지. 우리가 왜 꿈에서 만났는지 궁금해?`,
        "네가 마음 깊은 곳에서 느끼고 힘들어하는 것을 나 역시 함께 겪고 있어. 걱정 말고 너의 수면 습관이나 감정을 다 털어놓아 봐."
      ];

      // Simple pseudo dynamic alternation
      const index = (chatHistory?.length || 0) % answerPool.length;
      return res.json({ response: answerPool[index] });
    }

    const systemInstruction = `
      당신은 사용자의 꿈 내러티브 속에 실존했던 등장인물인 "${character}"의 역할을 수행합니다.
      수행 시 기억해야 할 핵심 규칙:
      1. 당신은 실제 인물이 아닌, 사용자의 '무의식 속 자아 투영체(Projection / Shadow / Archetype)'임을 자각하고 말하세요.
      2. 사용자가 적은 원래의 꿈 스토리를 완벽하게 수렴하여 이에 맞는 대사를 구사하고, 자신을 지칭할 때 캐릭터의 개성(따뜻함, 냉철함, 불안, 조언)을 투사하세요.
      3. 지나친 악의적 묘사는 지지체계 상실을 부를 수 있으니, 무의식이 전하는 따스하고 상징적인 충고와 깨달음을 선물하는 친숙하고 깊이감 있는 톤으로 진행하세요.
      4. 의료적 진단이나 명칭(우울 등의 수치적 진찰)은 일절 차단하세요.
      
      이전 대화 기록(chatHistory)을 적절히 참고하여, 자연스러운 티키타카 한글 대화를 2줄 내로 이끌어가세요.
    `;

    const promptMessage = `
      [꿈 내용]:
      "${dreamContent}"
      
      [이전 대화 기록]:
      ${JSON.stringify(chatHistory || [])}
      
      [사용자 입력 메세지]:
      "${userInput}"
    `;

    const response = await generateContentWithFallback(gemini, {
      contents: promptMessage,
      config: {
        systemInstruction,
      },
      preferredModel: customModel
    });

    return res.json({ response: response.text || "그렇군요... 좀 더 네 깊은 마음에 귀 기울여보자." });

  } catch (error) {
    console.error("Gemini Character dialogue error, triggering local safe answer:", error);
    return res.json({ response: "네 무의식 속 메아리가 울리고 있어. 최근 지쳐 있던 마음을 가만히 두드려 보라구! 🔮" });
  }
});

// Vite Middleware integration for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupVite();
}

export default app;
