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
  primary: FAQItem[]
  rental: FAQItem[]
  sale: FAQItem[]
  vacant: FAQItem[]
}

export interface StockFAQs {
  active: FAQItem[]
  passive: FAQItem[]
  dividend: FAQItem[]
  funds: FAQItem[]
  sources?: SourceKey[]
}

export interface AssetFAQs {
  realestate: RealEstateFAQs
  metals: FAQSection
  stocks: StockFAQs
  retirement: FAQSection
  cash: FAQSection
}

export const ASSET_FAQS: AssetFAQs = {
  realestate: {
    primary: [
      {
        question: "Do I need to pay Zakat on my primary residence?",
        answer: "No, your primary residence is NOT subject to Zakat. Do not include its value in your Zakat calculation."
      },
      {
        question: "What if I have multiple homes?",
        answer: "Only your primary residence is exempt. Additional properties may be subject to Zakat depending on their use (rental, investment, etc)."
      }
    ],
    rental: [
      {
        question: "How is Zakat calculated on rental properties?",
        answer: "Zakat is NOT due on the property itself, but on any rental income earned from it. You can deduct expenses directly related to rental income (e.g., maintenance, property tax, mortgage payments on rental property, management fees)."
      },
      {
        question: "What expenses can I deduct?",
        answer: "You can deduct expenses directly related to rental income including maintenance, property tax, mortgage payments on rental property, and management fees."
      },
      {
        question: "How is the Zakat calculated?",
        answer: "Formula: (Net Rental Income × 2.5%). Example: $20,000 net rental income → $500 Zakat Due. Net Rental Income = Total Rental Income - Allowable Deductions."
      }
    ],
    sale: [
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
    vacant: [
      {
        question: "When is Zakat due on property?",
        answer: "If the property was purchased for investment or resale, Zakat applies to its full market value, as it is treated like a business asset."
      },
      {
        question: "How do I determine the property value?",
        answer: "Check online property valuation websites (Zillow, Redfin) or use an appraisal to estimate current market value."
      },
      {
        question: "How is Zakat calculated on investment property?",
        answer: "Formula: (Market Value of Property × 2.5%). Example: $500,000 investment property → $12,500 Zakat Due."
      }
    ]
  },
  metals: {
    items: [
      {
        question: "How is Zakat calculated on gold and silver?",
        answer: "Zakat is calculated at 2.5% of the current market value if you own more than the nisab threshold."
      },
      {
        question: "Is personal jewelry subject to Zakat?",
        answer: "According to most scholars, jewelry worn regularly for personal use is exempt from Zakat. However, jewelry kept as investment or worn occasionally should be included."
      }
    ],
    sources: ['AMAZON']
  },
  stocks: {
    active: [
      {
        question: "How is Zakat calculated on actively traded stocks?",
        answer: "For actively traded stocks, Zakat is due on the full market value at 2.5%."
      },
      {
        question: "How is Zakat calculated on stocks?",
        answer: "For actively traded stocks, Zakat is calculated on the full market value. For long-term investments, some scholars allow using 30% of the market value."
      }
    ],
    passive: [
      {
        question: "How is Zakat calculated on passive investments?",
        answer: "For passive investments, you can use either the Quick Method (30% of market value) or the Detailed CRI Method based on company financials."
      }
    ],
    dividend: [
      {
        question: "How are dividends handled for Zakat?",
        answer: "Dividends received are fully subject to Zakat at 2.5% if they meet the nisab threshold."
      }
    ],
    funds: [
      {
        question: "How are investment funds calculated?",
        answer: "For mutual funds and ETFs, use either 30% of market value for passive funds or full value for actively traded funds."
      }
    ],
    sources: ['AMAZON']
  },
  retirement: {
    items: [
      {
        question: "Do I need to pay Zakat on retirement accounts?",
        answer: "Zakat is due on the accessible portion of retirement accounts. Early withdrawal penalties may reduce the zakatable amount."
      }
    ],
    sources: ['AMAZON']
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
  }
} 