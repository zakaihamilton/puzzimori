import { StoryIcon } from "./StoryIcon";

export function Emoji({
  value,
  label,
  className,
  size,
}: {
  value: string;
  label: string;
  className?: string;
  size?: number | string;
}) {
  return (
    <span role="img" aria-label={label} className={className}>
      <StoryIcon value={value} size={size} />
    </span>
  );
}
