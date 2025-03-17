import { SourceKey } from './sources'

export interface FAQItem {
  question: string
  answer: string
  sources?: SourceKey[]
}

export interface FAQSection {
  items: FAQItem[]
  sources?: SourceKey[]
}

export interface RealEstateFAQs {
  primary: FAQSection
  rental: FAQSection
  sale: FAQSection
  vacant: FAQSection
}

export interface StockFAQs {
  active: FAQSection
  passive: FAQSection
  dividend: FAQSection
  funds: FAQSection
  sources?: SourceKey[]
}

export interface AssetFAQs {
  realestate: RealEstateFAQs
  metals: FAQSection
  stocks: StockFAQs
  retirement: FAQSection
  cash: FAQSection
  debt: FAQSection
}

export const ASSET_FAQS: AssetFAQs = {
  realestate: {
    primary: {
      items: [
        {
          question: "Do I need to pay Zakat on my primary residence?",
          answer: "No, your primary residence is NOT subject to Zakat. Do not include its value in your Zakat calculation."
        },
        {
          question: "What if I have multiple homes?",
          answer: "Only your primary residence is exempt. Additional properties may be subject to Zakat depending on their use (rental, investment, etc)."
        }
      ],
      sources: ['AMAZON', 'IFG', 'NZF']
    },
    rental: {
      items: [
        {
          question: "How is Zakat calculated on rental properties?",
          answer: "Zakat is NOT due on the property itself, but on any rental income earned from it. You can deduct expenses directly related to rental income (e.g., maintenance, property tax, mortgage payments on rental property, management fees)."
        },
        {
          question: "What expenses can I deduct?",
          answer: "You can deduct expenses directly related to rental income including maintenance, property tax, mortgage payments on rental property, and management fees."
        }
      ],
      sources: ['AMAZON', 'IFG', 'NZF']
    },
    sale: {
      items: [
        {
          question: "When is Zakat due on property for sale?",
          answer: "Zakat is due on the full market value of properties that are actively listed for sale, provided the Hawl requirement is met."
        },
        {
          question: "How do I determine the property value?",
          answer: "Use the current market value or listed sale price of the property. This can be based on recent appraisals or comparable sales in the area."
        },
        {
          question: "What if I'm not actively selling yet?",
          answer: "If the property is not actively listed for sale, it is not subject to Zakat unless it was purchased with the intention of resale."
        }
      ],
      sources: ['AMAZON', 'IFG', 'NZF']
    },
    vacant: {
      items: [
        {
          question: "When is Zakat due on property?",
          answer: "If the property was purchased for investment or resale, Zakat applies to its full market value, as it is treated like a business asset."
        },
        {
          question: "How do I determine the property value?",
          answer: "Check online property valuation websites (Zillow, Redfin) or use an appraisal to estimate current market value."
        }
      ],
      sources: ['AMAZON', 'IFG', 'NZF']
    }
  },
  metals: {
    items: [
      {
        question: "How is Zakat calculated on gold and silver?",
        answer: "Zakat is calculated at 2.5% of the current market value if you own more than the nisab threshold."
      },
      {
        question: "Is personal jewelry subject to Zakat?",
        answer: "Scholars differ on whether zakat is due on jewelry intended for personal use. The Hanafi school requires zakat on all gold and silver jewelry, while other schools may exempt personal use items. It's advisable to consult with a knowledgeable scholar to determine the ruling applicable to your situation."
      },
      {
        question: "What about mixed metals and precious stones?",
        answer: "For jewelry containing multiple metals, zakat is due only on the gold or silver content. Diamonds, pearls, and other gemstones are not subject to zakat unless they are held for trade."
      }
    ],
    sources: ['AMAZON', 'BARAKAH_CAPITAL', 'JOE_BRADFORD']
  },
  stocks: {
    active: {
      items: [
        {
          question: "How is Zakat calculated on actively traded stocks?",
          answer: "For actively traded stocks, Zakat is due on the full market value at 2.5%. This applies to stocks you buy and sell frequently for profit."
        }
      ],
      sources: ['IFG', 'LAUNCHGOOD', 'AMAZON']
    },
    passive: {
      items: [
        {
          question: "How is Zakat calculated on passive investments?",
          answer: "For passive investments, you can use either the Quick Method (30% of market value) or the Detailed CRI Method based on company financials. Most scholars recommend using 30% of the market value for long-term investments."
        }
      ],
      sources: ['IFG', 'LAUNCHGOOD', 'AMAZON']
    },
    dividend: {
      items: [
        {
          question: "How are dividends handled for Zakat?",
          answer: "Dividends received are fully subject to Zakat at 2.5% if they meet the nisab threshold. Include all dividend income received during the year."
        }
      ],
      sources: ['IFG', 'LAUNCHGOOD', 'AMAZON']
    },
    funds: {
      items: [
        {
          question: "How are investment funds calculated?",
          answer: "For mutual funds and ETFs, use either 30% of market value for passive funds or full value for actively traded funds. The calculation method depends on your investment strategy and holding period."
        }
      ],
      sources: ['IFG', 'LAUNCHGOOD', 'AMAZON']
    },
    sources: ['IFG', 'LAUNCHGOOD', 'AMAZON']
  },
  retirement: {
    items: [
      {
        question: "When is Zakat due on retirement accounts?",
        answer: "Zakat is due annually on the withdrawable amount (balance minus taxes and penalties). This applies to both IRAs and 401(k)s once the funds are vested."
      },
      {
        question: "How do I calculate Zakat on retirement funds?",
        answer: "For accessible funds (e.g., over 59½): Pay 2.5% on full balance.\nFor restricted funds: Either pay 2.5% on net amount after penalties/taxes, or defer payment until accessible."
      },
      {
        question: "What if I can't pay Zakat from other sources?",
        answer: "If paying Zakat would require withdrawing from retirement (triggering penalties): 1) Pay what you can, 2) Record remaining as debt, 3) Pay when funds become accessible."
      }
    ],
    sources: ['FIQH_COUNCIL', 'AMAZON']
  },
  cash: {
    items: [
      {
        question: "What cash assets are subject to Zakat?",
        answer: "All cash holdings including physical cash, bank accounts, digital wallets, and foreign currency are subject to Zakat if they meet the Nisab threshold."
      },
      {
        question: "How is foreign currency calculated?",
        answer: "Foreign currency is converted to your local currency at current exchange rates. The total value in your local currency is what's used for Zakat calculation."
      }
    ],
    sources: ['AMAZON']
  },
  debt: {
    items: [
      {
        question: "What debts are zakatable?",
        answer: "Money owed to you (receivables) is generally zakatable if it is 'good debt' that you expect to be repaid. Money you owe to others (liabilities) can be deducted from your zakatable assets."
      },
      {
        question: "How are long-term debts handled?",
        answer: "For long-term debts like mortgages or student loans, you may deduct up to 12 months' worth of installments due within the forthcoming lunar year."
      },
      {
        question: "Are all liabilities deductible?",
        answer: "Only debts that were incurred before the start of the ḥawl and are due within the next 12 lunar months can be fully deducted. Future expenses and long-term debts beyond the next 12 months are not fully deductible. For example, you cannot include next month’s rent and utilities in your deductibles. "
      },
      {
        question: "How do I handle money owed to me?",
        answer: "Money owed to you that you expect to be repaid is considered 'good debt' and is zakatable at 2.5% if you've owned it for a full lunar year."
      },
      {
        question: "Can I deduct my student loan from my zakat calculation?",
        answer: "If you're currently repaying your student loan, you may deduct up to 12 months' worth of repayments from your zakatable assets. If you're not yet repaying the loan, it shouldn't be deducted."
      },
      {
        question: "Do I pay zakat on my mortgage?",
        answer: "You can deduct up to 12 months' worth of principal repayments due within the forthcoming lunar year from your zakatable assets. Interest payments are not deductible."
      },
      {
        question: "Are business loans deductible in zakat calculation?",
        answer: "Yes, business loans can be deducted. You may deduct up to 12 months' worth of principal repayments due within the forthcoming lunar year."
      },
      {
        question: "Can I deduct my monthly bills when calculating zakat?",
        answer: "Yes, immediate liabilities such as this month's bills, rent, and utilities can be deducted from your zakatable assets. Future expenses not yet incurred are not deductible."
      }
    ],
    sources: ['AMAZON', 'NZF_CANADA', 'UM_RELIEF', 'NZF_UK', 'ISLAMIC_RELIEF']
  }
} 