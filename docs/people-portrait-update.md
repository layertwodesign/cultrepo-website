# People portrait update — 23 September 2026

Added 77 previously missing interviewee portraits across Local First, Angular, Ruby on Rails, IntelliJ, C++, Clojure and FastAPI. Added crew portrait rendering for 8 people wherever their names appear across the film pages. Existing populated interviewee portraits were preserved.

Originals were sourced through Google and named personal, employer, speaker and publisher profiles. Google eventually presented a traffic check; further research used the discovered sources and public web search. New images are hosted in Hygraph, without third-party hotlinks. Existing named film portraits and published team/cast portraits were reused where appropriate.

## Remaining photographic portraits

- Andrew Koenig (c-plus-plus-documentary): No sufficiently reliable public portrait selected.
- Steph Hickey (clojure): No sufficiently reliable public portrait selected.
- Guillermo Cistari (spring): Company profile uses an illustration; photographic headshot still needed.

## Lower-resolution sources worth replacing with supplied originals

- Barbara Moo: 125 × 125, [source](https://www.informit.com/authors/bio/764d4f1b-b868-4115-862e-4fe85e69f321). Best usable named source found during this search.
- George Andrianakis: 200 × 300, [source](https://devoxx.gr/schedule/speaker-details/?id=1335). Best usable named source found during this search.
- Danilo Piparo: 323 × 265, [source](https://root.cern/about/team/). Best usable named source found during this search.
- Wahbeh Qardaji: 164 × 180, [source](https://responsivewebdesign.com/podcast/google-plus/). Best usable named source found during this search.
- Stuart Halloway: 200 × 200, [source](https://www.cognitect.com/about.html). Best usable named source found during this search.
- Nina Ranns: 376 × 241, [source](https://cpp-summit.org/speaker/702?lang=en&uid=c1036). Best usable named source found during this search.
- Sergey Chernov: 200 × 200, [source](https://www.linkedin.com/in/schernov). Best usable named source found during this search.
- Vojta Jina: 190 × 210, [source](https://webexpo.net/prague2011/talk/angular-js/). Best usable named source found during this search.
- Eugene Belyaev: 105 × 106, [source](http://jaoo.dk/gotocon-common-content/archives/alltimespeakers/show_speaker.jsp?OID=457). Best usable named source found during this search.

The source manifest records every chosen image, original dimensions, CMS asset and affected film. The Alexander Stepanov portrait includes its photographer and CC BY-SA 3.0 credit on the film page. Local First conference portraits retain the artwork supplied by the conference.

Interviewee changes are published in Hygraph. Crew rendering and the photo-credit UI are local code changes and need the normal website deployment to reach production.

## Validation

All 85 selected CMS image URLs return HTTP 200 with an image content type. Browser checks confirm the added portraits and crew images are present on the film pages, with only the three outstanding placeholders listed above. TypeScript, targeted ESLint and whitespace checks pass. CMS before/after comparison confirms that film text, media, cast order and existing populated portraits were preserved.
