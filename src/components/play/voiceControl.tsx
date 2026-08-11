import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Color } from "chessops/types";
import { makeUci } from "chessops/util";
import { Game, SetStringArray, VoiceLanguage } from "../../types";
import { gameUpdate, makeBoard, makeUpdatePayload, useGame } from "../../slices/gameSlice";
import { resolveVoiceMove } from "../../utils/voice";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

type SpeechRecognitionErrorLike = Event & { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
};

const VoiceControl = ({ active, color, language, setText }: {
  active: boolean;
  color?: Color;
  language: VoiceLanguage;
  setText: SetStringArray;
}) => {
  const game: Game = useGame();
  const gameRef = useRef(game);
  const lastCommandRef = useRef({ transcript: "", time: 0 });
  const dispatch = useDispatch();
  const [listening, setListening] = useState(false);
  const supported = getSpeechRecognition() !== undefined;
  const english = language === "en-US";

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!active || !Recognition || color === undefined) {
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    let stopped = false;
    let mayRestart = true;
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (!result.isFinal) continue;
        const transcript = result[0].transcript.trim();
        const now = Date.now();
        if (transcript === lastCommandRef.current.transcript && now - lastCommandRef.current.time < 1500) continue;
        lastCommandRef.current = { transcript, time: now };

        const board = makeBoard(gameRef.current);
        if (board.turn !== color) {
          setText([`${english ? "Voice" : "Voz"}: “${transcript}”`, english ? "It is the opponent's turn" : "Es el turno del rival"]);
          continue;
        }

        const resolution = resolveVoiceMove(board, transcript, language);
        if (!resolution.move) {
          setText([`${english ? "Voice" : "Voz"}: “${transcript}”`, resolution.message]);
          continue;
        }

        const played = board.playUci(makeUci(resolution.move));
        if (!played) {
          setText([`${english ? "Voice" : "Voz"}: “${transcript}”`, english ? "The move could not be applied" : "No se pudo aplicar la jugada"]);
          continue;
        }
        dispatch(gameUpdate(makeUpdatePayload(board)));
        setText([`${english ? "Voice" : "Voz"}: “${transcript}”`, `${english ? "Move" : "Jugada"}: ${resolution.message}`]);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        mayRestart = false;
        setText(english
          ? ["The microphone could not be used", "Allow microphone access in the browser"]
          : ["No se pudo usar el micrófono", "Permite el acceso al micrófono en el navegador"]);
      } else {
        setText([english ? "Voice recognition error" : "Error de reconocimiento de voz", event.error]);
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (!stopped && mayRestart) {
        window.setTimeout(() => {
          if (stopped) return;
          try {
            recognition.start();
            setListening(true);
          } catch (_) {
            // The browser can still be transitioning from the previous session.
          }
        }, 250);
      }
    };

    try {
      recognition.start();
      setListening(true);
      setText(english
        ? ["Voice mode active", "Say for example: “bishop C3” or “C4 to C5”"]
        : ["Modo voz activo", "Di por ejemplo: “alfil C3” o “C4 a C5”"]);
    } catch (_) {
      setText([english ? "Voice recognition could not be started" : "No se pudo iniciar el reconocimiento de voz"]);
    }

    return () => {
      stopped = true;
      recognition.onend = null;
      recognition.stop();
      setListening(false);
    };
  }, [active, color, dispatch, english, language, setText]);

  const status = !supported
    ? (english ? "This browser does not support voice recognition" : "El navegador no soporta reconocimiento de voz")
    : color === undefined
      ? (english ? "Select a game first" : "Selecciona una partida primero")
      : active && listening
        ? (english ? "Listening in English…" : "Escuchando en español…")
        : (english ? "Press ▶ to start listening" : "Pulsa ▶ para comenzar a escuchar");

  return (
    <li className={`alert ${active && listening ? "alert-success" : "alert-secondary"} py-2 px-3 my-2`} role="status">
      <strong>{english ? "Voice mode" : "Modo voz"}</strong><br />
      {status}
    </li>
  );
};

export default VoiceControl;
