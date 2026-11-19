export interface ExperienceData {
  id: string;
  companyName: string;
  companyImage: string;
  role: string;
  startDate: string;
  endDate: string;
  type: string;
  mode: string;
  tasks: string[];
  techStack: string[];
}

export const EXPERIENCES: ExperienceData[] = [
  {
    id: "freelance",
    companyName: "Freelance",
    companyImage: "",
    role: "Design Engineer",
    startDate: "Aug 2026",
    endDate: "Present",
    type: "freelance",
    mode: "Remote",
    tasks: [
      "Designing and building landing pages, portfolios, and marketing sites for clients.",
      "Shipping end to end work from Figma designs to deployed Next.js apps.",
      "Creating reusable, animated UI components with clean code and smooth motion.",
    ],
    techStack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Motion",
      "Figma",
    ],
  },
  {
    id: "oceanlab",
    companyName: "Oceanlab Technology",
    companyImage: "/company-logos/oceanlabs-logo.webp",
    role: "Design Engineer",
    startDate: "May 2026",
    endDate: "July 2026",
    type: "fulltime",
    mode: "Remote",
    tasks: [
      "Designed and developed landing pages, dashboards, and reusable UI components.",
      "Revamped the Watermelon UI library with improved components, UX, and consistency.",
      "Built reusable animated components and sections to speed up product development.",
      "Collaborated with the product team to design, build, and iterate on user-facing features.",
    ],
    techStack: [
      "React",
      "Vite",
      "TypeScript",
      "Tailwind CSS",
      "Motion",
      "Figma",
    ],
  },
  {
    id: "apr-hub",
    companyName: "APR Hub Technologies",
    companyImage: "/company-logos/apr-logo.webp",
    role: "Frontend Developer Intern",
    startDate: "Dec 2025",
    endDate: "Apr 2026",
    type: "Internship",
    mode: "Hybrid",
    tasks: [
      "Built 70–80% of the frontend from scratch using Next.js, TypeScript, and Tailwind CSS.",
      "Developed responsive dashboards with reusable components, charts, and REST API integrations.",
      "Refactored and standardized frontend code into a maintainable and scalable architecture.",
      "Resolved UI bugs, improved design consistency, and enhanced overall user experience.",
      "Collaborated with backend developers to integrate APIs and deliver end-to-end product features.",
    ],
    techStack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "TanStack Query",
      "Chart.js",
      "Recharts",
      "Motion",
    ],
  },
];
