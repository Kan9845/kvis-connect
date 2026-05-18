"""
Seed the database with mock data mirroring mock-server/index.js.

Usage:
    DATABASE_URL="postgresql://..." python scripts/seed.py
    DATABASE_URL="..." python scripts/seed.py --clear   # wipe before seeding
"""

import ctypes
import os
import sys
from datetime import datetime, timezone

from sqlmodel import Session, SQLModel, create_engine, select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.models.blog import Blog
from app.models.user import Career, Education, User


# ── Mulberry32 RNG matching mock-server exactly ───────────────────────────────

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


# ── Hard-coded alumni (50 users from mock-server) ─────────────────────────────

RAW_ALUMNI = [
  {"id":1,"email":"somsak.k@kvis.ac.th","first_name":"Somsak","last_name":"Khamchoo","kvis_year":14,"place":"San Francisco, USA","latitude":37.7749,"longitude":-122.4194,"country":"USA","bio":"Machine learning researcher passionate about NLP and Thai language processing.","mbti":"INTJ","interests":"AI, chess, hiking","linkedin_url":"https://linkedin.com/in/somsakk","email_verified":True,"is_verified":True,"created_at":"2024-01-10T08:00:00Z","education":[{"uni_name":"MIT","degree":"Master","major":"Computer Science","country":"USA","state":"Massachusetts","scholarship":"DPST","start_year":2020,"end_year":2022}],"career":[{"job_title":"ML Engineer","employer":"Google","job_field":"Technology","country":"USA","state":"California","is_current":True,"start_year":2022,"end_year":None}]},
  {"id":2,"email":"nattakorn.p@kvis.ac.th","first_name":"Nattakorn","last_name":"Phongsuwan","kvis_year":16,"place":"London, UK","latitude":51.5074,"longitude":-0.1278,"country":"UK","bio":"Aerospace engineer working on satellite systems.","mbti":"ENTP","interests":"Rocketry, astronomy, photography","email_verified":True,"is_verified":True,"created_at":"2024-01-15T08:00:00Z","education":[{"uni_name":"Imperial College London","degree":"Master","major":"Aerospace Engineering","country":"UK","state":None,"scholarship":"Royal Thai Government","start_year":2019,"end_year":2021}],"career":[{"job_title":"Satellite Systems Engineer","employer":"Airbus","job_field":"Engineering","country":"UK","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":3,"email":"pimchanok.s@kvis.ac.th","first_name":"Pimchanok","last_name":"Srithai","kvis_year":18,"place":"Tokyo, Japan","latitude":35.6762,"longitude":139.6503,"country":"Japan","bio":"Biochemistry PhD student studying protein folding.","mbti":"INFJ","interests":"Biology, cooking, anime","email_verified":True,"is_verified":True,"created_at":"2024-02-01T08:00:00Z","education":[{"uni_name":"University of Tokyo","degree":"PhD","major":"Biochemistry","country":"Japan","state":None,"scholarship":"MEXT","start_year":2022,"end_year":None}],"career":[]},
  {"id":4,"email":"chaiwat.n@kvis.ac.th","first_name":"Chaiwat","last_name":"Nakorn","kvis_year":12,"place":"Singapore","latitude":1.3521,"longitude":103.8198,"country":"Singapore","bio":"Quantitative analyst at a leading hedge fund.","mbti":"ISTJ","interests":"Finance, statistics, golf","linkedin_url":"https://linkedin.com/in/chaiwatn","email_verified":True,"is_verified":True,"created_at":"2024-01-20T08:00:00Z","education":[{"uni_name":"NUS","degree":"Bachelor","major":"Mathematics","country":"Singapore","state":None,"scholarship":"DPST","start_year":2013,"end_year":2017},{"uni_name":"London School of Economics","degree":"Master","major":"Financial Mathematics","country":"UK","state":None,"scholarship":None,"start_year":2017,"end_year":2018}],"career":[{"job_title":"Quantitative Analyst","employer":"Citadel","job_field":"Finance","country":"Singapore","state":None,"is_current":True,"start_year":2019,"end_year":None}]},
  {"id":5,"email":"wipawee.t@kvis.ac.th","first_name":"Wipawee","last_name":"Taweerat","kvis_year":20,"place":"Sydney, Australia","latitude":-33.8688,"longitude":151.2093,"country":"Australia","bio":"Marine biologist studying coral reef ecosystems.","mbti":"ENFP","interests":"Ocean, diving, environmental activism","website_url":"https://wipawee.science","email_verified":True,"is_verified":True,"created_at":"2024-02-15T08:00:00Z","education":[{"uni_name":"University of Queensland","degree":"PhD","major":"Marine Biology","country":"Australia","state":"Queensland","scholarship":"Australia Awards","start_year":2021,"end_year":None}],"career":[]},
  {"id":6,"email":"thanet.w@kvis.ac.th","first_name":"Thanet","last_name":"Wiriya","kvis_year":15,"place":"Munich, Germany","latitude":48.1351,"longitude":11.582,"country":"Germany","bio":"Automotive engineer specialising in electric vehicle powertrains.","mbti":"ISTP","interests":"Cars, cycling, Bundesliga","email_verified":True,"is_verified":True,"created_at":"2024-01-25T08:00:00Z","education":[{"uni_name":"TU Munich","degree":"Master","major":"Mechanical Engineering","country":"Germany","state":"Bavaria","scholarship":"DAAD","start_year":2018,"end_year":2020}],"career":[{"job_title":"Powertrain Engineer","employer":"BMW","job_field":"Engineering","country":"Germany","state":"Bavaria","is_current":True,"start_year":2020,"end_year":None}]},
  {"id":7,"email":"sirima.c@kvis.ac.th","first_name":"Sirima","last_name":"Chantara","kvis_year":22,"place":"Boston, USA","latitude":42.3601,"longitude":-71.0589,"country":"USA","bio":"Medical student at Harvard, interested in oncology.","mbti":"ENTJ","interests":"Medicine, running, piano","email_verified":True,"is_verified":True,"created_at":"2024-03-01T08:00:00Z","education":[{"uni_name":"Harvard University","degree":"Bachelor","major":"Biology","country":"USA","state":"Massachusetts","scholarship":"DPST","start_year":2022,"end_year":None}],"career":[]},
  {"id":8,"email":"kritsada.m@kvis.ac.th","first_name":"Kritsada","last_name":"Mongkol","kvis_year":10,"place":"Chiang Mai, Thailand","latitude":18.7883,"longitude":98.9853,"country":"Thailand","bio":"Entrepreneur running an AgriTech startup in Northern Thailand.","mbti":"ESTP","interests":"Agriculture, startups, hiking","website_url":"https://agristart.th","email_verified":True,"is_verified":True,"created_at":"2024-01-05T08:00:00Z","education":[{"uni_name":"Chiang Mai University","degree":"Bachelor","major":"Agricultural Science","country":"Thailand","state":None,"scholarship":None,"start_year":2011,"end_year":2015}],"career":[{"job_title":"Co-Founder & CEO","employer":"AgriStart","job_field":"Business","country":"Thailand","state":None,"is_current":True,"start_year":2018,"end_year":None}]},
  {"id":9,"email":"parichat.r@kvis.ac.th","first_name":"Parichat","last_name":"Rungrot","kvis_year":17,"place":"Paris, France","latitude":48.8566,"longitude":2.3522,"country":"France","bio":"Fashion designer blending Thai textile heritage with contemporary style.","mbti":"ISFP","interests":"Fashion, art, travel","email_verified":True,"is_verified":True,"created_at":"2024-02-05T08:00:00Z","education":[{"uni_name":"Institut Français de la Mode","degree":"Master","major":"Fashion Design","country":"France","state":None,"scholarship":None,"start_year":2019,"end_year":2021}],"career":[{"job_title":"Senior Designer","employer":"Louis Vuitton","job_field":"Creative Arts","country":"France","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":10,"email":"thanakit.b@kvis.ac.th","first_name":"Thanakit","last_name":"Buranasiri","kvis_year":19,"place":"Toronto, Canada","latitude":43.6532,"longitude":-79.3832,"country":"Canada","bio":"Data scientist at a major Canadian bank.","mbti":"INTP","interests":"Statistics, board games, skiing","linkedin_url":"https://linkedin.com/in/thanakitb","email_verified":True,"is_verified":True,"created_at":"2024-01-30T08:00:00Z","education":[{"uni_name":"University of Toronto","degree":"Master","major":"Statistics","country":"Canada","state":"Ontario","scholarship":"Vanier CGS","start_year":2020,"end_year":2022}],"career":[{"job_title":"Senior Data Scientist","employer":"RBC","job_field":"Finance","country":"Canada","state":"Ontario","is_current":True,"start_year":2022,"end_year":None}]},
  {"id":11,"email":"phakphum.a@kvis.ac.th","first_name":"Phakphum","last_name":"Aumthai","kvis_year":13,"place":"San Francisco, USA","latitude":37.7749,"longitude":-122.4194,"country":"USA","bio":"Senior software engineer at a Bay Area startup.","mbti":"ENTP","interests":"Open source, coffee, surfing","website_url":"https://phakphum.dev","email_verified":True,"is_verified":True,"created_at":"2024-01-12T08:00:00Z","education":[{"uni_name":"Stanford University","degree":"Bachelor","major":"Computer Science","country":"USA","state":"California","scholarship":"DPST","start_year":2014,"end_year":2018}],"career":[{"job_title":"Staff Software Engineer","employer":"Stripe","job_field":"Technology","country":"USA","state":"California","is_current":True,"start_year":2020,"end_year":None}]},
  {"id":12,"email":"wanida.ph@kvis.ac.th","first_name":"Wanida","last_name":"Pholsena","kvis_year":21,"place":"Seoul, South Korea","latitude":37.5665,"longitude":126.978,"country":"South Korea","bio":"PhD student in Materials Science, researching next-gen batteries.","mbti":"INFP","interests":"K-pop, chemistry, yoga","email_verified":True,"is_verified":True,"created_at":"2024-02-20T08:00:00Z","education":[{"uni_name":"KAIST","degree":"PhD","major":"Materials Science","country":"South Korea","state":None,"scholarship":"Korean Government Scholarship","start_year":2023,"end_year":None}],"career":[]},
  {"id":13,"email":"nutchaya.w@kvis.ac.th","first_name":"Nutchaya","last_name":"Wongsiri","kvis_year":11,"place":"Leiden, Netherlands","latitude":52.1601,"longitude":4.497,"country":"Netherlands","bio":"Theoretical physicist working on quantum computing algorithms.","mbti":"INTP","interests":"Quantum mechanics, classical music, chess","linkedin_url":"https://linkedin.com/in/nutchayaw","email_verified":True,"is_verified":True,"created_at":"2024-01-08T08:00:00Z","education":[{"uni_name":"Leiden University","degree":"PhD","major":"Physics","country":"Netherlands","state":None,"scholarship":"DPST","start_year":2019,"end_year":2023}],"career":[{"job_title":"Quantum Research Scientist","employer":"QuTech","job_field":"Research","country":"Netherlands","state":None,"is_current":True,"start_year":2023,"end_year":None}]},
  {"id":14,"email":"rattana.c@kvis.ac.th","first_name":"Rattana","last_name":"Chailek","kvis_year":20,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Policy analyst at the National Science and Technology Development Agency.","mbti":"INFJ","interests":"Public policy, literature, cycling","email_verified":True,"is_verified":True,"created_at":"2024-01-22T08:00:00Z","education":[{"uni_name":"Mahidol University","degree":"Bachelor","major":"Computer Science","country":"Thailand","state":None,"scholarship":None,"start_year":2018,"end_year":2022}],"career":[{"job_title":"Policy Analyst","employer":"NSTDA","job_field":"Government","country":"Thailand","state":None,"is_current":True,"start_year":2022,"end_year":None}]},
  {"id":15,"email":"arnon.s@kvis.ac.th","first_name":"Arnon","last_name":"Siripong","kvis_year":16,"place":"Zurich, Switzerland","latitude":47.3769,"longitude":8.5417,"country":"Switzerland","bio":"Risk manager at a global investment bank, specialising in derivatives.","mbti":"ISTJ","interests":"Finance, skiing, watches","linkedin_url":"https://linkedin.com/in/arnons","email_verified":True,"is_verified":True,"created_at":"2024-02-03T08:00:00Z","education":[{"uni_name":"ETH Zurich","degree":"Master","major":"Quantitative Finance","country":"Switzerland","state":None,"scholarship":"Royal Thai Government","start_year":2018,"end_year":2020}],"career":[{"job_title":"Risk Manager","employer":"UBS","job_field":"Finance","country":"Switzerland","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":16,"email":"kanlaya.s@kvis.ac.th","first_name":"Kanlaya","last_name":"Suthep","kvis_year":23,"place":"Cambridge, UK","latitude":52.2053,"longitude":0.1218,"country":"UK","bio":"PhD candidate in neuroscience studying memory consolidation during sleep.","mbti":"INTJ","interests":"Neuroscience, meditation, rowing","email_verified":True,"is_verified":True,"created_at":"2024-03-05T08:00:00Z","education":[{"uni_name":"University of Cambridge","degree":"PhD","major":"Neuroscience","country":"UK","state":None,"scholarship":"Gates Cambridge","start_year":2023,"end_year":None}],"career":[]},
  {"id":17,"email":"woraphat.l@kvis.ac.th","first_name":"Woraphat","last_name":"Limsakul","kvis_year":15,"place":"New York, USA","latitude":40.7128,"longitude":-74.006,"country":"USA","bio":"Investment banker focused on infrastructure deals across Southeast Asia.","mbti":"ENTJ","interests":"Finance, tennis, travel","linkedin_url":"https://linkedin.com/in/woraphatl","email_verified":True,"is_verified":True,"created_at":"2024-01-18T08:00:00Z","education":[{"uni_name":"Columbia University","degree":"Bachelor","major":"Economics","country":"USA","state":"New York","scholarship":"DPST","start_year":2013,"end_year":2017}],"career":[{"job_title":"Vice President","employer":"Goldman Sachs","job_field":"Finance","country":"USA","state":"New York","is_current":True,"start_year":2020,"end_year":None}]},
  {"id":18,"email":"nareerat.p@kvis.ac.th","first_name":"Nareerat","last_name":"Pongpat","kvis_year":19,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Physician at Ramathibodi Hospital specialising in internal medicine.","mbti":"ISFJ","interests":"Medicine, volunteer work, cooking","email_verified":True,"is_verified":True,"created_at":"2024-01-14T08:00:00Z","education":[{"uni_name":"Mahidol University","degree":"MD","major":"Medicine","country":"Thailand","state":None,"scholarship":None,"start_year":2014,"end_year":2020}],"career":[{"job_title":"Physician","employer":"Ramathibodi Hospital","job_field":"Healthcare","country":"Thailand","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":19,"email":"surasit.t@kvis.ac.th","first_name":"Surasit","last_name":"Thammasiri","kvis_year":14,"place":"Stockholm, Sweden","latitude":59.3293,"longitude":18.0686,"country":"Sweden","bio":"Environmental engineer working on carbon capture technology.","mbti":"ISFJ","interests":"Sustainability, hiking, Nordic skiing","email_verified":True,"is_verified":True,"created_at":"2024-02-08T08:00:00Z","education":[{"uni_name":"KTH Royal Institute of Technology","degree":"Master","major":"Environmental Engineering","country":"Sweden","state":None,"scholarship":"Swedish Institute","start_year":2017,"end_year":2019}],"career":[{"job_title":"Process Engineer","employer":"Climeworks","job_field":"Engineering","country":"Sweden","state":None,"is_current":True,"start_year":2019,"end_year":None}]},
  {"id":20,"email":"pattaraporn.y@kvis.ac.th","first_name":"Pattaraporn","last_name":"Yodprasit","kvis_year":21,"place":"Auckland, New Zealand","latitude":-36.8485,"longitude":174.7633,"country":"New Zealand","bio":"PhD candidate developing biodegradable polymers for drug delivery.","mbti":"INFP","interests":"Chemistry, hiking, photography","email_verified":True,"is_verified":True,"created_at":"2024-02-18T08:00:00Z","education":[{"uni_name":"University of Auckland","degree":"PhD","major":"Chemistry","country":"New Zealand","state":None,"scholarship":"NZ Government Scholarship","start_year":2022,"end_year":None}],"career":[]},
  {"id":21,"email":"komkrit.s@kvis.ac.th","first_name":"Komkrit","last_name":"Saikaew","kvis_year":17,"place":"Hong Kong","latitude":22.3193,"longitude":114.1694,"country":"Hong Kong","bio":"Asset manager focused on emerging market equities.","mbti":"ESTJ","interests":"Finance, hiking, Cantonese food","linkedin_url":"https://linkedin.com/in/komkrits","email_verified":True,"is_verified":True,"created_at":"2024-01-28T08:00:00Z","education":[{"uni_name":"University of Hong Kong","degree":"Master","major":"Finance","country":"Hong Kong","state":None,"scholarship":None,"start_year":2018,"end_year":2019}],"career":[{"job_title":"Portfolio Manager","employer":"BlackRock","job_field":"Finance","country":"Hong Kong","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":22,"email":"napassorn.r@kvis.ac.th","first_name":"Napassorn","last_name":"Rattana","kvis_year":22,"place":"Los Angeles, USA","latitude":34.0522,"longitude":-118.2437,"country":"USA","bio":"Software engineer at a streaming company, working on recommendation systems.","mbti":"ENFP","interests":"Music, film, machine learning","website_url":"https://napassorn.dev","email_verified":True,"is_verified":True,"created_at":"2024-03-08T08:00:00Z","education":[{"uni_name":"UCLA","degree":"Bachelor","major":"Computer Science","country":"USA","state":"California","scholarship":"DPST","start_year":2022,"end_year":None}],"career":[]},
  {"id":23,"email":"danai.p@kvis.ac.th","first_name":"Danai","last_name":"Prompan","kvis_year":12,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Director at the Ministry of Science, shaping Thailand's digital economy policy.","mbti":"ENTJ","interests":"Policy, economics, golf","linkedin_url":"https://linkedin.com/in/danaip","email_verified":True,"is_verified":True,"created_at":"2024-01-06T08:00:00Z","education":[{"uni_name":"Chulalongkorn University","degree":"Bachelor","major":"Political Science","country":"Thailand","state":None,"scholarship":None,"start_year":2008,"end_year":2012},{"uni_name":"NIDA","degree":"Master","major":"Public Administration","country":"Thailand","state":None,"scholarship":None,"start_year":2014,"end_year":2016}],"career":[{"job_title":"Director","employer":"Ministry of Science and Technology","job_field":"Government","country":"Thailand","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":24,"email":"sutida.m@kvis.ac.th","first_name":"Sutida","last_name":"Maneerat","kvis_year":18,"place":"Edinburgh, UK","latitude":55.9533,"longitude":-3.1883,"country":"UK","bio":"Genetics researcher investigating hereditary disease mechanisms.","mbti":"INTJ","interests":"Genetics, birdwatching, Scottish culture","email_verified":True,"is_verified":True,"created_at":"2024-02-12T08:00:00Z","education":[{"uni_name":"University of Edinburgh","degree":"PhD","major":"Genetics","country":"UK","state":None,"scholarship":"Chevening","start_year":2021,"end_year":None}],"career":[]},
  {"id":25,"email":"veeraphon.k@kvis.ac.th","first_name":"Veeraphon","last_name":"Kanchanawat","kvis_year":13,"place":"Shanghai, China","latitude":31.2304,"longitude":121.4737,"country":"China","bio":"Regional business development director bridging Thai and Chinese markets.","mbti":"ESTP","interests":"Business, Mandarin, martial arts","linkedin_url":"https://linkedin.com/in/veeraphonk","email_verified":True,"is_verified":True,"created_at":"2024-01-16T08:00:00Z","education":[{"uni_name":"Peking University","degree":"Master","major":"International Business","country":"China","state":None,"scholarship":"Chinese Government Scholarship","start_year":2016,"end_year":2018}],"career":[{"job_title":"Business Development Director","employer":"SCG International","job_field":"Business","country":"China","state":None,"is_current":True,"start_year":2019,"end_year":None}]},
  {"id":26,"email":"chalida.t@kvis.ac.th","first_name":"Chalida","last_name":"Thongkham","kvis_year":20,"place":"Melbourne, Australia","latitude":-37.8136,"longitude":144.9631,"country":"Australia","bio":"Architect designing sustainable urban housing projects.","mbti":"ENFJ","interests":"Architecture, urban planning, cycling","website_url":"https://chalidaarch.com","email_verified":True,"is_verified":True,"created_at":"2024-02-22T08:00:00Z","education":[{"uni_name":"University of Melbourne","degree":"Master","major":"Architecture","country":"Australia","state":"Victoria","scholarship":"Australia Awards","start_year":2020,"end_year":2022}],"career":[{"job_title":"Architect","employer":"Hassell Studio","job_field":"Engineering","country":"Australia","state":"Victoria","is_current":True,"start_year":2022,"end_year":None}]},
  {"id":27,"email":"noppadol.s@kvis.ac.th","first_name":"Noppadol","last_name":"Suwan","kvis_year":16,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Cardiologist at King Chulalongkorn Memorial Hospital.","mbti":"ISFJ","interests":"Cardiology, badminton, Thai food","email_verified":True,"is_verified":True,"created_at":"2024-01-19T08:00:00Z","education":[{"uni_name":"Chulalongkorn University","degree":"MD","major":"Medicine","country":"Thailand","state":None,"scholarship":None,"start_year":2012,"end_year":2018}],"career":[{"job_title":"Cardiologist","employer":"King Chulalongkorn Memorial Hospital","job_field":"Healthcare","country":"Thailand","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":28,"email":"thitiporn.w@kvis.ac.th","first_name":"Thitiporn","last_name":"Wichaikul","kvis_year":24,"place":"Chicago, USA","latitude":41.8781,"longitude":-87.6298,"country":"USA","bio":"Undergraduate studying computational chemistry at UChicago.","mbti":"INTP","interests":"Chemistry, programming, jazz","email_verified":True,"is_verified":True,"created_at":"2024-03-10T08:00:00Z","education":[{"uni_name":"University of Chicago","degree":"Bachelor","major":"Chemistry","country":"USA","state":"Illinois","scholarship":"DPST","start_year":2023,"end_year":None}],"career":[]},
  {"id":29,"email":"pakpoom.b@kvis.ac.th","first_name":"Pakpoom","last_name":"Burasiri","kvis_year":11,"place":"Taipei, Taiwan","latitude":25.033,"longitude":121.5654,"country":"Taiwan","bio":"Chip designer at TSMC working on next-generation semiconductor nodes.","mbti":"ISTJ","interests":"Electronics, cycling, street food","linkedin_url":"https://linkedin.com/in/pakpoomb","email_verified":True,"is_verified":True,"created_at":"2024-01-09T08:00:00Z","education":[{"uni_name":"National Taiwan University","degree":"PhD","major":"Electrical Engineering","country":"Taiwan","state":None,"scholarship":"Ministry of Education Taiwan","start_year":2015,"end_year":2020}],"career":[{"job_title":"Senior Design Engineer","employer":"TSMC","job_field":"Technology","country":"Taiwan","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":30,"email":"achara.s@kvis.ac.th","first_name":"Achara","last_name":"Supaporn","kvis_year":19,"place":"Amsterdam, Netherlands","latitude":52.3676,"longitude":4.9041,"country":"Netherlands","bio":"Data engineer building real-time analytics pipelines for a European fintech.","mbti":"ISTP","interests":"Data engineering, cycling, museums","email_verified":True,"is_verified":True,"created_at":"2024-01-27T08:00:00Z","education":[{"uni_name":"University of Amsterdam","degree":"Master","major":"Data Science","country":"Netherlands","state":None,"scholarship":None,"start_year":2020,"end_year":2022}],"career":[{"job_title":"Data Engineer","employer":"Adyen","job_field":"Technology","country":"Netherlands","state":None,"is_current":True,"start_year":2022,"end_year":None}]},
  {"id":31,"email":"teerawit.k@kvis.ac.th","first_name":"Teerawit","last_name":"Khumdee","kvis_year":15,"place":"Berlin, Germany","latitude":52.52,"longitude":13.405,"country":"Germany","bio":"Structural engineer working on large-scale public infrastructure across Europe.","mbti":"ESTJ","interests":"Engineering, architecture, running","email_verified":True,"is_verified":True,"created_at":"2024-02-06T08:00:00Z","education":[{"uni_name":"TU Berlin","degree":"Master","major":"Civil Engineering","country":"Germany","state":"Berlin","scholarship":"DAAD","start_year":2017,"end_year":2019}],"career":[{"job_title":"Structural Engineer","employer":"Arup","job_field":"Engineering","country":"Germany","state":"Berlin","is_current":True,"start_year":2019,"end_year":None}]},
  {"id":32,"email":"monthira.r@kvis.ac.th","first_name":"Monthira","last_name":"Rojanasiri","kvis_year":22,"place":"Osaka, Japan","latitude":34.6937,"longitude":135.5023,"country":"Japan","bio":"Master's student in robotics, researching human-robot interaction.","mbti":"ENTP","interests":"Robotics, gaming, ramen","email_verified":True,"is_verified":True,"created_at":"2024-03-03T08:00:00Z","education":[{"uni_name":"Osaka University","degree":"Master","major":"Robotics","country":"Japan","state":None,"scholarship":"MEXT","start_year":2023,"end_year":None}],"career":[]},
  {"id":33,"email":"panuwat.k@kvis.ac.th","first_name":"Panuwat","last_name":"Kongphan","kvis_year":18,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Civil engineer leading infrastructure projects for Thailand's high-speed rail.","mbti":"ESTJ","interests":"Infrastructure, trains, football","linkedin_url":"https://linkedin.com/in/panuwatk","email_verified":True,"is_verified":True,"created_at":"2024-01-23T08:00:00Z","education":[{"uni_name":"Chulalongkorn University","degree":"Bachelor","major":"Civil Engineering","country":"Thailand","state":None,"scholarship":None,"start_year":2015,"end_year":2019}],"career":[{"job_title":"Project Engineer","employer":"State Railway of Thailand","job_field":"Engineering","country":"Thailand","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":34,"email":"siriphan.s@kvis.ac.th","first_name":"Siriphan","last_name":"Sukwong","kvis_year":14,"place":"Seattle, USA","latitude":47.6062,"longitude":-122.3321,"country":"USA","bio":"Principal engineer at Microsoft working on cloud infrastructure.","mbti":"INTJ","interests":"Cloud computing, hiking, coffee","linkedin_url":"https://linkedin.com/in/siriphans","email_verified":True,"is_verified":True,"created_at":"2024-01-11T08:00:00Z","education":[{"uni_name":"Stanford University","degree":"Master","major":"Electrical Engineering","country":"USA","state":"California","scholarship":"DPST","start_year":2013,"end_year":2015}],"career":[{"job_title":"Principal Engineer","employer":"Microsoft","job_field":"Technology","country":"USA","state":"Washington","is_current":True,"start_year":2017,"end_year":None}]},
  {"id":35,"email":"nuntaporn.c@kvis.ac.th","first_name":"Nuntaporn","last_name":"Charoenwong","kvis_year":21,"place":"Geneva, Switzerland","latitude":46.2044,"longitude":6.1432,"country":"Switzerland","bio":"Global health officer at WHO, coordinating vaccine programmes in Southeast Asia.","mbti":"ENFJ","interests":"Public health, languages, hiking","email_verified":True,"is_verified":True,"created_at":"2024-02-25T08:00:00Z","education":[{"uni_name":"Johns Hopkins University","degree":"Master","major":"Public Health","country":"USA","state":"Maryland","scholarship":"Fulbright","start_year":2019,"end_year":2021}],"career":[{"job_title":"Health Officer","employer":"World Health Organization","job_field":"Healthcare","country":"Switzerland","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":36,"email":"atchariya.p@kvis.ac.th","first_name":"Atchariya","last_name":"Pisai","kvis_year":17,"place":"Dublin, Ireland","latitude":53.3498,"longitude":-6.2603,"country":"Ireland","bio":"Backend engineer at a global tech company, building high-scale distributed systems.","mbti":"INTP","interests":"Distributed systems, Gaelic football, whiskey","website_url":"https://atchariya.io","email_verified":True,"is_verified":True,"created_at":"2024-02-07T08:00:00Z","education":[{"uni_name":"Trinity College Dublin","degree":"Bachelor","major":"Computer Science","country":"Ireland","state":None,"scholarship":None,"start_year":2014,"end_year":2018}],"career":[{"job_title":"Senior Backend Engineer","employer":"Meta","job_field":"Technology","country":"Ireland","state":None,"is_current":True,"start_year":2020,"end_year":None}]},
  {"id":37,"email":"korrakot.p@kvis.ac.th","first_name":"Korrakot","last_name":"Phetphan","kvis_year":13,"place":"Singapore","latitude":1.3521,"longitude":103.8198,"country":"Singapore","bio":"Postdoctoral researcher developing catalysts for green hydrogen production.","mbti":"INFJ","interests":"Chemistry, sustainability, bouldering","email_verified":True,"is_verified":True,"created_at":"2024-01-17T08:00:00Z","education":[{"uni_name":"NUS","degree":"PhD","major":"Chemistry","country":"Singapore","state":None,"scholarship":"DPST","start_year":2016,"end_year":2021}],"career":[{"job_title":"Postdoctoral Researcher","employer":"A*STAR","job_field":"Research","country":"Singapore","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":38,"email":"jintana.s@kvis.ac.th","first_name":"Jintana","last_name":"Suwan","kvis_year":20,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Paediatric surgeon at Siriraj Hospital with a focus on congenital anomalies.","mbti":"ISFJ","interests":"Surgery, Thai classical dance, gardening","email_verified":True,"is_verified":True,"created_at":"2024-01-21T08:00:00Z","education":[{"uni_name":"Mahidol University","degree":"MD","major":"Medicine","country":"Thailand","state":None,"scholarship":None,"start_year":2013,"end_year":2019}],"career":[{"job_title":"Paediatric Surgeon","employer":"Siriraj Hospital","job_field":"Healthcare","country":"Thailand","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":39,"email":"aumaporn.t@kvis.ac.th","first_name":"Aumaporn","last_name":"Tipsuk","kvis_year":23,"place":"Boston, USA","latitude":42.3601,"longitude":-71.0589,"country":"USA","bio":"Graduate student studying computational biology at Harvard.","mbti":"INFP","interests":"Bioinformatics, poetry, yoga","email_verified":True,"is_verified":True,"created_at":"2024-03-06T08:00:00Z","education":[{"uni_name":"Harvard University","degree":"Master","major":"Computational Biology","country":"USA","state":"Massachusetts","scholarship":"DPST","start_year":2023,"end_year":None}],"career":[]},
  {"id":40,"email":"sittipong.w@kvis.ac.th","first_name":"Sittipong","last_name":"Wattana","kvis_year":16,"place":"Vancouver, Canada","latitude":49.2827,"longitude":-123.1207,"country":"Canada","bio":"Full-stack developer at a Vancouver gaming studio.","mbti":"ENTP","interests":"Game dev, snowboarding, craft beer","email_verified":True,"is_verified":True,"created_at":"2024-01-31T08:00:00Z","education":[{"uni_name":"University of British Columbia","degree":"Master","major":"Computer Science","country":"Canada","state":"British Columbia","scholarship":None,"start_year":2019,"end_year":2021}],"career":[{"job_title":"Senior Developer","employer":"Electronic Arts","job_field":"Technology","country":"Canada","state":"British Columbia","is_current":True,"start_year":2021,"end_year":None}]},
  {"id":41,"email":"phornchai.k@kvis.ac.th","first_name":"Phornchai","last_name":"Kasem","kvis_year":12,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Investment director at a leading Thai private equity firm.","mbti":"ENTJ","interests":"Finance, Muay Thai, whiskey","linkedin_url":"https://linkedin.com/in/phornchaik","email_verified":True,"is_verified":True,"created_at":"2024-01-07T08:00:00Z","education":[{"uni_name":"Thammasat University","degree":"Bachelor","major":"Economics","country":"Thailand","state":None,"scholarship":None,"start_year":2008,"end_year":2012}],"career":[{"job_title":"Investment Director","employer":"Kasikorn Bank PE","job_field":"Finance","country":"Thailand","state":None,"is_current":True,"start_year":2018,"end_year":None}]},
  {"id":42,"email":"nonthaburi.s@kvis.ac.th","first_name":"Nonthaburi","last_name":"Srisuk","kvis_year":19,"place":"Paris, France","latitude":48.8566,"longitude":2.3522,"country":"France","bio":"PhD candidate at the Sorbonne researching contemporary Southeast Asian art.","mbti":"INFP","interests":"Art, film, philosophy","email_verified":True,"is_verified":True,"created_at":"2024-02-09T08:00:00Z","education":[{"uni_name":"Université Paris I Panthéon-Sorbonne","degree":"PhD","major":"Art History","country":"France","state":None,"scholarship":"Franco-Thai Scholarship","start_year":2022,"end_year":None}],"career":[]},
  {"id":43,"email":"chalermpol.s@kvis.ac.th","first_name":"Chalermpol","last_name":"Surin","kvis_year":15,"place":"Dubai, UAE","latitude":25.2048,"longitude":55.2708,"country":"UAE","bio":"Strategy consultant advising GCC governments on economic diversification.","mbti":"ENTJ","interests":"Strategy, football, desert camping","linkedin_url":"https://linkedin.com/in/chalermpos","email_verified":True,"is_verified":True,"created_at":"2024-02-11T08:00:00Z","education":[{"uni_name":"INSEAD","degree":"Master","major":"Business Administration","country":"France","state":None,"scholarship":None,"start_year":2017,"end_year":2018}],"career":[{"job_title":"Senior Manager","employer":"McKinsey & Company","job_field":"Business","country":"UAE","state":None,"is_current":True,"start_year":2019,"end_year":None}]},
  {"id":44,"email":"patcharaporn.c@kvis.ac.th","first_name":"Patcharaporn","last_name":"Chaimit","kvis_year":20,"place":"Seoul, South Korea","latitude":37.5665,"longitude":126.978,"country":"South Korea","bio":"AI researcher at Samsung focusing on on-device language models.","mbti":"INTJ","interests":"AI, K-drama, rock climbing","email_verified":True,"is_verified":True,"created_at":"2024-03-02T08:00:00Z","education":[{"uni_name":"KAIST","degree":"Master","major":"Artificial Intelligence","country":"South Korea","state":None,"scholarship":"KAIST Excellence Award","start_year":2021,"end_year":2023}],"career":[{"job_title":"AI Research Engineer","employer":"Samsung Research","job_field":"Technology","country":"South Korea","state":None,"is_current":True,"start_year":2023,"end_year":None}]},
  {"id":45,"email":"wannida.t@kvis.ac.th","first_name":"Wannida","last_name":"Thepsiri","kvis_year":21,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Education innovation officer driving STEM curriculum reform in Thai secondary schools.","mbti":"ENFJ","interests":"Education, social innovation, pottery","email_verified":True,"is_verified":True,"created_at":"2024-02-26T08:00:00Z","education":[{"uni_name":"Chulalongkorn University","degree":"Master","major":"Education","country":"Thailand","state":None,"scholarship":None,"start_year":2020,"end_year":2022}],"career":[{"job_title":"Education Officer","employer":"Ministry of Education","job_field":"Government","country":"Thailand","state":None,"is_current":True,"start_year":2022,"end_year":None}]},
  {"id":46,"email":"pakkanut.c@kvis.ac.th","first_name":"Pakkanut","last_name":"Chompoo","kvis_year":17,"place":"Boston, USA","latitude":42.3601,"longitude":-71.0589,"country":"USA","bio":"MD-PhD candidate at Harvard Medical School studying immunotherapy for solid tumours.","mbti":"INFJ","interests":"Oncology, violin, long-distance running","email_verified":True,"is_verified":True,"created_at":"2024-02-13T08:00:00Z","education":[{"uni_name":"Harvard Medical School","degree":"MD","major":"Medicine","country":"USA","state":"Massachusetts","scholarship":"DPST","start_year":2020,"end_year":None}],"career":[]},
  {"id":47,"email":"atchara.r@kvis.ac.th","first_name":"Atchara","last_name":"Rattanakorn","kvis_year":23,"place":"Singapore","latitude":1.3521,"longitude":103.8198,"country":"Singapore","bio":"Analyst at a sovereign wealth fund covering Southeast Asian tech investments.","mbti":"ISTJ","interests":"Finance, cooking, yoga","linkedin_url":"https://linkedin.com/in/atcharar","email_verified":True,"is_verified":True,"created_at":"2024-03-09T08:00:00Z","education":[{"uni_name":"NUS Business School","degree":"Bachelor","major":"Finance","country":"Singapore","state":None,"scholarship":"ASEAN Scholarship","start_year":2021,"end_year":None}],"career":[]},
  {"id":48,"email":"wipawin.m@kvis.ac.th","first_name":"Wipawin","last_name":"Mahawan","kvis_year":11,"place":"Chiang Mai, Thailand","latitude":18.7883,"longitude":98.9853,"country":"Thailand","bio":"Social entrepreneur running an organic farm network connecting highland farmers to Bangkok markets.","mbti":"ENFP","interests":"Social enterprise, farming, music","website_url":"https://wipawin.farm","email_verified":True,"is_verified":True,"created_at":"2024-01-04T08:00:00Z","education":[{"uni_name":"Chiang Mai University","degree":"Bachelor","major":"Agricultural Economics","country":"Thailand","state":None,"scholarship":None,"start_year":2009,"end_year":2013}],"career":[{"job_title":"Co-Founder","employer":"Highland Harvest","job_field":"Business","country":"Thailand","state":None,"is_current":True,"start_year":2016,"end_year":None}]},
  {"id":49,"email":"jiraporn.n@kvis.ac.th","first_name":"Jiraporn","last_name":"Niratpattana","kvis_year":18,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"Research scientist at BIOTEC developing rapid diagnostic tools for tropical diseases.","mbti":"INTJ","interests":"Microbiology, badminton, sci-fi novels","email_verified":True,"is_verified":True,"created_at":"2024-01-26T08:00:00Z","education":[{"uni_name":"Mahidol University","degree":"PhD","major":"Microbiology","country":"Thailand","state":None,"scholarship":"Royal Golden Jubilee","start_year":2016,"end_year":2021}],"career":[{"job_title":"Research Scientist","employer":"BIOTEC","job_field":"Research","country":"Thailand","state":None,"is_current":True,"start_year":2021,"end_year":None}]},
  {"id":50,"email":"thanaphat.r@kvis.ac.th","first_name":"Thanaphat","last_name":"Rojanapruk","kvis_year":24,"place":"Bangkok, Thailand","latitude":13.7563,"longitude":100.5018,"country":"Thailand","bio":"First-year student at Chulalongkorn Faculty of Engineering, passionate about robotics.","mbti":"ENTP","interests":"Robotics, coding, basketball","email_verified":True,"is_verified":True,"created_at":"2024-03-15T08:00:00Z","education":[{"uni_name":"Chulalongkorn University","degree":"Bachelor","major":"Mechanical Engineering","country":"Thailand","state":None,"scholarship":None,"start_year":2024,"end_year":None}],"career":[]},
]

RAW_BLOGS = [
  {"slug":"life-at-mit","title":"Life at MIT as a Thai Student","content":"# Life at MIT\n\nComing from KVIS to MIT was a culture shock in the best possible way. The sheer density of brilliant people per square meter is unlike anything I'd experienced — even at KVIS.\n\n## Academic Culture\n\nProblem sets here don't have right answers. Professors want you to argue, break assumptions, and defend your reasoning. I failed my first two midterms and nearly flew home. Then I found my lab group, pulled three all-nighters in a row, and somehow published my first paper by semester two.\n\n## The Thai Community\n\nThere are about 40 Thai students across grad programs. We cook together every Sunday — pad see ew on a $12 portable induction cooktop in a dorm kitchen. It keeps you sane.\n\n## What KVIS Prepared Me For\n\nThe research mindset. Knowing how to sit with a hard problem for days without panicking. That's rarer than people think, even at MIT.","excerpt":"I failed my first two MIT midterms and nearly flew home. Here's what kept me — and what KVIS quietly prepared me for without telling me.","cover_image_url":"https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&q=80","tags":"MIT,USA,grad school","is_published":True,"published_at":"2024-02-01T08:00:00Z","author_id":1},
  {"slug":"applying-dpst-scholarship","title":"How to Apply for DPST Scholarship: My Experience","content":"# DPST Scholarship Guide\n\nI applied to DPST on a dare from my roommate. I didn't think I'd get it — I was ranked 12th in my class at KVIS, not first. But DPST isn't looking for the top scorer. They want someone who can think under pressure and explain their reasoning out loud.\n\n## The Written Exam\n\nThink olympiad-style questions with no partial credit. Time management is everything. Skip problems that eat more than 8 minutes and come back.\n\n## The Interview\n\nThree professors. One whiteboard. They gave me a physics problem I'd never seen and watched how I approached it — not whether I solved it. Narrate your thinking. Silence kills you.\n\n## What Happens After\n\nYou get assigned a field. Mine was physics. I wanted biology. I negotiated — politely — and they moved me. It's possible if you have a coherent reason.\n\n## Timeline\n\n- January: Applications open\n- March: Written exam\n- May: Interview round\n- July: Results and field assignment","excerpt":"I applied on a dare and ranked 12th in my class. DPST isn't looking for the top scorer — here's what they're actually evaluating.","cover_image_url":"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80","tags":"scholarship,DPST,tips","is_published":True,"published_at":"2024-02-15T08:00:00Z","author_id":4},
  {"slug":"working-in-singapore-finance","title":"Breaking into Finance in Singapore","content":"# Finance Career in Singapore\n\nI graduated with a physics degree and zero finance experience. Eighteen months later I was an analyst at a sovereign wealth fund covering Southeast Asian tech. Here's exactly how that happened.\n\n## Why Singapore\n\nSingapore is the only city in Southeast Asia where you can work across all major asset classes — equities, fixed income, PE, VC — within a five-minute MRT ride. The talent density is absurd. So is the cost of living, but the compensation offsets it if you're at the right firm.\n\n## Getting the First Interview\n\nCold emails don't work. LinkedIn DMs to VPs don't work. What worked: I found three KVIS alumni already in finance here, bought each of them coffee, and asked specific questions about their role. Two of them passed my CV internally. One of those became a referral that got me an interview.\n\n## The Interview Process\n\nExpect a case study, a markets knowledge test, and at least one technical interview if you're going quant. Know your DCF. Know why interest rates affect equity valuations. Know the current macro environment and have an opinion on it — not a memorized one.\n\n## What KVIS Gives You\n\nA reputation for being able to think quantitatively. Use it. Finance is full of people who can network. Fewer can model.","excerpt":"Physics degree, no finance experience. Eighteen months later I was at a sovereign wealth fund. Here's the exact path — coffee meetings, cold emails that failed, and what actually worked.","cover_image_url":"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80","tags":"Singapore,finance,career","is_published":True,"published_at":"2024-03-01T08:00:00Z","author_id":4},
]


# ── Data pools (mirrors mock-server) ─────────────────────────────────────────

FIRSTS = ["Anan","Apirak","Arthit","Boonmee","Chai","Chakrit","Chanin","Decha","Ekarat","Issara","Jakkrit","Kasem","Kittipong","Korn","Krit","Manop","Narongchai","Nattapong","Nirun","Pakorn","Panya","Phanuwat","Pongsak","Prasert","Rapeepan","Sakda","Sangchai","Sirichai","Somkid","Sompong","Suchart","Sunan","Surapong","Tanin","Thanawat","Thira","Veerapol","Wachira","Wanchai","Worawit","Yongyuth","Anuwat","Boonsong","Chaiyan","Danai","Niran","Pisit","Rachan","Saksit","Theerapong","Wisut","Anong","Apinya","Aporn","Benjawan","Boonsri","Chalisa","Chanika","Chompoo","Dao","Duangporn","Hathaichanok","Jiraporn","Kanchana","Kanya","Kessaree","Lalita","Malee","Mananchaya","Manee","Napaporn","Narisara","Nirada","Nittaya","Nuengruethai","Orawan","Pakwan","Patcharin","Phailin","Piyaporn","Pornthip","Praweena","Ratchada","Rinrada","Saichon","Sasipim","Siriporn","Somying","Sunisa","Suphanida","Tarisa","Thanaporn","Thidarat","Uraiwan","Wannisa","Warangkana","Wilai","Yupin","Kanyarat","Pattaraporn","Supitcha","Tippawan","Wanida"]
LASTS = ["Suwannathat","Tangkijvanich","Phongphaew","Srisaard","Wattanapong","Sukphanthawee","Chaisongkhram","Phakdiphisut","Limthongkul","Ngamthanachoti","Bunyaviroch","Suphawat","Prasertdee","Khamwan","Klaybor","Tinnirat","Pongdee","Inthanon","Kaewkamnerd","Kanchanaporn","Lertphol","Maneesin","Naowarat","Onsuwan","Phromsiri","Phongtongkam","Rattanaphol","Saetang","Sangtong","Siribut","Subin","Suttiwan","Tantibanchachai","Thaweesak","Vongkitisin","Watthanachai","Wongsanee","Yindee","Pannarunothai","Saengthong","Jindaprasert","Kraisin","Mongkolchai","Nopachai","Phantharak","Rachatabordeesakul","Sangkaroen","Termpong","Thanasit","Vivathana","Wasinwattana","Yotsuwankul","Charoenpong","Boriboon","Chumphon","Dechawat","Inthanin","Jaroensri","Khamsuk","Lertsiri","Moonsri","Norachit","Polchart","Ratanakul","Suttisak","Theerasak","Udomchai","Visetpong","Wongchai","Yothin","Bunyasarn","Chuenchom"]
MBTIS = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"]
COUNTRY_W = [{"w":58,"v":"Thailand"},{"w":8,"v":"USA"},{"w":6,"v":"UK"},{"w":5,"v":"Japan"},{"w":4,"v":"Singapore"},{"w":3,"v":"Germany"},{"w":2,"v":"Australia"},{"w":2,"v":"Canada"},{"w":2,"v":"Switzerland"},{"w":2,"v":"South Korea"},{"w":1,"v":"Netherlands"},{"w":1,"v":"Hong Kong"},{"w":1,"v":"France"},{"w":1,"v":"Taiwan"},{"w":1,"v":"Sweden"},{"w":1,"v":"China"}]
MAJOR_W = [{"w":16,"v":"Computer Science"},{"w":9,"v":"Software Engineering"},{"w":5,"v":"Data Science"},{"w":9,"v":"Mechanical Engineering"},{"w":8,"v":"Electrical Engineering"},{"w":6,"v":"Chemical Engineering"},{"w":5,"v":"Civil Engineering"},{"w":3,"v":"Aerospace Engineering"},{"w":5,"v":"Biomedical Engineering"},{"w":4,"v":"Materials Science"},{"w":7,"v":"Physics"},{"w":5,"v":"Mathematics"},{"w":5,"v":"Chemistry"},{"w":5,"v":"Biology"},{"w":4,"v":"Biochemistry"},{"w":3,"v":"Microbiology"},{"w":3,"v":"Neuroscience"},{"w":7,"v":"Medicine"},{"w":3,"v":"Pharmacy"},{"w":2,"v":"Dentistry"},{"w":5,"v":"Economics"},{"w":4,"v":"Business Administration"},{"w":3,"v":"Finance"},{"w":2,"v":"Architecture"},{"w":2,"v":"Industrial Design"},{"w":2,"v":"Environmental Science"},{"w":2,"v":"Agricultural Science"}]
UNI_BY_COUNTRY = {"Thailand":["Chulalongkorn University","Mahidol University","Kasetsart University","Thammasat University","King Mongkut's University of Technology Thonburi","King Mongkut's Institute of Technology Ladkrabang","King Mongkut's University of Technology North Bangkok","Chiang Mai University","Khon Kaen University","Prince of Songkla University","Silpakorn University","Srinakharinwirot University","Naresuan University","VISTEC","SIIT, Thammasat","Burapha University"],"USA":["MIT","Harvard University","Stanford University","Carnegie Mellon University","UC Berkeley","Caltech","Cornell University","Yale University","Princeton University","Columbia University","University of Michigan","University of Washington","Georgia Tech","Johns Hopkins University","UIUC","UCLA","University of Chicago","Purdue University","Brown University"],"UK":["University of Cambridge","University of Oxford","Imperial College London","UCL","LSE","University of Edinburgh","King's College London","University of Warwick","University of Manchester","University of Bristol"],"Singapore":["NUS","NTU","SMU","SUTD"],"Japan":["University of Tokyo","Kyoto University","Osaka University","Tokyo Institute of Technology","Tohoku University","Waseda University","Hokkaido University"],"Germany":["TU Munich","RWTH Aachen","TU Berlin","Heidelberg University","LMU Munich","Karlsruhe Institute of Technology"],"Canada":["University of Toronto","McGill University","University of British Columbia","University of Waterloo"],"Australia":["University of Melbourne","University of Sydney","ANU","UNSW","Monash University"],"Switzerland":["ETH Zurich","EPFL"],"South Korea":["KAIST","Seoul National University","POSTECH","Yonsei University"],"Netherlands":["Delft University of Technology","TU Eindhoven","University of Amsterdam"],"Hong Kong":["HKUST","University of Hong Kong","CUHK"],"France":["École Polytechnique","Sciences Po","Sorbonne University","ENS Paris"],"Taiwan":["National Taiwan University"],"Sweden":["KTH Royal Institute of Technology","Lund University"],"China":["Tsinghua University","Peking University","Fudan University"]}
PLACES = {"Thailand":[["Bangkok, Thailand",13.7563,100.5018],["Chiang Mai, Thailand",18.7883,98.9853],["Khon Kaen, Thailand",16.4419,102.835],["Phuket, Thailand",7.8804,98.3923],["Hat Yai, Thailand",7.0086,100.4747],["Rayong, Thailand",12.6802,101.287],["Pathum Thani, Thailand",14.0208,100.5251],["Nakhon Ratchasima, Thailand",14.9799,102.0978]],"USA":[["Cambridge, USA",42.3736,-71.1097],["Berkeley, USA",37.8715,-122.273],["Stanford, USA",37.4275,-122.1697],["New York, USA",40.7128,-74.006],["Pittsburgh, USA",40.4406,-79.9959],["Seattle, USA",47.6062,-122.3321],["Ann Arbor, USA",42.2808,-83.743],["Atlanta, USA",33.749,-84.388],["Pasadena, USA",34.1478,-118.1445],["Ithaca, USA",42.444,-76.5019]],"UK":[["London, UK",51.5074,-0.1278],["Cambridge, UK",52.2053,0.1218],["Oxford, UK",51.752,-1.2577],["Edinburgh, UK",55.9533,-3.1883],["Manchester, UK",53.4808,-2.2426]],"Singapore":[["Singapore",1.3521,103.8198]],"Japan":[["Tokyo, Japan",35.6762,139.6503],["Kyoto, Japan",35.0116,135.7681],["Osaka, Japan",34.6937,135.5023],["Sendai, Japan",38.2682,140.8694]],"Germany":[["Munich, Germany",48.1351,11.582],["Berlin, Germany",52.52,13.405],["Aachen, Germany",50.7753,6.0839],["Heidelberg, Germany",49.3988,8.6724]],"Canada":[["Toronto, Canada",43.6532,-79.3832],["Vancouver, Canada",49.2827,-123.1207],["Waterloo, Canada",43.4643,-80.5204],["Montreal, Canada",45.5017,-73.5673]],"Australia":[["Melbourne, Australia",-37.8136,144.9631],["Sydney, Australia",-33.8688,151.2093],["Canberra, Australia",-35.2809,149.13]],"Switzerland":[["Zurich, Switzerland",47.3769,8.5417],["Lausanne, Switzerland",46.5197,6.6323]],"South Korea":[["Seoul, South Korea",37.5665,126.978],["Daejeon, South Korea",36.3504,127.3845]],"Netherlands":[["Delft, Netherlands",52.0116,4.3571],["Amsterdam, Netherlands",52.3676,4.9041],["Eindhoven, Netherlands",51.4416,5.4697]],"Hong Kong":[["Hong Kong",22.3193,114.1694]],"France":[["Paris, France",48.8566,2.3522]],"Taiwan":[["Taipei, Taiwan",25.033,121.5654]],"Sweden":[["Stockholm, Sweden",59.3293,18.0686],["Lund, Sweden",55.7047,13.191]],"China":[["Beijing, China",39.9042,116.4074],["Shanghai, China",31.2304,121.4737]]}
SCHOLARSHIPS = [None,None,None,None,None,None,"DPST","DPST","DPST","Royal Thai Government","Royal Thai Government","MEXT","ASEAN Scholarship","Chevening","Fulbright","Royal Golden Jubilee","Anandamahidol","King's Scholarship","JPA","DAAD"]

FIRSTS_M = ["Anan","Akira","Apirak","Arthit","Boon","Chai","Chakrit","Chanin","Decha","Ekarat","Issara","Jakkrit","Kasem","Korn","Krit","Manop","Nattapong","Pakorn","Panya","Phanuwat","Pongsak","Prasert","Sakda","Sirichai","Somkid","Sompong","Suchart","Surapong","Tanin","Thanawat","Veerapol","Wachira","Wanchai","Worawit","Yongyuth","Anuwat","Boonsong","Chaiyan","Danai","Niran","Pisit","Rachan","Saksit","Theerapong","Wisut","Kit","Pun","Tee","Top","Bank"]
FIRSTS_F = ["Anong","Apinya","Aporn","Benjawan","Boonsri","Chalisa","Chanika","Chompoo","Dao","Duangporn","Hathaichanok","Jiraporn","Kanchana","Kanya","Kessaree","Lalita","Malee","Manee","Napaporn","Narisara","Nittaya","Orawan","Pakwan","Patcharin","Phailin","Piyaporn","Pornthip","Praweena","Ratchada","Saichon","Sasipim","Siriporn","Sunisa","Tarisa","Thanaporn","Thidarat","Uraiwan","Wannisa","Warangkana","Wilai","Yupin","Kanyarat","Pattaraporn","Supitcha","Tippawan","Wanida","Fern","Mint","Ploy","Nam"]
LASTS_S = ["Suwannathat","Tangkijvanich","Phongphaew","Srisaard","Wattanapong","Sukphanthawee","Chaisongkhram","Phakdiphisut","Limthongkul","Ngamthanachoti","Bunyaviroch","Suphawat","Prasertdee","Khamwan","Klaybor","Tinnirat","Pongdee","Inthanon","Kaewkamnerd","Kanchanaporn","Lertphol","Maneesin","Naowarat","Onsuwan","Phromsiri","Phongtongkam","Rattanaphol","Saetang","Sangtong","Siribut","Subin","Suttiwan","Tantibanchachai","Thaweesak","Vongkitisin","Watthanachai","Wongsanee","Yindee","Pannarunothai","Saengthong","Jindaprasert","Kraisin","Mongkolchai","Nopachai","Phantharak","Sangkaroen","Termpong","Thanasit","Vivathana","Wasinwattana","Charoenpong","Boriboon","Chumphon","Dechawat","Jaroensri","Khamsuk","Lertsiri","Norachit","Ratanakul","Suttisak","Theerasak","Udomchai","Visetpong","Wongchai","Yothin"]


def _parse_dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)


def generate_alumni_backfill(existing: list[dict]) -> list[dict]:
    """Mirrors mock-server generateCohortPopulation()."""
    alumni = [dict(u) for u in existing]
    # Normalize kvis_year 10-24 → 1-9
    for u in alumni:
        if u.get("kvis_year") is not None:
            u["kvis_year"] = ((u["kvis_year"] - 10 + 900) % 9) + 1

    R = make_rng(42)
    next_id = max(u["id"] for u in alumni) + 1

    for cohort in range(1, 10):
        have = sum(1 for u in alumni if u.get("kvis_year") == cohort)
        target = 70 + int(R() * 4)
        need = max(0, target - have)
        for _ in range(need):
            country = wpick(R, COUNTRY_W)
            major = wpick(R, MAJOR_W)
            unis = UNI_BY_COUNTRY.get(country, UNI_BY_COUNTRY["Thailand"])
            uni = pick(R, unis)
            places = PLACES.get(country, PLACES["Thailand"])
            place_data = pick(R, places)
            first = pick(R, FIRSTS)
            last = pick(R, LASTS)
            uid = next_id
            next_id += 1
            start_year = 2014 + cohort + 2
            month = 1 + int(R() * 12)
            day = 1 + int(R() * 28)
            alumni.append({
                "id": uid,
                "email": f"{first.lower()}.{last[0].lower()}{uid}@kvis.ac.th",
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
                "created_at": f"2024-{month:02d}-{day:02d}T08:00:00Z",
                "education": [{"uni_name": uni, "degree": "Bachelor", "major": major, "country": country, "state": None, "scholarship": pick(R, SCHOLARSHIPS), "start_year": start_year, "end_year": None}],
                "career": [],
                "current_grade": None,
                "current_class": None,
                "current_elemental": None,
            })

    return alumni


def generate_current_students(existing_max_id: int) -> list[dict]:
    """Mirrors mock-server seedCurrentStudents()."""
    HOUSES = ["earth", "water", "air", "fire"]
    R = make_rng(2026)
    next_id = existing_max_id + 1
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
            uid = next_id
            next_id += 1
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

        print("Generating alumni backfill...")
        alumni_dicts = generate_alumni_backfill(RAW_ALUMNI)
        print(f"  {len(alumni_dicts)} alumni total")

        max_alumni_id = max(u["id"] for u in alumni_dicts)
        print("Generating current students...")
        student_dicts = generate_current_students(max_alumni_id)
        print(f"  {len(student_dicts)} current students")

        all_users = alumni_dicts + student_dicts
        print(f"Inserting {len(all_users)} users...")

        # Give user id=1 (Somsak) a password so you can log in
        test_password = hash_password("password")

        for ud in all_users:
            user = User(
                id=ud["id"],
                email=ud["email"],
                first_name=ud["first_name"],
                last_name=ud["last_name"],
                hashed_password=test_password if ud["id"] == 1 else None,
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
                current_class=ud.get("current_class"),
                current_elemental=ud.get("current_elemental"),
                created_at=_parse_dt(ud["created_at"]),
                updated_at=_parse_dt(ud.get("updated_at", ud["created_at"])),
            )
            session.add(user)

        session.flush()

        edu_id = 1
        for ud in all_users:
            for e in ud.get("education", []):
                session.add(Education(
                    id=edu_id,
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
                edu_id += 1

        career_id = 1
        for ud in all_users:
            for c in ud.get("career", []):
                session.add(Career(
                    id=career_id,
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
                career_id += 1

        print("Inserting 3 blogs...")
        for i, bd in enumerate(RAW_BLOGS, start=1):
            session.add(Blog(
                id=i,
                author_id=bd["author_id"],
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
        print(f"Done. {len(all_users)} users, {edu_id-1} education records, {career_id-1} careers, 3 blogs.")
        print("Test login: somsak.k@kvis.ac.th / password")


if __name__ == "__main__":
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)
    clear = "--clear" in sys.argv
    seed(url, clear=clear)
