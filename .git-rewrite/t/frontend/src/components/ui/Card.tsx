import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const baseStyles = 'rounded-lg shadow-card';

  const variants = {
    default: 'bg-card-texture border border-cream/30',
    glass: 'bg-white/10 backdrop-blur-md border border-cream/30',
  };

  return (
    <div className={clsx(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('p-4 border-b border-cream/30', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-lg font-semibold text-cream', className)} {...props}>
      {children}
    </h3>
  );
}
