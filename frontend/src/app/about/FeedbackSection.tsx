"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FadeUp } from "@/components/ui/motion";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

const TYPES = [
  {
    key: "bug",
    label: "Bug Report",
    hint: "Something isn't working right",
  },
  {
    key: "feature",
    label: "Feature Request",
    hint: "I'd love to see...",
  },
  {
    key: "suggestion",
    label: "Suggestion",
    hint: "Have you thought about...",
  },
  {
    key: "kind_words",
    label: "Kind Words",
    hint: "Just wanted to say...",
  },
] as const;

type FeedbackType = (typeof TYPES)[number]["key"];

export function FeedbackSection() {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("loading");
    try {
      await api.post("/api/feedback", {
        type,
        message: message.trim(),
        contact_email: email.trim() || undefined,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Separator className="bg-[var(--kvis-border)]" />

      <FadeUp>
        <section className="py-2xl">
          <div className="grid md:grid-cols-[5fr_7fr] gap-2xl items-start">
            {/* Left column - label + heading */}
            <div className="md:sticky md:top-10">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-5 text-[var(--kvis-purple-light)]"
                style={{ letterSpacing: "0.1em" }}
              >
                Write to us
              </p>
              <h2
                className="text-2xl font-bold text-[var(--kvis-ink)]"
                style={{ lineHeight: 1.25 }}
              >
                Community-built.
                <br />
                Community-improved.
              </h2>
              <p
                className="mt-4 text-sm font-medium text-[var(--kvis-text2)]"
                style={{ lineHeight: 1.8, maxWidth: "38ch" }}
              >
                Found a bug? Have an idea? Just want to say something nice?
                We read every note.
              </p>
            </div>

            {/* Right column - form */}
            <div>
              {status === "done" ? (
                <div
                  className="flex flex-col items-start gap-3 py-xl"
                  aria-live="polite"
                >
                  <CheckCircle2
                    className="h-7 w-7"
                    style={{ color: "var(--kvis-green-light)" }}
                    strokeWidth={1.5}
                  />
                  <p className="text-base font-semibold text-[var(--kvis-ink)]">
                    Thank you - we got it.
                  </p>
                  <p className="text-sm font-medium text-[var(--kvis-text2)]">
                    Your note has been received. If you left an email we&apos;ll
                    follow up if relevant.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setMessage("");
                      setEmail("");
                    }}
                    className="mt-2 text-sm font-semibold underline underline-offset-2"
                    style={{ color: "var(--kvis-purple-light)" }}
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
                  {/* Type selector */}
                  <fieldset>
                    <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--kvis-text3)] mb-3" style={{ letterSpacing: "0.08em" }}>
                      Category
                    </legend>
                    <div className="grid grid-cols-2 gap-sm">
                      {TYPES.map((t) => {
                        const selected = type === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setType(t.key)}
                            style={
                              selected
                                ? {
                                    background: "oklch(60% 0.18 294)",
                                    color: "oklch(97% 0.008 294)",
                                    borderColor: "oklch(60% 0.18 294)",
                                  }
                                : {
                                    background: "transparent",
                                    color: "var(--kvis-ink)",
                                    borderColor: "var(--kvis-border)",
                                  }
                            }
                            className="flex flex-col items-start gap-0.5 px-md py-sm border text-left transition-colors duration-150"
                            aria-pressed={selected}
                          >
                            <span className="text-xs font-semibold">{t.label}</span>
                            <span
                              className="text-xs font-medium"
                              style={{ opacity: selected ? 0.75 : undefined, color: selected ? "inherit" : "var(--kvis-text3)" }}
                            >
                              {t.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Message */}
                  <div className="flex flex-col gap-sm">
                    <label
                      htmlFor="feedback-message"
                      className="text-xs font-semibold uppercase tracking-wide text-[var(--kvis-text3)]"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      Message
                    </label>
                    <textarea
                      id="feedback-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your note here..."
                      required
                      style={{
                        borderColor: "var(--sep-input)",
                        background: "transparent",
                        color: "var(--kvis-ink)",
                        resize: "vertical",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--sep-input-focus)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--sep-input)")}
                      className="w-full border px-md py-sm text-sm font-medium leading-relaxed transition-colors placeholder:text-[var(--kvis-text3)]"
                    />
                  </div>

                  {/* Optional email */}
                  <div className="flex flex-col gap-sm">
                    <label
                      htmlFor="feedback-email"
                      className="text-xs font-semibold uppercase tracking-wide text-[var(--kvis-text3)]"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      Email <span className="normal-case font-medium tracking-normal">(optional - for follow-up)</span>
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        borderColor: "var(--sep-input)",
                        background: "transparent",
                        color: "var(--kvis-ink)",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--sep-input-focus)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--sep-input)")}
                      className="w-full border px-md py-sm text-sm font-medium transition-colors placeholder:text-[var(--kvis-text3)]"
                    />
                  </div>

                  {/* Error */}
                  {status === "error" && (
                    <p className="text-xs font-medium" style={{ color: "oklch(50% 0.2 25)" }} aria-live="polite">
                      Something went wrong - please try again.
                    </p>
                  )}

                  {/* Submit */}
                  <div>
                    <button
                      type="submit"
                      disabled={status === "loading" || !message.trim()}
                      style={{
                        background: "oklch(60% 0.18 294)",
                        color: "oklch(97% 0.008 294)",
                      }}
                      className="px-xl py-sm text-sm font-semibold transition-opacity disabled:opacity-40"
                    >
                      {status === "loading" ? "Sending..." : "Send note"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </FadeUp>
    </>
  );
}
