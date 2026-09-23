// FilmCrewMember has no CMS photo field. Reuse named team portraits and sourced assets.
// Source records are in docs/people-portrait-sources.json.
const crewPortraits: Record<string, string> = {
  "joey bania": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmudlfz62i7n907lkx4e1ca1b",
  "jas miszewski": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmudlg0yei7ph07lk60ukpkvc",
  "carolina cabral": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmudlg3i1iea807ls7ycm71lk",
  "emma tracey": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmoonz1r17ase07mx61iriyo5",
  "josiah mcgarvie": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmoonzube7af307lm8qgpd6zr",
  "ida bechtle": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmooo0n5k7al607lm5o3u7oi8",
  "guillermo lopez": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmooo1gcn7baj07mxd5w2qx44",
  "cormac dunne": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmudljb0si9eo07lkafcqwzo8"
};

export function getCrewPortrait(name: string): string | undefined {
  const key = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/\s+/g, " ");
  return crewPortraits[key];
}

export const portraitCredits: { person: string; photo: string; author: string; source: string; license: string; licenseUrl: string }[] = [
  {
    "person": "Alexander Stepanov",
    "photo": "https://us-west-2.graphassets.com/cmoddotfn04vc08ln4tjm1we2/cmudlfs9yi7ix07lkfdxqk5r7",
    "author": "Paul R. McJones",
    "source": "https://commons.wikimedia.org/wiki/File:Alexander_Stepanov.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  }
];
