import React from 'react';

export const StitchDivider: React.FC<{
  vertical?: boolean;
  className?: string;
  color?: 'emerald' | 'violet' | 'muted';
}> = ({ vertical = false, className = '', color = 'muted' }) => {
  const colorMap = {
    emerald: 'border-[#047857]/40',
    violet: 'border-[#6D28D9]/40',
    muted: 'border-[#4B6359]/25',
  };

  if (vertical) {
    return (
      <div
        className={`w-0 border-r border-dashed ${colorMap[color]} shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`w-full border-t border-dashed ${colorMap[color]} my-3 shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
};
