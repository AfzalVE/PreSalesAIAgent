// Mock Data for ProposalFlow AI

export const MOCK_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Alex Rivera",
    role: "Lead Software Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    skills: ["React", "Node.js", "AWS", "Kubernetes", "GraphQL", "System Design"],
    experience: "8 years",
    hourlyCost: 95,
    availability: "Available",
    benchStatus: false,
    globalBenchStatus: false,
    currentAllocation: 80,
    availableHours: 8,
  },
  {
    id: "emp-2",
    name: "Sarah Chen",
    role: "Senior AI/ML Engineer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100",
    skills: ["Python", "PyTorch", "OpenAI API", "LangChain", "VectorDBs", "Data Pipeline"],
    experience: "6 years",
    hourlyCost: 110,
    availability: "Partially Available",
    benchStatus: true,
    globalBenchStatus: true,
    currentAllocation: 50,
    availableHours: 20,
  },
  {
    id: "emp-3",
    name: "Marcus Vance",
    role: "Lead Product Designer",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100",
    skills: ["Figma", "UI/UX", "Design Systems", "Prototyping", "Wise Aesthetics"],
    experience: "7 years",
    hourlyCost: 85,
    availability: "Available",
    benchStatus: true,
    globalBenchStatus: false,
    currentAllocation: 0,
    availableHours: 40,
  },
  {
    id: "emp-4",
    name: "Elena Rostova",
    role: "Senior Full Stack Engineer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    skills: ["React", "TypeScript", "Next.js", "PostgreSQL", "Tailwind CSS"],
    experience: "5 years",
    hourlyCost: 75,
    availability: "Fully Allocated",
    benchStatus: false,
    globalBenchStatus: false,
    currentAllocation: 100,
    availableHours: 0,
  },
  {
    id: "emp-5",
    name: "Tariq Mahmood",
    role: "DevOps & Cloud Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
    skills: ["Docker", "Terraform", "GitHub Actions", "AWS", "CI/CD", "Monitoring"],
    experience: "6 years",
    hourlyCost: 90,
    availability: "Available",
    benchStatus: true,
    globalBenchStatus: true,
    currentAllocation: 20,
    availableHours: 32,
  },
  {
    id: "emp-6",
    name: "Chloe Jenkins",
    role: "Senior QA Automation Engineer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
    skills: ["Cypress", "Playwright", "Jest", "CI/CD", "TypeScript", "Load Testing"],
    experience: "4 years",
    hourlyCost: 65,
    availability: "Available",
    benchStatus: true,
    globalBenchStatus: false,
    currentAllocation: 40,
    availableHours: 24,
  }
];

export const MOCK_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "OpenAI API", "AWS", "Docker", "Figma", 
  "Kubernetes", "GraphQL", "Tailwind CSS", "Terraform", "PostgreSQL", "Cypress"
];

export const MOCK_CLIENTS = [
  { id: "c-1", name: "Acme Corp", email: "onboarding@acme.com", industry: "B2B SaaS" },
  { id: "c-2", name: "Fintech Flow", email: "hello@fintechflow.io", industry: "Finance" },
  { id: "c-3", name: "HealthSync", email: "contact@healthsync.org", industry: "Healthcare" }
];

export const MOCK_PROJECTS = [
  {
    id: "proj-1",
    name: "Zenith Retail Portal",
    domain: "E-Commerce",
    description: "A next-generation digital storefront for high-end boutique brands with AI sizing recommendation engine.",
    techStack: ["React", "Node.js", "PostgreSQL", "OpenAI API"],
    budget: 85000,
    timeline: "3 months"
  }
];

export const MOCK_ANALYTICS = {
  totalProposals: 142,
  approvedProposals: 98,
  revenuePotential: 2450000,
  benchResources: 18,
  employeeUtilization: 82.5,
  proposalConversionRate: 69.0,
  resourceAllocationEfficiency: 91.2,
  monthlyRevenue: [
    { name: "Jan", revenue: 120000, proposals: 10 },
    { name: "Feb", revenue: 150000, proposals: 12 },
    { name: "Mar", revenue: 180000, proposals: 15 },
    { name: "Apr", revenue: 220000, proposals: 18 },
    { name: "May", revenue: 260000, proposals: 22 },
    { name: "Jun", revenue: 310000, proposals: 25 },
  ],
  skillDistribution: [
    { name: "Frontend", value: 35 },
    { name: "Backend", value: 25 },
    { name: "AI/ML", value: 15 },
    { name: "DevOps", value: 13 },
    { name: "Design", value: 12 },
  ],
  benchDistribution: [
    { name: "Allocated", value: 75, color: "#10b981" },
    { name: "Available (Bench)", value: 25, color: "#f59e0b" },
  ]
};

export const MOCK_PROPOSAL_STAGES = {
  mvp: {
    label: "MVP Launch",
    description: "Launch in weeks. Focus on core user value with a lean, functional layout.",
    timeline: "6 Weeks",
    budget: 35000,
    teamSize: 3,
    team: [
      { name: "Alex Rivera", role: "Lead Architect (Part-time)" },
      { name: "Elena Rostova", role: "Full Stack Engineer" },
      { name: "Marcus Vance", role: "Product Designer" }
    ],
    features: [
      { name: "Authentication & User Management", status: "active", desc: "Basic login, registration, email confirmation." },
      { name: "Core Product Engine", status: "active", desc: "The primary project workflows and essential workspace." },
      { name: "Basic Analytics Integration", status: "active", desc: "Telemetry tracking for user conversions." },
      { name: "Advanced AI Optimization", status: "locked", desc: "Requires vector search and model tuning layers." },
      { name: "Multi-tenant Dashboard & Billing", status: "locked", desc: "Requires Stripe subscription integration." },
      { name: "High Availability & Multi-Region Failover", status: "locked", desc: "Requires Terraform infrastructure expansions." }
    ],
    architecture: {
      client: "Web Client (React / Tailwind)",
      apiGateway: "Simple REST Gateway",
      services: ["Core Service (Node.js)"],
      databases: ["PostgreSQL"]
    }
  },
  growth: {
    label: "Growth Engine",
    description: "Perfect for scaling startups. Adds automated workflows, standard AI integrations, and full team alignment.",
    timeline: "12 Weeks",
    budget: 75000,
    teamSize: 5,
    team: [
      { name: "Alex Rivera", role: "Lead Architect" },
      { name: "Elena Rostova", role: "Full Stack Engineer" },
      { name: "Sarah Chen", role: "Senior AI Engineer (Part-time)" },
      { name: "Marcus Vance", role: "Product Designer" },
      { name: "Chloe Jenkins", role: "QA Engineer" }
    ],
    features: [
      { name: "Authentication & User Management", status: "active", desc: "Basic login, registration, email confirmation." },
      { name: "Core Product Engine", status: "active", desc: "The primary project workflows and essential workspace." },
      { name: "Basic Analytics Integration", status: "active", desc: "Telemetry tracking for user conversions." },
      { name: "Advanced AI Optimization", status: "active", desc: "Semantic search, smart suggestions, LLM agent integration." },
      { name: "Multi-tenant Dashboard & Billing", status: "active", desc: "Full subscriptions, workspaces, usage invoices." },
      { name: "High Availability & Multi-Region Failover", status: "locked", desc: "Requires Terraform infrastructure expansions." }
    ],
    architecture: {
      client: "Client Web + Mobile SPA",
      apiGateway: "Kong API Gateway",
      services: ["Core App Service", "AI Translation Agent", "Notification Server"],
      databases: ["PostgreSQL", "Redis Cache", "Vector DB"]
    }
  },
  enterprise: {
    label: "Enterprise Scale",
    description: "High compliance, infinite scalability, microservices mesh, automated pipelines, and full team focus.",
    timeline: "20 Weeks",
    budget: 145000,
    teamSize: 7,
    team: [
      { name: "Alex Rivera", role: "Lead Architect" },
      { name: "Elena Rostova", role: "Senior Dev" },
      { name: "Sarah Chen", role: "Lead AI Engineer" },
      { name: "Marcus Vance", role: "UX Director" },
      { name: "Tariq Mahmood", role: "DevOps Principal" },
      { name: "Chloe Jenkins", role: "Lead QA" },
      { name: "Additional Developer", role: "Frontend Specialist" }
    ],
    features: [
      { name: "Authentication & User Management", status: "active", desc: "SSO/SAML, role-based controls, audit logs." },
      { name: "Core Product Engine", status: "active", desc: "The primary project workflows and enterprise collaboration." },
      { name: "Basic Analytics Integration", status: "active", desc: "Advanced dashboards, BI export, PDF exports." },
      { name: "Advanced AI Optimization", status: "active", desc: "Dedicated model fine-tuning, automated training runs." },
      { name: "Multi-tenant Dashboard & Billing", status: "active", desc: "Enterprise SLA config, custom invoicing, credit systems." },
      { name: "High Availability & Multi-Region Failover", status: "active", desc: "Terraform orchestration, AWS Multi-AZ, compliance standards." }
    ],
    architecture: {
      client: "Web portal + Native Mobile + Public API SDK",
      apiGateway: "AWS API Gateway (Edge Optimized)",
      services: ["Auth Service", "Core Microservice", "AI Worker Cluster", "Reporting Engine", "Event Bus (Kafka)"],
      databases: ["PostgreSQL Cluster", "Pinecone VectorDB", "DynamoDB NoSQL", "Redis Cache"]
    }
  }
};

export const MOCK_NEGOTIATION_HISTORY = [
  {
    version: "v1.0",
    date: "14 Jul 2026",
    budget: 75000,
    timeline: "12 Weeks",
    author: "AI Proposal Agent",
    changeDescription: "Initial automatic proposal generation (Growth Engine)."
  }
];

export const MOCK_ADMIN_PROPOSALS = [
  {
    id: "prop-z",
    projectName: "Zenith Retail Portal",
    clientName: "Zenith Brands Ltd",
    industry: "E-Commerce",
    budget: 85000,
    timeline: "12 Weeks",
    status: "Negotiating",
    techStack: ["React", "Node.js", "PostgreSQL", "OpenAI API"],
    teamSize: 5,
    features: [
      "Authentication & Security Guard (SAML)",
      "Core Storefront Engine",
      "AI Sizing Recommendation Engine",
      "Notification Engine",
      "Stripe Billing Dashboard"
    ],
    versions: [
      { version: "v1.1", date: "14 Jul 2026", budget: 85000, timeline: "12 Weeks", desc: "Added AI sizing engine recommendation node." },
      { version: "v1.0", date: "12 Jul 2026", budget: 70000, timeline: "10 Weeks", desc: "Initial blueprint setup." }
    ]
  },
  {
    id: "prop-a",
    projectName: "Acme Enterprise ERP",
    clientName: "Acme Corp",
    industry: "B2B SaaS",
    budget: 145000,
    timeline: "20 Weeks",
    status: "Approved",
    techStack: ["React", "Node.js", "Pinecone", "Terraform", "Docker"],
    teamSize: 7,
    features: [
      "SSO/SAML Login Gateways",
      "Admin Audit Logs & Reporting",
      "Kafka Event Bus Pipelines",
      "Pinecone Semantic Indexing",
      "Terraform HA Mesh Infrastructure"
    ],
    versions: [
      { version: "v1.0", date: "08 Jul 2026", budget: 145000, timeline: "20 Weeks", desc: "Final sign-off on Enterprise configuration package." }
    ]
  },
  {
    id: "prop-h",
    projectName: "HealthSync Mobile Platform",
    clientName: "HealthSync Inc",
    industry: "Healthcare",
    budget: 35000,
    timeline: "6 Weeks",
    status: "Draft",
    techStack: ["React Native", "Express", "PostgreSQL"],
    teamSize: 3,
    features: [
      "User Verification & Roles",
      "Appointment Booking Engine",
      "SMS Text Alerts"
    ],
    versions: [
      { version: "v1.0", date: "14 Jul 2026", budget: 35000, timeline: "6 Weeks", desc: "MVP version drafts." }
    ]
  }
];

