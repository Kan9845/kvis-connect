import { z } from "zod";

export const generalSchema = z.object({
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

export type GeneralForm = z.infer<typeof generalSchema>;
export type Tab = "general" | "education" | "career" | "research" | "personal";
