import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface EditImageParams {
  base64ImageData: string;
  mimeType: string;
  prompt: string;
  character: string | null;
  isSticker: boolean;
}

export async function transformImage({ base64ImageData, mimeType, prompt, character, isSticker }: EditImageParams): Promise<string> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key не найден. Проверьте настройки Environment Variables (API_KEY) в Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let characterPrompt = "";
  if (character === 'ЛЫСЫЙ') characterPrompt = "Сделай человека на фото абсолютно лысым, как колено.";
  if (character === 'ДУМЧИК') characterPrompt = "Одень этого персонажа в униформу ФСН (спецслужбы).";
  if (character === 'БОССИК') characterPrompt = "Одень этого персонажа в форму полицейского РФ.";
  if (character === 'НЕО') characterPrompt = "Визуально измени пропорции так, чтобы человек выглядел ростом ровно 1.50 метра.";
  
  const faceInstruction = "ВАЖНО: НЕ МЕНЯЙ ЛИЦО. Лицо должно остаться на 100% оригинальным, узнаваемым и идентичным исходному фото. Только меняй окружение, одежду или прическу согласно запросу.";

  let finalSystemInstruction = "";
  
  if (isSticker) {
    finalSystemInstruction = `Создай крутой цифровой стикер. 
      Стиль: чистый векторный рисунок или высококачественная 3D иллюстрация. 
      Обязательно: жирный белый контур (white border), плоский яркий фон. 
      Описание: ${prompt} ${characterPrompt}. 
      ${base64ImageData ? 'Используй лицо с фото как основу для персонажа стикера, сохраняя узнаваемость.' : ''}
      ${faceInstruction}`;
  } else {
    finalSystemInstruction = `Трансформируй это фото. 
      Запрос пользователя: ${prompt}. 
      Дополнительная цель: ${characterPrompt}. 
      ${faceInstruction} 
      Стиль: реалистичный, кинематографичный.`;
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

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Пустой ответ от шайки AI. Возможно, сработали фильтры безопасности (запрещенный контент).");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Изображение потерялось в подворотне. Попробуйте другой запрос.");
  } catch (error: any) {
    console.error("AI Error:", error);
    if (error.status === 403 || error.message?.includes("403")) {
      throw new Error("Ошибка 403: Доступ запрещен. Проверьте, включен ли Gemini API в Google Cloud Console и правильно ли указан ключ.");
    }
    throw error;
  }
}
