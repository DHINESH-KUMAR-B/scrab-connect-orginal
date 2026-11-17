import RECYCLABLES_IMG from '../assets/images/reward_sorted_recyclables_1794939033364.jpg'
import CANOPY_IMG from '../assets/images/reward_green_canopy_1794939033353.jpg'
import EWASTE_IMG from '../assets/images/scrap_ewaste_recovery_1794940072199.jpg'
import COPPER_IMG from '../assets/images/scrap_copper_metals_1794940072638.jpg'
import PAPER_IMG from '../assets/images/scrap_paper_bundles_1794940072851.jpg'
import HERO_IMG from '../assets/images/scrap_hero_pickup_1794940071713.jpg'

export const REWARD_CATALOG = [
  {
    id: 'green50',
    title: 'Green start cashback',
    category: 'cashback',
    requirement: 5,
    goalBased: false,
    code: 'GREEN50',
    bonusRupees: 50,
    bonusPoints: 50,
    benefitLabel: '+₹50 payout · +50 pts',
    detail: 'Get ₹50 bonus payout on your next pickup plus 50 Green Points when you recycle 5 kg this month.',
    image: RECYCLABLES_IMG,
    alt: 'Recyclable materials neatly sorted in wooden crates',
  },
  {
    id: 'fastlane',
    title: 'Priority 2-hour express slot',
    category: 'perks',
    requirement: 10,
    goalBased: false,
    code: 'FASTLANE',
    bonusRupees: 0,
    bonusPoints: 75,
    benefitLabel: 'Express pickup · +75 pts',
    detail: 'Unlock priority morning collection windows with zero convenience fee and +75 Green Points.',
    image: HERO_IMG,
    alt: 'Electric pickup van arriving for scheduled doorstep collection',
  },
  {
    id: 'circle150',
    title: 'Circular champion cashback',
    category: 'cashback',
    requirement: 25,
    goalBased: false,
    code: 'CIRCLE150',
    bonusRupees: 150,
    bonusPoints: 120,
    benefitLabel: '+₹150 payout · +120 pts',
    detail: 'Unlock ₹150 bonus payout on your next pickup after recycling 25 kg this month.',
    image: CANOPY_IMG,
    alt: 'Sunlit green forest canopy representing environmental impact',
  },
  {
    id: 'plant2',
    title: 'Plant 2 native saplings',
    category: 'eco',
    requirement: 35,
    goalBased: false,
    code: 'PLANT2',
    bonusRupees: 0,
    bonusPoints: 150,
    benefitLabel: '2 trees planted · +150 pts',
    detail: 'Sponsor 2 native urban saplings in your city belt with a digital certificate + 150 Green Points.',
    image: CANOPY_IMG,
    alt: 'Dense sunlit forest trees nourished by community recycling',
  },
  {
    id: 'metal15',
    title: '+15% Metal & E-Waste rate boost',
    category: 'boost',
    requirement: 50,
    goalBased: false,
    code: 'METAL15',
    bonusRupees: 0,
    bonusPctMetals: 15,
    bonusPoints: 200,
    benefitLabel: '+15% metal rate · +200 pts',
    detail: 'Boost payouts by +15% on Copper, Brass, Aluminum, Iron, Batteries, Appliances & E-Waste.',
    image: COPPER_IMG,
    alt: 'High-grade copper coils and sorted metallic scrap ready for recovery',
  },
  {
    id: 'ecostore250',
    title: 'Zero-waste eco-store voucher',
    category: 'perks',
    requirement: 75,
    goalBased: false,
    code: 'ECOSTORE250',
    bonusRupees: 250,
    bonusPoints: 220,
    benefitLabel: '₹250 credit · +220 pts',
    detail: 'Claim a ₹250 eco-credit for compost bins, bamboo kits, or apply directly as a pickup payout bonus.',
    image: PAPER_IMG,
    alt: 'Bundled paper and cardboard stacks prepared for circular processing',
  },
  {
    id: 'solar500',
    title: 'Green home & solar upgrade credit',
    category: 'eco',
    requirement: 100,
    goalBased: false,
    code: 'SOLAR500',
    bonusRupees: 500,
    bonusPoints: 350,
    benefitLabel: '₹500 credit · +350 pts',
    detail: 'Receive ₹500 toward smart energy meters, e-waste trade-ins, or direct payout bonus.',
    image: EWASTE_IMG,
    alt: 'Certified electronics and circuit recovery workstation',
  },
  {
    id: 'goalcrusher',
    title: 'Monthly goal reached jackpot',
    category: 'cashback',
    requirement: 0,
    goalBased: true,
    code: 'GOALCRUSHER',
    bonusRupees: 300,
    bonusPoints: 300,
    benefitLabel: '+₹300 jackpot · +300 pts',
    detail: 'Special milestone reward unlocked automatically whenever you reach 100% of your custom monthly goal.',
    image: HERO_IMG,
    alt: 'Celebratory circular economy doorstep collection milestone',
  },
]

export const WHEEL_PRIZES = [
  { id: 'wheel-40', label: '+₹40 Cashback', short: '₹40 Bonus', code: 'WHEEL40', bonusRupees: 40, bonusPoints: 40, color: '#15803d' },
  { id: 'wheel-pts100', label: '+100 Green Points', short: '100 Pts', code: 'WHEEL100PTS', bonusRupees: 0, bonusPoints: 100, color: '#0369a1' },
  { id: 'wheel-boost10', label: '+10% Pickup Boost', short: '+10% Rate', code: 'SPINBOOST10', bonusRupees: 0, bonusPctAll: 10, bonusPoints: 60, color: '#b45309' },
  { id: 'wheel-75', label: '+₹75 Payout Voucher', short: '₹75 Cash', code: 'WHEEL75', bonusRupees: 75, bonusPoints: 50, color: '#047857' },
  { id: 'wheel-sapling', label: '1 Free Tree Planted', short: '1 Sapling', code: 'SPINTREE1', bonusRupees: 0, bonusPoints: 120, color: '#1d4ed8' },
  { id: 'wheel-pass', label: 'Priority Express Pass', short: 'Express', code: 'SPINPASS', bonusRupees: 25, bonusPoints: 80, color: '#6d28d9' },
]

export const ECO_DONATION_CAUSES = [
  {
    id: 'cause-canopy',
    title: 'Urban Tree Canopy Drive',
    impact: 'Plants 1 native sapling per ₹100 equivalent',
    code: 'DONATE_TREES',
    bonusPoints: 180,
    detail: 'Sponsor shade saplings along neighborhood school zones and parks.',
  },
  {
    id: 'cause-school-ewaste',
    title: 'School STEM Hardware Refurbish',
    impact: 'Funds repaired classroom kits from recovered electronics',
    code: 'DONATE_STEM',
    bonusPoints: 200,
    detail: 'Support student robotics & computer labs using certified recovered hardware.',
  },
  {
    id: 'cause-coastal',
    title: 'Clean Coastline Plastic Recovery',
    impact: 'Removes 5 kg coastal plastic per pledge',
    code: 'DONATE_COAST',
    bonusPoints: 160,
    detail: 'Fund coastal sorting nets and volunteer cleanup gear across Chennai beaches.',
  },
]

const METAL_EWASTE_RE = /metal|copper|brass|aluminum|iron|steel|cable|e-waste|mobile|electronic|batter|appliance/i

export function calculateVoucherBonus(code, baseAmount, scrapType, items) {
  if (!code) return 0
  const wheelPrize = WHEEL_PRIZES.find(p => p.code === code)
  if (wheelPrize) {
    if (wheelPrize.bonusPctAll) return Math.max(25, Math.round(baseAmount * (wheelPrize.bonusPctAll / 100)))
    return wheelPrize.bonusRupees || 0
  }
  const reward = REWARD_CATALOG.find(r => r.code === code)
  if (!reward) return 0
  if (reward.bonusPctMetals) {
    const hasMetalOrEwaste = Array.isArray(items) && items.length
      ? items.some(i => METAL_EWASTE_RE.test(i.category || ''))
      : METAL_EWASTE_RE.test(scrapType || '')
    return hasMetalOrEwaste ? Math.round(baseAmount * (reward.bonusPctMetals / 100)) : 50
  }
  return reward.bonusRupees || 0
}
