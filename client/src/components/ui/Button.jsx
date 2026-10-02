import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  as: Component,
  to,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    gold: 'btn-gold',
    outline: 'btn-outline',
  };

  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
  };

  const buttonClasses = cn('btn', variants[variant], sizes[size], className);

  if (to || Component === Link) {
    return (
      <Link
        to={to || '#'}
        className={buttonClasses}
        {...props}
      >
        {children}
      </Link>
    );
  }

  if (Component) {
    const CustomComponent = Component;
    return (
      <CustomComponent
        className={buttonClasses}
        {...props}
      >
        {children}
      </CustomComponent>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner" style={{ width: 16, height: 16 }} />
      )}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = { sm: 14, md: 18, lg: 22 };

  return (
    <button
      className={cn(
        'btn rounded-full flex-shrink-0',
        `btn-${variant}`,
        sizes[size],
        className
      )}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
}
