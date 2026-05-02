/**
 * GraphQL query strings for Hygraph.
 *
 * Keep these aligned with the schema described in HYGRAPH_SETUP.md.
 */

const FILM_FRAGMENT = /* GraphQL */ `
  fragment FilmFields on Film {
    title
    slug
    status
    description
    synopsis
    year
    duration
    director
    youtubeId
    poster {
      url
      width
      height
    }
    videoClip {
      url
    }
    stills {
      url
    }
    cast {
      name
      role
    }
    crew {
      name
      role
    }
    technologies
    sponsors {
      name
      slug
    }
    extras {
      title
      youtubeId
    }
    timeline {
      label
      done
    }
    fundraisingGoal
    fundraisingRaised
  }
`;

export const ALL_FILMS_QUERY = /* GraphQL */ `
  ${FILM_FRAGMENT}
  query AllFilms {
    films(orderBy: order_ASC, first: 200) {
      ...FilmFields
    }
  }
`;

export const FILM_BY_SLUG_QUERY = /* GraphQL */ `
  ${FILM_FRAGMENT}
  query FilmBySlug($slug: String!) {
    film(where: { slug: $slug }) {
      ...FilmFields
    }
  }
`;

export const TEAM_MEMBERS_QUERY = /* GraphQL */ `
  query TeamMembers {
    teamMembers(orderBy: order_ASC, first: 50) {
      name
      role
      bio
      email
      photo {
        url
        width
        height
      }
    }
  }
`;

export const ABOUT_PAGE_QUERY = /* GraphQL */ `
  query AboutPage {
    aboutPage(where: { id: "singleton" }) {
      heroTitle
      heroSubtitle
      story
      backstageImage {
        url
        width
        height
      }
      stats {
        value
        suffix
        decimals
        label
        channel
      }
      trustedBySponsors {
        name
        slug
        logo {
          url
        }
      }
    }
  }
`;

export const SITE_SETTINGS_QUERY = /* GraphQL */ `
  query SiteSettings {
    siteSettings(where: { id: "singleton" }) {
      tagline
      youtubeUrl
      blueskyUrl
      xUrl
      instagramUrl
      newsletterFormAction
    }
  }
`;
