import { useState, useEffect, useRef } from 'react'

/**
 * ProductShowcase Component
 * Auto-sliding product showcase with unique hexagonal design
 * Features: 3D cards, auto-play, pause on hover, progress indicators
 */
export default function ProductShowcase() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const timerRef = useRef(null)

  const products = [
    {
      id: 1,
      title: 'Wiring Socket',
      description: 'Premium quality electrical connectors for automotive applications',
      imageUrl: '/showcase/wiring-socket.jpg',
      features: ['Weatherproof Design', 'Easy Installation', 'Durable Materials'],
      color: 'from-slate-600 to-blue-700'
    },
    {
      id: 2,
      title: 'Blower Resistance',
      description: 'Optimize airflow control with genuine blower resistors',
      imageUrl: '/showcase/blower-resistance.jpg',
      features: ['Optimize Airflow Control', 'Genuine Parts', 'Reliable Performance'],
      color: 'from-blue-500 to-slate-600'
    },
    {
      id: 3,
      title: 'Radiator Fan Resistances',
      description: 'High-performance cooling system components',
      imageUrl: '/showcase/radiator-fan.jpg',
      features: ['Multiple Variants', 'OEM Quality', 'Heat Resistant'],
      color: 'from-blue-500 to-slate-600'
    },
    {
      id: 4,
      title: 'Auto-Folding Motor Gear',
      description: 'Precision-engineered components for power mirror systems',
      imageUrl: '/showcase/motor-gear.jpg',
      features: ['Precision Components', 'Smooth Operation', 'Long Lasting'],
      color: 'from-slate-600 to-blue-600'
    }
  ]

  const slideInterval = 5000 // 5 seconds

  // Start auto-sliding on component mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length)
    }, slideInterval)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, []) // Only run on mount

  // Handle pause/resume based on state changes
  useEffect(() => {
    if (isPaused || isHovering) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    } else if (!timerRef.current) {
      // Resume auto-sliding
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length)
      }, slideInterval)
    }
  }, [isPaused, isHovering])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    // Removed temporary pause - let auto-sliding continue
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length)
    // Removed temporary pause - let auto-sliding continue
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length)
    // Removed temporary pause - let auto-sliding continue
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)
          `
        }}></div>
      </div>

      {/* Hexagon decorations - Hidden on mobile for better performance */}
      <div className="hidden sm:block absolute top-10 left-10 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-blue-500"/>
        </svg>
      </div>
      <div className="hidden sm:block absolute bottom-20 right-20 w-40 h-40 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-blue-400"/>
        </svg>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        {/* Section Header - Mobile optimized */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-2 sm:px-4">
          <div className="inline-block mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-500/20 to-blue-500/20 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-2 rounded-full border border-blue-400/30">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-blue-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Featured Products</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 text-gray-900 leading-tight px-2">
            Premium Auto Parts Collection
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
            Explore our range of high-quality automotive electrical components
          </p>
        </div>

        {/* Main Showcase Area */}
        <div 
          className="relative max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Slides Container - Mobile optimized height */}
          <div className="relative h-[450px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] 2xl:h-[600px] mx-1 sm:mx-2 md:mx-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`absolute inset-0 transition-all duration-700 transform ${
                  index === currentSlide
                    ? 'opacity-100 scale-100 z-20'
                    : index === (currentSlide - 1 + products.length) % products.length
                    ? 'opacity-0 -translate-x-full scale-95 z-10'
                    : index === (currentSlide + 1) % products.length
                    ? 'opacity-0 translate-x-full scale-95 z-10'
                    : 'opacity-0 scale-90 z-0'
                }`}
              >
                {/* Card with 3D Effect */}
                <div className="h-full perspective-1000">
                  <div className="relative h-full bg-gradient-to-br from-blue-500 via-slate-500 to-blue-600 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-200/50 overflow-hidden group">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                    
                    {/* Content Grid - Optimized for mobile */}
                    <div className="relative h-full grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
                      {/* Left: Product Info */}
                      <div className="flex flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 z-10 order-last lg:order-first">
                        {/* Product Number Badge */}
                        <div className="inline-flex items-center gap-2 self-start">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-slate-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xs sm:text-sm">{product.id}</span>
                          </div>
                              <span className="text-xs sm:text-sm md:text-base font-medium uppercase tracking-wider text-gray-300">
                            {product.title}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-200 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Features List with Icons - Compact on mobile */}
                        <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group/item">
                              <div className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-blue-500 to-slate-600 rounded-md flex items-center justify-center shadow-md group-hover/item:scale-110 transition-transform">
                                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg text-gray-200 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Product Image with Hexagon Frame - Mobile optimized */}
                      <div className="flex items-center justify-center relative order-first lg:order-last">
                        {/* Hexagonal Frame - Simplified for mobile */}
                        <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl aspect-[5/4] mx-auto">
                          {/* Animated Ring - Hidden on mobile for performance */}
                          <div className="hidden sm:block absolute inset-0 animate-spin-slow opacity-20">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              <polygon
                                points="50 1 95 25 95 75 50 99 5 75 5 25"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="0.5"
                              />
                              <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#06b6d4" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* Image Container - Mobile friendly */}
                          <div className="absolute inset-1.5 sm:inset-2 lg:inset-4 xl:inset-6 clip-hexagon sm:clip-hexagon overflow-hidden shadow-xl sm:shadow-2xl bg-slate-500 rounded-xl sm:rounded-3xl">
                            <div className="w-full h-full flex items-center justify-center p-0.5 sm:p-1 md:p-1.5 lg:p-2 xl:p-3 2xl:p-4 relative">
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                loading="lazy"
                                className="w-full h-full object-contain drop-shadow-lg sm:drop-shadow-xl"
                              />
                              <div className="hidden absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/60 sm:bg-black/45 text-white text-[9px] sm:text-[10px] lg:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-sm drop-shadow">
                                {product.title}
                              </div>
                            </div>
                          </div>

                          {/* Glow Effect - Reduced on mobile */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 sm:from-blue-500/20 to-blue-500/10 sm:to-blue-500/20 blur-2xl sm:blur-3xl animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-0.5 sm:left-1 md:left-2 lg:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-md hover:bg-white active:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 border border-gray-200 touch-manipulation"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0.5 sm:right-1 md:right-2 lg:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-md hover:bg-white active:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 border border-gray-200 touch-manipulation"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Indicators with Animation - Mobile optimized */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group relative touch-manipulation"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Outer Ring - Smaller touch target */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-300 ${
                index === currentSlide
                  ? 'border-blue-500 scale-110' 
                  : 'border-gray-400 hover:border-gray-600 hover:scale-105 active:scale-95'
              }`}>
                {/* Progress Circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-300"
                  />
                  {index === currentSlide && (
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                      strokeDasharray="100"
                      strokeDashoffset="0"
                      style={{
                        animation: isPaused || isHovering ? 'none' : `progress ${slideInterval}ms linear infinite`
                      }}
                    />
                  )}
                </svg>
              </div>

              {/* Center Dot - More visible on mobile */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                index === currentSlide ? 'scale-100' : 'scale-75'
              }`}>
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-br from-blue-500 to-slate-600 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-400 group-hover:bg-gray-600 group-active:bg-gray-500'
                }`}></div>
              </div>

              {/* Tooltip - Hidden on mobile, shown on larger screens */}
              <div className="hidden lg:block absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="text-xs text-gray-400 font-medium">{products[index].title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Pause/Play Control */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="hidden flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-all border border-white/20"
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>Play</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" />
                </svg>
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes progress {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .clip-hexagon {
          clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        @media (max-width: 1024px) {
          .clip-hexagon {
            clip-path: none;
            border-radius: 1rem;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .clip-hexagon {
            border-radius: 0.75rem;
          }

          /* Improve touch responsiveness */
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          /* Reduce motion for better performance on mobile */
          @media (prefers-reduced-motion: reduce) {
            .animate-pulse,
            .animate-spin-slow {
              animation: none;
            }
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1023px) {
          .clip-hexagon {
            border-radius: 1rem;
          }
        }

        /* Desktop optimizations */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .clip-hexagon {
            border-radius: 1.25rem;
          }
        }

        /* Large desktop optimizations */
        @media (min-width: 1280px) {
          .clip-hexagon {
            border-radius: 1.5rem;
          }
        }
      `}</style>
    </section>
  )
}
