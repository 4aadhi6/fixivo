import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LogIn,
  Mail,
  Phone,
  ArrowRight,
  Wrench,
  ShieldCheck,
  Lock,
  User as UserIcon,
  Zap,
} from "lucide-react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocFromServer,
} from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { setMockUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"user" | "worker">("user");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("redirect") === "worker-reg") {
      toast("Please login or register to continue worker registration", {
        icon: "ℹ️",
      });
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log("Initiating Google Login with popup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Login raw success:", result.user.email);
      await handlePostLogin(result.user);
    } catch (error: any) {
      console.error(
        "Google Auth Error Details:",
        JSON.stringify(error, null, 2),
      );
      const errorMsg = error.message || "";
      const errorCode = error.code || "";

      if (
        errorMsg.includes("auth/unauthorized-domain") ||
        errorMsg.includes("offline")
      ) {
        toast.error(
          `Domain Blocked: Ensure "${window.location.hostname}" is added to "Authorized Domains" in Firebase Console > Authentication > Settings.`,
          { duration: 10000 },
        );
      } else if (errorMsg.includes("auth/operation-not-allowed")) {
        toast.error(
          "Google Login is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable Google.",
          { duration: 10000 },
        );
      } else if (
        errorMsg.includes("auth/invalid-credential") ||
        errorMsg.includes("CODE_EXCHANGE")
      ) {
        toast.error(
          'Authentication Error (invalid-credential): This usually happens if the domain is not authorized or the Firebase project config is mismatched. Check your Google Cloud "Authorized Redirect URIs".',
          { duration: 10000 },
        );
        console.warn(
          'RECOVERY HINT: If you are an Admin, please ensure "https://' +
            window.location.hostname +
            '/__/__/auth/handler" exists in your Google Cloud OAuth Client ID authorized redirects.',
        );
      } else if (errorMsg.includes("auth/popup-closed-by-user")) {
        toast.error("Login cancelled: Popup closed.");
      } else {
        toast.error("Login error: " + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) return toast.error("Please enter phone number");

    // Basic phone number formatting check
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      // Default to +91 if no country code provided
      formattedPhone = "+91" + formattedPhone.replace(/\D/g, "");
    }

    if (formattedPhone.length < 12) {
      return toast.error(
        "Please enter a valid phone number with country code (e.g., +919876543210)",
      );
    }

    setLoading(true);
    try {
      // Clear existing verifier if any to avoid re-rendering issues
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {}
      }

      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal", // Visible reCAPTCHA is often more reliable for OTP
        callback: () => {
          console.log("reCAPTCHA solved");
        },
      });
      setRecaptchaVerifier(verifier);

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        verifier,
      );
      setConfirmationResult(confirmation);
      setShowOtp(true);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      console.error("reCAPTCHA/OTP Error:", error);
      if (error.message.includes("auth/unauthorized-domain")) {
        toast.error(
          `Failed to send OTP: Unauthorized Domain (${window.location.hostname}). Please add this domain to Firebase Authorized Domains.`,
          { duration: 10000 },
        );
      } else if (error.message.includes("auth/operation-not-allowed")) {
        toast.error(
          "Failed to send OTP: Phone Authentication is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.",
          { duration: 10000 },
        );
      } else {
        toast.error("Failed to send OTP: " + error.message);
      }
      // If it fails, clear the verifier so it can be re-initialized
      try {
        if (recaptchaVerifier) recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return toast.error("Please enter OTP");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handlePostLogin(result.user);
    } catch (error: any) {
      console.error(error);
      toast.error("Invalid OTP: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) return toast.error("Enter credentials");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        adminEmail,
        adminPassword,
      );
      await handlePostLogin(result.user);
    } catch (error: any) {
      console.error(error);
      toast.error("Admin login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Please enter your email address first");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return toast.error("Enter credentials");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(result.user);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("auth/unauthorized-domain")) {
        toast.error(
          `Login failed: Unauthorized Domain (${window.location.hostname}). Please add this domain to Firebase Authentication Authorized Domains.`,
          { duration: 10000 },
        );
      } else {
        toast.error("Login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!email || !password || !name) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(result.user, { displayName: name });
      await handlePostLogin(result.user);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("auth/unauthorized-domain")) {
        toast.error(
          `Registration failed: Unauthorized Domain (${window.location.hostname}). Please add this domain to Firebase Authentication Authorized Domains.`,
          { duration: 10000 },
        );
      } else {
        toast.error("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostLogin = async (user: any) => {
    const isAdminEmail =
      user.email === "adithyanr350@gmail.com" ||
      user.email === "admin@fixivo.com";

    try {
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid);

      let userDoc;
      try {
        // We use getDocFromServer to force a fresh check, which helps detect if the domain fix worked
        userDoc = await getDocFromServer(userDocRef);
      } catch (e: any) {
        console.error("Post-login Firestore check failed:", e);

        // RESILIENCY: If we are offline but we know the user is an admin by email,
        // allow them into a "degraded" admin session instead of blocking them.
        if (isAdminEmail) {
          toast.success(
            "Admin detected (Offline Mode). Some data may not load until domain is authorized.",
          );
          navigate("/admin");
          return;
        }

        toast.error(
          "Auth successful, but Firestore is blocked. Ensure this domain is added to 'Authorized Domains' in Firebase Console.",
        );
        navigate("/");
        return;
      }

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || name || "User",
          email: user.email || email || "",
          phone: user.phoneNumber || phone || "",
          role: isAdminEmail
            ? "admin"
            : loginType === "worker"
              ? "worker"
              : "user",
          createdAt: new Date().toISOString(),
          addresses: [],
        });
      } else if (isAdminEmail && userDoc.data()?.role !== "admin") {
        // Sync admin role for existing users with admin emails
        await updateDoc(userDocRef, { role: "admin" });
      }

      toast.success("Welcome to Fixivo!");

      // Force a small delay to ensure Firestore updates are propagated
      let userData = userDoc.data();
      if (!userData?.role) {
        let attempts = 0;
        while (attempts < 5) {
          try {
            const updatedUserDoc = await getDocFromServer(userDocRef);
            userData = updatedUserDoc.data();
            if (userData?.role) break;
          } catch (e) {}
          await new Promise((resolve) => setTimeout(resolve, 800));
          attempts++;
        }
      }

      if (userData?.role === "admin" || isAdminEmail) {
        navigate("/admin");
      } else if (userData?.role === "worker") {
        const workerDoc = await getDoc(doc(db, "workers", user.uid));
        if (!workerDoc.exists()) {
          navigate("/worker/register");
        } else {
          navigate("/worker/dashboard");
        }
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        if (
          searchParams.get("redirect") === "worker-reg" ||
          loginType === "worker"
        ) {
          navigate("/worker/register");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Post-login critical error:", error);
      if (isAdminEmail) {
        navigate("/admin");
      } else {
        toast.error("Session initialized but profile setup failed.");
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-y-auto">
      {/* Background decoration - Simplified for clarity */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-400 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-200 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Hidden Admin Link */}
      <Link
        to="/admin/login"
        className="absolute top-4 left-4 text-gray-200 hover:text-gray-400 text-[10px] font-mono z-20"
      >
        ADMIN_ACCESS
      </Link>

      <div
        id="recaptcha-container"
        className="fixed bottom-4 right-4 z-50"
      ></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block bg-white p-4 rounded-[2rem] shadow-2xl shadow-yellow-200 mb-6 border border-yellow-50"
          >
            <img
              src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
              alt="Fixivo Logo"
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-2">
            FIXIVO
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            Premium Home Services
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100">
          <div className="flex gap-4 mb-10 bg-gray-100 p-2 rounded-2xl">
            <button
              type="button"
              onClick={() => setLoginType("user")}
              className={`flex-1 py-4 rounded-xl font-black transition-all ${loginType === "user" ? "bg-white text-gray-900 shadow-md scale-[1.02]" : "text-gray-400 hover:text-gray-600"}`}
            >
              User Access
            </button>
            <button
              type="button"
              onClick={() => setLoginType("worker")}
              className={`flex-1 py-4 rounded-xl font-black transition-all ${loginType === "worker" ? "bg-white text-gray-900 shadow-md scale-[1.02]" : "text-gray-400 hover:text-gray-600"}`}
            >
              Worker Access
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {loginType === "worker"
              ? isRegister
                ? "Worker Registration"
                : "Worker Login"
              : isRegister
                ? "Create Account"
                : "Welcome Back"}
          </h2>
          <p className="text-gray-500 mb-8">
            {loginType === "worker"
              ? isRegister
                ? "Join our expert network"
                : "Access your worker dashboard"
              : isRegister
                ? "Join our premium service network"
                : "Login to access premium services"}
          </p>

          <div className="space-y-5">
            {!isRegister && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-5 rounded-2xl font-black text-gray-800 hover:border-yellow-400 hover:bg-yellow-50/30 transition-all cursor-pointer shadow-sm disabled:opacity-50 relative z-30"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-5 h-5 flex-shrink-0"
                  alt="Google"
                />
                <span>Continue with Google</span>
              </motion.button>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  Security Verified
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {isRegister && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-gray-900"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-gray-900"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-gray-900"
                />
              </div>

              {!isRegister && (
                <div className="flex justify-end pr-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-xs font-black text-gray-400 hover:text-yellow-600 transition-colors uppercase tracking-widest relative z-20"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={isRegister ? handleEmailRegister : handleEmailLogin}
                disabled={loading}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black hover:shadow-2xl hover:shadow-gray-200 transition-all group disabled:opacity-50 relative z-20"
              >
                {loading
                  ? "Processing..."
                  : isRegister
                    ? "Create Account"
                    : "Login"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">
                    OR PHONE
                  </span>
                </div>
              </div>

              {!showOtp ? (
                <>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                    />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-yellow-400 transition-all disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Login with Phone OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-center tracking-[0.5em]"
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full bg-yellow-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-100 disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsRegister(!isRegister)}
              className="w-full text-sm font-bold text-gray-500 hover:text-yellow-500 transition-colors"
            >
              {isRegister
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <p>Your data is protected with bank-grade encryption.</p>
          </div>
        </div>

        <p className="mt-8 text-center text-gray-500 font-medium">
          Want to work with us?{" "}
          <Link to="/worker/register" className="text-yellow-500 font-bold">
            Become a Worker
          </Link>
        </p>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Portal Access
          </Link>
        </div>
      </div>
    </div>
  );
}
