import { useState, useEffect } from 'react'

/**
 * Phone Input Component with Country Code Selector
 * Combines country code dropdown with phone number input
 * Includes real-time WhatsApp availability checking
 */
export default function PhoneInput({ 
  value = '', 
  onChange, 
  required = false,
  placeholder = '1234567890',
  id = 'phone',
  name = 'phone',
  showWhatsAppCheck = false,
  onWhatsAppStatus = null
}) {
  // Common country codes
  const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  ]

  // Parse existing value to separate country code and number
  const parsePhone = (phoneValue) => {
    if (!phoneValue) return { countryCode: '+91', number: '' }
    
    // Find matching country code
    for (const cc of countryCodes) {
      if (phoneValue.startsWith(cc.code)) {
        return {
          countryCode: cc.code,
          number: phoneValue.substring(cc.code.length)
        }
      }
    }
    
    // Default to India if no match
    return { countryCode: '+91', number: phoneValue }
  }

  const { countryCode: initialCode, number: initialNumber } = parsePhone(value)
  const [countryCode, setCountryCode] = useState(initialCode)
  const [phoneNumber, setPhoneNumber] = useState(initialNumber)
  
  // WhatsApp checking states
  const [whatsappStatus, setWhatsappStatus] = useState(null) // null, 'checking', 'available', 'unavailable', 'error'
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [checkTimeout, setCheckTimeout] = useState(null)

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value
    setCountryCode(newCode)
    // Reset WhatsApp status when country changes
    setWhatsappStatus(null)
    setWhatsappMessage('')
    // Call parent onChange with combined value
    onChange({ target: { name, value: newCode + phoneNumber } })
  }

  const handlePhoneNumberChange = (e) => {
    const newNumber = e.target.value.replace(/[^0-9]/g, '') // Only allow digits
    
    // Limit input based on country code requirements
    const maxLength = getMaxLengthForCountry(countryCode)
    const truncatedNumber = newNumber.slice(0, maxLength)
    
    setPhoneNumber(truncatedNumber)
    
    // Clear existing timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }

    const fullPhone = countryCode + truncatedNumber
    
    // Call parent onChange with combined value
    onChange({ target: { name, value: fullPhone } })

    // Check WhatsApp availability with debounce (wait 1 second after user stops typing)
    if (showWhatsAppCheck && truncatedNumber.length >= getMinLengthForCountry(countryCode)) {
      setWhatsappStatus('checking')
      setWhatsappMessage('')
      
      const timeout = setTimeout(() => {
        checkWhatsAppAvailability(fullPhone)
      }, 1000)
      
      setCheckTimeout(timeout)
    } else if (showWhatsAppCheck && truncatedNumber.length > 0) {
      // Show length validation message
      const requiredLength = getRequiredLengthForCountry(countryCode)
      const currentLength = truncatedNumber.length
      
      if (currentLength < requiredLength) {
        setWhatsappStatus('unavailable')
        setWhatsappMessage(`Please enter ${requiredLength} digits (currently ${currentLength})`)
      } else {
        setWhatsappStatus(null)
        setWhatsappMessage('')
      }
    } else {
      setWhatsappStatus(null)
      setWhatsappMessage('')
    }
  }

  // Helper functions for country-specific validation
  const getRequiredLengthForCountry = (code) => {
    const lengths = {
      '+91': 10, // India
      '+1': 10,  // USA/Canada
      '+44': 10, // UK
      '+971': 9, // UAE
      '+966': 9, // Saudi Arabia
      '+965': 8, // Kuwait
      '+973': 8, // Bahrain
      '+974': 8, // Qatar
      '+968': 8, // Oman
      '+60': 9,  // Malaysia
      '+65': 8,  // Singapore
      '+92': 10, // Pakistan
    }
    return lengths[code] || 10
  }

  const getMaxLengthForCountry = (code) => {
    return getRequiredLengthForCountry(code) + 1 // Allow one extra for better UX
  }

  const getMinLengthForCountry = (code) => {
    return getRequiredLengthForCountry(code) // Must be exact length
  }

  const getPlaceholderForCountry = (code) => {
    const placeholders = {
      '+91': '9876543210',  // India - 10 digits starting with 6-9
      '+1': '2345678901',   // USA/Canada - 10 digits
      '+44': '7123456789',  // UK - 10 digits starting with 7
      '+971': '501234567',  // UAE - 9 digits starting with 50-59
      '+966': '512345678',  // Saudi Arabia - 9 digits starting with 5
      '+965': '91234567',   // Kuwait - 8 digits
      '+973': '31234567',   // Bahrain - 8 digits
      '+974': '31234567',   // Qatar - 8 digits
      '+968': '91234567',   // Oman - 8 digits
      '+60': '123456789',   // Malaysia - 9 digits
      '+65': '81234567',    // Singapore - 8 digits
      '+92': '3123456789',  // Pakistan - 10 digits starting with 3
    }
    return placeholders[code] || placeholder || '1234567890'
  }

  const checkWhatsAppAvailability = async (fullPhone) => {
    try {
      const response = await fetch('/api/verify/check-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: fullPhone })
      })

      const data = await response.json()

      if (response.ok && data.available && data.reason !== 'duplicate') {
        setWhatsappStatus('available')
        setWhatsappMessage(`Valid 10-digit number available on WhatsApp`)
        if (onWhatsAppStatus) onWhatsAppStatus({ available: true, phone: fullPhone })
      } else {
        setWhatsappStatus('unavailable')
        // Show the specific error message from the API
        const errorMessage = data.error || data.message || 'This phone number is not available'
        setWhatsappMessage(errorMessage)
        if (onWhatsAppStatus) onWhatsAppStatus({ 
          available: false, 
          phone: fullPhone, 
          reason: data.reason,
          message: errorMessage 
        })
      }
    } catch (error) {
      console.error('WhatsApp check error:', error)
      setWhatsappStatus('error')
      setWhatsappMessage('Could not verify phone number. Please check your connection.')
      if (onWhatsAppStatus) onWhatsAppStatus({ available: false, phone: fullPhone, error: true })
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={handleCountryCodeChange}
          className="input-field w-32 flex-shrink-0"
          aria-label="Country Code"
        >
          {countryCodes.map((cc) => (
            <option key={cc.code} value={cc.code}>
              {cc.flag} {cc.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          className="input-field flex-1"
          placeholder={getPlaceholderForCountry(countryCode)}
          required={required}
          pattern="[0-9]*"
          inputMode="numeric"
          maxLength={getMaxLengthForCountry(countryCode)}
        />
      </div>

      {/* WhatsApp Availability Status */}
      {showWhatsAppCheck && whatsappStatus && (
        <div className={`mt-2 px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
          whatsappStatus === 'checking' ? 'bg-blue-50 text-blue-700' :
          whatsappStatus === 'available' ? 'bg-green-50 text-green-700' :
          whatsappStatus === 'unavailable' ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        }`}>
          {whatsappStatus === 'checking' && (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying...</span>
            </>
          )}
          {whatsappStatus === 'available' && (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{whatsappMessage}</span>
            </>
          )}
          {whatsappStatus === 'unavailable' && (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{whatsappMessage}</span>
            </>
          )}
          {whatsappStatus === 'error' && (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{whatsappMessage}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
