import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  Zap,
  Star,
  ExternalLink,
  FileText,
  RefreshCw,
  Clock,
  Camera,
  MapPin,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { useAuth } from "./AuthContext";
import { LogoLoader } from "./components/LogoLoader";
import { formatCurrency } from "./lib/utils";
import toast from "react-hot-toast";
import axios from "axios";

const RewardHistoryList = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Admin] Listening to reward_history...");
    const q = query(collection(db, "reward_history"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log(`[Admin] Received ${snap.docs.length} rewards`);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by createdAt or date
        data.sort((a: any, b: any) => {
          const dateA =
            a.createdAt?.toDate?.() || new Date(a.date || a.createdAt || 0);
          const dateB =
            b.createdAt?.toDate?.() || new Date(b.date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setRewards(data);
        setLoading(false);
      },
      (err) => {
        console.error("[Admin] Reward History Error:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  if (loading)
    return (
      <div className="text-gray-400 font-bold p-8">Loading history...</div>
    );

  return (
    <div className="space-y-4">
      {rewards.length === 0 ? (
        <div className="p-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">
          No rewards distributed yet
        </div>
      ) : (
        rewards.map((r) => (
          <div
            key={r.id}
            className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex justify-between items-center group hover:border-yellow-400 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-600">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white leading-tight">
                  {r.workerName || "Worker"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {r.reason || "Bonus"}
                </p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 font-black uppercase mt-1">
                  {r.date ? new Date(r.date).toLocaleDateString() : "Recent"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-green-600 dark:text-green-400">
                +₹{r.amount}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                Success ✓
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading, supportNumber } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookings, setBookings] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [rewardingWorkerId, setRewardingWorkerId] = useState<string | null>(
    null,
  );
  const [submittingReward, setSubmittingReward] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState("500");
  const [rewardReason, setRewardReason] = useState("Monthly Top Worker Reward");
  const [newSupportNumber, setNewSupportNumber] = useState(supportNumber);

  // Search & Filter States
  const [bookingSearch, setBookingSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("ID Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    setNewSupportNumber(supportNumber);
  }, [supportNumber]);

  const handleUpdateSupportNumber = async () => {
    if (!newSupportNumber) return toast.error("Number cannot be empty");
    try {
      // Use setDoc with merge to ensure it works even if doc doesn't exist
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "settings", "global"),
        {
          supportNumber: newSupportNumber,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      toast.success("Admin Support Number updated globally!");
    } catch (e) {
      console.error("Support update error:", e);
      toast.error("Failed to update number");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const qBookings = query(collection(db, "bookings"));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort client-side by createdAt descending
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setBookings(data);
    });

    const qWorkers = query(collection(db, "workers"));
    const unsubWorkers = onSnapshot(
      qWorkers,
      (snap) => {
        console.log(
          `[Admin] Fetched ${snap.docs.length} workers from Firestore`,
        );
        setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Workers fetch error:", error);
        if (error.message.includes("permission-denied")) {
          toast.error(
            "Permission denied. Try clicking 'Repair Sync' to fix your Admin role.",
          );
        } else {
          toast.error("Error loading workers: " + error.message);
        }
        setLoading(false);
      },
    );

    return () => {
      unsubBookings();
      unsubWorkers();
    };
  }, [isAdmin, authLoading]);

  const handleApproveWorker = async (workerId: string) => {
    try {
      await axios.post("https://fixivobeckend.onrender.com/api/admin/approve-worker", { workerId });
      toast.success("Worker approved!");
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleRejectWorker = async (workerId: string, reason: string) => {
    if (!reason) return toast.error("Please provide a reason");
    try {
      await axios.post("/api/admin/reject-worker", { workerId, reason });
      toast.success("Worker application rejected");
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleRequestCorrection = async (workerId: string, reason: string) => {
    if (!reason) return toast.error("Please specify the correction needed");
    try {
      await axios.post("https://fixivobeckend.onrender.com/api/admin/request-correction", { workerId, reason });
      toast.success("Correction requested");
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const [unverifyModal, setUnverifyModal] = useState<{
    isOpen: boolean;
    workerId: string;
    reason: string;
  }>({ isOpen: false, workerId: "", reason: "" });

  const handleUnverifyWorker = async () => {
    if (!unverifyModal.reason) {
      toast.error("Please provide a reason");
      return;
    }

    const loadingToast = toast.loading("Unverifying worker...");
    try {
      await axios.post("https://fixivobeckend.onrender.com/api/admin/unverify-worker", {
        workerId: unverifyModal.workerId,
        reason: unverifyModal.reason,
      });

      toast.success("Worker unverified & moved to correction status", {
        id: loadingToast,
      });
      setUnverifyModal({ isOpen: false, workerId: "", reason: "" });

      if (selectedWorker && selectedWorker.id === unverifyModal.workerId) {
        setSelectedWorker({
          ...selectedWorker,
          verified: false,
          verificationStatus: "correction_required",
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to unverify worker", {
        id: loadingToast,
      });
    }
  };

  const handleBroadcastBooking = async (bookingId: string) => {
    try {
      // Update status to 'confirmed' (or stay confirmed) but specifically mark it as looking for workers
      // In our logic, 'confirmed' bookings with no workerId are visible to all workers
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "confirmed",
        broadcastedAt: new Date().toISOString(),
      });
      toast.success("Job broadcasted to all active workers!");
    } catch (error) {
      toast.error("Broadcast failed");
    }
  };

  if (authLoading || loading) return <LogoLoader />;
  if (!isAdmin)
    return <div className="p-20 text-center font-bold">Access Denied</div>;

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Revenue",
      value: formatCurrency(bookings.length * 99),
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Active Workers",
      value: workers.filter((w) => w.verified).length,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Pending Verification",
      value: workers.filter((w) => !w.verified).length,
      icon: ShieldCheck,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10">
            <img
              src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
              alt="Fixivo Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-sm"
            />
            <div className="flex flex-col">
               <span className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
            <span className="text-white opacity-85">FIX</span>
            <span className="text-yellow-500">IVO</span>
          </span>
              <span className="text-[8px] font-black uppercase text-yellow-500 tracking-[0.2em]">
                ADMIN PORTAL
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "workers", label: "Workers", icon: Users },
              { id: "finished", label: "Finished Works", icon: CheckCircle2 },
              { id: "verification", label: "Verification", icon: ShieldCheck },
              { id: "leaderboard", label: "Leaderboard", icon: TrendingUp },
              { id: "rewards", label: "Rewards", icon: Zap },
              { id: "disputes", label: "Disputes", icon: AlertCircle },
              { id: "system", label: "System", icon: ShieldCheck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? "bg-yellow-400 text-white shadow-lg shadow-yellow-100" : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white capitalize">
              {activeTab}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Welcome back, Admin
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  activeTab === "workers"
                    ? "Search Experts..."
                    : "Search by Order ID or User..."
                }
                value={activeTab === "workers" ? workerSearch : bookingSearch}
                onChange={(e) =>
                  activeTab === "workers"
                    ? setWorkerSearch(e.target.value)
                    : setBookingSearch(e.target.value)
                }
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-yellow-400 transition-all w-full md:w-64"
              />
            </div>
            {activeTab === "bookings" && (
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl py-3 px-6 outline-none focus:border-yellow-400 transition-all font-bold text-xs"
              />
            )}
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center font-bold text-white shrink-0">
              A
            </div>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="space-y-12">
            <div className="grid grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="neumorph p-8 rounded-[2rem] bg-white dark:bg-gray-900"
                >
                  <div
                    className={`${stat.bg} dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Innovative Service Distribution Analytics */}
            <div className="neumorph p-10 rounded-[2.5rem] bg-white dark:bg-gray-900">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Service Distribution
                  </h3>
                  <p className="text-sm text-gray-400 font-medium">
                    Which categories are most popular?
                  </p>
                </div>
                <div className="flex gap-2">
                  {["Weekly", "Monthly", "Total"].map((t) => (
                    <button
                      key={t}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${t === "Total" ? "bg-yellow-400 text-white" : "bg-gray-50 text-gray-400"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {["Electrical", "Plumbing", "Repair", "CCTV"].map((type) => {
                  const count = bookings.filter((b) =>
                    b.serviceType
                      ?.toLowerCase()
                      .startsWith(type.toLowerCase().slice(0, 3)),
                  ).length;
                  const total = bookings.length || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase">
                        <span className="text-gray-700 dark:text-gray-300">
                          {type}
                        </span>
                        <span className="text-gray-400">
                          {percentage}% ({count})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className={`h-full ${type === "Electrical" ? "bg-yellow-400" : type === "Plumbing" ? "bg-blue-400" : type === "Repair" ? "bg-purple-400" : "bg-orange-400"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="neumorph p-8 rounded-[2rem] bg-white dark:bg-gray-900">
                <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">
                  Recent Bookings
                </h3>
                <div className="space-y-6">
                  {bookings.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-xl">
                          <Zap className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {b.serviceType.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {b.userName}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500">
                        #{b.id.slice(-4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="neumorph p-8 rounded-[2rem] bg-white dark:bg-gray-900">
                <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">
                  Top Workers
                </h3>
                <div className="space-y-6">
                  {workers
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-bold">
                            {w.name?.[0] || "W"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {w.name || "Worker"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {w.jobsCompleted} Jobs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          {w.rating}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="neumorph p-10 rounded-[2.5rem] bg-white dark:bg-gray-900">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                All Service Requests
              </h3>
              <div className="flex gap-4">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold">
                  Total: {bookings.length}
                </span>
                <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold">
                  Pending:{" "}
                  {
                    bookings.filter(
                      (b) => b.status === "confirmed" && !b.workerId,
                    ).length
                  }
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {bookings
                .filter((b) => b.status !== "pending")
                .filter((b) => {
                  const matchesSearch =
                    b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                    b.userName
                      ?.toLowerCase()
                      .includes(bookingSearch.toLowerCase()) ||
                    b.serviceType
                      ?.toLowerCase()
                      .includes(bookingSearch.toLowerCase());
                  const matchesDate = dateFilter ? b.date === dateFilter : true;
                  return matchesSearch && matchesDate;
                })
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <Zap
                          className={`w-6 h-6 ${booking.type === "emergency" ? "text-red-500" : "text-yellow-500"}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-gray-900 dark:text-white text-lg uppercase">
                            {booking.serviceType}
                          </p>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.type === "emergency" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                          >
                            {booking.type}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(booking.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg group/copy hover:bg-yellow-400 transition-all"
                            title="Copy Order ID"
                          >
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 group-hover/copy:text-white">
                              #{booking.id.slice(-6)}
                            </span>
                            {copiedId === booking.id ? (
                              <Check className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-gray-300 group-hover/copy:text-white" />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-tight">
                          {booking.userName} • {booking.userPhone || "No Phone"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                            {booking.date
                              ? new Date(booking.date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "No Date"}{" "}
                            at {booking.time}
                          </p>
                        </div>
                        {booking.notes && (
                          <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                            <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">
                              Problem Description
                            </p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 italic">
                              "{booking.notes}"
                            </p>
                          </div>
                        )}
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs tracking-tight mt-1">
                          {booking.address}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">
                          {new Date(booking.date).toLocaleDateString()} at{" "}
                          {booking.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">
                          Status
                        </p>
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                            booking.status === "completed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : booking.status === "assigned" ||
                                  booking.status === "in-progress"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      {!booking.workerId && booking.status === "confirmed" && (
                        <button
                          onClick={() => handleBroadcastBooking(booking.id)}
                          className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Broadcast
                        </button>
                      )}

                      {booking.workerId && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-white text-xs font-black">
                              {booking.workerId.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-400 font-black uppercase">
                                Assigned Worker
                              </p>
                              <p className="text-xs font-bold text-gray-900 dark:text-white">
                                ID: {booking.workerId.slice(-6)}
                              </p>
                            </div>
                          </div>
                          {(booking.status === "assigned" ||
                            booking.status === "in-progress" ||
                            booking.status === "confirmed") && (
                            <button
                              disabled={submittingReward === booking.id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  !window.confirm(
                                    "FORCE COMPLETE: This will bypass OTP verification and mark the job as finished. Use only for technical issues. Continue?",
                                  )
                                )
                                  return;
                                setSubmittingReward(booking.id);
                                const t = toast.loading(
                                  "Force completing job...",
                                );
                                try {
                                  await axios.post("https://fixivobeckend.onrender.com/api/bookings/complete", {
                                    bookingId: booking.id,
                                    isForce: true,
                                  });
                                  // Local state update for immediate feedback
                                  setBookings((prev) =>
                                    prev.map((b) =>
                                      b.id === booking.id
                                        ? { ...b, status: "completed" }
                                        : b,
                                    ),
                                  );
                                  toast.success("Job force completed!", {
                                    id: t,
                                  });
                                } catch (e: any) {
                                  toast.error(
                                    "Failed: " +
                                      (e.response?.data?.error || e.message),
                                    { id: t },
                                  );
                                } finally {
                                  setSubmittingReward(null);
                                }
                              }}
                              className="text-[10px] text-red-500 dark:text-red-400 font-black uppercase hover:underline p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mt-1 disabled:opacity-50"
                            >
                              {submittingReward === booking.id
                                ? "Processing..."
                                : "Emergency Force Complete"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "workers" && (
          <div className="space-y-10">
            {!selectedWorker && (
              <div className="neumorph p-10 rounded-[2.5rem] bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-900/30">
                <h3 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-6">
                  Support & Contact Settings
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-yellow-800 dark:text-yellow-400 font-black mb-1 text-lg">
                      Global Admin Support Number
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500/70 font-medium italic">
                      Update this link to change where Customers & Workers reach
                      you for help.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      value={newSupportNumber}
                      onChange={(e) => setNewSupportNumber(e.target.value)}
                      placeholder="Ex: 918078971032"
                      className="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-yellow-400 outline-none font-bold text-gray-900 dark:text-white shadow-sm w-full md:w-64"
                    />
                    <button
                      onClick={handleUpdateSupportNumber}
                      className="bg-gray-900 dark:bg-yellow-400 text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black hover:bg-black dark:hover:bg-yellow-500 transition-all shadow-lg active:scale-95"
                    >
                      SAVE
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="neumorph p-10 rounded-[2.5rem]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h3 className="text-xl font-bold">
                    Fixivo Experts Directory
                  </h3>
                  <p className="text-sm text-gray-400 font-medium">
                    Manage and monitor all service providers
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={async () => {
                      const t = toast.loading(
                        "Syncing workers & administrative roles...",
                      );
                      try {
                        const res = await axios.post("https://fixivobeckend.onrender.com/api/admin/sync-workers");
                        toast.success(
                          res.data.message || "Database sync complete!",
                          { id: t },
                        );
                      } catch (e: any) {
                        toast.error(
                          "Sync failed: " +
                            (e.response?.data?.error || e.message),
                          { id: t },
                        );
                      }
                    }}
                    className="bg-white border-2 border-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <Zap className="w-3 h-3 text-yellow-500" />
                    Repair Sync
                  </button>
                  <div className="flex gap-2">
                    <span className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-bold leading-tight flex flex-col items-center min-w-[60px]">
                      <span className="text-[10px] uppercase opacity-60">
                        Total
                      </span>
                      {workers.length}
                    </span>
                    <span className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-bold leading-tight flex flex-col items-center min-w-[60px]">
                      <span className="text-[10px] uppercase opacity-60">
                        Verified
                      </span>
                      {workers.filter((w) => w.verified).length}
                    </span>
                    <span className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold leading-tight flex flex-col items-center min-w-[60px]">
                      <span className="text-[10px] uppercase opacity-60">
                        Pending
                      </span>
                      {workers.filter((w) => !w.verified).length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers
                  .filter(
                    (w) =>
                      w.name
                        ?.toLowerCase()
                        .includes(workerSearch.toLowerCase()) ||
                      w.id.toLowerCase().includes(workerSearch.toLowerCase()) ||
                      w.skills?.some((s: string) =>
                        s.toLowerCase().includes(workerSearch.toLowerCase()),
                      ),
                  )
                  .map((w) => (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorker(w)}
                      className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-yellow-400 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center text-white text-2xl font-black">
                          {w.name?.[0] || "W"}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                            {w.name || "Anonymous Worker"}
                          </h4>
                          <p className="text-[10px] text-gray-400 italic">
                            ID: {w.id.slice(-6)}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {w.verified ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400 font-medium tracking-tight">
                            Status
                          </span>
                          <span
                            className={`font-black uppercase text-[10px] ${w.verified ? "text-green-600" : "text-orange-500"}`}
                          >
                            {w.verified
                              ? "Verified"
                              : w.verificationStatus || "Unverified"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400 font-medium tracking-tight">
                            Exp / Jobs
                          </span>
                          <span className="font-bold text-gray-900">
                            {w.experience}y / {w.jobsCompleted || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400 font-medium tracking-tight">
                            Rating
                          </span>
                          <span className="font-bold text-yellow-500 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {w.rating || "0.0"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                          <span className="text-gray-400 font-medium tracking-tight">
                            Contact
                          </span>
                          <span className="font-bold text-gray-900 text-xs">
                            {w.phone || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {w.skills?.slice(0, 3).map((s: string) => (
                          <span
                            key={s}
                            className="bg-gray-50 text-gray-400 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tight"
                          >
                            {s}
                          </span>
                        ))}
                        {(w.skills?.length || 0) > 3 && (
                          <span className="text-[9px] text-gray-300 font-bold">
                            +{w.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                {workers.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-black">
                      No workers registered in the platform yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="neumorph p-10 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-8">Worker Rankings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-gray-900 text-white text-sm font-black uppercase tracking-widest rounded-t-2xl">
                    <th className="py-6 pl-6 rounded-tl-2xl">Rank</th>
                    <th className="py-6">Worker</th>
                    <th className="py-6">Jobs</th>
                    <th className="py-6">Rating</th>
                    <th className="py-6">Points</th>
                    <th className="py-6 pr-6 rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900 font-bold dark:text-gray-100">
                  {[...workers]
                    .sort(
                      (a, b) =>
                        (b.leaderboardScore || 0) - (a.leaderboardScore || 0),
                    )
                    .map((w, idx) => (
                      <tr
                        key={`${w.id || idx}-${idx}`}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-6 pl-6 font-black text-gray-900 dark:text-white">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-200 text-gray-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}
                          >
                            #{idx + 1}
                          </div>
                        </td>
                        <td className="py-6 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-black overflow-hidden shadow-sm">
                            {w.name?.[0] || "W"}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">
                              {w.name || "Unknown"}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                              ID: {w.id.slice(-6)}
                            </p>
                          </div>
                        </td>
                        <td className="py-6 text-gray-700 dark:text-gray-300">
                          {w.jobsCompleted || 0}
                        </td>
                        <td className="py-6">
                          <div className="flex items-center gap-1 text-yellow-500 font-black">
                            <Star className="w-4 h-4 fill-current" />
                            {w.rating || "0.0"}
                          </div>
                        </td>
                        <td className="py-6">
                          <span className="font-black text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-full text-xs">
                            {w.leaderboardScore || 0} pts
                          </span>
                        </td>
                        <td className="py-6">
                          {rewardingWorkerId === w.id ? (
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-yellow-200">
                              <input
                                type="number"
                                value={rewardAmount}
                                onChange={(e) =>
                                  setRewardAmount(e.target.value)
                                }
                                className="bg-white dark:bg-gray-900 text-xs p-2 rounded-lg border dark:border-gray-700 outline-none dark:text-white"
                                placeholder="Amount"
                              />
                              <input
                                value={rewardReason}
                                onChange={(e) =>
                                  setRewardReason(e.target.value)
                                }
                                className="bg-white dark:bg-gray-900 text-[10px] p-2 rounded-lg border dark:border-gray-700 outline-none dark:text-white"
                                placeholder="Reason"
                              />
                              <div className="flex gap-1">
                                <button
                                  disabled={!!submittingReward}
                                  onClick={async () => {
                                    if (
                                      !rewardAmount ||
                                      isNaN(parseFloat(rewardAmount))
                                    ) {
                                      return toast.error("Enter valid amount");
                                    }

                                    setSubmittingReward(w.id);
                                    const t = toast.loading(
                                      `Sending ₹${rewardAmount}...`,
                                    );
                                    try {
                                      const response = await axios.post(
                                        "/api/admin/give-reward",
                                        {
                                          workerId: w.id,
                                          workerName: w.name || "Worker",
                                          amount: parseFloat(rewardAmount),
                                          reason: rewardReason,
                                        },
                                      );

                                      if (response.data.success) {
                                        toast.success("Reward sent!", {
                                          id: t,
                                        });
                                        setRewardingWorkerId(null);
                                        setRewardAmount("");
                                        setRewardReason("");
                                      }
                                    } catch (e: any) {
                                      toast.error(
                                        "Failed: " +
                                          (e.response?.data?.error ||
                                            e.message),
                                        { id: t },
                                      );
                                    } finally {
                                      setSubmittingReward(null);
                                    }
                                  }}
                                  className="flex-1 bg-green-500 text-white text-[10px] font-black py-2 rounded-lg disabled:opacity-50"
                                >
                                  {submittingReward === w.id ? "..." : "SEND"}
                                </button>
                                <button
                                  onClick={() => setRewardingWorkerId(null)}
                                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black py-2 rounded-lg"
                                >
                                  X
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              disabled={!!submittingReward}
                              onClick={() => {
                                console.log(
                                  "[Admin] Zap button clicked for worker:",
                                  w.id,
                                );
                                setRewardingWorkerId(w.id);
                                setRewardAmount("500");
                              }}
                              className="bg-yellow-400 text-white p-2.5 rounded-xl hover:bg-yellow-500 hover:scale-110 active:scale-95 transition-all shadow-md group border-2 border-white disabled:opacity-50"
                              title="Grant Reward"
                            >
                              <Zap
                                className={`w-4 h-4 fill-current ${submittingReward === w.id ? "animate-spin" : "group-hover:animate-pulse"}`}
                              />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-12">
            <div className="neumorph p-10 rounded-[2.5rem]">
              <h3 className="text-xl font-bold mb-8">
                Monthly Reward Program History
              </h3>
              <div className="space-y-4">
                <RewardHistoryList />
              </div>
            </div>

            <div className="neumorph p-10 rounded-[2.5rem]">
              <h3 className="text-xl font-bold mb-8">
                Active Point Multipliers
              </h3>
              <div className="p-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-green-100">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-black uppercase text-xs tracking-widest">
                      Active System-Wide Event
                    </span>
                  </div>
                  <p className="text-2xl font-black mb-1">
                    Weekend Surge Bonus
                  </p>
                  <p className="font-bold opacity-80">
                    All workers receive 1.5x leaderboard points for emergency
                    jobs.
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl font-black text-xl border border-white/20">
                  1.5X Points
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <div className="neumorph p-10 rounded-[2.5rem]">
            <h3 className="text-xl font-bold mb-8">Open Disputes</h3>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] flex flex-col md:flex-row justify-between gap-8"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-black uppercase text-xs tracking-widest">
                        Urgent Dispute
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Booking #FIX-982{i}
                    </h4>
                    <p className="text-gray-600 font-medium mb-4">
                      User claims worker did not arrive, but worker marked job
                      as in-progress. Location data shows worker was at site.
                    </p>
                    <div className="flex gap-4">
                      <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-500">
                        User: Adithyan
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-500">
                        Worker: Jabir
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 justify-center">
                    <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all">
                      Resolve for User
                    </button>
                    <button className="bg-white text-gray-900 border-2 border-gray-100 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">
                      Resolve for Worker
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "finished" && (
          <div className="neumorph p-10 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold text-gray-900">
                Completed Projects Log
              </h3>
              <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-black">
                {bookings.filter((b) => b.status === "completed").length} Total
                completions
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bookings
                .filter((b) => b.status === "completed")
                .filter((b) => {
                  const matchesSearch =
                    b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                    b.userName
                      ?.toLowerCase()
                      .includes(bookingSearch.toLowerCase());
                  const matchesDate = dateFilter ? b.date === dateFilter : true;
                  return matchesSearch && matchesDate;
                })
                .map((job) => {
                  const assignedWorker = workers.find(
                    (w) => w.id === job.workerId,
                  );
                  return (
                    <div
                      key={job.id}
                      className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                {job.serviceType}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(job.id);
                                }}
                                className="text-[9px] font-black text-gray-300 dark:text-gray-600 hover:text-yellow-500 transition-colors"
                              >
                                {copiedId === job.id
                                  ? "COPIED!"
                                  : `#${job.id.slice(-6)}`}
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase">
                              Expert Fix Done
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-gray-900 dark:text-white">
                            ₹{job.billDetails?.totalBilled || job.amount || 0}
                          </p>
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase">
                            {job.paymentStatus === "paid"
                              ? "Paid Full"
                              : "Settled to Worker"}
                          </p>
                        </div>
                      </div>

                      {job.billDetails && (
                        <div className="mb-6 p-5 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-3xl text-left">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">
                                Service Fee
                              </p>
                              <p className="text-xs font-black text-gray-900 dark:text-white">
                                ₹{job.billDetails.serviceFee}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">
                                Payment Mode
                              </p>
                              <p className="text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase">
                                {job.billDetails.paymentMode}
                              </p>
                            </div>
                            {job.billDetails.spareParts?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1 border-t dark:border-gray-700 pt-2">
                                  Materials & Spares
                                </p>
                                {job.billDetails.spareParts.map(
                                  (p: any, i: number) => (
                                    <div
                                      key={i}
                                      className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400"
                                    >
                                      <span>{p.name}</span>
                                      <span>₹{p.price}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                            {job.billDetails.paymentProofUrl && (
                              <div className="col-span-2 pt-2">
                                <a
                                  href={job.billDetails.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-black text-[9px] uppercase hover:underline"
                                >
                                  <Camera className="w-3 h-3" />
                                  View Billing Screenshot
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">
                            Worker
                          </p>
                          <button
                            onClick={() =>
                              assignedWorker &&
                              setSelectedWorker(assignedWorker)
                            }
                            className="text-xs font-black text-gray-900 dark:text-white hover:text-yellow-500 transition-colors flex items-center gap-2"
                          >
                            {assignedWorker?.name || "Unknown"}{" "}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">
                            Customer
                          </p>
                          <p className="text-xs font-black text-gray-900 dark:text-white">
                            {job.userName || "Anonymous"}
                          </p>
                        </div>
                      </div>

                      {job.completionPhotos &&
                        job.completionPhotos.length > 0 && (
                          <div className="mb-6">
                            <p className="text-[10px] text-gray-400 font-black uppercase mb-3">
                              Completion Proof (Before/After)
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {job.completionPhotos.map(
                                (url: string, i: number) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-100 hover:scale-105 transition-transform"
                                  >
                                    <img
                                      src={url}
                                      alt="Proof"
                                      className="w-full h-full object-cover"
                                    />
                                  </a>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          Completed{" "}
                          {job.completedAt
                            ? new Date(job.completedAt).toLocaleDateString()
                            : "recently"}
                        </div>
                        <div className="bg-gray-900 px-4 py-1.5 rounded-full text-[10px] text-white font-black uppercase tracking-tighter">
                          OTP Verified ✓
                        </div>
                      </div>
                    </div>
                  );
                })}
              {bookings.filter((b) => b.status === "completed").length ===
                0 && (
                <div className="col-span-full py-32 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  No completed works yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="neumorph p-10 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Pending Verifications</h3>
              <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-black">
                {
                  workers.filter(
                    (w) =>
                      !w.verified ||
                      w.verificationStatus === "pending" ||
                      w.verificationStatus === "correction_required",
                  ).length
                }{" "}
                Applications
              </div>
            </div>

            <div className="space-y-6">
              {workers
                .filter(
                  (w) =>
                    !w.verified ||
                    w.verificationStatus === "pending" ||
                    w.verificationStatus === "correction_required" ||
                    w.verificationStatus === "rejected",
                )
                .map((w) => (
                  <div
                    key={w.id}
                    className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 text-left">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-4xl font-black text-gray-200">
                          {w.name?.[0] || "W"}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-gray-900">
                            {w.name || "New Worker"}
                          </h4>
                          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">
                            {w.id}
                          </p>
                          <div className="flex gap-2 mt-3">
                            {w.skills?.map((s: string) => (
                              <span
                                key={s}
                                className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                          Experience
                        </p>
                        <p className="text-2xl font-black text-gray-900">
                          {w.experience} Years
                        </p>
                        <span
                          className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            w.verificationStatus === "correction_required"
                              ? "bg-blue-100 text-blue-600"
                              : w.verificationStatus === "rejected"
                                ? "bg-red-100 text-red-600"
                                : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {w.verificationStatus || "Pending"}
                        </span>
                      </div>
                    </div>

                    {w.rejectionReason && (
                      <div className="mb-8 p-4 bg-gray-50 rounded-2xl border-l-4 border-yellow-400">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                          Last Feedback / Reason
                        </p>
                        <p className="text-sm font-bold text-gray-700 italic">
                          "{w.rejectionReason}"
                        </p>
                      </div>
                    )}

                    <div className="mb-8">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-4 tracking-widest">
                        Verification Documents{" "}
                        {w.documents ? `(${w.documents.length})` : "(Missing)"}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {w.documents &&
                        Array.isArray(w.documents) &&
                        w.documents.length > 0 ? (
                          w.documents.map((doc: string, idx: number) => (
                            <a
                              key={idx}
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all shadow-sm"
                            >
                              <img
                                src={doc}
                                alt={`Doc ${idx}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </a>
                          ))
                        ) : (
                          <div className="col-span-full py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="font-black uppercase text-xs tracking-widest mb-1">
                              Documents Missing
                            </p>
                            <p className="text-[10px] font-medium max-w-xs mx-auto italic">
                              Warning: Worker registered but didn't upload or
                              upload failed. Check debug log.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-[2rem]">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Bank Account Details
                        (Payouts)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                            Holder Name
                          </p>
                          <p className="text-xs font-black text-gray-900">
                            {w.bankAccountName || "---"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                            Account No
                          </p>
                          <p className="text-xs font-black text-gray-900">
                            {w.bankAccountNumber || "---"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                            IFSC Code
                          </p>
                          <p className="text-xs font-black text-gray-900 uppercase">
                            {w.bankIFSC || "---"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                            Bank Name
                          </p>
                          <p className="text-xs font-black text-gray-900 uppercase">
                            {w.bankName || "---"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <button
                        onClick={() => {
                          const el = document.getElementById(`debug-${w.id}`);
                          if (el) el.classList.toggle("hidden");
                        }}
                        className="text-[10px] text-blue-500 font-black uppercase hover:underline"
                      >
                        Toggle Debug Data (Raw Firestore)
                      </button>
                      <pre
                        id={`debug-${w.id}`}
                        className="hidden mt-4 p-4 bg-gray-900 text-green-400 text-[10px] rounded-xl overflow-x-auto"
                      >
                        {JSON.stringify(w, null, 2)}
                      </pre>

                      {w.upload_errors && (
                        <div className="mt-4 p-4 bg-red-50 border-2 border-red-100 rounded-2xl">
                          <p className="text-[10px] text-red-500 font-black uppercase mb-2">
                            Backend Upload Errors
                          </p>
                          <ul className="list-disc list-inside text-xs text-red-600">
                            {w.upload_errors.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[2rem]">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-4">
                        Admin Decision
                      </p>
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full">
                          <textarea
                            id={`reason-${w.id}`}
                            placeholder="Rejection reason or correction feedback..."
                            className="w-full bg-white p-4 rounded-xl border border-gray-100 outline-none focus:border-yellow-400 min-h-[100px] font-medium text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                          <button
                            onClick={() => handleApproveWorker(w.id)}
                            className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                          >
                            Approve Profile
                          </button>
                          <button
                            onClick={() => {
                              const reason = (
                                document.getElementById(
                                  `reason-${w.id}`,
                                ) as HTMLTextAreaElement
                              ).value;
                              handleRequestCorrection(w.id, reason);
                            }}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
                          >
                            Request Correction
                          </button>
                          <button
                            onClick={() => {
                              const reason = (
                                document.getElementById(
                                  `reason-${w.id}`,
                                ) as HTMLTextAreaElement
                              ).value;
                              handleRejectWorker(w.id, reason);
                            }}
                            className="text-red-500 font-bold text-sm hover:text-red-600 py-2"
                          >
                            Reject Application
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {workers.filter(
                (w) => !w.verified || w.verificationStatus !== "approved",
              ).length === 0 && (
                <div className="py-20 text-center text-gray-400 font-bold">
                  No pending verifications
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "system" && (
          <div className="neumorph p-10 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Expert System Recovery
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  Manually repair database links for expert partners
                </p>
              </div>
             <button
  onClick={async () => {
    const t = toast.loading("Reading registration database...");
    try {
      const res = await axios.get("/api/admin/all-users");

      (window as any).systemUsersList = res.data.data || [];

      toast.success(
        `Found ${res.data.data?.length || 0} registered profiles!`,
        { id: t },
      );

      setActiveTab("system");
    } catch (e) {
      toast.error("Could not connect to system database.", {
        id: t,
      });
    }
  }}
  className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-gray-200"
>
  <RefreshCw className="w-4 h-4" />
  Initialize System List
</button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-red-500" />
                <div className="text-left">
                  <p className="text-red-800 font-black tracking-tight">
                    ATTENTION ADMIN
                  </p>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    If an expert is missing from your dashboard, find them in
                    the list below and click <strong>"Emergency Repair"</strong>
                    . This force-synchronizes their application status across
                    all systems.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-100">
                      <th className="py-5 px-8">Expert Identity</th>
                      <th className="py-5 px-8">System ID</th>
                      <th className="py-5 px-8">Role</th>
                      <th className="py-5 px-8 text-right">
                        Self-Healing Tools
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(Array.isArray((window as any).systemUsersList)
                      ? (window as any).systemUsersList
                      : []
                    ).map(
                      (u: any, idx: number) => {
                        const displayId = u.id || u.uid || u.firebaseId;
                        return (
                          <tr
                            key={displayId || `user-${idx}`}
                            className="hover:bg-gray-50/30 transition-all group"
                          >
                            <td className="py-6 px-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black">
                                  {u.name?.[0] || "U"}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 leading-none mb-1">
                                    {u.name ||
                                      u.email?.split("@")[0] ||
                                      "Anonymous"}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-6 px-8 text-[10px] font-mono text-gray-400 opacity-50 group-hover:opacity-100 transition-all">
                              {displayId}
                            </td>
                            <td className="py-6 px-8">
                              <span
                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${u.role === "worker" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-6 px-8 text-right">
                              <button
                                onClick={async () => {
                                  const t = toast.loading(
                                    "Running emergency repair sequence...",
                                  );
                                  try {
                                    await axios.post(
                                      "https://fixivobeckend.onrender.com/api/admin/promote-user",
                                      {
                                        id: displayId,
                                      },
                                    );
                                    toast.success(
                                      "Data Repair Success! Now click REPAIR SYNC in Workers tab.",
                                      { id: t },
                                    );
                                  } catch (e: any) {
                                    const errMsg =
                                      e.response?.data?.error || e.message;
                                    toast.error("Repair failed: " + errMsg, {
                                      id: t,
                                    });
                                  }
                                }}
                                className="bg-white border-2 border-gray-100 text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white hover:border-gray-900 active:scale-95 transition-all shadow-sm"
                              >
                                Emergency Repair
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                    {!(window as any).systemUsersList && (
                      <tr key="empty-state-row">
                        <td colSpan={4} className="py-32 text-center">
                          <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-300 font-black uppercase tracking-widest text-sm">
                            List Initialized Needed
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                            Click the button above to fetch data
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Worker Detail Modal */}
        {selectedWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedWorker(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Side Info */}
              <div className="w-full md:w-[350px] bg-gray-900 p-10 text-white flex flex-col">
                <div className="w-24 h-24 rounded-3xl bg-yellow-400 flex items-center justify-center text-4xl font-black mb-8">
                  {selectedWorker.name?.[0] || "W"}
                </div>
                <h2 className="text-3xl font-black mb-2 leading-tight">
                  {selectedWorker.name}
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8 opacity-60">
                  Expert ID: {selectedWorker.id}
                </p>

                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase">
                        Rating
                      </p>
                      <p className="text-lg font-black">
                        {selectedWorker.rating || "5.0"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase">
                        Experience
                      </p>
                      <p className="text-lg font-black">
                        {selectedWorker.experience} Years
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <ShieldCheck
                        className={`w-6 h-6 ${selectedWorker.verified ? "text-green-400" : "text-orange-400"}`}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase">
                        Status
                      </p>
                      <p
                        className={`text-sm font-black uppercase ${selectedWorker.verified ? "text-green-400" : "text-orange-400"}`}
                      >
                        {selectedWorker.verified
                          ? "Verified Expert"
                          : selectedWorker.verificationStatus || "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">
                      WhatsApp / Contact
                    </p>
                    <p className="text-sm font-black text-yellow-400">
                      {selectedWorker.phone || "N/A"}
                    </p>
                    {selectedWorker.phone && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://wa.me/${selectedWorker.phone.replace(/\D/g, "")}`,
                            "_blank",
                          )
                        }
                        className="mt-2 text-[10px] bg-green-500 text-white px-3 py-1 rounded-lg font-black uppercase hover:bg-green-600 transition-all"
                      >
                        WhatsApp Worker
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">
                      Member Since
                    </p>
                    <p className="text-sm font-bold text-gray-300">
                      {selectedWorker.createdAt
                        ?.toDate?.()
                        .toLocaleDateString() || "Recently joined"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-12 overflow-y-auto">
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="absolute top-8 right-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6 dark:text-white" />
                </button>

                <div className="mb-10">
                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-6">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorker.skills?.map((s: string) => (
                          <span
                            key={s}
                            className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-gray-100"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                        Jobs Completed
                      </p>
                      <p className="text-xl font-black text-gray-900">
                        {selectedWorker.jobsCompleted || 0} Successful Works
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-6">
                    Financial Records
                  </h3>
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                        Bank Name
                      </p>
                      <p className="text-sm font-black text-gray-900 uppercase">
                        {selectedWorker.bankName || "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                        A/C Number
                      </p>
                      <p className="text-sm font-black text-gray-900">
                        {selectedWorker.bankAccountNumber || "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                        Holder Name
                      </p>
                      <p className="text-sm font-black text-gray-900 uppercase">
                        {selectedWorker.bankAccountName || "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">
                        IFSC Code
                      </p>
                      <p className="text-sm font-black text-gray-900 uppercase">
                        {selectedWorker.bankIFSC || "---"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-6">
                    Identity Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedWorker.documents?.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all"
                      >
                        <img
                          src={url}
                          alt="Doc"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const msg = `Hi Admin, I'm reviewing worker ${selectedWorker.name} (${selectedWorker.id})...`;
                    window.open(
                      `https://wa.me/${supportNumber}?text=${encodeURIComponent(msg)}`,
                    );
                  }}
                  className="w-full py-5 bg-green-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-100"
                >
                  <MessageSquare className="w-5 h-5" />
                  CONTACT WORKER FOR DETAILS
                </button>

                {selectedWorker.verified && (
                  <button
                    onClick={() =>
                      setUnverifyModal({
                        isOpen: true,
                        workerId: selectedWorker.id,
                        reason: "",
                      })
                    }
                    className="w-full mt-4 py-4 bg-red-100 text-red-600 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-200 transition-all"
                  >
                    <AlertCircle className="w-5 h-5" />
                    UNVERIFY WORKER (RE-VERIFICATION)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Unverify Modal */}
        <AnimatePresence>
          {unverifyModal.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6 text-red-600">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black uppercase">
                    Unverify Worker
                  </h2>
                </div>
                <p className="text-gray-500 font-bold mb-6 italic">
                  Explain why this worker needs to re-verify:
                </p>
                <textarea
                  value={unverifyModal.reason}
                  onChange={(e) =>
                    setUnverifyModal({
                      ...unverifyModal,
                      reason: e.target.value,
                    })
                  }
                  placeholder="e.g. Identity document expired, invalid phone number..."
                  className="w-full bg-gray-50 border-2 border-gray-100 focus:border-red-400 p-4 rounded-2xl outline-none font-bold min-h-[120px] mb-6 transition-all"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setUnverifyModal({
                        isOpen: false,
                        workerId: "",
                        reason: "",
                      })
                    }
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleUnverifyWorker}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                  >
                    UNVERIFY
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
