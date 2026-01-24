import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import CustomerLayout from '@/components/CustomerLayout'
import useSimpleAuth from '@/hooks/useSimpleAuth'
import { supabase } from '@/lib/supabaseClient'
import siteConfig from '@/site.config'

/**
 * Multi-Step Checkout Page
 * Step 1: Contact/Login → Step 2: Address/Delivery → Step 3: Payment → Step 4: Confirmation
 * Mobile-optimized with progress tracking and validation
 */
export default function CheckoutPage() {
  const router = useRouter()
  const { customer } = useSimpleAuth()
  
  // Checkout steps
  const [currentStep, setCurrentStep] = useState(1)
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Form data
  const [contactData, setContactData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  
  const [addressData, setAddressData] = useState({
    street: '',
    landmark: '',
    city: 'Daryapur',
    district: 'Amravati',
    state: 'Maharashtra',
    pincode: '',
    deliveryNotes: ''
  })
  
  const [paymentData, setPaymentData] = useState({
    method: 'cod', // cod, online, later
    notes: ''
  })
  
  const [orderResult, setOrderResult] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (customer) {
      // Pre-fill contact data from customer
      setContactData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || ''
      })
      fetchCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  async function fetchCart() {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            id,
            name,
            brand,
            categories(name),
            images:product_images(image_url, is_primary)
          )
        `)
        .eq('customer_id', customer.id)

      if (error) throw error
      
      if (!data || data.length === 0) {
        router.push('/customer/cart')
        return
      }
      
      setCartItems(data)
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Failed to load cart items')
      router.push('/customer/cart')
    } finally {
      setLoading(false)
    }
  }

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {}
    if (!contactData.name.trim()) newErrors.name = 'Name is required'
    if (!contactData.phone.trim()) newErrors.phone = 'Phone is required'
    else if (!/^[0-9]{10}$/.test(contactData.phone)) newErrors.phone = 'Invalid phone number (10 digits)'
    if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      newErrors.email = 'Invalid email address'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!addressData.street.trim()) newErrors.street = 'Street address is required'
    if (!addressData.city.trim()) newErrors.city = 'City is required'
    if (!addressData.pincode.trim()) newErrors.pincode = 'Pincode is required'
    else if (!/^[0-9]{6}$/.test(addressData.pincode)) newErrors.pincode = 'Invalid pincode (6 digits)'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors = {}
    if (!paymentData.method) newErrors.method = 'Please select a payment method'
    if (paymentData.method === 'online' && (!paymentData.amount || paymentData.amount <= 0)) {
      newErrors.amount = 'Please enter a valid amount'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step navigation
  const goToNextStep = () => {
    let isValid = false
    
    if (currentStep === 1) isValid = validateStep1()
    else if (currentStep === 2) isValid = validateStep2()
    else if (currentStep === 3) isValid = validateStep3()
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Place order
  const placeOrder = async () => {
    if (!validateStep3()) return
    
    setProcessing(true)

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          status: 'pending',
          customer_name: contactData.name,
          customer_phone: contactData.phone,
          customer_email: contactData.email,
          delivery_address: `${addressData.street}, ${addressData.landmark ? addressData.landmark + ', ' : ''}${addressData.city}, ${addressData.district}, ${addressData.state} - ${addressData.pincode}`,
          delivery_notes: addressData.deliveryNotes,
          payment_method: paymentData.method,
          payment_notes: paymentData.notes,
          payment_status: paymentData.method === 'online' ? 'pending' : 'cod'
        })
        .select('*')
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_code: item.product.brand || '',
        quantity: item.quantity,
        admin_price: 0,
        admin_total: 0,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // If online payment, initiate Razorpay
      if (paymentData.method === 'online' && paymentData.amount > 0) {
        await initiateRazorpayPayment(orderData, paymentData.amount)
        setProcessing(false)
        return
      }

      // For COD/Later, proceed normally
      await completeOrderProcess(orderData)
      
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
      setProcessing(false)
    }
  }

  // Initiate Razorpay payment
  const initiateRazorpayPayment = async (order, amount) => {
    try {
      // Create Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: amount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: siteConfig.brandName,
        description: `Order #${order.order_number}`,
        order_id: data.orderId,
        handler: async function (response) {
          // Payment successful
          await handlePaymentSuccess(response, order)
        },
        prefill: {
          name: contactData.name,
          email: contactData.email,
          contact: contactData.phone
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
            alert('Payment cancelled. Your order has been saved. You can complete payment later from order details.')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
      
    } catch (error) {
      console.error('Razorpay initialization error:', error)
      alert('Failed to initialize payment. Please try again or choose another payment method.')
      setProcessing(false)
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async (razorpayResponse, order) => {
    try {
      setProcessing(true)

      // Verify payment
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          orderId: order.id
        })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error('Payment verification failed')
      }

      // Complete order process
      await completeOrderProcess(order)
      
    } catch (error) {
      console.error('Payment verification error:', error)
      alert('Payment completed but verification failed. Please contact support.')
      setProcessing(false)
    }
  }

  // Complete order process (clear cart, send notifications, etc.)
  const completeOrderProcess = async (orderData) => {
    try {
      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customer.id)

      if (clearError) throw clearError

      // Send push notification to admins
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Order Received',
            message: `Order #${orderData.order_number} placed by ${contactData.name}`,
            url: `/admin/orders/${orderData.id}`,
            userType: 'admin'
          })
        })
      } catch (pushError) {
        console.error('Push notification error:', pushError)
      }

      // Update cart count
      window.dispatchEvent(new Event('cart-updated'))

      // Set order result and move to confirmation step
      setOrderResult(orderData)
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setProcessing(false)
      
    } catch (error) {
      console.error('Error completing order:', error)
      throw error
    }
  }

  const getProductImage = (product) => {
    const primaryImage = product.images?.find(img => img.is_primary)
    return primaryImage?.image_url || product.images?.[0]?.image_url || '/placeholder-product.png'
  }

  const steps = [
    { number: 1, name: 'Contact', icon: '👤' },
    { number: 2, name: 'Delivery', icon: '📍' },
    { number: 3, name: 'Payment', icon: '💳' },
    { number: 4, name: 'Confirm', icon: '✅' }
  ]

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <Head>
        <title>Checkout - {siteConfig.brandName}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Checkout
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{cartItems.length} item(s) in your order</p>
        </div>

        {/* Progress Indicator - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs sm:text-sm mt-2 font-medium ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-1 sm:mx-2 transition-all ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 mb-6 lg:mb-0">
            <div className="card">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    Contact Information
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    We'll use this information to keep you updated about your order
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                        pattern="[0-9]{10}"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="10-digit mobile number"
                      />
                      {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={goToNextStep}
                      className="flex-1 btn-primary py-3 touch-manipulation"
                    >
                      Continue to Delivery
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Delivery Address */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    Delivery Address
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Where should we deliver your order?
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="House/Flat no., Street name"
                      />
                      {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={addressData.landmark}
                        onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Near temple, hospital, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={addressData.pincode}
                          onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                          pattern="[0-9]{6}"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.pincode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="444803"
                        />
                        {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District
                        </label>
                        <input
                          type="text"
                          value={addressData.district}
                          onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Instructions (Optional)
                      </label>
                      <textarea
                        value={addressData.deliveryNotes}
                        onChange={(e) => setAddressData({ ...addressData, deliveryNotes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Any specific instructions for delivery..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={goToPrevStep}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold touch-manipulation"
                    >
                      Back
                    </button>
                    <button
                      onClick={goToNextStep}
                      className="flex-1 btn-primary py-3 touch-manipulation"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    Payment Method
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Choose how you'd like to pay for your order
                  </p>

                  <div className="space-y-4">
                    {/* Cash on Delivery */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${
                      paymentData.method === 'cod'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentData.method === 'cod'}
                          onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                          className="mt-1 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">💵</span>
                            <span className="font-semibold text-gray-900">Cash on Delivery</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Pay when you receive your order. Our team will provide the final price.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Pay Later (Quote First) */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${
                      paymentData.method === 'later'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="later"
                          checked={paymentData.method === 'later'}
                          onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                          className="mt-1 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">📋</span>
                            <span className="font-semibold text-gray-900">Get Quote First</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Receive a detailed price quote before making any payment decision.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Online Payment */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${
                      paymentData.method === 'online'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value="online"
                          checked={paymentData.method === 'online'}
                          onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                          className="mt-1 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">💳</span>
                            <span className="font-semibold text-gray-900">Pay Online</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Secure</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Pay securely with UPI, Cards, Net Banking via Razorpay
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Amount input for online payment */}
                    {paymentData.method === 'online' && (
                      <div className="ml-11 -mt-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Amount to Pay (₹) *
                        </label>
                        <input
                          type="number"
                          value={paymentData.amount || ''}
                          onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                          placeholder="Enter amount in rupees"
                          step="0.01"
                          min="1"
                          required
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.amount ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Admin will provide final pricing. You can pay partial or full amount.
                        </p>
                      </div>
                    )}

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special requests or notes about payment..."
                      />
                    </div>
                  </div>

                  {errors.method && (
                    <p className="text-red-600 text-sm mt-4">{errors.method}</p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={goToPrevStep}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold touch-manipulation"
                    >
                      Back
                    </button>
                    <button
                      onClick={placeOrder}
                      disabled={processing}
                      className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Placing Order...
                        </span>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 4 && orderResult && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Order Placed Successfully!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Order #{orderResult.order_number}
                  </p>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-left">
                    <h3 className="font-bold text-gray-900 mb-4">What's Next?</h3>
                    <ul className="space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="text-xl">📞</span>
                        <span>Our team will contact you on <strong>{contactData.phone}</strong> to confirm your order</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl">💰</span>
                        <span>You'll receive a detailed price quote for all items</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl">🚚</span>
                        <span>Delivery will be scheduled based on product availability</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-xl">✅</span>
                        <span>Track your order status in the Orders section</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/customer/orders/${orderResult.id}`}
                      className="btn-primary inline-block px-6 py-3 touch-manipulation"
                    >
                      View Order Details
                    </Link>
                    <Link
                      href="/products"
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold inline-block touch-manipulation"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4 bg-gradient-to-br from-slate-50 to-blue-50">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={getProductImage(item.product)}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600">Total Quantity</span>
                  <span className="font-semibold">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Final pricing will be provided after our team reviews your order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
