import { Dream } from "./types";

// Helper to clean response strings that might be wrapped in markdown code blocks
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }
  return cleaned;
}

// Client-side Direct REST call to Gemini
async function callGeminiDirectly(
  prompt: string,
  systemInstruction?: string,
  responseMimeType?: string
): Promise<string> {
  const customApiKey = localStorage.getItem("gemini_api_key") || "";
  if (!customApiKey) {
    throw new Error("API Key가 설정되지 않았습니다. [마이 프로필] 메뉴에서 Google AI Studio API Key를 등록해 주세요!");
  }

  const preferredModel = localStorage.getItem("gemini_preferred_model") || "gemini-3.1-flash-lite";
  
  // Normalize model name for HTTP request
  let modelName = preferredModel;
  // Fallback to high compatibility models if custom model string isn't standard in Google's endpoint API
  if (modelName === "gemma-4-31b-it" || modelName.includes("gemma")) {
    modelName = "gemini-3.1-flash-lite"; 
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${customApiKey}`;
  
  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction
        }
      ]
    };
  }

  if (responseMimeType) {
    payload.generationConfig = {
      responseMimeType: responseMimeType
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errorDetail = "API 호출 실패";
    try {
      const parsedErr = JSON.parse(errText);
      if (parsedErr.error?.message) {
        errorDetail = parsedErr.error.message;
      }
    } catch {
      errorDetail = errText;
    }
    throw new Error(`Google Gemini API 오류: ${errorDetail} (API 키 상태 및 네트워크를 확인해 주세요)`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini에서 응답 텍스트를 반환하지 않았습니다. 다시 시도해 주세요.");
  }

  return text;
}

// Core executor that guarantees ONLY real AI responses
async function safeApiRequest(
  directGeminiCall: () => Promise<any>
) {
  const customApiKey = localStorage.getItem("gemini_api_key") || "";
  if (!customApiKey) {
    throw new Error("API 키가 누락되었습니다! 웹앱 우측 상단의 [마이 프로필] 메뉴에서 본인의 'Google AI Studio API Key'를 먼저 발급받아 등록한 뒤 사용해 주세요.");
  }

  try {
    return await directGeminiCall();
  } catch (gemError: any) {
    console.error("[API Error] Direct browser-to-Gemini REST call failed:", gemError);
    // Propagate the real error so user knows exactly what went wrong (e.g. invalid key, quota limit)
    throw new Error(gemError.message || "AI 응답을 처리하는 중에 예상치 못한 오류가 발생했습니다.");
  }
}

// 1. Analyze Dream
export async function analyzeDream(content: string, emotions: string[]): Promise<any> {
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

  return safeApiRequest(async () => {
    const responseText = await callGeminiDirectly(prompt, systemInstruction, "application/json");
    return JSON.parse(cleanJsonString(responseText));
  });
}

// 2. Generate LONG Report
export async function generateReport(dreams: Dream[]): Promise<any> {
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

  return safeApiRequest(async () => {
    const responseText = await callGeminiDirectly(prompt, systemInstruction);
    return { aiOverview: responseText.trim() };
  });
}

// 3. Analyze Perspectives (Freud vs Jung)
export async function analyzePerspectives(title: string, content: string): Promise<any> {
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

  return safeApiRequest(async () => {
    const responseText = await callGeminiDirectly(prompt, systemInstruction, "application/json");
    return JSON.parse(cleanJsonString(responseText));
  });
}

// 4. Look up Symbol
export async function lookUpSymbol(keyword: string): Promise<any> {
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

  return safeApiRequest(async () => {
    const responseText = await callGeminiDirectly(prompt, systemInstruction, "application/json");
    return JSON.parse(cleanJsonString(responseText));
  });
}

// 5. Intelligent Character Chatbot
export async function chatCharacter(
  character: string,
  dreamContent: string,
  userInput: string,
  chatHistory: any[]
): Promise<any> {
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

  return safeApiRequest(async () => {
    const responseText = await callGeminiDirectly(promptMessage, systemInstruction);
    return { response: responseText.trim() };
  });
}
