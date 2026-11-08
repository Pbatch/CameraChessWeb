import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoRef } from "../types";

// How long the controls stay after the pointer stops while playing, in ms, as on YouTube
const HIDE_AFTER = 2500;

// Whether a key press is meant for an element on the page rather than the video: anything in an open dialog (the help
// panel), anything typed into (the seek bar's arrows already seek), and Space on a button or link, which presses it
const keyForElement = (e: KeyboardEvent): boolean => {
  if (document.querySelector("dialog[open]") !== null) return true;
  const target = e.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  return (e.key === " ") && ["BUTTON", "A"].includes(target.tagName);
};

// What YouTube-style controls over a video share. They show while paused, and while playing until the pointer has
// been still a while; `held` keeps them showing too, e.g. while the seek bar is hovered. Clicking the video, Space and
// K toggle playing (a tap on a touch screen shows hidden controls first), and `onKey` can take other keys, returning
// whether it did. `onVisible` says when they show, so the corner markers can move clear of them.
export const useOverlayControls = ({ videoRef, playing, togglePlay, onVisible, held = false, onKey }: {
  videoRef: VideoRef,
  playing: boolean,
  togglePlay: () => void,
  onVisible: (visible: boolean) => void,
  held?: boolean,
  onKey?: (e: KeyboardEvent) => boolean
}) => {
  const [active, setActive] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);
  const barRef = useRef<HTMLDivElement>(null);

  const visible = !playing || active || held;
  useEffect(() => onVisible(visible), [visible, onVisible]);

  // Shows the controls, and hides them again after a while if the pointer stays still
  const poke = useCallback(() => {
    setActive(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(false), HIDE_AFTER);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Any use of the controls keeps them showing
  useEffect(() => {
    const bar = barRef.current;
    if (bar === null) return;
    const events = ["pointermove", "pointerdown", "focusin"];
    for (const event of events) bar.addEventListener(event, poke);
    return () => {
      for (const event of events) bar.removeEventListener(event, poke);
    };
  }, [poke]);

  const toggle = useCallback(() => {
    togglePlay();
    poke();
  }, [poke, togglePlay]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || keyForElement(e)) return;
      if (e.key === " " || e.key === "k") {
        toggle();
      } else if (onKey?.(e)) {
        poke();
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKey, poke, toggle]);

  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !visible) {
        poke();
      } else {
        toggle();
      }
    };
    video.addEventListener("pointerup", onPointerUp);
    video.addEventListener("pointermove", poke);
    return () => {
      video.removeEventListener("pointerup", onPointerUp);
      video.removeEventListener("pointermove", poke);
    };
  }, [poke, toggle, videoRef, visible]);

  return { barRef, visible, poke, toggle };
};
