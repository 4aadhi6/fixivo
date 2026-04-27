import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User as UserIcon,
  MapPin,
  History,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { db, auth } from "./firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { LogoLoader } from "./components/LogoLoader";
import toast from "react-hot-toast";
import { formatCurrency } from "./lib/utils";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      // Removed orderBy('createdAt', 'desc') to avoid composite index requirement in dev
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort client-side by createdAt descending
        data.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setBookings(data);
        setLoading(false);
      },
      (error) => {
        console.error("Bookings fetch error:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user, authLoading]);

  if (authLoading || loading) return <LogoLoader />;
  if (!user)
    return <div className="p-20 text-center font-bold">Please login</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-yellow-400 pt-32 pb-20 px-6 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-white p-2 flex items-center justify-center shadow-xl shadow-yellow-500/20">
              <img
                src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
                alt="Fixivo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                {profile?.name || user.displayName}
              </h1>
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => auth.signOut()}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="neumorph p-8 rounded-[2rem] bg-yellow-50 border-2 border-yellow-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-700">
              <Zap className="w-5 h-5" />
              Quick Actions
            </h3>
            <Link
              to="/diagnosis"
              className="w-full bg-yellow-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-200"
            >
              Book New Service
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <History className="w-6 h-6 text-yellow-500" />
            My Bookings
          </h2>

          {bookings.length === 0 ? (
            <div className="neumorph p-12 rounded-[2.5rem] text-center">
              <p className="font-bold text-gray-400">No bookings yet.</p>
              <Link
                to="/diagnosis"
                className="text-yellow-500 font-bold mt-4 inline-block"
              >
                Start your first fix
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((b) => (
                <Link key={b.id} to={`/booking/status/${b.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="neumorph p-6 rounded-3xl flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-yellow-50 p-3 rounded-xl group-hover:bg-yellow-400 group-hover:text-white transition-colors">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white capitalize">
                          {b.serviceType}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {b.createdAt?.toDate
                            ? b.createdAt.toDate().toLocaleDateString()
                            : b.createdAt
                              ? new Date(b.createdAt).toLocaleDateString()
                              : "Recent"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                          b.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {b.status}
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                        {formatCurrency(99)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
