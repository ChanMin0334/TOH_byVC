import React, { ReactNode } from 'react';
import { Loader2, User, Home, Plus, Trophy, Sword } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'blue';
  isLoading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  fullWidth = false,
  size = 'md',
  ...props 
}) => {
  const base = "rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const widthClass = fullWidth ? "w-full" : "";
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4 text-lg"
  };
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50",
    blue: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400"
  };

  return (
    <button className={`${base} ${sizeClasses[size]} ${variants[variant]} ${widthClass} ${className || ''}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: ReactNode; className?: string; title?: string }> = ({ children, className, title }) => (
  <div className={`bg-[#1e293b] rounded-2xl p-5 shadow-xl border border-slate-700/50 ${className || ''}`}>
    {title && <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">{title}</h3>}
    {children}
  </div>
);

// --- Avatar ---
export const Avatar: React.FC<{ src?: string; alt: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({ src, alt, size = 'md', className }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };
  
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 flex-shrink-0 ${className || ''}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
          {alt.slice(0, 2)}
        </div>
      )}
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: ReactNode; color?: string; className?: string }> = ({ children, color = "bg-slate-700", className }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white uppercase tracking-wider ${color} ${className || ''}`}>
    {children}
  </span>
);

// --- Input/Textarea ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input className="w-full bg-[#050b18] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500" {...props} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea className="w-full bg-[#050b18] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500 min-h-[120px]" {...props} />
);

// --- Layout Container ---
interface ContainerProps {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
  disableFrame?: boolean;
  contentClassName?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '', frameClassName = '', disableFrame = false, contentClassName = 'p-6' }) => {
  if (disableFrame) {
    return (
      <div className={`w-full max-w-[520px] mx-auto min-h-screen px-4 pb-28 pt-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] mx-auto px-4 pb-28 pt-0 min-h-screen">
      <div className={`bg-[#050b18] rounded-none shadow-[0_24px_60px_rgba(2,6,23,0.75)] overflow-hidden border border-slate-900/30 ${frameClassName}`}>
        <div className={`${contentClassName} ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Bottom Nav ---
export const BottomNav: React.FC<{ current: string; onChange: (page: string) => void; maxWidthClass?: string }> = ({ current, onChange, maxWidthClass = 'max-w-[520px]' }) => {
  const navItems = [
    { id: 'home', icon: Home, label: '홈' },
    // '생성' 메뉴 제거됨
    { id: 'ranking', icon: Trophy, label: '랭킹' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 pt-3 z-40">
      <div className={`w-full ${maxWidthClass} mx-auto`}>
        <div className="bg-[#050b18] border border-slate-900/30 shadow-[0_-12px_40px_rgba(2,6,23,0.6)] flex justify-around items-center px-6 py-3">
          {navItems.map(item => {
            const isActive = current === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500'}`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-blue-500/20' : ''}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Tabs ---
export const Tabs: React.FC<{ options: string[]; active: string; onChange: (opt: string) => void }> = ({ options, active, onChange }) => (
  <div className="flex bg-[#050b18] p-1 rounded-xl mb-4 border border-slate-700/60">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
          active === opt 
            ? 'bg-[#1e293b] text-white shadow-sm' 
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// --- ProgressBar ---
export const ProgressBar: React.FC<{ progress: number; color?: string; label?: string }> = ({ progress, color = "bg-blue-600", label }) => (
  <div className="w-full">
    {label && <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>{label}</span>
      <span>{Math.round(progress)}%</span>
    </div>}
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} 
      />
    </div>
  </div>
);