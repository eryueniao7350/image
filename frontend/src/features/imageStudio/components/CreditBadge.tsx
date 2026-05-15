interface CreditBadgeProps {
  credits?: number;
  loading?: boolean;
}

export function CreditBadge({ credits, loading = false }: CreditBadgeProps) {
  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background: "rgba(248, 250, 252, 0.9)",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 700,
  } as const;

  const dotStyle = {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: loading ? "#94a3b8" : (credits ?? 0) > 0 ? "#22c55e" : "#f97316",
    boxShadow: "0 0 0 4px rgba(15, 23, 42, 0.04)",
  } as const;

  return (
    <div aria-live="polite" style={badgeStyle}>
      <span aria-hidden="true" style={dotStyle} />
      <span>{loading ? "Loading credits..." : `${credits ?? 0} credits remaining`}</span>
    </div>
  );
}
