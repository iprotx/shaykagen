import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, loading, disabled, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full py-4 px-8 rounded-2xl text-white font-bold text-lg overflow-hidden transition-all duration-300
        ${disabled || loading
          ? 'bg-white/10 text-white/20 cursor-not-allowed border border-white/5'
          : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        }
        flex items-center justify-center space-x-3
      `}
    >
      {loading && (
        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className="uppercase tracking-wider">{loading ? 'Создаем магию...' : children}</span>
    </button>
  );
};

export default ActionButton;