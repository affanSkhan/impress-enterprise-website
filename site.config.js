/**
 * Impress Enterprise - Central Branding Configuration
 * 
 * This file contains all branding, contact, and business information.
 * Update values here to change branding across the entire application.
 */

const siteConfig = {
  // ===== BRAND IDENTITY =====
  brandName: 'Impress Enterprise',
  brandShortName: 'Impress',
  tagline: 'Solar • Electronics • Furniture',
  description: 'Impress Enterprise provides professional solar panel installation & maintenance, comprehensive electronics sales and service including AC, refrigerators, washing machines, inverters, and quality furniture for home and office in Daryapur and surrounding areas.',
  
  // ===== VISUAL ASSETS =====
  logo: {
    path: '/impress_enterprise_logo.png',
    alt: 'Impress Enterprise Logo',
  },
  
  // ===== BUSINESS CATEGORIES =====
  services: {
    solar: {
      name: 'Solar Solutions',
      slug: 'solar',
      description: 'Solar panel sales, installation, maintenance, inverter & battery systems, and AMC services',
      icon: '☀️',
      color: 'amber',
      offerings: [
        'Solar Panel Sales',
        'Solar Panel Installation',
        'Solar Inverter & Battery',
        'Solar System Maintenance',
        'AMC (Annual Maintenance)',
        'Solar Site Inspection'
      ]
    },
    electronics: {
      name: 'Electronics Sales & Service',
      slug: 'electronics',
      description: 'Sales and professional service for home & commercial electronics - AC, refrigerators, washing machines, and more',
      icon: '⚡',
      color: 'blue',
      categories: [
        { slug: 'ac', name: 'Air Conditioners', icon: '❄️' },
        { slug: 'refrigerators', name: 'Refrigerators', icon: '🧊' },
        { slug: 'washing-machines', name: 'Washing Machines', icon: '🌀' },
        { slug: 'tvs', name: 'Televisions', icon: '📺' },
        { slug: 'kitchen-appliances', name: 'Kitchen Appliances', icon: '🍳' },
        { slug: 'batteries', name: 'Inverters & Batteries', icon: '🔋' },
        { slug: 'accessories', name: 'Accessories', icon: '🔌' }
      ],
      offerings: [
        'Air Conditioners',
        'Refrigerators',
        'Washing Machines',
        'Deep Freezers',
        'Water Coolers',
        'Inverters & Batteries'
      ]
    },
    furniture: {
      name: 'Furniture Sales',
      slug: 'furniture',
      description: 'Quality furniture for home and office - delivery and assembly available',
      icon: '🪑',
      color: 'teal',
      categories: [
        { slug: 'sofas', name: 'Sofas & Seating', icon: '🛋️' },
        { slug: 'beds', name: 'Beds & Mattresses', icon: '🛏️' },
        { slug: 'dining', name: 'Dining Sets', icon: '🪑' },
        { slug: 'storage', name: 'Storage & Wardrobes', icon: '🗄️' },
        { slug: 'office', name: 'Office Furniture', icon: '💼' }
      ],
      offerings: [
        'Living Room Furniture',
        'Bedroom Furniture',
        'Dining Sets',
        'Office Furniture',
        'Storage Solutions',
        'Custom Furniture'
      ]
    },
    repair: {
      name: 'Repair & Service Booking',
      slug: 'services',
      description: 'Professional repair and installation services for all electronics',
      icon: '🔧',
      color: 'indigo',
      serviceTypes: [
        { slug: 'ac-service', name: 'AC Service & Repair', icon: '❄️' },
        { slug: 'refrigerator-repair', name: 'Refrigerator Repair', icon: '🧊' },
        { slug: 'washing-machine-repair', name: 'Washing Machine Repair', icon: '🌀' },
        { slug: 'tv-repair', name: 'TV Repair', icon: '📺' },
        { slug: 'installation', name: 'Installation Service', icon: '🔧' }
      ]
    }
  },
  
  // ===== THEME COLORS =====
  colors: {
    primary: 'from-blue-600 to-cyan-600',        // Cooling theme
    secondary: 'from-amber-500 to-orange-600',    // Solar theme
    accent: 'from-slate-600 to-gray-700',         // Furniture/neutral
    gradient: 'from-blue-600 via-cyan-500 to-amber-500', // Combined brand
  },
  
  // ===== CONTACT INFORMATION =====
  contact: {
    phone: '+91 77448 19280',
    phoneSecondary: '+91 97630 50759',
    phoneFormatted: '+91 77448 19280 | +91 97630 50759',
    whatsapp: '917744819280',           // Primary WhatsApp number (no + or spaces)
    email: 'impressenterprise.in@gmail.com',
    address: {
      line1: 'Shop Address Line 1',    // TODO: Add actual address
      line2: 'Daryapur, Dist. Amravati',
      city: 'Daryapur',
      state: 'Maharashtra',
      zipCode: '444803',               // TODO: Verify zip code
      country: 'India',
    },
  },
  
  // ===== LOCATION & MAPS =====
  // TODO: Update with actual Google Maps coordinates and embed URL
  location: {
    city: 'Daryapur',
    district: 'Amravati',
    state: 'Maharashtra',
    displayText: 'Daryapur, Dist. Amravati, Maharashtra',
    googleMapsUrl: 'https://maps.google.com/?q=Daryapur+Amravati', // TODO: Update with actual location
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3722.5!2d77.3!3d20.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDU0JzAwLjAiTiA3N8KwMTgnMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin', // TODO: Update embed URL
  },
  
  // ===== BUSINESS HOURS =====
  hours: {
    weekdays: 'Monday - Saturday: 9:00 AM - 7:00 PM',
    sunday: 'Sunday: Closed (Emergency services available)',
  },
  
  // ===== WEBSITE & DOMAIN =====
  domain: 'impressenterprise.in',
  url: 'https://impressenterprise.in',
  canonicalUrl: 'https://impressenterprise.in',
  
  // ===== SOCIAL MEDIA =====
  // TODO: Add social media links if available
  social: {
    facebook: '',  // TODO: Add Facebook page URL
    instagram: '', // TODO: Add Instagram profile URL
    youtube: '',   // TODO: Add YouTube channel URL
  },
  
  // ===== SEO METADATA =====
  seo: {
    title: 'Impress Enterprise | Solar, Electronics & Furniture',
    titleTemplate: '%s | Impress Enterprise',
    description: 'Solar panel installation, electronics & furniture sales and service in Daryapur, Amravati. AC, refrigerators, washing machines, home furniture, solar systems.',
    keywords: [
      'solar panel installation Daryapur',
      'electronics shop Amravati',
      'furniture store Daryapur',
      'AC service Daryapur',
      'refrigerator repair Amravati',
      'furniture delivery',
      'home appliances',
      'solar inverter battery',
    ],
    openGraph: {
      title: 'Impress Enterprise | Solar, Electronics & Furniture',
      description: 'Solar panel installation, electronics & furniture sales and service in Daryapur, Amravati. Trusted local provider.',
    },
  },
  
  // ===== PWA SETTINGS =====
  pwa: {
    name: 'Impress Enterprise',
    shortName: 'Impress',
    description: 'Cooling, Solar & Furniture Services',
    themeColor: '#0284c7', // cyan-600
    backgroundColor: '#ffffff',
  },
  
  // ===== BUSINESS INFO (Structured Data) =====
  business: {
    type: 'LocalBusiness',
    name: 'Impress Enterprise',
    description: 'Solar panel installation & maintenance, electronics sales & service provider offering AC, refrigerators, washing machines, inverters, and solar systems',
    priceRange: '₹₹',
    currencyAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Bank Transfer',
    areaServed: [
      'Daryapur',
      'Amravati',
      'Akola',
      'Washim',
      'Yavatmal',
    ],
  },
  
  // ===== ADMIN SETTINGS =====
  admin: {
    dashboardTitle: 'Impress Enterprise Admin',
    orderLabel: 'Service Request',
    orderLabelPlural: 'Service Requests',
    productLabel: 'Service/Product',
    productLabelPlural: 'Services/Products',
  },
  
  // ===== NOTIFICATION SETTINGS =====
  notifications: {
    newOrderTitle: 'New Service Request',
    newOrderMessage: 'Impress Enterprise - New service request received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  },
}

// Helper function to get full address string
siteConfig.getFullAddress = () => {
  const { line1, line2, city, state, zipCode, country } = siteConfig.contact.address
  return `${line1}, ${line2}, ${city}, ${state} ${zipCode}, ${country}`
}

// Helper function to get phone link
siteConfig.getPhoneLink = () => {
  return `tel:${siteConfig.contact.phone}`
}

// Helper function to get WhatsApp link
siteConfig.getWhatsAppLink = (message = '') => {
  const msg = message || `Hi, I'm interested in Impress Enterprise services`
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(msg)}`
}

// Helper function to get email link
siteConfig.getEmailLink = (subject = '', body = '') => {
  const sub = subject || 'Service Inquiry'
  return `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`
}

export default siteConfig
