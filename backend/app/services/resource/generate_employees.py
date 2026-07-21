import csv
import random
import uuid
import os
from faker import Faker

# Use the Indian locale for Faker to keep names consistent with the original list
fake = Faker('en_IN')

# Keep original names and add more using Faker to reach 200
ORIGINAL_NAMES = [
    "RAHUL KUMAR GUPTA","Jhumjhum Sen Shil","Abhijit Das","SHUBHANKAR GHOSH","SATYAJEET DEY",
    "Sudip Debnath","Rupak Kr Dutta","Anirban Bhowmick","AMIT KUMAR DAS","RAMKRISHNA PAL",
    "Samresh Kumar Jha","SANJEEV KUMAR PRASAD","Sreya Dhar","Anushka Polley","Nitai Koiri",
    "Sudip Kumar Podder","Mousumi Dey","Somdeep Kanu","Himanshu Bansal","Subhrajyoti Das",
    "Koushik Ghosh","Sounak Saha","Dipti Bhowmik","Monojit Das","Sk Mahammad Afzal",
    "Sarthak Mukherjee","Arijit Karmakar","Ankan Ghosh","Md Zubair Siddique","Sourav Mondal",
    "Sayan Chatterjee","Ankita Banerjee","Tanya Shaw","Nahid Azad","Sandip Roy","Moushami Dey",
    "Abhijit Bhunia","Somnath Garai","Suchismita Priyadarsinee","Santanu Ghosh","Rachit Guha",
    "Arijit Mondal","Shashi Singh","Shreya Tewari","Niloy Das","Sandipan Sarkar",
    "Sayak Samaddar","Subrata Jana","Deepak Kumar Jha","Anjali Singh","Debajyoti Debnath",
    "Anal Kumar Saha","Pratik Dhar","Danish Raza","Sagar Chakraborty","Byomkesh Bhattacharjee",
    "Debapriya Maji","Reedhiranjan Das","Kumar Arnav","Sayeli Chakraborty","Abhishek Dutta",
    "Ashutosh Kumar","Monish Dhiman","Omprakash Yadav"
]

EMPLOYEE_NAMES = ORIGINAL_NAMES.copy()
# Generate additional names to reach exactly 200
while len(EMPLOYEE_NAMES) < 200:
    name = fake.name()
    if name not in EMPLOYEE_NAMES:
        EMPLOYEE_NAMES.append(name)

# Enhanced tech stacks categorized by domain
DOMAINS = {
    "Frontend": ["React", "Next.js", "Angular", "Vue.js", "Tailwind CSS", "TypeScript", "JavaScript", "HTML", "CSS", "Redux", "Svelte"],
    "Backend": ["Node.js", "Express.js", "Python", "FastAPI", "Django", "Java", "Spring Boot", "Laravel", "PostgreSQL", "Go", "MySQL", "MongoDB"],
    "Full Stack": ["React", "Next.js", "Node.js", "Express.js", "MongoDB", "PostgreSQL", "Docker", "GitHub Actions", "TypeScript", "GraphQL", "Redis"],
    "AI": ["Python", "OpenAI API", "Google Gemini", "LangChain", "LlamaIndex", "Hugging Face", "FAISS", "Pinecone", "TensorFlow", "PyTorch", "Scikit-learn"],
    "Cloud": ["AWS", "Microsoft Azure", "Google Cloud Platform", "Docker", "Kubernetes", "Terraform", "Cloudflare", "Linux"],
    "DevOps": ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "Terraform", "Ansible", "Nginx", "Linux", "AWS", "Bash", "Prometheus", "Grafana"],
    "WordPress": ["WordPress", "WooCommerce", "PHP", "MySQL", "JavaScript", "HTML", "CSS", "Elementor", "Bootstrap"],
    "Shopify": ["Shopify", "HTML", "CSS", "JavaScript", "Liquid", "React", "Node.js"],
    "Mobile": ["Flutter", "React Native", "Android", "Kotlin", "Swift", "iOS", "Firebase", "SQLite"],
    "Data": ["Apache Spark", "Apache Airflow", "Snowflake", "Databricks", "BigQuery", "Python", "SQL", "dbt", "Kafka"],
    "QA": ["Selenium", "Cypress", "Playwright", "PyTest", "Jest", "Postman", "Appium", "JIRA"],
    "Microsoft": ["Power BI", "Power Apps", "SharePoint", "Microsoft Azure", "C#", ".NET Core", "SQL Server"]
}

DESIG = {
    "Frontend": ["Frontend Developer", "React Developer", "UI Developer"],
    "Backend": ["Backend Developer", "Python Developer", "Java Developer", "Node.js Developer"],
    "Full Stack": ["Full Stack Developer", "Software Engineer"],
    "AI": ["AI Engineer", "ML Engineer", "Data Scientist"],
    "Cloud": ["Cloud Engineer", "Cloud Architect"],
    "DevOps": ["DevOps Engineer", "Site Reliability Engineer"],
    "WordPress": ["WordPress Developer"],
    "Shopify": ["Shopify Developer"],
    "Mobile": ["Mobile Developer", "iOS Developer", "Android Developer"],
    "Data": ["Data Engineer", "Data Analyst"],
    "QA": ["QA Engineer", "Automation Tester"],
    "Microsoft": ["Power Platform Developer", ".NET Developer"]
}

LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"]

def cost(exp):
    if exp < 3: return random.randint(5, 7)
    if exp < 6: return random.randint(8, 10)
    if exp < 10: return random.randint(11, 13)
    return random.randint(14, 15)

rows = []
for i, name in enumerate(EMPLOYEE_NAMES, 1):
    dom = random.choice(list(DOMAINS))
    exp = random.randint(1, 15)
    alloc = random.randint(0, 8)
    
    # Ensure they get a decent mix of core skills from their domain
    num_skills = random.randint(3, min(7, len(DOMAINS[dom])))
    skills = random.sample(DOMAINS[dom], num_skills)
    
    rows.append({
        "id": str(uuid.uuid4()),
        "employee_code": f"TK{i:04d}",
        "full_name": name,
        "designation": random.choice(DESIG[dom]),
        "department": dom,
        "experience_years": exp,
        "hourly_cost": cost(exp),
        "daily_capacity_hours": 8,
        "allocated_hours": alloc,
        "available_hours": 8 - alloc,
        "bench_status": alloc == 0,
        "global_bench": random.choice([True, False]),
        "employment_status": "ACTIVE" if random.random() < 0.95 else "LEAVE",
        "skill_names": ", ".join(skills),
        "skill_level": random.choice(LEVELS),
        "years_experience": exp,
        "created_at": fake.date_time_between(start_date="-3y", end_date="now").isoformat(),
        "pdf_path": "",
        "password": "Password@123"
    })

fields = list(rows[0].keys())

# Ensure employees.csv is generated in the same directory as this script
csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "employees.csv")

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

print(f"Created {csv_path} with {len(rows)} employees.")
