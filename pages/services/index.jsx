import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import siteConfig from '@/site.config'
import { supabase } from '@/lib/supabaseClient'

/**
 * Services Booking Page
 * Book repair, installation, and maintenance services
 */
export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    serviceType: '',
    description: '',
    preferredDate: '',
    preferredTime: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const serviceTypes = siteConfig.services.repair.serviceTypes

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (serviceSlug) => {
    setSelectedService(serviceSlug)
    const service = serviceTypes.find(s => s.slug === serviceSlug)
    setFormData(prev => ({ ...prev, serviceType: service?.name || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Save booking to database
      const { data: bookingData, error: bookingError } = await supabase
        .from('service_bookings')
        .insert([
          {
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_address: formData.address,
            service_type: formData.serviceType,
            description: formData.description,
            preferred_date: formData.preferredDate,
            preferred_time: formData.preferredTime,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (bookingError) throw bookingError

      // Also send WhatsApp notification
      const message = `*Service Booking Request*\n\nBooking #: ${bookingData.booking_number}\nName: ${formData.name}\nPhone: ${formData.phone}\nService: ${formData.serviceType}\nDescription: ${formData.description}\nPreferred Date: ${formData.preferredDate}\nPreferred Time: ${formData.preferredTime}\nAddress: ${formData.address}`
      
      const whatsappUrl = siteConfig.getWhatsAppLink(message)
      window.open(whatsappUrl, '_blank')

      setSubmitMessage({
        type: 'success',
        text: `Booking confirmed! Your booking number is ${bookingData.booking_number}. A WhatsApp message has been sent to confirm your appointment.`
      })

      // Reset form
      setFormData({
        name: '',
        phone: '',
        address: '',
        serviceType: '',
        description: '',
        preferredDate: '',
        preferredTime: ''
      })
      setSelectedService('')
    } catch (error) {
      console.error('Booking error:', error)
      setSubmitMessage({
        type: 'error',
        text: 'Something went wrong. Please try calling us directly.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Head>
        <title>Book a Service - {siteConfig.brandName}</title>
        <meta name="description" content="Book repair, installation, and maintenance services for electronics, solar systems, and furniture. Expert technicians in Daryapur." />
        <meta name="keywords" content="service booking, AC repair, refrigerator service, solar maintenance, installation, Daryapur" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-500 to-indigo-700 text-white py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <span className="text-5xl">{siteConfig.services.repair.icon}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Book a Service
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-indigo-100">
                Expert repair, installation, and maintenance services at your doorstep
              </p>
            </div>
          </div>
        </section>

        {/* Service Types Selection */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Select Service Type
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
              {serviceTypes.map((service) => (
                <button
                  key={service.slug}
                  onClick={() => handleServiceSelect(service.slug)}
                  className={`p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 text-left ${
                    selectedService === service.slug
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl scale-105'
                      : 'bg-white hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedService === service.slug
                        ? 'bg-white/20'
                        : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                    }`}>
                      <span className="text-2xl">{service.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 ${
                        selectedService === service.slug ? 'text-white' : 'text-gray-800'
                      }`}>
                        {service.name}
                      </h3>
                      <p className={`text-sm ${
                        selectedService === service.slug ? 'text-indigo-100' : 'text-gray-600'
                      }`}>
                        {service.description}
                      </p>
                    </div>
                  </div>
                  {selectedService === service.slug && (
                    <div className="mt-3 flex items-center gap-2 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Booking Form */}
            {selectedService && (
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Enter Booking Details</h3>
                
                {submitMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    submitMessage.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {submitMessage.type === 'success' ? (
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <p className="text-sm">{submitMessage.text}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <input
                      type="text"
                      name="serviceType"
                      value={formData.serviceType}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Describe the issue or service requirement..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        min={today}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Time *
                      </label>
                      <select
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select time slot</option>
                        <option value="9:00 AM - 12:00 PM">Morning (9 AM - 12 PM)</option>
                        <option value="12:00 PM - 3:00 PM">Afternoon (12 PM - 3 PM)</option>
                        <option value="3:00 PM - 6:00 PM">Evening (3 PM - 6 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter complete address with landmarks"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Book Service'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService('')
                        setFormData({
                          name: '',
                          phone: '',
                          address: '',
                          serviceType: '',
                          description: '',
                          preferredDate: '',
                          preferredTime: ''
                        })
                      }}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Why Choose Our Services */}
            {!selectedService && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Why Choose Our Services?
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Expert Technicians</h3>
                    <p className="text-sm text-gray-600">Certified and experienced professionals</p>
                  </div>

                  <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Same-Day Service</h3>
                    <p className="text-sm text-gray-600">Quick response and fast turnaround</p>
                  </div>

                  <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Service Warranty</h3>
                    <p className="text-sm text-gray-600">Guaranteed work with warranty coverage</p>
                  </div>

                  <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold mb-2">Fair Pricing</h3>
                    <p className="text-sm text-gray-600">Transparent and competitive rates</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Need Immediate Assistance?
            </h2>
            <p className="text-lg text-indigo-100 mb-8">
              Call us directly for urgent service requests
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={siteConfig.getPhoneLink()}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-semibold shadow-lg inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {siteConfig.contact.phoneFormatted}
              </a>
              <a
                href={siteConfig.getWhatsAppLink('Hi, I need service assistance')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-white bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:text-indigo-600 transition-all font-semibold inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
