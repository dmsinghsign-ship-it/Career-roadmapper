"use client";

import { useEffect, useRef, useState } from "react";
import RoadmapGraph from "./RoadmapGraph";

type Message = {
  id: number;
  role: "user" | "assistant";
  text?: string;
  result?: string;
  error?: string;
  loading?: boolean;
};

const EXAMPLES = [
  "Full Stack Developer at a climate tech startup",
  "Machine Learning Engineer at a fintech company",
  "Cybersecurity Analyst at a bank",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function patch(id: number, changes: Partial<Message>) {
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, ...changes } : m))
    );
  }

  async function send(textArg?: string) {
    const job = (textArg ?? input).trim();
    if (!job || busy) return;

    setInput("");
    const userId = nextId.current++;
    const botId = nextId.current++;
    setMessages((all) => [
      ...all,
      { id: userId, role: "user", text: job },
      { id: botId, role: "assistant", loading: true },
    ]);
    setBusy(true);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (!res.ok) {
        patch(botId, {
          loading: false,
          error: data.error || "Something went wrong.",
        });
      } else {
        patch(botId, {
          loading: false,
          text: `Here is your roadmap for "${job}". Tap any box for advice.`,
          result: JSON.stringify(data),
        });
      }
    } catch {
      patch(botId, {
        loading: false,
        error: "Network problem. Please check your connection and retry.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#212121] text-gray-100">
      <header className="border-b border-white/10 px-4 py-3 text-center text-lg font-semibold">
        Career Roadmapper
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          {messages.length === 0 && (
            <div className="mt-16 text-center">
              <h1 className="text-3xl font-semibold">
                Where do you want your career to go?
              </h1>
              <p className="mt-2 text-gray-400">
                Type a very specific dream job and explore your roadmap.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => send(ex)}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="mb-6 flex justify-end">
                <div className="max-w-[80%] rounded-3xl bg-[#303030] px-5 py-3">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="mb-8 flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold">
                  AI
                </div>
                <div className="min-w-0 flex-1">
                  {m.loading && (
                    <p className="animate-pulse text-gray-400">
                      Building your roadmap... this can take up to 30 seconds.
                    </p>
                  )}
                  {m.error && (
                    <p role="alert" className="text-red-400">
                      {m.error}
                    </p>
                  )}
                  {m.text && <p>{m.text}</p>}
                  {m.result && <RoadmapGraph key={m.id} json={m.result} />}
                </div>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-full bg-[#303030] px-4 py-2">
          <input
            aria-label="Your dream job"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Type a very specific dream job..."
            className="flex-1 bg-transparent py-2 text-gray-100 outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Generate roadmap"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-black disabled:opacity-40"
          >
            ↑
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">
          Roadmaps are AI-generated. Please verify details before acting on them.
        </p>
      </div>
    </div>
  );
}