import { Source } from '@/components/ui/sources'

export const SOURCES = {
  WIKIPEDIA: {
    id: 'wikipedia',
    name: 'Wikipedia',
    icon: '/sources/wikipedia.svg',
    url: 'https://www.wikipedia.org'
  },
  WZO: {
    id: 'wzo',
    name: 'World Zakat Organization',
    icon: '/sources/wzo.svg',
    url: 'https://worldzakatforum.org'
  },
  IFE: {
    id: 'ife',
    name: 'Islamic Finance Expert',
    icon: '/sources/ife.svg',
    url: 'https://www.islamicfinanceexpert.com'
  },
  AMAZON: {
    id: 'amazon',
    name: 'Simple Zakat Guide on Amazon',
    icon: '',
    url: 'https://www.amazon.com/Simple-Zakat-Guide-Understand-Calculate/dp/0996519246'
  },
  IFG: {
    id: 'ifg',
    name: '[1] Islamic Finance Guru - Property Zakat Guide',
    icon: '',
    url: 'https://www.islamicfinanceguru.com/articles/calculate-zakat-on-property-btl-and-family-home'
  },
  NZF: {
    id: 'nzf',
    name: '[2] National Zakat Foundation - Property Zakat Guide',
    icon: '',
    url: 'https://nzf.org.uk/knowledge/zakat-on-property/'
  },
  LAUNCHGOOD: {
    id: 'launchgood',
    name: '[3] LaunchGood - Zakat Guide',
    icon: '',
    url: 'https://www.launchgood.com/v4/blog/zakat-cash-property-investments'
  },
  FIQH_COUNCIL: {
    id: 'fiqh_council',
    name: 'Fiqh Council of North America',
    icon: '',
    url: 'https://fiqhcouncil.org/zakah-on-retirement-funds/'
  }
} as const

export type SourceKey = keyof typeof SOURCES 