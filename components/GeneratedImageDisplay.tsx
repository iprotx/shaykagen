import React, { useState, useEffect } from 'react';

interface GeneratedImageDisplayProps {
  imageUrl: string | null;
  originalUrl: string | null;
  isLoading: boolean;
}

const loadingMessages = [
  "Вайпер рисует...",
  "Выписываем штраф ублюдку...",
  "Бреем Лысого...",
  "Шьем форму Думчику...",
  "Ищем жетон для Боссика...",
  "Укорачиваем Нео до 1.50...",
  "Денчик одобряет...",
  "Шайка выносит вердикт...",
  "Прячем улики...",
  "Накидываем эффектов...",
  "Проверяем на лояльность..."
];

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, originalUrl, isLoading }) => {
  const [viewMode, setViewMode] = useState<'result' | 'compare'>('result');
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setCurrentMsgIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `transformed-${Date.now()}.png`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-8 animate-pulse">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-pink-500 animate-spin-slow"></div>
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-2xl font-black text-white tracking-tighter uppercase italic text-neon">
            {loadingMessages[currentMsgIndex]}
          </p>
          <p className="text-[10px] text-white/30 font-bold tracking-[0.3em] uppercase">
            Процесс наказания запущен
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 md:p-8">
      {imageUrl ? (
        <div className="flex-grow flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button 
                onClick={() => setViewMode('result')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'result' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Результат
              </button>
              <button 
                onClick={() => setViewMode('compare')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'compare' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                Сравнить
              </button>
            </div>
            <button 
              onClick={handleDownload}
              className="p-2 text-white/40 hover:text-purple-400 transition-colors"
              title="Скачать"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          <div className="flex-grow relative rounded-2xl overflow-hidden glass border-white/5 group">
            {viewMode === 'result' ? (
              <img
                src={imageUrl}
                alt="AI Result"
                className="w-full h-full object-contain bg-black/20"
              />
            ) : (
              <div className="grid grid-cols-2 h-full gap-1 bg-white/5">
                <div className="relative h-full overflow-hidden">
                  <img src={originalUrl!} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[8px] uppercase font-black text-white/60">До</div>
                </div>
                <div className="relative h-full overflow-hidden">
                  <img src={imageUrl} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-purple-600 px-2 py-1 rounded text-[8px] uppercase font-black text-white">После</div>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
               <p className="text-[10px] text-white/60 font-medium uppercase text-center tracking-widest">Обработано Шайкой</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center space-y-6 opacity-40">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-colors">
              <svg className="w-12 h-12 text-white/20 group-hover:text-purple-400/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/40">Подвал пуст</p>
            <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest">Ждем фото для экзекуции</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedImageDisplay;