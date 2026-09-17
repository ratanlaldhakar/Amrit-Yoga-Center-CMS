import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-orange-50 text-brand-700 border-orange-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return <Badge variant="success">Paid</Badge>;
    case 'OVERDUE':
      return <Badge variant="danger">Overdue</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>;
    case 'PARTIALLY PAID':
      return <Badge variant="info">Partially Paid</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getStudentStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge variant="success">Active</Badge>;
    case 'Trial':
      return <Badge variant="info">Trial</Badge>;
    case 'On Hold':
      return <Badge variant="warning">On Hold</Badge>;
    case 'Inactive':
      return <Badge variant="neutral">Inactive</Badge>;
    case 'Left':
      return <Badge variant="danger">Left</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
