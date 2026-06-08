export interface Education {
  id: string;
  uni_name: string;
  degree: string;
  major: string;
  country: string;
  state?: string;
  scholarship?: string;
  start_year?: number;
  end_year?: number;
  is_public?: boolean;
  major2?: string;
  minor1?: string;
  med_school?: string;
  med_dual_degree?: boolean;
  med_dual_type?: string;
  med_dual_field?: string;
  med_hospital?: string;
  med_specialties?: string[];
  med_subspecialty?: string;
  scholarship_type?: string;
  scholarship_bond?: string;
}

export interface Career {
  id: string;
  job_title: string;
  employer: string;
  job_field: string;
  country: string;
  state?: string;
  is_current: boolean;
  start_year?: number;
  end_year?: number;
  is_public?: boolean;
  company_type?: string;
  industry_sector?: string;
  role_type?: string;
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
  // Faculty fields
  teach_department?: string;
  teach_start_year?: number;
  teach_end_year?: number;
  is_current_teacher?: boolean;
  education: Education[];
  career: Career[];
  current_status?: string;
  nickname?: string;
  instagram_url?: string;
}

export interface UserPublic extends UserCard {
  teach_department?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website_url?: string;
  is_verified: boolean;
  created_at: string;
}

export interface UserMe extends UserPublic {
  teach_department?: string;
  expected_grad_year?: number;
  email: string;
  line_id?: string;
  email_verified: boolean;
  kvis_email?: string;
  profile_setup_done: boolean;
  nickname_public?: boolean;
  place_level2?: string;
  zodiac?: string;
  chronotype?: string;
  contact_email?: string;
  contact_email_public?: boolean;
  interests_public?: boolean;
  research_interests?: string[];
  research_keywords?: string;
  projects?: any[];
  publications?: any[];
  portfolio_links?: any[];
  languages?: { lang: string; proficiency?: string }[];
  hobbies?: Record<string, string[]>;
  kvis_fav_menu?: string;
  kvis_fav_event?: string;
  kvis_fav_area?: string;
}

export interface GlobePin {
  user_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  latitude?: number | null;
  longitude?: number | null;
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
}

export interface BlogDetail extends BlogRead {
  content: string;
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

export interface DirectoryCard {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  kvis_year?: number;
  expected_grad_year?: number;
  current_grade?: number;
  teach_start_year?: number;
  teach_end_year?: number;
  is_current_teacher?: boolean;
  profile_pic_url?: string;
  country?: string;
  place?: string;
  mbti?: string;
  interests?: string;
  is_verified?: boolean;
  // Flat career/edu fields from the directory SQL query
  job_title?: string;
  employer?: string;
  job_field?: string;
  edu_major?: string;
  edu_degree?: string;
  edu_uni?: string;
}