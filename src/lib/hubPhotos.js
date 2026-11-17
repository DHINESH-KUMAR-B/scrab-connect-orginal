import urbanImg from '../assets/images/hub_urban_dropcenter_1794941629425.jpg'
import metalImg from '../assets/images/hub_metal_weighyard_1794941629927.jpg'
import ecoPointImg from '../assets/images/hub_community_ecopoint_1794941630243.jpg'
import ewasteImg from '../assets/images/scrap_ewaste_recovery_1794940072199.jpg'
import paperImg from '../assets/images/scrap_paper_bundles_1794940072851.jpg'
import plasticsImg from '../assets/images/reward_sorted_recyclables_1794939033364.jpg'
import copperImg from '../assets/images/scrap_copper_metals_1794940072638.jpg'
import heroImg from '../assets/images/scrap_hero_pickup_1794940071713.jpg'

export const HUB_PHOTOS = {
  urban: {
    src: urbanImg,
    alt: 'Solar-roofed urban recycling drop-off hub with digital floor scale and labeled sorting bays',
    caption: 'Solar Drop-Off Bay · Digital Weighbridge',
  },
  metal: {
    src: metalImg,
    alt: 'Sorted industrial metal and copper recovery warehouse with weighing station',
    caption: 'Metal & Alloy Exchange · Electronic Platform Scale',
  },
  ecopoint: {
    src: ecoPointImg,
    alt: 'Neighborhood eco-collection kiosk with sorted crates and electric cargo trike',
    caption: 'Neighborhood Eco-Point · EV Feeder Fleet',
  },
  ewaste: {
    src: ewasteImg,
    alt: 'Certified electronics and PCB recovery station at an e-waste hub',
    caption: 'Authorized E-Waste & Data-Safe Recovery Bay',
  },
  paper: {
    src: paperImg,
    alt: 'Stacked newspapers, books, and cardboard cartons inside a dry baling depot',
    caption: 'Dry Paper, Book & Cardboard Baling Depot',
  },
  plastics: {
    src: plasticsImg,
    alt: 'Cleanly sorted PET bottles, cans, and crates at a polymer sorting hub',
    caption: 'Clean-Grade Polymer & Container Sorting Facility',
  },
  copper: {
    src: copperImg,
    alt: 'Bright stripped copper wire coils and brass hardware on a grading bench',
    caption: 'Non-Ferrous Metal Assay & Grading Desk',
  },
  hero: {
    src: heroImg,
    alt: 'Verified electric collection fleet loading baled recyclables',
    caption: 'EV Bulk Dispatch & Neighborhood Drop Hub',
  },
}

export function getHubPhoto(photoType) {
  return HUB_PHOTOS[photoType] || HUB_PHOTOS.urban
}
