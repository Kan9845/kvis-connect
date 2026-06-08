"""
Seed the database with mock data.

Generates exactly 72 alumni per cohort for cohorts 1–9 (648 alumni total),
plus current students (grades 10–12) and 3 sample blog posts.

Usage:
    DATABASE_URL="postgresql://..." python scripts/seed.py
    DATABASE_URL="..."             python scripts/seed.py --clear   # wipe before seeding
"""

import ctypes
import os
import sys
import uuid
from datetime import datetime, timezone

from sqlmodel import Session, SQLModel, create_engine, select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.core.slug import slugify_name
from app.models.blog import Blog
from app.models.user import Career, Education, User


# ── Mulberry32 RNG (deterministic, matches original seed logic) ───────────────

def _u32(x: int) -> int:
    return ctypes.c_uint32(x).value

def _imul(a: int, b: int) -> int:
    return ctypes.c_int32(_u32(a) * _u32(b)).value

def make_rng(seed: int):
    state = [_u32(seed) or 1]
    def rng() -> float:
        state[0] = _u32(state[0] + 0x6D2B79F5)
        a = state[0]
        t = _imul(a ^ (a >> 15), 1 | a)
        tv = _u32(t)
        t = ctypes.c_int32(t + _imul(tv ^ (tv >> 7), 61 | tv)).value ^ t
        tv2 = _u32(t)
        return _u32(t ^ (tv2 >> 14)) / 4294967296
    return rng

def pick(rng, arr):
    return arr[int(rng() * len(arr))]

def wpick(rng, items):
    total = sum(i["w"] for i in items)
    r = rng() * total
    for i in items:
        r -= i["w"]
        if r <= 0:
            return i["v"]
    return items[-1]["v"]


# ── Data pools ────────────────────────────────────────────────────────────────

FIRSTS_M = [
    "Anan","Akira","Apirak","Arthit","Boon","Chai","Chakrit","Chanin","Decha",
    "Ekarat","Issara","Jakkrit","Kasem","Korn","Krit","Manop","Nattapong",
    "Pakorn","Panya","Phanuwat","Pongsak","Prasert","Sakda","Sirichai",
    "Somkid","Sompong","Suchart","Surapong","Tanin","Thanawat","Veerapol",
    "Wachira","Wanchai","Worawit","Yongyuth","Anuwat","Boonsong","Chaiyan",
    "Danai","Niran","Pisit","Rachan","Saksit","Theerapong","Wisut","Kit",
    "Pun","Tee","Top","Bank","Arm","Gun","Mek","Nop","Ohm","Pat","Roj","Sup",
]
FIRSTS_F = [
    "Anong","Apinya","Aporn","Benjawan","Boonsri","Chalisa","Chanika","Chompoo",
    "Dao","Duangporn","Hathaichanok","Jiraporn","Kanchana","Kanya","Kessaree",
    "Lalita","Malee","Manee","Napaporn","Narisara","Nittaya","Orawan","Pakwan",
    "Patcharin","Phailin","Piyaporn","Pornthip","Praweena","Ratchada","Saichon",
    "Sasipim","Siriporn","Sunisa","Tarisa","Thanaporn","Thidarat","Uraiwan",
    "Wannisa","Warangkana","Wilai","Yupin","Kanyarat","Pattaraporn","Supitcha",
    "Tippawan","Wanida","Fern","Mint","Ploy","Nam","Aom","Beau","Earn","Gam",
    "Joy","Nan","Pam","Pim","Wan",
]
LASTS_S = [
    "Suwannathat","Tangkijvanich","Phongphaew","Srisaard","Wattanapong",
    "Sukphanthawee","Chaisongkhram","Phakdiphisut","Limthongkul","Ngamthanachoti",
    "Bunyaviroch","Suphawat","Prasertdee","Khamwan","Klaybor","Tinnirat",
    "Pongdee","Inthanon","Kaewkamnerd","Kanchanaporn","Lertphol","Maneesin",
    "Naowarat","Onsuwan","Phromsiri","Phongtongkam","Rattanaphol","Saetang",
    "Sangtong","Siribut","Subin","Suttiwan","Tantibanchachai","Thaweesak",
    "Vongkitisin","Watthanachai","Wongsanee","Yindee","Pannarunothai",
    "Saengthong","Jindaprasert","Kraisin","Mongkolchai","Nopachai","Phantharak",
    "Sangkaroen","Termpong","Thanasit","Vivathana","Wasinwattana","Charoenpong",
    "Boriboon","Chumphon","Dechawat","Jaroensri","Khamsuk","Lertsiri","Norachit",
    "Ratanakul","Suttisak","Theerasak","Udomchai","Visetpong","Wongchai","Yothin",
    "Bunyasarn","Chuenchom","Apinya","Kanjana","Phimpha","Rojanarat","Sukjai",
]
MBTIS = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
]
COUNTRY_W = [
    {"w":55,"v":"Thailand"},{"w":9,"v":"USA"},{"w":6,"v":"UK"},
    {"w":5,"v":"Japan"},{"w":5,"v":"Singapore"},{"w":3,"v":"Germany"},
    {"w":3,"v":"Australia"},{"w":2,"v":"Canada"},{"w":2,"v":"Switzerland"},
    {"w":2,"v":"South Korea"},{"w":1,"v":"Netherlands"},{"w":1,"v":"Hong Kong"},
    {"w":1,"v":"France"},{"w":1,"v":"Taiwan"},{"w":1,"v":"Sweden"},{"w":1,"v":"China"},
    {"w":1,"v":"New Zealand"},{"w":1,"v":"Belgium"},
]
MAJOR_W = [
    {"w":16,"v":"Computer Science"},{"w":9,"v":"Software Engineering"},
    {"w":5,"v":"Data Science"},{"w":9,"v":"Mechanical Engineering"},
    {"w":8,"v":"Electrical Engineering"},{"w":6,"v":"Chemical Engineering"},
    {"w":5,"v":"Civil Engineering"},{"w":3,"v":"Aerospace Engineering"},
    {"w":5,"v":"Biomedical Engineering"},{"w":4,"v":"Materials Science"},
    {"w":7,"v":"Physics"},{"w":5,"v":"Mathematics"},{"w":5,"v":"Chemistry"},
    {"w":5,"v":"Biology"},{"w":4,"v":"Biochemistry"},{"w":3,"v":"Microbiology"},
    {"w":3,"v":"Neuroscience"},{"w":7,"v":"Medicine"},{"w":3,"v":"Pharmacy"},
    {"w":2,"v":"Dentistry"},{"w":5,"v":"Economics"},{"w":4,"v":"Business Administration"},
    {"w":3,"v":"Finance"},{"w":2,"v":"Architecture"},{"w":2,"v":"Industrial Design"},
    {"w":2,"v":"Environmental Science"},{"w":2,"v":"Agricultural Science"},
]
DEGREE_W = [
    {"w":40,"v":"Bachelor"},{"w":30,"v":"Master"},{"w":20,"v":"PhD"},
    {"w":8,"v":"MD"},{"w":2,"v":"JD"},
]
JOB_FIELD_W = [
    {"w":20,"v":"Technology"},{"w":15,"v":"Engineering"},{"w":12,"v":"Healthcare"},
    {"w":10,"v":"Finance"},{"w":8,"v":"Research"},{"w":7,"v":"Government"},
    {"w":6,"v":"Education"},{"w":5,"v":"Business"},{"w":4,"v":"Creative Arts"},
    {"w":3,"v":"Law"},{"w":2,"v":"Media"},{"w":2,"v":"Non-profit"},
    {"w":2,"v":"Agriculture"},{"w":2,"v":"Architecture"},{"w":2,"v":"Other"},
]
EMPLOYERS = {
    "Technology": ["Google","Meta","Microsoft","Amazon","Apple","Grab","Line","Agoda","SCB Tech","True Digital"],
    "Engineering": ["Arup","BMW","Toyota","EGAT","PTT","Chevron","IRPC","Bechtel","ABB","Schlumberger"],
    "Healthcare": ["Siriraj Hospital","Ramathibodi Hospital","Bumrungrad","BNH Hospital","WHO","CDC","AstraZeneca","Roche"],
    "Finance": ["Kasikorn Bank","SCB","Bangkok Bank","Krungsri","Citibank","Goldman Sachs","J.P. Morgan","BlackRock","SET"],
    "Research": ["NSTDA","BIOTEC","NARIT","NECTEC","A*STAR","Fraunhofer","RIKEN","CERN"],
    "Government": ["Ministry of Science and Technology","Ministry of Digital Economy","NESDC","BOI","NECTEC","NSTDA"],
    "Education": ["Chulalongkorn University","Mahidol University","VISTEC","Kasetsart University","AIT","KMUTT"],
    "Business": ["PTT Global Chemical","Charoen Pokphand","ThaiBev","Central Group","SCG","True Corporation"],
    "Creative Arts": ["WGSN","Ogilvy Thailand","BBDO Bangkok","Film studio","Freelance"],
    "Law": ["Baker McKenzie","Allen & Overy","DLA Piper","Tilleke & Gibbins","Weerawong C&P"],
    "Media": ["BBC Thai","Channel 3","The Standard","Workpoint","LINE Today"],
    "Non-profit": ["UNICEF","UN ESCAP","WWF Thailand","Population Services International"],
    "Agriculture": ["Charoen Pokphand Foods","Mitr Phol","Thai Union","Betagro","AgriStart"],
    "Architecture": ["Hassell Studio","Plan Architect","DBALP","Studio 994"],
    "Other": ["Self-employed","Startup","Freelance"],
}
JOB_TITLES = {
    "Technology": ["Software Engineer","Senior Engineer","Data Scientist","Product Manager","DevOps Engineer","ML Engineer","CTO","Tech Lead"],
    "Engineering": ["Process Engineer","Structural Engineer","Project Engineer","R&D Engineer","Principal Engineer","Design Engineer"],
    "Healthcare": ["Physician","Surgeon","Researcher","Pharmacist","Health Officer","Clinical Scientist"],
    "Finance": ["Analyst","Senior Analyst","Portfolio Manager","Risk Manager","Investment Banker","Quantitative Analyst"],
    "Research": ["Research Scientist","Postdoctoral Researcher","Principal Investigator","Lab Manager"],
    "Government": ["Policy Analyst","Director","Advisor","Programme Officer","Economist"],
    "Education": ["Lecturer","Assistant Professor","Researcher","Academic Advisor"],
    "Business": ["Business Analyst","Strategy Consultant","Marketing Manager","Operations Manager","CEO"],
    "Creative Arts": ["Designer","Art Director","Illustrator","Creative Director","Animator"],
    "Law": ["Associate","Senior Associate","Partner","Legal Counsel","IP Attorney"],
    "Media": ["Journalist","Editor","Producer","Content Creator","Reporter"],
    "Non-profit": ["Programme Officer","Project Manager","Field Coordinator","Advocacy Officer"],
    "Agriculture": ["Agronomist","Supply Chain Manager","R&D Specialist","Business Development"],
    "Architecture": ["Architect","Urban Planner","Interior Designer","Project Lead"],
    "Other": ["Consultant","Entrepreneur","Researcher","Specialist"],
}
UNI_BY_COUNTRY = {
    "Thailand": ["Chulalongkorn University","Mahidol University","Kasetsart University","Thammasat University","KMUTT","KMITL","KMUTNB","Chiang Mai University","Khon Kaen University","Prince of Songkla University","Silpakorn University","Srinakharinwirot University","Naresuan University","VISTEC","SIIT, Thammasat","Burapha University"],
    "USA": ["MIT","Harvard University","Stanford University","Carnegie Mellon University","UC Berkeley","Caltech","Cornell University","Yale University","Princeton University","Columbia University","University of Michigan","University of Washington","Georgia Tech","Johns Hopkins University","UIUC","UCLA","University of Chicago","Purdue University","Brown University"],
    "UK": ["University of Cambridge","University of Oxford","Imperial College London","UCL","LSE","University of Edinburgh","King's College London","University of Warwick","University of Manchester","University of Bristol"],
    "Singapore": ["NUS","NTU","SMU","SUTD"],
    "Japan": ["University of Tokyo","Kyoto University","Osaka University","Tokyo Institute of Technology","Tohoku University","Waseda University","Hokkaido University"],
    "Germany": ["TU Munich","RWTH Aachen","TU Berlin","Heidelberg University","LMU Munich","Karlsruhe Institute of Technology"],
    "Canada": ["University of Toronto","McGill University","University of British Columbia","University of Waterloo"],
    "Australia": ["University of Melbourne","University of Sydney","ANU","UNSW","Monash University","University of Queensland"],
    "Switzerland": ["ETH Zurich","EPFL"],
    "South Korea": ["KAIST","Seoul National University","POSTECH","Yonsei University"],
    "Netherlands": ["Delft University of Technology","TU Eindhoven","University of Amsterdam"],
    "Hong Kong": ["HKUST","University of Hong Kong","CUHK"],
    "France": ["École Polytechnique","Sciences Po","Sorbonne University","ENS Paris"],
    "Taiwan": ["National Taiwan University","NTHU","NCTU"],
    "Sweden": ["KTH Royal Institute of Technology","Lund University"],
    "China": ["Tsinghua University","Peking University","Fudan University"],
    "New Zealand": ["University of Auckland","Victoria University of Wellington"],
    "Belgium": ["KU Leuven","Ghent University","Université Libre de Bruxelles"],
}
PLACES = {
    "Thailand": [["Bangkok, Thailand",13.7563,100.5018],["Chiang Mai, Thailand",18.7883,98.9853],["Khon Kaen, Thailand",16.4419,102.835],["Phuket, Thailand",7.8804,98.3923],["Hat Yai, Thailand",7.0086,100.4747],["Rayong, Thailand",12.6802,101.287],["Pathum Thani, Thailand",14.0208,100.5251],["Nakhon Ratchasima, Thailand",14.9799,102.0978]],
    "USA": [["Cambridge, USA",42.3736,-71.1097],["Berkeley, USA",37.8715,-122.273],["Stanford, USA",37.4275,-122.1697],["New York, USA",40.7128,-74.006],["Pittsburgh, USA",40.4406,-79.9959],["Seattle, USA",47.6062,-122.3321],["Ann Arbor, USA",42.2808,-83.743],["Atlanta, USA",33.749,-84.388],["Pasadena, USA",34.1478,-118.1445],["Boston, USA",42.3601,-71.0589],["Los Angeles, USA",34.0522,-118.2437]],
    "UK": [["London, UK",51.5074,-0.1278],["Cambridge, UK",52.2053,0.1218],["Oxford, UK",51.752,-1.2577],["Edinburgh, UK",55.9533,-3.1883],["Manchester, UK",53.4808,-2.2426]],
    "Singapore": [["Singapore",1.3521,103.8198]],
    "Japan": [["Tokyo, Japan",35.6762,139.6503],["Kyoto, Japan",35.0116,135.7681],["Osaka, Japan",34.6937,135.5023],["Sendai, Japan",38.2682,140.8694]],
    "Germany": [["Munich, Germany",48.1351,11.582],["Berlin, Germany",52.52,13.405],["Aachen, Germany",50.7753,6.0839],["Heidelberg, Germany",49.3988,8.6724]],
    "Canada": [["Toronto, Canada",43.6532,-79.3832],["Vancouver, Canada",49.2827,-123.1207],["Waterloo, Canada",43.4643,-80.5204],["Montreal, Canada",45.5017,-73.5673]],
    "Australia": [["Melbourne, Australia",-37.8136,144.9631],["Sydney, Australia",-33.8688,151.2093],["Canberra, Australia",-35.2809,149.13],["Brisbane, Australia",-27.4698,153.0251]],
    "Switzerland": [["Zurich, Switzerland",47.3769,8.5417],["Lausanne, Switzerland",46.5197,6.6323]],
    "South Korea": [["Seoul, South Korea",37.5665,126.978],["Daejeon, South Korea",36.3504,127.3845]],
    "Netherlands": [["Delft, Netherlands",52.0116,4.3571],["Amsterdam, Netherlands",52.3676,4.9041],["Eindhoven, Netherlands",51.4416,5.4697]],
    "Hong Kong": [["Hong Kong",22.3193,114.1694]],
    "France": [["Paris, France",48.8566,2.3522]],
    "Taiwan": [["Taipei, Taiwan",25.033,121.5654]],
    "Sweden": [["Stockholm, Sweden",59.3293,18.0686],["Lund, Sweden",55.7047,13.191]],
    "China": [["Beijing, China",39.9042,116.4074],["Shanghai, China",31.2304,121.4737]],
    "New Zealand": [["Auckland, New Zealand",-36.8485,174.7633],["Wellington, New Zealand",-41.2865,174.7762]],
    "Belgium": [["Leuven, Belgium",50.8798,4.7005],["Brussels, Belgium",50.8503,4.3517],["Ghent, Belgium",51.0543,3.7174]],
}
SCHOLARSHIPS = [
    None, None, None, None, None, None,
    "DPST", "DPST", "DPST",
    "Royal Thai Government", "Royal Thai Government",
    "MEXT", "ASEAN Scholarship", "Chevening", "Fulbright",
    "Royal Golden Jubilee", "Anandamahidol", "King's Scholarship",
    "JPA", "DAAD", "Australia Awards", "KAIST Excellence Award",
    "Gates Cambridge", "Vanier CGS",
]

# Sample blog posts (linked to first two seeded users by index 0 and 1)
RAW_BLOGS = [
    {
        "slug": "life-at-mit",
        "title": "Life at MIT as a Thai Student",
        "content": (
            "# Life at MIT\n\nComing from KVIS to MIT was a culture shock in the best possible way. "
            "The sheer density of brilliant people per square meter is unlike anything I'd experienced — even at KVIS.\n\n"
            "## Academic Culture\n\nProblem sets here don't have right answers. Professors want you to argue, "
            "break assumptions, and defend your reasoning. I failed my first two midterms and nearly flew home. "
            "Then I found my lab group, pulled three all-nighters in a row, and somehow published my first paper by semester two.\n\n"
            "## The Thai Community\n\nThere are about 40 Thai students across grad programs. We cook together every Sunday "
            "— pad see ew on a $12 portable induction cooktop in a dorm kitchen. It keeps you sane.\n\n"
            "## What KVIS Prepared Me For\n\nThe research mindset. Knowing how to sit with a hard problem for days "
            "without panicking. That's rarer than people think, even at MIT."
        ),
        "excerpt": "I failed my first two MIT midterms and nearly flew home. Here's what kept me — and what KVIS quietly prepared me for without telling me.",
        "cover_image_url": "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80",
        "tags": "MIT,USA,grad school",
        "is_published": True,
        "published_at": "2024-02-01T08:00:00Z",
        "author_index": 0,
    },
    {
        "slug": "applying-dpst-scholarship",
        "title": "How to Apply for DPST Scholarship: My Experience",
        "content": (
            "# DPST Scholarship Guide\n\nI applied to DPST on a dare from my roommate. I didn't think I'd get it "
            "— I was ranked 12th in my class at KVIS, not first. But DPST isn't looking for the top scorer. "
            "They want someone who can think under pressure and explain their reasoning out loud.\n\n"
            "## The Written Exam\n\nThink olympiad-style questions with no partial credit. Time management is everything. "
            "Skip problems that eat more than 8 minutes and come back.\n\n"
            "## The Interview\n\nThree professors. One whiteboard. They gave me a physics problem I'd never seen "
            "and watched how I approached it — not whether I solved it. Narrate your thinking. Silence kills you.\n\n"
            "## What Happens After\n\nYou get assigned a field. Mine was physics. I wanted biology. I negotiated "
            "— politely — and they moved me. It's possible if you have a coherent reason.\n\n"
            "## Timeline\n\n- January: Applications open\n- March: Written exam\n- May: Interview round\n- July: Results and field assignment"
        ),
        "excerpt": "I applied on a dare and ranked 12th in my class. DPST isn't looking for the top scorer — here's what they're actually evaluating.",
        "cover_image_url": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
        "tags": "scholarship,DPST,tips",
        "is_published": True,
        "published_at": "2024-02-15T08:00:00Z",
        "author_index": 3,
    },
    {
        "slug": "working-in-singapore-finance",
        "title": "Breaking into Finance in Singapore",
        "content": (
            "# Finance Career in Singapore\n\nI graduated with a physics degree and zero finance experience. "
            "Eighteen months later I was an analyst at a sovereign wealth fund covering Southeast Asian tech. "
            "Here's exactly how that happened.\n\n"
            "## Why Singapore\n\nSingapore is the only city in Southeast Asia where you can work across all major "
            "asset classes — equities, fixed income, PE, VC — within a five-minute MRT ride.\n\n"
            "## Getting the First Interview\n\nCold emails don't work. LinkedIn DMs to VPs don't work. What worked: "
            "I found three KVIS alumni already in finance here, bought each of them coffee, and asked specific questions "
            "about their role. Two of them passed my CV internally.\n\n"
            "## The Interview Process\n\nExpect a case study, a markets knowledge test, and at least one technical "
            "interview if you're going quant. Know your DCF. Know why interest rates affect equity valuations.\n\n"
            "## What KVIS Gives You\n\nA reputation for being able to think quantitatively. Use it."
        ),
        "excerpt": "Physics degree, no finance experience. Eighteen months later I was at a sovereign wealth fund. Here's the exact path.",
        "cover_image_url": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
        "tags": "Singapore,finance,career",
        "is_published": True,
        "published_at": "2024-03-01T08:00:00Z",
        "author_index": 3,
    },
]


# ── Generators ────────────────────────────────────────────────────────────────

def _parse_dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)


def generate_alumni(per_cohort: int = 72) -> list[dict]:
    """
    Generate exactly `per_cohort` alumni for each of cohorts 1–9.
    Total = 9 × per_cohort = 648 by default.

    Cohort N roughly graduated 6 + N years before 2024, so:
      cohort 1 → started uni ~2015  (KVIS year 2009–2015 approx)
      cohort 9 → started uni ~2023
    """
    R = make_rng(42)
    used_emails: set[str] = set()
    alumni = []

    # KVIS cohort 1 entered around 2003; each cohort is ~1 year apart.
    # They graduate high school after 6 years, so cohort N graduates ~2003+N+6.
    COHORT_GRAD_YEAR = {n: 2003 + n + 6 for n in range(1, 10)}  # 2010..2018

    for cohort in range(1, 10):
        grad_year = COHORT_GRAD_YEAR[cohort]  # year they left KVIS / started uni

        for i in range(per_cohort):
            female = R() < 0.5
            first = pick(R, FIRSTS_F if female else FIRSTS_M)
            last = pick(R, LASTS_S)

            # Email: first.last_initial + short suffix to guarantee uniqueness
            base_handle = f"{first.lower()}.{last[0].lower()}"
            handle = base_handle
            suffix = 1
            while f"{handle}@kvis.ac.th" in used_emails:
                handle = f"{base_handle}{suffix}"
                suffix += 1
            email = f"{handle}@kvis.ac.th"
            used_emails.add(email)

            country = wpick(R, COUNTRY_W)
            major = wpick(R, MAJOR_W)
            degree = wpick(R, DEGREE_W)
            uni = pick(R, UNI_BY_COUNTRY.get(country, UNI_BY_COUNTRY["Thailand"]))
            place_data = pick(R, PLACES.get(country, PLACES["Thailand"]))
            scholarship = pick(R, SCHOLARSHIPS)

            # Education timing
            edu_start = grad_year  # enter uni same year they leave KVIS
            edu_end: int | None
            if degree == "Bachelor":
                edu_end = edu_start + 4
            elif degree in ("Master", "MD", "JD"):
                edu_end = edu_start + 6  # undergrad implied done first
            elif degree == "PhD":
                edu_end = None  # may still be studying
            else:
                edu_end = edu_start + 4

            # Career: only if education completed and not a very recent cohort
            careers = []
            if edu_end is not None and edu_end <= 2023:
                job_field = wpick(R, JOB_FIELD_W)
                employer_list = EMPLOYERS.get(job_field, EMPLOYERS["Other"])
                employer = pick(R, employer_list)
                title = pick(R, JOB_TITLES.get(job_field, JOB_TITLES["Other"]))
                careers = [{
                    "job_title": title,
                    "employer": employer,
                    "job_field": job_field,
                    "country": country,
                    "state": None,
                    "is_current": True,
                    "start_year": edu_end,
                    "end_year": None,
                }]

            month = 1 + int(R() * 12)
            day = 1 + int(R() * 28)
            created_year = 2023 + int(R() * 2)  # 2023–2024

            alumni.append({
                "id": uuid.uuid4(),
                "email": email,
                "first_name": first,
                "last_name": last,
                "kvis_year": cohort,
                "place": place_data[0],
                "latitude": place_data[1],
                "longitude": place_data[2],
                "country": country,
                "bio": None,
                "mbti": pick(R, MBTIS),
                "interests": None,
                "email_verified": True,
                "is_verified": True,
                "created_at": f"{created_year}-{month:02d}-{day:02d}T08:00:00Z",
                "education": [{
                    "uni_name": uni,
                    "degree": degree,
                    "major": major,
                    "country": country,
                    "state": None,
                    "scholarship": scholarship,
                    "start_year": edu_start,
                    "end_year": edu_end,
                }],
                "career": careers,
                "current_grade": None,
                "current_class": None,
                "current_elemental": None,
            })

    return alumni


def generate_current_students() -> list[dict]:
    """Generate current students for grades 10, 11, 12 (4 classes × 18 students each)."""
    HOUSES = ["earth", "water", "air", "fire"]
    R = make_rng(2026)
    used_handles: set[str] = set()
    students = []

    KVIS_LAT = 12.6916
    KVIS_LNG = 101.2787

    for grade in [10, 11, 12]:
        plan = []
        for cls in range(1, 5):
            for _ in range(18):
                plan.append({"cls": cls, "slot": len(plan)})
        for s in range(len(plan)):
            plan[s]["house"] = HOUSES[s % 4]
        for cls in range(1, 5):
            sl = [p for p in plan if p["cls"] == cls]
            for i in range(len(sl) - 1, 0, -1):
                j = int(R() * (i + 1))
                sl[i]["house"], sl[j]["house"] = sl[j]["house"], sl[i]["house"]

        for entry in plan:
            cls, house = entry["cls"], entry["house"]
            female = R() < 0.5
            first = pick(R, FIRSTS_F if female else FIRSTS_M)
            last = pick(R, LASTS_S)
            uid = uuid.uuid4()
            handle = f"{first.lower()}.{last[0].lower()}{uid}"
            while handle in used_handles:
                handle += "x"
            used_handles.add(handle)
            month = 1 + int(R() * 12)
            day = 1 + int(R() * 28)
            students.append({
                "id": uid,
                "email": f"{handle}@kvis.ac.th",
                "first_name": first,
                "last_name": last,
                "kvis_year": None,
                "place": "Rayong, Thailand",
                "latitude": KVIS_LAT + (R() - 0.5) * 0.01,
                "longitude": KVIS_LNG + (R() - 0.5) * 0.01,
                "country": "Thailand",
                "bio": None,
                "mbti": pick(R, MBTIS),
                "interests": None,
                "email_verified": True,
                "is_verified": True,
                "created_at": f"2025-{month:02d}-{day:02d}T08:00:00Z",
                "education": [],
                "career": [],
                "current_grade": grade,
                "current_class": cls,
                "current_elemental": house,
            })

    return students


# ── Main seed ─────────────────────────────────────────────────────────────────

def seed(db_url: str, clear: bool = False) -> None:
    engine = create_engine(db_url, echo=False)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        if clear:
            print("Clearing existing data...")
            for model in [Blog, Career, Education, User]:
                for row in session.exec(select(model)).all():
                    session.delete(row)
            session.commit()

        existing_users = session.exec(select(User)).all()
        if existing_users:
            print(f"DB already has {len(existing_users)} users. Use --clear to re-seed.")
            return

        print("Generating 72 alumni x 9 cohorts (648 total)...")
        alumni_dicts = generate_alumni(per_cohort=72)
        cohort_counts = {}
        for u in alumni_dicts:
            k = u["kvis_year"]
            cohort_counts[k] = cohort_counts.get(k, 0) + 1
        for c in sorted(cohort_counts):
            print(f"  Cohort {c}: {cohort_counts[c]} alumni")

        print("Generating current students...")
        student_dicts = generate_current_students()
        print(f"  {len(student_dicts)} current students")

        all_users = alumni_dicts + student_dicts
        print(f"Total users to insert: {len(all_users)}")

        # Assign unique slugs
        used_slugs: set[str] = set()
        for ud in all_users:
            base = slugify_name(ud["first_name"], ud["last_name"])
            candidate = base
            n = 2
            while candidate in used_slugs:
                candidate = f"{base}-{n}"
                n += 1
            used_slugs.add(candidate)
            ud["slug"] = candidate

        # Give first alumni a test password so you can log in
        test_email = alumni_dicts[0]["email"]
        test_password = hash_password("password")
        print(f"Test login: {test_email} / password")

        for ud in all_users:
            user = User(
                id=ud["id"],
                email=ud["email"],
                first_name=ud["first_name"],
                last_name=ud["last_name"],
                slug=ud["slug"],
                hashed_password=test_password if ud["email"] == test_email else None,
                kvis_year=ud.get("kvis_year"),
                place=ud.get("place"),
                latitude=ud.get("latitude"),
                longitude=ud.get("longitude"),
                country=ud.get("country"),
                bio=ud.get("bio"),
                mbti=ud.get("mbti"),
                interests=ud.get("interests"),
                facebook_url=ud.get("facebook_url"),
                linkedin_url=ud.get("linkedin_url"),
                website_url=ud.get("website_url"),
                line_id=ud.get("line_id"),
                email_verified=ud.get("email_verified", True),
                is_verified=ud.get("is_verified", True),
                current_grade=ud.get("current_grade"),
                created_at=_parse_dt(ud["created_at"]),
                updated_at=_parse_dt(ud.get("updated_at", ud["created_at"])),
            )
            session.add(user)

        session.flush()

        education_count = 0
        for ud in all_users:
            for e in ud.get("education", []):
                session.add(Education(
                    id=uuid.uuid4(),
                    user_id=ud["id"],
                    uni_name=e["uni_name"],
                    degree=e["degree"],
                    major=e["major"],
                    country=e["country"],
                    state=e.get("state"),
                    scholarship=e.get("scholarship"),
                    start_year=e.get("start_year"),
                    end_year=e.get("end_year"),
                ))
                education_count += 1

        career_count = 0
        for ud in all_users:
            for c in ud.get("career", []):
                session.add(Career(
                    id=uuid.uuid4(),
                    user_id=ud["id"],
                    job_title=c["job_title"],
                    employer=c["employer"],
                    job_field=c["job_field"],
                    country=c["country"],
                    state=c.get("state"),
                    is_current=c.get("is_current", False),
                    start_year=c.get("start_year"),
                    end_year=c.get("end_year"),
                ))
                career_count += 1

        print(f"Inserting {len(RAW_BLOGS)} blog posts...")
        for bd in RAW_BLOGS:
            author_uid = all_users[bd["author_index"]]["id"]
            session.add(Blog(
                id=uuid.uuid4(),
                author_id=author_uid,
                slug=bd["slug"],
                title=bd["title"],
                content=bd["content"],
                excerpt=bd.get("excerpt"),
                cover_image_url=bd.get("cover_image_url"),
                tags=bd.get("tags"),
                is_published=bd.get("is_published", False),
                published_at=_parse_dt(bd["published_at"]) if bd.get("published_at") else None,
                created_at=_parse_dt(bd.get("created_at", bd["published_at"])),
                updated_at=_parse_dt(bd.get("updated_at", bd["published_at"])),
            ))

        session.commit()
        print(
            f"\nDone. {len(all_users)} users ({len(alumni_dicts)} alumni + {len(student_dicts)} students), "
            f"{education_count} education records, {career_count} careers, {len(RAW_BLOGS)} blogs."
        )
        print(f"Test login: {test_email} / password")


if __name__ == "__main__":
    url = os.environ.get("DATABASE_URL")
    if not url:
        # Fall back to .env file in backend directory
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        if os.path.exists(env_path):
            for line in open(env_path):
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not url:
        print("ERROR: DATABASE_URL not set (env var or .env file)")
        sys.exit(1)
    clear = "--clear" in sys.argv
    seed(url, clear=clear)
