import csv
import random
import uuid
from faker import Faker

fake = Faker()

# -----------------------------
# Technology Skills
# -----------------------------
SKILLS = [
    "HTML","CSS","JavaScript","TypeScript","React","Next.js","Vue.js","Nuxt.js",
    "Angular","Svelte","Tailwind CSS","Bootstrap","Material UI","Shadcn UI",

    "Node.js","Express.js","NestJS","Python","FastAPI","Django","Flask",
    "Java","Spring Boot","C#",".NET","PHP","Laravel","Ruby on Rails",
    "Go","Rust",

    "React Native","Flutter","Android","Kotlin","Swift","iOS","Ionic",

    "PostgreSQL","MySQL","MongoDB","SQLite","Redis","Firebase Firestore",
    "MariaDB","Oracle","Microsoft SQL Server",

    "AWS","Google Cloud Platform","Microsoft Azure","Cloudflare",
    "DigitalOcean","Vercel","Netlify",

    "Docker","Kubernetes","GitHub Actions","GitLab CI/CD",
    "Jenkins","Terraform","Ansible","Nginx",

    "WordPress","WooCommerce","Shopify","Webflow","Drupal",
    "Strapi","Contentful","Sanity",

    "OpenAI API","LangChain","LlamaIndex","Hugging Face",
    "TensorFlow","PyTorch","Scikit-learn","RAG",
    "Vector Databases","FAISS","Pinecone","Ollama",

    "Apache Kafka","Apache Airflow","Spark",
    "Snowflake","Databricks",

    "Jest","Vitest","Cypress","Playwright","PyTest","Selenium",

    "Figma","Adobe XD",

    "Magento","BigCommerce",

    "Solidity","Web3.js","Ethereum",

    "Google Analytics","Power BI","Tableau",

    "GraphQL","REST API","gRPC","WebSockets"
]

# -----------------------------
# Designations
# -----------------------------
DESIGNATIONS = [
    "Software Engineer",
    "Senior Software Engineer",
    "Lead Software Engineer",
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "React Developer",
    "Next.js Developer",
    "Python Developer",
    "FastAPI Developer",
    "Node.js Developer",
    "Java Developer",
    ".NET Developer",
    "Flutter Developer",
    "React Native Developer",
    "Android Developer",
    "iOS Developer",
    "DevOps Engineer",
    "Cloud Engineer",
    "AI Engineer",
    "Machine Learning Engineer",
    "Data Engineer",
    "Data Scientist",
    "QA Engineer",
    "Automation Tester",
    "UI/UX Designer",
    "Product Designer",
    "WordPress Developer",
    "Shopify Developer",
    "Technical Architect",
    "Solution Architect",
    "Engineering Manager",
    "Project Manager",
    "Business Analyst",
    "Scrum Master"
]

# -----------------------------
# Departments
# -----------------------------
DEPARTMENTS = [
    "Frontend",
    "Backend",
    "Mobile",
    "AI",
    "Cloud",
    "DevOps",
    "QA",
    "Design",
    "Data Engineering",
    "Architecture",
    "Management",
    "Business Analysis"
]

LEVELS = [
    "BEGINNER",
    "INTERMEDIATE",
    "EXPERT"
]

STATUS = [
    "ACTIVE",
    "LEAVE"
]

# -----------------------------
# Hourly cost generator
# -----------------------------
def hourly_cost(exp):
    if exp <= 2:
        return random.randint(5, 7)

    if exp <= 5:
        return random.randint(7, 9)

    if exp <= 8:
        return random.randint(9, 11)

    if exp <= 12:
        return random.randint(11, 13)

    return random.randint(13, 15)


rows = []

for i in range(1,501):

    exp = random.randint(1,15)

    allocated = random.randint(0,8)

    available = 8 - allocated

    bench = allocated == 0

    employee = {

        "id": str(uuid.uuid4()),

        "employee_code": f"EMP{1000+i}",

        "full_name": fake.name(),

        "designation": random.choice(DESIGNATIONS),

        "department": random.choice(DEPARTMENTS),

        "experience_years": exp,

        "hourly_cost": hourly_cost(exp),

        "daily_capacity_hours": 8,

        "allocated_hours": allocated,

        "available_hours": available,

        "bench_status": bench,

        "global_bench": random.choice([True, False]),

        "employment_status": random.choices(
            STATUS,
            weights=[95,5]
        )[0],

        "skill_names": ", ".join(
            random.sample(SKILLS, random.randint(3,8))
        ),

        "skill_level": random.choices(
            LEVELS,
            weights=[20,50,30]
        )[0],

        "years_experience": exp,

        "created_at": fake.date_time_between(
            start_date="-3y",
            end_date="now"
        ),

        "pdf_path": "",

        "password": "Password@123"
    }

    rows.append(employee)


fieldnames = [
    "id",
    "employee_code",
    "full_name",
    "designation",
    "department",
    "experience_years",
    "hourly_cost",
    "daily_capacity_hours",
    "allocated_hours",
    "available_hours",
    "bench_status",
    "global_bench",
    "employment_status",
    "skill_names",
    "skill_level",
    "years_experience",
    "created_at",
    "pdf_path",
    "password"
]

with open("employees.csv","w",newline="",encoding="utf-8") as f:

    writer = csv.DictWriter(f,fieldnames=fieldnames)

    writer.writeheader()

    writer.writerows(rows)

print("✅ employees.csv created successfully with 500 employees.")