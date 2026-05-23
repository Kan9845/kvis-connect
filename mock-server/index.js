const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: /^http:\/\/localhost(:\d+)?$/,
    credentials: true,
  })
);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALUMNI = [
  {
    id: 1,
    slug: "somsak-khamchoo",
    email: "somsak.k@kvis.ac.th",
    first_name: "Somsak",
    last_name: "Khamchoo",
    kvis_year: 14,
    place: "San Francisco, USA",
    latitude: 37.7749,
    longitude: -122.4194,
    country: "USA",
    profile_pic_url: null,
    bio: "Machine learning researcher passionate about NLP and Thai language processing.",
    mbti: "INTJ",
    interests: "AI, chess, hiking",
    facebook_url: null,
    linkedin_url: "https://linkedin.com/in/somsakk",
    website_url: null,
    line_id: null,
    email_verified: true,
    is_verified: true,
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-03-01T10:00:00Z",
    education: [
      { id: 1, uni_name: "MIT", degree: "Master", major: "Computer Science", country: "USA", state: "Massachusetts", scholarship: "DPST", start_year: 2020, end_year: 2022 },
    ],
    career: [
      { id: 1, job_title: "ML Engineer", employer: "Google", job_field: "Technology", country: "USA", state: "California", is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 2,
    email: "nattakorn.p@kvis.ac.th",
    first_name: "Nattakorn",
    last_name: "Phongsuwan",
    kvis_year: 16,
    place: "London, UK",
    latitude: 51.5074,
    longitude: -0.1278,
    country: "UK",
    profile_pic_url: null,
    bio: "Aerospace engineer working on satellite systems.",
    mbti: "ENTP",
    interests: "Rocketry, astronomy, photography",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-15T08:00:00Z", updated_at: "2024-02-10T08:00:00Z",
    education: [
      { id: 2, uni_name: "Imperial College London", degree: "Master", major: "Aerospace Engineering", country: "UK", state: null, scholarship: "Royal Thai Government", start_year: 2019, end_year: 2021 },
    ],
    career: [
      { id: 2, job_title: "Satellite Systems Engineer", employer: "Airbus", job_field: "Engineering", country: "UK", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 3,
    email: "pimchanok.s@kvis.ac.th",
    first_name: "Pimchanok",
    last_name: "Srithai",
    kvis_year: 18,
    place: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    country: "Japan",
    profile_pic_url: null,
    bio: "Biochemistry PhD student studying protein folding.",
    mbti: "INFJ",
    interests: "Biology, cooking, anime",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-01T08:00:00Z", updated_at: "2024-02-01T08:00:00Z",
    education: [
      { id: 3, uni_name: "University of Tokyo", degree: "PhD", major: "Biochemistry", country: "Japan", state: null, scholarship: "MEXT", start_year: 2022, end_year: null },
    ],
    career: [],
  },
  {
    id: 4,
    email: "chaiwat.n@kvis.ac.th",
    first_name: "Chaiwat",
    last_name: "Nakorn",
    kvis_year: 12,
    place: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    country: "Singapore",
    profile_pic_url: null,
    bio: "Quantitative analyst at a leading hedge fund.",
    mbti: "ISTJ",
    interests: "Finance, statistics, golf",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/chaiwatn", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-20T08:00:00Z", updated_at: "2024-03-15T08:00:00Z",
    education: [
      { id: 4, uni_name: "NUS", degree: "Bachelor", major: "Mathematics", country: "Singapore", state: null, scholarship: "DPST", start_year: 2013, end_year: 2017 },
      { id: 5, uni_name: "London School of Economics", degree: "Master", major: "Financial Mathematics", country: "UK", state: null, scholarship: null, start_year: 2017, end_year: 2018 },
    ],
    career: [
      { id: 3, job_title: "Quantitative Analyst", employer: "Citadel", job_field: "Finance", country: "Singapore", state: null, is_current: true, start_year: 2019, end_year: null },
    ],
  },
  {
    id: 5,
    email: "wipawee.t@kvis.ac.th",
    first_name: "Wipawee",
    last_name: "Taweerat",
    kvis_year: 20,
    place: "Sydney, Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    country: "Australia",
    profile_pic_url: null,
    bio: "Marine biologist studying coral reef ecosystems.",
    mbti: "ENFP",
    interests: "Ocean, diving, environmental activism",
    facebook_url: null, linkedin_url: null, website_url: "https://wipawee.science", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-15T08:00:00Z", updated_at: "2024-02-15T08:00:00Z",
    education: [
      { id: 6, uni_name: "University of Queensland", degree: "PhD", major: "Marine Biology", country: "Australia", state: "Queensland", scholarship: "Australia Awards", start_year: 2021, end_year: null },
    ],
    career: [],
  },
  {
    id: 6,
    email: "thanet.w@kvis.ac.th",
    first_name: "Thanet",
    last_name: "Wiriya",
    kvis_year: 15,
    place: "Munich, Germany",
    latitude: 48.1351,
    longitude: 11.582,
    country: "Germany",
    profile_pic_url: null,
    bio: "Automotive engineer specialising in electric vehicle powertrains.",
    mbti: "ISTP",
    interests: "Cars, cycling, Bundesliga",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-25T08:00:00Z", updated_at: "2024-01-25T08:00:00Z",
    education: [
      { id: 7, uni_name: "TU Munich", degree: "Master", major: "Mechanical Engineering", country: "Germany", state: "Bavaria", scholarship: "DAAD", start_year: 2018, end_year: 2020 },
    ],
    career: [
      { id: 4, job_title: "Powertrain Engineer", employer: "BMW", job_field: "Engineering", country: "Germany", state: "Bavaria", is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 7,
    email: "sirima.c@kvis.ac.th",
    first_name: "Sirima",
    last_name: "Chantara",
    kvis_year: 22,
    place: "Boston, USA",
    latitude: 42.3601,
    longitude: -71.0589,
    country: "USA",
    profile_pic_url: null,
    bio: "Medical student at Harvard, interested in oncology.",
    mbti: "ENTJ",
    interests: "Medicine, running, piano",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-01T08:00:00Z", updated_at: "2024-03-01T08:00:00Z",
    education: [
      { id: 8, uni_name: "Harvard University", degree: "Bachelor", major: "Biology", country: "USA", state: "Massachusetts", scholarship: "DPST", start_year: 2022, end_year: null },
    ],
    career: [],
  },
  {
    id: 8,
    email: "kritsada.m@kvis.ac.th",
    first_name: "Kritsada",
    last_name: "Mongkol",
    kvis_year: 10,
    place: "Chiang Mai, Thailand",
    latitude: 18.7883,
    longitude: 98.9853,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Entrepreneur running an AgriTech startup in Northern Thailand.",
    mbti: "ESTP",
    interests: "Agriculture, startups, hiking",
    facebook_url: null, linkedin_url: null, website_url: "https://agristart.th", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-05T08:00:00Z", updated_at: "2024-02-20T08:00:00Z",
    education: [
      { id: 9, uni_name: "Chiang Mai University", degree: "Bachelor", major: "Agricultural Science", country: "Thailand", state: null, scholarship: null, start_year: 2011, end_year: 2015 },
    ],
    career: [
      { id: 5, job_title: "Co-Founder & CEO", employer: "AgriStart", job_field: "Business", country: "Thailand", state: null, is_current: true, start_year: 2018, end_year: null },
    ],
  },
  {
    id: 9,
    email: "parichat.r@kvis.ac.th",
    first_name: "Parichat",
    last_name: "Rungrot",
    kvis_year: 17,
    place: "Paris, France",
    latitude: 48.8566,
    longitude: 2.3522,
    country: "France",
    profile_pic_url: null,
    bio: "Fashion designer blending Thai textile heritage with contemporary style.",
    mbti: "ISFP",
    interests: "Fashion, art, travel",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-05T08:00:00Z", updated_at: "2024-02-05T08:00:00Z",
    education: [
      { id: 10, uni_name: "Institut Français de la Mode", degree: "Master", major: "Fashion Design", country: "France", state: null, scholarship: null, start_year: 2019, end_year: 2021 },
    ],
    career: [
      { id: 6, job_title: "Senior Designer", employer: "Louis Vuitton", job_field: "Creative Arts", country: "France", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 10,
    email: "thanakit.b@kvis.ac.th",
    first_name: "Thanakit",
    last_name: "Buranasiri",
    kvis_year: 19,
    place: "Toronto, Canada",
    latitude: 43.6532,
    longitude: -79.3832,
    country: "Canada",
    profile_pic_url: null,
    bio: "Data scientist at a major Canadian bank.",
    mbti: "INTP",
    interests: "Statistics, board games, skiing",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/thanakitb", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-30T08:00:00Z", updated_at: "2024-03-10T08:00:00Z",
    education: [
      { id: 11, uni_name: "University of Toronto", degree: "Master", major: "Statistics", country: "Canada", state: "Ontario", scholarship: "Vanier CGS", start_year: 2020, end_year: 2022 },
    ],
    career: [
      { id: 7, job_title: "Senior Data Scientist", employer: "RBC", job_field: "Finance", country: "Canada", state: "Ontario", is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 11,
    email: "phakphum.a@kvis.ac.th",
    first_name: "Phakphum",
    last_name: "Aumthai",
    kvis_year: 13,
    place: "San Francisco, USA",
    latitude: 37.7749,
    longitude: -122.4194,
    country: "USA",
    profile_pic_url: null,
    bio: "Senior software engineer at a Bay Area startup.",
    mbti: "ENTP",
    interests: "Open source, coffee, surfing",
    facebook_url: null, linkedin_url: null, website_url: "https://phakphum.dev", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-12T08:00:00Z", updated_at: "2024-01-12T08:00:00Z",
    education: [
      { id: 12, uni_name: "Stanford University", degree: "Bachelor", major: "Computer Science", country: "USA", state: "California", scholarship: "DPST", start_year: 2014, end_year: 2018 },
    ],
    career: [
      { id: 8, job_title: "Staff Software Engineer", employer: "Stripe", job_field: "Technology", country: "USA", state: "California", is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 12,
    email: "wanida.ph@kvis.ac.th",
    first_name: "Wanida",
    last_name: "Pholsena",
    kvis_year: 21,
    place: "Seoul, South Korea",
    latitude: 37.5665,
    longitude: 126.978,
    country: "South Korea",
    profile_pic_url: null,
    bio: "PhD student in Materials Science, researching next-gen batteries.",
    mbti: "INFP",
    interests: "K-pop, chemistry, yoga",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-20T08:00:00Z", updated_at: "2024-02-20T08:00:00Z",
    education: [
      { id: 13, uni_name: "KAIST", degree: "PhD", major: "Materials Science", country: "South Korea", state: null, scholarship: "Korean Government Scholarship", start_year: 2023, end_year: null },
    ],
    career: [],
  },
  {
    id: 13,
    email: "nutchaya.w@kvis.ac.th",
    first_name: "Nutchaya",
    last_name: "Wongsiri",
    kvis_year: 11,
    place: "Leiden, Netherlands",
    latitude: 52.1601,
    longitude: 4.4970,
    country: "Netherlands",
    profile_pic_url: null,
    bio: "Theoretical physicist working on quantum computing algorithms.",
    mbti: "INTP",
    interests: "Quantum mechanics, classical music, chess",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/nutchayaw", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-08T08:00:00Z", updated_at: "2024-02-14T08:00:00Z",
    education: [
      { id: 14, uni_name: "Leiden University", degree: "PhD", major: "Physics", country: "Netherlands", state: null, scholarship: "DPST", start_year: 2019, end_year: 2023 },
    ],
    career: [
      { id: 9, job_title: "Quantum Research Scientist", employer: "QuTech", job_field: "Research", country: "Netherlands", state: null, is_current: true, start_year: 2023, end_year: null },
    ],
  },
  {
    id: 14,
    email: "rattana.c@kvis.ac.th",
    first_name: "Rattana",
    last_name: "Chailek",
    kvis_year: 20,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Policy analyst at the National Science and Technology Development Agency.",
    mbti: "INFJ",
    interests: "Public policy, literature, cycling",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-22T08:00:00Z", updated_at: "2024-01-22T08:00:00Z",
    education: [
      { id: 15, uni_name: "Mahidol University", degree: "Bachelor", major: "Computer Science", country: "Thailand", state: null, scholarship: null, start_year: 2018, end_year: 2022 },
    ],
    career: [
      { id: 10, job_title: "Policy Analyst", employer: "NSTDA", job_field: "Government", country: "Thailand", state: null, is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 15,
    email: "arnon.s@kvis.ac.th",
    first_name: "Arnon",
    last_name: "Siripong",
    kvis_year: 16,
    place: "Zurich, Switzerland",
    latitude: 47.3769,
    longitude: 8.5417,
    country: "Switzerland",
    profile_pic_url: null,
    bio: "Risk manager at a global investment bank, specialising in derivatives.",
    mbti: "ISTJ",
    interests: "Finance, skiing, watches",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/arnons", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-03T08:00:00Z", updated_at: "2024-03-20T08:00:00Z",
    education: [
      { id: 16, uni_name: "ETH Zurich", degree: "Master", major: "Quantitative Finance", country: "Switzerland", state: null, scholarship: "Royal Thai Government", start_year: 2018, end_year: 2020 },
    ],
    career: [
      { id: 11, job_title: "Risk Manager", employer: "UBS", job_field: "Finance", country: "Switzerland", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 16,
    email: "kanlaya.s@kvis.ac.th",
    first_name: "Kanlaya",
    last_name: "Suthep",
    kvis_year: 23,
    place: "Cambridge, UK",
    latitude: 52.2053,
    longitude: 0.1218,
    country: "UK",
    profile_pic_url: null,
    bio: "PhD candidate in neuroscience studying memory consolidation during sleep.",
    mbti: "INTJ",
    interests: "Neuroscience, meditation, rowing",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-05T08:00:00Z", updated_at: "2024-03-05T08:00:00Z",
    education: [
      { id: 17, uni_name: "University of Cambridge", degree: "PhD", major: "Neuroscience", country: "UK", state: null, scholarship: "Gates Cambridge", start_year: 2023, end_year: null },
    ],
    career: [],
  },
  {
    id: 17,
    email: "woraphat.l@kvis.ac.th",
    first_name: "Woraphat",
    last_name: "Limsakul",
    kvis_year: 15,
    place: "New York, USA",
    latitude: 40.7128,
    longitude: -74.006,
    country: "USA",
    profile_pic_url: null,
    bio: "Investment banker focused on infrastructure deals across Southeast Asia.",
    mbti: "ENTJ",
    interests: "Finance, tennis, travel",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/woraphatl", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-18T08:00:00Z", updated_at: "2024-02-28T08:00:00Z",
    education: [
      { id: 18, uni_name: "Columbia University", degree: "Bachelor", major: "Economics", country: "USA", state: "New York", scholarship: "DPST", start_year: 2013, end_year: 2017 },
    ],
    career: [
      { id: 12, job_title: "Vice President", employer: "Goldman Sachs", job_field: "Finance", country: "USA", state: "New York", is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 18,
    email: "nareerat.p@kvis.ac.th",
    first_name: "Nareerat",
    last_name: "Pongpat",
    kvis_year: 19,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Physician at Ramathibodi Hospital specialising in internal medicine.",
    mbti: "ISFJ",
    interests: "Medicine, volunteer work, cooking",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-14T08:00:00Z", updated_at: "2024-01-14T08:00:00Z",
    education: [
      { id: 19, uni_name: "Mahidol University", degree: "MD", major: "Medicine", country: "Thailand", state: null, scholarship: null, start_year: 2014, end_year: 2020 },
    ],
    career: [
      { id: 13, job_title: "Physician", employer: "Ramathibodi Hospital", job_field: "Healthcare", country: "Thailand", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 19,
    email: "surasit.t@kvis.ac.th",
    first_name: "Surasit",
    last_name: "Thammasiri",
    kvis_year: 14,
    place: "Stockholm, Sweden",
    latitude: 59.3293,
    longitude: 18.0686,
    country: "Sweden",
    profile_pic_url: null,
    bio: "Environmental engineer working on carbon capture technology.",
    mbti: "ISFJ",
    interests: "Sustainability, hiking, Nordic skiing",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-08T08:00:00Z", updated_at: "2024-02-08T08:00:00Z",
    education: [
      { id: 20, uni_name: "KTH Royal Institute of Technology", degree: "Master", major: "Environmental Engineering", country: "Sweden", state: null, scholarship: "Swedish Institute", start_year: 2017, end_year: 2019 },
    ],
    career: [
      { id: 14, job_title: "Process Engineer", employer: "Climeworks", job_field: "Engineering", country: "Sweden", state: null, is_current: true, start_year: 2019, end_year: null },
    ],
  },
  {
    id: 20,
    email: "pattaraporn.y@kvis.ac.th",
    first_name: "Pattaraporn",
    last_name: "Yodprasit",
    kvis_year: 21,
    place: "Auckland, New Zealand",
    latitude: -36.8485,
    longitude: 174.7633,
    country: "New Zealand",
    profile_pic_url: null,
    bio: "PhD candidate developing biodegradable polymers for drug delivery.",
    mbti: "INFP",
    interests: "Chemistry, hiking, photography",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-18T08:00:00Z", updated_at: "2024-02-18T08:00:00Z",
    education: [
      { id: 21, uni_name: "University of Auckland", degree: "PhD", major: "Chemistry", country: "New Zealand", state: null, scholarship: "NZ Government Scholarship", start_year: 2022, end_year: null },
    ],
    career: [],
  },
  {
    id: 21,
    email: "komkrit.s@kvis.ac.th",
    first_name: "Komkrit",
    last_name: "Saikaew",
    kvis_year: 17,
    place: "Hong Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    country: "Hong Kong",
    profile_pic_url: null,
    bio: "Asset manager focused on emerging market equities.",
    mbti: "ESTJ",
    interests: "Finance, hiking, Cantonese food",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/komkrits", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-28T08:00:00Z", updated_at: "2024-03-05T08:00:00Z",
    education: [
      { id: 22, uni_name: "University of Hong Kong", degree: "Master", major: "Finance", country: "Hong Kong", state: null, scholarship: null, start_year: 2018, end_year: 2019 },
    ],
    career: [
      { id: 15, job_title: "Portfolio Manager", employer: "BlackRock", job_field: "Finance", country: "Hong Kong", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 22,
    email: "napassorn.r@kvis.ac.th",
    first_name: "Napassorn",
    last_name: "Rattana",
    kvis_year: 22,
    place: "Los Angeles, USA",
    latitude: 34.0522,
    longitude: -118.2437,
    country: "USA",
    profile_pic_url: null,
    bio: "Software engineer at a streaming company, working on recommendation systems.",
    mbti: "ENFP",
    interests: "Music, film, machine learning",
    facebook_url: null, linkedin_url: null, website_url: "https://napassorn.dev", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-08T08:00:00Z", updated_at: "2024-03-08T08:00:00Z",
    education: [
      { id: 23, uni_name: "UCLA", degree: "Bachelor", major: "Computer Science", country: "USA", state: "California", scholarship: "DPST", start_year: 2022, end_year: null },
    ],
    career: [],
  },
  {
    id: 23,
    email: "danai.p@kvis.ac.th",
    first_name: "Danai",
    last_name: "Prompan",
    kvis_year: 12,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Director at the Ministry of Science, shaping Thailand's digital economy policy.",
    mbti: "ENTJ",
    interests: "Policy, economics, golf",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/danaip", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-06T08:00:00Z", updated_at: "2024-03-18T08:00:00Z",
    education: [
      { id: 24, uni_name: "Chulalongkorn University", degree: "Bachelor", major: "Political Science", country: "Thailand", state: null, scholarship: null, start_year: 2008, end_year: 2012 },
      { id: 25, uni_name: "NIDA", degree: "Master", major: "Public Administration", country: "Thailand", state: null, scholarship: null, start_year: 2014, end_year: 2016 },
    ],
    career: [
      { id: 16, job_title: "Director", employer: "Ministry of Science and Technology", job_field: "Government", country: "Thailand", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 24,
    email: "sutida.m@kvis.ac.th",
    first_name: "Sutida",
    last_name: "Maneerat",
    kvis_year: 18,
    place: "Edinburgh, UK",
    latitude: 55.9533,
    longitude: -3.1883,
    country: "UK",
    profile_pic_url: null,
    bio: "Genetics researcher investigating hereditary disease mechanisms.",
    mbti: "INTJ",
    interests: "Genetics, birdwatching, Scottish culture",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-12T08:00:00Z", updated_at: "2024-02-12T08:00:00Z",
    education: [
      { id: 26, uni_name: "University of Edinburgh", degree: "PhD", major: "Genetics", country: "UK", state: null, scholarship: "Chevening", start_year: 2021, end_year: null },
    ],
    career: [],
  },
  {
    id: 25,
    email: "veeraphon.k@kvis.ac.th",
    first_name: "Veeraphon",
    last_name: "Kanchanawat",
    kvis_year: 13,
    place: "Shanghai, China",
    latitude: 31.2304,
    longitude: 121.4737,
    country: "China",
    profile_pic_url: null,
    bio: "Regional business development director bridging Thai and Chinese markets.",
    mbti: "ESTP",
    interests: "Business, Mandarin, martial arts",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/veeraphonk", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-16T08:00:00Z", updated_at: "2024-02-25T08:00:00Z",
    education: [
      { id: 27, uni_name: "Peking University", degree: "Master", major: "International Business", country: "China", state: null, scholarship: "Chinese Government Scholarship", start_year: 2016, end_year: 2018 },
    ],
    career: [
      { id: 17, job_title: "Business Development Director", employer: "SCG International", job_field: "Business", country: "China", state: null, is_current: true, start_year: 2019, end_year: null },
    ],
  },
  {
    id: 26,
    email: "chalida.t@kvis.ac.th",
    first_name: "Chalida",
    last_name: "Thongkham",
    kvis_year: 20,
    place: "Melbourne, Australia",
    latitude: -37.8136,
    longitude: 144.9631,
    country: "Australia",
    profile_pic_url: null,
    bio: "Architect designing sustainable urban housing projects.",
    mbti: "ENFJ",
    interests: "Architecture, urban planning, cycling",
    facebook_url: null, linkedin_url: null, website_url: "https://chalidaarch.com", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-22T08:00:00Z", updated_at: "2024-02-22T08:00:00Z",
    education: [
      { id: 28, uni_name: "University of Melbourne", degree: "Master", major: "Architecture", country: "Australia", state: "Victoria", scholarship: "Australia Awards", start_year: 2020, end_year: 2022 },
    ],
    career: [
      { id: 18, job_title: "Architect", employer: "Hassell Studio", job_field: "Engineering", country: "Australia", state: "Victoria", is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 27,
    email: "noppadol.s@kvis.ac.th",
    first_name: "Noppadol",
    last_name: "Suwan",
    kvis_year: 16,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Cardiologist at King Chulalongkorn Memorial Hospital.",
    mbti: "ISFJ",
    interests: "Cardiology, badminton, Thai food",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-19T08:00:00Z", updated_at: "2024-02-01T08:00:00Z",
    education: [
      { id: 29, uni_name: "Chulalongkorn University", degree: "MD", major: "Medicine", country: "Thailand", state: null, scholarship: null, start_year: 2012, end_year: 2018 },
    ],
    career: [
      { id: 19, job_title: "Cardiologist", employer: "King Chulalongkorn Memorial Hospital", job_field: "Healthcare", country: "Thailand", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 28,
    email: "thitiporn.w@kvis.ac.th",
    first_name: "Thitiporn",
    last_name: "Wichaikul",
    kvis_year: 24,
    place: "Chicago, USA",
    latitude: 41.8781,
    longitude: -87.6298,
    country: "USA",
    profile_pic_url: null,
    bio: "Undergraduate studying computational chemistry at UChicago.",
    mbti: "INTP",
    interests: "Chemistry, programming, jazz",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-10T08:00:00Z", updated_at: "2024-03-10T08:00:00Z",
    education: [
      { id: 30, uni_name: "University of Chicago", degree: "Bachelor", major: "Chemistry", country: "USA", state: "Illinois", scholarship: "DPST", start_year: 2023, end_year: null },
    ],
    career: [],
  },
  {
    id: 29,
    email: "pakpoom.b@kvis.ac.th",
    first_name: "Pakpoom",
    last_name: "Burasiri",
    kvis_year: 11,
    place: "Taipei, Taiwan",
    latitude: 25.033,
    longitude: 121.5654,
    country: "Taiwan",
    profile_pic_url: null,
    bio: "Chip designer at TSMC working on next-generation semiconductor nodes.",
    mbti: "ISTJ",
    interests: "Electronics, cycling, street food",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/pakpoomb", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-09T08:00:00Z", updated_at: "2024-02-15T08:00:00Z",
    education: [
      { id: 31, uni_name: "National Taiwan University", degree: "PhD", major: "Electrical Engineering", country: "Taiwan", state: null, scholarship: "Ministry of Education Taiwan", start_year: 2015, end_year: 2020 },
    ],
    career: [
      { id: 20, job_title: "Senior Design Engineer", employer: "TSMC", job_field: "Technology", country: "Taiwan", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 30,
    email: "achara.s@kvis.ac.th",
    first_name: "Achara",
    last_name: "Supaporn",
    kvis_year: 19,
    place: "Amsterdam, Netherlands",
    latitude: 52.3676,
    longitude: 4.9041,
    country: "Netherlands",
    profile_pic_url: null,
    bio: "Data engineer building real-time analytics pipelines for a European fintech.",
    mbti: "ISTP",
    interests: "Data engineering, cycling, museums",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-27T08:00:00Z", updated_at: "2024-02-19T08:00:00Z",
    education: [
      { id: 32, uni_name: "University of Amsterdam", degree: "Master", major: "Data Science", country: "Netherlands", state: null, scholarship: null, start_year: 2020, end_year: 2022 },
    ],
    career: [
      { id: 21, job_title: "Data Engineer", employer: "Adyen", job_field: "Technology", country: "Netherlands", state: null, is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 31,
    email: "teerawit.k@kvis.ac.th",
    first_name: "Teerawit",
    last_name: "Khumdee",
    kvis_year: 15,
    place: "Berlin, Germany",
    latitude: 52.52,
    longitude: 13.405,
    country: "Germany",
    profile_pic_url: null,
    bio: "Structural engineer working on large-scale public infrastructure across Europe.",
    mbti: "ESTJ",
    interests: "Engineering, architecture, running",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-06T08:00:00Z", updated_at: "2024-02-06T08:00:00Z",
    education: [
      { id: 33, uni_name: "TU Berlin", degree: "Master", major: "Civil Engineering", country: "Germany", state: "Berlin", scholarship: "DAAD", start_year: 2017, end_year: 2019 },
    ],
    career: [
      { id: 22, job_title: "Structural Engineer", employer: "Arup", job_field: "Engineering", country: "Germany", state: "Berlin", is_current: true, start_year: 2019, end_year: null },
    ],
  },
  {
    id: 32,
    email: "monthira.r@kvis.ac.th",
    first_name: "Monthira",
    last_name: "Rojanasiri",
    kvis_year: 22,
    place: "Osaka, Japan",
    latitude: 34.6937,
    longitude: 135.5023,
    country: "Japan",
    profile_pic_url: null,
    bio: "Master's student in robotics, researching human-robot interaction.",
    mbti: "ENTP",
    interests: "Robotics, gaming, ramen",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-03T08:00:00Z", updated_at: "2024-03-03T08:00:00Z",
    education: [
      { id: 34, uni_name: "Osaka University", degree: "Master", major: "Robotics", country: "Japan", state: null, scholarship: "MEXT", start_year: 2023, end_year: null },
    ],
    career: [],
  },
  {
    id: 33,
    email: "panuwat.k@kvis.ac.th",
    first_name: "Panuwat",
    last_name: "Kongphan",
    kvis_year: 18,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Civil engineer leading infrastructure projects for Thailand's high-speed rail.",
    mbti: "ESTJ",
    interests: "Infrastructure, trains, football",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/panuwatk", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-23T08:00:00Z", updated_at: "2024-02-10T08:00:00Z",
    education: [
      { id: 35, uni_name: "Chulalongkorn University", degree: "Bachelor", major: "Civil Engineering", country: "Thailand", state: null, scholarship: null, start_year: 2015, end_year: 2019 },
    ],
    career: [
      { id: 23, job_title: "Project Engineer", employer: "State Railway of Thailand", job_field: "Engineering", country: "Thailand", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 34,
    email: "siriphan.s@kvis.ac.th",
    first_name: "Siriphan",
    last_name: "Sukwong",
    kvis_year: 14,
    place: "Seattle, USA",
    latitude: 47.6062,
    longitude: -122.3321,
    country: "USA",
    profile_pic_url: null,
    bio: "Principal engineer at Microsoft working on cloud infrastructure.",
    mbti: "INTJ",
    interests: "Cloud computing, hiking, coffee",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/siriphans", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-11T08:00:00Z", updated_at: "2024-02-05T08:00:00Z",
    education: [
      { id: 36, uni_name: "Stanford University", degree: "Master", major: "Electrical Engineering", country: "USA", state: "California", scholarship: "DPST", start_year: 2013, end_year: 2015 },
    ],
    career: [
      { id: 24, job_title: "Principal Engineer", employer: "Microsoft", job_field: "Technology", country: "USA", state: "Washington", is_current: true, start_year: 2017, end_year: null },
    ],
  },
  {
    id: 35,
    email: "nuntaporn.c@kvis.ac.th",
    first_name: "Nuntaporn",
    last_name: "Charoenwong",
    kvis_year: 21,
    place: "Geneva, Switzerland",
    latitude: 46.2044,
    longitude: 6.1432,
    country: "Switzerland",
    profile_pic_url: null,
    bio: "Global health officer at WHO, coordinating vaccine programmes in Southeast Asia.",
    mbti: "ENFJ",
    interests: "Public health, languages, hiking",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-25T08:00:00Z", updated_at: "2024-02-25T08:00:00Z",
    education: [
      { id: 37, uni_name: "Johns Hopkins University", degree: "Master", major: "Public Health", country: "USA", state: "Maryland", scholarship: "Fulbright", start_year: 2019, end_year: 2021 },
    ],
    career: [
      { id: 25, job_title: "Health Officer", employer: "World Health Organization", job_field: "Healthcare", country: "Switzerland", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 36,
    email: "atchariya.p@kvis.ac.th",
    first_name: "Atchariya",
    last_name: "Pisai",
    kvis_year: 17,
    place: "Dublin, Ireland",
    latitude: 53.3498,
    longitude: -6.2603,
    country: "Ireland",
    profile_pic_url: null,
    bio: "Backend engineer at a global tech company, building high-scale distributed systems.",
    mbti: "INTP",
    interests: "Distributed systems, Gaelic football, whiskey",
    facebook_url: null, linkedin_url: null, website_url: "https://atchariya.io", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-07T08:00:00Z", updated_at: "2024-02-07T08:00:00Z",
    education: [
      { id: 38, uni_name: "Trinity College Dublin", degree: "Bachelor", major: "Computer Science", country: "Ireland", state: null, scholarship: null, start_year: 2014, end_year: 2018 },
    ],
    career: [
      { id: 26, job_title: "Senior Backend Engineer", employer: "Meta", job_field: "Technology", country: "Ireland", state: null, is_current: true, start_year: 2020, end_year: null },
    ],
  },
  {
    id: 37,
    email: "korrakot.p@kvis.ac.th",
    first_name: "Korrakot",
    last_name: "Phetphan",
    kvis_year: 13,
    place: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    country: "Singapore",
    profile_pic_url: null,
    bio: "Postdoctoral researcher developing catalysts for green hydrogen production.",
    mbti: "INFJ",
    interests: "Chemistry, sustainability, bouldering",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-17T08:00:00Z", updated_at: "2024-01-17T08:00:00Z",
    education: [
      { id: 39, uni_name: "NUS", degree: "PhD", major: "Chemistry", country: "Singapore", state: null, scholarship: "DPST", start_year: 2016, end_year: 2021 },
    ],
    career: [
      { id: 27, job_title: "Postdoctoral Researcher", employer: "A*STAR", job_field: "Research", country: "Singapore", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 38,
    email: "jintana.s@kvis.ac.th",
    first_name: "Jintana",
    last_name: "Suwan",
    kvis_year: 20,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Paediatric surgeon at Siriraj Hospital with a focus on congenital anomalies.",
    mbti: "ISFJ",
    interests: "Surgery, Thai classical dance, gardening",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-21T08:00:00Z", updated_at: "2024-02-03T08:00:00Z",
    education: [
      { id: 40, uni_name: "Mahidol University", degree: "MD", major: "Medicine", country: "Thailand", state: null, scholarship: null, start_year: 2013, end_year: 2019 },
    ],
    career: [
      { id: 28, job_title: "Paediatric Surgeon", employer: "Siriraj Hospital", job_field: "Healthcare", country: "Thailand", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 39,
    email: "aumaporn.t@kvis.ac.th",
    first_name: "Aumaporn",
    last_name: "Tipsuk",
    kvis_year: 23,
    place: "Boston, USA",
    latitude: 42.3601,
    longitude: -71.0589,
    country: "USA",
    profile_pic_url: null,
    bio: "Graduate student studying computational biology at Harvard.",
    mbti: "INFP",
    interests: "Bioinformatics, poetry, yoga",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-06T08:00:00Z", updated_at: "2024-03-06T08:00:00Z",
    education: [
      { id: 41, uni_name: "Harvard University", degree: "Master", major: "Computational Biology", country: "USA", state: "Massachusetts", scholarship: "DPST", start_year: 2023, end_year: null },
    ],
    career: [],
  },
  {
    id: 40,
    email: "sittipong.w@kvis.ac.th",
    first_name: "Sittipong",
    last_name: "Wattana",
    kvis_year: 16,
    place: "Vancouver, Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    country: "Canada",
    profile_pic_url: null,
    bio: "Full-stack developer at a Vancouver gaming studio.",
    mbti: "ENTP",
    interests: "Game dev, snowboarding, craft beer",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-31T08:00:00Z", updated_at: "2024-02-17T08:00:00Z",
    education: [
      { id: 42, uni_name: "University of British Columbia", degree: "Master", major: "Computer Science", country: "Canada", state: "British Columbia", scholarship: null, start_year: 2019, end_year: 2021 },
    ],
    career: [
      { id: 29, job_title: "Senior Developer", employer: "Electronic Arts", job_field: "Technology", country: "Canada", state: "British Columbia", is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 41,
    email: "phornchai.k@kvis.ac.th",
    first_name: "Phornchai",
    last_name: "Kasem",
    kvis_year: 12,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Investment director at a leading Thai private equity firm.",
    mbti: "ENTJ",
    interests: "Finance, Muay Thai, whiskey",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/phornchaik", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-07T08:00:00Z", updated_at: "2024-03-12T08:00:00Z",
    education: [
      { id: 43, uni_name: "Thammasat University", degree: "Bachelor", major: "Economics", country: "Thailand", state: null, scholarship: null, start_year: 2008, end_year: 2012 },
    ],
    career: [
      { id: 30, job_title: "Investment Director", employer: "Kasikorn Bank PE", job_field: "Finance", country: "Thailand", state: null, is_current: true, start_year: 2018, end_year: null },
    ],
  },
  {
    id: 42,
    email: "nonthaburi.s@kvis.ac.th",
    first_name: "Nonthaburi",
    last_name: "Srisuk",
    kvis_year: 19,
    place: "Paris, France",
    latitude: 48.8566,
    longitude: 2.3522,
    country: "France",
    profile_pic_url: null,
    bio: "PhD candidate at the Sorbonne researching contemporary Southeast Asian art.",
    mbti: "INFP",
    interests: "Art, film, philosophy",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-09T08:00:00Z", updated_at: "2024-02-09T08:00:00Z",
    education: [
      { id: 44, uni_name: "Université Paris I Panthéon-Sorbonne", degree: "PhD", major: "Art History", country: "France", state: null, scholarship: "Franco-Thai Scholarship", start_year: 2022, end_year: null },
    ],
    career: [],
  },
  {
    id: 43,
    email: "chalermpol.s@kvis.ac.th",
    first_name: "Chalermpol",
    last_name: "Surin",
    kvis_year: 15,
    place: "Dubai, UAE",
    latitude: 25.2048,
    longitude: 55.2708,
    country: "UAE",
    profile_pic_url: null,
    bio: "Strategy consultant advising GCC governments on economic diversification.",
    mbti: "ENTJ",
    interests: "Strategy, football, desert camping",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/chalermpos", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-11T08:00:00Z", updated_at: "2024-03-01T08:00:00Z",
    education: [
      { id: 45, uni_name: "INSEAD", degree: "Master", major: "Business Administration", country: "France", state: null, scholarship: null, start_year: 2017, end_year: 2018 },
    ],
    career: [
      { id: 31, job_title: "Senior Manager", employer: "McKinsey & Company", job_field: "Business", country: "UAE", state: null, is_current: true, start_year: 2019, end_year: null },
    ],
  },
  {
    id: 44,
    email: "patcharaporn.c@kvis.ac.th",
    first_name: "Patcharaporn",
    last_name: "Chaimit",
    kvis_year: 20,
    place: "Seoul, South Korea",
    latitude: 37.5665,
    longitude: 126.978,
    country: "South Korea",
    profile_pic_url: null,
    bio: "AI researcher at Samsung focusing on on-device language models.",
    mbti: "INTJ",
    interests: "AI, K-drama, rock climbing",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-02T08:00:00Z", updated_at: "2024-03-02T08:00:00Z",
    education: [
      { id: 46, uni_name: "KAIST", degree: "Master", major: "Artificial Intelligence", country: "South Korea", state: null, scholarship: "KAIST Excellence Award", start_year: 2021, end_year: 2023 },
    ],
    career: [
      { id: 32, job_title: "AI Research Engineer", employer: "Samsung Research", job_field: "Technology", country: "South Korea", state: null, is_current: true, start_year: 2023, end_year: null },
    ],
  },
  {
    id: 45,
    email: "wannida.t@kvis.ac.th",
    first_name: "Wannida",
    last_name: "Thepsiri",
    kvis_year: 21,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Education innovation officer driving STEM curriculum reform in Thai secondary schools.",
    mbti: "ENFJ",
    interests: "Education, social innovation, pottery",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-26T08:00:00Z", updated_at: "2024-02-26T08:00:00Z",
    education: [
      { id: 47, uni_name: "Chulalongkorn University", degree: "Master", major: "Education", country: "Thailand", state: null, scholarship: null, start_year: 2020, end_year: 2022 },
    ],
    career: [
      { id: 33, job_title: "Education Officer", employer: "Ministry of Education", job_field: "Government", country: "Thailand", state: null, is_current: true, start_year: 2022, end_year: null },
    ],
  },
  {
    id: 46,
    email: "pakkanut.c@kvis.ac.th",
    first_name: "Pakkanut",
    last_name: "Chompoo",
    kvis_year: 17,
    place: "Boston, USA",
    latitude: 42.3601,
    longitude: -71.0589,
    country: "USA",
    profile_pic_url: null,
    bio: "MD-PhD candidate at Harvard Medical School studying immunotherapy for solid tumours.",
    mbti: "INFJ",
    interests: "Oncology, violin, long-distance running",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-02-13T08:00:00Z", updated_at: "2024-02-13T08:00:00Z",
    education: [
      { id: 48, uni_name: "Harvard Medical School", degree: "MD", major: "Medicine", country: "USA", state: "Massachusetts", scholarship: "DPST", start_year: 2020, end_year: null },
    ],
    career: [],
  },
  {
    id: 47,
    email: "atchara.r@kvis.ac.th",
    first_name: "Atchara",
    last_name: "Rattanakorn",
    kvis_year: 23,
    place: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    country: "Singapore",
    profile_pic_url: null,
    bio: "Analyst at a sovereign wealth fund covering Southeast Asian tech investments.",
    mbti: "ISTJ",
    interests: "Finance, cooking, yoga",
    facebook_url: null, linkedin_url: "https://linkedin.com/in/atcharar", website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-09T08:00:00Z", updated_at: "2024-03-09T08:00:00Z",
    education: [
      { id: 49, uni_name: "NUS Business School", degree: "Bachelor", major: "Finance", country: "Singapore", state: null, scholarship: "ASEAN Scholarship", start_year: 2021, end_year: null },
    ],
    career: [],
  },
  {
    id: 48,
    email: "wipawin.m@kvis.ac.th",
    first_name: "Wipawin",
    last_name: "Mahawan",
    kvis_year: 11,
    place: "Chiang Mai, Thailand",
    latitude: 18.7883,
    longitude: 98.9853,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Social entrepreneur running an organic farm network connecting highland farmers to Bangkok markets.",
    mbti: "ENFP",
    interests: "Social enterprise, farming, music",
    facebook_url: null, linkedin_url: null, website_url: "https://wipawin.farm", line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-04T08:00:00Z", updated_at: "2024-03-22T08:00:00Z",
    education: [
      { id: 50, uni_name: "Chiang Mai University", degree: "Bachelor", major: "Agricultural Economics", country: "Thailand", state: null, scholarship: null, start_year: 2009, end_year: 2013 },
    ],
    career: [
      { id: 34, job_title: "Co-Founder", employer: "Highland Harvest", job_field: "Business", country: "Thailand", state: null, is_current: true, start_year: 2016, end_year: null },
    ],
  },
  {
    id: 49,
    email: "jiraporn.n@kvis.ac.th",
    first_name: "Jiraporn",
    last_name: "Niratpattana",
    kvis_year: 18,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "Research scientist at BIOTEC developing rapid diagnostic tools for tropical diseases.",
    mbti: "INTJ",
    interests: "Microbiology, badminton, sci-fi novels",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-01-26T08:00:00Z", updated_at: "2024-02-16T08:00:00Z",
    education: [
      { id: 51, uni_name: "Mahidol University", degree: "PhD", major: "Microbiology", country: "Thailand", state: null, scholarship: "Royal Golden Jubilee", start_year: 2016, end_year: 2021 },
    ],
    career: [
      { id: 35, job_title: "Research Scientist", employer: "BIOTEC", job_field: "Research", country: "Thailand", state: null, is_current: true, start_year: 2021, end_year: null },
    ],
  },
  {
    id: 50,
    email: "thanaphat.r@kvis.ac.th",
    first_name: "Thanaphat",
    last_name: "Rojanapruk",
    kvis_year: 24,
    place: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    country: "Thailand",
    profile_pic_url: null,
    bio: "First-year student at Chulalongkorn Faculty of Engineering, passionate about robotics.",
    mbti: "ENTP",
    interests: "Robotics, coding, basketball",
    facebook_url: null, linkedin_url: null, website_url: null, line_id: null,
    email_verified: true, is_verified: true,
    created_at: "2024-03-15T08:00:00Z", updated_at: "2024-03-15T08:00:00Z",
    education: [
      { id: 52, uni_name: "Chulalongkorn University", degree: "Bachelor", major: "Mechanical Engineering", country: "Thailand", state: null, scholarship: null, start_year: 2024, end_year: null },
    ],
    career: [],
  },
];

// Mock blogs
let MOCK_BLOGS = [
  {
    id: 1,
    slug: "life-at-mit",
    title: "Life at MIT as a Thai Student",
    content:
      "# Life at MIT\n\nComing from KVIS to MIT was a culture shock in the best possible way. The sheer density of brilliant people per square meter is unlike anything I'd experienced — even at KVIS.\n\n## Academic Culture\n\nProblem sets here don't have right answers. Professors want you to argue, break assumptions, and defend your reasoning. I failed my first two midterms and nearly flew home. Then I found my lab group, pulled three all-nighters in a row, and somehow published my first paper by semester two.\n\n## The Thai Community\n\nThere are about 40 Thai students across grad programs. We cook together every Sunday — pad see ew on a $12 portable induction cooktop in a dorm kitchen. It keeps you sane.\n\n## What KVIS Prepared Me For\n\nThe research mindset. Knowing how to sit with a hard problem for days without panicking. That's rarer than people think, even at MIT.",
    excerpt: "I failed my first two MIT midterms and nearly flew home. Here's what kept me — and what KVIS quietly prepared me for without telling me.",
    cover_image_url: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80",
    tags: "MIT,USA,grad school",
    is_published: true,
    published_at: "2024-02-01T08:00:00Z",
    created_at: "2024-01-28T08:00:00Z",
    updated_at: "2024-02-01T08:00:00Z",
    author_id: 1,
    author: {
      id: 1,
      first_name: "Somsak",
      last_name: "Khamchoo",
      profile_pic_url: null,
      kvis_year: 14,
    },
  },
  {
    id: 2,
    slug: "applying-dpst-scholarship",
    title: "How to Apply for DPST Scholarship: My Experience",
    content:
      "# DPST Scholarship Guide\n\nI applied to DPST on a dare from my roommate. I didn't think I'd get it — I was ranked 12th in my class at KVIS, not first. But DPST isn't looking for the top scorer. They want someone who can think under pressure and explain their reasoning out loud.\n\n## The Written Exam\n\nThink olympiad-style questions with no partial credit. Time management is everything. Skip problems that eat more than 8 minutes and come back.\n\n## The Interview\n\nThree professors. One whiteboard. They gave me a physics problem I'd never seen and watched how I approached it — not whether I solved it. Narrate your thinking. Silence kills you.\n\n## What Happens After\n\nYou get assigned a field. Mine was physics. I wanted biology. I negotiated — politely — and they moved me. It's possible if you have a coherent reason.\n\n## Timeline\n\n- January: Applications open\n- March: Written exam\n- May: Interview round\n- July: Results and field assignment",
    excerpt: "I applied on a dare and ranked 12th in my class. DPST isn't looking for the top scorer — here's what they're actually evaluating.",
    cover_image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    tags: "scholarship,DPST,tips",
    is_published: true,
    published_at: "2024-02-15T08:00:00Z",
    created_at: "2024-02-12T08:00:00Z",
    updated_at: "2024-02-15T08:00:00Z",
    author_id: 4,
    author: {
      id: 4,
      first_name: "Chaiwat",
      last_name: "Nakorn",
      profile_pic_url: null,
      kvis_year: 12,
    },
  },
  {
    id: 3,
    slug: "working-in-singapore-finance",
    title: "Breaking into Finance in Singapore",
    content:
      "# Finance Career in Singapore\n\nI graduated with a physics degree and zero finance experience. Eighteen months later I was an analyst at a sovereign wealth fund covering Southeast Asian tech. Here's exactly how that happened.\n\n## Why Singapore\n\nSingapore is the only city in Southeast Asia where you can work across all major asset classes — equities, fixed income, PE, VC — within a five-minute MRT ride. The talent density is absurd. So is the cost of living, but the compensation offsets it if you're at the right firm.\n\n## Getting the First Interview\n\nCold emails don't work. LinkedIn DMs to VPs don't work. What worked: I found three KVIS alumni already in finance here, bought each of them coffee, and asked specific questions about their role. Two of them passed my CV internally. One of those became a referral that got me an interview.\n\n## The Interview Process\n\nExpect a case study, a markets knowledge test, and at least one technical interview if you're going quant. Know your DCF. Know why interest rates affect equity valuations. Know the current macro environment and have an opinion on it — not a memorized one.\n\n## What KVIS Gives You\n\nA reputation for being able to think quantitatively. Use it. Finance is full of people who can network. Fewer can model.",
    excerpt: "Physics degree, no finance experience. Eighteen months later I was at a sovereign wealth fund. Here's the exact path — coffee meetings, cold emails that failed, and what actually worked.",
    cover_image_url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
    tags: "Singapore,finance,career",
    is_published: true,
    published_at: "2024-03-01T08:00:00Z",
    created_at: "2024-02-28T08:00:00Z",
    updated_at: "2024-03-01T08:00:00Z",
    author_id: 4,
    author: {
      id: 4,
      first_name: "Chaiwat",
      last_name: "Nakorn",
      profile_pic_url: null,
      kvis_year: 12,
    },
  },
];

// ─── Cohort normalization + procedural backfill ──────────────────────────────
// KVIS only has 9 cohorts (K1–K9). The 50 hand-written profiles above use
// legacy class codes (10–24); collapse them into K1–K9 so the almanac/stats
// page reflects reality, then backfill each cohort to ~71 students using
// procedural data sampled from realistic pools.

(function generateCohortPopulation() {
  // ── 1. Squeeze legacy years into 1..9
  for (const u of MOCK_ALUMNI) {
    if (typeof u.kvis_year === "number") {
      u.kvis_year = ((u.kvis_year - 10 + 900) % 9) + 1;
    }
  }
  for (const b of MOCK_BLOGS) {
    const a = MOCK_ALUMNI.find((u) => u.id === b.author_id);
    if (a && b.author) b.author.kvis_year = a.kvis_year;
  }

  // ── 2. Data pools
  const FIRSTS = [
    "Anan","Apirak","Arthit","Boonmee","Chai","Chakrit","Chanin","Decha",
    "Ekarat","Issara","Jakkrit","Kasem","Kittipong","Korn","Krit","Manop",
    "Narongchai","Nattapong","Nirun","Pakorn","Panya","Phanuwat","Pongsak",
    "Prasert","Rapeepan","Sakda","Sangchai","Sirichai","Somkid","Sompong",
    "Suchart","Sunan","Surapong","Tanin","Thanawat","Thira","Veerapol",
    "Wachira","Wanchai","Worawit","Yongyuth","Anuwat","Boonsong","Chaiyan",
    "Danai","Niran","Pisit","Rachan","Saksit","Theerapong","Wisut",
    "Anong","Apinya","Aporn","Benjawan","Boonsri","Chalisa","Chanika",
    "Chompoo","Dao","Duangporn","Hathaichanok","Jiraporn","Kanchana",
    "Kanya","Kessaree","Lalita","Malee","Mananchaya","Manee","Napaporn",
    "Narisara","Nirada","Nittaya","Nuengruethai","Orawan","Pakwan",
    "Patcharin","Phailin","Piyaporn","Pornthip","Praweena","Ratchada",
    "Rinrada","Saichon","Sasipim","Siriporn","Somying","Sunisa",
    "Suphanida","Tarisa","Thanaporn","Thidarat","Uraiwan","Wannisa",
    "Warangkana","Wilai","Yupin","Kanyarat","Pattaraporn","Supitcha",
    "Tippawan","Wanida",
  ];
  const LASTS = [
    "Suwannathat","Tangkijvanich","Phongphaew","Srisaard","Wattanapong",
    "Sukphanthawee","Chaisongkhram","Phakdiphisut","Limthongkul",
    "Ngamthanachoti","Bunyaviroch","Suphawat","Prasertdee","Khamwan",
    "Klaybor","Tinnirat","Pongdee","Inthanon","Kaewkamnerd","Kanchanaporn",
    "Lertphol","Maneesin","Naowarat","Onsuwan","Phromsiri","Phongtongkam",
    "Rattanaphol","Saetang","Sangtong","Siribut","Subin","Suttiwan",
    "Tantibanchachai","Thaweesak","Vongkitisin","Watthanachai",
    "Wongsanee","Yindee","Pannarunothai","Saengthong","Jindaprasert",
    "Kraisin","Mongkolchai","Nopachai","Phantharak","Rachatabordeesakul",
    "Sangkaroen","Termpong","Thanasit","Vivathana","Wasinwattana",
    "Yotsuwankul","Charoenpong","Boriboon","Chumphon","Dechawat",
    "Inthanin","Jaroensri","Khamsuk","Lertsiri","Moonsri","Norachit",
    "Polchart","Ratanakul","Suttisak","Theerasak","Udomchai","Visetpong",
    "Wongchai","Yothin","Bunyasarn","Chuenchom",
  ];
  const MBTIS = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
  ];

  // Country pool — Thailand-dominant (most stay), then common destinations
  const COUNTRY_W = [
    { w: 58, v: "Thailand" },
    { w: 8,  v: "USA" },
    { w: 6,  v: "UK" },
    { w: 5,  v: "Japan" },
    { w: 4,  v: "Singapore" },
    { w: 3,  v: "Germany" },
    { w: 2,  v: "Australia" },
    { w: 2,  v: "Canada" },
    { w: 2,  v: "Switzerland" },
    { w: 2,  v: "South Korea" },
    { w: 1,  v: "Netherlands" },
    { w: 1,  v: "Hong Kong" },
    { w: 1,  v: "France" },
    { w: 1,  v: "Taiwan" },
    { w: 1,  v: "Sweden" },
    { w: 1,  v: "China" },
  ];

  // Faculty / field of study — STEM-heavy reflecting KVIS's science focus
  const MAJOR_W = [
    { w: 16, v: "Computer Science" },
    { w: 9,  v: "Software Engineering" },
    { w: 5,  v: "Data Science" },
    { w: 9,  v: "Mechanical Engineering" },
    { w: 8,  v: "Electrical Engineering" },
    { w: 6,  v: "Chemical Engineering" },
    { w: 5,  v: "Civil Engineering" },
    { w: 3,  v: "Aerospace Engineering" },
    { w: 5,  v: "Biomedical Engineering" },
    { w: 4,  v: "Materials Science" },
    { w: 7,  v: "Physics" },
    { w: 5,  v: "Mathematics" },
    { w: 5,  v: "Chemistry" },
    { w: 5,  v: "Biology" },
    { w: 4,  v: "Biochemistry" },
    { w: 3,  v: "Microbiology" },
    { w: 3,  v: "Neuroscience" },
    { w: 7,  v: "Medicine" },
    { w: 3,  v: "Pharmacy" },
    { w: 2,  v: "Dentistry" },
    { w: 5,  v: "Economics" },
    { w: 4,  v: "Business Administration" },
    { w: 3,  v: "Finance" },
    { w: 2,  v: "Architecture" },
    { w: 2,  v: "Industrial Design" },
    { w: 2,  v: "Environmental Science" },
    { w: 2,  v: "Agricultural Science" },
  ];

  const UNI_BY_COUNTRY = {
    Thailand: [
      "Chulalongkorn University","Mahidol University","Kasetsart University",
      "Thammasat University","King Mongkut's University of Technology Thonburi",
      "King Mongkut's Institute of Technology Ladkrabang",
      "King Mongkut's University of Technology North Bangkok",
      "Chiang Mai University","Khon Kaen University","Prince of Songkla University",
      "Silpakorn University","Srinakharinwirot University","Naresuan University",
      "VISTEC","SIIT, Thammasat","Burapha University",
    ],
    USA: [
      "MIT","Harvard University","Stanford University","Carnegie Mellon University",
      "UC Berkeley","Caltech","Cornell University","Yale University",
      "Princeton University","Columbia University","University of Michigan",
      "University of Washington","Georgia Tech","Johns Hopkins University",
      "UIUC","UCLA","University of Chicago","Purdue University","Brown University",
    ],
    UK: [
      "University of Cambridge","University of Oxford","Imperial College London",
      "UCL","LSE","University of Edinburgh","King's College London",
      "University of Warwick","University of Manchester","University of Bristol",
    ],
    Singapore: ["NUS","NTU","SMU","SUTD"],
    Japan: [
      "University of Tokyo","Kyoto University","Osaka University",
      "Tokyo Institute of Technology","Tohoku University","Waseda University",
      "Hokkaido University",
    ],
    Germany: [
      "TU Munich","RWTH Aachen","TU Berlin","Heidelberg University",
      "LMU Munich","Karlsruhe Institute of Technology",
    ],
    Canada: [
      "University of Toronto","McGill University","University of British Columbia",
      "University of Waterloo",
    ],
    Australia: [
      "University of Melbourne","University of Sydney","ANU","UNSW",
      "Monash University",
    ],
    Switzerland: ["ETH Zurich","EPFL"],
    "South Korea": ["KAIST","Seoul National University","POSTECH","Yonsei University"],
    Netherlands: ["Delft University of Technology","TU Eindhoven","University of Amsterdam"],
    "Hong Kong": ["HKUST","University of Hong Kong","CUHK"],
    France: ["École Polytechnique","Sciences Po","Sorbonne University","ENS Paris"],
    Taiwan: ["National Taiwan University"],
    Sweden: ["KTH Royal Institute of Technology","Lund University"],
    China: ["Tsinghua University","Peking University","Fudan University"],
  };

  const PLACES = {
    Thailand: [
      ["Bangkok, Thailand", 13.7563, 100.5018],
      ["Chiang Mai, Thailand", 18.7883, 98.9853],
      ["Khon Kaen, Thailand", 16.4419, 102.8350],
      ["Phuket, Thailand", 7.8804, 98.3923],
      ["Hat Yai, Thailand", 7.0086, 100.4747],
      ["Rayong, Thailand", 12.6802, 101.2870],
      ["Pathum Thani, Thailand", 14.0208, 100.5251],
      ["Nakhon Ratchasima, Thailand", 14.9799, 102.0978],
    ],
    USA: [
      ["Cambridge, USA", 42.3736, -71.1097],
      ["Berkeley, USA", 37.8715, -122.2730],
      ["Stanford, USA", 37.4275, -122.1697],
      ["New York, USA", 40.7128, -74.0060],
      ["Pittsburgh, USA", 40.4406, -79.9959],
      ["Seattle, USA", 47.6062, -122.3321],
      ["Ann Arbor, USA", 42.2808, -83.7430],
      ["Atlanta, USA", 33.7490, -84.3880],
      ["Pasadena, USA", 34.1478, -118.1445],
      ["Ithaca, USA", 42.4440, -76.5019],
    ],
    UK: [
      ["London, UK", 51.5074, -0.1278],
      ["Cambridge, UK", 52.2053, 0.1218],
      ["Oxford, UK", 51.7520, -1.2577],
      ["Edinburgh, UK", 55.9533, -3.1883],
      ["Manchester, UK", 53.4808, -2.2426],
    ],
    Singapore: [["Singapore", 1.3521, 103.8198]],
    Japan: [
      ["Tokyo, Japan", 35.6762, 139.6503],
      ["Kyoto, Japan", 35.0116, 135.7681],
      ["Osaka, Japan", 34.6937, 135.5023],
      ["Sendai, Japan", 38.2682, 140.8694],
    ],
    Germany: [
      ["Munich, Germany", 48.1351, 11.5820],
      ["Berlin, Germany", 52.5200, 13.4050],
      ["Aachen, Germany", 50.7753, 6.0839],
      ["Heidelberg, Germany", 49.3988, 8.6724],
    ],
    Canada: [
      ["Toronto, Canada", 43.6532, -79.3832],
      ["Vancouver, Canada", 49.2827, -123.1207],
      ["Waterloo, Canada", 43.4643, -80.5204],
      ["Montreal, Canada", 45.5017, -73.5673],
    ],
    Australia: [
      ["Melbourne, Australia", -37.8136, 144.9631],
      ["Sydney, Australia", -33.8688, 151.2093],
      ["Canberra, Australia", -35.2809, 149.1300],
    ],
    Switzerland: [
      ["Zurich, Switzerland", 47.3769, 8.5417],
      ["Lausanne, Switzerland", 46.5197, 6.6323],
    ],
    "South Korea": [
      ["Seoul, South Korea", 37.5665, 126.9780],
      ["Daejeon, South Korea", 36.3504, 127.3845],
    ],
    Netherlands: [
      ["Delft, Netherlands", 52.0116, 4.3571],
      ["Amsterdam, Netherlands", 52.3676, 4.9041],
      ["Eindhoven, Netherlands", 51.4416, 5.4697],
    ],
    "Hong Kong": [["Hong Kong", 22.3193, 114.1694]],
    France: [["Paris, France", 48.8566, 2.3522]],
    Taiwan: [["Taipei, Taiwan", 25.0330, 121.5654]],
    Sweden: [
      ["Stockholm, Sweden", 59.3293, 18.0686],
      ["Lund, Sweden", 55.7047, 13.1910],
    ],
    China: [
      ["Beijing, China", 39.9042, 116.4074],
      ["Shanghai, China", 31.2304, 121.4737],
    ],
  };

  const SCHOLARSHIPS = [
    null,null,null,null,null,null,
    "DPST","DPST","DPST",
    "Royal Thai Government","Royal Thai Government",
    "MEXT","ASEAN Scholarship","Chevening",
    "Fulbright","Royal Golden Jubilee","Anandamahidol",
    "King's Scholarship","JPA","DAAD",
  ];

  // ── 3. Deterministic RNG (mulberry32) keeps generated data stable per run
  function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = makeRng(42);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const wpick = (items) => {
    const total = items.reduce((s, i) => s + i.w, 0);
    let r = R() * total;
    for (const i of items) if ((r -= i.w) <= 0) return i.v;
    return items[items.length - 1].v;
  };

  // ── 4. Backfill each cohort to ~71 students (70-73 range)
  let nextId = MOCK_ALUMNI.reduce((m, u) => Math.max(m, u.id), 0) + 1;
  let nextEduId = MOCK_ALUMNI
    .flatMap((u) => u.education || [])
    .reduce((m, e) => Math.max(m, e.id || 0), 0) + 1;

  for (let cohort = 1; cohort <= 9; cohort++) {
    const have = MOCK_ALUMNI.filter((u) => u.kvis_year === cohort).length;
    const target = 70 + Math.floor(R() * 4); // 70..73
    const need = Math.max(0, target - have);
    for (let i = 0; i < need; i++) {
      const country = wpick(COUNTRY_W);
      const major = wpick(MAJOR_W);
      const unis = UNI_BY_COUNTRY[country] || UNI_BY_COUNTRY.Thailand;
      const uni = pick(unis);
      const places = PLACES[country] || PLACES.Thailand;
      const [place, lat, lng] = pick(places);
      const first = pick(FIRSTS);
      const last = pick(LASTS);
      const id = nextId++;
      const startYear = 2014 + cohort + 2; // approx undergrad start
      MOCK_ALUMNI.push({
        id,
        email: `${first.toLowerCase()}.${last[0].toLowerCase()}${id}@kvis.ac.th`,
        first_name: first,
        last_name: last,
        kvis_year: cohort,
        place,
        latitude: lat,
        longitude: lng,
        country,
        profile_pic_url: null,
        bio: null,
        mbti: pick(MBTIS),
        interests: null,
        facebook_url: null,
        linkedin_url: null,
        website_url: null,
        line_id: null,
        email_verified: true,
        is_verified: true,
        created_at: `2024-${String(1 + Math.floor(R() * 12)).padStart(2, "0")}-${String(1 + Math.floor(R() * 28)).padStart(2, "0")}T08:00:00Z`,
        updated_at: "2024-06-01T08:00:00Z",
        education: [
          {
            id: nextEduId++,
            uni_name: uni,
            degree: "Bachelor",
            major,
            country,
            state: null,
            scholarship: pick(SCHOLARSHIPS),
            start_year: startYear,
            end_year: null,
          },
        ],
        career: [],
      });
    }
  }
})();

// ─── Seed current students (M.4-M.6) ──────────────────────────────────────────
// KVIS structure: 3 grades (10/11/12 = M.4/M.5/M.6), 4 classes per grade,
// 4 elemental houses (earth/water/air/fire). 18 students per house per grade
// → 72 students per grade → 216 total. Houses rotate round-robin within each
// grade so counts come out exactly 18 per house.
(function seedCurrentStudents() {
  const FIRSTS_M = [
    "Anan","Akira","Apirak","Arthit","Boon","Chai","Chakrit","Chanin","Decha",
    "Ekarat","Issara","Jakkrit","Kasem","Korn","Krit","Manop","Nattapong",
    "Pakorn","Panya","Phanuwat","Pongsak","Prasert","Sakda","Sirichai",
    "Somkid","Sompong","Suchart","Surapong","Tanin","Thanawat","Veerapol",
    "Wachira","Wanchai","Worawit","Yongyuth","Anuwat","Boonsong","Chaiyan",
    "Danai","Niran","Pisit","Rachan","Saksit","Theerapong","Wisut","Kit",
    "Pun","Tee","Top","Bank",
  ];
  const FIRSTS_F = [
    "Anong","Apinya","Aporn","Benjawan","Boonsri","Chalisa","Chanika",
    "Chompoo","Dao","Duangporn","Hathaichanok","Jiraporn","Kanchana",
    "Kanya","Kessaree","Lalita","Malee","Manee","Napaporn","Narisara",
    "Nittaya","Orawan","Pakwan","Patcharin","Phailin","Piyaporn","Pornthip",
    "Praweena","Ratchada","Saichon","Sasipim","Siriporn","Sunisa","Tarisa",
    "Thanaporn","Thidarat","Uraiwan","Wannisa","Warangkana","Wilai","Yupin",
    "Kanyarat","Pattaraporn","Supitcha","Tippawan","Wanida","Fern","Mint",
    "Ploy","Nam",
  ];
  const LASTS_S = [
    "Suwannathat","Tangkijvanich","Phongphaew","Srisaard","Wattanapong",
    "Sukphanthawee","Chaisongkhram","Phakdiphisut","Limthongkul",
    "Ngamthanachoti","Bunyaviroch","Suphawat","Prasertdee","Khamwan",
    "Klaybor","Tinnirat","Pongdee","Inthanon","Kaewkamnerd","Kanchanaporn",
    "Lertphol","Maneesin","Naowarat","Onsuwan","Phromsiri","Phongtongkam",
    "Rattanaphol","Saetang","Sangtong","Siribut","Subin","Suttiwan",
    "Tantibanchachai","Thaweesak","Vongkitisin","Watthanachai","Wongsanee",
    "Yindee","Pannarunothai","Saengthong","Jindaprasert","Kraisin",
    "Mongkolchai","Nopachai","Phantharak","Sangkaroen","Termpong","Thanasit",
    "Vivathana","Wasinwattana","Charoenpong","Boriboon","Chumphon",
    "Dechawat","Jaroensri","Khamsuk","Lertsiri","Norachit","Ratanakul",
    "Suttisak","Theerasak","Udomchai","Visetpong","Wongchai","Yothin",
  ];
  const MBTIS_S = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
  ];
  const HOUSES = ["earth","water","air","fire"];

  // Mulberry32 — deterministic so the roster stays stable across restarts.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = makeRng(2026);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];

  let nextId = MOCK_ALUMNI.reduce((m, u) => Math.max(m, u.id), 0) + 1;
  const usedHandles = new Set();

  // KVIS sits in Rayong, Thailand.
  const KVIS_LAT = 12.6916;
  const KVIS_LNG = 101.2787;

  const GRADES = [10, 11, 12]; // M.4, M.5, M.6
  const CLASSES_PER_GRADE = 4;
  const STUDENTS_PER_CLASS = 18; // 4 × 18 = 72 per grade, exactly 18 per house

  for (const grade of GRADES) {
    // Build a class-and-house plan for this grade so house counts land at 18 each.
    // 72 slots = 4 classes × 18 students. Distribute houses round-robin per slot
    // so each class ends up with ~4-5 of each house, and the grade totals are
    // exactly 18 of each.
    const plan = [];
    for (let cls = 1; cls <= CLASSES_PER_GRADE; cls++) {
      for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
        plan.push({ cls, slot: plan.length });
      }
    }
    // Assign houses round-robin in slot order: slot % 4 → house.
    // This yields exactly 18 of each house per grade (72/4 = 18).
    for (let s = 0; s < plan.length; s++) {
      plan[s].house = HOUSES[s % HOUSES.length];
    }
    // Lightly shuffle within each class so houses look mixed, not in fixed order.
    for (let cls = 1; cls <= CLASSES_PER_GRADE; cls++) {
      const slice = plan.filter((p) => p.cls === cls);
      for (let i = slice.length - 1; i > 0; i--) {
        const j = Math.floor(R() * (i + 1));
        const tmp = slice[i].house; slice[i].house = slice[j].house; slice[j].house = tmp;
      }
    }

    for (const { cls, house } of plan) {
      const female = R() < 0.5;
      const first = pick(female ? FIRSTS_F : FIRSTS_M);
      const last = pick(LASTS_S);
      const id = nextId++;
      let handle = `${first.toLowerCase()}.${last[0].toLowerCase()}${id}`;
      while (usedHandles.has(handle)) handle = `${handle}x`;
      usedHandles.add(handle);

      MOCK_ALUMNI.push({
        id,
        email: `${handle}@kvis.ac.th`,
        first_name: first,
        last_name: last,
        kvis_year: null, // current students haven't graduated
        place: "Rayong, Thailand",
        latitude: KVIS_LAT + (R() - 0.5) * 0.01,
        longitude: KVIS_LNG + (R() - 0.5) * 0.01,
        country: "Thailand",
        profile_pic_url: null,
        bio: null,
        mbti: pick(MBTIS_S),
        interests: null,
        facebook_url: null,
        linkedin_url: null,
        website_url: null,
        line_id: null,
        email_verified: true,
        is_verified: true,
        created_at: `2025-${String(1 + Math.floor(R() * 12)).padStart(2, "0")}-${String(1 + Math.floor(R() * 28)).padStart(2, "0")}T08:00:00Z`,
        updated_at: "2025-09-01T08:00:00Z",
        education: [],
        career: [],
        current_grade: grade,
        current_class: cls,
        current_elemental: house,
      });
    }
  }
})();

// Logged-in mock user (id=1)
const MOCK_ME = { ...MOCK_ALUMNI[0], slug: "somsak-khamchoo" };

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const MOCK_TOKEN = "mock_access_token";

function isAuthenticated(req) {
  return req.cookies?.access_token === MOCK_TOKEN;
}

function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  next();
}

function setCookies(res) {
  res.cookie("access_token", MOCK_TOKEN, { httpOnly: true, sameSite: "lax", maxAge: 3600000 });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "mock" });
});

// Auth
app.post("/api/auth/register", (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email?.endsWith("@kvis.ac.th")) {
    return res.status(400).json({ detail: "Only @kvis.ac.th emails are allowed" });
  }
  setCookies(res);
  res.json({ message: "Registered successfully (mock)", user_id: 1 });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }
  setCookies(res);
  res.json({ message: "Logged in (mock)", user_id: 1 });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("access_token", { httpOnly: true, sameSite: "lax", path: "/" });
  res.json({ message: "Logged out" });
});

// Users — /me
app.get("/api/users/me", requireAuth, (req, res) => {
  res.json(MOCK_ME);
});

app.patch("/api/users/me", requireAuth, (req, res) => {
  Object.assign(MOCK_ME, req.body);
  Object.assign(MOCK_ALUMNI[0], req.body); // keep MOCK_ALUMNI in sync
  res.json(MOCK_ME);
});

app.post("/api/users/me/profile-pic", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ detail: "No file provided" });
  
  const base64 = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype;
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  MOCK_ME.profile_pic_url = dataUrl;
  MOCK_ALUMNI[0].profile_pic_url = dataUrl; // ← add this line
  res.json({ url: dataUrl });
});

app.put("/api/users/me/education", requireAuth, (req, res) => {
  MOCK_ME.education = req.body.map((e, i) => ({ id: i + 1, ...e }));
  res.json({ message: "Education updated" });
});

app.put("/api/users/me/career", requireAuth, (req, res) => {
  MOCK_ME.career = req.body.map((c, i) => ({ id: i + 1, ...c }));
  res.json({ message: "Career updated" });
});

// Globe pins
app.get("/api/users/globe/pins", (req, res) => {
  const pins = MOCK_ALUMNI
    .filter((u) => u.latitude && u.longitude && !u.current_grade)
    .map((u) => {
    const currentJob = u.career.find((c) => c.is_current) || u.career[u.career.length - 1];
    return {
      user_id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      latitude: u.latitude,
      longitude: u.longitude,
      place: u.place,
      country: u.country,
      kvis_year: u.kvis_year,
      profile_pic_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.first_name}${u.last_name}`,
      mbti: u.mbti,
      current_job: currentJob ? `${currentJob.job_title} at ${currentJob.employer}` : null,
    };
  });
  res.json(pins);
});

// User by ID — must come after /me and /globe/pins
app.get("/api/users/:id", (req, res) => {
  const param = req.params.id;
  const user = MOCK_ALUMNI.find(
    (u) => u.id === parseInt(param) || u.slug === param
  );
  if (!user) return res.status(404).json({ detail: "User not found" });
  res.json(user);
});

// Search
app.get("/api/search", (req, res) => {
  const { name, kvis_year, country, uni_name, degree, major, scholarship,
          job_title, employer, job_field, sort = "name", order = "asc",
          limit = 50, offset = 0 } = req.query;

  let results = [...MOCK_ALUMNI];

  if (name) {
    const t = name.toLowerCase();
    results = results.filter(
      (u) =>
        u.first_name.toLowerCase().includes(t) ||
        u.last_name.toLowerCase().includes(t)
    );
  }
  if (kvis_year) results = results.filter((u) => u.kvis_year === parseInt(kvis_year));
  if (country) results = results.filter((u) => u.country?.toLowerCase().includes(country.toLowerCase()));

  if (uni_name || degree || major || scholarship) {
    results = results.filter((u) =>
      u.education.some((e) => {
        if (uni_name && !e.uni_name?.toLowerCase().includes(uni_name.toLowerCase())) return false;
        if (degree && e.degree !== degree) return false;
        if (major && !e.major?.toLowerCase().includes(major.toLowerCase())) return false;
        if (scholarship && !e.scholarship?.toLowerCase().includes(scholarship.toLowerCase())) return false;
        return true;
      })
    );
  }

  if (job_title || employer || job_field) {
    results = results.filter((u) =>
      u.career.some((c) => {
        if (job_title && !c.job_title?.toLowerCase().includes(job_title.toLowerCase())) return false;
        if (employer && !c.employer?.toLowerCase().includes(employer.toLowerCase())) return false;
        if (job_field && c.job_field !== job_field) return false;
        return true;
      })
    );
  }

  // Sort
  const reverse = order === "desc";
  if (sort === "name") {
    results.sort((a, b) => {
      const cmp = (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name);
      return reverse ? -cmp : cmp;
    });
  } else if (sort === "kvis_year") {
    results.sort((a, b) => reverse ? (b.kvis_year || 0) - (a.kvis_year || 0) : (a.kvis_year || 0) - (b.kvis_year || 0));
  } else if (sort === "created_at") {
    results.sort((a, b) => {
      const cmp = new Date(a.created_at) - new Date(b.created_at);
      return reverse ? -cmp : cmp;
    });
  }

  const page = results.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  // Return same shape as UserCard
  res.json(
    page.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      kvis_year: u.kvis_year,
      place: u.place,
      country: u.country,
      profile_pic_url: u.profile_pic_url,
      mbti: u.mbti,
      education: u.education,
      career: u.career,
      current_grade: u.current_grade ?? null,
      current_class: u.current_class ?? null,
      current_elemental: u.current_elemental ?? null,
    }))
  );
});

// Summary
app.get("/api/summary", (req, res) => {
  const by_kvis_year = {};
  const by_country = {};
  const by_job_field = {};
  const by_degree = {};
  const by_mbti = {};

  for (const u of MOCK_ALUMNI) {
    if (u.kvis_year) by_kvis_year[u.kvis_year] = (by_kvis_year[u.kvis_year] || 0) + 1;
    if (u.country) by_country[u.country] = (by_country[u.country] || 0) + 1;
    if (u.mbti) by_mbti[u.mbti] = (by_mbti[u.mbti] || 0) + 1;
    for (const e of u.education) {
      if (e.degree) by_degree[e.degree] = (by_degree[e.degree] || 0) + 1;
    }
    for (const c of u.career) {
      if (c.job_field) by_job_field[c.job_field] = (by_job_field[c.job_field] || 0) + 1;
    }
  }

  res.json({
    total: MOCK_ALUMNI.length,
    by_kvis_year,
    by_country,
    by_job_field,
    by_degree,
    by_mbti,
  });
});

// Blogs
app.get("/api/blogs", (req, res) => {
  const { tag, limit = 20, offset = 0 } = req.query;
  let blogs = MOCK_BLOGS.filter((b) => b.is_published);
  if (tag) blogs = blogs.filter((b) => b.tags?.toLowerCase().includes(tag.toLowerCase()));
  res.json(blogs.slice(parseInt(offset), parseInt(offset) + parseInt(limit)));
});

app.get("/api/blogs/:slug", (req, res) => {
  const blog = MOCK_BLOGS.find((b) => b.slug === req.params.slug && b.is_published);
  if (!blog) return res.status(404).json({ detail: "Blog not found" });
  res.json(blog);
});

app.post("/api/blogs", requireAuth, (req, res) => {
  const { title, content, excerpt, cover_image_url, tags, is_published } = req.body;
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const blog = {
    id: MOCK_BLOGS.length + 1,
    slug,
    title,
    content,
    excerpt: excerpt || content.slice(0, 200),
    cover_image_url: cover_image_url || null,
    tags: tags || null,
    is_published: !!is_published,
    published_at: is_published ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: MOCK_ME.id,
    author: {
      id: MOCK_ME.id,
      first_name: MOCK_ME.first_name,
      last_name: MOCK_ME.last_name,
      profile_pic_url: MOCK_ME.profile_pic_url,
      kvis_year: MOCK_ME.kvis_year,
    },
  };
  MOCK_BLOGS.push(blog);
  res.status(201).json(blog);
});

app.patch("/api/blogs/:slug", requireAuth, (req, res) => {
  const idx = MOCK_BLOGS.findIndex((b) => b.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ detail: "Blog not found" });
  Object.assign(MOCK_BLOGS[idx], req.body, { updated_at: new Date().toISOString() });
  res.json(MOCK_BLOGS[idx]);
});

app.delete("/api/blogs/:slug", requireAuth, (req, res) => {
  const idx = MOCK_BLOGS.findIndex((b) => b.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ detail: "Blog not found" });
  MOCK_BLOGS.splice(idx, 1);
  res.status(204).send();
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n🟡 KVIS Connect MOCK server running at http://localhost:${PORT}`);
  console.log(`   Swagger-style docs: not available in mock mode`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
