"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatgptStoryMessage } from "@/types/design-system-chatgpt";

const WHITESPACE_PATTERN = /(\s+)/;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useChatgptPlayback(
  script: readonly ChatgptStoryMessage[],
  reducedMotion: boolean
) {
  const [messages, setMessages] = useState<ChatgptStoryMessage[]>(() => [
    ...script,
  ]);
  const [completeIds, setCompleteIds] = useState(
    () => new Set(script.map((item) => item.id))
  );
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const runRef = useRef(0);
  const sendingRef = useRef(false);

  const resetToScript = useCallback(() => {
    setMessages([...script]);
    setCompleteIds(new Set(script.map((item) => item.id)));
    setThinking(false);
    setPlaying(false);
  }, [script]);

  const stop = useCallback(() => {
    runRef.current += 1;
    sendingRef.current = false;
    resetToScript();
  }, [resetToScript]);

  const playTurn = useCallback(
    async (
      message: ChatgptStoryMessage,
      alive: () => boolean
    ): Promise<void> => {
      const delay = (ms: number) => wait(reducedMotion ? Math.min(ms, 70) : ms);

      if (message.from === "user") {
        setMessages((current) => [...current, message]);
        setCompleteIds((current) => new Set(current).add(message.id));
        await delay(420);
        return;
      }

      setThinking(true);
      await delay(message.reasoning ? 1600 : 1100);
      if (!alive()) {
        return;
      }
      setThinking(false);

      if (reducedMotion) {
        setMessages((current) => [...current, message]);
        setCompleteIds((current) => new Set(current).add(message.id));
        await delay(180);
        return;
      }

      setMessages((current) => [...current, { ...message, text: "" }]);
      const tokens = message.text.split(WHITESPACE_PATTERN);
      let text = "";
      for (const token of tokens) {
        if (!alive()) {
          return;
        }
        text += token;
        const snapshot = text;
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id ? { ...item, text: snapshot } : item
          )
        );
        await delay(28);
      }
      setCompleteIds((current) => new Set(current).add(message.id));
      await delay(480);
    },
    [reducedMotion]
  );

  const play = useCallback(async () => {
    const run = runRef.current + 1;
    runRef.current = run;
    const alive = () => runRef.current === run;

    setPlaying(true);
    setThinking(false);
    setMessages([]);
    setCompleteIds(new Set());

    for (const message of script) {
      if (!alive()) {
        return;
      }
      // react-doctor-disable-next-line react-doctor/async-await-in-loop
      await playTurn(message, alive);
    }

    if (alive()) {
      setPlaying(false);
    }
  }, [playTurn, script]);

  const send = useCallback(
    async (text: string, reply: string) => {
      if (sendingRef.current) {
        return;
      }
      sendingRef.current = true;
      const run = runRef.current + 1;
      runRef.current = run;
      const alive = () => runRef.current === run;
      const now = Date.now();
      const userMessage: ChatgptStoryMessage = {
        id: `user-${now}`,
        from: "user",
        text,
      };
      const assistantMessage: ChatgptStoryMessage = {
        id: `assistant-${now}`,
        from: "assistant",
        text: reply,
      };

      const playExchange = async () => {
        setPlaying(true);
        await playTurn(userMessage, alive);
        if (!alive()) {
          return;
        }
        await playTurn(assistantMessage, alive);
        if (alive()) {
          setPlaying(false);
        }
      };

      // `.finally` instead of try/finally: React Compiler bails out of the
      // whole hook on try/finally syntax.
      await playExchange().finally(() => {
        sendingRef.current = false;
      });
    },
    [playTurn]
  );

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    []
  );

  return {
    messages,
    completeIds,
    thinking,
    playing,
    play,
    stop,
    send,
  };
}
