export const CATEGORIES = {
  Newspaper: 14,
  Books: 12,
  Paper: 10,
  Cardboard: 9,
  'Plastic bottles': 18,
  'PET bottles': 22,
  'HDPE containers': 16,
  'Plastic film': 6,
  'Tetra packs': 4,
  'Mixed plastic': 8,
  'Glass bottles': 3,
  'Aluminum cans': 110,
  'Iron and steel': 32,
  Copper: 620,
  Brass: 410,
  'Cables & wires': 95,
  'E-Waste': 60,
  'Mobile phones': 120,
  'Small electronics': 45,
  Batteries: 25,
  Appliances: 25,
  Textiles: 15,
  'Used cooking oil': 25,
  Wood: 4,
  Other: 5,
}

const LABEL_RULES = [
  { pattern: /newspaper|newsprint/, category: 'Newspaper' },
  { pattern: /book|notebook|paperback|comic/, category: 'Books' },
  { pattern: /tetra pack|juice carton|milk carton/, category: 'Tetra packs' },
  { pattern: /cardboard|carton|box|envelope/, category: 'Cardboard' },
  { pattern: /wine glass|beer glass|glass bottle|jar|goblet/, category: 'Glass bottles' },
  { pattern: /pet bottle|plastic bottle|water jug|pop bottle/, category: 'PET bottles' },
  { pattern: /hdpe|detergent bottle|shampoo bottle|plastic container/, category: 'HDPE containers' },
  { pattern: /plastic bag|plastic wrap|plastic film/, category: 'Plastic film' },
  { pattern: /plastic/, category: 'Mixed plastic' },
  { pattern: /can opener|tin can|pop can|soda can|beer can|aluminum/, category: 'Aluminum cans' },
  { pattern: /copper/, category: 'Copper' },
  { pattern: /brass/, category: 'Brass' },
  { pattern: /cable|wire/, category: 'Cables & wires' },
  { pattern: /smartphone|mobile phone|cellular telephone/, category: 'Mobile phones' },
  { pattern: /calculator|headphone|earphone|game controller|router/, category: 'Small electronics' },
  { pattern: /iron|steel|chain|wrench|hammer|nail|screw|metal/, category: 'Iron and steel' },
  { pattern: /battery|power bank/, category: 'Batteries' },
  { pattern: /laptop|computer|keyboard|mouse|monitor|screen|telephone|cellular|remote control|printer|camera|ipod|radio|speaker|charger|tablet|television|tv/, category: 'E-Waste' },
  { pattern: /microwave|washing machine|refrigerator|dishwasher|toaster|stove|vacuum|blender|coffeemaker|appliance/, category: 'Appliances' },
  { pattern: /shirt|jersey|jean|denim|sock|sweater|coat|dress|shoe|sandal|fabric|towel|textile/, category: 'Textiles' },
  { pattern: /wood|wooden|timber|lumber/, category: 'Wood' },
  { pattern: /paper|book jacket|tissue|toilet paper/, category: 'Paper' },
]

export const PRODUCT_PROFILES = [
  {
    id: 'split-ac',
    keywords: ['split ac', 'air conditioner', 'ac unit', 'window ac', 'compressor', 'hvac'],
    productName: 'Split Air Conditioner (1.5 Ton)',
    productType: 'Cooling Appliance · High Copper Yield',
    primaryCategory: 'Copper',
    safetyTip: 'Ensure refrigerant gas is recovered or valve sealed before uninstall.',
    prepTip: 'Keep indoor copper coil and outdoor compressor tubing together for max payout.',
    components: [
      { category: 'Copper', weightKg: 3.5, sharePct: 18 },
      { category: 'Iron and steel', weightKg: 14, sharePct: 68 },
      { category: 'Mixed plastic', weightKg: 2.5, sharePct: 14 },
    ],
  },
  {
    id: 'ceiling-fan',
    keywords: ['ceiling fan', 'table fan', 'exhaust fan', 'fan motor', 'pedestal fan'],
    productName: 'Ceiling / Pedestal Fan Motor',
    productType: 'Motor Appliance · Pure Copper Winding',
    primaryCategory: 'Copper',
    safetyTip: 'Trim power lead wire flush before packing.',
    prepTip: 'Copper-wound motors fetch significantly higher returns than aluminum windings.',
    components: [
      { category: 'Copper', weightKg: 0.6, sharePct: 15 },
      { category: 'Aluminum cans', weightKg: 1.4, sharePct: 35 },
      { category: 'Iron and steel', weightKg: 2, sharePct: 50 },
    ],
  },
  {
    id: 'laptop',
    keywords: ['laptop', 'macbook', 'notebook pc', 'thinkpad', 'chromebook', 'desktop pc', 'cpu'],
    productName: 'Laptop / Desktop System',
    productType: 'Computing E-Waste · Gold/Copper PCB',
    primaryCategory: 'E-Waste',
    safetyTip: 'Back up data and remove SSD/hard drive or perform full factory reset.',
    prepTip: 'Include power brick and cables cleanly alongside the laptop.',
    components: [
      { category: 'E-Waste', weightKg: 2.2, sharePct: 78 },
      { category: 'Batteries', weightKg: 0.4, sharePct: 14 },
      { category: 'Cables & wires', weightKg: 0.3, sharePct: 8 },
    ],
  },
  {
    id: 'smartphone',
    keywords: ['phone', 'iphone', 'smartphone', 'android', 'mobile', 'tablet', 'ipad'],
    productName: 'Smartphone / Tablet Device',
    productType: 'Portable E-Waste · High Recovery Value',
    primaryCategory: 'Mobile phones',
    safetyTip: 'Sign out of iCloud / Google Find My Device and remove SIM & SD cards.',
    prepTip: 'Broken screens are accepted at full rate; keep swollen batteries separate.',
    components: [
      { category: 'Mobile phones', weightKg: 0.3, sharePct: 85 },
      { category: 'Cables & wires', weightKg: 0.2, sharePct: 15 },
    ],
  },
  {
    id: 'washing-machine',
    keywords: ['washing machine', 'washer', 'dryer', 'front load', 'top load'],
    productName: 'Automatic Washing Machine',
    productType: 'Heavy Domestic Appliance · Steel Drum & Motor',
    primaryCategory: 'Appliances',
    safetyTip: 'Drain inlet hose completely before loading.',
    prepTip: 'Select doorstep pickup for appliances over 15 kg.',
    components: [
      { category: 'Iron and steel', weightKg: 18, sharePct: 55 },
      { category: 'Copper', weightKg: 0.9, sharePct: 5 },
      { category: 'Mixed plastic', weightKg: 10, sharePct: 40 },
    ],
  },
  {
    id: 'fridge',
    keywords: ['fridge', 'refrigerator', 'freezer', 'cooler'],
    productName: 'Domestic Refrigerator',
    productType: 'Heavy Cooling Appliance · Compressor & Steel',
    primaryCategory: 'Appliances',
    safetyTip: 'Defrost 12 hours prior to pickup so shelves remain dry.',
    prepTip: 'Sealed compressor contains recoverable copper windings.',
    components: [
      { category: 'Appliances', weightKg: 24, sharePct: 70 },
      { category: 'Iron and steel', weightKg: 8, sharePct: 22 },
      { category: 'Copper', weightKg: 1, sharePct: 8 },
    ],
  },
  {
    id: 'battery',
    keywords: ['battery', 'inverter', 'ups', 'lead acid', 'amaron', 'luminous', 'exide'],
    productName: 'Inverter / UPS Battery Unit',
    productType: 'Hazardous Energy Storage · Certified Yard Only',
    primaryCategory: 'Batteries',
    safetyTip: 'Keep upright with terminals taped; never puncture casings.',
    prepTip: 'Route through verified e-waste hubs or certified battery collectors.',
    components: [
      { category: 'Batteries', weightKg: 12, sharePct: 90 },
      { category: 'Cables & wires', weightKg: 1, sharePct: 10 },
    ],
  },
  {
    id: 'router-gadgets',
    keywords: ['router', 'modem', 'wifi', 'printer', 'scanner', 'speaker', 'headphone', 'charger', 'keyboard', 'mouse', 'microwave'],
    productName: 'Home Electronics / Router / Printer',
    productType: 'Small Electronics · Circuit Board & Wires',
    primaryCategory: 'Small electronics',
    safetyTip: 'Clear Wi-Fi credentials or unplug adapter cords before bagging.',
    prepTip: 'Bundle tangled AC adapters under Cables & wires for ₹95/kg.',
    components: [
      { category: 'Small electronics', weightKg: 2.5, sharePct: 70 },
      { category: 'Cables & wires', weightKg: 0.8, sharePct: 30 },
    ],
  },
  {
    id: 'copper-brass',
    keywords: ['copper', 'brass', 'tap', 'valve', 'faucet', 'motor coil', 'winding', 'busbar'],
    productName: 'Plumbing Brassware & Copper Coils',
    productType: 'Non-Ferrous High-Value Alloy',
    primaryCategory: 'Copper',
    safetyTip: 'Inspect for steel bolts or iron brackets attached to fittings.',
    prepTip: 'Separate pure bare copper (₹620/kg) from yellow brass (₹410/kg) to avoid blended weighing.',
    components: [
      { category: 'Copper', weightKg: 2, sharePct: 60 },
      { category: 'Brass', weightKg: 1.5, sharePct: 40 },
    ],
  },
  {
    id: 'cartons-paper',
    keywords: ['box', 'boxes', 'amazon', 'flipkart', 'carton', 'cardboard', 'newspaper', 'book', 'magazine', 'notebook', 'paper'],
    productName: 'Flattened Cartons, Books & Newspapers',
    productType: 'Dry Paper & Corrugated Fiber',
    primaryCategory: 'Newspaper',
    safetyTip: 'Remove shipping labels with personal phone numbers if preferred.',
    prepTip: 'Keep completely dry and flatten boxes to unlock +5% pre-sorted bonus.',
    components: [
      { category: 'Newspaper', weightKg: 6, sharePct: 45 },
      { category: 'Cardboard', weightKg: 5, sharePct: 38 },
      { category: 'Books', weightKg: 2.5, sharePct: 17 },
    ],
  },
  {
    id: 'kitchen-bottles',
    keywords: ['bottle', 'pet', 'can', 'aluminum', 'beer can', 'soda', 'jar', 'glass', 'cooker', 'utensil', 'detergent', 'oil'],
    productName: 'Kitchen Bottles, Foil Cans & Cookware',
    productType: 'Mixed Clean Packaging & Kitchen Alloy',
    primaryCategory: 'PET bottles',
    safetyTip: 'Pour used cooking oil into a tightly capped bottle; rinse beverage cans.',
    prepTip: 'Separate aluminum beverage cans (₹110/kg) from steel cans.',
    components: [
      { category: 'PET bottles', weightKg: 3, sharePct: 40 },
      { category: 'Aluminum cans', weightKg: 1.5, sharePct: 25 },
      { category: 'Glass bottles', weightKg: 4, sharePct: 35 },
    ],
  },
]

export function detectProductType(input, ratesOverride = CATEGORIES) {
  const q = String(input || '').toLowerCase().trim()
  if (!q) return null

  let profile = PRODUCT_PROFILES.find(p =>
    p.keywords.some(kw => q.includes(kw))
  )

  if (!profile) {
    const matchedRule = LABEL_RULES.find(r => r.pattern.test(q))
    const fallbackCat = matchedRule?.category || 'Other'
    profile = {
      id: `dynamic-${fallbackCat.toLowerCase()}`,
      productName: input.trim(),
      productType: `${fallbackCat} · General Household Item`,
      primaryCategory: fallbackCat,
      safetyTip: 'Keep dry, clean, and separated from wet organic kitchen waste.',
      prepTip: 'Digital floor scales verify exact gram-to-kg weight on pickup.',
      components: [{ category: fallbackCat, weightKg: 4, sharePct: 100 }],
    }
  }

  const enriched = profile.components.map(c => {
    const rate = ratesOverride[c.category] ?? CATEGORIES[c.category] ?? 5
    return {
      ...c,
      ratePerKg: rate,
      value: Math.round(c.weightKg * rate),
    }
  })
  const estimatedWeightKg = Number(enriched.reduce((s, c) => s + c.weightKg, 0).toFixed(1))
  const estimatedTotalValue = enriched.reduce((s, c) => s + c.value, 0)
  const primaryRate = ratesOverride[profile.primaryCategory] ?? CATEGORIES[profile.primaryCategory] ?? 5

  return {
    ...profile,
    perKg: primaryRate,
    estimatedWeightKg,
    estimatedTotalValue,
    components: enriched,
    confidence: q.length > 2 ? 0.92 : 0.78,
  }
}

let mobilenetPromise
async function loadImageClassifier() {
  if (!mobilenetPromise) {
    mobilenetPromise = import('@tensorflow-models/mobilenet')
      .then(({ load }) => load({ version: 2, alpha: 0.5 }))
      .catch(error => {
        mobilenetPromise = null
        throw error
      })
  }
  return mobilenetPromise
}

export async function recognizeScrap(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose an image file to identify the product.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.')
  if (typeof createImageBitmap !== 'function') throw new Error('Image recognition is not supported in this browser.')

  const image = await createImageBitmap(file)
  try {
    const model = await loadImageClassifier()
    const predictions = await model.classify(image, 5)
    if (!predictions.length) throw new Error('The image classifier did not find a product. Try a clearer photo.')
    const matches = predictions.map(prediction => {
      const rule = LABEL_RULES.find(candidate => candidate.pattern.test(prediction.className.toLowerCase()))
      return { label: prediction.className, confidence: prediction.probability, category: rule?.category || 'Other' }
    })
    const best = matches[0]
    const productProfile = detectProductType(best.label)
    return {
      category: best.category,
      confidence: best.confidence,
      label: best.label,
      perKg: CATEGORIES[best.category],
      alternatives: [...new Set(matches.map(match => match.category))].slice(0, 4),
      productProfile,
    }
  } finally {
    image.close()
  }
}

export const predictPrices = (base, months = 6) => ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].slice(0, months).map((month, i) => ({ month, price: +(base * (1 + 0.015 * i + 0.04 * Math.sin(i))).toFixed(1) }))

export function batchPickups(pickups, minGroup = 2) {
  const g = {}
  pickups.forEach(p => (g[p.area] ||= []).push(p))
  return Object.entries(g).filter(([, l]) => l.length >= minGroup).map(([area, list]) => ({ area, list, kg: list.reduce((s, p) => s + p.weight, 0), saved: (list.length - 1) * 80 }))
}

const d = (a, b) => Math.hypot(a.lat - b.lat, a.lng - b.lng)

export function optimizeRoute(stops, start) {
  const left = [...stops]
  const out = []
  let cur = start
  while (left.length) {
    left.sort((a, b) => d(cur, a) - d(cur, b))
    cur = left.shift()
    out.push(cur)
  }
  return out
}

export const impact = kg => ({ trees: +(kg * 0.017).toFixed(1), co2: Math.round(kg * 1.2), water: Math.round(kg * 26), energy: Math.round(kg * 4.1), landfill: kg })
