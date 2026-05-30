export interface Education {
  id: string;
  uni_name: string;
  degree: string;
  major: string;
  major2?: string;
  minor1?: string;
  minor2?: string;
  minor3?: string;
  country: string;
  state?: string;
  scholarship?: string;
  scholarship_type?: string;
  scholarship_bond?: string;
  start_year?: number;
  start_month?: number;
  end_year?: number;
  end_month?: number;
  is_public?: boolean;
  // Medical track fields
  med_school?: string;
  med_dual_degree?: boolean;
  med_dual_type?: string;
  med_dual_field?: string;
  med_hospital?: string;
  med_specialties?: string[];
  med_subspecialty?: string;
}

export interface Career {
  id: string;
  job_title: string;
  employer: string;
  job_field: string;
  company_type?: string;
  industry_sector?: string;
  role_type?: string;
  country: string;
  state?: string;
  is_current: boolean;
  start_year?: number;
  start_month?: number;
  end_year?: number;
  end_month?: number;
  scholarship_bond?: string;
  is_public?: boolean;
}

export interface UserCard {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  kvis_year?: number;
  place?: string;
  country?: string;
  profile_pic_url?: string;
  mbti?: string;
  interests?: string;
  current_grade?: number;
  current_class?: number;
  current_elemental?: "earth" | "water" | "air" | "fire";
  education: Education[];
  career: Career[];
}

export interface UserPublic extends UserCard {
  latitude?: number;
  longitude?: number;
  bio?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website_url?: string;
  is_verified: boolean;
  created_at: string;

  // Page 1
  nickname?: string;
  nickname_public?: boolean;
  current_status?: string;
  contact_email?: string;
  contact_email_public?: boolean;
  extra_contacts?: { type: string; value: string; public: boolean }[];
  place_level2?: string;

  // Page 4
  research_interests?: string[];
  research_keywords?: string;
  projects?: {
    title: string;
    advisor?: string;
    advisor2?: string;
    description?: string;
    status: string;
    link?: string;
  }[];
  publications?: { citation: string; doi?: string }[];
  portfolio_links?: { type: string; url: string }[];

  // Page 5
  zodiac?: string;
  chronotype?: string;
  languages?: { lang: string; proficiency?: string }[];
  kvis_fav_menu?: string;
  kvis_fav_event?: string;
  kvis_fav_area?: string;
  hobbies?: {
    beverages?: string[];
    fitness?: string[];
    sports?: string[];
    gaming?: string[];
    music?: string[];
    instruments?: string[];
    creative?: string[];
    books?: string[];
    other?: string[];
  };

  // Privacy
  interests_public?: boolean;
}

export interface UserMe extends UserPublic {
  email: string;
  line_id?: string;
  email_verified: boolean;
  kvis_email?: string;
  profile_setup_done: boolean;
}

export interface GlobePin {
  user_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  latitude: number;
  longitude: number;
  place?: string;
  kvis_year?: number;
  profile_pic_url?: string;
  mbti?: string;
  current_job?: string;
  country?: string;
}

export interface BlogAuthor {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  profile_pic_url?: string;
  kvis_year?: number;
}

export interface BlogRead {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover_image_url?: string;
  tags?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  author: BlogAuthor;
  likes?: number;
  comments_enabled?: boolean;
}

export interface BlogDetail extends BlogRead {
  content: string;
}

export interface BlogComment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: {
    id: string;
    slug: string;
    first_name: string;
    last_name: string;
    profile_pic_url?: string;
    kvis_year?: number;
  };
  replies?: BlogComment[];
}

export interface Summary {
  total: number;
  by_kvis_year: Record<string, number>;
  by_country: Record<string, number>;
  by_job_field: Record<string, number>;
  by_degree: Record<string, number>;
  by_mbti: Record<string, number>;
}

export interface SearchParams {
  name?: string;
  kvis_year?: number;
  country?: string;
  uni_name?: string;
  degree?: string;
  major?: string;
  scholarship?: string;
  job_title?: string;
  employer?: string;
  job_field?: string;
  sort?: "name" | "kvis_year" | "created_at";
  order?: "asc" | "desc";
}