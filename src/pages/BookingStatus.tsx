import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  ArrowLeft,
  Star,
  Wrench,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { LogoLoader } from "./components/LogoLoader";
import { formatCurrency } from "./lib/utils";
import toast from "react-hot-toast";

export default function BookingStatus() {
  const { id } = useParams();
  const { supportNumber } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "bookings", id), (docSnap) => {
      if (docSnap.exists()) {
        setBooking({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!id || !booking.workerId) return;
    setSubmittingReview(true);
    try {
      const { updateDoc, doc, getDoc, increment } =
        await import("firebase/firestore");

      // 1. Update the booking with review
      await updateDoc(doc(db, "bookings", id), {
        reviewed: true,
        rating,
        comment,
        reviewedAt: new Date().toISOString(),
      });

      // 2. Update the worker status if possible
      const workerRef = doc(db, "workers", booking.workerId);
      const workerSnap = await getDoc(workerRef);

      if (workerSnap.exists()) {
        const workerData = workerSnap.data();
        const currentTotalRating =
          (workerData.rating || 0) * (workerData.ratingCount || 0);
        const newRatingCount = (workerData.ratingCount || 0) + 1;
        const newAverageRating = (currentTotalRating + rating) / newRatingCount;

        await updateDoc(workerRef, {
          rating: Number(newAverageRating.toFixed(1)),
          ratingCount: newRatingCount,
          leaderboardScore: increment(rating * 10), // Bonus points for rating (e.g. 5 stars = 50 pts)
        });
      }

      toast.success("Thank you for your feedback! Rating updated.");
    } catch (error: any) {
      console.error("Review Error:", error);
      toast.error("Failed to submit review: " + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LogoLoader />;
  if (!booking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
        <Link to="/" className="text-yellow-500 font-bold">
          Return Home
        </Link>
      </div>
    );

  const statusColors: any = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    assigned: "bg-purple-100 text-purple-700",
    "in-progress": "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 pt-32 pb-20 px-6 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto flex justify-between items-end">
          <div>
            <Link
              to="/"
              className="text-gray-400 flex items-center gap-2 mb-6 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-black text-white mb-2">
              Booking Status
            </h1>
            <p className="text-gray-400">
              Order ID: #{booking.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <div
            className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider ${statusColors[booking.status]}`}
          >
            {booking.status}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Status Card */}
          <div className="neumorph p-10 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap className="w-32 h-32 text-yellow-500" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Service Progress
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                {booking.status === "confirmed"
                  ? "Searching for the best expert near you..."
                  : booking.status === "assigned"
                    ? "Expert assigned and preparing to visit."
                    : booking.status === "in-progress"
                      ? "Service is currently being performed."
                      : booking.status === "completed"
                        ? "Service completed successfully!"
                        : "Status updated."}
              </p>

              <div className="space-y-12">
                {[
                  {
                    label: "Booking Confirmed",
                    status: [
                      "confirmed",
                      "assigned",
                      "in-progress",
                      "completed",
                    ],
                    desc: "Your request has been received",
                  },
                  {
                    label: "Professional Assigned",
                    status: ["assigned", "in-progress", "completed"],
                    desc: "Expert is on the way",
                  },
                  {
                    label: "Work in Progress",
                    status: ["in-progress", "completed"],
                    desc: "Service is being performed",
                  },
                  {
                    label: "Completed",
                    status: ["completed"],
                    desc: "Job finished successfully",
                  },
                ].map((step, idx) => {
                  const isDone = step.status.includes(booking.status);
                  const isCurrent = booking.status === step.status[0];

                  return (
                    <div key={idx} className="flex gap-6 relative">
                      {idx !== 3 && (
                        <div
                          className={`absolute left-[15px] top-10 w-[2px] h-12 ${isDone ? "bg-green-500" : "bg-gray-200"}`}
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${isDone ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-bold ${isDone ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                        >
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {step.desc}
                        </p>
                        {isCurrent && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 text-yellow-600 font-bold flex items-center gap-2 text-sm"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Current Stage
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Tracking (If assigned/in-progress) */}
          {(booking.status === "assigned" ||
            booking.status === "in-progress") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neumorph p-8 rounded-[2.5rem] overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Live Tracking
                </h3>
                <span className="flex items-center gap-2 text-green-500 font-bold text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  On the way
                </span>
              </div>

              <div className="h-64 bg-gray-100 rounded-3xl relative overflow-hidden border-2 border-gray-50">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i14!2i11732!3i7645!2m3!1e0!2sm!3i605123456!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425')] bg-cover" />

                {/* Simulated Path */}
                <svg className="absolute inset-0 w-full h-full">
                  <motion.path
                    d="M 50 200 Q 150 150 250 100 T 450 50"
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="4"
                    strokeDasharray="10,10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </svg>

                {/* Worker Marker */}
                <motion.div
                  className="absolute z-10"
                  animate={{
                    x: [50, 450],
                    y: [200, 50],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                </motion.div>

                {/* User Marker */}
                <div className="absolute top-[50px] left-[450px] -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gray-900 p-2 rounded-full shadow-lg border-2 border-white">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">
                      Estimated Arrival
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      12 Minutes
                    </p>
                  </div>
                </div>
                <button className="text-yellow-500 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Open in Maps
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Service Details */}
          <div className="neumorph p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6">Service Details</h3>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-xl">
                  <Zap className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                    Service
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {booking.serviceType.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-gray-100 p-3 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                    Location
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                    {booking.address}
                  </p>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 font-medium italic text-gray-600 dark:text-gray-400">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50 not-italic">
                  Problem Description
                </p>
                "{booking.notes}"
              </div>
            )}

            {booking.billDetails?.workSummary && (
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30 font-bold text-green-700 dark:text-green-400">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">
                  Expert's Fix Summary
                </p>
                {booking.billDetails.workSummary}
              </div>
            )}
          </div>

          {/* Bill Summary (If completed) */}
          {booking.status === "completed" && booking.billDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neumorph p-8 rounded-3xl"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                Final Bill Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Service/Labor Fee</span>
                  <span className="font-bold">
                    ₹{booking.billDetails.serviceFee}
                  </span>
                </div>

                {booking.billDetails.spareParts?.map((part: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-500">{part.name}</span>
                    <span className="font-bold">₹{part.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    Total: ₹{booking.billDetails.totalBilled}
                  </p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">
                    Payment Mode:{" "}
                    {booking.billDetails.paymentMode?.toUpperCase()}
                  </p>
                </div>
                <div className="bg-green-100 text-green-600 px-4 py-2 rounded-xl font-bold text-xs uppercase">
                  Bill Settled
                </div>
              </div>
            </motion.div>
          )}
          {/* Feedback Form (If completed) */}
          {booking.status === "completed" && !booking.reviewed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neumorph p-10 rounded-[2.5rem] bg-yellow-50 border-2 border-yellow-200"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                Rate Your Experience
              </h3>
              <p className="text-gray-600 mb-8 font-medium">
                How was the service provided by our expert?
              </p>

              <div className="flex gap-4 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-2 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Share your feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white p-6 rounded-2xl border-2 border-transparent focus:border-yellow-400 outline-none min-h-[120px] mb-6 font-medium"
              />

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Code Card */}
          <div className="bg-yellow-400 p-8 rounded-[2.5rem] shadow-xl shadow-yellow-200">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-gray-900" />
              <h3 className="text-xl font-bold text-gray-900">Security Code</h3>
            </div>
            <p className="text-gray-800 text-sm mb-6 leading-relaxed">
              Share this code with the worker ONLY after the job is completed to
              your satisfaction.
            </p>
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl text-center">
              <span className="text-4xl font-black tracking-[0.5em] text-gray-900">
                {booking.otpCode}
              </span>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold">24/7 Service Support</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              If you have any issues with the service or need to reach
              management, contact our official support line.
            </p>
            <button
              onClick={() => {
                const text = encodeURIComponent("I NEED HELP WITH MY BOOKING");
                window.open(
                  `https://wa.me/${supportNumber}?text=${text}`,
                  "_blank",
                );
              }}
              className="w-full bg-green-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
            >
              <MessageSquare className="w-5 h-5" />
              WHATSAPP SUPPORT
            </button>
          </div>

          {/* Worker Card (If assigned) */}
          {booking.workerId ? (
            <div className="neumorph p-8 rounded-3xl">
              <h3 className="text-lg font-bold mb-6 text-gray-900">
                Assigned Expert
              </h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-100">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-black text-lg text-gray-900 leading-tight">
                    {booking.workerName || "Fixivo Expert"}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-500 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-black">4.9 • Super Pro</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (booking.workerPhone) {
                      window.location.href = `tel:${booking.workerPhone}`;
                    } else if (booking.userPhone) {
                      toast.error("Worker contact missing. Calling Support...");
                      window.location.href = `tel:${supportNumber}`;
                    }
                  }}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                  <Phone className="w-5 h-5" />
                  CALL EXPERT
                </button>
                <button
                  onClick={() => {
                    if (booking.workerPhone) {
                      const cleanPhone = booking.workerPhone.replace(/\D/g, "");
                      const text = encodeURIComponent(
                        `Hi, I am the customer of booking ${booking.id.slice(-6)}`,
                      );
                      window.open(
                        `https://wa.me/${cleanPhone}?text=${text}`,
                        "_blank",
                      );
                    } else {
                      const text = encodeURIComponent(
                        `ISSUE WITH BOOKING ${booking.id.slice(-6)}: WORKER CONTACT MISSING`,
                      );
                      window.open(
                        `https://wa.me/${supportNumber}?text=${text}`,
                        "_blank",
                      );
                    }
                  }}
                  className="w-full bg-green-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-100"
                >
                  <MessageSquare className="w-5 h-5" />
                  WHATSAPP
                </button>
              </div>

              {booking.workerPhone && (
                <p className="text-center mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Contact: {booking.workerPhone}
                </p>
              )}
            </div>
          ) : (
            <div className="glass p-8 rounded-3xl text-center">
              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-900">Finding Expert...</p>
              <p className="text-sm text-gray-500 mt-2">
                Assigning the best professional near you in Kannur.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
