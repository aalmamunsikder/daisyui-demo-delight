import { useState } from "react";
import { SUGGESTIONS, askPrive, type PriveAnswer } from "@/lib/prive/askPrive";
import { usePrive, type Persona } from "@/lib/prive/store";
import { Button, ConfidenceTag, Pill } from "./ui";

interface Turn {
  q: string;
  a: PriveAnswer;
}

export function AskPriveConsole({ persona, compact = false }: { persona: Persona; compact?: boolean }) {
  const { derived } = usePrive();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setTurns((t) => [...t, { q, a: askPrive(q, persona, derived) }]);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex-1 space-y-4 overflow-y-auto ${compact ? "" : "pr-1"}`}>
        {turns.length === 0 ? (
          <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.04] p-4">
            <p className="text-sm text-[#101828]/70">
              Ask Privé answers across the systems you're authorized to see. Every response returns evidence,
              a forecast where relevant, a recommendation and its source systems.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS[persona].map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-[#7C3AED]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#7C3AED] hover:bg-[#7C3AED]/8"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#101828] px-4 py-2 text-sm text-white">
              {t.q}
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-[#7C3AED]/20 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-[#7C3AED] text-[11px] font-bold text-white">P</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Privé</span>
                {t.a.confidence ? <ConfidenceTag level={t.a.confidence} /> : null}
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#101828]">{t.a.answer}</p>

              {t.a.evidence?.length ? (
                <div className="mt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#101828]/45">Evidence</div>
                  <ul className="mt-1 space-y-1">
                    {t.a.evidence.map((e) => (
                      <li key={e} className="flex gap-2 text-sm text-[#101828]/75">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#5146E5]" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {t.a.forecast ? (
                <div className="mt-3 rounded-lg bg-[#0F9D8A]/8 px-3 py-2 text-sm text-[#0B7A6C]">
                  <span className="font-semibold">Forecast · </span>
                  {t.a.forecast}
                </div>
              ) : null}

              {t.a.recommendation ? (
                <div className="mt-2 rounded-lg bg-[#5146E5]/8 px-3 py-2 text-sm text-[#3f36bd]">
                  <span className="font-semibold">Recommendation · </span>
                  {t.a.recommendation}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#101828]/8 pt-3">
                <span className="text-[11px] uppercase tracking-wider text-[#101828]/40">Sources</span>
                {t.a.sources.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Privé…"
          className="w-full rounded-lg border border-[#101828]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
        />
        <Button type="submit" variant="violet">
          Ask
        </Button>
      </form>
      <p className="mt-2 text-[11px] text-[#101828]/40">
        Privé does not execute consequential actions without human approval.
      </p>
    </div>
  );
}

export function AskPriveDrawer({ persona }: { persona: Persona }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7C3AED]/25 hover:bg-[#6d28d9]"
      >
        <span className="grid h-5 w-5 place-items-center rounded bg-white/20 text-[11px] font-bold">P</span>
        Ask Privé
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#101828]/40" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-[#F7F6F2] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#101828]">Ask Privé</div>
                <div className="text-xs text-[#101828]/50 capitalize">{persona} context · role-scoped data</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-[#101828]/50 hover:bg-[#101828]/6">
                Close
              </button>
            </div>
            <AskPriveConsole persona={persona} compact />
          </div>
        </div>
      ) : null}
    </>
  );
}
