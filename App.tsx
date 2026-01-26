import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import PromptInput from './components/PromptInput';
import ActionButton from './components/ActionButton';
import GeneratedImageDisplay from './components/GeneratedImageDisplay';
import { transformImage, warmupModel } from './services/geminiService';

type Character = 'ЛЫСЫЙ' | 'ДУМЧИК' | 'БОССИК' | 'ДЕНЧИК' | 'НЕО' | null;
type AIModel = 
  | 'gemini-2.5-flash-image' 
  | 'gemini-3-pro-image-preview' 
  | 'black-forest-labs/flux.2-klein-4b'
  | 'imagen-3';

const App: React.FC = () => {
  const [refImage, setRefImage] = useState<{base64: string, mime: string} | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemBooting, setSystemBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'transform' | 'sticker'>('transform');
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-2.5-flash-image');

  // System Initialization / Pre-loading logic
  useEffect(() => {
    const initSystem = async () => {
      setSystemBooting(true);
      
      // 1. Check API Key
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }

      // 2. Perform background warmup if key is present
      if (hasKey) {
        await warmupModel(selectedModel);
      }
      
      // Artificial slight delay for dramatic effect/UI consistency
      setTimeout(() => setSystemBooting(false), 800);
    };

    initSystem();
  }, [selectedModel]);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setShowSettings(false);
      // Re-trigger warmup
      warmupModel(selectedModel);
    }
  };

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
    
    setLoading(true);
    setError(null);
    setMode(targetMode);
    
    try {
      const result = await transformImage({
        base64ImageData: refImage?.base64 || '',
        mimeType: refImage?.mime || 'image/png',
        prompt: prompt,
        character: selectedChar,
        isSticker: targetMode === 'sticker',
        modelName: selectedModel
      });
      setResultUrl(result);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("403") || msg.includes("permission")) {
        setError("Ошибка 403: Доступ запрещен. Для Free Tier попробуйте сменить модель в настройках на Gemini 3 Pro или проверьте биллинг.");
        setShowSettings(true);
      } else if (msg.includes("not found")) {
        setError(`Модель ${selectedModel} не поддерживается вашим API ключом.`);
      } else {
        setError(msg || "Сбой системы.");
      }
    } finally {
      setLoading(false);
    }
  };

  const characters: Character[] = ['ЛЫСЫЙ', 'ДУМЧИК', 'БОССИК', 'ДЕНЧИК', 'НЕО'];

  return (
    <div className="w-full max-w-6xl space-y-10 animate-in fade-in slide-in-from-top-4 duration-700 relative">
      {/* Booting Overlay */}
      {systemBooting && (
        <div className="fixed inset-0 z-[100] bg-[#0c0a09] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-white font-black uppercase tracking-[0.3em] text-xs italic">System Booting</p>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">Warming up AI modules...</p>
          </div>
        </div>
      )}

      {/* Settings Toggle */}
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="absolute -top-12 right-0 p-3 glass rounded-2xl text-white/50 hover:text-purple-400 transition-all z-50 hover:scale-110 active:scale-95 shadow-xl"
      >
        <svg className={`w-6 h-6 ${showSettings ? 'rotate-90' : ''} transition-transform duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-md rounded-[3rem] p-8 space-y-8 shadow-2xl border border-white/10 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-white/20 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" /></svg>
            </button>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Настройки Шайки</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-transparent rounded-full"></div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-purple-300 uppercase tracking-widest text-[10px] font-black px-1">Движок генерации</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all appearance-none cursor-pointer font-bold"
                >
                  <optgroup label="Google Gemini" className="bg-[#1a1a1a]">
                    <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                    <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (New)</option>
                    <option value="imagen-3">Imagen 3 (Standard)</option>
                  </optgroup>
                  <optgroup label="External (Experimental)" className="bg-[#1a1a1a]">
                    <option value="black-forest-labs/flux.2-klein-4b">Flux 2 Klein 4B</option>
                  </optgroup>
                </select>
                <p className="text-[9px] text-white/30 px-1 leading-relaxed">
                  * Выбранная модель будет предзагружена при закрытии настроек.
                </p>
              </div>

              <div className="space-y-3 text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <p className="font-bold text-purple-300 uppercase tracking-widest text-[10px]">Важное для бесплатных аккаунтов:</p>
                <p className="text-[11px] opacity-80 leading-tight">
                  Модели генерации изображений часто требуют привязки карты в Google Cloud для активации API.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSelectKey}
                  className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg text-xs"
                >
                  {hasKey ? 'Сменить / Выбрать Ключ' : 'Активировать Систему'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="glass rounded-[2.5rem] p-6 md:p-8 space-y-8 shadow-2xl border border-white/5">
            <div className="space-y-4">
              <label className="text-purple-300/60 text-[10px] font-black uppercase tracking-widest px-1">
                {refImage ? 'Ублюдок в системе' : '1. Загрузи ублюдка'}
              </label>
              <ImageUploader onImageSelected={onImageSelected} previewUrl={previewUrl} />
            </div>

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

            <div className="space-y-4">
              <label className="text-purple-300/60 text-[10px] font-black uppercase tracking-widest px-1">План экзекуции</label>
              <PromptInput prompt={prompt} onChange={setPrompt} disabled={loading} />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider animate-in slide-in-from-left-2 duration-300">
                <p>⚠️ {error}</p>
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
