"use client";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { onMeUpdateSuccess } from "@/lib/cache/invalidate";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectGroup, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Upload, Loader2, Check, ShieldCheck, ShieldAlert, Globe, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { DEGREES, JOB_FIELDS, MBTI_TYPES, KVIS_YEARS, KVIS_DEPARTMENTS } from "@/lib/constants/options";
import { CountrySelect, CitySelect, CITY_STATE_COUNTRIES } from "@/components/ui/location-selects";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { MajorCombobox } from "@/components/ui/major-combobox";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Education, Career } from "@/lib/types";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { defaultAvatar } from "@/components/avatar/avatarData";
import { AvatarConfig } from "@/lib/avatarTypes";
import { cohortColor, cohortTextColor, cohortColorHex, cohortColorSoftHex } from "@/lib/utils";
import { isFaculty, FACULTY_COLOR } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_STATUS_OPTIONS = [
  { group: "KVIS", options: [
    { value: "kvis_student", label: "KVIS Student" },
    { value: "kvis_faculty", label: "KVIS Faculty / Staff" },
  ]},
  { group: "Academic Track", options: [
    { value: "undergraduate", label: "Undergraduate Student" },
    { value: "masters", label: "Master's Student" },
    { value: "phd", label: "PhD Student" },
    { value: "postdoc", label: "Postdoctoral Researcher" },
  ]},
  { group: "Medical Track", options: [
    { value: "med_preclinical", label: "Pre-clinical (Years 1–3)" },
    { value: "med_clinical", label: "Clinical (Years 4–6)" },
    { value: "med_intern", label: "Internship / Transition Year" },
    { value: "med_residency", label: "Residency Training" },
    { value: "med_fellowship", label: "Fellowship Training" },
    { value: "med_staff", label: "Staff Physician / Specialist" },
  ]},
  { group: "Professional", options: [
    { value: "working", label: "Working (Industry / Sector)" },
    { value: "founder", label: "Business Owner / Founder" },
    { value: "gap", label: "Gap Year / Exploring" },
  ]},
];

const COMPANY_TYPES = [
  "Multinational Corporation (MNC)",
  "National Corporation / Local Enterprise",
  "State-Owned Enterprise (SOE)",
  "Government / Public Sector",
  "Academic / Research Institution",
  "Startup (Early to Late Stage)",
  "SME (Small to Medium Enterprise)",
  "NGO / Non-Profit / International Organization",
  "Self-Employed / Freelance / Business Owner",
  "Other",
];

const INDUSTRY_SECTORS = [
  { group: "Public & Academic", options: ["Education, Training & Academia", "Public Sector, Government & Policy", "NGOs, Non-Profit & Social Impact"] },
  { group: "Technology & Digital", options: ["Software, IT & Cloud Services", "Hardware, Semiconductors & Electronics", "Telecommunications & Networking"] },
  { group: "Life Sciences & Health", options: ["Biotechnology, Pharma & Life Sciences", "Healthcare, Medical & MedTech"] },
  { group: "Industrial & Engineering", options: ["Manufacturing, Aerospace & Automotive", "Energy, Utilities & Natural Resources", "Engineering & Technical Services"] },
  { group: "Finance & Professional Services", options: ["Finance, Banking & Fintech", "Management Consulting & Strategy", "Legal, Accounting & Professional Services"] },
  { group: "Environment & Infrastructure", options: ["Environment, Sustainability & Climate Tech", "Real Estate, Construction & Infrastructure", "Agriculture, Food & Forestry"] },
  { group: "Consumer & Media", options: ["Consumer Goods, Retail & E-commerce", "Logistics, Supply Chain & Transportation", "Media, Entertainment & Creative Industries", "Hospitality, Tourism & Food Services"] },
  { group: "Other", options: ["Other"] },
];

const ROLE_TYPES = [
  "Education, Teaching & Academia",
  "R&D, Science & Laboratory",
  "Software & Systems Development",
  "Engineering & Technical Operations",
  "Data, AI & Analytics",
  "Healthcare & Clinical Practice",
  "Product, Project & Program Management",
  "Strategy, Consulting & Business Intelligence",
  "Quality, Regulatory & Compliance",
  "Executive & Corporate Leadership",
  "Design, Creative & UX/UI",
  "Finance, Accounting & Investment",
  "Operations, Supply Chain & Logistics",
  "Marketing, Communications & Public Relations",
  "Sales & Business Development",
  "Legal, Policy & Government Affairs",
  "Human Resources & People Operations",
  "Customer Success & Support",
  "Other",
];

const SCHOLARSHIP_NAMES = [
  "King's Scholarship (เล่าเรียนหลวง)",
  "Olympiad Scholarship (โอลิมปิกวิชาการ)",
  "DPST (พสวท.)",
  "Vidyasirimedhi Scholarship (วิทยสิริเมธี)",
  "Other Thai Government Scholarship (OCSC / ก.พ.)",
  "ASEAN Scholarship",
  "MEXT Scholarship (Embassy Recommendation)",
  "MEXT Scholarship (University Recommendation)",
  "Country Scholarship",
  "University Scholarship",
  "Other",
];

const SCHOLARSHIP_TYPES = [
  "Full Funding (Tuition + Stipend)",
  "Partial Funding / Tuition Waiver",
  "Research Assistantship (RA) / Teaching Assistantship (TA)",
];

const SCHOLARSHIP_BOND = [
  "Bonded (Requires return of service/work)",
  "Non-bonded (No service requirement)",
];

const CONTACT_TYPES = ["Email", "LinkedIn", "Facebook", "Instagram", "Line", "WhatsApp", "WeChat", "Discord", "Snapchat"];

const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const CHRONOTYPES = ["Early Bird", "Night Owl"];
const LANGUAGE_OPTIONS = ["Thai", "English", "Japanese", "Chinese", "Korean", "German", "French", "Spanish", "Hungarian", "Other"];
const LANGUAGE_PROFICIENCY = ["Native", "Fluent", "Learning"];

const PORTFOLIO_TYPES = ["Google Scholar", "ResearchGate", "GitHub", "LinkedIn", "Personal Website/Blog", "ORCID", "Portfolio"];
const PROJECT_STATUSES = ["Ongoing", "Completed", "On-hold"];

const RESEARCH_CATEGORIES = [
  { group: "Life Sciences & Bio-Innovation", options: ["Molecular, Cellular & Developmental Biology", "Microbiology, Immunology & Infectious Disease", "Genetics, Bioinformatics & Computational Biology", "Biochemistry, Structural Biology & Biophysics", "Biotechnology, Synthetic & Systems Biology", "Neuroscience & Behavioral Biology", "Physiology, Pharmacology & Toxicology", "Plant Science, Agriculture & Food Science", "Ecology & Evolutionary Biology"] },
  { group: "Physics & Astronomy", options: ["Theoretical & Mathematical Physics", "Condensed Matter Physics", "Experimental Physics & Instrumentation", "Atomic, Molecular & Optical Physics", "Astronomy, Astrophysics, Cosmology & Space Science", "Quantum Computing, Quantum Information & Quantum Science", "Applied, Materials, Medical & Biophysics"] },
  { group: "Chemistry & Material Science", options: ["Organic Chemistry", "Inorganic Chemistry", "Biochemistry & Chemical Biology", "Analytical Chemistry & Spectroscopy", "Physical Chemistry", "Computational & Theoretical Chemistry", "Materials & Nanoscience", "Energy, Sustainability & Green Chemistry"] },
  { group: "Mathematics & Statistics", options: ["Algebra & Number Theory", "Analysis", "Geometry & Topology", "Applied & Computational Mathematics", "Statistics & Probability", "Discrete Mathematics & Theoretical Computer Science", "Optimization & Control Theory", "Financial Mathematics & Actuarial Science"] },
  { group: "Computer Science & AI", options: ["Artificial Intelligence & Machine Learning", "Software Systems, Distributed Computing & HPC", "Cloud, Cybersecurity & Networking", "Data Science & Big Data Analytics", "Theoretical CS & Quantum Computing", "Human-Computer Interaction & Graphics", "IoT, Robotics & Embedded Systems", "Game Development & Interactive Media"] },
  { group: "Engineering & Technology", options: ["Electrical, Electronic & Computer Engineering", "Mechanical, Aerospace & Robotics", "Chemical & Biomolecular Engineering", "Civil, Structural & Environmental Engineering", "Materials & Nano-Engineering", "Biomedical Engineering & MedTech", "Industrial Engineering & Operations Research"] },
  { group: "Health, Medicine & Clinical Sciences", options: ["Clinical Medicine & Surgical Specialties", "Translational & Medical Research", "Public Health, Epidemiology & Policy", "Pharmacy & Pharmaceutical Sciences", "Healthcare AI & Digital Health", "Medical Imaging & Diagnostics"] },
  { group: "Social Sciences, Business & Humanities", options: ["Business, Economics & Entrepreneurship", "Psychology, Cognitive & Behavioral Sciences", "Law, Public Policy & International Relations", "Arts, Design & Architecture", "Education & Social Development", "History, Philosophy & Religious Studies", "Media, Communications & Linguistics"] },
];

const HOBBIES = {
  beverages: ["Black Coffee", "Latte", "Espresso", "Cold Brew", "Matcha", "Thai Milk Tea", "Fruit/Bubble Tea", "Specialty Tea", "Energy Drinks", "Protein Shakes", "Water", "Craft Beer", "Wine", "Cocktails", "Kombucha", "Juice"],
  fitness: ["Pilates", "Yoga", "Meditation", "Weightlifting", "CrossFit", "HIIT", "Calisthenics", "Running", "Cycling", "Swimming", "Hiking", "Rock Climbing", "Surfing", "Dance", "Martial Arts", "Boxing"],
  sports: ["Badminton", "Basketball", "Football", "Volleyball", "Tennis", "Table Tennis", "E-Sports", "Muay Thai", "Pickleball", "Golf", "Ultimate Frisbee", "Softball", "Baseball", "Rugby", "Bowling", "Fencing", "Archery"],
  gaming: ["PC (Steam/Epic)", "Console (PS/Xbox/Switch)", "Mobile Gaming", "Valorant", "League of Legends", "Dota 2", "RoV", "PUBG", "Apex Legends", "CS2/CS:GO", "Genshin Impact", "Honkai: Star Rail", "Minecraft", "Roblox", "Elden Ring", "Stardew Valley", "Strategy/Civilization", "Board Games", "TTRPG (D&D)", "Trading Card Games"],
  music: ["Pop", "K-Pop", "T-Pop", "Rock", "Metal", "Indie/Alternative", "Jazz", "Classical", "R&B/Soul", "Hip-Hop/Rap", "EDM", "Lo-fi", "Synthwave/City Pop", "Soundtracks", "Podcasts", "Audiobooks"],
  instruments: ["Vocals", "Piano/Keyboard", "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Ukulele", "Drum Kit", "Synthesizer", "DJ Controller", "Violin", "Viola", "Cello", "Flute", "Clarinet", "Saxophone", "Trumpet", "Thai Classical Instruments"],
  creative: ["Photography (Digital)", "Photography (Film)", "Digital Illustration", "3D Modeling/CGI", "UI/UX Design", "Graphic Design", "Video Editing", "Motion Graphics", "Content Creation", "Traditional Painting", "Sketching/Drawing", "Calligraphy", "3D Printing", "Fashion Design", "Pottery/Ceramics"],
  books: ["Sci-Fi", "Fantasy", "Mystery/Thriller", "Horror", "Literary Fiction", "Classic Literature", "Light Novels", "Popular Science & Tech", "Scientific Journals", "Philosophy", "Psychology", "History", "Biography/Memoir", "Self-Help", "Economics & Business", "Manga", "Webtoons/Manhwa", "Poetry"],
  other: ["Birdwatching", "Vibe Coding", "AI Tinkering", "Cooking", "Baking", "Mixology", "Coffee Roasting", "Gardening", "Traveling", "Road Trips", "Camping", "Backpacking", "Fishing", "Volunteering", "Language Learning", "Collecting (Vinyl/Stamps)", "Interior Design", "Astrophotography", "Pet Care"],
};

const MED_SCHOOLS = [
  { value: "CU", label: "Chulalongkorn University (CU)" },
  { value: "MDSIR", label: "Mahidol University - Siriraj (MDSIR)" },
  { value: "MDRAMA", label: "Mahidol University - Ramathibodi (MDRAMA)" },
  { value: "CMU", label: "Chiang Mai University (CMU)" },
  { value: "KKU", label: "Khon Kaen University (KKU)" },
  { value: "PSU", label: "Prince of Songkla University (PSU)" },
  { value: "TU", label: "Thammasat University (TU)" },
  { value: "PCM", label: "Phramongkutklao College of Medicine (PCM)" },
  { value: "SWU", label: "Srinakharinwirot University (SWU)" },
  { value: "NU", label: "Naresuan University (NU)" },
  { value: "NMU", label: "Navamindradhiraj University - Vajira Hospital (NMU)" },
  { value: "Other", label: "Other" },
];

const MED_DUAL_TYPES = [
  "MD/PhD",
  "MD/Master of Management (MD/MM)",
  "MD/MBA",
  "MD/MEng",
  "MD/MSc",
  "Other",
];

const MED_SPECIALTIES = [
  "Undecided / Exploring",
  "Internal Medicine - อายุรศาสตร์",
  "Surgery - ศัลยศาสตร์",
  "Pediatrics - กุมารเวชศาสตร์",
  "OB-GYN - สูตินรีเวชวิทยา",
  "Orthopedics - ศัลยศาสตร์ออร์โธปิดิกส์",
  "Emergency Medicine - เวชศาสตร์ฉุกเฉิน",
  "Radiology - รังสีวิทยา",
  "Anesthesiology - วิสัญญีวิทยา",
  "Psychiatry - จิตเวชศาสตร์",
  "Ophthalmology - จักษุวิทยา",
  "Otolaryngology - โสต ศอ นาสิกวิทยา",
  "Dermatology - ตจวิทยา",
  "Pathology - พยาธิวิทยา",
  "Family Medicine - เวชศาสตร์ครอบครัว",
  "Rehabilitation Medicine - เวชศาสตร์ฟื้นฟู",
  "Other",
];

const MED_DEGREES = ["MD", "MBBS", "MBChB"];

// ─── Schema ───────────────────────────────────────────────────────────────────

const generalSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  nickname: z.string().optional(),
  nickname_public: z.boolean().optional(),
  kvis_year: z.coerce.number().optional(),
  expected_grad_year: z.coerce.number().optional(),
  teach_department: z.string().optional(),
  teach_start_year: z.coerce.number().optional(),
  teach_end_year: z.coerce.number().optional(),
  is_current_teacher_str: z.string().optional(),
  current_status: z.string().optional(),
  place: z.string().optional(),
  place_level2: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500).optional(),
  mbti: z.string().optional(),
  zodiac: z.string().optional(),
  chronotype: z.string().optional(),
  interests: z.string().optional(),
  interests_public: z.boolean().optional(),
  contact_email: z.string().optional(),
  contact_email_public: z.boolean().optional(),
  facebook_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  instagram_url: z.string().optional(),
  line_id: z.string().optional(),
  website_url: z.string().optional(),
});

type GeneralForm = z.infer<typeof generalSchema>;
type Tab = "general" | "education" | "career" | "research" | "personal";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ numeral, kicker, title }: { numeral: string; kicker: string; title: string }) {
  return (
    <header className="pt-9 pb-4">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono font-black text-xl tabular-nums text-[var(--kvis-green-light)]" style={{ letterSpacing: "-0.02em" }}>{numeral}</span>
        <span className="text-xs uppercase tracking-[0.28em] font-bold text-[var(--kvis-text3)]">{kicker}</span>
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[-0.025em] leading-[1.02] text-foreground max-w-[22ch]">{title}</h2>
    </header>
  );
}

function FieldRow({ label, required, hint, error, noBorder, children }: {
  label: string; required?: boolean; hint?: string; error?: string; noBorder?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-6 gap-y-2 py-4${noBorder ? "" : " border-b border-[var(--kvis-border)]"}`}>
      <div className="md:pt-2.5">
        <span className="text-xs uppercase tracking-[0.24em] font-bold text-[var(--kvis-text3)]">
          {label}{required && <span className="text-[var(--kvis-purple)]"> *</span>}
        </span>
        {hint && <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">{hint}</p>}
      </div>
      <div className="min-w-0">
        {children}
        {error && <p className="text-xs mt-1.5 font-semibold text-[var(--kvis-purple)]">{error}</p>}
      </div>
    </div>
  );
}

function PrivacyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors"
      style={{ color: value ? "var(--kvis-green-light)" : "var(--kvis-text3)" }}>
      {value ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {value ? "Public" : "KVIS only"}
    </button>
  );
}

function TagPills({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="px-2.5 py-1.5 text-xs font-semibold transition-colors border"
          style={{
            background: selected.includes(o) ? "var(--kvis-purple)" : "transparent",
            color: selected.includes(o) ? "white" : "var(--foreground)",
            borderColor: selected.includes(o) ? "var(--kvis-purple)" : "var(--kvis-border)",
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

const inputCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-foreground transition-colors";
const selectTriggerCls = "w-full bg-transparent border-0 border-b border-foreground/20 rounded-none px-0 py-2 text-sm md:text-base text-foreground focus:ring-0 focus:ring-offset-0";

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditPageInner() {
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "1";
  const notify = {
    success: (msg: string) => { if (!isSetup) toast.success(msg); },
    error: (msg: string) => { if (!isSetup) toast.error(msg); },
  };
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const router = useRouter();
  const { user: me, loading, refetch } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [gooseConfig, setGooseConfig] = useState<AvatarConfig>(defaultAvatar);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [profileMode, setProfileMode] = useState<"upload" | "goose">("upload");

  // Extra contacts state
  const [extraContacts, setExtraContacts] = useState<{ type: string; value: string; public: boolean }[]>([]);

  // Research state
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [researchKeywords, setResearchKeywords] = useState("");
  const [projects, setProjects] = useState<{ title: string; advisor?: string; advisor2?: string; description?: string; status: string; link?: string }[]>([]);
  const [publications, setPublications] = useState<{ citation: string; doi?: string }[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<{ type: string; url: string }[]>([]);

  // Personal state
  const [languages, setLanguages] = useState<{ lang: string; proficiency?: string }[]>([]);
  const [hobbies, setHobbies] = useState<Record<string, string[]>>({});
  const [kvisFavMenu, setKvisFavMenu] = useState("");
  const [kvisFavEvent, setKvisFavEvent] = useState("");
  const [kvisFavArea, setKvisFavArea] = useState("");

  useEffect(() => {
    if (!loading && !me) router.push("/auth/login");
  }, [loading, me, router]);

  useEffect(() => {
    if (me) {
      setResearchInterests(me.research_interests ?? []);
      setResearchKeywords(me.research_keywords ?? "");
      setProjects(me.projects ?? []);
      setPublications(me.publications ?? []);
      setPortfolioLinks(me.portfolio_links ?? []);
      setLanguages(me.languages ?? []);
      setHobbies(me.hobbies ?? {});
      setKvisFavMenu(me.kvis_fav_menu ?? "");
      setKvisFavEvent(me.kvis_fav_event ?? "");
      setKvisFavArea(me.kvis_fav_area ?? "");
    }
  }, [me]);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty, isSubmitting } } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    values: me ? {
    first_name: me.first_name,
    last_name: me.last_name,
    kvis_year: me.kvis_year ?? undefined,
    expected_grad_year: me.expected_grad_year ?? undefined,
    teach_department: me.teach_department ?? "",
    place: me.place ?? "",
    country: me.country ?? "",
    bio: me.bio ?? "",
    mbti: me.mbti ?? "",
    interests: me.interests ?? "",
    facebook_url: me.facebook_url ?? "",
    linkedin_url: me.linkedin_url ?? "",
    line_id: me.line_id ?? "",
    website_url: me.website_url ?? "",
    teach_start_year: me.teach_start_year ?? undefined,
    teach_end_year: me.teach_end_year ?? undefined,
    is_current_teacher_str: me.is_current_teacher ? "true" : "false",
  } : undefined,
  });

  const watchNicknamePublic = watch("nickname_public") ?? true;
  const watchInterestsPublic = watch("interests_public") ?? true;
  const watchContactEmailPublic = watch("contact_email_public") ?? true;

  const [education, setEducation] = useState<Omit<Education, "id">[]>([]);
  const [career, setCareer] = useState<Omit<Career, "id">[]>([]);

  useEffect(() => {
    if (me) {
      setEducation(me.education.map(({ id: _id, ...rest }) => rest));
      setCareer(me.career.map(({ id: _id, ...rest }) => rest));
    }
  }, [me]);

  const saveGeneral = async (data: GeneralForm) => {
    let picUrl: string | undefined;
    if (pendingFile) {
      try {
        const { url } = await userApi.uploadProfilePic(pendingFile);
        picUrl = url;
        setPendingFile(null);
      } catch { notify.error("Photo upload failed"); return; }
    }
    const updated = await userApi.updateMe({
      ...(picUrl ? { ...data, profile_pic_url: picUrl } : data),
    });
    onMeUpdateSuccess(qc, updated);
    await refetch();
    notify.success("Profile updated");
  };

  const saveEducation = async () => {
    await userApi.updateEducation(education);
    await refetch();
    notify.success("Education saved");
  };

  const saveCareer = async () => {
    await userApi.updateCareer(career);
    await refetch();
    notify.success("Career saved");
  };

  const saveResearch = async () => {
    try {
      await userApi.updateMe({
        research_interests: researchInterests,
        research_keywords: researchKeywords,
        projects, publications, portfolio_links: portfolioLinks,
      });
      await refetch();
      notify.success("Research saved");
    } catch { notify.error("Failed to save"); }
  };

  const savePersonal = async () => {
    try {
      await userApi.updateMe({
        languages, hobbies,
        kvis_fav_menu: kvisFavMenu,
        kvis_fav_event: kvisFavEvent,
        kvis_fav_area: kvisFavArea,
      });
      await refetch();
      notify.success("Personal info saved");
    } catch { notify.error("Failed to save"); }
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  };

  const getCroppedFile = async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!cropSrc || !croppedAreaPixels) return reject("No crop data");
      const image = new window.Image();
      image.src = cropSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        canvas.toBlob((blob) => {
          if (!blob) return reject("Blob failed");
          resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
      };
    });
  };

  const handleUseGooseProfile = async () => {
    if (!me) return;
    try {
      const size = 600;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, cohortColorHex(me.kvis_year));
      grad.addColorStop(1, cohortColorSoftHex(me.kvis_year));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const drawLayer = (src: string, scale = 1.26) => new Promise<void>((res, rej) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { const off = (size * (scale - 1)) / 2; ctx.drawImage(img, -off, -off, size * scale, size * scale); res(); };
        img.onerror = (e) => { console.warn("Failed to load", src, e); res(); };
        img.src = src;
      });
      const layerOrder = ["eyes", "brows", "hair", "head", "glasses", "cheek", "neck", "hand"] as const;
      await drawLayer("/goose/goose_base.png");
      for (const layer of layerOrder) { const asset = gooseConfig[layer]; if (asset) await drawLayer(`/goose/${asset}.png`); }
      await drawLayer("/goose/layout.png");
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "goose-profile.png", { type: "image/png" });
        const { url } = await userApi.uploadProfilePic(file);
        const updated = await userApi.updateMe({ profile_pic_url: url });
        onMeUpdateSuccess(qc, updated);
        await refetch();
        setPicPreview(url);
        notify.success("Goose profile updated");
      }, "image/png");
    } catch (err: any) {
      notify.error("Failed to generate goose profile");
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-full bg-background">
        <div className={`mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14 ${isSetup ? "pb-32" : ""}`}>
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-20 w-3/4 mb-6" />
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        </div>
      </div>
    );
  }

  const initials = `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase();
  const isStudent = !!me.current_grade;
  const isFacultyUser = isFaculty(me);
  const isAlumni = !isStudent && !isFacultyUser;
  const previewUrl = picPreview ?? me.profile_pic_url ?? "";

  return (
    <div className="min-h-full bg-background">
      <div className={`mx-auto max-w-5xl px-6 lg:px-10 py-10 lg:py-14 ${isSetup ? "pb-32" : ""}`}>

        <header className="pb-7 border-b border-foreground/60">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-[var(--kvis-green-light)]">
            {isSetup ? "KVIS Connect · Welcome" : "KVIS Connect · Edit Dossier"}
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.95] text-foreground">
            {isSetup ? "Set up your profile." : "Edit profile"}
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[55ch] leading-relaxed">
            {isSetup
              ? "Fill in as much or as little as you like across the tabs below - you can always update everything later."
              : "Update your dossier - the page other Kvisians see when they look you up."}
          </p>
          <div className="flex items-center gap-3 md:gap-4 mt-6 text-xs tabular-nums uppercase tracking-[0.22em] flex-wrap text-[var(--kvis-text3)]">
            <span>{me.email}</span>
            <span aria-hidden>·</span>
            <Link href={`/profile/${me.slug}`} className="hover:text-foreground transition-colors underline decoration-1 underline-offset-4">
              View public profile
            </Link>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <TabsList className="h-auto w-full justify-start gap-7 rounded-none border-b border-[var(--kvis-border)] bg-transparent p-0 pt-5 pb-1 overflow-x-auto">
            {(isStudent
              ? ["general", "research", "personal"]
              : ["general", "education", "career", "research", "personal"]
            ).map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-none bg-transparent px-0 py-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-[var(--kvis-purple)] data-[state=active]:shadow-none data-[state=active]:underline data-[state=active]:underline-offset-8 data-[state=active]:decoration-2 whitespace-nowrap">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── GENERAL TAB ─────────────────────────────────────────────────── */}
        {tab === "general" && (
          <>
            {/* Portrait section - unchanged */}
            <section>
              <SectionHead numeral="I." kicker="Portrait" title="Profile picture" />
              <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-12 py-6 border-b border-[var(--kvis-border)] items-start">
                <div className="space-y-6 self-start">
                  <div className="relative w-full max-w-[320px] rounded-full"
                    style={{ outline: `5px solid ${cohortColor(me.kvis_year)}`, outlineOffset: "2px" }}>
                    <div key={profileMode} ref={profileMode === "goose" ? avatarRef : undefined}
                      className="relative aspect-square overflow-hidden rounded-full"
                      style={{ background: `linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)` }}>
                      {profileMode === "goose" ? (
                        <div className="absolute inset-0 scale-[1.26] origin-center pointer-events-none">
                          <AvatarPreview config={gooseConfig} backgroundColor={`linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)`} />
                        </div>
                      ) : previewUrl ? (
                        <img src={previewUrl} alt={`${me.first_name} ${me.last_name}`} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-black"
                          style={{ background: `linear-gradient(135deg, ${cohortColorHex(me.kvis_year)} 0%, ${cohortColorSoftHex(me.kvis_year)} 100%)`, color: cohortTextColor(me.kvis_year), fontSize: "clamp(2rem, 8vw, 4rem)" }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-2xl space-y-8">
                  <div className="flex items-center gap-6 border-b border-[var(--kvis-border)] pb-4">
                    {(["upload", "goose"] as const).map((mode) => (
                      <button key={mode} type="button" onClick={() => setProfileMode(mode)}
                        className="text-xs font-bold uppercase tracking-[0.28em] pb-1 transition-colors"
                        style={profileMode === mode ? { color: "var(--kvis-purple)", borderBottom: "2px solid var(--kvis-purple)" } : { color: "var(--kvis-text3)" }}>
                        {mode === "upload" ? "Upload Photo" : "Goose Profile"}
                      </button>
                    ))}
                  </div>
                  {profileMode === "upload" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Upload a profile photo</h3>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">JPG or PNG. Square images work best.</p>
                      </div>
                      {cropSrc ? (
                        <div className="space-y-4">
                          <div className="relative w-full max-w-md h-64 bg-muted overflow-hidden rounded-lg">
                            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)} />
                          </div>
                          <div className="flex items-center gap-3 max-w-md">
                            <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">Zoom</span>
                            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-foreground" />
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" className="h-auto rounded-none bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2"
                              onClick={async () => { try { const file = await getCroppedFile(); setPendingFile(file); setPicPreview(URL.createObjectURL(file)); setCropSrc(null); } catch { notify.error("Crop failed"); } }}>
                              <Check className="h-3.5 w-3.5" /> Apply crop
                            </Button>
                            <Button type="button" variant="outline" className="h-auto rounded-none border-foreground/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] gap-2" onClick={() => setCropSrc(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex h-40 w-full max-w-md cursor-pointer items-center justify-center border border-dashed border-foreground/20 transition-colors hover:border-foreground/50">
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
                          <div className="text-center"><Upload className="mx-auto mb-3 h-6 w-6" /><p className="text-sm font-medium">Click to upload</p></div>
                        </label>
                      )}
                    </div>
                  )}
                  {profileMode === "goose" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Customize your goose</h3>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">Create a playful illustrated profile avatar.</p>
                      </div>
                      <div className="max-w-xl"><AvatarCustomizer value={gooseConfig} onChange={setGooseConfig} /></div>
                    </div>
                  )}
                  <div className="pt-8">
                    <Button type="button"
                      className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2"
                      onClick={async () => {
                        if (profileMode === "goose") { await handleUseGooseProfile(); }
                        else if (pendingFile) {
                          try {
                            const { url } = await userApi.uploadProfilePic(pendingFile);
                            const updated = await userApi.updateMe({ profile_pic_url: url });
                            onMeUpdateSuccess(qc, updated);
                            await refetch();
                            setPicPreview(url);
                            setPendingFile(null);
                            notify.success("Profile picture updated");
                          } catch { notify.error("Upload failed"); }
                        }
                      }}
                      disabled={profileMode === "upload" && !pendingFile}>
                      {profileMode === "goose" ? "Save goose profile" : "Save photo"}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Credential - unchanged */}
            <section>
              <SectionHead numeral="II." kicker="Credential" title="KVIS-verified badge" />
              <div className="py-5">
                <div className="border" style={{ borderColor: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-rule)" }}>
                  <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b" style={{ borderColor: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-rule)" }}>
                    <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: me.is_verified ? "var(--kvis-green-light)" : "var(--kvis-text3)" }}>
                      {me.is_verified ? "Issued · Automatic" : "No credential on file"}
                    </span>
                    <span className="text-xs font-mono tabular-nums tracking-[0.2em] text-[var(--kvis-text3)]">KVIS · V01</span>
                  </div>
                  <div className="px-5 py-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        {me.is_verified ? <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--kvis-green-light)]" /> : <ShieldAlert className="h-5 w-5 shrink-0 text-muted-foreground" />}
                        <span className="text-2xl md:text-[1.75rem] font-black tracking-[-0.025em] leading-none text-foreground">KVIS-verified</span>
                      </div>
                      <p className="text-xs font-mono tracking-wide truncate text-[var(--kvis-text3)]">
                        {me.is_verified ? `Awarded to ${me.kvis_email}` : "Not yet awarded"}
                      </p>
                    </div>
                    {!me.is_verified && (
                      <Button type="button" variant="outline" onClick={() => router.push("/auth/verify-email")}
                        className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                        Verify with KVIS email
                      </Button>
                    )}
                  </div>
                  <div className="px-5 py-3 border-t border-[var(--kvis-border)]">
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">
                      {me.is_verified ? "Issued automatically on @kvis.ac.th email confirmation." : "We send a one-time code to your @kvis.ac.th address to issue this credential."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit(saveGeneral)}>
              {/* Identity */}
              <section>
                <SectionHead numeral="III." kicker="Identity" title="The basics" />
                <FieldRow label="First name" required error={errors.first_name?.message}>
                  <Input {...register("first_name")} className={inputCls} />
                </FieldRow>
                <FieldRow label="Last name" required error={errors.last_name?.message}>
                  <Input {...register("last_name")} className={inputCls} />
                </FieldRow>
                <FieldRow label="Nickname" hint="Optional display name.">
                  <div className="flex items-center gap-3">
                    <Input {...register("nickname")} placeholder="e.g. Tam" className={`${inputCls} flex-1`} />
                    <PrivacyToggle value={watchNicknamePublic} onChange={(v) => setValue("nickname_public", v, { shouldDirty: true })} />
                  </div>
                </FieldRow>
                {(isAlumni || isFacultyUser) && (
                  <FieldRow label="KVIS cohort">
                    <Select defaultValue={me.kvis_year ? String(me.kvis_year) : undefined} onValueChange={(v) => setValue("kvis_year", parseInt(v), { shouldDirty: true })}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select graduation year" /></SelectTrigger>
                      <SelectContent>{KVIS_YEARS.map((y) => <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldRow>
                )}
                {/* Teaching period - faculty only */}
                {isFaculty(me) && (
                  <>
                    <FieldRow label="Department" required>
                      <Select defaultValue={me.teach_department ?? undefined}
                        onValueChange={v => setValue("teach_department", v, { shouldDirty: true })}>
                        <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {KVIS_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <SectionHead numeral="III." kicker="Faculty" title="Teaching period" />
                    <FieldRow label="Start year" hint="First year you taught at KVIS">
                      <Input
                        type="number"
                        {...register("teach_start_year", { valueAsNumber: true })}
                        className={inputCls}
                        placeholder="e.g. 2018"
                      />
                    </FieldRow>
                    <FieldRow label="Status">
                      <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                          <input
                            type="radio"
                            value="true"
                            {...register("is_current_teacher_str")}
                            className="accent-[var(--kvis-purple)]"
                          />
                          Still teaching
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                          <input
                            type="radio"
                            value="false"
                            {...register("is_current_teacher_str")}
                            className="accent-[var(--kvis-purple)]"
                          />
                          Left KVIS
                        </label>
                      </div>
                    </FieldRow>
                    {watch("is_current_teacher_str") === "false" && (
                      <FieldRow label="End year" hint="Last year you taught at KVIS">
                        <Input
                          type="number"
                          {...register("teach_end_year", { valueAsNumber: true })}
                          className={inputCls}
                          placeholder="e.g. 2024"
                        />
                      </FieldRow>
                    )}
                  </>
                )}
                <FieldRow label="Current status">
                  <Select defaultValue={me.current_status ?? undefined} onValueChange={(v) => setValue("current_status", v, { shouldDirty: true })}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="What are you up to?" /></SelectTrigger>
                    <SelectContent>
                      {CURRENT_STATUS_OPTIONS.map(g => (
                        <SelectGroup key={g.group}>
                          <SelectLabel>{g.group}</SelectLabel>
                          {g.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                {(isStudent || ["undergraduate", "masters", "phd", "med_preclinical", "med_clinical"].includes(watch("current_status") ?? me.current_status ?? "")) && (
                  <FieldRow label="Expected grad year" hint="We'll remind you to update your profile when you graduate.">
                    <Input type="number" {...register("expected_grad_year", { valueAsNumber: true })}
                      placeholder={`e.g. ${new Date().getFullYear() + 2}`} className={inputCls} />
                  </FieldRow>
                )}
                <FieldRow label="MBTI">
                  <Select defaultValue={me.mbti ?? undefined} onValueChange={(v) => setValue("mbti", v, { shouldDirty: true })}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select MBTI" /></SelectTrigger>
                    <SelectContent>{MBTI_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Bio" hint="Max 500 characters.">
                  <Textarea rows={4} placeholder="Tell your fellow alumni about yourself…" {...register("bio")} className={`${inputCls} min-h-[100px]`} />
                </FieldRow>
                <FieldRow label="Tags" hint="Comma-separated interests.">
                  <div className="flex items-center gap-3">
                    <Input placeholder="Machine Learning, Photography, Hiking" {...register("interests")} className={`${inputCls} flex-1`} />
                    <PrivacyToggle value={watchInterestsPublic} onChange={(v) => setValue("interests_public", v, { shouldDirty: true })} />
                  </div>
                </FieldRow>
              </section>

              {/* Location */}
              <section>
                <SectionHead numeral="IV." kicker="Location" title="Where you are" />
                <FieldRow label="Country">
                  <CountrySelect variant="underline" value={me.country ?? ""} onChange={(v) => setValue("country", v, { shouldDirty: true })} />
                </FieldRow>
                <FieldRow label="Province / State" hint="Region within your country.">
                  <Input placeholder="e.g. Bangkok, California" {...register("place_level2")} className={inputCls} />
                </FieldRow>
                <FieldRow label="City" hint="Optional finer location.">
                  <Input placeholder="e.g. Bangkok" {...register("place")} className={inputCls} />
                </FieldRow>
              </section>

              {/* Contacts */}
              <section>
                <SectionHead numeral="V." kicker="Contact" title="How to reach you" />
                <FieldRow label="Public email" hint="Shown on your profile if public.">
                  <div className="flex items-center gap-3">
                    <Input placeholder="you@gmail.com" {...register("contact_email")} className={`${inputCls} flex-1`} />
                    <PrivacyToggle value={watchContactEmailPublic} onChange={(v) => setValue("contact_email_public", v, { shouldDirty: true })} />
                  </div>
                </FieldRow>
                <FieldRow label="LinkedIn"><Input placeholder="https://linkedin.com/in/…" {...register("linkedin_url")} className={inputCls} /></FieldRow>
                <FieldRow label="Facebook"><Input placeholder="https://facebook.com/…" {...register("facebook_url")} className={inputCls} /></FieldRow>
                <FieldRow label="Instagram"><Input placeholder="https://instagram.com/…" {...register("instagram_url")} className={inputCls} /></FieldRow>
                <FieldRow label="Website"><Input placeholder="https://…" {...register("website_url")} className={inputCls} /></FieldRow>
                <FieldRow label="LINE ID"><Input placeholder="your.line.id" {...register("line_id")} className={inputCls} /></FieldRow>

                {/* Extra contacts */}
                <FieldRow label="More contacts" hint="Up to 3 extra contact methods.">
                  <div className="space-y-3">
                    {extraContacts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Select value={c.type} onValueChange={(v) => setExtraContacts(prev => prev.map((x, j) => j === i ? { ...x, type: v } : x))}>
                          <SelectTrigger className={`${selectTriggerCls} w-28`}><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent>{CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input value={c.value} onChange={(e) => setExtraContacts(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                          placeholder="ID or URL" className={`${inputCls} flex-1`} />
                        <PrivacyToggle value={c.public} onChange={(v) => setExtraContacts(prev => prev.map((x, j) => j === i ? { ...x, public: v } : x))} />
                        <button type="button" onClick={() => setExtraContacts(prev => prev.filter((_, j) => j !== i))}
                          className="text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {extraContacts.length < 3 && (
                      <button type="button" onClick={() => setExtraContacts(prev => [...prev, { type: "Email", value: "", public: true }])}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                        <Plus className="h-3 w-3" /> Add contact
                      </button>
                    )}
                  </div>
                </FieldRow>
              </section>

              {!isSetup && (
                <div className="pt-8 flex items-center gap-4 flex-wrap">
                  <Button type="submit" disabled={isSubmitting || !isDirty}
                    className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 disabled:opacity-40 gap-2">
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save changes
                  </Button>
                  {!isDirty && !isSubmitting && (
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--kvis-text3)]">No unsaved changes</span>
                  )}
                </div>
              )}
            </form>
          </>
        )}

        {/* ── EDUCATION TAB ────────────────────────────────────────────────── */}
        {tab === "education" && !isStudent && (
          <section>
            <SectionHead numeral="I." kicker="Schooling" title="Education" />
            {education.length === 0 && (
              <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">No education added yet.</div>
            )}
            {education.map((edu, i) => (
              <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">Education</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <PrivacyToggle value={edu.is_public ?? true} onChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, is_public: v } : x))} />
                    <button type="button" onClick={() => setEducation(prev => prev.filter((_, j) => j !== i))}
                      className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
                <FieldRow label="University">
                  <UniversityCombobox variant="underline" value={edu.uni_name} onChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, uni_name: v } : x))} onCountryChange={(c) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, country: c } : x))} />
                </FieldRow>
                <FieldRow label="Degree">
                  <Select value={edu.degree} onValueChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, degree: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>{DEGREES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                {/* Medical track - shown when degree is MD/MBBS */}
                {MED_DEGREES.includes(edu.degree) && (
                  <>
                    <div className="mt-4 mb-2 py-2 border-b border-[var(--kvis-border)]">
                      <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "var(--kvis-purple)" }}>Medical Track Details</p>
                    </div>
                
                    <FieldRow label="Medical school">
                      <Select value={edu.med_school ?? ""} onValueChange={v => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_school: v } : x))}>
                        <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select school" /></SelectTrigger>
                        <SelectContent>
                          {MED_SCHOOLS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    {edu.med_school === "Other" && (
                      <FieldRow label="Please specify">
                        <Input placeholder="School name" value={edu.uni_name} onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, uni_name: e.target.value } : x))} className={inputCls} />
                      </FieldRow>
                    )}

                    <FieldRow label="Dual degree">
                      <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                        <input type="checkbox" checked={edu.med_dual_degree ?? false}
                          onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_dual_degree: e.target.checked } : x))}
                          className="h-4 w-4 accent-foreground" />
                        <span>In a dual / concurrent degree program</span>
                      </label>
                    </FieldRow>
                    {edu.med_dual_degree && (
                      <>
                        <FieldRow label="Dual degree type">
                          <Select value={edu.med_dual_type ?? ""} onValueChange={v => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_dual_type: v } : x))}>
                            <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              {MED_DUAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FieldRow>
                        {edu.med_dual_type === "Other" && (
                          <FieldRow label="Please specify">
                            <Input placeholder="Dual degree type" value={edu.med_dual_field ?? ""} onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_dual_field: e.target.value } : x))} className={inputCls} />
                          </FieldRow>
                        )}
                        <FieldRow label="Second field">
                          <Input placeholder="e.g. Biomedical Engineering" value={edu.med_dual_field ?? ""} onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_dual_field: e.target.value } : x))} className={inputCls} />
                        </FieldRow>
                      </>
                    )}

                    <FieldRow label="Hospital / site" hint="Clinical affiliation (optional).">
                      <Input placeholder="e.g. Siriraj Hospital" value={edu.med_hospital ?? ""} onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_hospital: e.target.value } : x))} className={inputCls} />
                    </FieldRow>
                  
                    <FieldRow label="Specialties" hint="Multi-select.">
                      <TagPills
                        options={MED_SPECIALTIES}
                        selected={edu.med_specialties ?? []}
                        onChange={v => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_specialties: v } : x))}
                      />
                      {(edu.med_specialties ?? []).includes("Other") && (
                        <Input placeholder="Please specify" className={`${inputCls} mt-2`}
                          value={edu.med_subspecialty ?? ""}
                          onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_subspecialty: e.target.value } : x))} />
                      )}
                    </FieldRow>
                    
                    <FieldRow label="Sub-specialty" hint="Specific areas of interest (optional).">
                      <Input placeholder="e.g. Interventional Cardiology"
                        value={edu.med_subspecialty ?? ""}
                        onChange={e => setEducation(prev => prev.map((x, j) => j === i ? { ...x, med_subspecialty: e.target.value } : x))}
                        className={inputCls} />
                    </FieldRow>
                  </>
                )}
                {!MED_DEGREES.includes(edu.degree) && (
                <>
                  <FieldRow label="Major (1)" required>
                    <MajorCombobox variant="underline" value={edu.major} onChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, major: v } : x))} />
                  </FieldRow>
                  <FieldRow label="Major (2)" hint="Optional.">
                    <Input placeholder="Second major" value={edu.major2 ?? ""} onChange={(e) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, major2: e.target.value } : x))} className={inputCls} />
                  </FieldRow>
                  <FieldRow label="Minors" hint="Optional, comma-separated.">
                    <Input placeholder="e.g. Statistics, Philosophy" value={edu.minor1 ?? ""} onChange={(e) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, minor1: e.target.value } : x))} className={inputCls} />
                  </FieldRow>
                </>
              )}
                <FieldRow label="Country">
                  <CountrySelect variant="underline" value={edu.country} onChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, country: v, state: CITY_STATE_COUNTRIES.has(v) ? v : "" } : x))} />
                </FieldRow>
                {!CITY_STATE_COUNTRIES.has(edu.country) && (
                  <FieldRow label="City">
                    <CitySelect variant="underline" country={edu.country} value={edu.state ?? ""} onChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, state: v } : x))} />
                  </FieldRow>
                )}
                <FieldRow label="Years">
                  <div className="flex items-center gap-3">
                    <Input type="number" placeholder="From" value={edu.start_year ?? ""} onChange={(e) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-20`} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] shrink-0 text-[var(--kvis-text3)]">to</span>
                    <Input type="number" placeholder="To" value={edu.end_year ?? ""} onChange={(e) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-20`} />
                  </div>
                </FieldRow>
                {/* Scholarship */}
                <FieldRow label="Scholarship">
                  <Select value={edu.scholarship ?? ""} onValueChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, scholarship: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select scholarship" /></SelectTrigger>
                    <SelectContent>{SCHOLARSHIP_NAMES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                {edu.scholarship && (
                  <>
                    <FieldRow label="Funding type">
                      <Select value={edu.scholarship_type ?? ""} onValueChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, scholarship_type: v } : x))}>
                        <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>{SCHOLARSHIP_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Bond status">
                      <Select value={edu.scholarship_bond ?? ""} onValueChange={(v) => setEducation(prev => prev.map((x, j) => j === i ? { ...x, scholarship_bond: v } : x))}>
                        <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select bond status" /></SelectTrigger>
                        <SelectContent>{SCHOLARSHIP_BOND.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                  </>
                )}
              </div>
            ))}
            <div className="pt-8 flex items-center gap-4 flex-wrap">
              {!isSetup && (
                <Button type="button" onClick={saveEducation} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2">
                  <Check className="h-3.5 w-3.5" /> Save education
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setEducation(prev => [...prev, { uni_name: "", degree: "", major: "", country: "", is_public: true }])}
                className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}

        {/* ── CAREER TAB ───────────────────────────────────────────────────── */}
        {tab === "career" && !isStudent && (
          <section>
            <SectionHead numeral="I." kicker="Work" title="What you do" />
            {career.length === 0 && (
              <div className="py-10 border-b border-[var(--kvis-border)] text-sm text-muted-foreground italic">No positions added yet.</div>
            )}
            {career.map((job, i) => (
              <div key={i} className="py-7 border-b border-[var(--kvis-border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-xs uppercase tracking-[0.26em] font-bold text-[var(--kvis-text3)]">Position</span>
                    {job.is_current && (
                      <span className="px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.22em] leading-none text-white" style={{ background: "var(--kvis-green-light)" }}>Current</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <PrivacyToggle value={job.is_public ?? true} onChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, is_public: v } : x))} />
                    <button type="button" onClick={() => setCareer(prev => prev.filter((_, j) => j !== i))}
                      className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 hover:text-foreground transition-colors text-[var(--kvis-text3)]">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
                <FieldRow label="Job title">
                  <Input placeholder="e.g. ML Engineer" value={job.job_title} onChange={(e) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, job_title: e.target.value } : x))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Employer">
                  <Input placeholder="e.g. Google" value={job.employer} onChange={(e) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, employer: e.target.value } : x))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Company type">
                  <Select value={job.company_type ?? ""} onValueChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, company_type: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{COMPANY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Industry">
                  <Select value={job.industry_sector ?? ""} onValueChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, industry_sector: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_SECTORS.map(g => (
                        <SelectGroup key={g.group}>
                          <SelectLabel>{g.group}</SelectLabel>
                          {g.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Role type">
                  <Select value={job.role_type ?? ""} onValueChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, role_type: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select role type" /></SelectTrigger>
                    <SelectContent>{ROLE_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Field">
                  <Select value={job.job_field} onValueChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, job_field: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select field" /></SelectTrigger>
                    <SelectContent>{JOB_FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Country">
                  <CountrySelect variant="underline" value={job.country} onChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, country: v, state: CITY_STATE_COUNTRIES.has(v) ? v : "" } : x))} />
                </FieldRow>
                {!CITY_STATE_COUNTRIES.has(job.country) && (
                  <FieldRow label="City">
                    <CitySelect variant="underline" country={job.country} value={job.state ?? ""} onChange={(v) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, state: v } : x))} />
                  </FieldRow>
                )}
                <FieldRow label="Years">
                  <div className="flex items-center gap-3">
                    <Input type="number" placeholder="From" value={job.start_year ?? ""} onChange={(e) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, start_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-20`} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] shrink-0 text-[var(--kvis-text3)]">to</span>
                    <Input type="number" placeholder="To" value={job.is_current ? new Date().getFullYear() : (job.end_year ?? "")} disabled={job.is_current} onChange={(e) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, end_year: parseInt(e.target.value) || undefined } : x))} className={`${inputCls} w-20 disabled:opacity-40`} />
                  </div>
                </FieldRow>
                {job.start_year && (
                  <FieldRow label="Status">
                    <label className="inline-flex items-center gap-2.5 text-sm text-foreground cursor-pointer pt-1.5">
                      <input type="checkbox" checked={job.is_current} onChange={(e) => setCareer(prev => prev.map((x, j) => j === i ? { ...x, is_current: e.target.checked } : x))} className="h-4 w-4 accent-foreground" />
                      <span>I currently work here</span>
                    </label>
                  </FieldRow>
                )}
              </div>
            ))}
            <div className="pt-8 flex items-center gap-4 flex-wrap">
              {!isSetup && (
                <Button type="button" onClick={saveCareer} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2">
                  <Check className="h-3.5 w-3.5" /> Save career
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setCareer(prev => [...prev, { job_title: "", employer: "", job_field: "", country: "", is_current: false, is_public: true }])}
                className="h-auto rounded-none border-foreground bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-foreground hover:bg-foreground hover:text-background gap-2">
                <Plus className="h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </section>
        )}

        {/* ── RESEARCH TAB ─────────────────────────────────────────────────── */}
        {tab === "research" && (
          <section>
            {isStudent && (
              <div className="mt-8 mb-2 py-3 border-b border-[var(--kvis-border)]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "var(--kvis-purple)" }}>For students</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--kvis-text2)" }}>Share your research interests and ongoing projects - this is what other Kvisians will see when they look you up.</p>
              </div>
            )}
            <SectionHead numeral="I." kicker="Research" title="Areas of interest" />
            <div className="py-4 border-b border-[var(--kvis-border)]">
              {RESEARCH_CATEGORIES.map(cat => (
                <div key={cat.group} className="pt-5 pb-4 border-b border-[var(--kvis-border)]">
                  <p className="text-xs font-bold uppercase tracking-[0.26em] text-foreground mb-3">{cat.group}</p>
                  <TagPills options={cat.options} selected={researchInterests} onChange={setResearchInterests} />
                </div>
              ))}
            </div>

            <SectionHead numeral="II." kicker="Research" title="Keywords" />
            <FieldRow label="Keywords" hint="Specific topics, techniques, or terms.">
              <Input placeholder="e.g. CRISPR, Perovskites, NLP, Smart Grids" value={researchKeywords} onChange={e => setResearchKeywords(e.target.value)} className={inputCls} />
            </FieldRow>

            <SectionHead numeral="III." kicker="Research" title="Projects" />
            {projects.map((p, i) => (
              <div key={i} className="py-5 border-b border-[var(--kvis-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono tabular-nums text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => setProjects(prev => prev.filter((_, j) => j !== i))}
                    className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 text-[var(--kvis-text3)] hover:text-foreground">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                <FieldRow label="Title" required>
                  <Input value={p.title} onChange={e => setProjects(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Advisor / PI">
                  <Input placeholder="Name" value={p.advisor ?? ""} onChange={e => setProjects(prev => prev.map((x, j) => j === i ? { ...x, advisor: e.target.value } : x))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Advisor 2">
                  <Input placeholder="Name (optional)" value={p.advisor2 ?? ""} onChange={e => setProjects(prev => prev.map((x, j) => j === i ? { ...x, advisor2: e.target.value } : x))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Description">
                  <Textarea rows={3} value={p.description ?? ""} onChange={e => setProjects(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} className={`${inputCls} min-h-[80px]`} />
                </FieldRow>
                <FieldRow label="Status">
                  <Select value={p.status} onValueChange={v => setProjects(prev => prev.map((x, j) => j === i ? { ...x, status: v } : x))}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Link">
                  <Input placeholder="https://github.com/…" value={p.link ?? ""} onChange={e => setProjects(prev => prev.map((x, j) => j === i ? { ...x, link: e.target.value } : x))} className={inputCls} />
                </FieldRow>
              </div>
            ))}
            {projects.length < 5 && (
              <button type="button" onClick={() => setProjects(prev => [...prev, { title: "", status: "Ongoing" }])}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add project
              </button>
            )}

            <SectionHead numeral="IV." kicker="Research" title="Publications" />
            {publications.map((p, i) => (
              <div key={i} className="py-5 border-b border-[var(--kvis-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono tabular-nums text-[var(--kvis-text3)]">{String(i + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => setPublications(prev => prev.filter((_, j) => j !== i))}
                    className="text-xs font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5 text-[var(--kvis-text3)] hover:text-foreground">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                <FieldRow label="Citation" hint="Paste APA style.">
                  <Textarea rows={3} value={p.citation} onChange={e => setPublications(prev => prev.map((x, j) => j === i ? { ...x, citation: e.target.value } : x))} className={`${inputCls} min-h-[80px]`} />
                </FieldRow>
                <FieldRow label="DOI / Link">
                  <Input placeholder="https://doi.org/…" value={p.doi ?? ""} onChange={e => setPublications(prev => prev.map((x, j) => j === i ? { ...x, doi: e.target.value } : x))} className={inputCls} />
                </FieldRow>
              </div>
            ))}
            {publications.length < 5 && (
              <button type="button" onClick={() => setPublications(prev => [...prev, { citation: "" }])}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add publication
              </button>
            )}

            <SectionHead numeral="V." kicker="Research" title="Portfolio links" />
            {portfolioLinks.map((l, i) => (
              <div key={i} className="py-3 border-b border-[var(--kvis-border)]">
                <div className="flex items-center gap-3">
                  <Select value={l.type} onValueChange={v => setPortfolioLinks(prev => prev.map((x, j) => j === i ? { ...x, type: v } : x))}>
                    <SelectTrigger className={`${selectTriggerCls} w-36`}><SelectValue /></SelectTrigger>
                    <SelectContent>{PORTFOLIO_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="https://…" value={l.url} onChange={e => setPortfolioLinks(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => setPortfolioLinks(prev => prev.filter((_, j) => j !== i))}
                    className="text-[var(--kvis-text3)] hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {portfolioLinks.length < 3 && (
              <button type="button" onClick={() => setPortfolioLinks(prev => [...prev, { type: "GitHub", url: "" }])}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add link
              </button>
            )}

            {!isSetup && (
              <div className="pt-8">
                <Button type="button" onClick={saveResearch} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2">
                  <Check className="h-3.5 w-3.5" /> Save research
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ── PERSONAL TAB ─────────────────────────────────────────────────── */}
        {tab === "personal" && (
          <section>
            <SectionHead numeral="I." kicker="Personal · KVIS only" title="Personality & vibe" />
            <FieldRow label="Zodiac">
              <Select defaultValue={me.zodiac ?? undefined} onValueChange={v => userApi.updateMe({ zodiac: v }).then(refetch)}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select sign" /></SelectTrigger>
                <SelectContent>{ZODIAC_SIGNS.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Chronotype">
              <Select defaultValue={me.chronotype ?? undefined} onValueChange={v => userApi.updateMe({ chronotype: v }).then(refetch)}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{CHRONOTYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Languages">
              <div className="space-y-2">
                {languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={l.lang} onValueChange={v => setLanguages(prev => prev.map((x, j) => j === i ? { ...x, lang: v } : x))}>
                      <SelectTrigger className={`${selectTriggerCls} w-28`}><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={l.proficiency ?? ""} onValueChange={v => setLanguages(prev => prev.map((x, j) => j === i ? { ...x, proficiency: v } : x))}>
                      <SelectTrigger className={`${selectTriggerCls} w-24`}><SelectValue placeholder="Level" /></SelectTrigger>
                      <SelectContent>{LANGUAGE_PROFICIENCY.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <button type="button" onClick={() => setLanguages(prev => prev.filter((_, j) => j !== i))}
                      className="text-[var(--kvis-text3)] hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setLanguages(prev => [...prev, { lang: "Thai" }])}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--kvis-text3)] hover:text-foreground transition-colors">
                  <Plus className="h-3 w-3" /> Add language
                </button>
              </div>
            </FieldRow>

            <SectionHead numeral="II." kicker="Personal · KVIS only" title="KVIS nostalgia" />
            <FieldRow label="Fav menu">
              <Input placeholder="e.g. ข้าวไข่เจียว" value={kvisFavMenu} onChange={e => setKvisFavMenu(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Fav event">
              <Input placeholder="e.g. Science Fair" value={kvisFavEvent} onChange={e => setKvisFavEvent(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Fav area">
              <Input placeholder="e.g. The pond" value={kvisFavArea} onChange={e => setKvisFavArea(e.target.value)} className={inputCls} />
            </FieldRow>

            <SectionHead numeral="III." kicker="Personal · KVIS only" title="Hobbies & interests" />
            {(Object.entries(HOBBIES) as [string, string[]][]).map(([cat, opts]) => (
              <div key={cat} className="pt-5 pb-4 border-b border-[var(--kvis-border)]">
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-foreground mb-3">
                  {cat.replace(/_/g, " ")}
                </p>
                <TagPills
                  options={opts}
                  selected={hobbies[cat] ?? []}
                  onChange={v => setHobbies(prev => ({ ...prev, [cat]: v }))}
                />
              </div>
            ))}

            {!isSetup && (
              <div className="pt-8">
                <Button type="button" onClick={savePersonal} className="h-auto rounded-none bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.28em] text-background hover:bg-foreground/90 gap-2">
                  <Check className="h-3.5 w-3.5" /> Save personal
                </Button>
              </div>
            )}
          </section>
        )}

      </div>
      {isSetup && (
        <div className="sticky bottom-0 left-0 right-0 z-50 border-t border-[var(--kvis-border)] bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4">
          {/* Step indicator */}
          {(() => {
            const tabs = isStudent
              ? ["general", "research", "personal"]
              : ["general", "education", "career", "research", "personal"];
            const idx = tabs.indexOf(tab);
            return (
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-2xl tabular-nums" style={{ color: "var(--kvis-green-light)", letterSpacing: "-0.02em" }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex gap-1">
                  {tabs.map((t, j) => (
                    <div key={t} className="h-1 w-6 transition-colors" style={{ background: j <= idx ? "var(--kvis-purple)" : "var(--kvis-border)" }} />
                  ))}
                </div>
                <span className="text-xs uppercase tracking-[0.22em] hidden sm:block" style={{ color: "var(--kvis-text2)" }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-3">
            {tab !== "general" && (
              <button type="button"
                onClick={() => {
                  const tabs = isStudent
                    ? ["general", "research", "personal"]
                    : ["general", "education", "career", "research", "personal"];
                  const idx = tabs.indexOf(tab);
                  if (idx > 0) setTab(tabs[idx - 1] as Tab);
                }}
                className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold uppercase tracking-[0.28em] border border-[var(--kvis-border)] bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            {(() => {
              const tabs = isStudent
                ? ["general", "research", "personal"]
                : ["general", "education", "career", "research", "personal"];
              const isLast = tabs.indexOf(tab) === tabs.length - 1;
              return isLast ? (
                <button type="button"
                  onClick={async () => {
                    try {
                      if (tab === "general") await handleSubmit(saveGeneral)();
                      else if (tab === "education") await saveEducation();
                      else if (tab === "career") await saveCareer();
                      else if (tab === "research") await saveResearch();
                      else if (tab === "personal") await savePersonal();
                    } catch { /* ignore */ }
                    try {
                      await userApi.updateMe({ profile_setup_done: true });
                      await refetch();
                      router.push("/kvisian");
                    } catch {
                      notify.error("Something went wrong, try again.");
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity">
                  <Check className="h-3.5 w-3.5" /> Done - take me in
                </button>
              ) : (
                <button type="button"
                  onClick={async () => {
                    const idx = tabs.indexOf(tab);
                    const next = tabs[idx + 1] as Tab;
                    try {
                      if (tab === "general") await handleSubmit(saveGeneral)();
                      else if (tab === "education") await saveEducation();
                      else if (tab === "career") await saveCareer();
                      else if (tab === "research") await saveResearch();
                      else if (tab === "personal") await savePersonal();
                    } catch { /* don't block */ }
                    setTab(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.28em] bg-foreground text-background hover:bg-foreground/90 transition-opacity">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
