// What the panels say. The stack is what my repos depend on.
// A tool is [name, Simple Icons slug] (CC0 logos).

export const SITE = 'https://pimbo.dev/en/';
export const CONTACT = 'https://pimbo.dev/en/#contact';

// A tool with no logo in Simple Icons has no slug and gets a plain marker.
export const stack = [
  {
    title: 'LANGUAGES', note: 'five I ship with',
    tools: [['TypeScript', 'typescript'], ['JavaScript', 'javascript'], ['Elixir', 'elixir'], ['Python', 'python'], ['Rust', 'rust']],
  },
  {
    title: 'INTERFACES', note: 'that feel fast',
    tools: [
      ['Next.js', 'nextdotjs'], ['React', 'react'], ['Astro', 'astro'], ['SvelteKit', 'svelte'], ['React Router', 'reactrouter'],
      ['Tailwind', 'tailwindcss'], ['HeroUI', 'heroui'], ['Motion', 'framer'], ['GSAP', 'gsap'], ['Three.js', 'threedotjs'],
      ['Vite', 'vite'], ['TanStack Query', 'reactquery'], ['Zustand'], ['D3', 'd3'], ['Lenis'],
    ],
  },
  {
    title: 'BACKENDS', note: 'that hold up',
    tools: [
      ['Node.js', 'nodedotjs'], ['NestJS', 'nestjs'], ['Hono', 'hono'], ['Express', 'express'], ['Phoenix', 'phoenixframework'],
      ['Ash'], ['Oban'], ['FastAPI', 'fastapi'], ['Axum'], ['Tokio', 'tokio'], ['GraphQL', 'graphql'], ['Apollo', 'apollographql'],
      ['Zod', 'zod'], ['Stripe', 'stripe'], ['Better Auth', 'betterauth'], ['Clerk', 'clerk'],
    ],
  },
  {
    title: 'DATA', note: 'that stays put',
    tools: [
      ['PostgreSQL', 'postgresql'], ['Supabase', 'supabase'], ['Neon', 'neon'], ['Prisma', 'prisma'], ['Drizzle', 'drizzle'],
      ['Redis', 'redis'], ['S3 / R2'],
    ],
  },
  {
    title: 'APPLIED AI', note: 'that works on its own',
    tools: [
      ['Claude', 'claude'], ['MCP', 'modelcontextprotocol'], ['Replicate', 'replicate'], ['LiveKit', 'livekit'], ['WhatsApp', 'whatsapp'],
      ['Resend', 'resend'], ['Langfuse'], ['ONNX', 'onnx'], ['OpenCV', 'opencv'],
    ],
  },
  {
    title: 'SHIPPING', note: 'without scares',
    tools: [
      ['Vercel', 'vercel'], ['Cloudflare', 'cloudflare'], ['Workers', 'cloudflareworkers'], ['Railway', 'railway'], ['Docker', 'docker'],
      ['Turborepo', 'turborepo'], ['pnpm', 'pnpm'], ['GitHub Actions', 'githubactions'], ['Woodpecker CI'], ['Nginx', 'nginx'],
      ['Caddy', 'caddy'], ['Sentry', 'sentry'], ['OpenTelemetry', 'opentelemetry'], ['PostHog', 'posthog'],
    ],
  },
  {
    title: 'QUALITY', note: 'checked before it ships',
    tools: [['Vitest', 'vitest'], ['Playwright'], ['Testing Library', 'testinglibrary'], ['Biome', 'biome'], ['ESLint', 'eslint']],
  },
];
