// Works out which country a GitHub profile's location is in. The field is free text
// ("Berlin", "SF Bay Area", "🌍"), so this places what it can be sure of and leaves the
// rest uncounted: a name of a country, a US state, or a town on the list below.

// Every country by its English name. Retired codes are passed over: Intl gives "DD" the
// name Germany too, and it would be counted apart from "DE".
const byName = new Map();
{
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      if (Intl.getCanonicalLocales(`und-${code}`)[0] !== `und-${code}`) continue;
      const name = names.of(code);
      // Intl also names a few things that are not countries.
      if (['EU', 'UN', 'EZ'].includes(code)) continue;
      if (name && name !== code) byName.set(name.toLowerCase(), code);
    }
  }
}
// Two-letter codes people do write for their country. Not every ISO code: "SZ" on a
// profile is Shenzhen and "GD" Guangdong far more often than Eswatini and Grenada.
const codes = new Set(
  'CN DE FR NL JP KR BR RU PL ES IT SE CH AT BE DK NO FI IE PT CZ UA TR TW HK SG AU NZ MX GB US IN CA AR CL CO IL ZA GR RO HU BG HR RS SK SI LT LV EE TH VN ID MY PH PK BD EG NG KE AE SA'.split(
    ' ',
  ),
);

// What people call a country when it is not the name Intl has for it. A few plain names
// are here too because Intl's own differ between JavaScript engines: one says "China"
// where another says "China mainland", and this has to give the same answer under both.
const aliases = {
  china: 'CN',
  macao: 'MO',
  usa: 'US',
  'u.s': 'US',
  'u.s.a': 'US',
  us: 'US',
  america: 'US',
  'united states of america': 'US',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'great britain': 'GB',
  britain: 'GB',
  korea: 'KR',
  'republic of korea': 'KR',
  'south korea': 'KR',
  turkey: 'TR',
  türkiye: 'TR',
  méxico: 'MX',
  brasil: 'BR',
  deutschland: 'DE',
  españa: 'ES',
  italia: 'IT',
  'the netherlands': 'NL',
  nederland: 'NL',
  holland: 'NL',
  czechia: 'CZ',
  'czech republic': 'CZ',
  russia: 'RU',
  'russian federation': 'RU',
  taiwan: 'TW',
  'hong kong': 'HK',
  hongkong: 'HK',
  macau: 'MO',
  perú: 'PE',
  vietnam: 'VN',
  'viet nam': 'VN',
  prc: 'CN',
  中国: 'CN',
  日本: 'JP',
  한국: 'KR',
  대한민국: 'KR',
  台灣: 'TW',
  台湾: 'TW',
  香港: 'HK',
  polska: 'PL',
  sverige: 'SE',
  norge: 'NO',
  danmark: 'DK',
  suomi: 'FI',
  schweiz: 'CH',
  suisse: 'CH',
  österreich: 'AT',
  belgië: 'BE',
  belgique: 'BE',
  україна: 'UA',
  россия: 'RU',
  uae: 'AE',
  'p.r.china': 'CN',
  'p.r. china': 'CN',
  'mainland china': 'CN',
  'new zealand': 'NZ',
  aotearoa: 'NZ',
};

const states =
  'alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada new-hampshire new-jersey new-mexico new-york north-carolina north-dakota ohio oklahoma oregon pennsylvania rhode-island south-carolina south-dakota tennessee texas utah vermont virginia washington west-virginia wisconsin wyoming'
    .split(' ')
    .map((state) => state.replace('-', ' '));
const stateCodes = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  ),
);
// Canada's provinces and Australia's states are written the same way.
const provinces = {
  ontario: 'CA',
  quebec: 'CA',
  québec: 'CA',
  'british columbia': 'CA',
  alberta: 'CA',
  manitoba: 'CA',
  'nova scotia': 'CA',
  saskatchewan: 'CA',
  'new south wales': 'AU',
  victoria: 'AU',
  queensland: 'AU',
  'western australia': 'AU',
  'south australia': 'AU',
  tasmania: 'AU',
  bavaria: 'DE',
  bayern: 'DE',
  catalonia: 'ES',
  guangdong: 'CN',
  zhejiang: 'CN',
  jiangsu: 'CN',
  sichuan: 'CN',
  kerala: 'IN',
  karnataka: 'IN',
  maharashtra: 'IN',
  'tamil nadu': 'IN',
};

// Towns people give as their whole location. Added to as the list of unplaced ones shows
// which are worth having; a town that is in two countries stays off it.
const towns = Object.fromEntries(
  Object.entries({
    US: 'san francisco|sf|bay area|sf bay area|san francisco bay area|silicon valley|new york|nyc|new york city|brooklyn|los angeles|la|seattle|austin|boston|chicago|portland|denver|san diego|san jose|atlanta|dallas|houston|philadelphia|miami|washington dc|washington d.c|palo alto|mountain view|sunnyvale|oakland|berkeley|pittsburgh|minneapolis|salt lake city|phoenix|nashville|detroit|raleigh|orlando|las vegas|sacramento|irvine|cupertino|santa clara|redmond|bellevue|boulder|brooklyn, ny|manhattan|menlo park|santa monica|san mateo|socal|norcal|pnw',
    CN: "beijing|shanghai|shenzhen|guangzhou|hangzhou|chengdu|nanjing|wuhan|xiamen|suzhou|chongqing|tianjin|nanking|北京|上海|深圳|广州|杭州|成都|南京|武汉|厦门|苏州|重庆|西安|xian|xi'an|changsha|hefei|qingdao|dalian|zhengzhou|fuzhou|kunming|shenyang|jinan|harbin|ningbo|dongguan|foshan",
    DE: 'berlin|munich|münchen|hamburg|cologne|köln|frankfurt|stuttgart|düsseldorf|leipzig|dresden|karlsruhe|nuremberg|nürnberg|hannover|bremen|bonn|tübingen|kirchheim unter teck|darmstadt|aachen|münster|freiburg|heidelberg|mannheim|dortmund|essen',
    FR: 'paris|lyon|marseille|toulouse|nantes|bordeaux|lille|strasbourg|rennes|montpellier|grenoble|nice',
    GB: 'london|manchester|edinburgh|glasgow|bristol|leeds|birmingham|oxford|liverpool|brighton|sheffield|cardiff|belfast|nottingham|newcastle upon tyne',
    CA: 'toronto|vancouver|montreal|montréal|ottawa|calgary|edmonton|waterloo|winnipeg|quebec city',
    AU: 'sydney|melbourne|brisbane|perth|adelaide|canberra|gold coast',
    JP: 'tokyo|osaka|kyoto|yokohama|nagoya|fukuoka|sapporo|東京|大阪|京都',
    KR: 'seoul|busan|incheon|pangyo|서울',
    IN: 'bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|chennai|pune|kolkata|ahmedabad|gurgaon|gurugram|noida|jaipur|kochi',
    NL: 'amsterdam|rotterdam|utrecht|eindhoven|the hague|den haag|groningen|delft',
    ES: 'madrid|barcelona|valencia|sevilla|seville|málaga|bilbao|zaragoza',
    IT: 'milan|milano|rome|roma|turin|torino|bologna|florence|firenze|naples|napoli|modena',
    BR: 'são paulo|sao paulo|rio de janeiro|belo horizonte|curitiba|porto alegre|brasília|brasilia|florianópolis|recife|fortaleza|goiânia',
    RU: 'moscow|saint petersburg|st. petersburg|st petersburg|novosibirsk|москва|санкт-петербург',
    PL: 'warsaw|warszawa|kraków|krakow|wrocław|wroclaw|gdańsk|gdansk|poznań|poznan|łódź',
    SE: 'stockholm|gothenburg|göteborg|malmö|uppsala',
    CH: 'zürich|zurich|geneva|genève|basel|bern|lausanne',
    AT: 'vienna|wien|graz|linz|salzburg',
    BE: 'brussels|bruxelles|antwerp|ghent|gent|leuven',
    DK: 'copenhagen|københavn|aarhus',
    NO: 'oslo|bergen|trondheim',
    FI: 'helsinki|espoo|tampere',
    IE: 'dublin|cork',
    PT: 'lisbon|lisboa|porto',
    CZ: 'prague|praha|brno',
    HU: 'budapest',
    RO: 'bucharest|bucurești|cluj-napoca|cluj',
    UA: 'kyiv|kiev|lviv|kharkiv|odesa|київ',
    TR: 'istanbul|ankara|izmir',
    IL: 'tel aviv|jerusalem|haifa',
    AE: 'dubai|abu dhabi',
    SG: 'singapore',
    TW: 'taipei|hsinchu|taichung|kaohsiung|台北',
    VN: 'hanoi|ha noi|ho chi minh city|ho chi minh|saigon|hcmc|da nang',
    TH: 'bangkok|chiang mai',
    ID: 'jakarta|bandung|surabaya|yogyakarta|bali',
    MY: 'kuala lumpur|penang',
    PH: 'manila|cebu|quezon city',
    MX: 'mexico city|cdmx|ciudad de méxico|guadalajara|monterrey',
    AR: 'buenos aires|córdoba, argentina|rosario',
    CL: 'santiago de chile',
    CO: 'bogotá|bogota|medellín|medellin',
    NZ: 'auckland|wellington|christchurch',
    ZA: 'cape town|johannesburg|pretoria',
    EG: 'cairo',
    NG: 'lagos|abuja',
    KE: 'nairobi',
    PK: 'karachi|lahore|islamabad',
    BD: 'dhaka',
    GR: 'athens|thessaloniki',
    RS: 'belgrade',
    BG: 'sofia',
    HR: 'zagreb',
    LT: 'vilnius',
    LV: 'riga',
    EE: 'tallinn|tartu',
    BY: 'minsk',
    IR: 'tehran',
    SA: 'riyadh|jeddah',
    HK: 'hong kong sar|hk|hksar',
  }).flatMap(([code, list]) => list.split('|').map((town) => [town, code])),
);

/** The country a location is in, as its two-letter code, or nothing if that is not plain. */
export function countryOf(location) {
  // Someone in two places is counted in the first, so "|" and "/" split before "," does.
  for (const place of location.split(/[|/→]| and | & /)) {
    const parts = place
      .split(/[,，、·•-]| - /)
      .map((part) =>
        part
          .replace(/\p{Extended_Pictographic}|\p{Regional_Indicator}/gu, '')
          .trim()
          .replace(/\.+$/, ''),
      )
      .filter(Boolean);
    // The country, where there is one, comes last.
    for (const [at, part] of [...parts.entries()].reverse()) {
      const lower = part.toLowerCase();
      if (aliases[lower]) return aliases[lower];
      if (byName.has(lower)) return byName.get(lower);
      if (states.includes(lower)) return 'US';
      if (provinces[lower]) return provinces[lower];
      // "Oakland, CA" is California. A two-letter code standing alone could be either.
      if (at > 0 && stateCodes.has(part)) return 'US';
      if (at > 0 && /^[A-Z]{2}$/.test(part) && codes.has(part)) return part;
      if (towns[lower]) return towns[lower];
      // A country code on its own, where it is not also a US state: "CN", "nl".
      if (
        /^[a-z]{2}$/i.test(part) &&
        codes.has(part.toUpperCase()) &&
        !stateCodes.has(part.toUpperCase())
      ) {
        return part.toUpperCase();
      }
    }
    // Written without commas: "Shanghai China", "Tokyo Japan", "China Shenzhen".
    const words = place
      .toLowerCase()
      .split(/[\s.]+/)
      .filter(Boolean);
    for (const word of [words.at(-1), words[0]]) {
      if (!word || words.length < 2) continue;
      if (aliases[word]) return aliases[word];
      if (byName.has(word)) return byName.get(word);
    }
  }
  return null;
}

/** People per country from a list of locations, most first, with how many could be placed. */
export function countCountries(locations) {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const counts = new Map();
  let placed = 0;
  for (const location of locations) {
    const code = location ? countryOf(location) : null;
    if (!code) continue;
    placed++;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return {
    people: locations.length,
    placed,
    list: [...counts]
      .map(([code, people]) => ({ code, name: names.of(code), people }))
      .sort((a, b) => b.people - a.people || a.name.localeCompare(b.name)),
  };
}
