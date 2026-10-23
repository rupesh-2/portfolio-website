export const profile = {
  name: "Rupesh Bhandari",
  logo: "rupesh bhandari",
  disciplines: [
    "Mobile App Development",
    "Web Platforms",
    "AI Data Products",
    "Real-time Systems",
  ],
  email: "bhandarirupesh162@gmail.com",
  phone: "+977 984-0279689",
  linkedin: "https://www.linkedin.com/in/rupesh-bhandari-5977b525a/",
  whatsapp: "https://wa.me/9779810550900",
  location: "Bagdol, Lalitpur, Nepal",
  description:
    "Rupesh Bhandari is a software engineer in Lalitpur, Nepal, building production web and mobile apps with React Native, Next.js and Laravel, and AI-driven data products.",
};

export type Section = {
  title: string;
  paragraphs: string[];
  points?: string[];
};

export type Case = {
  slug: string;
  label: string; // "Case 1"
  title: string; // the long headline
  marquee: string; // big orange background line on the work pager
  short: string; // pager blurb
  tags: string[];
  icon: "frame" | "planet" | "tv" | "temple" | "projector";
  scope: string;
  company: string;
  period: string;
  stack: string[];
  link?: { href: string; label: string };
  sections: Section[];
};

export const cases: Case[] = [
  {
    slug: "artizan",
    label: "Case 1",
    title: "Artizan: teaching a platform to estimate what a piece of art is worth",
    marquee:
      "Turning auction records, artists, social media and market news into an AI-driven art valuation.",
    short:
      "An AI art intelligence platform that turns auction, artist and market data into valuation estimates.",
    tags: ["AI & Data", "Web Platform"],
    icon: "frame",
    scope: "Data pipelines · Vector search · AI agent workflows · Next.js frontend · Release",
    company: "Inseed",
    period: "Apr 2026 – Present",
    stack: ["Next.js", "Python", "Dagster", "Supabase", "PostgreSQL", "Apify", "OpenAI", "Embeddings"],
    sections: [
      {
        title: "Background",
        paragraphs: [
          "Art prices are scattered across auction houses, galleries, social feeds and news. Artizan pulls those signals together for artists and artworks, then produces a valuation estimate that someone can read and question.",
        ],
      },
      {
        title: "What I built",
        paragraphs: [
          "I own features from data ingestion through to the interface. The work spans the scraping layer, the pipelines that clean and model the data, and the Next.js screens where people read the result.",
        ],
        points: [
          "Apify scrapers that collect auction records, artist profiles, social media and news.",
          "Python and Dagster pipelines that normalise that data into Supabase/PostgreSQL.",
          "Vector and embedding search, so comparable artists and works can be found by meaning, not only by name.",
          "LLM-driven analysis and agent workflows that turn raw records into a written valuation.",
        ],
      },
      {
        title: "Why it matters",
        paragraphs: [
          "A valuation is only useful if people trust it. Keeping the data lineage clear, from the scraped record to the final estimate, is what makes the output defensible.",
        ],
      },
    ],
  },
  {
    slug: "afterlight",
    label: "Case 2",
    title: "Afterlight: a private memoir that turns reflections into a cosmic memory map",
    marquee:
      "A private emotional memoir. Voice and text reflections become abstract insights and an evolving cosmic memory.",
    short:
      "A private memoir app that turns voice and text reflections into an evolving cosmic visualisation.",
    tags: ["Mobile App", "AI & Data"],
    icon: "planet",
    scope: "React Native app · Edge functions · OpenAI integration · Notifications · Release",
    company: "Inseed",
    period: "Apr 2026 – Present",
    stack: ["React Native", "Expo", "TypeScript", "Supabase", "Deno Edge Functions", "OpenAI", "Expo Notifications"],
    sections: [
      {
        title: "Background",
        paragraphs: [
          "Afterlight is a private place to talk or write about how you feel. Instead of a diary list, each reflection becomes an abstract insight and a point of light in a cosmic map that grows over time.",
        ],
      },
      {
        title: "What I built",
        paragraphs: [
          "The app is React Native and Expo in TypeScript. Supabase stores entries, and Deno Edge Functions handle the calls to the OpenAI API so no keys live on the device.",
        ],
        points: [
          "Voice and text capture flows that feel calm rather than clinical.",
          "Edge functions that turn each reflection into emotional insights.",
          "Embedding search that links related memories across months.",
          "Expo Notifications for gentle prompts to reflect.",
        ],
      },
      {
        title: "Why it matters",
        paragraphs: [
          "Memoir data is as personal as data gets. Privacy shaped the architecture first and the interface second.",
        ],
      },
    ],
  },
  {
    slug: "palika-app",
    label: "Case 3",
    title: "Palika App: municipal services on phones, kiosks and Android TV",
    marquee:
      "One progressive web app for municipal services, tuned for phones, public kiosks and Android TV. Shipped to the Play Store.",
    short:
      "A progressive web app for municipalities, optimised for kiosk and Android TV landscape mode.",
    tags: ["Mobile App", "E-Governance"],
    icon: "tv",
    scope: "Expo app · Landscape and kiosk layouts · State management · Play Store release",
    company: "NinjaInfosys Pvt. Ltd.",
    period: "Sep 2024 – Sep 2025",
    stack: ["Expo", "React Native", "Zustand", "TanStack Query", "Axios", "Google Play"],
    sections: [
      {
        title: "Background",
        paragraphs: [
          "Municipal offices in Nepal serve residents at the counter, on a public kiosk and increasingly on their phones. Palika App brings those services into one progressive web app.",
        ],
      },
      {
        title: "What I built",
        paragraphs: [
          "I built the app with Expo and optimised its layouts for landscape mode, so the same product runs on a kiosk screen or an Android TV in a ward office.",
        ],
        points: [
          "Landscape-first layouts for kiosk and Android TV deployment.",
          "Zustand, Axios and TanStack Query to keep state and API handling scalable as the product grew.",
          "Clean Architecture and mobile-first responsive practices across the codebase.",
          "Published to the Google Play Store.",
        ],
      },
    ],
  },
  {
    slug: "digital-bansgadhi",
    label: "Case 4",
    title: "Digital Bansgadhi: a live e-governance portal for a municipality in Bardiya",
    marquee:
      "The Digital Palika platform, live for Bansgadhi Municipality. Laravel APIs, a server-rendered Next.js frontend and Python automation.",
    short:
      "The live Digital Palika deployment for Bansgadhi Municipality, Bardiya.",
    tags: ["Web Platform", "E-Governance"],
    icon: "temple",
    scope: "Laravel APIs · Next.js SSR frontend · Python data automation",
    company: "NinjaInfosys Pvt. Ltd.",
    period: "Sep 2024 – Sep 2025",
    stack: ["Laravel", "Next.js", "Python", "MySQL", "REST APIs"],
    link: { href: "https://digital.bansgadhimun.gov.np", label: "digital.bansgadhimun.gov.np" },
    sections: [
      {
        title: "Background",
        paragraphs: [
          "Digital Palika is a municipal service platform built to be deployed for many local governments. Bansgadhi Municipality in Bardiya runs it in production today.",
        ],
      },
      {
        title: "What I built",
        paragraphs: [
          "I worked across the stack: Laravel APIs, a server-rendered Next.js frontend for fast first loads and search visibility, and Python scripts for data automation and analytics.",
        ],
        points: [
          "REST APIs in Laravel for municipal services and content.",
          "Server-rendered Next.js frontend for residents.",
          "Python automation for data imports and analytics.",
        ],
      },
    ],
  },
  {
    slug: "projector-app",
    label: "Case 5",
    title: "Projector App: low-latency control between connected devices",
    marquee:
      "Real-time communication between connected devices with Socket.IO and Laravel Echo. What happens on one screen shows up on the other.",
    short:
      "A projector application with low-latency real-time communication between devices.",
    tags: ["Mobile App", "Real-time"],
    icon: "projector",
    scope: "WebSocket transport · React Native CLI · Cross-team integration",
    company: "Outlines Research and Development",
    period: "Dec 2025 – Apr 2026",
    stack: ["React Native CLI", "Socket.IO", "Laravel Echo", "WebSockets", "Laravel"],
    sections: [
      {
        title: "Background",
        paragraphs: [
          "A projector setup only feels right when the controller and the screen agree instantly. Any lag between a tap and the projected result breaks the experience.",
        ],
      },
      {
        title: "What I built",
        paragraphs: [
          "I developed the projector application with Socket.IO and Laravel Echo, and tuned the WebSocket transport and React Native CLI tooling for performance and responsiveness.",
        ],
        points: [
          "Real-time messaging between connected devices.",
          "WebSocket transport tuned for low latency.",
          "Worked with cross-functional teams to integrate features cleanly and keep the experience consistent.",
        ],
      },
    ],
  },
];

export const about = {
  title: "From the database to the release. Building apps people actually use, end to end.",
  marquee: "From the database to the release. Building apps people actually use, end to end.",
  short: "Four years building production web and mobile apps, now building AI-driven data products.",
  sections: [
    {
      title: "About me",
      paragraphs: [
        "I'm a software engineer with four years of experience building production web and mobile apps across React Native, Next.js and Laravel. Right now I'm building AI-driven data products at Inseed: an art valuation platform and a private memoir app.",
        "Before that I delivered a municipal service platform for local government, a progressive web app on the Google Play Store, and real-time systems on WebSockets. I'm comfortable owning a feature end to end, from data and API through to frontend and release, and I care about clean architecture, maintainable components and performance I can measure.",
        "I started out teaching programming fundamentals in Belbari, Morang. I still enjoy explaining how things work.",
      ],
    },
  ] as Section[],
  experience: [
    { period: "Apr 2026 – Present", role: "Software Engineer", org: "Inseed", place: "Kathmandu" },
    { period: "Dec 2025 – Apr 2026", role: "Mobile Application Developer", org: "Outlines Research and Development", place: "On-site" },
    { period: "Sep 2024 – Sep 2025", role: "Mobile Application Developer", org: "NinjaInfosys Pvt. Ltd.", place: "Lalitpur" },
    { period: "Sep 2022 – Aug 2024", role: "Junior Frontend Developer", org: "KTM Coders Pvt. Ltd.", place: "Kathmandu" },
    { period: "Feb 2018 – Oct 2019", role: "Computer Instructor", org: "Advanced Computer Institute", place: "Belbari, Morang" },
  ],
  skills: [
    { label: "Languages", items: "TypeScript, JavaScript (ES6+), PHP, SQL, HTML5, CSS3" },
    { label: "AI & Data", items: "LLM integration (OpenAI), AI agents, vector & embedding search, Dagster pipelines, web scraping (Apify)" },
    { label: "Frontend", items: "React, Next.js, React Native (Expo & CLI), Tailwind CSS, NativeWind, Zustand, TanStack Query, Axios" },
    { label: "Backend", items: "Laravel, Livewire, Laravel Echo, Deno Edge Functions, Socket.IO / WebSockets, REST API design" },
    { label: "Databases", items: "PostgreSQL / Supabase, MySQL" },
    { label: "Tools", items: "Git, GitHub, GitLab, Claude Code, Google Analytics, Lighthouse, WordPress" },
  ],
  education: [
    { period: "2026 – Present", title: "Master in Computer Application (MCA)", place: "Kantipur City College, Putalisadak" },
    { period: "Apr 2021 – 2025", title: "Bachelor in Computer Application (BCA)", place: "Kantipur City College, Putalisadak" },
    { period: "Dec 2020", title: "Higher Secondary (+2), Science", place: "Sukuna Higher Secondary School, Morang" },
  ],
};
