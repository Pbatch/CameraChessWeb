import { useId, useRef } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode, ToggleEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import buttonClass from "./buttonClass";
import Icon from "./icon";

// Between the button and the menu, and kept clear of the viewport's edges, in px
const GAP = 2;
const MARGIN = 8;
// With less room than this below the button, the menu opens upwards if there's more room there
const MIN_ROOM_BELOW = 160;

// Plain items, and those that are checked on and off or pick one of several
const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

const SIDEBAR_BUTTON = `${buttonClass("outline-light", "sm")} flex w-full items-center justify-center`;

// A button that opens a menu: by default full width, as in the sidebar. The menu is a popover, so the browser
// closes it on Escape or a click outside and hands focus back to the button. It lines up with the button's start,
// or with its end for a button at the right of the screen.
const Dropdown = ({ icon, iconAfter = false, caret = true, label, title = label, disabled = false, onClick,
  align = "start", buttonClassName = SIDEBAR_BUTTON, className = "w-full", children }: {
  icon?: LucideIcon,
  // After the label rather than before it, as on Lichess's account button
  iconAfter?: boolean,
  caret?: boolean,
  label: string,
  title?: string,
  disabled?: boolean,
  onClick?: () => void,
  align?: "start" | "end",
  buttonClassName?: string,
  className?: string,
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
    const atEnd = (align === "end");
    Object.assign(e.currentTarget.style, {
      left: atEnd ? "auto" : `${rect.left}px`,
      right: atEnd ? `${window.innerWidth - rect.right}px` : "auto",
      top: below ? `${rect.bottom + GAP}px` : "auto",
      bottom: below ? "auto" : `${window.innerHeight - rect.top + GAP}px`,
      minWidth: `${rect.width}px`,
      maxWidth: `${(atEnd ? rect.right : window.innerWidth - rect.left) - MARGIN}px`,
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
    <div className={className}>
      <button type="button" ref={buttonRef} popoverTarget={menuId} aria-haspopup="menu"
        className={buttonClassName} title={title} disabled={disabled} onClick={onClick}>
        {(icon !== undefined) && !iconAfter && <Icon icon={icon} className="me-2 shrink-0" />}
        <span className="truncate">{label}</span>
        {(icon !== undefined) && iconAfter && <Icon icon={icon} className="ms-2 shrink-0" />}
        {/* A caret, as on Bootstrap's dropdowns */}
        {caret && <span className="ms-1 shrink-0 border-x-[0.3em] border-t-[0.3em] border-x-transparent border-t-current"
          aria-hidden="true" />}
      </button>
      <div id={menuId} popover="auto" role="menu" onBeforeToggle={onBeforeToggle} onToggle={onToggle}
        onKeyDown={onKeyDown} onClick={onMenuClick}
        className="m-0 overflow-y-auto rounded-md border border-white/15 bg-dark px-0 py-2 text-start text-[#dee2e6]">
        {children}
      </div>
    </div>
  );
};

const ITEM_CLASS = "flex w-full items-center gap-2 px-4 py-1 text-start hover:bg-[#2b3035] focus-visible:bg-[#2b3035] "
  + "focus-visible:outline-none";

// An icon at the start of an item or heading, sized to its text
const ItemIcon = ({ icon }: { icon?: LucideIcon }) =>
  (icon === undefined) ? null : <Icon icon={icon} className="shrink-0 text-base" />;

export const DropdownItem = ({ icon, onClick, disabled = false, children }: {
  icon?: LucideIcon, onClick: () => void, disabled?: boolean, children: ReactNode
}) => {
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onClick} disabled={disabled}
      className={`${ITEM_CLASS} disabled:pointer-events-none disabled:opacity-50`}>
      <ItemIcon icon={icon} />
      {children}
    </button>
  );
};

// An item that's on or off ("checkbox"), or one choice of several ("radio"). A choice shows a tick when chosen; a
// setting can instead show a switch, as phones do for on and off.
export const DropdownCheckItem = ({ icon, checked, onClick, kind = "checkbox", look = "tick", lang, children }: {
  icon?: LucideIcon,
  checked: boolean,
  onClick: () => void,
  kind?: "checkbox" | "radio",
  look?: "tick" | "switch",
  lang?: string,
  children: ReactNode
}) => {
  const content = (look === "switch") ? (<>
    <ItemIcon icon={icon} />
    {children}
    {/* Read out as checked or not by the item's role, so only drawn */}
    <span className="menu-switch ms-auto" aria-hidden="true" />
  </>) : (<>
    {/* Always takes its room, so the labels line up whether ticked or not */}
    <Icon icon={Check} className={`shrink-0 text-base${checked ? "" : " invisible"}`} />
    <ItemIcon icon={icon} />
    {children}
  </>);
  // Written out for each role, so the linter can see both support aria-checked
  return (kind === "radio")
    ? <button type="button" role="menuitemradio" aria-checked={checked} tabIndex={-1} onClick={onClick} lang={lang}
        className={ITEM_CLASS}>{content}</button>
    : <button type="button" role="menuitemcheckbox" aria-checked={checked} tabIndex={-1} onClick={onClick} lang={lang}
        className={ITEM_CLASS}>{content}</button>;
};

// A line of text in the menu that can't be chosen, such as why it's empty
export const DropdownText = ({ children }: { children: ReactNode }) => {
  return <div className="px-4 py-1">{children}</div>;
};

// A heading for a part of the menu, which can't be chosen
export const DropdownHeading = ({ icon, children }: { icon?: LucideIcon, children: ReactNode }) =>
  <div className="flex items-center gap-2 px-4 py-1 text-sm opacity-65"><ItemIcon icon={icon} />{children}</div>;

export const DropdownDivider = () => <hr className="my-2 border-white/15" />;

export default Dropdown;
