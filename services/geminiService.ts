import { GoogleGenAI } from "@google/genai";
import type { VisitaTecnica, AnotacaoTecnica } from '../types';

/**
 * Obtém a chave da API do Gemini a partir das variáveis de ambiente.
 * Conforme as diretrizes, a chave deve ser gerenciada exclusivamente pelo ambiente de execução.
 * @returns {string | undefined} A chave da API.
 */
const getApiKey = (): string | undefined => {
    return process.env.API_KEY;
};


/**
 * Valida a chave de API do Gemini (obtida do ambiente) fazendo uma chamada simples.
 * @returns {Promise<boolean>} `true` se a chave for válida, `false` caso contrário.
 */
export const testApiKey = async (): Promise<boolean> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("Chave de API do Gemini não encontrada no ambiente.");
        return false;
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'hello'
        });
        return true;
    } catch (error) {
        console.error("Teste da chave de API falhou:", error);
        return false;
    }
};

/**
 * Gera um resumo profissional de uma visita técnica usando a API Gemini.
 */
export const generateReportSummary = async (
  visit: VisitaTecnica,
  annotations: AnotacaoTecnica[]
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Chave da API Gemini não encontrada. O laudo não pode ser gerado.");
    throw new Error("Chave da API não configurada no ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const local = visit.descricao_extra;
  const dataVisita = new Date(visit.data_inicio).toLocaleString('pt-BR');

  const prompt = `
    Gere um laudo técnico conciso e profissional em Português (Brasil) para a seguinte visita técnica.
    O laudo deve ser estruturado com as seções: Cliente, Local, Data, Técnico Responsável, Diagnóstico, Ações Executadas e Testes Realizados.

    ### Dados da Visita ###
    Cliente: ${visit.cliente}
    Local: ${local}
    Data: ${dataVisita}
    Técnico Responsável: ${visit.tecnico?.nome || 'Não informado'}
    Status Atual: ${visit.status}

    ### Anotações Detalhadas ###
    ${annotations.map(a => `- ${a.tipo.toUpperCase()}: ${a.descricao}`).join('\n')}

    Baseado nas anotações, sintetize as informações em suas respectivas seções no laudo final.
    Seja claro e objetivo.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    throw new Error("Falha ao gerar o resumo do laudo pela API Gemini.");
  }
};

/**
 * Refina uma transcrição de texto bruto em uma nota profissional usando a API Gemini.
 */
export const refineTranscription = async (rawText: string, customPromptContent: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("Chave da API Gemini não encontrada. O refinamento de texto não pode ser executado.");
        throw new Error("Chave da API não configurada no ambiente.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = customPromptContent.replace("[TEXTO_BRUTO_AQUI]", `"${rawText}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2, 
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erro ao chamar a API Gemini para refinamento:", error);
        throw new Error("Falha ao refinar a transcrição pela API Gemini.");
    }
};

/**
 * Transcreve um arquivo de áudio para texto usando a API Gemini.
 * @param {string} audioBase64 O áudio codificado em Base64.
 * @param {string} mimeType O tipo MIME do áudio (ex: 'audio/webm').
 * @returns {Promise<string>} O texto transcrito.
 */
export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("Chave da API Gemini não encontrada. A transcrição de áudio está desabilitada.");
        throw new Error("Chave da API não configurada no ambiente.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Transcreva este áudio para o português do Brasil. O áudio contém uma anotação de um técnico de TI em campo.",
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, audioPart] },
        });

        return response.text.trim();

    } catch (error) {
        console.error("Erro ao chamar a API Gemini para transcrição:", error);
        throw new Error("Falha ao transcrever o áudio pela API Gemini.");
    }
};
