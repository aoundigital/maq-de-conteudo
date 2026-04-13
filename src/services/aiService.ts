import { AppSettings, getProviderFromModel, getRealModelId } from "../types";
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

// ── Image Generation ──────────────────────────────────────────────────────────

async function uploadToImgBB(blobUrl: string, imgbbKey: string): Promise<string> {
  const imgRes = await fetch(blobUrl);
  if (!imgRes.ok) throw new Error(`Falha ao baixar imagem: ${imgRes.status}`);

  const blob = await imgRes.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64data = (reader.result as string).split(',')[1];
        const formData = new FormData();
        formData.append('image', base64data);

        const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey.trim()}`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(`ImgBB upload failed ${uploadRes.status}: ${JSON.stringify(errData)}`);
        }
        const uploadData = await uploadRes.json();
        resolve(uploadData.data.url as string);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateAndUploadImage(
  mainKeyword: string,
  _otherKeywords: string,
  imageStyle: string,
  selectedImageModel: string,
  openrouterKey: string,
  imgbbKey: string
): Promise<string> {
  const styleHint = imageStyle?.trim() ? `, ${imageStyle.trim()}` : '';
  const prompt = `${mainKeyword}${styleHint}, editorial photography, professional, high quality, 16:9`;

  // ── PHASE 1: obtain a raw image URL ────────────────────────────────────────
  // Try OpenRouter AI image model first; fall back to Pollinations if anything fails.
  let rawImageUrl = '';

  if (openrouterKey?.trim()) {
    try {
      const genRes = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey.trim()}`,
        },
        body: JSON.stringify({
          model: selectedImageModel,
          prompt,
          n: 1,
          size: '1792x1024',
        }),
      });

      if (genRes.ok) {
        const genData = await genRes.json() as { data: { url: string }[] };
        rawImageUrl = genData.data?.[0]?.url ?? '';
      } else {
        const errBody = await genRes.json().catch(() => ({})) as { error?: { message?: string } };
        console.warn(`OpenRouter Image ${genRes.status}: ${errBody.error?.message ?? genRes.statusText} — usando Pollinations como fallback`);
      }
    } catch (err) {
      console.warn('OpenRouter image fetch failed — usando Pollinations como fallback:', err);
    }
  }

  // Pollinations as fallback (browser-safe, no key, reliable)
  if (!rawImageUrl) {
    const seed = Math.floor(Math.random() * 1000000);
    rawImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=628&nologo=true&seed=${seed}`;
  }

  // ── PHASE 2: upload raw image to ImgBB (always, if key is configured) ──────
  if (!imgbbKey?.trim()) {
    // No ImgBB key — use raw URL directly (temporary or Pollinations)
    return rawImageUrl;
  }

  try {
    const permanentUrl = await uploadToImgBB(rawImageUrl, imgbbKey);
    return permanentUrl;
  } catch (error) {
    console.error('ImgBB upload failed — returning raw image URL as last resort:', error);
    return rawImageUrl;
  }
}

// ── HTML Sanitization ─────────────────────────────────────────────────────────


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

// ── Prompt Builder ────────────────────────────────────────────────────────────

function buildPrompt(params: ArticleParams, index: number): string {
  const { quantity, mainKeyword, otherKeywords, url, settings } = params;
  const minWords = settings.minWords ?? 800;
  const pCount = Math.max(18, Math.ceil(minWords / 65));
  const h2Count = Math.max(7, Math.ceil(minWords / 150));

  return `<SYSTEM_ROLE>
You are an uncompromising Chief Editor of a major news portal and absolute SEO authority. Your ONLY output must be pristine, pure HTML.
</SYSTEM_ROLE>

<CRITICAL_MANDATES>
You MUST strictly obey the following rules without any exception. Failure to comply is a critical error.
1. LENGTH: Write AT LEAST ${minWords} WORDS.
2. FORMAT: PURE HTML ONLY (<h1>, <h2>, <h4>, <p>, <a>, <img>, <b>, <strong>, <ul>, <ol>, <li>). DO NOT wrap with \`\`\`html.
3. SUBHEADINGS COUNT: Use EXACTLY ${h2Count} subheadings (<h2>) to divide the content.
4. PARAGRAPHS COUNT: Write at least ${pCount} paragraphs.
5. PARAGRAPH VARIATION (CRITICAL): To enhance the natural flow, SIGNIFICANTLY vary the word count and length of EACH paragraph. Avoid uniform paragraph blocks at all costs. Mix short, punchy paragraphs with longer explanatory ones.
6. META DESCRIPTION: Include a highly persuasive and SEO-optimized Meta Description precisely wrapped within <h4> tags. This MUST be the very first element directly below the <h1> tag.
7. BOLDING: Bold key terms related to "${mainKeyword}". CRITICAL: DO NOT use more than 6 bolds (<B> or <STRONG>) across the ENTIRE article.
8. SUBHEADING WORDS BAN (NEVER USE): YOU MUST NEVER use the exact words "Conclusão", "Intro", "Introdução", "Análise Profunda", or "Guia Prático" in ANY <h2> or <h3>, especially alone.
9. SUBHEADING PREFIX BAN: NEVER use explanatory prefixes with a colon (e.g., "Visão geral: Conceito", "Análise detalhada: Dados").
10. SUBHEADING CREATIVITY: Be highly creative. Incorporate the exact keywords or synonyms naturally into subheadings.
11. LISTS: Use MAXIMUM ONE (1) list (either <ul> or <ol>) in the entire article. Prioritize well-developed paragraphs.
12. CONTEXTUAL BACKLINK (MANDATORY — EXACT ANCHOR TEXT): You MUST insert exactly ONE backlink pointing to "${url}". The anchor text of this link MUST be the EXACT main keyword: "${mainKeyword}". The link MUST follow this exact format: <a href="${url}">${mainKeyword}</a>. NO variations, synonyms, or paraphrases are allowed as anchor text. Example: if the main keyword is "evento social" and the URL is "http://eventosp.com.br/", the link must be: <a href="http://eventosp.com.br/">evento social</a>. This link must appear naturally within a paragraph's body text.
13. CREDIBILITY LINK: Include exactly 1 external link (<a>) to an authority source (e.g., Wikipedia, government site) naturally in the text.
14. EVIDENCE/QUOTES: You MUST include real or highly realistic verifiable statistics/data AND quotes/statements from industry references (include their name and source).
15. EXPERT OPINION: Include a dedicated paragraph expressing an expert opinion on the subject.
</CRITICAL_MANDATES>

<TASK>
Topic: "${mainKeyword}"
Language: Brazilian Portuguese (pt-BR)
Tone: ${settings.tone}
Level: ${settings.languageLevel}
Secondary Keywords: ${otherKeywords}

STRUCTURE:
1. INTRO: Deep impact of "${mainKeyword}".
2. OVERVIEW: Direct and engaging explanation of the roots and relevance now.
3. IN-DEPTH ANALYSIS: Data, statistics, and trends.
4. EXPERT OPINION: The mandatory expert opinion paragraph.
5. PRACTICAL GUIDE: Implementation insights.
6. CHALLENGES AND MYTHS: Common misconceptions.
7. USE CASES: Detailed examples and success stories with quotes.
8. THE FUTURE: Where this topic is heading.
${settings.includeFAQ ? "9. FAQ: 5 questions with complete answers." : ""}

You are generating article number ${index} out of ${quantity}. Ensure a unique, distinct angle from standard templates.
</TASK>

<FINAL_WARNING>
Read everything you generated. Validate the following before outputting:
- Is there any subheading with the word "Conclusão"? If so, YOU FAILED. Change it immediately.
- Are paragraph lengths varied? If not, rewrite to vary them.
- Is the output ONLY pure HTML (starting with <h1>)?
- Does the backlink use EXACTLY "${mainKeyword}" as anchor text pointing to "${url}"? Example: <a href="${url}">${mainKeyword}</a>. If not, fix it before outputting.
Proceed to output the HTML.
</FINAL_WARNING>`;
}

// ── Provider Functions ────────────────────────────────────────────────────────

async function generateWithOpenRouter(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': 'https://maquina-de-conteudo.vercel.app',
      'X-Title': 'Maquina de Conteudo',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({})) as { error?: { message?: string } };
    const apiMsg = errBody.error?.message ?? response.statusText;
    if (response.status === 401) {
      throw new Error(
        `Chave OpenRouter inválida (401 — ${apiMsg}). ` +
        'Verifique se copiou a chave corretamente em openrouter.ai/keys e salve novamente nas Configurações.'
      );
    }
    if (response.status === 402) {
      throw new Error(
        'Saldo insuficiente na conta OpenRouter (402). Adicione créditos em openrouter.ai/credits ou use um modelo gratuito.'
      );
    }
    throw new Error(`OpenRouter erro ${response.status}: ${apiMsg}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

function getOpenAIMaxTokens(model: string): number {
  if (model === 'gpt-4o' || model === 'gpt-4o-mini' || model === 'gpt-4.5-preview') return 16384;
  if (model.startsWith('o1') || model.startsWith('o3')) return 32768;
  return 4096;
}

async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number
): Promise<string> {
  const isLogicModel = model.startsWith('o1') || model.startsWith('o3');

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
  };

  if (isLogicModel) {
    body.max_completion_tokens = getOpenAIMaxTokens(model);
  } else {
    body.temperature = temperature;
    body.max_tokens = getOpenAIMaxTokens(model);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

async function generateWithGroq(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number
): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

async function generateWithMistral(
  prompt: string,
  apiKey: string,
  model: string,
  temperature: number
): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Mistral error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }
  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function generateArticles(
  params: ArticleParams,
  onProgress?: (current: number) => void
): Promise<GeneratedArticle[]> {
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;
  const { selectedModel, selectedImageModel, aiKeys, temperature } = settings;

  const provider = getProviderFromModel(selectedModel);
  const realModelId = getRealModelId(selectedModel);
  const temp = temperature ?? 0.7;

  // Trim all keys at source to avoid silent 401s from whitespace
  const keyMap: Record<string, string> = {
    openrouter: (aiKeys.openrouterKey ?? '').trim(),
    openai:     (aiKeys.openaiKey ?? '').trim(),
    groq:       (aiKeys.groqKey ?? '').trim(),
    mistral:    (aiKeys.mistralKey ?? '').trim(),
  };

  const apiKey = keyMap[provider];
  if (!apiKey) {
    const providerLabel: Record<string, string> = {
      openrouter: 'OpenRouter (openrouter.ai/keys)',
      openai:     'OpenAI (platform.openai.com/api-keys)',
      groq:       'Groq (console.groq.com/keys)',
      mistral:    'Mistral (console.mistral.ai/api-keys)',
    };
    throw new Error(
      `Chave de API não configurada para ${providerLabel[provider] ?? provider}. ` +
      'Acesse Configurações → Inteligências Artificiais e salve sua chave.'
    );
  }

  const articles: GeneratedArticle[] = [];

  for (let i = 1; i <= quantity; i++) {
    // Generate & upload image for this article
    const imageUrl = await generateAndUploadImage(
      mainKeyword,
      otherKeywords,
      settings.imageStyle ?? '',
      selectedImageModel ?? 'black-forest-labs/flux-schnell:free',
      aiKeys.openrouterKey,
      aiKeys.imgbbKey,
    );

    // Generate article text
    const prompt = buildPrompt(params, i);
    let rawHtml = '';

    switch (provider) {
      case 'openrouter':
        rawHtml = await generateWithOpenRouter(prompt, apiKey, realModelId, temp);
        break;
      case 'openai':
        rawHtml = await generateWithOpenAI(prompt, apiKey, realModelId, temp);
        break;
      case 'groq':
        rawHtml = await generateWithGroq(prompt, apiKey, realModelId, temp);
        break;
      case 'mistral':
        rawHtml = await generateWithMistral(prompt, apiKey, realModelId, temp);
        break;
    }

    // Strip markdown code fences
    rawHtml = rawHtml
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    // CVE-7: Sanitize before storing — prevents stored XSS
    let htmlContent = sanitizeHtml(rawHtml);

    // Pick a random keyword from otherKeywords for the alt tag
    const kwList = otherKeywords
      .split(/[,\n]/)
      .map(k => k.trim())
      .filter(Boolean);
    const altTag = kwList.length > 0
      ? kwList[Math.floor(Math.random() * kwList.length)]
      : mainKeyword;

    // Inject image programmatically after first </h2>
    const imageHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${mainKeyword}"><img src="${imageUrl}" alt="${altTag}" style="width:100%; border-radius:12px; margin:30px 0;"></a>`;

    const h2Match = htmlContent.match(/<\/h2>/i);
    const h3Match = htmlContent.match(/<\/h3>/i);

    if (h2Match && h2Match.index !== undefined) {
      htmlContent = htmlContent.slice(0, h2Match.index + 5) + imageHtml + htmlContent.slice(h2Match.index + 5);
    } else if (h3Match && h3Match.index !== undefined) {
      htmlContent = htmlContent.slice(0, h3Match.index + 5) + imageHtml + htmlContent.slice(h3Match.index + 5);
    } else {
      const pMatch = htmlContent.match(/<\/p>/i);
      if (pMatch && pMatch.index !== undefined) {
        htmlContent = htmlContent.slice(0, pMatch.index + 4) + imageHtml + htmlContent.slice(pMatch.index + 4);
      } else {
        htmlContent += imageHtml;
      }
    }

    const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, '')
      : `Article ${i} - ${mainKeyword}`;

    articles.push({
      id: crypto.randomUUID(),
      title,
      content: htmlContent,
      filename: `${i}_${clientName.replace(/\s+/g, '_').toLowerCase()}.html`,
      date: new Date().toISOString(),
      clientName,
    });

    onProgress?.(i);
  }

  return articles;
}
