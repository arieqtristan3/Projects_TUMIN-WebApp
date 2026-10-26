import React from 'react';

interface ChamferCardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  stitchedBorder?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const ChamferCard: React.FC<ChamferCardProps> = ({
  children,
  className = '',
  dark = false,
  stitchedBorder = true,
  size = 'md',
  onClick,
}) => {
  const clipClass = size === 'sm' ? 'chamfer-card-sm' : 'chamfer-card';

  return (
    <div
      onClick={onClick}
      className={`relative ${clipClass} transition-shadow ${
        dark
          ? 'bg-[#150F25]/90 text-white'
          : 'bg-white text-[#10241D] shadow-sm'
      } ${className}`}
    >
      {/* Stitched inner border decoration */}
      {stitchedBorder && (
        <div
          className={`pointer-events-none absolute inset-1.5 ${clipClass} border-dashed ${
            dark ? 'border-[#A78BFA]/30' : 'border-[#047857]/25'
          } border-[1.5px]`}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
