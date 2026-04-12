"use client";

import { useState, useCallback } from "react";

export function useStreaming() {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = useCallback(
    async (url: string, body: unknown): Promise<string> => {
      setText("");
      setIsStreaming(true);
      let fullText = "";

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorBody = await res.text();
          let msg = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(errorBody);
            msg = parsed.error || msg;
          } catch {
            // use status code
          }
          throw new Error(msg);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  fullText += parsed.text;
                  setText(fullText);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      } finally {
        setIsStreaming(false);
      }

      return fullText;
    },
    []
  );

  return { text, isStreaming, stream, setText };
}
