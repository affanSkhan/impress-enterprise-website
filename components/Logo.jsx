import Image from 'next/image'

/**
 * Logo Component for Empire Car A/C
 * Displays the business logo with circular image and tagline
 */
export default function Logo({ className = "", size = "normal", showText = true }) {
  const sizes = {
    small: {
      text: "text-base sm:text-lg",
      tagline: "text-[10px] sm:text-xs",
      logo: 40,
      logoClass: "w-10 h-10"
    },
    normal: {
      text: "text-lg sm:text-xl",
      tagline: "text-xs sm:text-sm",
      logo: 50,
      logoClass: "w-12 h-12 sm:w-14 sm:h-14"
    },
    large: {
      text: "text-2xl sm:text-3xl md:text-4xl",
      tagline: "text-sm sm:text-base md:text-lg",
      logo: 80,
      logoClass: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
    }
  }

  const currentSize = sizes[size] || sizes.normal

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular Logo Image */}
      <div className={`${currentSize.logoClass} rounded-full overflow-hidden bg-gray-900 flex-shrink-0 shadow-lg ring-2 ring-orange-400 ring-offset-2`}>
        <Image
          src="/Empire Car Ac  Logo Design.jpg"
          alt="Empire Car A/C Logo"
          width={currentSize.logo}
          height={currentSize.logo}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Text Content */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${currentSize.text} font-bold leading-tight`}>
            <span className="text-gray-900">EMPIRE CAR </span>
            <span className="text-orange-600">A/C</span>
          </div>
          <div className={`${currentSize.tagline} text-orange-600 font-medium italic leading-tight mt-0.5`}>
            Our Perfection Your Satisfaction
          </div>
        </div>
      )}
    </div>
  )
}
