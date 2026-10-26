import React from 'react';

type BadgeVariant =
  | 'success' // Aktif, Aman, PAID
  | 'warning' // Menipis, PARTIALLY_PAID
  | 'danger'  // Habis, Ditangguhkan, UNPAID
  | 'info'    // Pending, Transfer, etc.
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/80',
    warning: 'bg-amber-100/90 text-amber-950 border border-amber-300/80',
    danger: 'bg-rose-100/90 text-rose-950 border border-rose-300/80',
    info: 'bg-purple-100/90 text-purple-950 border border-purple-300/80',
    neutral: 'bg-stone-100 text-stone-800 border border-stone-300',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-tight',
    md: 'text-[12px] px-2.5 py-0.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'md' }) => {
  let variant: BadgeVariant = 'neutral';
  let label = status;

  switch (status) {
    case 'Aktif':
      variant = 'success';
      break;
    case 'Pending':
      variant = 'warning';
      break;
    case 'Ditangguhkan':
      variant = 'danger';
      break;
    case 'Aman':
      variant = 'success';
      break;
    case 'Menipis':
      variant = 'warning';
      break;
    case 'Habis':
      variant = 'danger';
      break;
    case 'PAID':
    case 'Lunas':
      variant = 'success';
      label = 'Lunas';
      break;
    case 'PARTIALLY_PAID':
    case 'Sebagian Dibayar':
      variant = 'warning';
      label = 'Sebagian Dibayar';
      break;
    case 'UNPAID':
    case 'Belum Dibayar':
      variant = 'danger';
      label = 'Belum Dibayar';
      break;
    default:
      variant = 'neutral';
  }

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};
