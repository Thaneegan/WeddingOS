export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#eee7dd]">
      <div className="h-full rounded-full bg-[#c8a97e]" style={{ width: `${width}%` }} />
    </div>
  );
}
