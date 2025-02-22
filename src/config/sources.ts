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
    url: 'https://www.amazon.com/Simple-Zakat-Guide-Understand-Calculate/dp/0996519246/ref=sr_1_1?crid=33KCWNFKD9W3D&dib=eyJ2IjoiMSJ9.RUq2wWMzo1qTBSMbqX_o3ZiftZYysb8jmApfP0zqXuoU5Y4FvonTZFLiOSdoFQia_PrM0j0fDlGultzTJgblV72d51ZJNnqt7BCjNGxZuWWyQ2RvRvlz4GZ_MRDjODmMcTAOJ6G37o2_5gf-NPpeF8WgVCxdY0sgWJsff_45WemrkPScRSaE991GEoJZ5y_Is9PkMh6oNyyfnLKbncqCElJC-ks2x5y0HTpJprn2cPA.Zxch9I9EN3F_QfScEmniPp9VszQI-JYoDsK46J_2AOM&dib_tag=se&keywords=zakat+guide&qid=1740258627&sprefix=zakat+guide%2Caps%2C180&sr=8-1'
  }
} as const

export type SourceKey = keyof typeof SOURCES 