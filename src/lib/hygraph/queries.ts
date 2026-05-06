/**
 * GraphQL query strings for Hygraph.
 *
 * Keep these aligned with the schema described in HYGRAPH_SETUP.md.
 */

const SEO_FRAGMENT = /* GraphQL */ `
  fragment SeoFields on Seo {
    title
    description
    noIndex
    ogImage {
      url
      width
      height
    }
  }
`;

const FILM_FRAGMENT = /* GraphQL */ `
  fragment FilmFields on Film {
    title
    slug
    productionStatus
    filmType
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
    videoClipHd {
      url
    }
    stills {
      url
    }
    cast {
      name
      role
      photo {
        url
      }
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
    seo { ...SeoFields }
  }
`;

export const ALL_FILMS_QUERY = /* GraphQL */ `
  ${SEO_FRAGMENT}
  ${FILM_FRAGMENT}
  query AllFilms {
    films(orderBy: order_ASC, first: 200) {
      ...FilmFields
    }
  }
`;

export const FILM_BY_SLUG_QUERY = /* GraphQL */ `
  ${SEO_FRAGMENT}
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
  ${SEO_FRAGMENT}
  query AboutPage {
    aboutPages(first: 1) {
      heroTitle
      heroSubtitle
      story
      ctaTitle
      ctaSubtitle
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
      seo { ...SeoFields }
    }
  }
`;

export const SPONSORSHIP_PAGE_QUERY = /* GraphQL */ `
  ${SEO_FRAGMENT}
  query SponsorshipPage {
    sponsorshipPages(first: 1) {
      heroCopy
      formRecipientEmail
      formTitle
      formSubmitLabel
      formSuccessMessage
      formFields {
        label
        name
        type
        required
        options
        placeholder
      }
      seo { ...SeoFields }
    }
  }
`;

export const SITE_SETTINGS_QUERY = /* GraphQL */ `
  ${SEO_FRAGMENT}
  query SiteSettings {
    siteSettingsItems(first: 1) {
      tagline
      youtubeUrl
      blueskyUrl
      xUrl
      instagramUrl
      newsletterFormAction
      featuredFilm {
        slug
      }
      defaultSeo { ...SeoFields }
      homeSeo { ...SeoFields }
      filmsListingSeo { ...SeoFields }
      homepageTicker {
        name
        people
      }
    }
  }
`;
