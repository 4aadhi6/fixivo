import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Phone,
  LogOut,
  Star,
  TrendingUp,
  Navigation,
  Search,
  Copy,
  Check,
  Settings,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  FileText,
  Info,
  Upload,
  Calendar,
  MessageSquare,
  Camera,
  Home,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { useAuth } from "./AuthContext";
import { LogoLoader } from "./components/LogoLoader";
import axios from "axios";
import toast from "react-hot-toast";

const LocationRadar = () => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    {/* Radar Rings */}
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        className="absolute inset-0 border-2 border-white/40 rounded-full"
      />
    ))}

    {/* Tracking path animation */}
    <div className="absolute w-40 h-20 -left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-40">
      <div className="w-full h-0 border-b-2 border-dashed border-white/30" />
      <motion.div
        animate={{ x: [0, 140], opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute"
      >
        <Navigation className="w-5 h-5 text-white fill-current rotate-90" />
      </motion.div>
    </div>

    <div className="relative z-10 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-green-900/30">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Navigation className="w-8 h-8 text-green-600 fill-current" />
      </motion.div>
    </div>

    {/* Target "Home" icon */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute -right-20 top-1/2 -translate-y-1/2"
    >
      <Home className="w-8 h-8 text-white" />
    </motion.div>
  </div>
);

export default function WorkerDashboard() {
  const { user, isWorker, loading: authLoading, supportNumber } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [workerData, setWorkerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "my-jobs" | "available" | "finished" | "rewards"
  >("my-jobs");
  const [finishedJobs, setFinishedJobs] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // New loading state for buttons
  const [otpInput, setOtpInput] = useState<{ [key: string]: string }>({});

  // Search & Filter States
  const [bookingSearch, setBookingSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Order ID Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bill Data State
  const [billRecords, setBillRecords] = useState<{
    [key: string]: {
      spareParts: { name: string; price: string }[];
      serviceFee: string;
      paymentMode: "cash" | "upi";
      paymentProofUrl: string;
    };
  }>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    experience: "",
    skills: [] as string[],
    bankAccountName: "",
    bankAccountNumber: "",
    bankIFSC: "",
    bankName: "",
  });

  useEffect(() => {
    if (workerData) {
      setEditData({
        name: workerData.name || "",
        experience: workerData.experience || "",
        skills: workerData.skills || [],
        bankAccountName: workerData.bankAccountName || "",
        bankAccountNumber: workerData.bankAccountNumber || "",
        bankIFSC: workerData.bankIFSC || "",
        bankName: workerData.bankName || "",
      });
    }
  }, [workerData]);

  const handleUpdateProfile = async () => {
    try {
      const exp = parseInt(editData.experience.toString());
      await updateDoc(doc(db, "workers", user!.uid), {
        name: editData.name,
        experience: isNaN(exp) ? 0 : exp,
        skills: editData.skills,
        bankAccountName: editData.bankAccountName,
        bankAccountNumber: editData.bankAccountNumber,
        bankIFSC: editData.bankIFSC,
        bankName: editData.bankName,
        uid: user!.uid,
        updatedAt: new Date().toISOString(),
      });
      // Also update user profile
      await updateDoc(doc(db, "users", user!.uid), {
        name: editData.name,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated locally!");
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error("Update failed: " + error.message);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isWorker) {
      setLoading(false);
      return;
    }

    // Listen to worker profile
    const unsubWorker = onSnapshot(doc(db, "workers", user.uid), (snap) => {
      setWorkerData(snap.data());
    });

    // Listen to assigned jobs
    const q = query(
      collection(db, "bookings"),
      where("workerId", "==", user.uid),
      where("status", "in", ["assigned", "in-progress"]),
    );

    const unsubJobs = onSnapshot(
      q,
      (snap) => {
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Jobs fetch error:", error);
        setLoading(false);
      },
    );

    // Listen to available jobs (broadcasted by admin)
    const qAvailable = query(
      collection(db, "bookings"),
      where("status", "==", "confirmed"),
    );

    const unsubAvailable = onSnapshot(qAvailable, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((job: any) => !job.workerId); // Only show if NO worker assigned

      // Sort client-side by broadcastedAt or createdAt
      data.sort((a: any, b: any) => {
        const dateA = new Date(a.broadcastedAt || a.createdAt || 0);
        const dateB = new Date(b.broadcastedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setAvailableJobs(data);
    });

    // Listen to finished jobs
    const qFinished = query(
      collection(db, "bookings"),
      where("workerId", "==", user.uid),
      where("status", "==", "completed"),
    );

    const unsubFinished = onSnapshot(qFinished, (snap) => {
      setFinishedJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Listen to my rewards
    const qRewards = query(
      collection(db, "reward_history"),
      where("workerId", "==", user.uid),
    );
    const unsubRewards = onSnapshot(qRewards, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRewards(
        data.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    });

    return () => {
      unsubWorker();
      unsubJobs();
      unsubAvailable();
      unsubFinished();
      unsubRewards();
    };
  }, [user, isWorker, authLoading]);

  // Location Tracking Effect
  useEffect(() => {
    if (!user || !isWorker || !workerData?.availability) return;

    let watchId: number;

    const startTracking = () => {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Update in Firestore
              await updateDoc(doc(db, "workers", user.uid), {
                currentLocation: {
                  lat: latitude,
                  lng: longitude,
                  lastUpdated: new Date().toISOString(),
                },
                lastUpdateSource: "WorkerApp_Live",
              });
            } catch (err) {
              console.error("Location update error:", err);
            }
          },
          (err) => {
            console.error("Geolocation error:", err);
            if (err.code === 1) toast.error("Please enable GPS for tracking");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        );
      } else {
        toast.error("Geolocation not supported by this browser");
      }
    };

    startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user, isWorker, workerData?.availability]);

  const handleAcceptJob = async (jobId: string) => {
    if (!workerData?.verified) {
      toast.error("Your account is not verified yet by Admin");
      return;
    }
    if (!workerData?.availability) {
      toast.error("You must be Online to accept jobs");
      return;
    }

    try {
      setActionLoading(jobId);
      // 1. Update status via Backend
      await axios.post("/api/bookings/assign", {
        bookingId: jobId,
        workerId: user!.uid,
      });

      toast.success("Job assigned to you! Contact the customer.");
      setActiveTab("my-jobs");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Assignment failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (job: any) => {
    const otp = otpInput[job.id];
    if (!otp || otp.length !== 4) return toast.error("Enter 4-digit OTP");

    // NEW: Enforce completion photos
    if (!job.completionPhotos || job.completionPhotos.length === 0) {
      toast.error("You MUST upload completion photos before finishing!");
      return;
    }

    const bill = billRecords[job.id];
    if (!bill?.serviceFee) return toast.error("Please enter the service fee");
    if (bill.paymentMode === "upi" && !bill.paymentProofUrl)
      return toast.error("Please upload UPI payment proof screenshot");

    try {
      // Use the backend API to verify OTP
      await axios.post("/api/bookings/complete", {
        bookingId: job.id,
        otpCode: otp,
        billDetails: {
          ...bill,
          serviceFee: parseFloat(bill.serviceFee),
          spareParts: bill.spareParts.map((p) => ({
            ...p,
            price: parseFloat(p.price),
          })),
          totalBilled:
            parseFloat(bill.serviceFee) +
            bill.spareParts.reduce(
              (acc, curr) => acc + (parseFloat(curr.price) || 0),
              0,
            ),
        },
      });

      // Also update Firestore for real-time UI update
      await updateDoc(doc(db, "bookings", job.id), {
        status: "completed",
        completedAt: new Date().toISOString(),
        billDetails: {
          ...bill,
          totalBilled:
            parseFloat(bill.serviceFee) +
            bill.spareParts.reduce(
              (acc, curr) => acc + (parseFloat(curr.price) || 0),
              0,
            ),
        },
      });

      toast.success("Job completed successfully!");
      setOtpInput((prev) => {
        const next = { ...prev };
        delete next[job.id];
        return next;
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || "Verification failed";
      toast.error(msg);
      if (msg.toLowerCase().includes("otp")) {
        toast(
          (t) => (
            <span>
              <b>Verification Error:</b> If the OTP is correct but failing,
              please contact admin on WhatsApp.
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  const text = encodeURIComponent(
                    `OTP VERIFICATION ISSUE FOR JOB ${job.id}`,
                  );
                  window.open(
                    `https://wa.me/${supportNumber}?text=${text}`,
                    "_blank",
                  );
                }}
                className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs"
              >
                Contact Admin
              </button>
            </span>
          ),
          { duration: 6000 },
        );
      }
    }
  };

  const toggleAvailability = async () => {
    if (!workerData) return;
    try {
      await updateDoc(doc(db, "workers", user!.uid), {
        availability: !workerData.availability,
      });
      toast.success(
        `You are now ${!workerData.availability ? "Online" : "Offline"}`,
      );
    } catch (error) {
      toast.error("Update failed");
    }
  };

  if (authLoading || loading) return <LogoLoader />;
  if (!isWorker)
    return <div className="p-20 text-center font-bold">Access Denied</div>;

  if (workerData && !workerData.verified) {
    const status =
      workerData.verificationStatus ||
      (workerData.verified ? "approved" : "pending");

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-left">
        <div className="max-w-3xl w-full neumorph p-12 rounded-[2.5rem]">
          <div className="text-center mb-12">
            {status === "pending" && (
              <ShieldCheck className="w-16 h-16 text-orange-400 mx-auto mb-6" />
            )}
            {status === "rejected" && (
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            )}
            {status === "correction_required" && (
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            )}

            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
              {status === "pending"
                ? "Verification in Progress"
                : status === "rejected"
                  ? "Application Rejected"
                  : "Correction Required"}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
              Worker Profile ID: {user!.uid}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-black uppercase mb-4 tracking-widest">
                Submitted Profile
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase">
                    Full Name
                  </label>
                  <p className="font-black text-gray-900 dark:text-white">
                    {workerData.name}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase">
                    Experience
                  </label>
                  <p className="font-black text-gray-900 dark:text-white">
                    {workerData.experience} Years
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 font-bold uppercase">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {workerData.skills?.map((s: string) => (
                      <span
                        key={s}
                        className="bg-white text-gray-500 px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm border border-gray-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 font-black uppercase mb-4 tracking-widest">
                Verification Status
              </p>
              {status === "pending" && (
                <div className="flex items-center gap-4 text-orange-600">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <p className="font-bold">
                    Admin is currently reviewing your documents.
                  </p>
                </div>
              )}

              {status === "rejected" && (
                <div className="space-y-4">
                  <div className="bg-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-black text-sm">
                      Your application was not approved.
                    </p>
                  </div>
                  <p className="text-red-700 text-sm font-medium italic underline decoration-red-200">
                    "{workerData.rejectionReason || "Violated terms"}"
                  </p>
                </div>
              )}

              {status === "correction_required" && (
                <div className="space-y-4">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-xl flex items-center gap-3">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="font-black text-sm">
                      Follow Admin instructions below.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <p className="text-blue-700 text-sm font-bold leading-relaxed">
                      "{workerData.rejectionReason}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {status === "correction_required" && (
            <Link
              to="/worker/register"
              className="block w-full bg-blue-500 text-white py-5 rounded-2xl font-black text-center hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 mb-8"
            >
              UPDATE PROFILE & RE-UPLOAD DOCUMENTS
            </Link>
          )}

          <div className="flex justify-center gap-12 pt-8 border-t border-gray-100">
            <button
              onClick={() => auth.signOut()}
              className="text-red-500 font-black text-sm flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-widest"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-gray-400 font-black text-sm flex items-center gap-2 hover:text-gray-600 transition-all uppercase tracking-widest"
            >
              <RefreshCw className="w-5 h-5" />
              Sync Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gray-900 pt-32 pb-20 px-6 rounded-b-[3rem]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white p-2 flex items-center justify-center shadow-xl shadow-yellow-400/20">
              <img
                src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
                alt="Fixivo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                {workerData?.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  {workerData?.rating || "0.0"}
                </span>
                <span className="text-gray-400 font-medium">
                  {workerData?.jobsCompleted} Jobs Done
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="p-4 rounded-2xl bg-gray-800 text-yellow-400 hover:bg-yellow-400 hover:text-white transition-all"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={toggleAvailability}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${workerData?.availability ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${workerData?.availability ? "bg-white animate-pulse" : "bg-gray-600"}`}
              />
              {workerData?.availability ? "Online" : "Offline"}
            </button>
            <button
              onClick={() => auth.signOut()}
              className="p-4 rounded-2xl bg-gray-800 text-red-400 hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 grid lg:grid-cols-3 gap-8">
        {/* Profile Edit Modal/Section */}
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 neumorph p-10 rounded-[2.5rem] bg-white dark:bg-gray-900 border-2 border-yellow-400"
          >
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8">
              Update Your Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full bg-gray-50 p-4 rounded-xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={editData.experience}
                    onChange={(e) =>
                      setEditData({ ...editData, experience: e.target.value })
                    }
                    className="w-full bg-gray-50 p-4 rounded-xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={editData.bankAccountNumber}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        bankAccountNumber: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 p-4 rounded-xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={editData.bankIFSC}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        bankIFSC: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-gray-50 p-4 rounded-xl outline-none font-medium border-2 border-transparent focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    Skills (Comma separated)
                  </label>
                  <textarea
                    value={editData.skills.join(", ")}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        skills: e.target.value.split(",").map((s) => s.trim()),
                      })
                    }
                    className="w-full bg-gray-50 p-4 rounded-xl outline-none font-medium border-2 border-transparent focus:border-yellow-400 min-h-[120px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 bg-gray-100 py-4 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-yellow-400 text-white py-4 rounded-xl font-bold shadow-lg shadow-yellow-200"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
        {/* Tabs */}
        <div className="lg:col-span-3 flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("my-jobs")}
            className={`px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === "my-jobs" ? "bg-yellow-400 text-white shadow-lg shadow-yellow-100" : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            My Active Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === "available" ? "bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-lg shadow-gray-900/20" : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            Available Requests ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={`px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === "finished" ? "bg-green-500 text-white shadow-lg shadow-green-100" : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            Finished Works ({finishedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === "rewards" ? "bg-purple-600 text-white shadow-lg shadow-purple-100" : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            Rewards ({rewards.length})
          </button>
        </div>

        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Daily Summary Innovation */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-yellow-100 dark:border-yellow-900/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full -mr-12 -mt-12" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
              Today's Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Earned
                </p>
                <p className="text-xl font-black text-green-600 dark:text-green-400">
                  ₹
                  {finishedJobs
                    .filter((j) =>
                      j.completedAt?.startsWith(
                        new Date().toISOString().split("T")[0],
                      ),
                    )
                    .reduce(
                      (acc, j) => acc + (j.billDetails?.serviceFee || 0),
                      0,
                    )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Jobs done
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {
                    finishedJobs.filter((j) =>
                      j.completedAt?.startsWith(
                        new Date().toISOString().split("T")[0],
                      ),
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-400/10 rounded-2xl border border-yellow-200 dark:border-yellow-900/40">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-tight">
                  Demand Alert
                </span>
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                High demand for{" "}
                <span className="text-yellow-600">Electrical</span> services in
                your area right now!
              </p>
            </div>
          </div>

          <div className="neumorph p-8 rounded-[2rem]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              Your Stats
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  Leaderboard Rank
                </span>
                <span className="font-black text-gray-900 dark:text-white">
                  #{workerData?.rank || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  Total Points
                </span>
                <span className="font-black text-yellow-500">
                  {workerData?.leaderboardScore || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  Next Reward
                </span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  ₹2500 Bonus
                </span>
              </div>
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {workerData?.skills?.map((s: string) => (
                    <span
                      key={s}
                      className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold uppercase tracking-tight">
                  Expert Support
                </h3>
              </div>
              <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
                Facing issues with OTP or technical errors? Contact our 24/7
                Admin Support Line for manual job completion.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const text = encodeURIComponent("I NEED HELP WITH A JOB");
                    window.open(
                      `https://wa.me/${supportNumber}?text=${text}`,
                      "_blank",
                    );
                  }}
                  className="bg-green-500 text-white w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                >
                  <MessageSquare className="w-5 h-5" />
                  WHATSAPP SUPPORT
                </button>
                <button
                  onClick={() =>
                    (window.location.href = `tel:+${supportNumber}`)
                  }
                  className="bg-white/10 text-white w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                >
                  <Phone className="w-4 h-4" />
                  CALL ADMIN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tracking Card */}
          {workerData?.availability && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-green-200"
            >
              <div className="flex items-center gap-6">
                <LocationRadar />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    Live Tracking Active
                  </h3>
                  <p className="text-green-100 text-sm font-bold opacity-80">
                    Your location is being shared with nearby customers for fast
                    routing.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${workerData.currentLocation?.lat},${workerData.currentLocation?.lng}`,
                    )
                  }
                  className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Show on Map
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "my-jobs" ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Active Jobs ({jobs.length})
                </h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search Job ID or Name..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-yellow-400 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="neumorph p-12 rounded-[2.5rem] text-center">
                  <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-bold text-gray-400">
                    No active jobs assigned yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Check the "Available Requests" tab to accept new work.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {jobs
                    .filter(
                      (job) =>
                        job.id
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                        job.userName
                          ?.toLowerCase()
                          .includes(bookingSearch.toLowerCase()),
                    )
                    .map((job) => (
                      <motion.div
                        key={job.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="neumorph p-8 rounded-[2.5rem] bg-white border-l-8 border-yellow-400"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                Booking ID: {job.id.slice(-8)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(job.id);
                                }}
                                className="text-gray-500 hover:text-yellow-400 p-1"
                              >
                                {copiedId === job.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white">
                              {job.serviceType}
                            </h4>
                            <span
                              className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${job.status === "assigned" ? "bg-blue-50 text-blue-500" : "bg-yellow-50 text-yellow-600"}`}
                            >
                              {job.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                              ₹{job.amount || "---"}
                            </p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                              {job.paymentStatus === "paid"
                                ? "Paid via Online"
                                : "Payment Pending"}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-10">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                                  Customer Name & Address
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {job.userName}
                                </span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {job.address}
                                </span>
                                {job.notes && (
                                  <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                    <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1 text-left">
                                      Problem Description
                                    </p>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 italic text-left">
                                      "{job.notes}"
                                    </p>
                                  </div>
                                )}
                                {job.location && (
                                  <a
                                    href={`https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-500 font-bold hover:underline mt-1 flex items-center gap-1"
                                  >
                                    <Navigation className="w-3 h-3" /> View on
                                    Google Maps
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Phone className="w-5 h-5 text-blue-500" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                                      Customer Contact
                                    </span>
                                    <a
                                      href={`tel:${job.userPhone}`}
                                      className="text-xl font-black text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
                                    >
                                      {job.userPhone ||
                                        job.phone ||
                                        "No Number"}
                                    </a>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const cleanPhone = (
                                        job.userPhone ||
                                        job.phone ||
                                        ""
                                      ).replace(/\D/g, "");
                                      const text = encodeURIComponent(
                                        `Hi ${job.userName}, I am from Fixivo Service regarding your booking.`,
                                      );
                                      window.open(
                                        `https://wa.me/${cleanPhone}?text=${text}`,
                                        "_blank",
                                      );
                                    }}
                                    className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100 dark:shadow-none"
                                  >
                                    <MessageSquare className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      (window.location.href = `tel:${job.userPhone || job.phone}`)
                                    }
                                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              {job.location && (
                                <button
                                  onClick={() =>
                                    (window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${job.location.lat},${job.location.lng}`)
                                  }
                                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600 shadow-sm"
                                >
                                  <Navigation className="w-4 h-4 text-blue-500" />
                                  Navigate to Location
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-3 text-center">
                              Job Completion Photos
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                              {job.completionPhotos?.map(
                                (url: string, i: number) => (
                                  <div
                                    key={i}
                                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-white dark:border-gray-900 shadow-sm"
                                  >
                                    <img
                                      src={url}
                                      alt="Doc"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ),
                              )}
                              <div className="relative w-12 h-12 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:border-yellow-400 transition-all cursor-pointer">
                                <input
                                  type="file"
                                  onChange={async (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const file = e.target.files[0];
                                    const loader = toast.loading(
                                      "Uploading evidence...",
                                    );
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", file);

                                      const res = await axios.post(
                                        "http://localhost:3000/api/utils/upload",
                                        formData,
                                      );
                                      const url = res.data.url;

                                      if (url) {
                                        const existing =
                                          job.completionPhotos || [];
                                        await updateDoc(
                                          doc(db, "bookings", job.id),
                                          {
                                            completionPhotos: [
                                              ...existing,
                                              url,
                                            ],
                                          },
                                        );
                                        toast.success("Evidence added!", {
                                          id: loader,
                                        });
                                      } else {
                                        toast.error("Upload failed", {
                                          id: loader,
                                        });
                                      }
                                    } catch (err) {
                                      toast.error("Upload failed", {
                                        id: loader,
                                      });
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Upload className="w-5 h-5" />
                              </div>
                            </div>
                            <p className="text-[8px] text-center text-gray-400 font-bold uppercase">
                              Upload evidence of work done
                            </p>
                          </div>

                          {/* Bill Details Section */}
                          <div className="lg:col-span-2 bg-yellow-50/50 dark:bg-yellow-900/10 p-6 rounded-3xl border-2 border-yellow-100 dark:border-yellow-900/30">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              Final Billing & Payment
                            </h4>

                            <div className="space-y-4 mb-6">
                              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-3 text-center md:text-left">
                                  Material & Spare Parts
                                </p>
                                {(billRecords[job.id]?.spareParts || []).map(
                                  (part, pIdx) => (
                                    <div key={pIdx} className="flex gap-2 mb-2">
                                      <input
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-xs dark:text-white"
                                        placeholder="Part Name"
                                        value={part.name}
                                        onChange={(e) => {
                                          const newBills = { ...billRecords };
                                          if (!newBills[job.id])
                                            newBills[job.id] = {
                                              spareParts: [],
                                              serviceFee: "",
                                              paymentMode: "cash",
                                              paymentProofUrl: "",
                                            };
                                          newBills[job.id].spareParts[
                                            pIdx
                                          ].name = e.target.value;
                                          setBillRecords(newBills);
                                        }}
                                      />
                                      <input
                                        type="number"
                                        className="w-20 bg-gray-50 p-2 rounded-lg text-xs font-bold"
                                        placeholder="Price"
                                        value={part.price}
                                        onChange={(e) => {
                                          const newBills = { ...billRecords };
                                          if (!newBills[job.id])
                                            newBills[job.id] = {
                                              spareParts: [],
                                              serviceFee: "",
                                              paymentMode: "cash",
                                              paymentProofUrl: "",
                                            };
                                          newBills[job.id].spareParts[
                                            pIdx
                                          ].price = e.target.value;
                                          setBillRecords(newBills);
                                        }}
                                      />
                                    </div>
                                  ),
                                )}
                                <button
                                  onClick={() => {
                                    const newBills = { ...billRecords };
                                    if (!newBills[job.id])
                                      newBills[job.id] = {
                                        spareParts: [],
                                        serviceFee: "",
                                        paymentMode: "cash",
                                        paymentProofUrl: "",
                                      };
                                    newBills[job.id].spareParts.push({
                                      name: "",
                                      price: "",
                                    });
                                    setBillRecords(newBills);
                                  }}
                                  className="text-[10px] font-black text-yellow-600 hover:underline"
                                >
                                  + ADD SPARE PART
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] text-gray-400 font-black uppercase mb-1 block">
                                    Service Fee (Labor)
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 font-bold dark:text-white"
                                    placeholder="₹ Fee"
                                    value={
                                      billRecords[job.id]?.serviceFee || ""
                                    }
                                    onChange={(e) => {
                                      const newBills = { ...billRecords };
                                      if (!newBills[job.id])
                                        newBills[job.id] = {
                                          spareParts: [],
                                          serviceFee: "",
                                          paymentMode: "cash",
                                          paymentProofUrl: "",
                                          workSummary: "",
                                        };
                                      newBills[job.id].serviceFee =
                                        e.target.value;
                                      setBillRecords(newBills);
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1 block">
                                    Payment Mode
                                  </label>
                                  <select
                                    className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 font-bold dark:text-white"
                                    value={
                                      billRecords[job.id]?.paymentMode || "cash"
                                    }
                                    onChange={(e) => {
                                      const newBills = { ...billRecords };
                                      if (!newBills[job.id])
                                        newBills[job.id] = {
                                          spareParts: [],
                                          serviceFee: "",
                                          paymentMode: "cash",
                                          paymentProofUrl: "",
                                          workSummary: "",
                                        };
                                      newBills[job.id].paymentMode = e.target
                                        .value as any;
                                      setBillRecords(newBills);
                                    }}
                                  >
                                    <option value="cash">CASH</option>
                                    <option value="upi">UPI / GPAY</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1 block">
                                  What did you fix? (Work Summary)
                                </label>
                                <textarea
                                  className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 font-medium dark:text-white text-xs min-h-[60px]"
                                  placeholder="Briefly describe the work done..."
                                  value={billRecords[job.id]?.workSummary || ""}
                                  onChange={(e) => {
                                    const newBills = { ...billRecords };
                                    if (!newBills[job.id])
                                      newBills[job.id] = {
                                        spareParts: [],
                                        serviceFee: "",
                                        paymentMode: "cash",
                                        paymentProofUrl: "",
                                        workSummary: "",
                                      };
                                    newBills[job.id].workSummary =
                                      e.target.value;
                                    setBillRecords(newBills);
                                  }}
                                />
                              </div>

                              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-2">
                                  Payment Proof (Required for UPI)
                                </p>
                                <div className="flex items-center gap-4">
                                  {billRecords[job.id]?.paymentProofUrl ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border dark:border-gray-800">
                                      <img
                                        src={
                                          billRecords[job.id].paymentProofUrl
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600">
                                      <Camera className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="relative">
                                    <input
                                      type="file"
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      onChange={async (e) => {
                                        if (!e.target.files?.[0]) return;
                                        const file = e.target.files[0];
                                        const l = toast.loading(
                                          "Uploading payment proof...",
                                        );
                                        try {
                                          const fd = new FormData();
                                          fd.append("file", file);
                                          const res = await axios.post(
                                            "/api/utils/upload",
                                            fd,
                                          );
                                          const url = res.data.url;
                                          const newBills = { ...billRecords };
                                          if (!newBills[job.id])
                                            newBills[job.id] = {
                                              spareParts: [],
                                              serviceFee: "",
                                              paymentMode: "cash",
                                              paymentProofUrl: "",
                                            };
                                          newBills[job.id].paymentProofUrl =
                                            url;
                                          setBillRecords(newBills);
                                          toast.success("Proof uploaded!", {
                                            id: l,
                                          });
                                        } catch (err) {
                                          toast.error("Upload failed", {
                                            id: l,
                                          });
                                        }
                                      }}
                                    />
                                    <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                                      UPLOAD PROOF
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-yellow-200 pt-4 flex justify-between items-center">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                Total to collect from user
                              </p>
                              <p className="text-xl font-black text-gray-900 dark:text-white">
                                ₹
                                {(parseFloat(billRecords[job.id]?.serviceFee) ||
                                  0) +
                                  (
                                    billRecords[job.id]?.spareParts || []
                                  ).reduce(
                                    (acc, curr) =>
                                      acc + (parseFloat(curr.price) || 0),
                                    0,
                                  )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-900 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                            <div>
                              <p className="text-white font-bold">
                                Verify Completion
                              </p>
                              <p className="text-gray-400 text-xs">
                                Ask customer for the 4-digit OTP code.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="OTP"
                              value={otpInput[job.id] || ""}
                              onChange={(e) =>
                                setOtpInput({
                                  ...otpInput,
                                  [job.id]: e.target.value,
                                })
                              }
                              className="bg-white/10 text-white font-black text-center text-xl p-4 rounded-xl w-24 outline-none focus:ring-2 ring-yellow-400"
                            />
                            <button
                              onClick={() => handleCompleteJob(job)}
                              className="flex-1 md:flex-none bg-yellow-400 text-white font-black px-10 py-4 rounded-xl shadow-lg shadow-yellow-400/20"
                            >
                              VERIFY
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </>
          ) : activeTab === "available" ? (
            <>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Available Broadcasts ({availableJobs.length})
              </h2>
              {availableJobs.length === 0 ? (
                <div className="neumorph p-12 rounded-[2.5rem] text-center">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-bold text-gray-400">
                    No new broadcasts available.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Wait for the admin to broadcast new bookings in Kannur.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {availableJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="neumorph p-8 rounded-[2.5rem] border-l-8 border-yellow-400 bg-white dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                              {job.serviceType}
                            </span>
                            {job.type === "emergency" && (
                              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                                Emergency
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            New Broadcast: {job.serviceType}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mt-2">
                            <MapPin className="w-4 h-4" />
                            {job.address?.split(",")[0]}... (Full address after
                            acceptance)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                            ₹{job.amount}
                          </p>
                          <p className="text-xs text-green-600 font-bold uppercase tracking-tighter">
                            Budget Fixed
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {job.date
                              ? new Date(job.date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{job.time || "N/A"}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={actionLoading === job.id}
                        className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-900/10 group disabled:opacity-50"
                      >
                        <Zap
                          className={`w-5 h-5 text-yellow-400 group-hover:scale-125 transition-transform ${actionLoading === job.id ? "animate-spin" : ""}`}
                        />
                        {actionLoading === job.id
                          ? "ACCEPTING..."
                          : "ACCEPT THIS JOB"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "rewards" ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Your Reward History
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-purple-100">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
                    Total Earnings
                  </p>
                  <p className="text-4xl font-black">
                    ₹
                    {rewards.reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 neumorph p-8 rounded-[2rem]">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-2">
                    Rewards Won
                  </p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {rewards.length}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 neumorph p-8 rounded-[2rem]">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-2">
                    Points progress
                  </p>
                  <p className="text-3xl font-black text-yellow-500">
                    {workerData?.leaderboardScore || 0} pts
                  </p>
                </div>
              </div>

              <div className="neumorph p-10 rounded-[2.5rem] bg-white dark:bg-gray-800">
                <div className="space-y-6">
                  {rewards.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      You haven't received any rewards yet. Keep working hard!
                    </div>
                  ) : (
                    rewards.map((r) => (
                      <div
                        key={r.id}
                        className="p-8 bg-gray-900 border border-white/10 rounded-[2rem] flex justify-between items-center group hover:border-yellow-400 hover:shadow-2xl transition-all"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center text-white shadow-lg shadow-yellow-200">
                            <Zap className="w-8 h-8 fill-current" />
                          </div>
                          <div>
                            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-1">
                              Official Reward
                            </p>
                            <h4 className="text-xl font-black text-white">
                              {r.reason}
                            </h4>
                            <p className="text-sm text-gray-400 font-bold uppercase mt-1 opacity-60">
                              {r.date
                                ? new Date(r.date).toLocaleDateString()
                                : "Recent"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-green-400">
                            +₹{r.amount}
                          </p>
                          <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-500/20">
                            Settled ✓
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "finished" ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Finished Works ({finishedJobs.length})
                </h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search Previous Jobs..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-yellow-400 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {finishedJobs.length === 0 ? (
                <div className="neumorph p-12 rounded-[2.5rem] text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="font-bold text-gray-400">
                    You haven't completed any jobs yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Finish your active jobs to see them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {finishedJobs
                    .filter(
                      (job) =>
                        job.id
                          .toLowerCase()
                          .includes(bookingSearch.toLowerCase()) ||
                        job.userName
                          ?.toLowerCase()
                          .includes(bookingSearch.toLowerCase()),
                    )
                    .map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-900 p-8 rounded-[2.5rem] border-l-8 border-green-500 shadow-2xl hover:scale-[1.02] transition-transform"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                ID: {job.id.slice(-6)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(job.id);
                                }}
                                className="text-gray-500 hover:text-green-400 p-1"
                              >
                                {copiedId === job.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <span className="text-[10px] text-gray-500 ml-2">
                                • COMPLETED ON{" "}
                                {job.completedAt
                                  ? new Date(
                                      job.completedAt,
                                    ).toLocaleDateString()
                                  : "RECENTLY"}
                              </span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                              {job.serviceType}
                            </h3>
                            <p className="text-sm text-gray-200 font-medium">
                              {job.userName} • {job.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-green-400">
                              ₹{job.billDetails?.totalBilled || job.amount}
                            </p>
                            <p className="text-[10px] text-gray-300 font-black uppercase">
                              Earnings Success
                            </p>
                          </div>
                        </div>

                        {job.billDetails && (
                          <div className="mb-8 p-6 bg-white/10 rounded-2xl border border-white/20">
                            <div className="grid md:grid-cols-2 gap-8 text-left">
                              <div>
                                <p className="text-[10px] text-gray-300 font-black uppercase mb-3">
                                  Service Fee (Labor)
                                </p>
                                <p className="text-lg font-black text-white">
                                  ₹{job.billDetails.serviceFee}
                                </p>
                              </div>
                              {job.billDetails.spareParts?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-gray-300 font-black uppercase mb-3 text-white">
                                    Spare Parts / Materials
                                  </p>
                                  <div className="space-y-1">
                                    {job.billDetails.spareParts.map(
                                      (p: any, i: number) => (
                                        <div
                                          key={i}
                                          className="flex justify-between text-xs font-bold text-gray-200"
                                        >
                                          <span>{p.name}</span>
                                          <span>₹{p.price}</span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-gray-300 font-black uppercase mb-3 text-white">
                                  Payment Mode:{" "}
                                  {job.billDetails.paymentMode?.toUpperCase()}
                                </p>
                                {job.billDetails.paymentProofUrl && (
                                  <a
                                    href={job.billDetails.paymentProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-yellow-400 font-bold text-[10px] hover:underline uppercase transition-all hover:text-yellow-300"
                                  >
                                    <Camera className="w-3 h-3" />
                                    View Payment Proof
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {job.completionPhotos &&
                          job.completionPhotos.length > 0 && (
                            <div className="mb-6">
                              <p className="text-[10px] text-gray-300 font-black uppercase mb-3 text-white">
                                Work Evidence
                              </p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {job.completionPhotos.map(
                                  (url: string, i: number) => (
                                    <div
                                      key={i}
                                      className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-white/40 shadow-sm transition-all hover:scale-110"
                                    >
                                      <img
                                        src={url}
                                        alt="Proof"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-xl border border-green-500/30 w-fit">
                          <ShieldCheck className="w-4 h-4 text-green-400" />
                          <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                            Verified Work Done
                          </span>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
