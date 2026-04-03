const COUNTRY_DEFS = [
  { iso3: 'UZB', wb: 'UZB', iea: 'Uzbekistan', display: 'Uzbekistan', aliases: ['uzbekistan', "o'zbekiston", 'ozbekiston', 'uzbekiston'] },
  { iso3: 'USA', wb: 'USA', iea: 'United States', display: 'United States', aliases: ['united states', 'united states of america', 'usa', 'us', 'amerika', 'aqsh'] },
  { iso3: 'DEU', wb: 'DEU', iea: 'Germany', display: 'Germany', aliases: ['germany', 'germaniya', 'deutschland'] },
  { iso3: 'FRA', wb: 'FRA', iea: 'France', display: 'France', aliases: ['france', 'fransiya'] },
  { iso3: 'ITA', wb: 'ITA', iea: 'Italy', display: 'Italy', aliases: ['italy', 'italiya'] },
  { iso3: 'ESP', wb: 'ESP', iea: 'Spain', display: 'Spain', aliases: ['spain', 'ispaniya'] },
  { iso3: 'GBR', wb: 'GBR', iea: 'United Kingdom', display: 'United Kingdom', aliases: ['united kingdom', 'uk', 'great britain', 'britain', 'england', 'buyuk britaniya'] },
  { iso3: 'NLD', wb: 'NLD', iea: 'Netherlands', display: 'Netherlands', aliases: ['netherlands', 'niderlandiya', 'holland'] },
  { iso3: 'BEL', wb: 'BEL', iea: 'Belgium', display: 'Belgium', aliases: ['belgium', 'belgiya'] },
  { iso3: 'CHE', wb: 'CHE', iea: 'Switzerland', display: 'Switzerland', aliases: ['switzerland', 'shveytsariya'] },
  { iso3: 'AUT', wb: 'AUT', iea: 'Austria', display: 'Austria', aliases: ['austria', 'avstriya'] },
  { iso3: 'POL', wb: 'POL', iea: 'Poland', display: 'Poland', aliases: ['poland', 'polsha'] },
  { iso3: 'CZE', wb: 'CZE', iea: 'Czechia', display: 'Czechia', aliases: ['czechia', 'czech republic', 'chexiya'] },
  { iso3: 'TUR', wb: 'TUR', iea: 'Republic of Türkiye', display: 'Türkiye', aliases: ['turkiye', 'türkiye', 'turkey', 'turkiya'] },
  { iso3: 'ARE', wb: 'ARE', iea: 'United Arab Emirates', display: 'United Arab Emirates', aliases: ['united arab emirates', 'uae', 'bae', 'amirliklar', "birlashgan arab amirliklari"] },
  { iso3: 'SAU', wb: 'SAU', iea: 'Saudi Arabia', display: 'Saudi Arabia', aliases: ['saudi arabia', 'saudiya', 'saudiya arabistoni'] },
  { iso3: 'QAT', wb: 'QAT', iea: 'Qatar', display: 'Qatar', aliases: ['qatar'] },
  { iso3: 'CHN', wb: 'CHN', iea: "People's Republic of China", display: 'China', aliases: ['china', 'xitoy', "people's republic of china", 'prc'] },
  { iso3: 'JPN', wb: 'JPN', iea: 'Japan', display: 'Japan', aliases: ['japan', 'yaponiya'] },
  { iso3: 'KOR', wb: 'KOR', iea: 'Korea', display: 'South Korea', aliases: ['south korea', 'korea', 'janubiy koreya', 'koreya'] },
  { iso3: 'IND', wb: 'IND', iea: 'India', display: 'India', aliases: ['india', 'hindiston'] },
  { iso3: 'CAN', wb: 'CAN', iea: 'Canada', display: 'Canada', aliases: ['canada', 'kanada'] },
  { iso3: 'AUS', wb: 'AUS', iea: 'Australia', display: 'Australia', aliases: ['australia', 'avstraliya'] },
  { iso3: 'BRA', wb: 'BRA', iea: 'Brazil', display: 'Brazil', aliases: ['brazil', 'braziliya'] },
  { iso3: 'MEX', wb: 'MEX', iea: 'Mexico', display: 'Mexico', aliases: ['mexico', 'meksika'] },
  { iso3: 'SGP', wb: 'SGP', iea: 'Singapore', display: 'Singapore', aliases: ['singapore', 'singapur'] },
  { iso3: 'RUS', wb: 'RUS', iea: 'Russian Federation', display: 'Russia', aliases: ['russia', 'rossiya', 'russian federation'] },
  { iso3: 'KAZ', wb: 'KAZ', iea: 'Kazakhstan', display: 'Kazakhstan', aliases: ['kazakhstan', "qozog'iston", 'qozogiston', 'kazakstan'] },
  { iso3: 'KGZ', wb: 'KGZ', iea: 'Kyrgyzstan', display: 'Kyrgyzstan', aliases: ['kyrgyzstan', "qirg'iziston", 'qirgiziston', 'kirgizstan'] },
  { iso3: 'TJK', wb: 'TJK', iea: 'Tajikistan', display: 'Tajikistan', aliases: ['tajikistan', 'tojikiston'] },
  { iso3: 'TKM', wb: 'TKM', iea: 'Turkmenistan', display: 'Turkmenistan', aliases: ['turkmenistan', 'turkmaniston'] },
  { iso3: 'MNG', wb: 'MNG', iea: 'Mongolia', display: 'Mongolia', aliases: ['mongolia', 'mongoliya'] },
  { iso3: 'AZE', wb: 'AZE', iea: 'Azerbaijan', display: 'Azerbaijan', aliases: ['azerbaijan', 'ozarbayjon', 'azerbayjan'] },
  { iso3: 'GEO', wb: 'GEO', iea: 'Georgia', display: 'Georgia', aliases: ['georgia', 'gruziya'] },
  { iso3: 'ARM', wb: 'ARM', iea: 'Armenia', display: 'Armenia', aliases: ['armenia', 'armaniston'] },
  { iso3: 'IRN', wb: 'IRN', iea: 'Islamic Republic of Iran', display: 'Iran', aliases: ['iran', 'eron', 'islamic republic of iran'] },
  { iso3: 'AFG', wb: 'AFG', iea: 'Afghanistan', display: 'Afghanistan', aliases: ['afghanistan', "afg'oniston", 'afgoniston'] },
  { iso3: 'PAK', wb: 'PAK', iea: 'Pakistan', display: 'Pakistan', aliases: ['pakistan', 'pokiston'] },
  { iso3: 'BGD', wb: 'BGD', iea: 'Bangladesh', display: 'Bangladesh', aliases: ['bangladesh', 'bangladesh'] },
  { iso3: 'IDN', wb: 'IDN', iea: 'Indonesia', display: 'Indonesia', aliases: ['indonesia', 'indoneziya'] },
  { iso3: 'MYS', wb: 'MYS', iea: 'Malaysia', display: 'Malaysia', aliases: ['malaysia', 'malayziya'] },
  { iso3: 'THA', wb: 'THA', iea: 'Thailand', display: 'Thailand', aliases: ['thailand', 'tailand'] },
  { iso3: 'VNM', wb: 'VNM', iea: 'Vietnam', display: 'Vietnam', aliases: ['vietnam', 'viet nam', 'vyetnam'] },
  { iso3: 'PHL', wb: 'PHL', iea: 'Philippines', display: 'Philippines', aliases: ['philippines', 'filippin'] },
  { iso3: 'LKA', wb: 'LKA', iea: 'Sri Lanka', display: 'Sri Lanka', aliases: ['sri lanka', 'shri lanka'] },
  { iso3: 'NPL', wb: 'NPL', iea: 'Nepal', display: 'Nepal', aliases: ['nepal'] },
  { iso3: 'MMR', wb: 'MMR', iea: 'Myanmar', display: 'Myanmar', aliases: ['myanmar', 'burma'] },
  { iso3: 'NGA', wb: 'NGA', iea: 'Nigeria', display: 'Nigeria', aliases: ['nigeria', 'nigeriya'] },
  { iso3: 'ZAF', wb: 'ZAF', iea: 'South Africa', display: 'South Africa', aliases: ['south africa', 'janubiy afrika', 'janubiy afrika respublikasi'] },
  { iso3: 'EGY', wb: 'EGY', iea: 'Egypt', display: 'Egypt', aliases: ['egypt', 'misr'] },
  { iso3: 'KEN', wb: 'KEN', iea: 'Kenya', display: 'Kenya', aliases: ['kenya'] },
  { iso3: 'ETH', wb: 'ETH', iea: 'Ethiopia', display: 'Ethiopia', aliases: ['ethiopia', 'efiopiya'] },
  { iso3: 'GHA', wb: 'GHA', iea: 'Ghana', display: 'Ghana', aliases: ['ghana', 'gana'] },
  { iso3: 'TZA', wb: 'TZA', iea: 'Tanzania', display: 'Tanzania', aliases: ['tanzania', 'tanzaniya'] },
  { iso3: 'MAR', wb: 'MAR', iea: 'Morocco', display: 'Morocco', aliases: ['morocco', 'marokash'] },
  { iso3: 'DZA', wb: 'DZA', iea: 'Algeria', display: 'Algeria', aliases: ['algeria', 'jazoir'] },
  { iso3: 'TUN', wb: 'TUN', iea: 'Tunisia', display: 'Tunisia', aliases: ['tunisia', 'tunis'] },
  { iso3: 'AGO', wb: 'AGO', iea: 'Angola', display: 'Angola', aliases: ['angola'] },
  { iso3: 'MOZ', wb: 'MOZ', iea: 'Mozambique', display: 'Mozambique', aliases: ['mozambique', 'mozambik'] },
  { iso3: 'ZWE', wb: 'ZWE', iea: 'Zimbabwe', display: 'Zimbabwe', aliases: ['zimbabwe', 'zimbabve'] },
  { iso3: 'ZMB', wb: 'ZMB', iea: 'Zambia', display: 'Zambia', aliases: ['zambia', 'zambiya'] },
  { iso3: 'UKR', wb: 'UKR', iea: 'Ukraine', display: 'Ukraine', aliases: ['ukraine', 'ukraina'] },
  { iso3: 'SWE', wb: 'SWE', iea: 'Sweden', display: 'Sweden', aliases: ['sweden', 'shvetsiya'] },
  { iso3: 'NOR', wb: 'NOR', iea: 'Norway', display: 'Norway', aliases: ['norway', 'norvegiya'] },
  { iso3: 'FIN', wb: 'FIN', iea: 'Finland', display: 'Finland', aliases: ['finland', 'finlandiya'] },
  { iso3: 'DNK', wb: 'DNK', iea: 'Denmark', display: 'Denmark', aliases: ['denmark', 'daniya'] },
  { iso3: 'PRT', wb: 'PRT', iea: 'Portugal', display: 'Portugal', aliases: ['portugal', 'portugaliya'] },
  { iso3: 'GRC', wb: 'GRC', iea: 'Greece', display: 'Greece', aliases: ['greece', 'gretsiya'] },
  { iso3: 'HUN', wb: 'HUN', iea: 'Hungary', display: 'Hungary', aliases: ['hungary', 'vengriya'] },
  { iso3: 'ROU', wb: 'ROU', iea: 'Romania', display: 'Romania', aliases: ['romania', 'ruminiya'] },
  { iso3: 'BGR', wb: 'BGR', iea: 'Bulgaria', display: 'Bulgaria', aliases: ['bulgaria', 'bolgariya'] },
  { iso3: 'HRV', wb: 'HRV', iea: 'Croatia', display: 'Croatia', aliases: ['croatia', 'xorvatiya'] },
  { iso3: 'SRB', wb: 'SRB', iea: 'Serbia', display: 'Serbia', aliases: ['serbia', 'serbiya'] },
  { iso3: 'ISR', wb: 'ISR', iea: 'Israel', display: 'Israel', aliases: ['israel', 'isroil'] },
  { iso3: 'IRQ', wb: 'IRQ', iea: 'Iraq', display: 'Iraq', aliases: ['iraq', 'iroq'] },
  { iso3: 'KWT', wb: 'KWT', iea: 'Kuwait', display: 'Kuwait', aliases: ['kuwait', 'quvayt'] },
  { iso3: 'OMN', wb: 'OMN', iea: 'Oman', display: 'Oman', aliases: ['oman'] },
  { iso3: 'BHR', wb: 'BHR', iea: 'Bahrain', display: 'Bahrain', aliases: ['bahrain', 'bahrayn'] },
  { iso3: 'JOR', wb: 'JOR', iea: 'Jordan', display: 'Jordan', aliases: ['jordan', 'iordaniya'] },
  { iso3: 'LBN', wb: 'LBN', iea: 'Lebanon', display: 'Lebanon', aliases: ['lebanon', 'livan'] },
  { iso3: 'ARG', wb: 'ARG', iea: 'Argentina', display: 'Argentina', aliases: ['argentina'] },
  { iso3: 'CHL', wb: 'CHL', iea: 'Chile', display: 'Chile', aliases: ['chile', 'chili'] },
  { iso3: 'COL', wb: 'COL', iea: 'Colombia', display: 'Colombia', aliases: ['colombia', 'kolombiya'] },
  { iso3: 'PER', wb: 'PER', iea: 'Peru', display: 'Peru', aliases: ['peru'] },
  { iso3: 'NZL', wb: 'NZL', iea: 'New Zealand', display: 'New Zealand', aliases: ['new zealand', 'yangi zelandiya'] },
  { iso3: 'TWN', wb: 'TWN', iea: 'Chinese Taipei', display: 'Taiwan', aliases: ['taiwan', 'tayvan'] },
  { iso3: 'HKG', wb: 'HKG', iea: 'Hong Kong', display: 'Hong Kong', aliases: ['hong kong', 'gonkong'] }
];

const TARIFF_TARGETS = [
  { iso3: 'UZB', name: "O'zbekiston" },
  { iso3: 'TKM', name: 'Turkmaniston' },
  { iso3: 'TJK', name: 'Tojikiston' },
  { iso3: 'KGZ', name: "Qirg'iziston" },
  { iso3: 'KAZ', name: "Qozog'iston" },
  { iso3: 'MNG', name: 'Mongoliya' },
  { iso3: 'RUS', name: 'Rossiya' },
  { iso3: 'AZE', name: 'Ozarbayjon' },
  { iso3: 'GEO', name: 'Gruziya' },
  { iso3: 'ARM', name: 'Armaniston' },
  { iso3: 'IRN', name: 'Eron' },
  { iso3: 'AFG', name: "Afg'oniston" },
  { iso3: 'PAK', name: 'Pokiston' }
];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeCountryKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Full world country lookup from comtrade data (200+ countries)
const STATIC_COUNTRY_LOOKUP = {"Afghanistan":{"code":"AF","iso3":"AFG","reporterCode":"004"},"Albania":{"code":"AL","iso3":"ALB","reporterCode":"008"},"Algeria":{"code":"DZ","iso3":"DZA","reporterCode":"012"},"Andorra":{"code":"AD","iso3":"AND","reporterCode":"020"},"Angola":{"code":"AO","iso3":"AGO","reporterCode":"024"},"Antigua and Barbuda":{"code":"AG","iso3":"ATG","reporterCode":"028"},"Argentina":{"code":"AR","iso3":"ARG","reporterCode":"032"},"Armenia":{"code":"AM","iso3":"ARM","reporterCode":"051"},"Australia":{"code":"AU","iso3":"AUS","reporterCode":"036"},"Austria":{"code":"AT","iso3":"AUT","reporterCode":"040"},"Azerbaijan":{"code":"AZ","iso3":"AZE","reporterCode":"031"},"Bahamas":{"code":"BS","iso3":"BHS","reporterCode":"044"},"Bahrain":{"code":"BH","iso3":"BHR","reporterCode":"048"},"Bangladesh":{"code":"BD","iso3":"BGD","reporterCode":"050"},"Barbados":{"code":"BB","iso3":"BRB","reporterCode":"052"},"Belarus":{"code":"BY","iso3":"BLR","reporterCode":"112"},"Belgium":{"code":"BE","iso3":"BEL","reporterCode":"056"},"Belize":{"code":"BZ","iso3":"BLZ","reporterCode":"084"},"Benin":{"code":"BJ","iso3":"BEN","reporterCode":"204"},"Bhutan":{"code":"BT","iso3":"BTN","reporterCode":"064"},"Bolivia":{"code":"BO","iso3":"BOL","reporterCode":"068"},"Bosnia and Herzegovina":{"code":"BA","iso3":"BIH","reporterCode":"070"},"Botswana":{"code":"BW","iso3":"BWA","reporterCode":"072"},"Brazil":{"code":"BR","iso3":"BRA","reporterCode":"076"},"Brunei":{"code":"BN","iso3":"BRN","reporterCode":"096"},"Bulgaria":{"code":"BG","iso3":"BGR","reporterCode":"100"},"Burkina Faso":{"code":"BF","iso3":"BFA","reporterCode":"854"},"Burundi":{"code":"BI","iso3":"BDI","reporterCode":"108"},"Cabo Verde":{"code":"CV","iso3":"CPV","reporterCode":"132"},"Cambodia":{"code":"KH","iso3":"KHM","reporterCode":"116"},"Cameroon":{"code":"CM","iso3":"CMR","reporterCode":"120"},"Canada":{"code":"CA","iso3":"CAN","reporterCode":"124"},"Central African Republic":{"code":"CF","iso3":"CAF","reporterCode":"140"},"Chad":{"code":"TD","iso3":"TCD","reporterCode":"148"},"Chile":{"code":"CL","iso3":"CHL","reporterCode":"152"},"China":{"code":"CN","iso3":"CHN","reporterCode":"156"},"Colombia":{"code":"CO","iso3":"COL","reporterCode":"170"},"Comoros":{"code":"KM","iso3":"COM","reporterCode":"174"},"Congo":{"code":"CG","iso3":"COG","reporterCode":"178"},"Costa Rica":{"code":"CR","iso3":"CRI","reporterCode":"188"},"Croatia":{"code":"HR","iso3":"HRV","reporterCode":"191"},"Cuba":{"code":"CU","iso3":"CUB","reporterCode":"192"},"Cyprus":{"code":"CY","iso3":"CYP","reporterCode":"196"},"Czech Republic":{"code":"CZ","iso3":"CZE","reporterCode":"203"},"DR Congo":{"code":"CD","iso3":"COD","reporterCode":"180"},"Denmark":{"code":"DK","iso3":"DNK","reporterCode":"208"},"Djibouti":{"code":"DJ","iso3":"DJI","reporterCode":"262"},"Dominica":{"code":"DM","iso3":"DMA","reporterCode":"212"},"Dominican Republic":{"code":"DO","iso3":"DOM","reporterCode":"214"},"Ecuador":{"code":"EC","iso3":"ECU","reporterCode":"218"},"Egypt":{"code":"EG","iso3":"EGY","reporterCode":"818"},"El Salvador":{"code":"SV","iso3":"SLV","reporterCode":"222"},"Equatorial Guinea":{"code":"GQ","iso3":"GNQ","reporterCode":"226"},"Eritrea":{"code":"ER","iso3":"ERI","reporterCode":"232"},"Estonia":{"code":"EE","iso3":"EST","reporterCode":"233"},"Eswatini":{"code":"SZ","iso3":"SWZ","reporterCode":"748"},"Ethiopia":{"code":"ET","iso3":"ETH","reporterCode":"231"},"Fiji":{"code":"FJ","iso3":"FJI","reporterCode":"242"},"Finland":{"code":"FI","iso3":"FIN","reporterCode":"246"},"France":{"code":"FR","iso3":"FRA","reporterCode":"250"},"Gabon":{"code":"GA","iso3":"GAB","reporterCode":"266"},"Gambia":{"code":"GM","iso3":"GMB","reporterCode":"270"},"Georgia":{"code":"GE","iso3":"GEO","reporterCode":"268"},"Germany":{"code":"DE","iso3":"DEU","reporterCode":"276"},"Ghana":{"code":"GH","iso3":"GHA","reporterCode":"288"},"Greece":{"code":"GR","iso3":"GRC","reporterCode":"300"},"Grenada":{"code":"GD","iso3":"GRD","reporterCode":"308"},"Guatemala":{"code":"GT","iso3":"GTM","reporterCode":"320"},"Guinea":{"code":"GN","iso3":"GIN","reporterCode":"324"},"Guinea-Bissau":{"code":"GW","iso3":"GNB","reporterCode":"624"},"Guyana":{"code":"GY","iso3":"GUY","reporterCode":"328"},"Haiti":{"code":"HT","iso3":"HTI","reporterCode":"332"},"Honduras":{"code":"HN","iso3":"HND","reporterCode":"340"},"Hungary":{"code":"HU","iso3":"HUN","reporterCode":"348"},"Iceland":{"code":"IS","iso3":"ISL","reporterCode":"352"},"India":{"code":"IN","iso3":"IND","reporterCode":"356"},"Indonesia":{"code":"ID","iso3":"IDN","reporterCode":"360"},"Iran":{"code":"IR","iso3":"IRN","reporterCode":"364"},"Iraq":{"code":"IQ","iso3":"IRQ","reporterCode":"368"},"Ireland":{"code":"IE","iso3":"IRL","reporterCode":"372"},"Israel":{"code":"IL","iso3":"ISR","reporterCode":"376"},"Italy":{"code":"IT","iso3":"ITA","reporterCode":"380"},"Ivory Coast":{"code":"CI","iso3":"CIV","reporterCode":"384"},"Jamaica":{"code":"JM","iso3":"JAM","reporterCode":"388"},"Japan":{"code":"JP","iso3":"JPN","reporterCode":"392"},"Jordan":{"code":"JO","iso3":"JOR","reporterCode":"400"},"Kazakhstan":{"code":"KZ","iso3":"KAZ","reporterCode":"398"},"Kenya":{"code":"KE","iso3":"KEN","reporterCode":"404"},"Kiribati":{"code":"KI","iso3":"KIR","reporterCode":"296"},"Kosovo":{"code":"XK","iso3":"XKX","reporterCode":""},"Kuwait":{"code":"KW","iso3":"KWT","reporterCode":"414"},"Kyrgyzstan":{"code":"KG","iso3":"KGZ","reporterCode":"417"},"Laos":{"code":"LA","iso3":"LAO","reporterCode":"418"},"Latvia":{"code":"LV","iso3":"LVA","reporterCode":"428"},"Lebanon":{"code":"LB","iso3":"LBN","reporterCode":"422"},"Lesotho":{"code":"LS","iso3":"LSO","reporterCode":"426"},"Liberia":{"code":"LR","iso3":"LBR","reporterCode":"430"},"Libya":{"code":"LY","iso3":"LBY","reporterCode":"434"},"Liechtenstein":{"code":"LI","iso3":"LIE","reporterCode":"438"},"Lithuania":{"code":"LT","iso3":"LTU","reporterCode":"440"},"Luxembourg":{"code":"LU","iso3":"LUX","reporterCode":"442"},"Madagascar":{"code":"MG","iso3":"MDG","reporterCode":"450"},"Malawi":{"code":"MW","iso3":"MWI","reporterCode":"454"},"Malaysia":{"code":"MY","iso3":"MYS","reporterCode":"458"},"Maldives":{"code":"MV","iso3":"MDV","reporterCode":"462"},"Mali":{"code":"ML","iso3":"MLI","reporterCode":"466"},"Malta":{"code":"MT","iso3":"MLT","reporterCode":"470"},"Marshall Islands":{"code":"MH","iso3":"MHL","reporterCode":"584"},"Mauritania":{"code":"MR","iso3":"MRT","reporterCode":"478"},"Mauritius":{"code":"MU","iso3":"MUS","reporterCode":"480"},"Mexico":{"code":"MX","iso3":"MEX","reporterCode":"484"},"Micronesia":{"code":"FM","iso3":"FSM","reporterCode":"583"},"Moldova":{"code":"MD","iso3":"MDA","reporterCode":"498"},"Monaco":{"code":"MC","iso3":"MCO","reporterCode":"492"},"Mongolia":{"code":"MN","iso3":"MNG","reporterCode":"496"},"Montenegro":{"code":"ME","iso3":"MNE","reporterCode":"499"},"Morocco":{"code":"MA","iso3":"MAR","reporterCode":"504"},"Mozambique":{"code":"MZ","iso3":"MOZ","reporterCode":"508"},"Myanmar":{"code":"MM","iso3":"MMR","reporterCode":"104"},"Namibia":{"code":"NA","iso3":"NAM","reporterCode":"516"},"Nauru":{"code":"NR","iso3":"NRU","reporterCode":"520"},"Nepal":{"code":"NP","iso3":"NPL","reporterCode":"524"},"Netherlands":{"code":"NL","iso3":"NLD","reporterCode":"528"},"New Zealand":{"code":"NZ","iso3":"NZL","reporterCode":"554"},"Nicaragua":{"code":"NI","iso3":"NIC","reporterCode":"558"},"Niger":{"code":"NE","iso3":"NER","reporterCode":"562"},"Nigeria":{"code":"NG","iso3":"NGA","reporterCode":"566"},"North Korea":{"code":"KP","iso3":"PRK","reporterCode":"408"},"North Macedonia":{"code":"MK","iso3":"MKD","reporterCode":"807"},"Norway":{"code":"NO","iso3":"NOR","reporterCode":"578"},"Oman":{"code":"OM","iso3":"OMN","reporterCode":"512"},"Pakistan":{"code":"PK","iso3":"PAK","reporterCode":"586"},"Palau":{"code":"PW","iso3":"PLW","reporterCode":"585"},"Palestine":{"code":"PS","iso3":"PSE","reporterCode":"275"},"Panama":{"code":"PA","iso3":"PAN","reporterCode":"591"},"Papua New Guinea":{"code":"PG","iso3":"PNG","reporterCode":"598"},"Paraguay":{"code":"PY","iso3":"PRY","reporterCode":"600"},"Peru":{"code":"PE","iso3":"PER","reporterCode":"604"},"Philippines":{"code":"PH","iso3":"PHL","reporterCode":"608"},"Poland":{"code":"PL","iso3":"POL","reporterCode":"616"},"Portugal":{"code":"PT","iso3":"PRT","reporterCode":"620"},"Qatar":{"code":"QA","iso3":"QAT","reporterCode":"634"},"Romania":{"code":"RO","iso3":"ROU","reporterCode":"642"},"Russia":{"code":"RU","iso3":"RUS","reporterCode":"643"},"Rwanda":{"code":"RW","iso3":"RWA","reporterCode":"646"},"Saint Kitts and Nevis":{"code":"KN","iso3":"KNA","reporterCode":"659"},"Saint Lucia":{"code":"LC","iso3":"LCA","reporterCode":"662"},"Saint Vincent and the Grenadines":{"code":"VC","iso3":"VCT","reporterCode":"670"},"Samoa":{"code":"WS","iso3":"WSM","reporterCode":"882"},"San Marino":{"code":"SM","iso3":"SMR","reporterCode":"674"},"Sao Tome and Principe":{"code":"ST","iso3":"STP","reporterCode":"678"},"Saudi Arabia":{"code":"SA","iso3":"SAU","reporterCode":"682"},"Senegal":{"code":"SN","iso3":"SEN","reporterCode":"686"},"Serbia":{"code":"RS","iso3":"SRB","reporterCode":"688"},"Seychelles":{"code":"SC","iso3":"SYC","reporterCode":"690"},"Sierra Leone":{"code":"SL","iso3":"SLE","reporterCode":"694"},"Singapore":{"code":"SG","iso3":"SGP","reporterCode":"702"},"Slovakia":{"code":"SK","iso3":"SVK","reporterCode":"703"},"Slovenia":{"code":"SI","iso3":"SVN","reporterCode":"705"},"Solomon Islands":{"code":"SB","iso3":"SLB","reporterCode":"090"},"Somalia":{"code":"SO","iso3":"SOM","reporterCode":"706"},"South Africa":{"code":"ZA","iso3":"ZAF","reporterCode":"710"},"South Korea":{"code":"KR","iso3":"KOR","reporterCode":"410"},"South Sudan":{"code":"SS","iso3":"SSD","reporterCode":"728"},"Spain":{"code":"ES","iso3":"ESP","reporterCode":"724"},"Sri Lanka":{"code":"LK","iso3":"LKA","reporterCode":"144"},"Sudan":{"code":"SD","iso3":"SDN","reporterCode":"729"},"Suriname":{"code":"SR","iso3":"SUR","reporterCode":"740"},"Sweden":{"code":"SE","iso3":"SWE","reporterCode":"752"},"Switzerland":{"code":"CH","iso3":"CHE","reporterCode":"756"},"Syria":{"code":"SY","iso3":"SYR","reporterCode":"760"},"Tajikistan":{"code":"TJ","iso3":"TJK","reporterCode":"762"},"Tanzania":{"code":"TZ","iso3":"TZA","reporterCode":"834"},"Thailand":{"code":"TH","iso3":"THA","reporterCode":"764"},"Timor-Leste":{"code":"TL","iso3":"TLS","reporterCode":"626"},"Togo":{"code":"TG","iso3":"TGO","reporterCode":"768"},"Tonga":{"code":"TO","iso3":"TON","reporterCode":"776"},"Trinidad and Tobago":{"code":"TT","iso3":"TTO","reporterCode":"780"},"Tunisia":{"code":"TN","iso3":"TUN","reporterCode":"788"},"Turkey":{"code":"TR","iso3":"TUR","reporterCode":"792"},"Turkmenistan":{"code":"TM","iso3":"TKM","reporterCode":"795"},"Tuvalu":{"code":"TV","iso3":"TUV","reporterCode":"798"},"Uganda":{"code":"UG","iso3":"UGA","reporterCode":"800"},"Ukraine":{"code":"UA","iso3":"UKR","reporterCode":"804"},"United Arab Emirates":{"code":"AE","iso3":"ARE","reporterCode":"784"},"United Kingdom":{"code":"GB","iso3":"GBR","reporterCode":"826"},"United States":{"code":"US","iso3":"USA","reporterCode":"840"},"Uruguay":{"code":"UY","iso3":"URY","reporterCode":"858"},"Uzbekistan":{"code":"UZ","iso3":"UZB","reporterCode":"860"},"Vanuatu":{"code":"VU","iso3":"VUT","reporterCode":"548"},"Vatican City":{"code":"VA","iso3":"VAT","reporterCode":"336"},"Venezuela":{"code":"VE","iso3":"VEN","reporterCode":"862"},"Vietnam":{"code":"VN","iso3":"VNM","reporterCode":"704"},"Yemen":{"code":"YE","iso3":"YEM","reporterCode":"887"},"Zambia":{"code":"ZM","iso3":"ZMB","reporterCode":"894"},"Zimbabwe":{"code":"ZW","iso3":"ZWE","reporterCode":"716"}};


function resolveCountry(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const key = normalizeCountryKey(raw);
  if (!key) return null;

  // 1. Try COUNTRY_DEFS first (has aliases like o'zbek names)
  for (const def of COUNTRY_DEFS) {
    if (normalizeCountryKey(def.iso3) === key || normalizeCountryKey(def.display) === key) return def;
    if ((def.aliases || []).some((alias) => normalizeCountryKey(alias) === key)) return def;
  }

  // 2. Try STATIC_COUNTRY_LOOKUP (200+ world countries by english name, iso2, iso3)
  for (const [name, entry] of Object.entries(STATIC_COUNTRY_LOOKUP)) {
    const nKey = normalizeCountryKey(name);
    const iso2Key = normalizeCountryKey(entry.code || '');
    const iso3Key = normalizeCountryKey(entry.iso3 || '');
    if (nKey === key || iso2Key === key || iso3Key === key) {
      return {
        iso3: entry.iso3,
        wb: entry.iso3,
        iea: name,
        display: name,
        aliases: [nKey]
      };
    }
  }

  // 3. Partial match in COUNTRY_DEFS
  const partial = COUNTRY_DEFS.find((def) =>
    (def.aliases || []).some((alias) =>
      normalizeCountryKey(alias).includes(key) || key.includes(normalizeCountryKey(alias))
    )
  );
  if (partial) return partial;

  // 4. Partial match in STATIC_COUNTRY_LOOKUP
  for (const [name, entry] of Object.entries(STATIC_COUNTRY_LOOKUP)) {
    const nKey = normalizeCountryKey(name);
    if (nKey.includes(key) || key.includes(nKey)) {
      return {
        iso3: entry.iso3,
        wb: entry.iso3,
        iea: name,
        display: name,
        aliases: [nKey]
      };
    }
  }

  return null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.some((v) => String(v || '').trim() !== '')).map((r) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = r[idx];
    });
    return obj;
  });
}

async function fetchText(url) {
  const resp = await fetch(url, { headers: { Accept: 'text/csv,text/plain,application/json' } });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.text();
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  return resp.json();
}

function latestWorldBankValue(rows) {
  const data = Array.isArray(rows) && Array.isArray(rows[1]) ? rows[1] : [];
  const sorted = data
    .filter((row) => row && row.value !== null && row.value !== undefined)
    .sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
  if (!sorted.length) return null;
  return {
    value: Number(sorted[0].value),
    year: String(sorted[0].date || ''),
    unit: sorted[0].unit || '',
    source: 'World Bank Open Data API'
  };
}

async function fetchWorldBankIndicator(iso3, indicator) {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso3)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=20`;
  const json = await fetchJson(url);
  return latestWorldBankValue(json);
}

function latestIloUsdValue(rows) {
  const preferredLabels = ['Currency: U.S. dollars', 'Currency: 2021 PPP $', 'Currency: Local currency'];
  for (const label of preferredLabels) {
    const matches = rows
      .filter((row) => String(row['classif1.label'] || '').trim() === label)
      .filter((row) => row.obs_value !== undefined && row.obs_value !== null && String(row.obs_value).trim() !== '')
      .sort((a, b) => Number(b.time || 0) - Number(a.time || 0));
    if (matches.length) {
      const row = matches[0];
      return {
        value: Number(row.obs_value),
        year: String(row.time || ''),
        currencyLabel: label,
        sourceLabel: row['source.label'] || '',
        noteIndicator: row['note_indicator.label'] || '',
        noteSource: row['note_source.label'] || ''
      };
    }
  }
  return null;
}

async function fetchIlostatMonthlyWage(iso3) {
  const url = `https://rplumber.ilo.org/data/indicator?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${encodeURIComponent(iso3)}&sex=SEX_T&latestyear=TRUE&format=.csv&type=label&mode=B`;
  const csv = await fetchText(url);
  const rows = parseCsv(csv);
  const value = latestIloUsdValue(rows);
  if (!value) return null;
  const unit = value.currencyLabel === 'Currency: U.S. dollars'
    ? 'USD/month'
    : value.currencyLabel === 'Currency: 2021 PPP $'
      ? 'PPP$/month'
      : 'Local currency/month';
  return {
    ...value,
    source: 'ILOSTAT API',
    indicator: 'EAR_EMTA_SEX_CUR_NB_A',
    unit
  };
}

function latestIeaProductValue(rows, productCode) {
  const matches = (Array.isArray(rows) ? rows : [])
    .filter((row) => String(row.CODE_PRODUCT || '').toUpperCase() === String(productCode || '').toUpperCase())
    .filter((row) => row.Value !== null && row.Value !== undefined)
    .map((row) => ({ ...row, Value: Number(row.Value) }))
    .filter((row) => !Number.isNaN(row.Value))
    .sort((a, b) => Number(b.CODE_YEAR || 0) - Number(a.CODE_YEAR || 0));
  if (!matches.length) return null;
  const row = matches[0];
  return {
    value: row.Value,
    year: String(row.CODE_YEAR || ''),
    unit: row.Unit || '',
    product: row.Product || '',
    source: 'IEA Prices API',
    indicator: 'PRICE'
  };
}

// Static industrial electricity prices (USD/MWh) — fallback when IEA API has no data
// Sources: IEA, GlobalPetrolPrices, World Bank estimates (2022-2024)
const STATIC_ELECTRICITY_PRICES = {
  // Asia
  BGD: 85, IND: 95, PAK: 110, LKA: 120, NPL: 80, MMR: 70, KHM: 160, VNM: 78, THA: 105,
  MYS: 60, IDN: 90, PHL: 160, SGP: 170, KOR: 100, JPN: 165, TWN: 100, HKG: 160,
  CHN: 85, MNG: 50,
  // Central Asia (IEA usually covers these)
  KAZ: 45, KGZ: 30, TJK: 25, TKM: 20, AZE: 55, ARM: 75, GEO: 80,
  // Middle East
  IRN: 10, IRQ: 30, SAU: 48, ARE: 65, QAT: 35, KWT: 30, OMN: 55, JOR: 130, LBN: 140,
  ISR: 110,
  // Europe (IEA usually covers)
  UKR: 80, BLR: 55, MDA: 110, SRB: 75, BGR: 105, ROU: 120, HRV: 130, BIH: 85,
  // Africa
  EGY: 50, MAR: 110, DZA: 40, TUN: 95, NGA: 100, ZAF: 95, ETH: 45, KEN: 160,
  GHA: 130, TZA: 140, UGA: 140, SEN: 175, CIV: 140, CMR: 120, AGO: 80, MOZ: 90,
  ZWE: 100, ZMB: 90,
  // Americas
  BRA: 80, ARG: 50, CHL: 110, COL: 100, PER: 75, MEX: 90, VEN: 20,
  // Oceania
  AUS: 110, NZL: 100,
};

function getStaticElectricityPrice(iso3) {
  const code = String(iso3 || '').toUpperCase();
  const price = STATIC_ELECTRICITY_PRICES[code];
  if (!price) return null;
  return {
    value: price,
    year: '2023',
    unit: 'USD/MWh',
    product: 'Electricity',
    source: 'GlobalPetrolPrices / IEA estimate',
    indicator: 'Industrial electricity price (estimate)'
  };
}

async function fetchIeaIndustrialBundle(countryName) {
  const url = `https://api.iea.org/prices?Country=${encodeURIComponent(countryName)}&CODE_INDICATOR=PRICE&CODE_SECTOR=IND&CODE_UNIT=USDCUR`;
  const rows = await fetchJson(url);
  return {
    electricity: latestIeaProductValue(rows, 'ELECTR'),
    naturalGas: latestIeaProductValue(rows, 'NATGAS')
  };
}

async function fetchUsEiaIndustrialElectricity() {
  const url = 'https://api.eia.gov/v2/electricity/retail-sales/data/?api_key=DEMO_KEY&frequency=annual&data[0]=price&facets[sectorid][]=IND&facets[stateid][]=US&sort[0][column]=period&sort[0][direction]=desc&length=1';
  const json = await fetchJson(url);
  const row = json?.response?.data?.[0];
  if (!row || row.price === undefined || row.price === null) return null;
  return {
    value: Number(row.price) * 10,
    year: String(row.period || ''),
    unit: 'USD/MWh',
    product: 'Electricity',
    source: 'U.S. EIA API',
    indicator: 'electricity/retail-sales industrial price'
  };
}

function ratio(base, compare) {
  const a = Number(base);
  const b = Number(compare);
  if (!(a > 0) || !(b > 0)) return null;
  return a / b;
}

function parseTariffRange(productCode) {
  const code = String(productCode || '');
  const rangeMatch = code.match(/^(\d{2})-(\d{2})_/);
  if (rangeMatch) return { start: Number(rangeMatch[1]), end: Number(rangeMatch[2]) };
  const singleMatch = code.match(/^(\d{2})_/);
  if (singleMatch) return { start: Number(singleMatch[1]), end: Number(singleMatch[1]) };
  return null;
}

async function fetchTariffRows(url, fallbackPartner, fallbackIndicator) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`WITS Tariff: ${r.status}`);
  const json = await r.json();
  const series = json?.dataSets?.[0]?.series || {};
  const dims = json?.structure?.dimensions?.series || [];
  const productDimIndex = dims.findIndex((d) => d.id === 'PRODUCTCODE');
  const partnerDimIndex = dims.findIndex((d) => d.id === 'PARTNER');
  const indicatorDimIndex = dims.findIndex((d) => d.id === 'INDICATOR');
  const products = productDimIndex >= 0 ? (dims[productDimIndex]?.values || []) : [];
  const partners = partnerDimIndex >= 0 ? (dims[partnerDimIndex]?.values || []) : [];
  const indicators = indicatorDimIndex >= 0 ? (dims[indicatorDimIndex]?.values || []) : [];
  const rows = [];

  Object.keys(series).forEach((key) => {
    const indexes = key.split(':').map((n) => Number(n));
    const product = products[indexes[productDimIndex]] || {};
    const partner = partners[indexes[partnerDimIndex]] || {};
    const indicator = indicators[indexes[indicatorDimIndex]] || {};
    const observations = series[key]?.observations || {};
    const obsKey = Object.keys(observations)[0];
    const rawValue = obsKey !== undefined ? observations[obsKey] : null;
    const value = Array.isArray(rawValue) ? Number(rawValue[0]) : Number(rawValue);
    if (!product.id || product.id === 'Total' || Number.isNaN(value)) return;
    rows.push({
      productCode: product.id,
      productName: product.name || product.id,
      partner: partner.id || fallbackPartner || '',
      indicator: indicator.id || fallbackIndicator || '',
      indicatorName: indicator.name || fallbackIndicator || '',
      rate: value
    });
  });

  return rows;
}

async function fetchTariffSet(reporterIso, partnerIso, year) {
  const appliedUrl = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/${reporterIso}/year/${year}/partner/${partnerIso}/product/all/indicator/AHS-WGHTD-AVRG?format=JSON`;
  const mfnUrl = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-tariff/reporter/${reporterIso}/year/${year}/partner/WLD/product/all/indicator/MFN-WGHTD-AVRG?format=JSON`;

  const [appliedRows, mfnRows] = await Promise.all([
    fetchTariffRows(appliedUrl, partnerIso, 'AHS-WGHTD-AVRG').catch(() => []),
    fetchTariffRows(mfnUrl, 'WLD', 'MFN-WGHTD-AVRG').catch(() => [])
  ]);

  const grouped = {};
  appliedRows.forEach((row) => {
    if (!grouped[row.productCode]) grouped[row.productCode] = { productCode: row.productCode, productName: row.productName };
    grouped[row.productCode].appliedRate = row.rate;
    grouped[row.productCode].appliedIndicator = row.indicator;
  });
  mfnRows.forEach((row) => {
    if (!grouped[row.productCode]) grouped[row.productCode] = { productCode: row.productCode, productName: row.productName };
    grouped[row.productCode].mfnRate = row.rate;
    grouped[row.productCode].mfnIndicator = row.indicator;
  });

  return Object.values(grouped);
}

function matchTariffInfo(rows, hsCode) {
  const hs2 = parseInt(String(hsCode || '').replace(/\D/g, '').slice(0, 2), 10);
  if (!hs2 || !Array.isArray(rows) || !rows.length) return null;
  const match = rows.find((row) => {
    const range = parseTariffRange(row.productCode);
    return range && hs2 >= range.start && hs2 <= range.end;
  });
  if (!match) return null;
  const appliedRate = match.appliedRate != null && !Number.isNaN(Number(match.appliedRate)) ? Number(match.appliedRate) : null;
  const mfnRate = match.mfnRate != null && !Number.isNaN(Number(match.mfnRate)) ? Number(match.mfnRate) : null;
  const rate = appliedRate != null ? appliedRate : mfnRate;
  if (rate == null) return null;
  return {
    rate,
    type: appliedRate != null ? 'AHS' : 'MFN',
    productCode: match.productCode,
    productName: match.productName || '',
    appliedRate,
    mfnRate
  };
}

async function fetchTariffPair(reporterIso, partnerIso, hsCode, requestedYear) {
  const candidateYears = [requestedYear, requestedYear - 1, requestedYear - 2, requestedYear - 3]
    .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx);
  for (const year of candidateYears) {
    const rows = await fetchTariffSet(reporterIso, partnerIso, year);
    const info = matchTariffInfo(rows, hsCode);
    if (info) return { ...info, year: String(year) };
  }
  return null;
}

function avg(list) {
  const valid = list.filter((v) => Number.isFinite(Number(v)));
  if (!valid.length) return null;
  return valid.reduce((sum, v) => sum + Number(v), 0) / valid.length;
}

async function handleTariffRequest(req, res) {
  const sourceIso = String(req.query.source || '').trim().toUpperCase();
  const hsCode = String(req.query.hs || '').replace(/\D/g, '');
  const productName = String(req.query.productName || '').trim();
  const requestedYear = Number(req.query.year) || 2024;

  if (!sourceIso) return res.status(400).json({ error: 'source param kerak' });
  if (!hsCode || hsCode.length < 2) return res.status(400).json({ error: 'hs param kerak' });

  const routes = await Promise.all(TARIFF_TARGETS.map(async (target) => {
    const [sourceTariff, uzTariff] = await Promise.all([
      fetchTariffPair(target.iso3, sourceIso, hsCode, requestedYear).catch(() => null),
      target.iso3 === 'UZB'
        ? Promise.resolve(null)
        : fetchTariffPair(target.iso3, 'UZB', hsCode, requestedYear).catch(() => null)
    ]);
    const diff = sourceTariff && uzTariff ? Number(sourceTariff.rate) - Number(uzTariff.rate) : null;
    const diffPct = sourceTariff && uzTariff && Number(sourceTariff.rate) > 0
      ? Math.round((diff / Number(sourceTariff.rate)) * 100)
      : null;
    return {
      targetIso3: target.iso3,
      targetName: target.name,
      sourceRate: sourceTariff ? Number(sourceTariff.rate) : null,
      sourceType: sourceTariff ? sourceTariff.type : null,
      sourceYear: sourceTariff ? sourceTariff.year : null,
      uzRate: uzTariff ? Number(uzTariff.rate) : null,
      uzType: uzTariff ? uzTariff.type : null,
      uzYear: uzTariff ? uzTariff.year : null,
      diff,
      diffPct,
      matchedProductCode: (sourceTariff && sourceTariff.productCode) || (uzTariff && uzTariff.productCode) || '',
      matchedProductName: (sourceTariff && sourceTariff.productName) || (uzTariff && uzTariff.productName) || ''
    };
  }));

  const avgSourceRate = avg(routes.map((row) => row.sourceRate));
  const avgUzRate = avg(routes.map((row) => row.uzRate));
  const comparableDiffs = routes.filter((row) => Number.isFinite(row.diff));
  const avgDiff = avg(comparableDiffs.map((row) => row.diff));
  const avgDiffPct = avgSourceRate && Number.isFinite(avgDiff) ? Math.round((avgDiff / avgSourceRate) * 100) : null;
  const bestAdvantage = comparableDiffs
    .filter((row) => row.diff > 0)
    .sort((a, b) => b.diff - a.diff)[0] || null;

  return res.json({
    status: 'ok',
    sourceIso3: sourceIso,
    productName,
    hsCode,
    requestedYear: String(requestedYear),
    source: 'WITS - UNCTAD TRAINS',
    routes,
    avgSourceRate,
    avgUzRate,
    avgDiff,
    avgDiffPct,
    bestAdvantage
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (String(req.query.mode || '').trim().toLowerCase() === 'tariff') {
      return await handleTariffRequest(req, res);
    }
    const input = String(req.query.country || '').trim();
    if (!input) return res.status(400).json({ error: 'country param kerak' });

    const country = resolveCountry(input);
    if (!country) {
      return res.status(400).json({ error: `Davlat aniqlanmadi: ${input}` });
    }

    const uzbekistan = COUNTRY_DEFS.find((row) => row.iso3 === 'UZB');

    const [
      countryGdp,
      countryIndustryShare,
      countryTaxLabor,
      countryTaxProfit,
      countryTaxOther,
      countryWage,
      countryIea,
      uzGdp,
      uzIndustryShare,
      uzTaxLabor,
      uzTaxProfit,
      uzTaxOther,
      uzWage,
      uzIea
    ] = await Promise.all([
      fetchWorldBankIndicator(country.wb, 'NY.GDP.PCAP.CD').catch(() => null),
      fetchWorldBankIndicator(country.wb, 'NV.IND.TOTL.ZS').catch(() => null),
      fetchWorldBankIndicator(country.wb, 'PAY.TAX.LABR.TAX.CONTR.ZS').catch(() => null),
      fetchWorldBankIndicator(country.wb, 'PAY.TAX.PRFT.CP.ZS').catch(() => null),
      fetchWorldBankIndicator(country.wb, 'OTHR.TAX.PAID.ZS').catch(() => null),
      fetchIlostatMonthlyWage(country.iso3).catch(() => null),
      fetchIeaIndustrialBundle(country.iea).catch(() => ({ electricity: null, naturalGas: null })),
      fetchWorldBankIndicator(uzbekistan.wb, 'NY.GDP.PCAP.CD').catch(() => null),
      fetchWorldBankIndicator(uzbekistan.wb, 'NV.IND.TOTL.ZS').catch(() => null),
      fetchWorldBankIndicator(uzbekistan.wb, 'PAY.TAX.LABR.TAX.CONTR.ZS').catch(() => null),
      fetchWorldBankIndicator(uzbekistan.wb, 'PAY.TAX.PRFT.CP.ZS').catch(() => null),
      fetchWorldBankIndicator(uzbekistan.wb, 'OTHR.TAX.PAID.ZS').catch(() => null),
      fetchIlostatMonthlyWage(uzbekistan.iso3).catch(() => null),
      fetchIeaIndustrialBundle(uzbekistan.iea).catch(() => ({ electricity: null, naturalGas: null }))
    ]);

    let countryElectricity = countryIea.electricity;
    if (!countryElectricity && country.iso3 === 'USA') {
      countryElectricity = await fetchUsEiaIndustrialElectricity().catch(() => null);
    }
    // Fallback to static prices if IEA has no data for this country
    if (!countryElectricity) {
      countryElectricity = getStaticElectricityPrice(country.iso3);
    }
    let uzElectricity = uzIea.electricity;
    if (!uzElectricity) {
      uzElectricity = getStaticElectricityPrice('UZB');
    }

    const countryTaxPieces = [countryTaxLabor, countryTaxProfit, countryTaxOther].filter(Boolean);
    const uzTaxPieces = [uzTaxLabor, uzTaxProfit, uzTaxOther].filter(Boolean);
    const countryTaxTotal = countryTaxPieces.length
      ? countryTaxPieces.reduce((sum, row) => sum + Number(row.value || 0), 0)
      : null;
    const uzTaxTotal = uzTaxPieces.length
      ? uzTaxPieces.reduce((sum, row) => sum + Number(row.value || 0), 0)
      : null;
    const countryTaxYear = countryTaxPieces.length ? countryTaxPieces.map((row) => row.year).filter(Boolean).sort().slice(-1)[0] : null;
    const uzTaxYear = uzTaxPieces.length ? uzTaxPieces.map((row) => row.year).filter(Boolean).sort().slice(-1)[0] : null;

    const payload = {
      status: 'ok',
      country: {
        input,
        display: country.display,
        iso3: country.iso3
      },
      uzbekistan: {
        display: uzbekistan.display,
        iso3: uzbekistan.iso3
      },
      metrics: {
        gdpPerCapita: {
          country: countryGdp ? countryGdp.value : null,
          countryYear: countryGdp ? countryGdp.year : null,
          uzbekistan: uzGdp ? uzGdp.value : null,
          uzbekistanYear: uzGdp ? uzGdp.year : null,
          unit: 'USD/person',
          source: countryGdp?.source || uzGdp?.source || 'World Bank Open Data API',
          indicator: 'NY.GDP.PCAP.CD'
        },
        industryShare: {
          country: countryIndustryShare ? countryIndustryShare.value : null,
          countryYear: countryIndustryShare ? countryIndustryShare.year : null,
          uzbekistan: uzIndustryShare ? uzIndustryShare.value : null,
          uzbekistanYear: uzIndustryShare ? uzIndustryShare.year : null,
          unit: '% of GDP',
          source: countryIndustryShare?.source || uzIndustryShare?.source || 'World Bank Open Data API',
          indicator: 'NV.IND.TOTL.ZS'
        },
        totalTaxRate: {
          country: countryTaxTotal,
          countryYear: countryTaxYear,
          uzbekistan: uzTaxTotal,
          uzbekistanYear: uzTaxYear,
          unit: '% of profit',
          source: 'World Bank Open Data API',
          indicator: 'PAY.TAX.LABR.TAX.CONTR.ZS + PAY.TAX.PRFT.CP.ZS + OTHR.TAX.PAID.ZS',
          components: {
            country: {
              laborTax: countryTaxLabor ? countryTaxLabor.value : null,
              profitTax: countryTaxProfit ? countryTaxProfit.value : null,
              otherTaxes: countryTaxOther ? countryTaxOther.value : null
            },
            uzbekistan: {
              laborTax: uzTaxLabor ? uzTaxLabor.value : null,
              profitTax: uzTaxProfit ? uzTaxProfit.value : null,
              otherTaxes: uzTaxOther ? uzTaxOther.value : null
            }
          }
        },
        monthlyWage: {
          country: countryWage ? countryWage.value : null,
          countryYear: countryWage ? countryWage.year : null,
          uzbekistan: uzWage ? uzWage.value : null,
          uzbekistanYear: uzWage ? uzWage.year : null,
          unit: countryWage?.unit || uzWage?.unit || 'USD/month',
          source: countryWage?.source || uzWage?.source || 'ILOSTAT API',
          indicator: 'EAR_EMTA_SEX_CUR_NB_A',
          countryCurrencyBasis: countryWage ? countryWage.currencyLabel : null,
          uzbekistanCurrencyBasis: uzWage ? uzWage.currencyLabel : null
        },
        electricityPrice: {
          country: countryElectricity ? countryElectricity.value : null,
          countryYear: countryElectricity ? countryElectricity.year : null,
          uzbekistan: uzElectricity ? uzElectricity.value : null,
          uzbekistanYear: uzElectricity ? uzElectricity.year : null,
          unit: 'USD/MWh',
          source: countryElectricity?.source || uzElectricity?.source || 'Official energy price API',
          indicator: 'PRICE/ELECTR/IND/USDCUR'
        },
        naturalGasPrice: {
          country: countryIea.naturalGas ? countryIea.naturalGas.value : null,
          countryYear: countryIea.naturalGas ? countryIea.naturalGas.year : null,
          uzbekistan: uzIea.naturalGas ? uzIea.naturalGas.value : null,
          uzbekistanYear: uzIea.naturalGas ? uzIea.naturalGas.year : null,
          unit: 'USD/MWh',
          source: countryIea.naturalGas?.source || uzIea.naturalGas?.source || 'IEA Prices API',
          indicator: 'PRICE/NATGAS/IND/USDCUR'
        }
      }
    };

    payload.comparisons = {
      gdpRatio: ratio(payload.metrics.gdpPerCapita.country, payload.metrics.gdpPerCapita.uzbekistan),
      wageRatio: ratio(payload.metrics.monthlyWage.country, payload.metrics.monthlyWage.uzbekistan),
      electricityRatio: ratio(payload.metrics.electricityPrice.country, payload.metrics.electricityPrice.uzbekistan),
      naturalGasRatio: ratio(payload.metrics.naturalGasPrice.country, payload.metrics.naturalGasPrice.uzbekistan),
      industryShareRatio: ratio(payload.metrics.industryShare.country, payload.metrics.industryShare.uzbekistan),
      totalTaxRateRatio: ratio(payload.metrics.totalTaxRate.country, payload.metrics.totalTaxRate.uzbekistan)
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server xatosi' });
  }
}
