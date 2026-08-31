export const site = {
  name: 'Aapo Pihkala',

  url: 'https://aapopihkala.fi',

  linkedinUrl:
    'https://fi.linkedin.com/in/aapo-pihkala',

  languages: {
    fi: {
      code: 'fi',
      locale: 'fi-FI',
      openGraphLocale: 'fi_FI',
      homePath: '/',
    },

    en: {
      code: 'en',
      locale: 'en-GB',
      openGraphLocale: 'en_GB',
      homePath: '/en/',
    },
  },
} as const;

export type SiteLanguage =
  keyof typeof site.languages;
