"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Dot } from "lucide-react";
import {
  PageEntrance,
  FadeUp,
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion";
import { Separator } from "@/components/ui/separator";
import { FeedbackSection } from "./FeedbackSection";

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
  slug: string;
}[] = [
  {
    name: "Surapa Panjaphakdee",
    role: "Project Manager & UX Planner",
    batch: "KVIS 7",
    initials: "SP",
    image: "/bio.jpeg",
    instagram: "bio_surapa",
    slug: "surapa-panjaphakdee",
  },
  {
    name: "Chayada Pakpoomkamonlert",
    role: "Design & Founding Fullstack Developer",
    batch: "KVIS 7",
    initials: "CP",
    image: "/chp.jpeg",
    instagram: "cchayadap",
    slug: "chayada-pakpoomkamonlert",
  },
  {
    name: "Naruesorn Prabpon",
    role: "Founding Fullstack Engineer",
    batch: "KVIS 7",
    initials: "NP",
    image: "/narue.jpg",
    instagram: "l2h0_lv4l2u",
    slug: "naruesorn-prabpon",
  },
  {
    name: "Popsuk Sumetchoengprachya",
    role: "Founding Fullstack Developer",
    batch: "KVIS 7",
    initials: "PS",
    image: "/pop.jpg",
    instagram: "p____p.x",
    slug: "popsuk-sumetchoengprachya",
  },
  {
    name: "Krittawee Chaiprasertsud",
    role: "Core Fullstack Developer",
    batch: "KVIS 7",
    initials: "KC",
    image: "/pun.jpg",
    instagram: "puu_nnd",
    slug: "krittawee-chaiprasertsud",
  },
];

export function AboutClient() {
  return (
    <PageEntrance>
      <div
        className="bg-[var(--background)] min-h-full"
        style={{ fontFamily: "var(--font-be-vietnam-pro), sans-serif" }}
      >
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {/* Hero */}
          <FadeUp>
            <header className="py-xl lg:py-layout flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)] flex items-center">
                  KVIS Connect <Dot className="h-6 w-6 shrink-0" aria-hidden />{" "}
                  About
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
                    className="font-display text-2xl font-black tabular-nums leading-none mb-2"
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
            <section className="py-2xl">
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
                  style={{ lineHeight: 1.85 }}
                >
                  <p>
                    Founded in 2014 through the support of the PTT Group,
                    Kamnoetvidya Science Academy (KVIS) is a private boarding
                    high school (Grades 10–12) located in Rayong as part of the
                    Eastern Economic Corridor of Innovation (EECi) project. The
                    school was established to support upper secondary students
                    who show a strong aptitude for mathematics and science,
                    providing an education with English as the main language of
                    instruction. To ensure that talented students from various
                    backgrounds can access these opportunities, the school
                    provides 100% scholarships to its students.
                  </p>
                  <p>
                    The school&apos;s goal is to contribute to Thailand&apos;s
                    scientific community by helping prepare students for further
                    studies at research universities. Through a focused
                    curriculum and academic collaboration with external
                    organizations, communities, and other schools, KVIS works to
                    support the country&apos;s need for skilled personnel in
                    science and technology. The institution strives to be a
                    helpful part of the educational ecosystem, sharing resources
                    and learning alongside its peers and partners.
                  </p>
                  <p>
                    Beyond academic learning, the school places a strong
                    emphasis on nurturing well-rounded individuals who are
                    mindful of their social responsibilities. Students are
                    encouraged to care for their physical and mental health,
                    appreciate arts and culture, and develop a genuine love for
                    lifelong research. Ultimately, the hope is that graduates
                    will use their education to give back to society,
                    collaborating with others to help build a sustainable,
                    thoughtful, and harmonious community.
                  </p>
                </div>
              </div>
            </section>
          </FadeUp>

          <Separator className="bg-[var(--kvis-border)]" />

          {/* Platform mission */}
          <FadeUp>
            <section className="py-2xl grid md:grid-cols-[2fr_3fr] gap-layout items-start">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-5 text-[var(--kvis-purple-light)]"
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
                    className="font-semibold underline underline-offset-2 text-[var(--kvis-purple-light)]"
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
                <div className="grid grid-cols-2 md:grid-cols-6 gap-lg">
                  {CONTRIBUTORS.map((c, i) => {
                    const N = CONTRIBUTORS.length;
                    const lastRowCount = N % 3 || 3;
                    const isLastOddMobile = i === N - 1 && N % 2 !== 0;
                    const isFirstOfCenteredRow =
                      lastRowCount < 3 && i === N - lastRowCount;
                    const mdColStart = isFirstOfCenteredRow
                      ? `md:col-start-${lastRowCount === 2 ? 2 : 3}`
                      : "";
                    const itemClass = [
                      isLastOddMobile ? "col-span-2" : "",
                      "md:col-span-2",
                      mdColStart,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <StaggerItem key={i} className={itemClass}>
                        <div
                          className={`group${isLastOddMobile ? " w-1/2 md:w-full mx-auto md:mx-0" : ""}`}
                        >
                          <Link href={`/profile/${c.slug}`} className="block">
                            <div
                              className="relative w-full mb-3 overflow-hidden bg-[var(--kvis-purple-soft)]"
                              style={{ aspectRatio: "1 / 1" }}
                            >
                              {c.image ? (
                                <Image
                                  src={c.image}
                                  alt={c.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                />
                              ) : (
                                <span className="text-3xl font-black text-[var(--kvis-purple-light)]">
                                  {c.initials}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col gap-0.5 mb-1">
                              <p className="text-xs font-semibold text-[var(--kvis-ink)] group-hover:underline underline-offset-2">
                                {c.name}
                              </p>
                              <p className="text-xs font-medium text-[var(--kvis-purple-light)]">
                                {c.role}
                              </p>
                              <p className="text-xs font-semibold text-[var(--kvis-green-light)]">
                                {c.batch}
                              </p>
                            </div>
                          </Link>
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
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerList>
            </section>
          </FadeUp>

          <FeedbackSection />
        </div>
      </div>
    </PageEntrance>
  );
}
