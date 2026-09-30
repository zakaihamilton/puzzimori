export function Emoji({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <span role="img" aria-label={label} className={className}>
      {value}
    </span>
  );
}
