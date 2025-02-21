const SILVER_PRICE_SOURCES = {
  API: 'https://www.freeforexapi.com/api/live?pairs=XAGUSD', // Fallback
  MANUAL_DEFAULTS: {
    price: 0.85, // USD per gram
    lastUpdated: '2024-01-29',
    source: 'Example Zakat Authority'
  }
};

const getNisabThreshold = async () => {
  try {
    // First try to get official recommendation
    const officialNisab = await fetchFromZakatAuthority();
    if (officialNisab) return officialNisab;

    // Fallback to API if needed
    const silverPrice = await fetchSilverPrice();
    if (silverPrice) {
      return calculateNisab(silverPrice);
    }

    // Final fallback to manual defaults
    return calculateNisab(SILVER_PRICE_SOURCES.MANUAL_DEFAULTS.price);
  } catch (error) {
    // Always have a reliable fallback
    return calculateNisab(SILVER_PRICE_SOURCES.MANUAL_DEFAULTS.price);
  }
};

const calculateNisab = (silverPricePerGram) => {
  const SILVER_GRAMS_FOR_NISAB = 595;
  return silverPricePerGram * SILVER_GRAMS_FOR_NISAB;
};

The Nisab threshold is based on the minimum amount of wealth required before Zakat becomes obligatory. It is calculated using either gold or silver.

1️⃣ Gold Nisab
The threshold is 85 grams of gold.
Example: If 1 gram of gold = $60, then:
85
×
60
=
$
5
,
100
85×60=$5,100
If total Zakatable wealth is above this amount, Zakat is due.
2️⃣ Silver Nisab (Most Commonly Used)
The threshold is 595 grams of silver.
Example: If 1 gram of silver = $0.75, then:
595
×
0.75
=
$
446.25
595×0.75=$446.25
If total Zakatable wealth is above this amount, Zakat is due.
Which Nisab Should Be Used?
Silver is used more commonly because it sets a lower threshold, making Zakat applicable to more people.
Some scholars recommend using gold Nisab if wealth is primarily in gold.
📌 Automated Nisab Calculation Using an API
To automate Nisab calculation, we can: 1️⃣ Fetch live gold & silver prices from a Metals API.
2️⃣ Apply the multiplication factor (85g for gold, 595g for silver).
3️⃣ Compare the user’s Zakatable assets against the calculated Nisab.

