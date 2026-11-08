import { useCallback, useEffect, useRef } from "react";
import type { SyntheticEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import Icon from "../common/icon";
import { FaqList } from "./faq";
import Toast from "../common/toast";

// Whether the FAQ is open, kept in the history entry so the back gesture closes it rather than leaving the page (and a
// game on it). Opened from the menu, it's a new entry on the same page; opened by the /faq link, it replaces that
// entry (see index.tsx), as there's nothing of the app's to go back to.
export const HELP_STATE = { help: true } as const;
export const LINKED_HELP_STATE = { help: true, linked: true } as const;
const helpState = (state: unknown): { linked: boolean } | null =>
  ((typeof state === "object") && (state !== null) && ("help" in state)) ? { linked: "linked" in state } : null;
export const useHelpOpen = (): boolean => helpState(useLocation().state) !== null;

// The FAQ over any page, so reading it leaves the game, the camera and a loaded video as they are. It's opened by
// navigating to the same page with HELP_STATE, and closes by going back (✕, Escape, a tap outside or the back gesture).
const FaqPanel = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const open: boolean = useHelpOpen();
  const linked: boolean = helpState(location.state)?.linked ?? false;
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus starts on the title rather than the first button (✕), which Chrome would ring even after a tap.
      // Screen readers then announce the FAQ, and Tab goes on to the ✕ and the questions.
      titleRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Back to the page underneath, or after the /faq link, the same page without the FAQ, rather than leaving the site
  const close = useCallback(() => {
    void (linked ? navigate(location.pathname, { replace: true }) : navigate(-1));
  }, [linked, location.pathname, navigate]);

  // A tap on the backdrop, which counts as the dialog itself. (Escape is the keyboard's way out.)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, [close]);

  // Escape: closed by going back, so the history entry goes too
  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    close();
  };

  return (
    <dialog ref={dialogRef} className="faq-panel" aria-labelledby="faq-panel-title" onCancel={onCancel}>
      <div className="faq-panel__header">
        {/* Focusable from code only (not a Tab stop), with no ring, as it's only where focus starts */}
        <h2 id="faq-panel-title" ref={titleRef} tabIndex={-1} className="text-lg font-medium outline-none">
          {t("faq.title")}
        </h2>
        <button type="button" className="app-header__button" onClick={close} aria-label={t("common.close")}
          title={t("common.close")}>
          <Icon icon={X} className="text-xl" />
        </button>
      </div>
      {/* Built only while open, rather than a hidden copy of the whole FAQ on every page */}
      <div className="faq-panel__body">
        {open && <FaqList />}
      </div>
      {/* Errors (e.g. a broadcast that can't update) still show while the FAQ is open */}
      {open && <Toast />}
    </dialog>
  );
};

export default FaqPanel;
