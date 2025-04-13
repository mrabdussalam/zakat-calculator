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
  },
  BARAKAH_CAPITAL: {
    id: 'barakah_capital',
    name: 'Barakah Capital - Zakat on Gold & Silver',
    icon: '',
    url: 'https://barakahcapital.org/zakat-on-gold-and-silver-jewellery-a-comprehensive-guide/'
  },
  JOE_BRADFORD: {
    id: 'joe_bradford',
    name: 'Joe Bradford - Nisab Guide',
    icon: '',
    url: 'https://joebradford.net/nisab-for-zakat-on-gold-and-silver/'
  },
  ISLAMIC_RELIEF: {
    id: 'islamic_relief',
    name: 'Islamic Relief - Zakat FAQ',
    icon: '',
    url: 'https://islamic-relief.org/zakat-faq/',
    color: '#009A44'
  },
  NZF_CANADA: {
    id: 'nzf_canada',
    name: 'NZF Canada - Zakat on Debts',
    icon: '',
    url: 'https://www.nzfcanada.com/zakat-faq/zakat-on-debts-how-to-handle-owed-money-and-its-impact-on-zakat-calculation',
    color: '#E31837'
  },
  UM_RELIEF: {
    id: 'um_relief',
    name: 'UM Relief - Zakat with Loans',
    icon: '',
    url: 'https://www.umrelief.org/do-you-pay-zakat-if-you-have-loans/',
    color: '#F7941D'
  },
  NZF_UK: {
    id: 'nzf_uk',
    name: 'NZF UK - Deductible Liabilities',
    icon: '',
    url: 'https://nzf.org.uk/knowledge/payment-of-zakat-deductible-liabilities/',
    color: '#00A0DF'
  }
} as const

export type SourceKey = keyof typeof SOURCES 