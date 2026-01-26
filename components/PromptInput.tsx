import React from 'react';

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onChange, disabled }) => {
  return (
    <div className="relative group">
      <textarea
        className="w-full p-5 bg-white/5 border border-white/10 rounded-3xl text-white placeholder-white/20 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 outline-none transition-all resize-none min-h-[120px] backdrop-blur-xl text-sm font-medium"
        placeholder="Куда его отправим? Что добавим? (например: 'В космос', 'В тюрьму', 'Сделай его в стиле аниме')"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <div className="absolute bottom-4 right-4 text-purple-400/20 text-[8px] font-black uppercase tracking-widest pointer-events-none group-hover:text-purple-400/40 transition-colors">
        Gang System v3.0
      </div>
    </div>
  );
};

export default PromptInput;