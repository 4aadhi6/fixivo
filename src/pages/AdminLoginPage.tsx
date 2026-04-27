import React, { useState } from "react";
import { motion } from "motion/react";
import {
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

export default function AdminLoginPage() {
  const { setMockUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handlePostLogin = async (user: any) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const isAdminEmail =
      user.email === "adithyanr350@gmail.com" ||
      user.email === "admin@fixivo.com";

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || "Admin",
        email: user.email || "",
        role: "admin",
        createdAt: new Date().toISOString(),
        addresses: [],
      });
    } else if (isAdminEmail && userDoc.data()?.role !== "admin") {
      await updateDoc(userDocRef, { role: "admin" });
    }

    toast.success("Admin access granted");
    navigate("/admin");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isAdminEmail =
        result.user.email === "adithyanr350@gmail.com" ||
        result.user.email === "admin@fixivo.com";

      if (isAdminEmail) {
        await handlePostLogin(result.user);
      } else {
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        if (userDoc.data()?.role === "admin") {
          await handlePostLogin(result.user);
        } else {
          await auth.signOut();
          toast.error("Access denied: Unauthorized account");
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("auth/unauthorized-domain")) {
        toast.error(
          `Admin login failed: Unauthorized Domain (${window.location.hostname}). Please add this domain to Firebase Authorized Domains.`,
          { duration: 10000 },
        );
      } else {
        toast.error("Admin login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter credentials");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const isAdminEmail =
        result.user.email === "adithyanr350@gmail.com" ||
        result.user.email === "admin@fixivo.com";

      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      const userData = userDoc.data();

      if (userData?.role === "admin" || isAdminEmail) {
        await handlePostLogin(result.user);
      } else {
        await auth.signOut();
        toast.error("Access denied: Unauthorized account");
      }
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("auth/unauthorized-domain")) {
        toast.error(
          `Admin login failed: Unauthorized Domain (${window.location.hostname}). Please add this domain to Firebase Authorized Domains.`,
          { duration: 10000 },
        );
      } else {
        toast.error("Admin login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full object-cover opacity-20 filter grayscale blur-sm"
          alt="admin-bg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-white p-3 rounded-3xl shadow-xl shadow-yellow-200/20 mb-6"
          >
            <img
              src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
              alt="Fixivo Logo"
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            ADMIN PORTAL
          </h1>
          <p className="text-gray-400 font-medium">Fixivo Management System</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Secure Login
          </h2>
          <p className="text-gray-500 mb-8 text-center">
            Enter your administrative credentials
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt="Google"
              />
              Admin Google Login
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Back to Main Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
