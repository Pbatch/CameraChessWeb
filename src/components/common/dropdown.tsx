import { useId, useRef } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, ToggleEvent } from "react";
import type { LucideIcon } from "lucide-react";
import buttonClass from "./buttonClass";
import Icon from "./icon";

// Between the button and the menu, and kept clear of the viewport's edges, in px
const GAP = 2;
const MARGIN = 8;
// With less room than this below the button, the menu opens upwards if there's more room there
const MIN_ROOM_BELOW = 160;

const ITEM = '[role="menuitem"]';

// A full-width button that opens a menu. The menu is a popover, so the browser closes it on Escape
// or a click outside and hands focus back to the button.
const Dropdown = ({ icon, label, title = label, disabled = false, onClick, children }: {
  icon?: LucideIcon,
  label: string,
  title?: string,
  disabled?: boolean,
  onClick?: () => void,
  children: ReactNode
}) => {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Before the menu shows, so it never paints in the wrong place. It scrolls when there isn't room.
  const onBeforeToggle = (e: ToggleEvent<HTMLDivElement>) => {
    const button = buttonRef.current;
    if (e.newState !== "open" || button === null) {
      return;
    }
    const rect = button.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const roomAbove = rect.top - GAP - MARGIN;
    const below = (roomBelow >= MIN_ROOM_BELOW) || (roomBelow >= roomAbove);
    Object.assign(e.currentTarget.style, {
      left: `${rect.left}px`,
      right: "auto",
      top: below ? `${rect.bottom + GAP}px` : "auto",
      bottom: below ? "auto" : `${window.innerHeight - rect.top + GAP}px`,
      minWidth: `${rect.width}px`,
      maxWidth: `${window.innerWidth - rect.left - MARGIN}px`,
      maxHeight: `${below ? roomBelow : roomAbove}px`
    });
  };

  // Focus-visible only follows when the menu was opened from the keyboard
  const onToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.newState === "open") {
      e.currentTarget.querySelector<HTMLElement>(ITEM)?.focus();
    }
  };

  // Arrow keys, Home and End move between the items. Tab closes the menu, as focus leaves it.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.currentTarget.hidePopover();
      return;
    }
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>(ITEM)];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = ({ ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[e.key];
    if (next === undefined || items.length === 0) {
      return;
    }
    e.preventDefault();
    items[(next + items.length) % items.length].focus();
  };

  // After the item's own click handler
  const onMenuClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest(ITEM) !== null) {
      e.currentTarget.hidePopover();
    }
  };

  return (
    <div className="w-full">
      <button type="button" ref={buttonRef} popoverTarget={menuId} aria-haspopup="menu"
        className={`${buttonClass("outline-light", "sm")} flex w-full items-center justify-center`}
        title={title} disabled={disabled} onClick={onClick}>
        {(icon !== undefined) && <Icon icon={icon} className="me-2 shrink-0" />}
        <span className="truncate">{label}</span>
        {/* A caret, as on Bootstrap's dropdowns */}
        <span className="ms-1 shrink-0 border-x-[0.3em] border-t-[0.3em] border-x-transparent border-t-current"
          aria-hidden="true" />
      </button>
      <div id={menuId} popover="auto" role="menu" onBeforeToggle={onBeforeToggle} onToggle={onToggle}
        onKeyDown={onKeyDown} onClick={onMenuClick}
        className="m-0 overflow-y-auto rounded-md border border-white/15 bg-dark px-0 py-2 text-start text-[#dee2e6]">
        {children}
      </div>
    </div>
  );
};

export const DropdownItem = ({ onClick, children }: { onClick: () => void, children: ReactNode }) => {
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onClick}
      className="block w-full px-4 py-1 text-start hover:bg-[#2b3035] focus-visible:bg-[#2b3035] focus-visible:outline-none">
      {children}
    </button>
  );
};

// A line of text in the menu that can't be chosen, such as why it's empty
export const DropdownText = ({ children }: { children: ReactNode }) => {
  return <div className="px-4 py-1">{children}</div>;
};

export default Dropdown;
