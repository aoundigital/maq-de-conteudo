import { GoogleGenAI } from "@google/genai";
import { AppSettings, getProviderFromModel } from "../types";
import DOMPurify from "dompurify";

export interface ArticleParams {
  clientName: string;
  quantity: number;
  mainKeyword: string;
  otherKeywords: string;
  url: string;
  settings: AppSettings;
}

export interface GeneratedArticle {
  id: string;
  title: string;
  content: string;
  filename: string;
  date: string;
  clientName: string;
}

async function generateAndUploadImage(mainKeyword: string, imageStyle: string, imgbbKey?: string): Promise<string> {
  const query = imageStyle?.trim()
    ? encodeURIComponent(`${mainKeyword},${imageStyle.replace(/\s+/g, ",")}`)
    : encodeURIComponent(mainKeyword);
    
  const pollUrl = `https://image.pollinations.ai/prompt/${query}?width=1200&height=628&nologo=true`;

  if (!imgbbKey || imgbbKey.trim() === "") {
    // Destino gratuito via API Pollinations direto (fallback se não tiver ImgBB)
    return pollUrl;
  }

  try {
    const response = await fetch(pollUrl);
    if (!response.ok) throw new Error("Falha no download da imagem IA");
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("image", blob, "image.jpg");

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey.trim()}`, {
      method: "POST",
      body: formData,
    });
    
    if (!imgbbRes.ok) throw new Error("Falha no upload para o ImgBB");
    const imgbbData = await imgbbRes.json();
    return imgbbData.data.url;
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    // Se falhar, usa Pollinations como backup seguro
    return pollUrl;
  }
}

// CVE-7: Sanitize AI-generated HTML to prevent stored XSS
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["h1", "h2", "h3", "h4", "p", "a", "img", "b", "ul", "ol", "li", "strong", "em", "br"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "style"],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

// PROMPT BUILDER
function buildPrompt(params: ArticleParams, index: number, imageUrl: string): string {
  const { quantity, mainKeyword, otherKeywords, url, settings } = params;
  const minWords = settings.minWords ?? 800;
  const pCount = Math.max(18, Math.ceil(minWords / 65));
  const h2Count = Math.max(7, Math.ceil(minWords / 150));

  return `You are a Chief Editor of a major news portal and SEO authority.
Your mission is to produce an epic MEGAPOST about "${mainKeyword}" in Brazilian Portuguese (pt-BR).

PERFORMANCE TARGETS (MANDATORY)
- Write AT LEAST ${minWords} WORDS.
- Use exactly ${h2Count} subheadings (<h2>) to divide the content.
- Write at least ${pCount} long paragraphs (minimum 100 words per paragraph).

TECHNICAL RULES (STRICTLY ENFORCED)
- Tone: ${settings.tone} (persuasive approach) | Level: ${settings.languageLevel}
- Format: PURE HTML (<h1>, <h2>, <h4>, <p>, <a>, <img>, <b>, <strong>, <ul>, <ol>, <li>).
- IMPORTANT SEO 1: Include a highly persuasive and SEO-optimized Meta Description precisely wrapped within <h4> tags. This MUST be the very first element directly below the <h1> tag.
- IMPORTANT SEO 2: Bold key terms related to "${mainKeyword}". CRITICAL REGRA: DONT use more than 6 bolds (<B> or <STRONG>) across the ENTIRE article.
- SUBHEADING STYLE: PROHIBITED to use explanatory prefixes with a colon in your subheadings (e.g., NEVER write "Visão geral: Conceito", "Análise detalhada: Dados", or "Conclusão: Resumo"). Subheadings must be direct, journalistic, and captivating without any descriptive labels or colons.
- LISTS: Use MAXIMUM ONE (1) list (either <ul> or <ol>) in the entire article. Prioritize well-developed paragraphs.
- Image Backlink: The image MUST be a link pointing exactly to "${url}". Insert this HTML after the first <h2>: <a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${mainKeyword}" style="width:100%; border-radius:12px; margin:30px 0;"></a>
- Contextual Backlink: Naturally transform one of the inserted keywords into a hyperlink (<a>) pointing exactly to "${url}".
- Credibility Link: Include 1 external link to an authority source (e.g., Wikipedia, government, or NGO site) naturally in the text to validate information.
- Evidence & Quotes: You MUST include real/verifiable statistics/data AND quotes/statements from industry references (include their name and source).
- Expert Opinion: Include a dedicated paragraph expressing an expert opinion on the subject, based on reviews from authoritative people or entities. The tone must be explanatory and friendly.
- Secondary keywords to include naturally: ${otherKeywords}.

STRUCTURE
1. INTRO: Deep impact of "${mainKeyword}".
2. OVERVIEW: Direct and engaging explanation of the roots and relevance now.
3. IN-DEPTH ANALYSIS: Data, statistics, and trends.
4. EXPERT OPINION: The mandatory expert opinion paragraph.
5. PRACTICAL GUIDE: Implementation insights.
6. CHALLENGES AND MYTHS: Common misconceptions.
7. USE CASES: Detailed examples and success stories with quotes.
8. THE FUTURE: Where this topic is heading.
${settings.includeFAQ ? "9. FAQ: 5 questions with complete answers." : ""}

This is article number ${index} of ${quantity}. It MUST approach a different angle.

Return ONLY the pure HTML starting with <h1>. No extra text or markdown formatting.`;
}

// GEMINI
async function generateWithGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  // Trata nomenclaturas comerciais para as chaves reais de API (v1beta do Google)
  let actualModel = model;
  if (model.includes("3.1-pro") || model.includes("3.0-pro")) {
    actualModel = "gemini-2.0-pro-exp-02-05";
  } else if (model.includes("3.1-flash") || model.includes("3.0-flash")) {
    actualModel = "gemini-2.0-flash";
  }

  const response = await ai.models.generateContent({
    model: actualModel,
    contents: prompt,
    config: { maxOutputTokens: 8192, temperature: 0.8 },
  });
  return response.text ?? "";
}

// OPENAI
function getOpenAIMaxTokens(model: string): number {
  if (model === "gpt-4o" || model === "gpt-4o-mini" || model === "gpt-4.5-preview") return 16384;
  if (model.startsWith("o1") || model.startsWith("o3")) return 32768;
  return 4096;
}

async function generateWithOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
  const isLogicModel = model.startsWith("o1") || model.startsWith("o3");
  
  const body: any = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  // Logic models do not tolerate "temperature" and use "max_completion_tokens"
  if (isLogicModel) {
    body.max_completion_tokens = getOpenAIMaxTokens(model);
  } else {
    body.temperature = 0.8;
    body.max_tokens = getOpenAIMaxTokens(model);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ANTHROPIC
async function generateWithAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { content: { type: string; text: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

// GROQ
async function generateWithGroq(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// MISTRAL
async function generateWithMistral(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 8192,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Mistral error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// MAIN EXPORT
export async function generateArticles(
  params: ArticleParams,
  onProgress?: (current: number) => void
): Promise<GeneratedArticle[]> {
  const { clientName, quantity, settings } = params;
  const { selectedModel, aiKeys } = settings;
  const provider = getProviderFromModel(selectedModel);

  const keyMap: Record<string, string> = {
    gemini: aiKeys.geminiKey,
    openai: aiKeys.openaiKey,
    anthropic: aiKeys.anthropicKey,
    groq: aiKeys.groqKey,
    mistral: aiKeys.mistralKey,
  };

  const apiKey = keyMap[provider];
  if (!apiKey) {
    throw new Error(`API key not configured for provider ${provider}. Go to Settings -> AI Keys.`);
  }

  const articles: GeneratedArticle[] = [];

  for (let i = 1; i <= quantity; i++) {
    const imageUrl = await generateAndUploadImage(params.mainKeyword, settings.imageStyle ?? "", aiKeys.imgbbKey);
    const prompt = buildPrompt(params, i, imageUrl);
    let rawHtml = "";

    switch (provider) {
      case "gemini":
        rawHtml = await generateWithGemini(prompt, apiKey, selectedModel);
        break;
      case "openai":
        rawHtml = await generateWithOpenAI(prompt, apiKey, selectedModel);
        break;
      case "anthropic":
        rawHtml = await generateWithAnthropic(prompt, apiKey, selectedModel);
        break;
      case "groq":
        rawHtml = await generateWithGroq(prompt, apiKey, selectedModel);
        break;
      case "mistral":
        rawHtml = await generateWithMistral(prompt, apiKey, selectedModel);
        break;
    }

    // Strip markdown code fences
    rawHtml = rawHtml
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // CVE-7: Sanitize before storing - prevents stored XSS
    const htmlContent = sanitizeHtml(rawHtml);

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, "")
      : `Article ${i} - ${params.mainKeyword}`;

    articles.push({
      id: crypto.randomUUID(),
      title,
      content: htmlContent,
      filename: `${i}_${clientName.replace(/\s+/g, "_").toLowerCase()}.html`,
      date: new Date().toISOString(),
      clientName,
    });

    onProgress?.(i);
  }

  return articles;
}
