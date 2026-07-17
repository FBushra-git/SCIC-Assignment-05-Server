export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type ProjectCatalogItem = {
  slug: string;
  thumbnail: string;
  name: string;
  difficulty: ProjectDifficulty;
  technologies: string[];
  estimatedTime: string;
  shortDescription: string;
  description: string;
  skillsLearned: string[];
  objectives: string[];
  features: string[];
  learningOutcomes: string[];
  relatedSlugs: string[];
};

export const projectCatalog: ProjectCatalogItem[] = [
  {
    slug: "movie-explorer",
    thumbnail: "/images/projects/movie-explorer-photo.webp",
    name: "Movie Explorer",
    difficulty: "Beginner",
    technologies: ["React", "TypeScript", "TanStack Query", "REST API"],
    estimatedTime: "12–16 hours",
    shortDescription: "Build a responsive discovery app with search, filters, and saved titles.",
    description:
      "Create a polished movie discovery experience that consumes a public API, handles loading and error states, and lets users maintain a local watchlist.",
    skillsLearned: ["API consumption", "Query caching", "Responsive UI", "State design"],
    objectives: [
      "Model external API data safely with TypeScript.",
      "Create resilient loading, empty, and error states.",
      "Use cached queries and debounced search.",
    ],
    features: ["Title search", "Genre filters", "Movie details", "Watchlist", "Pagination"],
    learningOutcomes: [
      "Confidently integrate a third-party REST API.",
      "Explain cache keys, stale time, and request states.",
      "Build reusable data-driven card layouts.",
    ],
    relatedSlugs: ["developer-portfolio", "ecommerce-command-center"],
  },
  {
    slug: "developer-portfolio",
    thumbnail: "/images/projects/developer-portfolio-photo.webp",
    name: "Developer Portfolio",
    difficulty: "Beginner",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    estimatedTime: "10–14 hours",
    shortDescription: "Present your skills and case studies through a fast, accessible portfolio.",
    description:
      "Design and ship a personal portfolio with strong information hierarchy, measurable project case studies, responsive navigation, and thoughtful motion.",
    skillsLearned: ["Next.js routing", "Accessibility", "SEO", "Motion design"],
    objectives: [
      "Write outcome-focused project case studies.",
      "Build accessible responsive sections.",
      "Optimize metadata and content structure.",
    ],
    features: ["Hero", "Case studies", "Skills", "Contact form", "Theme toggle"],
    learningOutcomes: [
      "Deploy a recruiter-ready personal site.",
      "Apply responsive and accessible interaction patterns.",
      "Communicate technical work through product outcomes.",
    ],
    relatedSlugs: ["movie-explorer", "design-system-lab"],
  },
  {
    slug: "team-task-platform",
    thumbnail: "/images/projects/team-task-platform-photo.webp",
    name: "Team Task Platform",
    difficulty: "Intermediate",
    technologies: ["Next.js", "Express", "MongoDB", "Better Auth"],
    estimatedTime: "28–36 hours",
    shortDescription: "Create a collaborative task workspace with secure accounts and activity history.",
    description:
      "Build an authenticated collaboration platform where teams create workspaces, assign tasks, filter work, and review a durable activity timeline.",
    skillsLearned: ["Authentication", "Authorization", "CRUD APIs", "Data modeling"],
    objectives: [
      "Separate authentication from resource authorization.",
      "Model workspace, member, and task relationships.",
      "Keep server and query cache state consistent.",
    ],
    features: ["Workspaces", "Task boards", "Assignments", "Filters", "Activity log"],
    learningOutcomes: [
      "Build secure user-scoped CRUD APIs.",
      "Design MongoDB documents around real access patterns.",
      "Handle optimistic and invalidated query updates.",
    ],
    relatedSlugs: ["ecommerce-command-center", "realtime-support-desk"],
  },
  {
    slug: "ecommerce-command-center",
    thumbnail: "/images/projects/ecommerce-command-center-photo.webp",
    name: "E-commerce Command Center",
    difficulty: "Intermediate",
    technologies: ["Next.js", "Node.js", "MongoDB", "Recharts"],
    estimatedTime: "32–40 hours",
    shortDescription: "Build storefront workflows and an analytics-rich merchant dashboard.",
    description:
      "Implement products, cart and order workflows alongside a merchant dashboard that turns transactional data into actionable visual reports.",
    skillsLearned: ["Transactional workflows", "Analytics", "Forms", "Data visualization"],
    objectives: [
      "Model cart and order state predictably.",
      "Create protected merchant operations.",
      "Translate stored data into useful charts.",
    ],
    features: ["Catalog", "Cart", "Orders", "Admin products", "Sales analytics"],
    learningOutcomes: [
      "Reason about multi-step commerce state.",
      "Create useful Recharts visualizations.",
      "Validate complex forms across client and server.",
    ],
    relatedSlugs: ["team-task-platform", "finance-insight-dashboard"],
  },
  {
    slug: "realtime-support-desk",
    thumbnail: "/images/projects/realtime-support-desk-photo.webp",
    name: "Realtime Support Desk",
    difficulty: "Advanced",
    technologies: ["React", "Express", "WebSocket", "MongoDB"],
    estimatedTime: "40–50 hours",
    shortDescription: "Design a real-time customer support inbox with assignments and presence.",
    description:
      "Create a multi-agent support system with real-time messages, conversation ownership, unread state, presence, and searchable history.",
    skillsLearned: ["Realtime systems", "Event design", "Concurrency", "Search"],
    objectives: [
      "Design durable and ephemeral event state.",
      "Reconcile realtime events with stored history.",
      "Protect tenant and conversation boundaries.",
    ],
    features: ["Live chat", "Agent assignment", "Presence", "Unread counts", "Search"],
    learningOutcomes: [
      "Explain WebSocket lifecycle and recovery.",
      "Avoid duplicate or out-of-order message bugs.",
      "Build a scalable conversation data model.",
    ],
    relatedSlugs: ["team-task-platform", "ai-study-companion"],
  },
  {
    slug: "ai-study-companion",
    thumbnail: "/images/projects/ai-study-companion-photo.webp",
    name: "AI Study Companion",
    difficulty: "Advanced",
    technologies: ["Gemini API", "Next.js", "Express", "MongoDB"],
    estimatedTime: "36–48 hours",
    shortDescription: "Create a contextual AI tutor with memory, structured plans, and safe prompting.",
    description:
      "Build a study companion that grounds responses in learner context, stores conversations, creates structured study plans, and communicates AI limitations clearly.",
    skillsLearned: ["LLM integration", "Prompt design", "Structured output", "Context retrieval"],
    objectives: [
      "Keep provider keys and prompt assembly on the server.",
      "Validate AI-generated structured data.",
      "Control conversation context size and relevance.",
    ],
    features: ["Contextual chat", "Study plans", "Conversation history", "Prompt suggestions", "Code answers"],
    learningOutcomes: [
      "Ship a secure server-side LLM workflow.",
      "Differentiate retrieval context from chat history.",
      "Handle model failure, quotas, and malformed output.",
    ],
    relatedSlugs: ["realtime-support-desk", "finance-insight-dashboard"],
  },
  {
    slug: "finance-insight-dashboard",
    thumbnail: "/images/projects/finance-insight-dashboard-photo.webp",
    name: "Finance Insight Dashboard",
    difficulty: "Advanced",
    technologies: ["TypeScript", "Node.js", "MongoDB", "Recharts"],
    estimatedTime: "34–44 hours",
    shortDescription: "Turn categorized transactions into budgets, trends, and explainable insights.",
    description:
      "Create a personal finance workspace with transaction import, categories, budgets, monthly comparisons, and privacy-conscious analytics.",
    skillsLearned: ["Data transformation", "Charts", "Import validation", "Privacy"],
    objectives: [
      "Normalize imported transaction data.",
      "Build aggregation pipelines for reporting.",
      "Communicate financial trends without misleading users.",
    ],
    features: ["CSV import", "Categories", "Budgets", "Trend charts", "Monthly reports"],
    learningOutcomes: [
      "Design robust data ingestion workflows.",
      "Aggregate time-series data efficiently.",
      "Choose chart types that match user questions.",
    ],
    relatedSlugs: ["ecommerce-command-center", "ai-study-companion"],
  },
  {
    slug: "design-system-lab",
    thumbnail: "/images/projects/design-system-lab-photo.webp",
    name: "Design System Lab",
    difficulty: "Intermediate",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Storybook"],
    estimatedTime: "24–32 hours",
    shortDescription: "Build an accessible component system with tokens, variants, and documentation.",
    description:
      "Create a reusable UI foundation with semantic tokens, accessible primitives, predictable variants, examples, and contribution documentation.",
    skillsLearned: ["Component APIs", "Design tokens", "Accessibility", "Documentation"],
    objectives: [
      "Define semantic colors and spacing tokens.",
      "Design composable typed component APIs.",
      "Document usage and accessibility constraints.",
    ],
    features: ["Tokens", "Buttons", "Forms", "Navigation", "Component stories"],
    learningOutcomes: [
      "Build maintainable reusable component APIs.",
      "Test keyboard and screen-reader behavior.",
      "Explain the relationship between tokens and themes.",
    ],
    relatedSlugs: ["developer-portfolio", "team-task-platform"],
  },
];
