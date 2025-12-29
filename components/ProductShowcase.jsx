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
      color: 'from-cyan-500 to-blue-600'
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
      color: 'from-slate-700 to-cyan-600'
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
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
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
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-cyan-400"/>
        </svg>
      </div>
      <div className="hidden sm:block absolute bottom-20 right-20 w-40 h-40 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-blue-400"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Mobile optimized */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 px-4">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm px-4 sm:px-6 py-2 rounded-full border border-cyan-400/30">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-cyan-300 font-semibold text-xs sm:text-sm uppercase tracking-wider">Featured Products</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-white leading-tight px-2">
            Premium Auto Parts Collection
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed px-2">
            Explore our range of high-quality automotive electrical components
          </p>
        </div>

        {/* Main Showcase Area */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Slides Container - Mobile optimized height */}
          <div className="relative h-[500px] sm:h-[450px] lg:h-[500px] xl:h-[550px] mx-2 sm:mx-4">
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
                  <div className="relative h-full bg-gradient-to-br from-slate-800/90 to-blue-900/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-cyan-400/20 overflow-hidden group">
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                    
                    {/* Content Grid - Optimized for mobile */}
                    <div className="relative h-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 xl:p-12">
                      {/* Left: Product Info */}
                      <div className="flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-6 z-10 order-last lg:order-first">
                        {/* Product Number Badge */}
                        <div className="inline-flex items-center gap-2 self-start">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xs sm:text-sm">{product.id}</span>
                          </div>
                          <span className="text-cyan-300 text-xs sm:text-sm font-medium uppercase tracking-wider">
                            Item #{product.id.toString().padStart(3, '0')}
                          </span>
                        </div>

                        {/* Title - Better mobile sizing */}
                        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight">
                          {product.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Features List with Icons - Compact on mobile */}
                        <div className="space-y-2 sm:space-y-3">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 sm:gap-3 group/item">
                              <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-md flex items-center justify-center shadow-md group-hover/item:scale-110 transition-transform">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-200 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Product Image with Hexagon Frame - Mobile optimized */}
                      <div className="flex items-center justify-center relative order-first lg:order-last">
                        {/* Hexagonal Frame - Simplified for mobile */}
                        <div className="relative w-full max-w-[240px] sm:max-w-[280px] lg:max-w-sm xl:max-w-md aspect-square mx-auto">
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
                          <div className="absolute inset-1.5 sm:inset-2 lg:inset-4 xl:inset-6 clip-hexagon sm:clip-hexagon overflow-hidden shadow-xl sm:shadow-2xl bg-slate-900 rounded-xl sm:rounded-3xl">
                            <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2 lg:p-3 xl:p-4 relative">
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                loading="lazy"
                                className="w-full h-full object-contain drop-shadow-lg sm:drop-shadow-xl"
                              />
                              <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/60 sm:bg-black/45 text-white text-[9px] sm:text-[10px] lg:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-sm drop-shadow">
                                {product.title}
                              </div>
                            </div>
                          </div>

                          {/* Glow Effect - Reduced on mobile */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 sm:from-cyan-500/20 to-blue-500/10 sm:to-blue-500/20 blur-2xl sm:blur-3xl animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Touch friendly */}
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 lg:left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/15 backdrop-blur-md hover:bg-white/25 active:bg-white/30 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/30 touch-manipulation"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 lg:right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/15 backdrop-blur-md hover:bg-white/25 active:bg-white/30 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/30 touch-manipulation"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Indicators with Animation - Mobile optimized */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group relative touch-manipulation"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Outer Ring - Larger touch target on mobile */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 transition-all duration-300 ${
                index === currentSlide
                  ? 'border-cyan-400 scale-110'
                  : 'border-gray-600 hover:border-gray-400 hover:scale-105 active:scale-95'
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
                    className="text-gray-700"
                  />
                  {index === currentSlide && (
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-cyan-400"
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
                <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/50'
                    : 'bg-gray-600 group-hover:bg-gray-400 group-active:bg-gray-300'
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
      `}</style>
    </section>
  )
}
