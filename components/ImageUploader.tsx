import React, { useState, useCallback, useRef } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, previewUrl }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        onImageSelected(base64, file.type);
      }
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div 
      className={`relative group overflow-hidden rounded-[2rem] border-2 transition-all duration-500 h-56 flex flex-col items-center justify-center p-4 cursor-pointer
        ${dragActive ? 'border-purple-400 bg-purple-500/20 scale-[0.98]' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}
        ${previewUrl ? 'border-purple-500/40 border-solid' : 'border-dashed'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      {previewUrl ? (
        <div className="relative w-full h-full">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-2xl">
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Другой ублюдок</span>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto border border-white/5 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-white/60 font-black text-[11px] uppercase tracking-widest">Загрузи ублюдка сюда</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;