import {
  cloneElement,
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactElement,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

const emptySubscribe = () => () => {};

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
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const Trigger = focusable ? "button" : "span";
  const label = text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const bubbleEl = bubbleRef.current;
      const bubbleWidth = bubbleEl ? bubbleEl.offsetWidth : 160;
      const bubbleHeight = bubbleEl ? bubbleEl.offsetHeight : 36;
      const margin = 8;

      // Prefer displaying below trigger; if it overflows viewport bottom, place above
      let top = rect.bottom + margin;
      if (top + bubbleHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - bubbleHeight - margin);
      }

      // Center horizontally on trigger, clamped within viewport bounds
      const triggerCenterX = rect.left + rect.width / 2;
      let left = triggerCenterX - bubbleWidth / 2;
      if (left < margin) {
        left = margin;
      } else if (left + bubbleWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - bubbleWidth - margin);
      }

      setCoords({ top, left });
    }

    updatePosition();
    // In case bubbleEl was not rendered on the first sync tick, update after paint frame
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <Trigger
      ref={(node: HTMLElement | null) => {
        triggerRef.current = node;
      }}
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
      {open &&
        mounted &&
        createPortal(
          <span
            ref={bubbleRef}
            id={id}
            role="tooltip"
            className={styles.bubble}
            style={
              {
                "--tooltip-top": `${coords.top}px`,
                "--tooltip-left": `${coords.left}px`,
              } as CSSProperties
            }
          >
            {label}
          </span>,
          document.body,
        )}
    </Trigger>
  );
}
