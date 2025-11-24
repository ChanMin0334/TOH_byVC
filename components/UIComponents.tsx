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
  const base = "rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110";
  const widthClass = fullWidth ? "w-full" : "";
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-6 py-4 text-lg"
  };
  
  const variants = {
    primary: "bg-gradient-to-r from-[#825bff] via-[#ec4899] to-[#f97316] text-white",
    blue: "bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] text-slate-900",
    secondary: "bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15",
    danger: "bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white",
    ghost: "bg-transparent hover:bg-white/10 text-slate-300"
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
  <div className={`bg-white/5 rounded-3xl p-6 border border-white/10 ${className || ''}`}>
    {title && <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">{title}</h3>}
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
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-white/10 border border-white/20 flex-shrink-0 ${className || ''}`}>
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
export const Badge: React.FC<{ children: ReactNode; color?: string; className?: string }> = ({ children, color = "bg-white/10", className }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white uppercase tracking-wider ${color} ${className || ''}`}>
    {children}
  </span>
);

// --- Input/Textarea ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 transition-colors placeholder-slate-400 ${className}`}
    {...props}
  />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40 transition-colors placeholder-slate-400 min-h-[120px] ${className}`}
    {...props}
  />
);

// --- Layout Container ---
export interface ContainerProps {
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
    <div className="bg-[#121212] w-full max-w-[520px] mx-auto px-4 pt-0 min-h-screen pt-4">
      <div className={`rounded-[32px] overflow-hidden ${frameClassName}`}>
        <div className={`${contentClassName} ${className}`}>
          {children}
          <div className="h-[200px]"></div>
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
        <div className="bg-[#050914]/95 border border-white/10 flex justify-around items-center px-6 py-3">
          {navItems.map(item => {
            const isActive = current === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-500'}`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-cyan-400/20' : ''}`}>
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

interface ScreenLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (page: string) => void;
  containerProps?: Partial<ContainerProps>;
  bottomSlot?: ReactNode;
  className?: string;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  currentView,
  onNavigate,
  containerProps,
  bottomSlot,
  className = '',
}) => (
  <div className={`bg-gradient-to-b from-[#030712] via-[#060d1d] to-[#0b1224] min-h-screen text-slate-100 font-sans pb-20 ${className}`}>
    <Container {...containerProps}>{children}</Container>
    {bottomSlot}
    <BottomNav current={currentView} onChange={onNavigate} />
  </div>
);

// --- Tabs ---
export const Tabs: React.FC<{ options: string[]; active: string; onChange: (opt: string) => void }> = ({ options, active, onChange }) => (
  <div className="flex bg-white/5 p-1 rounded-2xl mb-4 border border-white/10">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
          active === opt 
            ? 'bg-gradient-to-r from-[#312e81] to-[#5b21b6] text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// --- ProgressBar ---
export const ProgressBar: React.FC<{ progress: number; color?: string; label?: string }> = ({ progress, color = "bg-gradient-to-r from-[#22d3ee] to-[#3b82f6]", label }) => (
  <div className="w-full">
    {label && <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>{label}</span>
      <span>{Math.round(progress)}%</span>
    </div>}
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} 
      />
    </div>
  </div>
);