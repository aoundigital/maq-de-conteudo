import { GoogleGenAI } from "@google/genai";
import { AppSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function generateArticles(params: ArticleParams): Promise<GeneratedArticle[]> {
  const articles: GeneratedArticle[] = [];
  const { clientName, quantity, mainKeyword, otherKeywords, url, settings } = params;

  for (let i = 1; i <= quantity; i++) {
    const prompt = `
      Você é um redator jornalístico sênior especializado em SEO e conteúdo editorial de prestígio.
      Crie um artigo único em Português do Brasil (pt_BR) sobre o tema: "${mainKeyword}".
      
      REQUISITOS OBRIGATÓRIOS DE FORMATO (HTML):
      1. Use apenas as tags HTML: <h1>, <h2>, <h3>, <p>, <a>, <img>, <b>.
      2. NÃO inclua cabeçalhos HTML (<html>, <head>, <body>, <header>, <title>, <meta>).
      3. NÃO use Javascript.
      4. Use a tag <b> para destacar palavras-chave, sinônimos ou termos importantes de forma natural.
      5. Use listas (<ul>, <ol>) no MÁXIMO uma vez por artigo.
      
      REQUISITOS DE CONTEÚDO:
      1. Tom da escrita: ${settings.tone}.
      2. Público-alvo: ${settings.targetAudience}.
      3. Nível de linguagem: ${settings.languageLevel}.
      4. Tamanho mínimo: O artigo deve ter pelo menos ${settings.minWords} palavras.
      5. Estrutura: Exposição de fatos, explicações detalhadas, depoimentos fictícios de especialistas do setor, exemplos práticos e um ponto de vista pessoal/conclusão ao final.
      ${settings.includeFAQ ? "6. Inclua uma pequena seção de 'Perguntas Frequentes' (FAQ) ao final usando <h3> para as perguntas e <p> para as respostas." : ""}
      7. SEO: Otimize o texto para a palavra-chave principal "${mainKeyword}" e as secundárias: "${otherKeywords}".
      8. LINK: Insira um link para a URL "${url}" usando como âncora EXATAMENTE uma das palavras-chave enviadas (${mainKeyword} ou alguma de ${otherKeywords}). O link deve estar contextualizado naturalmente no texto.
      9. IMAGEM: Insira uma tag <img> entre o primeiro e o segundo parágrafo. 
         - O src deve ser: https://picsum.photos/seed/${encodeURIComponent(clientName + i + Date.now())}/800/600
         - O alt deve ser o título do artigo.
      
      DIFERENCIAÇÃO:
      Este é o artigo número ${i} de ${quantity}. Ele deve ser COMPLETAMENTE ÚNICO, abordando um ângulo diferente dos outros, usando fontes e dados (simulados mas realistas) atualizados.
      
      Retorne apenas o código HTML puro, começando diretamente pela tag <h1>.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const htmlContent = response.text || "";
      const titleMatch = htmlContent.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : `Artigo ${i} - ${mainKeyword}`;
      
      articles.push({
        id: crypto.randomUUID(),
        title,
        content: htmlContent,
        filename: `${i}${clientName.replace(/\s+/g, '_').toLowerCase()}.html`,
        date: new Date().toISOString(),
        clientName,
      });
    } catch (error) {
      console.error("Erro ao gerar artigo:", error);
      throw error;
    }
  }

  return articles;
}
