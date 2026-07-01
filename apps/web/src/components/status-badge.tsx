interface Props { name: string; color?: string | null; }
export function StatusBadge({ name, color }: Props) {
  const bg = color ?? "#475569";
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: bg }}
    >
      {name}
    </span>
  );
}
