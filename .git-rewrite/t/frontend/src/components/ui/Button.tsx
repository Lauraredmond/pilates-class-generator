import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-lg transition-smooth shadow-button disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-energy-gradient text-cream hover:opacity-90',
      secondary: 'bg-burgundy-dark text-cream border border-cream/30 hover:opacity-90',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-cream hover:bg-cream/10',
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-14 px-6 text-lg',
      lg: 'h-16 px-8 text-xl',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
