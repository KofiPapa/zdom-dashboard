const variants = {
  online: "bg-green-100 text-green-700",
  offline: "bg-slate-100 text-slate-600",
  error: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-orange-100 text-primary-dark",
};

interface BadgeProps {
  variant: keyof typeof variants;
  children: React.ReactNode;
  dot?: boolean;
}

export default function Badge({ variant, children, dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "online"
              ? "bg-green-500"
              : variant === "offline"
                ? "bg-slate-400"
                : variant === "error"
                  ? "bg-red-500"
                  : variant === "warning"
                    ? "bg-amber-500"
                    : "bg-orange-500"
          }`}
        />
      )}
      {children}
    </span>
  );
}
