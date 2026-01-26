import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface EditImageParams {
  base64ImageData: string;
  mimeType: string;
  prompt: string;
  character: string | null;
  isSticker: boolean;
}

export async function transformImage({ base64ImageData, mimeType, prompt, character, isSticker }: EditImageParams): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      Обязательно: жирный белый контур (white border), плоский яркий фон или прозрачный фон. 
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
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Пустой ответ от шайки AI.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Изображение потерялось в подворотне.");
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(error.message || "Ошибка генерации");
  }
}