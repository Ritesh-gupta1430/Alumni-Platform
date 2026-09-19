import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({
  label,
  error,
  hint,
  required,
  className = '',
  containerClass = '',
  icon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  style = {},
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClass)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-[var(--color-accent-rose)] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {LeftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center z-10">
            <LeftIcon size={18} />
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            LeftIcon && 'has-left-icon !pl-11',
            RightIcon && 'has-right-icon !pr-11',
            error && 'input-error',
            className
          )}
          style={{
            ...(LeftIcon ? { paddingLeft: '42px' } : {}),
            ...(RightIcon ? { paddingRight: '42px' } : {}),
            ...style
          }}
          {...props}
        />
        {RightIcon && (
          <span
            onClick={onRightIconClick}
            className={cn(
              'absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] flex items-center justify-center z-10',
              onRightIconClick ? 'cursor-pointer hover:text-[var(--color-text-primary)] transition-colors' : 'pointer-events-none'
            )}
          >
            <RightIcon size={18} />
          </span>
        )}
      </div>
      {error && (
        <p className="text-[var(--color-error)] text-xs font-medium mt-0.5">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  required,
  className = '',
  containerClass = '',
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-[var(--color-accent-rose)] ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn('textarea', error && 'input-error', className)}
        {...props}
      />
      {error && (
        <p className="text-[var(--color-error)] text-xs font-medium mt-0.5">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  error,
  required,
  className = '',
  containerClass = '',
  children,
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-[var(--color-accent-rose)] ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn('input', error && 'input-error', className)}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-[var(--color-error)] text-xs font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
