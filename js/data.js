/* =========================================================
   Leavynne Gadgets — Product & inventory data
   Source: "Leavynne Gadgets.xlsx" (SRP, Selling Price, Last Price)
   - price : Selling price shown to customers
   - srp   : Manufacturer SRP from the sheet
   - last  : Last price (lowest negotiable price) — staff only
   - stock : Number of identical rows in the sheet (editable in Admin)
   - image       : main studio image (shows the color in imageColor)
   - colorImages : studio images for the other colors, e.g. { "Ocean Blue": "images/redmi-a5-ocean-blue.webp" }
   A color with no image shows a drawing in that color.
   To add a color image: save it in /images and add it to colorImages.
   ========================================================= */

const SHOP = {
  name: "Leavynne Gadgets",
  tagline: "Small business. Phones & gadgets.",
  location: "Pateros, Philippines",
  facebook: "https://www.facebook.com/LeavynneGadgets",
  facebookLabel: "facebook.com/LeavynneGadgets",
  messenger: "https://m.me/LeavynneGadgets",
  /* Staff accounts (see js/auth.js)
     - First owner login: username "owner", password "Leavynne2026" (must be changed on first sign-in)
     - New staff need this invite code to create an account. Change it to your own code. */
  staffCode: "LG-STAFF-2026"
};

/* Approximate swatch colors for the color chips and drawings */
const COLOR_HEX = {
  "Awesome Pink": "#E9C9CF", "Awesome Lightgray": "#D7D7D9", "Awesome Graphite": "#3E4045",
  "Lake Green": "#BFE0CF", "Ocean Blue": "#9FC3E2", "Midnight Black": "#2B2D33", "Sandy Gold": "#DCCBA8",
  "Graphite Grey": "#4B4F57", "Graphite Gray": "#4B4F57", "Pebble White": "#E8ECEF",
  "Twilight Blue": "#4F6CC9", "Carbon Gray": "#4A4D55", "Sea Blue": "#8EC3D8",
  "Power Black": "#26272B", "Light Blue": "#AFCDE8", "Light Green": "#C7E3C9",
  "Peach Pink": "#F2C6B8", "Lavender": "#C9B8E3", "Lavender Purple": "#C3B1E1",
  "Mint Green": "#BFE3D6", "Ice Blue": "#CFE6F2", "Pearl Pink": "#EFD3D6",
  "Ocean Sunset": "#EBA58A", "Star Blue": "#2E4FA8", "Sky Blue": "#B5D3EA",
  "Pearl White": "#F1EFEA", "Cosmic Gray": "#4A4D55"
};

const PRODUCTS = [
  /* ------------------------------ PHONES ------------------------------ */
  {
    id: "samsung-galaxy-a56-5g", name: "Samsung Galaxy A56 5G", brand: "Samsung", series: "Galaxy",
    category: "phone", featured: true, image: "images/samsung-galaxy-a56.webp", imageColor: "Awesome Pink",
    highlights: [["120Hz", "Super AMOLED display"], ["5,000mAh", "Typical battery capacity"]],
    specs: [["Model number", "SM-A566B/DS"], ["Display", "6.7-inch FHD+ Super AMOLED · up to 120Hz"],
      ["Rear cameras", "50MP main (OIS) + 12MP ultrawide + 5MP macro"], ["Front camera", "12MP"],
      ["Battery", "5,000mAh typical capacity"], ["Charging", "Up to 45W wired charging"],
      ["Protection", "IP67 water and dust resistance"]],
    specSource: "Samsung Philippines",
    ai: { camera: 50, battery: 5000, perf: 8, amoled: true, fiveG: true, hz: 120 },
    variants: [
      { sku: "SAM-A56-8-128-PNK", color: "Awesome Pink", ram: "8GB", storage: "128GB", price: null, srp: null, last: null, stock: 1 },
      { sku: "SAM-A56-8-256-PNK", color: "Awesome Pink", ram: "8GB", storage: "256GB", price: null, srp: null, last: null, stock: 1 },
      { sku: "SAM-A56-8-256-LGY", color: "Awesome Lightgray", ram: "8GB", storage: "256GB", price: null, srp: null, last: null, stock: 0 },
      { sku: "SAM-A56-8-256-GRA", color: "Awesome Graphite", ram: "8GB", storage: "256GB", price: null, srp: null, last: null, stock: 0 }
    ]
  },
  {
    id: "redmi-a5", name: "Redmi A5", brand: "Xiaomi", series: "Redmi", category: "phone", featured: true,
    image: "images/redmi-a5.webp", imageColor: "Lake Green",
    colorImages: { "Ocean Blue": "images/redmi-a5-ocean-blue.webp", "Midnight Black": "images/redmi-a5-midnight-black.webp" },
    blurb: "Explore a phone for your calls, browsing and everyday moments.",
    highlights: [["6.88-inch", "Up to 120Hz display"], ["5,200mAh", "Typical battery capacity"]],
    specs: [["Display", "6.88-inch · 1640 × 720 · up to 120Hz"], ["Processor", "UNISOC T7250"],
      ["Rear camera", "32MP main + auxiliary lens"], ["Front camera", "8MP"],
      ["Battery", "5,200mAh typical"], ["Charging", "Up to 15W · USB-C"]],
    specSource: "Xiaomi Philippines",
    ai: { camera: 32, battery: 5200, perf: 4, amoled: false, fiveG: false, hz: 120 },
    variants: [
      { sku: "RMA5-4-128-LGR", color: "Lake Green", ram: "4GB", storage: "128GB", price: 3800, srp: 4099, last: 3700, stock: 1 },
      { sku: "RMA5-4-128-OBL", color: "Ocean Blue", ram: "4GB", storage: "128GB", price: 3800, srp: 4099, last: 3700, stock: 1 },
      { sku: "RMA5-4-128-MBK", color: "Midnight Black", ram: "4GB", storage: "128GB", price: 3800, srp: 4099, last: 3700, stock: 1 }
    ]
  },
  {
    id: "redmi-note-11s", name: "Redmi Note 11S", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-11s.webp", imageColor: "Graphite Grey",
    highlights: [["108MP", "Main camera"], ["5,000mAh", "Typical battery capacity"]],
    specs: [["Display", "6.43-inch AMOLED · 2400 × 1080 · up to 90Hz"], ["Chipset", "MediaTek Helio G96"],
      ["Rear cameras", "108MP main + 8MP ultrawide + 2MP macro + 2MP depth"], ["Front camera", "16MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W · USB-C"],
      ["Connectivity", "4G LTE · Dual SIM · Wi-Fi 5 · Bluetooth 5.0"]],
    specSource: "Xiaomi Global",
    ai: { camera: 108, battery: 5000, perf: 6, amoled: true, fiveG: false, hz: 90 },
    variants: [
      { sku: "RN11S-6-64-GGY", color: "Graphite Grey", ram: "6GB", storage: "64GB", price: 9900, srp: 10499, last: 9700, stock: 1 }
    ]
  },
  {
    id: "redmi-note-10s", name: "Redmi Note 10S", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-10s.webp", imageColor: "Pebble White",
    highlights: [["64MP", "Quad camera"], ["5,000mAh", "Typical battery capacity"]],
    specs: [["Display", "6.43-inch AMOLED · 2400 × 1080"], ["Chipset", "MediaTek Helio G95"],
      ["Rear cameras", "64MP main + 8MP ultrawide + 2MP macro + 2MP depth"], ["Front camera", "13MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W"],
      ["Connectivity", "4G LTE · Dual SIM · Dual-band Wi-Fi · Bluetooth 5.0"]],
    specSource: "Xiaomi Global",
    ai: { camera: 64, battery: 5000, perf: 6, amoled: true, fiveG: false, hz: 60 },
    variants: [
      { sku: "RN10S-8-128-PWH", color: "Pebble White", ram: "8GB", storage: "128GB", price: 8000, srp: 11990, last: 7800, stock: 1 },
      { sku: "RN10S-8-128-OBL", color: "Ocean Blue", ram: "8GB", storage: "128GB", price: 8000, srp: 11990, last: 7300, stock: 1 }
    ]
  },
  {
    id: "redmi-note-11", name: "Redmi Note 11", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-11.webp", imageColor: "Twilight Blue",
    highlights: [["90Hz", "AMOLED display"], ["33W", "Fast charging"]],
    specs: [["Display", "6.43-inch AMOLED · 2400 × 1080 · up to 90Hz"], ["Chipset", "Qualcomm Snapdragon 680"],
      ["Rear cameras", "50MP main + 8MP ultrawide + 2MP macro + 2MP depth"], ["Front camera", "13MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W · USB-C"],
      ["Connectivity", "4G LTE · Dual SIM · Bluetooth 5.0"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 5, amoled: true, fiveG: false, hz: 90 },
    variants: [
      { sku: "RN11-4-64-TBL", color: "Twilight Blue", ram: "4GB", storage: "64GB", price: 7900, srp: 8999, last: 7300, stock: 3 },
      { sku: "RN11-4-64-GGY", color: "Graphite Grey", ram: "4GB", storage: "64GB", price: 7000, srp: 8999, last: 7000, stock: 1 },
      { sku: "RN11-6-128-GGY", color: "Graphite Grey", ram: "6GB", storage: "128GB", price: 9200, srp: 9999, last: 8700, stock: 3 }
    ]
  },
  {
    id: "redmi-10", name: "Redmi 10", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-10.webp", imageColor: "Carbon Gray",
    highlights: [["50MP", "Main camera"], ["90Hz", "6.5-inch display"]],
    specs: [["Display", "6.5-inch · 2400 × 1080 · up to 90Hz"], ["Chipset", "MediaTek Helio G88"],
      ["Rear cameras", "50MP main + 8MP ultrawide + 2MP macro + 2MP depth"], ["Front camera", "8MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 18W · USB-C"],
      ["Connectivity", "4G LTE · Dual SIM · Dual-band Wi-Fi · Bluetooth 5.1"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 5, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "R10-6-128-CGY", color: "Carbon Gray", ram: "6GB", storage: "128GB", price: 8300, srp: 8590, last: 8300, stock: 1 },
      { sku: "R10-4-64-SBL", color: "Sea Blue", ram: "4GB", storage: "64GB", price: 6000, srp: 7590, last: 5800, stock: 1 }
    ]
  },
  {
    id: "poco-m4-pro-4g", name: "POCO M4 Pro 4G", brand: "POCO", series: "POCO", category: "phone",
    image: "images/poco-m4-pro.webp", imageColor: "Power Black",
    highlights: [["90Hz", "AMOLED display"], ["33W", "Fast charging"]],
    specs: [["Display", "6.43-inch AMOLED · 2400 × 1080 · 90Hz"], ["Chipset", "MediaTek Helio G96"],
      ["Rear cameras", "64MP main + 8MP ultrawide + 2MP macro"], ["Front camera", "16MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W"],
      ["Connectivity", "4G LTE · Dual SIM · Wi-Fi 5 · Bluetooth 5.0"]],
    specSource: "POCO Global",
    ai: { camera: 64, battery: 5000, perf: 6, amoled: true, fiveG: false, hz: 90 },
    variants: [
      { sku: "POCOM4P-6-128-PBK", color: "Power Black", ram: "6GB", storage: "128GB", price: 10000, srp: 12990, last: 8500, stock: 1 }
    ]
  },
  {
    id: "redmi-note-11-pro-plus-5g", name: "Redmi Note 11 Pro+ 5G", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-11-pro-plus.webp", imageColor: "Graphite Grey",
    highlights: [["120W", "HyperCharge"], ["120Hz", "AMOLED display"]],
    specs: [["Display", "6.67-inch AMOLED · 2400 × 1080 · up to 120Hz"], ["Chipset", "MediaTek Dimensity 920"],
      ["Rear cameras", "108MP main + 8MP ultrawide + 2MP macro"], ["Front camera", "16MP"],
      ["Battery", "4,500mAh typical"], ["Charging", "Up to 120W HyperCharge · USB-C"],
      ["Connectivity", "5G · Dual SIM · Wi-Fi 6 · Bluetooth 5.2"]],
    specSource: "Xiaomi Global",
    ai: { camera: 108, battery: 4500, perf: 8, amoled: true, fiveG: true, hz: 120 },
    variants: [
      { sku: "RN11PP-8-256-GGY", color: "Graphite Grey", ram: "8GB", storage: "256GB", price: 18000, srp: 21999, last: 16000, stock: 1 }
    ]
  },
  {
    id: "redmi-a1", name: "Redmi A1", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-a1.webp", imageColor: "Light Blue",
    highlights: [["6.52-inch", "HD+ display"], ["5,000mAh", "Typical battery capacity"]],
    specs: [["Display", "6.52-inch HD+"], ["Chipset", "MediaTek Helio A22"],
      ["Rear cameras", "8MP dual camera"], ["Front camera", "5MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "10W"]],
    specSource: "Xiaomi Global",
    ai: { camera: 8, battery: 5000, perf: 2, amoled: false, fiveG: false, hz: 60 },
    variants: [
      { sku: "RA1-2-32-LBL", color: "Light Blue", ram: "2GB", storage: "32GB", price: 4299, srp: 4499, last: 4299, stock: 2 },
      { sku: "RA1-2-32-LGR", color: "Light Green", ram: "2GB", storage: "32GB", price: 3500, srp: 4499, last: 3300, stock: 1 }
    ]
  },
  {
    id: "xiaomi-mi-11-lite-5g", name: "Xiaomi Mi 11 Lite 5G", brand: "Xiaomi", series: "Mi", category: "phone",
    image: "images/mi-11-lite-5g.webp", imageColor: "Peach Pink", condition: "Pre-loved",
    blurb: "Pre-loved unit. Ask for current photos and the exact condition before ordering.",
    highlights: [["5G", "Snapdragon 780G"], ["90Hz", "AMOLED display"]],
    specs: [["Display", "6.55-inch AMOLED · 2400 × 1080 · up to 90Hz"], ["Chipset", "Qualcomm Snapdragon 780G"],
      ["Rear cameras", "64MP main + 8MP ultrawide + 5MP telemacro"], ["Front camera", "20MP"],
      ["Battery", "4,250mAh typical"], ["Charging", "Up to 33W · USB-C"], ["Condition", "Pre-loved · RAM to confirm"]],
    specSource: "Xiaomi Global",
    ai: { camera: 64, battery: 4250, perf: 8, amoled: true, fiveG: true, hz: 90 },
    variants: [
      { sku: "MI11L5G-128-PPK", color: "Peach Pink", ram: "", storage: "128GB", price: 10000, srp: null, last: 10000, stock: 1, condition: "Pre-loved" }
    ]
  },
  {
    id: "redmi-12c", name: "Redmi 12C", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-12c.webp", imageColor: "Lavender",
    colorImages: { "Ocean Blue": "images/redmi-12c-ocean-blue.webp", "Graphite Gray": "images/redmi-12c-graphite-gray.webp" },
    highlights: [["6.71-inch", "Large display"], ["Freebie", "Included on listed units"]],
    specs: [["Display", "6.71-inch HD+"], ["Chipset", "MediaTek Helio G85"],
      ["Rear cameras", "50MP AI dual camera"], ["Front camera", "5MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "10W"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 4, amoled: false, fiveG: false, hz: 60 },
    variants: [
      { sku: "R12C-4-128-LAV", color: "Lavender", ram: "4GB", storage: "128GB", price: 7200, srp: 7499, last: 7000, stock: 1, freebie: "DITO SIM card" },
      { sku: "R12C-6-128-OBL", color: "Ocean Blue", ram: "6GB", storage: "128GB", price: 7800, srp: 8599, last: 7300, stock: 1, freebie: "Xiaomi Mi In-Ear Headphones Basic" },
      { sku: "R12C-6-128-GGY", color: "Graphite Gray", ram: "6GB", storage: "128GB", price: 7800, srp: 8599, last: 7300, stock: 1, freebie: "Xiaomi Mi In-Ear Headphones Basic" }
    ]
  },
  {
    id: "redmi-note-12", name: "Redmi Note 12", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-12.webp", imageColor: "Mint Green",
    highlights: [["120Hz", "AMOLED display"], ["Freebie", "Included on listed units"]],
    specs: [["Display", "6.67-inch AMOLED · 2400 × 1080 · up to 120Hz"], ["Chipset", "Qualcomm Snapdragon 685"],
      ["Rear cameras", "50MP main + 8MP ultrawide + 2MP macro"], ["Front camera", "13MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 5, amoled: true, fiveG: false, hz: 120 },
    variants: [
      { sku: "RN12-4-128-MGR", color: "Mint Green", ram: "4GB", storage: "128GB", price: 8500, srp: 8999, last: 8300, stock: 1, freebie: "Redmi Buds 4 Lite (Global)" },
      { sku: "RN12-6-128-IBL", color: "Ice Blue", ram: "6GB", storage: "128GB", price: 9500, srp: 9999, last: 9000, stock: 1, freebie: "DITO SIM card" }
    ]
  },
  {
    id: "redmi-12", name: "Redmi 12", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-12.webp", imageColor: "Midnight Black",
    highlights: [["6.79-inch", "90Hz display"], ["8GB", "RAM"]],
    specs: [["Display", "6.79-inch FHD+ · up to 90Hz"], ["Chipset", "MediaTek Helio G88"],
      ["Rear cameras", "50MP main + 8MP ultrawide + 2MP macro"], ["Front camera", "8MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 18W · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 5, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "R12-8-128-MBK", color: "Midnight Black", ram: "8GB", storage: "128GB", price: 6500, srp: 7999, last: 6200, stock: 1 }
    ]
  },
  {
    id: "redmi-13c", name: "Redmi 13C", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-13c.webp", imageColor: "Midnight Black",
    highlights: [["6.74-inch", "90Hz display"], ["50MP", "Main camera"]],
    specs: [["Display", "6.74-inch HD+ · up to 90Hz"], ["Chipset", "MediaTek Helio G85"],
      ["Rear cameras", "50MP main + auxiliary lenses"], ["Front camera", "8MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 18W · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 50, battery: 5000, perf: 4, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "R13C-4-128-MBK", color: "Midnight Black", ram: "4GB", storage: "128GB", price: 4500, srp: 4999, last: 4200, stock: 1 }
    ]
  },
  {
    id: "redmi-note-13", name: "Redmi Note 13", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-note-13.webp", imageColor: "Mint Green",
    colorImages: { "Midnight Black": "images/redmi-note-13-midnight-black.webp", "Ocean Sunset": "images/redmi-note-13-ocean-sunset.webp" },
    highlights: [["108MP", "Main camera"], ["120Hz", "AMOLED display"]],
    specs: [["Display", "6.67-inch AMOLED · 2400 × 1080 · up to 120Hz"], ["Chipset", "Qualcomm Snapdragon 685"],
      ["Rear cameras", "108MP main + 8MP ultrawide + 2MP macro"], ["Front camera", "16MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "Up to 33W · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 108, battery: 5000, perf: 5, amoled: true, fiveG: false, hz: 120 },
    variants: [
      { sku: "RN13-6-128-MGR", color: "Mint Green", ram: "6GB", storage: "128GB", price: 6000, srp: 7999, last: 5800, stock: 1 },
      { sku: "RN13-6-128-MBK", color: "Midnight Black", ram: "6GB", storage: "128GB", price: 6500, srp: 7999, last: 6300, stock: 1 },
      { sku: "RN13-6-128-OSS", color: "Ocean Sunset", ram: "6GB", storage: "128GB", price: 6500, srp: 7999, last: 6300, stock: 1 }
    ]
  },
  {
    id: "redmi-13", name: "Redmi 13", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-13.webp", imageColor: "Pearl Pink",
    highlights: [["108MP", "Main camera"], ["256GB", "Storage"]],
    specs: [["Display", "6.79-inch FHD+ · up to 90Hz"], ["Chipset", "MediaTek Helio G91-Ultra"],
      ["Rear cameras", "108MP main + 2MP macro"], ["Front camera", "13MP"],
      ["Battery", "5,030mAh typical"], ["Charging", "Up to 33W · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 108, battery: 5030, perf: 5, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "R13-8-256-PPK", color: "Pearl Pink", ram: "8GB", storage: "256GB", price: 6500, srp: 7999, last: 6300, stock: 1 },
      { sku: "R13-8-256-OBL", color: "Ocean Blue", ram: "8GB", storage: "256GB", price: 6500, srp: 7999, last: 6300, stock: 1 }
    ]
  },
  {
    id: "redmi-a3", name: "Redmi A3", brand: "Xiaomi", series: "Redmi", category: "phone",
    image: "images/redmi-a3.webp", imageColor: "Star Blue",
    highlights: [["6.71-inch", "90Hz display"], ["5,000mAh", "Typical battery capacity"]],
    specs: [["Display", "6.71-inch HD+ · up to 90Hz"], ["Chipset", "MediaTek Helio G36"],
      ["Rear cameras", "8MP main + auxiliary lens"], ["Front camera", "5MP"],
      ["Battery", "5,000mAh typical"], ["Charging", "10W"]],
    specSource: "Xiaomi Global",
    ai: { camera: 8, battery: 5000, perf: 2, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "RA3-3-64-SBL", color: "Star Blue", ram: "3GB", storage: "64GB", price: 3100, srp: 3399, last: 2900, stock: 1 },
      { sku: "RA3-4-128-SBL", color: "Star Blue", ram: "4GB", storage: "128GB", price: 3600, srp: 3999, last: 3400, stock: 1 }
    ]
  },

  /* ------------------------------ TABLETS ------------------------------ */
  {
    id: "xiaomi-pad-5", name: "Xiaomi Pad 5", brand: "Xiaomi", series: "Xiaomi Pad", category: "tablet", featured: true,
    image: "images/xiaomi-pad-5.webp", imageColor: "Pearl White",
    blurb: "Make space for reading, streaming and the things you enjoy.",
    highlights: [["11-inch", "WQHD+ · 120Hz display"], ["8,720mAh", "Typical battery capacity"]],
    specs: [["Display", "11-inch · 2560 × 1600 · 120Hz"], ["Processor", "Qualcomm Snapdragon 860"],
      ["Rear / front camera", "13MP / 8MP"], ["Battery", "8,720mAh typical"], ["Charging", "Up to 33W · USB-C"],
      ["Audio", "Quad speakers · Dolby Atmos"], ["Connectivity", "Wi-Fi · Bluetooth 5.0 · USB-C"]],
    specSource: "Xiaomi Global",
    ai: { camera: 13, battery: 8720, perf: 7, amoled: false, fiveG: false, hz: 120 },
    variants: [
      { sku: "XPAD5-6-128-PWH", color: "Pearl White", ram: "6GB", storage: "128GB", price: 15000, srp: 17990, last: 14500, stock: 1 }
    ]
  },
  {
    id: "redmi-pad-se-8-7", name: "Redmi Pad SE 8.7", brand: "Xiaomi", series: "Redmi Pad", category: "tablet", featured: true,
    image: "images/redmi-pad-se-8-7.webp", imageColor: "Graphite Gray",
    blurb: "A compact tablet for your everyday. Confirm whether the offered unit is Wi-Fi or 4G before ordering.",
    highlights: [["8.7-inch", "Up to 90Hz display"], ["6,650mAh", "Typical battery capacity"]],
    specs: [["Display", "8.7-inch LCD · 1340 × 800 · up to 90Hz"], ["Processor", "MediaTek Helio G85"],
      ["Battery", "6,650mAh typical"], ["Charging", "Up to 18W · USB-C"],
      ["Connectivity variant", "Wi-Fi / 4G version to be confirmed"]],
    specSource: "Xiaomi Global",
    ai: { camera: 8, battery: 6650, perf: 4, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "RPSE87-4-128-GGY", color: "Graphite Gray", ram: "4GB", storage: "128GB", price: 6500, srp: 7999, last: 6000, stock: 1 },
      { sku: "RPSE87-4-128-SBL", color: "Sky Blue", ram: "4GB", storage: "128GB", price: 6500, srp: 7999, last: 6000, stock: 1 }
    ]
  },
  {
    id: "redmi-pad", name: "Redmi Pad", brand: "Xiaomi", series: "Redmi Pad", category: "tablet",
    image: "images/redmi-pad.webp", imageColor: "Graphite Gray",
    highlights: [["10.61-inch", "2K · 90Hz display"], ["8,000mAh", "Typical battery capacity"]],
    specs: [["Display", "10.61-inch · 2000 × 1200 · up to 90Hz"], ["Processor", "MediaTek Helio G99"],
      ["Rear / front camera", "8MP / 8MP"], ["Battery", "8,000mAh typical"], ["Charging", "Up to 18W · USB-C"],
      ["Audio", "Quad speakers · Dolby Atmos"]],
    specSource: "Xiaomi Global",
    ai: { camera: 8, battery: 8000, perf: 6, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "RPAD-4-128-GGY", color: "Graphite Gray", ram: "4GB", storage: "128GB", price: 12999, srp: 13999, last: 10000, stock: 1 }
    ]
  },
  {
    id: "redmi-pad-se-11", name: "Redmi Pad SE (11-inch)", brand: "Xiaomi", series: "Redmi Pad", category: "tablet",
    image: "images/redmi-pad-se-11.webp", imageColor: "Graphite Gray",
    highlights: [["11-inch", "FHD+ · 90Hz display"], ["8,000mAh", "Typical battery capacity"]],
    specs: [["Display", "11-inch · 1920 × 1200 · up to 90Hz"], ["Processor", "Qualcomm Snapdragon 680"],
      ["Rear / front camera", "8MP / 5MP"], ["Battery", "8,000mAh typical"], ["Charging", "10W · USB-C"],
      ["Audio", "Quad speakers · Dolby Atmos"]],
    specSource: "Xiaomi Global",
    ai: { camera: 8, battery: 8000, perf: 5, amoled: false, fiveG: false, hz: 90 },
    variants: [
      { sku: "RPSE11-4-128-GGY", color: "Graphite Gray", ram: "4GB", storage: "128GB", price: 7800, srp: 9999, last: 7500, stock: 1 },
      { sku: "RPSE11-4-128-LPU", color: "Lavender Purple", ram: "4GB", storage: "128GB", price: 7800, srp: 9999, last: 7500, stock: 1 }
    ]
  }
];
