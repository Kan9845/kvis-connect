"use client";

import Link from "next/link";
import { Instagram, Dot } from "lucide-react";
import {
  PageEntrance,
  FadeUp,
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion";
import { Separator } from "@/components/ui/separator";

const SCHOOL_FACTS = [
  { label: "Established", value: "2014" },
  { label: "Location", value: "Rayong, Thailand" },
  { label: "Program", value: "M.4 - M.6 (3 years)" },
  { label: "Annual intake", value: "72 students" },
  { label: "Scholarship", value: "Full - tuition, housing & meals" },
  { label: "Mascot", value: "Goose" },
];

const STAT_STRIP = [
  { value: "2014", label: "Year founded", color: "var(--kvis-green-light)" },
  {
    value: "72",
    label: "Students per cohort",
    color: "var(--kvis-purple-light)",
  },
  {
    value: "100%",
    label: "Scholarship coverage",
    color: "var(--kvis-green-light)",
  },
  {
    value: "600+",
    label: "Alumni worldwide",
    color: "var(--kvis-purple-light)",
  },
];

const CONTRIBUTORS: {
  name: string;
  role: string;
  batch: string;
  initials: string;
  image?: string;
  instagram?: string;
}[] = [
  {
    name: "Surapa Panjaphakdee",
    role: "Founder & Coordinator",
    batch: "KVIS 7",
    initials: "SP",
    image: "/bio.jpeg",
    instagram: "bio_surapa",
  },
  {
    name: "Chayada Pakpoomkamonlert",
    role: "Design & Fullstack",
    batch: "KVIS 7",
    initials: "CP",
    image: "/chp.jpeg",
    instagram: "cchayadap",
  },
  {
    name: "Naruesorn Prabpon",
    role: "Fullstack",
    batch: "KVIS 7",
    initials: "NP",
    image: "/narue.png",
    instagram: "l2h0_lv4l2u",
  },
  {
    name: "Popsuk Sumetchoengprachya",
    role: "Fullstack",
    batch: "KVIS 7",
    initials: "PS",
    image: "/pop.jpg",
    instagram: "p____p.x",
  },
];

export function AboutClient() {
  return (
    <PageEntrance>
      <div
        className="bg-[var(--background)] min-h-full"
        style={{ fontFamily: "var(--font-be-vietnam-pro), sans-serif" }}
      >
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          {/* Hero */}
          <FadeUp>
            <header className="py-xl lg:py-layout flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)] flex items-center">
                  KVIS Connect <Dot /> About
                </p>
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95]">
                  <span className="font-light text-foreground">About </span>
                  <span style={{ color: "var(--kvis-purple)" }}>Us</span>
                </h1>
                <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
                  KVIS Connect maps the global footprint of Kamnoetvidya Science
                  Academy graduates - who&apos;s where, what they&apos;re
                  building, and how the network keeps growing long after
                  graduation.
                </p>
              </div>
            </header>
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* Stat strip */}
          <FadeUp delay={0.1}>
            <section className="py-section grid grid-cols-2 md:grid-cols-4 gap-xl">
              {STAT_STRIP.map(({ value, label, color }) => (
                <div key={label}>
                  <p
                    className="font-display text-3xl font-black tabular-nums leading-none mb-2"
                    style={{ color }}
                  >
                    {value}
                  </p>
                  <p className="text-xs font-medium text-[var(--kvis-text3)]">
                    {label}
                  </p>
                </div>
              ))}
            </section>
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* School story */}
          <FadeUp>
            <section className="py-2xl grid md:grid-cols-[5fr_3fr] gap-2xl">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-5 text-[var(--kvis-green-light)]"
                  style={{ letterSpacing: "0.1em" }}
                >
                  The School
                </p>
                <h2
                  className="text-2xl font-bold mb-7 text-[var(--kvis-ink)]"
                  style={{ lineHeight: 1.25 }}
                >
                  Kamnoetvidya Science Academy
                </h2>
                <div
                  className="text-sm font-medium space-y-5 text-[var(--kvis-text2)]"
                  style={{ lineHeight: 1.85, maxWidth: "62ch" }}
                >
                  <p>
                    Founded in 2014 by PTT Public Company Limited and the STEM
                    Education Foundation, Kamnoetvidya Science Academy - KVIS -
                    is Thailand&apos;s first fully residential science high
                    school built to identify and nurture the country&apos;s most
                    gifted students in science and mathematics.
                  </p>
                  <p>
                    The campus sits in the Eastern Science City in Rayong,
                    designed from the ground up for hands-on research. Every
                    admitted student receives a full scholarship: tuition,
                    housing, and meals for the entire three-year program.
                    Admission is intensely competitive - fewer than 72 students
                    are selected from the national pool each year.
                  </p>
                  <p>
                    Graduates have gone on to institutions including MIT,
                    Caltech, ETH Zürich, and Oxford, returning expertise to
                    Thailand&apos;s science and technology landscape. The alumni
                    community is small, global, and tightly connected -
                    qualities that KVIS Connect is built to sustain.
                  </p>
                </div>
              </div>

              <div className="py-lg">
                <StaggerList>
                  {SCHOOL_FACTS.map(({ label, value }, index) => (
                    <StaggerItem key={label}>
                      <li className={`py-4 flex flex-col gap-0.5 list-none border-b border-[var(--kvis-border)]${index === 0 ? " border-t" : ""}`}>
                        <span
                          className="text-xs font-semibold uppercase tracking-wide text-[var(--kvis-text3)]"
                          style={{ letterSpacing: "0.08em" }}
                        >
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-[var(--kvis-ink)]">
                          {value}
                        </span>
                      </li>
                    </StaggerItem>
                  ))}
                </StaggerList>
              </div>
            </section>
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* Platform mission */}
          <FadeUp>
            <section className="py-2xl grid md:grid-cols-[2fr_3fr] gap-layout items-start">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-5 text-[var(--kvis-purple)]"
                  style={{ letterSpacing: "0.1em" }}
                >
                  The Platform
                </p>
                <h2
                  className="text-2xl font-bold text-[var(--kvis-ink)]"
                  style={{ lineHeight: 1.25 }}
                >
                  Connected beyond the campus gates
                </h2>
              </div>

              <div
                className="text-sm font-medium space-y-4 text-[var(--kvis-text2)]"
                style={{ lineHeight: 1.85 }}
              >
                <p>
                  KVIS alumni scatter globally - to research labs, universities,
                  startups, and institutions across dozens of countries. KVIS
                  Connect exists to keep that dispersed community visible to
                  itself: who&apos;s where, what they&apos;re working on, how to
                  reach each other.
                </p>
                <p>
                  The platform is built and maintained by KVIS students and
                  alumni. It is not an official KVIS school product. Everything
                  here - the globe, the directory, the blog - is made by the
                  community, for the community.
                </p>
                <p>
                  Want to join the network?{" "}
                  <Link
                    href="/auth/register"
                    className="font-semibold underline underline-offset-2 text-[var(--kvis-purple)]"
                  >
                    Create a profile
                  </Link>{" "}
                  and add yourself to the map.
                </p>
              </div>
            </section>
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* Contributors */}
          <FadeUp>
            <section className="py-2xl">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--kvis-green-light)]"
                style={{ letterSpacing: "0.1em" }}
              >
                Built by
              </p>
              <h2 className="text-lg font-bold mb-xl text-[var(--kvis-ink)]">
                Project Contributors
              </h2>

              <StaggerList>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                  {CONTRIBUTORS.map((c, i) => (
                    <StaggerItem key={i}>
                      <div>
                        <div
                          className="w-full mb-3 flex items-center justify-center overflow-hidden bg-[var(--kvis-purple-soft)]"
                          style={{ aspectRatio: "1 / 1" }}
                        >
                          {c.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-black text-[var(--kvis-purple)]">
                              {c.initials}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-semibold text-[var(--kvis-ink)]">
                            {c.name}
                          </p>
                          <p className="text-xs font-medium text-[var(--kvis-purple)]">
                            {c.role}
                          </p>
                          <p className="text-xs font-semibold text-[var(--kvis-green-light)]">
                            {c.batch}
                          </p>
                          {c.instagram && (
                            <a
                              href={`https://instagram.com/${c.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium text-[var(--kvis-text3)]"
                            >
                              <Instagram className="h-3 w-3 shrink-0" />
                              <span>@{c.instagram}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerList>
            </section>
          </FadeUp>
        </div>
      </div>
    </PageEntrance>
  );
}
