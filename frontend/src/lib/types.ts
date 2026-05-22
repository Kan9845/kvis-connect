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
  // Set only while a user is still enrolled at KVIS. M.4=10, M.5=11, M.6=12.
  current_grade?: number;
  // Numerical classroom, 1-4.
  current_class?: number;
  // Elemental house: earth, water, air, fire (~18 students each).
  current_elemental?: "earth" | "water" | "air" | "fire";
  education: Education[];
  career: Career[];
}

export interface UserPublic extends UserCard {
  latitude?: number;
  longitude?: number;
  bio?: string;
  interests?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
}

export interface UserMe extends UserPublic {
  email: string;
  line_id?: string;
  email_verified: boolean;
  is_verified: boolean;
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
