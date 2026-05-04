/**
 * Team members adapter — same Hygraph-or-local pattern as films.ts.
 */

import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import { TEAM_MEMBERS_QUERY } from "./hygraph/queries";

export type TeamMember = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  email: string;
};

export const TEAM_CACHE_TAG = "team";

const localTeam: TeamMember[] = [
  {
    name: "Emma Tracey",
    role: "CEO",
    photo: "/team/emma.webp",
    bio: "Serial founder who started her career as a journalist and never stopped chasing stories. A long-time open source advocate, Emma cares about getting recognition into the hands of the people quietly maintaining the systems everyone else depends on.",
    email: "emma@cultrepo.com",
  },
  {
    name: "Josiah McGarvie",
    role: "Filmmaker",
    photo: "/team/josiah.webp",
    bio: "Australian filmmaker, eight years deep in tech documentaries. Co-founded the original YouTube channel with Emma and assembled the team behind films on Kubernetes, Vue.js, GraphQL, Elixir, Vite, Argo, eBPF, PyTorch, Envoy, Prometheus, and Ember.js.",
    email: "josiah@cultrepo.com",
  },
  {
    name: "Ida Bechtle",
    role: "Filmmaker",
    photo: "/team/ida.webp",
    bio: "Joined when the YouTube channel was barely a channel. Ida has been a quiet engine behind its growth, with a knack for finding the human moment inside a technical story. Off-set: cats, puzzles, and a strong opinion about coffee.",
    email: "ida@cultrepo.com",
  },
  {
    name: "Guillermo Lopez",
    role: "Filmmaker",
    photo: "/team/guillermo.webp",
    bio: "Filmmaker and producer who came up in advertising before turning fully to tech documentaries. Brings a sharper narrative spine to production. Credits include Kubernetes, Prometheus, Angular, Vite, TypeScript, the Investors Masterclass, and various minidocs.",
    email: "guillermo@cultrepo.com",
  },
];

type HygraphTeamMember = {
  name: string;
  role: string;
  bio: string;
  email: string;
  photo: { url: string } | null;
};

export async function getTeam(): Promise<TeamMember[]> {
  if (!isHygraphConfigured) return localTeam;

  const data = await hygraphFetch<{ teamMembers: HygraphTeamMember[] }>(
    TEAM_MEMBERS_QUERY,
    undefined,
    { tag: TEAM_CACHE_TAG }
  );
  if (!data?.teamMembers?.length) return localTeam;
  return data.teamMembers.map((m) => ({
    name: m.name,
    role: m.role,
    bio: m.bio,
    email: m.email,
    photo: m.photo?.url ?? "",
  }));
}
