import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  ArrowRight,
  Zap,
  CheckCircle2,
  Info,
  AlertCircle,
  ShieldCheck,
  Phone,
  Wrench,
  Camera
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { formatCurrency } from './lib/utils';

export default function BookingPage() {
  const { state } = useLocation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    serviceType: state?.diagnosis?.category || 'elec',
    subType: state?.diagnosis?.subCategory || '',
    type: state?.type || 'emergency', // Use state type if available
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    address: profile?.addresses?.[0]?.address || '',
    phone: profile?.phone || user?.phoneNumber || '',
    notes: ''
  });

  const [upiId, setUpiId] = useState('');
  const [isPaymentConfigured, setIsPaymentConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await axios.get('https://fixivobeckend.onrender.com/api/payments/config');
        setIsPaymentConfigured(response.data.configured);
      } catch (e) {
        setIsPaymentConfigured(false);
      }
    };
    checkConfig();
  }, []);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book a service');
      navigate('/login');
      return;
    }

    if (!bookingData.address || bookingData.address.length < 10) {
      toast.error('Please provide a complete address (min 10 characters)');
      return;
    }

    if (!bookingData.phone || bookingData.phone.length < 10) {
      toast.error('Please provide a valid contact number');
      return;
    }

    if (!(window as any).Razorpay && isPaymentConfigured !== false) {
      toast.error('Payment gateway is still loading. Please wait a moment.');
      return;
    }

    setLoading(true);
    console.log('Starting booking process...');
    try {
      // 1. Create PRELIMINARY Booking on Backend (status: pending, payment: pending)
      const bookingPayload = {
        userId: user.uid,
        userName: profile?.name || user.displayName || 'User',
        userPhone: bookingData.phone,
        serviceType: bookingData.serviceType,
        type: bookingData.type,
        notes: bookingData.notes,
        address: bookingData.address,
        date: bookingData.date,
        time: bookingData.time,
        paymentStatus: 'pending',
        advancePaid: false,
        amount: 99 // Explicitly state the advance amount
      };

      console.log('Creating preliminary booking record...');
      const response = await axios.post('https://fixivobeckend.onrender.com/api/bookings/create', bookingPayload);
      const booking = response.data;
      
      // Fix: Support both id and _id from server
      const bookingId = booking?._id || booking?.id;
      
      if (!bookingId) {
        console.error('Server response invalid:', booking);
        throw new Error('Failed to initialize booking record: Missing ID in response');
      }

      // 2. Create Razorpay Order linked to this booking
      let order;
      try {
        console.log('Creating Razorpay order for booking:', bookingId);
        const orderResponse = await axios.post('https://fixivobeckend.onrender.com/api/payments/create-order', {
          bookingId: bookingId,
          userId: user.uid
        }, { timeout: 10000 });
        order = orderResponse.data;
        console.log('Order created:', order);
      } catch (e: any) {
        console.error('Order Creation error:', e);
        toast.error('Failed to initialize payment: ' + (e.response?.data?.error || e.message));
        setLoading(false);
        return;
      }

      // 3. Check if checkout script is loaded
      if (!(window as any).Razorpay) {
        toast.error('Payment gateway not loaded. Please try again.');
        setLoading(false);
        return;
      }

      // 4. Open Razorpay Checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Fixivo – 24/7 SERVICE",
        description: "Advance Booking Fee",
        order_id: order.id,
        handler: async (response: any) => {
          setLoading(true);
          try {
            console.log('Verifying payment signature...');
            await axios.post('https://fixivobeckend.onrender.com/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId // Use unified bookingId
            });
            
            console.log('Payment verified! Syncing complete.');

            toast.success('Booking confirmed! Finding expert...');
            // Redirect to Profile Page where Booking History is shown
            navigate('/profile');
          } catch (e: any) {
            console.error('Finalization Error:', e);
            toast.error('Payment verification failed.');
            setLoading(false);
          }
        },
        prefill: {
          name: profile?.name || user.displayName || 'User',
          email: user.email,
          contact: profile?.phone || '9999999999', // Default contact to avoid Razorpay prompt blocking UPI direct
          method: 'upi', // This will prioritize UPI in the payment selector
          vpa: upiId || undefined // Pre-fill UPI ID if provided
        },
        config: {
          display: {
            preferences: {
              show_default_blocks: true // Ensures standard blocks like UPI QR show up
            }
          }
        },
        theme: {
          color: "#FFD700"
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled', { icon: 'ℹ️' });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        toast.error('Payment failed: ' + resp.error.description);
        setLoading(false);
      });
      rzp.open();

    } catch (error: any) {
      console.error('Booking Error:', error);
      toast.error('Booking failed: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-yellow-400 pt-32 pb-20 px-6 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Book Your Service</h1>
          <p className="text-gray-800 font-medium">Professional help is just a few clicks away.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Service Selection */}
            <div className="neumorph p-8 rounded-3xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Service Details
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setBookingData({...bookingData, type: 'emergency'})}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${bookingData.type === 'emergency' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'}`}
                >
                  <p className="font-bold text-gray-900">Emergency</p>
                  <p className="text-xs text-gray-500">Instant Priority</p>
                </button>
                <button 
                  onClick={() => setBookingData({...bookingData, type: 'pre-book'})}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${bookingData.type === 'pre-book' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'}`}
                >
                  <p className="font-bold text-gray-900">Pre-book</p>
                  <p className="text-xs text-gray-500">Schedule Ahead</p>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Service Category</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'elec', label: 'Electrical', icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
                      { id: 'plum', label: 'Plumbing', icon: MapPin, color: 'bg-blue-50 text-blue-600' },
                      { id: 'cctv', label: 'CCTV Installation', icon: Camera, color: 'bg-orange-50 text-orange-600' },
                      { id: 'rep', label: 'Repair', icon: ShieldCheck, color: 'bg-purple-50 text-purple-600' },
                      { id: 'other', label: 'Other', icon: Wrench, color: 'bg-gray-50 text-gray-600' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setBookingData({...bookingData, serviceType: cat.id})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          bookingData.serviceType === cat.id 
                            ? 'border-yellow-400 bg-yellow-50/50 shadow-lg shadow-yellow-100' 
                            : 'border-gray-100 bg-gray-50/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-gray-900">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Describe Your Problem *</label>
                  <textarea 
                    placeholder="Briefly explain the issue (e.g. Light not working, tap leaking, etc.). This will be shown to the responding expert."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 rounded-2xl outline-none font-medium min-h-[100px] transition-all"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={profile?.name || user?.displayName || ''}
                      disabled
                      className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl outline-none font-bold text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Contact Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="tel" 
                        placeholder="Enter 10-digit mobile"
                        value={bookingData.phone}
                        onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 pl-12 rounded-2xl outline-none font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Service Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                    <textarea 
                      placeholder="Enter full address in Kannur (House No, Landmark, etc.)"
                      value={bookingData.address}
                      onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 pl-12 rounded-2xl outline-none font-medium min-h-[100px] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neumorph p-8 rounded-3xl"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                {bookingData.type === 'emergency' ? 'Preferred Time (Emergency)' : 'Schedule Time'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="bg-gray-50 p-4 rounded-2xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                />
                <input 
                  type="time" 
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="bg-gray-50 p-4 rounded-2xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                />
              </div>
              {bookingData.type === 'emergency' && (
                <p className="mt-4 text-xs text-gray-400 italic">
                  * For emergency bookings, we aim to arrive within 30-60 minutes regardless of the selected time.
                </p>
              )}
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="glass p-8 rounded-[2.5rem] sticky top-24">
              <h3 className="text-xl font-bold mb-6">Booking Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span className="font-bold text-gray-900">TBD</span>
                </div>
                <div className="flex justify-between text-yellow-600 bg-yellow-50 p-3 rounded-xl font-bold">
                  <span>Advance (Non-refundable)</span>
                  <span>{formatCurrency(99)}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-8 flex gap-3">
                <Info className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  The ₹99 advance is required to confirm your booking and assign a professional. 
                  This will be adjusted in the final bill.
                </p>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  Pay Faster (Optional)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Enter UPI ID (e.g. user@okaxis)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-400 p-4 pl-10 rounded-2xl outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleBooking}
                disabled={loading || isPaymentConfigured === false}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-gray-200"
              >
                {loading ? 'Processing...' : (isPaymentConfigured === false ? 'Payment Not Connected' : 'Pay ₹99 & Book')}
                {!loading && isPaymentConfigured !== false && <ArrowRight className="w-5 h-5" />}
              </button>

              {isPaymentConfigured === false && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">
                    <b>Admin:</b> Razorpay keys are missing. Please add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to your environment variables.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-4 grayscale opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Razorpay_logo.svg" className="h-4" alt="Razorpay" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
