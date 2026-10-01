import { cloneElement, useId, useState, type ReactElement } from "react";
import styles from "./Tooltip.module.css";

export function Tooltip({
  text,
  children,
  focusable = false,
}: {
  text: string;
  children: ReactElement<{ "aria-describedby"?: string | undefined }>;
  focusable?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const Trigger = focusable ? "button" : "span";
  return (
    <Trigger
      className={styles.trigger}
      data-tooltip-trigger
      type={focusable ? "button" : undefined}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setOpen(true);
      }}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      {focusable
        ? children
        : cloneElement(children, {
            "aria-describedby":
              [children.props["aria-describedby"], open ? id : undefined]
                .filter(Boolean)
                .join(" ") || undefined,
          })}
      {open && (
        <span id={id} role="tooltip" className={styles.bubble}>
          {text}
        </span>
      )}
    </Trigger>
  );
}
