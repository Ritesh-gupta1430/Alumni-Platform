import { getInitials } from '../../lib/utils';

export function Avatar({ src, firstName, lastName, size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`avatar ${sizeClasses[size]} ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling?.removeAttribute('style');
        }}
      />
    );
  }

  return (
    <div
      className={`avatar-placeholder ${sizeClasses[size]} ${className}`}
      aria-label={`${firstName} ${lastName} avatar`}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div key={user._id || i} className={`-ml-2 first:ml-0 ring-2 ring-[var(--color-surface-0)] rounded-full`}>
          <Avatar
            src={user.profilePhoto}
            firstName={user.firstName}
            lastName={user.lastName}
            size={size}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`-ml-2 w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)] ring-2 ring-[var(--color-surface-0)]`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
