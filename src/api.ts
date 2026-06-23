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
        "summary": "정서를 적극 지지하고 무의식의 힌트를 차분하고 품격 있게 성찰하는 2-3문장의 정갈한 코멘트. 스마트폰 좁은 화면에서의 모바일 가독성을 위해 긴 통줄글을 피하고 가볍게 줄을 띄워(개행) 가독성을 극대화하여 구성하십시오. (이 분석은 의료 진단이 아닙니다 구절을 끝에 병기해야 함)"
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
export async function generateReport(dreams: Dream[], expertType: string = "warm"): Promise<any> {
  let expertTitle = "";
  let expertTone = "";
  
  if (expertType === "cold") {
    expertTitle = "팩트 폭격 냉철 분석가 (Dr. 냉철)";
    expertTone = `
      - 매우 이성적이고, 객관적이며, 냉철한 말투(차갑고 군더더기 없는 '~다', '~음', '~입니다' 종결형 혼용)를 일관되게 적용합니다.
      - 감상적이거나 주관적인 공감 및 정서적 위로는 철저하게 배제합니다.
      - 꿈에 표현된 구체적 사물, 상호작용 빈도, 정량화된 감정의 불일치를 바탕으로 현상을 냉정하게 분해하여 해석합니다.
      - 명확하고 지적이면서 뼈를 때리는 무의식 요인 분석과 인과적 솔루션을 조목조목 지적합니다.
    `;
  } else if (expertType === "psycho") {
    expertTitle = "프로이트·융 학파 심층 분석학 대가 (Dr. 시그문드)";
    expertTone = `
      - 연륜 있는 노교수나 대현자와 같은 중후하고 전문적인 분석어조를 사용합니다.
      - 프로이트적 '무의식적 억압', '리비도의 전위와 고찰', '자아 방어기제' 혹은 칼 융의 '집단 무의식 원형', '동반자적 그림자(Shadow)의 수용', '아니마/아니무스 조화', '자아 통합' 같은 정신분석적 개념들을 자유롭게 인용합니다.
      - 꿈 표면에 나타난 외현적 내용 너머에 숨겨진 깊숙한 상징과 신화적 영감을 학구적으로 깊이 탐색합니다.
    `;
  } else {
    // Default is warm
    expertTitle = "따스한 위로 공감 상담사 (카운셀러 릴리)";
    expertTone = `
      - 포근하고 사려 깊으며, 위안을 느끼게 해주는 따뜻하고 대화체적인 아주 부드러운 존댓말(~했군요, ~이네요)을 사용합니다.
      - 꿈속에 깃들어 있는 지친 마음과 스트레스를 세심히 위로하며 감정을 감싸안아 줍니다.
      - 성과 압박보다는 마음을 쉴 수 있게 도와주는 일상의 사소하고 향기로운 해방구(조용한 차 한 잔, 심호흡, 명상적인 휴식)를 추천합니다.
    `;
  }

  const systemInstruction = `
    당신의 소임은 누적된 꿈 데이터를 성심을 다해 종합하여 일관된 어조로 깊이 있는 "종합 무의식 심층 보고서"를 지어주는 일입니다.
    현재 당신은 특별히 촉탁받은 [${expertTitle}]로서의 페르소나를 유지해야 합니다.
    
    [어조 가이드라인]:
    ${expertTone}
    
    [의료 준칙]:
    - 우울증, ADHD, 특정 트라우마, PTSD, 불안 장애 등 의학적 정신과 용어를 멋대로 진단하거나 가정을 절대 단정하여 쓰지 마십시오.
    - 마음 성찰의 도구로서만 제시해야 합니다.
    - 기재하는 리포트 본문의 마무리 구절 근처에 반드시 다음 면책 문구를 1회 은근하고 정갈하게 배치하십시오: "본 종합 분석은 전문가의 임상적 보조 진단을 대체할 수 없으며 자기 성찰 보조 지표입니다."
    
    [길이 및 깊이 요건]:
    - 절대 분량을 대충 서술하지 마십시오. 글자 수는 대략 '한글 300자 ~ 500자' 사이로 적당히 길고 풍성하게 작문하여, 문장의 연결이 매력적이고 유려하며 흐름이 완전하도록 하십시오.
    - 질문자가 자신의 내면 심리를 진지하게 비추어볼 수 있는 충분하고 깊은 통찰력을 담아 완성해 주세요.

    [모바일 가독성 개행 규칙 - 극히 중요]:
    - 스마트폰 화상의 좁은 세로 화면에서 한눈에 수월하게 읽힐 수 있도록 배려하십시오.
    - 줄글이 길게 뭉쳐있으면 피로감이 크므로, 반드시 "2~3문장마다 한번씩 반드시 줄바꿈(엔터 입력)"을 수행하여 빈 줄(더블 개행)이 포함된 완전하게 짤막한 단락 체계로 가독성 가공을 해서 정비하십시오.
    - 턱없이 긴 한 줄짜리 단락은 금물입니다.
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

// 6. Transcribe Audio (Uses server-side Gemini audio-to-text API)
export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const customApiKey = localStorage.getItem("gemini_api_key") || "";
  const preferredModel = localStorage.getItem("gemini_preferred_model") || "gemini-2.0-flash";

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (customApiKey) {
    headers["x-gemini-api-key"] = customApiKey;
  }
  if (preferredModel) {
    headers["x-gemini-model"] = preferredModel;
  }

  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers,
    body: JSON.stringify({
      audio: base64Audio,
      mimeType: mimeType
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errorDetail = "음성 변환 실패";
    try {
      const parsedErr = JSON.parse(errText);
      if (parsedErr.error) {
        errorDetail = parsedErr.error;
      }
    } catch {
      errorDetail = errText;
    }
    throw new Error(`음성 변환 중 오류 발생: ${errorDetail}`);
  }

  const result = await response.json();
  return result.text || "";
}

