import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface EditImageParams {
  base64ImageData: string;
  mimeType: string;
  prompt: string;
  character: string | null;
  isSticker: boolean;
  modelName: string;
}

/**
 * Performs a lightweight "warmup" call to initialize the API connection 
 * and verify project/billing status before the user starts generating.
 */
export async function warmupModel(modelName: string): Promise<boolean> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return false;

  try {
    const ai = new GoogleGenAI({ apiKey });
    // We do a very lightweight generateContent call with maxOutputTokens: 1
    // to "wake up" the inference server and check if the API Key/Project is valid for this model.
    // This reduces the cold-start delay for the first actual generation.
    await ai.models.generateContent({
      model: modelName.startsWith('imagen-') ? 'gemini-3-flash-preview' : modelName,
      contents: "Warmup: reply with 1 word.",
      config: {
        maxOutputTokens: 1
      }
    });
    return true;
  } catch (error) {
    console.warn("Warmup failed (expected for non-GenAI models or restricted projects):", error);
    return false;
  }
}

export async function transformImage({ 
  base64ImageData, 
  mimeType, 
  prompt, 
  character, 
  isSticker,
  modelName 
}: EditImageParams): Promise<string> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Ключ не найден. Зайдите в Настройки и выберите ключ.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let characterPrompt = "";
  if (character === 'ЛЫСЫЙ') characterPrompt = "Сделай человека на фото абсолютно лысым.";
  if (character === 'ДУМЧИК') characterPrompt = "Одень персонажа в униформу спецслужб.";
  if (character === 'БОССИК') characterPrompt = "Одень персонажа в форму полицейского начальника.";
  if (character === 'НЕО') characterPrompt = "Сделай персонажа очень низкого роста (1.50м).";
  
  const faceInstruction = "ВАЖНО: НЕ МЕНЯЙ ЛИЦО. Лицо должно остаться идентичным оригиналу. Меняй только окружение, одежду или прическу.";

  let finalSystemInstruction = "";
  
  if (isSticker) {
    finalSystemInstruction = `Цифровой стикер, белый контур, плоский фон. Описание: ${prompt} ${characterPrompt}. ${faceInstruction}`;
  } else {
    finalSystemInstruction = `Фото-трансформация. Запрос: ${prompt}. Цель: ${characterPrompt}. ${faceInstruction} Реализм.`;
  }

  try {
    // Handling Imagen models separately as per SDK rules
    if (modelName.startsWith('imagen-')) {
      const response = await ai.models.generateImages({
        model: modelName,
        prompt: finalSystemInstruction,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
        },
      });
      
      if (response.generatedImages && response.generatedImages.length > 0) {
        return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      throw new Error("Imagen не вернул изображение.");
    } 

    // Standard generateContent for Gemini and potentially Flux (if supported by environment)
    const contents = {
      parts: [
        ...(base64ImageData ? [{
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        }] : []),
        { text: finalSystemInstruction },
      ],
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("AI не дал ответа. Попробуйте другую модель в настройках.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Изображение не найдено в ответе.");
  } catch (error: any) {
    console.error("AI Error:", error);
    if (error.status === 403 || error.message?.includes("403")) {
      throw new Error("Ошибка 403: Доступ запрещен. Вероятно, для этой модели нужен Billing (платный аккаунт).");
    }
    throw error;
  }
}
