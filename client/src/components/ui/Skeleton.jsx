export function Skeleton({ className = '', width, height, circle = false }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || 20,
        borderRadius: circle ? '50%' : undefined,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton circle width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={12} />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="60%" />
      <div className="flex gap-2 pt-2">
        <Skeleton height={28} width={80} />
        <Skeleton height={28} width={80} />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="card p-6 text-center space-y-4">
      <Skeleton circle width={96} height={96} className="mx-auto" />
      <div className="space-y-2">
        <Skeleton height={20} width="70%" className="mx-auto" />
        <Skeleton height={14} width="50%" className="mx-auto" />
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <Skeleton height={22} width={80} />
        <Skeleton height={22} width={100} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={14} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: 'var(--color-brand-500)',
            animation: 'spin-slow 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state animate-fade-in">
      {Icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Icon size={28} color="var(--color-text-muted)" />
        </div>
      )}
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 16 }}>{title}</p>
      {description && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, maxWidth: 400 }}>{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
