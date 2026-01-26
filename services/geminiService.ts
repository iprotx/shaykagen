import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface EditImageParams {
  base64ImageData: string;
  mimeType: string;
  prompt: string;
  character: string | null;
  isSticker: boolean;
}

export async function transformImage({ base64ImageData, mimeType, prompt, character, isSticker }: EditImageParams): Promise<string> {
  // Always create a new instance right before making an API call 
  // to ensure it uses the most up-to-date API key from the environment.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let characterPrompt = "";
  if (character === 'ЛЫСЫЙ') characterPrompt = "Сделай человека на фото абсолютно лысым, как колено.";
  if (character === 'ДУМЧИК') characterPrompt = "Одень этого персонажа в униформу спецслужб.";
  if (character === 'БОССИК') characterPrompt = "Одень этого персонажа в форму полицейского.";
  if (character === 'НЕО') characterPrompt = "Визуально измени пропорции так, чтобы человек выглядел очень низким (ростом 1.50 метра).";
  
  const faceInstruction = "ВАЖНО: НЕ МЕНЯЙ ЛИЦО. Лицо должно остаться на 100% оригинальным и узнаваемым. Меняй только окружение, одежду или прическу.";

  let finalSystemInstruction = "";
  
  if (isSticker) {
    finalSystemInstruction = `Создай крутой цифровой стикер. Стиль: чистый векторный рисунок. Обязательно: жирный белый контур (white border), яркий фон. Описание: ${prompt} ${characterPrompt}. ${faceInstruction}`;
  } else {
    finalSystemInstruction = `Трансформируй это фото. Запрос: ${prompt}. Доп. цель: ${characterPrompt}. ${faceInstruction} Стиль: реалистичный.`;
  }

  try {
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
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("AI не смог сгенерировать изображение. Попробуйте другой запрос.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Изображение не найдено в ответе.");
  } catch (error: any) {
    console.error("AI Error:", error);
    throw error;
  }
}
