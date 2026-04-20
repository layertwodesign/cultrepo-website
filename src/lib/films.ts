export type Film = {
  title: string;
  slug: string;
  status: "In Production" | "Post-Production" | "Coming Soon";
  video: string;
  description: string;
  year: string;
};

export const films: Film[] = [
  {
    title: "Vite",
    slug: "vite",
    status: "In Production",
    video: "/clips/vite.mp4",
    description: "The story behind the build tool that changed how developers ship for the web.",
    year: "2026",
  },
  {
    title: "Kubernetes",
    slug: "kubernetes",
    status: "Coming Soon",
    video: "/clips/kubernetes.mp4",
    description: "How a project born inside Google became the operating system of the cloud.",
    year: "2026",
  },
  {
    title: "React",
    slug: "react",
    status: "In Production",
    video: "/clips/reactjs.mp4",
    description: "The people and decisions behind the library that reshaped frontend development.",
    year: "2026",
  },
  {
    title: "GraphQL",
    slug: "graphql",
    status: "Post-Production",
    video: "/clips/graphql.mp4",
    description: "From Facebook's internal tool to the query language powering modern APIs.",
    year: "2025",
  },
  {
    title: "Node.js",
    slug: "nodejs",
    status: "In Production",
    video: "/clips/nodejs.mp4",
    description: "The runtime that took JavaScript beyond the browser and into everything.",
    year: "2026",
  },
  {
    title: "Local First",
    slug: "local-first",
    status: "Coming Soon",
    video: "/clips/localfirst.mp4",
    description: "A movement to put data back in the hands of the people who create it.",
    year: "2026",
  },
  {
    title: "Elixir",
    slug: "elixir",
    status: "Post-Production",
    video: "/clips/elixir.mp4",
    description: "How José Valim created a language built for the demands of real-time systems.",
    year: "2025",
  },
  {
    title: "Angular",
    slug: "angular",
    status: "In Production",
    video: "/clips/angular.mp4",
    description: "The framework that brought structure to the chaos of early web applications.",
    year: "2026",
  },
  {
    title: "Vue.js",
    slug: "vuejs",
    status: "Coming Soon",
    video: "/clips/vuejs.mp4",
    description: "How Evan You built an alternative that millions of developers chose for themselves.",
    year: "2026",
  },
  {
    title: "Python",
    slug: "python",
    status: "In Production",
    video: "/clips/python.mp4",
    description: "The language that made programming accessible and then conquered everything.",
    year: "2026",
  },
  {
    title: "Ember.js",
    slug: "emberjs",
    status: "Post-Production",
    video: "/clips/emberjs.mp4",
    description: "Convention over configuration — the framework that bet on developer happiness.",
    year: "2025",
  },
  {
    title: "Ruby on Rails",
    slug: "ruby-on-rails",
    status: "In Production",
    video: "/clips/rails.mp4",
    description: "The framework that made the web feel like it belonged to independent creators.",
    year: "2026",
  },
  {
    title: "Java",
    slug: "java",
    status: "In Production",
    video: "/clips/java.mp4",
    description: "Write once, run anywhere — the language that powers the enterprise backbone.",
    year: "2026",
  },
  {
    title: "IntelliJ",
    slug: "intellij",
    status: "Coming Soon",
    video: "/clips/intellij.mp4",
    description: "The IDE that proved developer tools could be intelligent and opinionated.",
    year: "2026",
  },
  {
    title: "Prometheus",
    slug: "prometheus",
    status: "Post-Production",
    video: "/clips/prometheus.mp4",
    description: "How an observability tool built at SoundCloud became the standard for monitoring.",
    year: "2025",
  },
];

export function getFilmBySlug(slug: string): Film | undefined {
  return films.find((f) => f.slug === slug);
}
