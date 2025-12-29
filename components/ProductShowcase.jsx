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

  // Auto-slide functionality
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Start auto-sliding if not paused and not hovering
    if (!isPaused && !isHovering) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length)
      }, slideInterval)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPaused, isHovering, products.length, slideInterval])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 3000) // Resume after 3 seconds
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 3000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 3000)
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)
          `
        }}></div>
      </div>

      {/* Hexagon decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-cyan-400"/>
        </svg>
      </div>
      <div className="absolute bottom-20 right-20 w-40 h-40 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" className="text-blue-400"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm px-6 py-2 rounded-full border border-cyan-400/30">
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-cyan-300 font-semibold text-sm uppercase tracking-wider">Featured Products</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Premium Auto Parts Collection
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Explore our range of high-quality automotive electrical components
          </p>
        </div>

        {/* Main Showcase Area */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Slides Container */}
          <div className="relative h-[600px] sm:h-[500px] lg:h-[550px]">
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
                    
                    {/* Content Grid */}
                    <div className="relative h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 sm:p-8 lg:p-12">
                      {/* Left: Product Info */}
                      <div className="flex flex-col justify-center space-y-4 sm:space-y-6 z-10 order-last lg:order-first">
                        {/* Product Number Badge */}
                        <div className="inline-flex items-center gap-2 self-start">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">{product.id}</span>
                          </div>
                          <span className="text-cyan-300 text-sm font-medium uppercase tracking-wider">
                            Item #{product.id.toString().padStart(3, '0')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                          {product.title}
                        </h3>

                        {/* Description */}
                        <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Features List with Icons */}
                        <div className="space-y-2 sm:space-y-3">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 group/item">
                              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-md flex items-center justify-center shadow-md group-hover/item:scale-110 transition-transform">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-sm sm:text-base text-gray-200 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Product Image with Hexagon Frame */}
                      <div className="flex items-center justify-center relative order-first lg:order-last">
                        {/* Hexagonal Frame */}
                        <div className="relative w-full max-w-[280px] sm:max-w-sm lg:max-w-md aspect-square mx-auto">
                          {/* Animated Ring */}
                          <div className="absolute inset-0 animate-spin-slow opacity-20">
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

                          {/* Image Container */}
                          <div className="absolute inset-2 sm:inset-4 lg:inset-6 clip-hexagon overflow-hidden shadow-2xl bg-slate-900">
                            <div className="w-full h-full flex items-center justify-center p-2 sm:p-3 lg:p-4 relative">
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                loading="lazy"
                                className="w-full h-full object-contain drop-shadow-xl"
                              />
                              <div className="absolute bottom-2 right-2 bg-black/45 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm drop-shadow">
                                {product.title}
                              </div>
                            </div>
                          </div>

                          {/* Glow Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 border border-white/20"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 border border-white/20"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress Indicators with Animation */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group relative"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Outer Ring */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 ${
                index === currentSlide 
                  ? 'border-cyan-400 scale-110' 
                  : 'border-gray-600 hover:border-gray-400 hover:scale-105'
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

              {/* Center Dot */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                index === currentSlide ? 'scale-100' : 'scale-75'
              }`}>
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/50' 
                    : 'bg-gray-600 group-hover:bg-gray-400'
                }`}></div>
              </div>

              {/* Tooltip */}
              <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
      `}</style>
    </section>
  )
}
