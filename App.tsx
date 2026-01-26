import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import PromptInput from './components/PromptInput';
import ActionButton from './components/ActionButton';
import GeneratedImageDisplay from './components/GeneratedImageDisplay';
import { transformImage } from './services/geminiService';

type Character = 'ЛЫСЫЙ' | 'ДУМЧИК' | 'БОССИК' | 'ДЕНЧИК' | 'НЕО' | null;

const App: React.FC = () => {
  const [refImage, setRefImage] = useState<{base64: string, mime: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'transform' | 'sticker'>('transform');

  const onImageSelected = (base64: string, mime: string) => {
    setRefImage({ base64, mime });
    setPreviewUrl(`data:${mime};base64,${base64}`);
    setError(null);
    setResultUrl(null);
  };

  const handleGenerate = async (targetMode: 'transform' | 'sticker' = 'transform') => {
    if (targetMode === 'transform' && !refImage) {
      setError('Загрузи ублюдка сначала!');
      return;
    }
    if (!prompt.trim() && !selectedChar) {
      setError('Напиши хоть что-то или выбери жертву!');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await transformImage({
        base64ImageData: refImage?.base64 || '',
        mimeType: refImage?.mime || 'image/png',
        prompt: prompt,
        character: selectedChar,
        isSticker: targetMode === 'sticker'
      });
      setResultUrl(result);
    } catch (err: any) {
      setError(err.message || 'Сбой в матрице шайки');
    } finally {
      setLoading(false);
    }
  };

  const characters: Character[] = ['ЛЫСЫЙ', 'ДУМЧИК', 'БОССИК', 'ДЕНЧИК', 'НЕО'];

  return (
    <div className="w-full max-w-6xl space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <header className="text-center space-y-3">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 text-neon tracking-tighter uppercase italic">
          Шайка детства
        </h1>
        <p className="text-white/30 font-bold tracking-[0.5em] uppercase text-[10px] md:text-xs">
          VIP GENERATOR • EXCLUSIVE FOR THE GANG
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-5 flex flex-col space-y-6">
          <div className="glass rounded-[2.5rem] p-6 md:p-8 space-y-8 shadow-2xl">
            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-purple-300/60 text-[10px] font-black uppercase tracking-widest px-1">
                {refImage ? 'Ублюдок загружен' : '1. Загрузи ублюдка сюда'}
              </label>
              <ImageUploader onImageSelected={onImageSelected} previewUrl={previewUrl} />
            </div>

            {/* Character Selection */}
            {previewUrl && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                <label className="text-purple-300/60 text-[10px] font-black uppercase tracking-widest px-1">Кто же он?</label>
                <div className="flex flex-wrap gap-2">
                  {characters.map(char => (
                    <button
                      key={char}
                      onClick={() => setSelectedChar(selectedChar === char ? null : char)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        selectedChar === char 
                        ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Instruction */}
            <div className="space-y-4">
              <label className="text-purple-300/60 text-[10px] font-black uppercase tracking-widest px-1">Как накажем его?</label>
              <PromptInput prompt={prompt} onChange={setPrompt} disabled={loading} />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider animate-bounce">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <ActionButton 
                onClick={() => handleGenerate('transform')} 
                loading={loading && mode === 'transform'} 
                disabled={loading || !refImage}
              >
                Наказать
              </ActionButton>
              <button
                onClick={() => handleGenerate('sticker')}
                disabled={loading || (!prompt.trim() && !selectedChar)}
                className={`
                  py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all
                  ${loading 
                    ? 'bg-white/5 text-white/20' 
                    : 'bg-indigo-600/40 border border-indigo-400/30 text-indigo-100 hover:bg-indigo-500/60 shadow-lg'
                  }
                `}
              >
                Стикер
              </button>
            </div>
            
            <button 
              onClick={() => { setRefImage(null); setPreviewUrl(null); setPrompt(''); setSelectedChar(null); setResultUrl(null); }}
              className="w-full text-white/10 hover:text-white/30 text-[9px] font-black uppercase tracking-[0.3em] transition-all"
            >
              Отпустить грехи (сброс)
            </button>
          </div>
        </section>

        <section className="lg:col-span-7">
          <div className="glass rounded-[2.5rem] overflow-hidden min-h-[500px] h-full shadow-2xl border border-white/5">
            <GeneratedImageDisplay imageUrl={resultUrl} originalUrl={previewUrl} isLoading={loading} />
          </div>
        </section>
      </main>

      <footer className="text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[1em] text-purple-200">
          CHILHOOD GANG PROPRIETARY SYSTEM
        </p>
      </footer>
    </div>
  );
};

export default App;