import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Droplets,
  Camera,
  ShieldCheck,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Menu,
  X,
  PhoneCall,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LogoLoader } from "./components/LogoLoader";

const services = [
  {
    id: "elec",
    name: "Electrical",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    id: "plum",
    name: "Plumbing",
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "cctv",
    name: "CCTV Installation",
    icon: Camera,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const testimonials = [
  {
    id: 1,
    name: "Rahul K.",
    text: "Best service in Kannur! Fixed my AC in 30 mins.",
    rating: 5,
  },
  {
    id: 2,
    name: "Sreejith P.",
    text: "Emergency plumbing saved my kitchen at midnight.",
    rating: 5,
  },
  {
    id: 3,
    name: "Anjali M.",
    text: "Professional workers and transparent pricing.",
    rating: 4,
  },
];

export default function LandingPage() {
  const { loading, supportNumber } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <MapPin className="w-4 h-4" />
              Serving Kannur 24/7
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white leading-[0.85] mb-4">
              Emergency <br />
              <span className="text-yellow-500 drop-shadow-xl">
                Home Services
              </span>{" "}
              <br />
              <span className="text-gray-900 dark:text-white">Anytime.</span>
            </h1>
            <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed font-bold">
              Premium electrical, plumbing, and CCTV services at your doorstep.
              Professional workers, transparent ₹99 booking fee.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/diagnosis"
                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all group"
              >
                Book Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/booking/new"
                state={{ type: "emergency" }}
                className="flex items-center justify-center gap-2 bg-yellow-400 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-500 transition-all shadow-xl shadow-yellow-100"
              >
                <Zap className="w-5 h-5" />
                Emergency Booking
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800&h=1000"
                alt="Expert Home Service Professional"
                className="w-full h-[600px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 glass p-6 rounded-3xl z-20 hidden md:block"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Verified Workers</p>
                  <p className="text-sm text-gray-500">
                    100% Background Checked
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl z-20 hidden md:block"
            >
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-2xl">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">24/7 Availability</p>
                  <p className="text-sm text-gray-500">Instant Response</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">
            Our <span className="text-yellow-500">Premium</span> Services
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16 font-bold text-lg">
            Expert solutions handled by background-verified professionals in
            Kannur.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                whileHover={{ y: -10 }}
                className="neumorph p-12 rounded-[3.5rem] text-left group transition-all duration-500 hover:bg-gray-900 dark:hover:bg-yellow-400 cursor-pointer relative overflow-hidden"
              >
                <div
                  className={`${service.bg} w-20 h-20 rounded-2xl flex items-center justify-center mb-10 border border-white/50 shadow-inner group-hover:scale-110 transition-transform`}
                >
                  <service.icon className={`w-10 h-10 ${service.color}`} />
                </div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white group-hover:text-yellow-400 dark:group-hover:text-gray-900 mb-6 tracking-tight transition-colors">
                  {service.name}
                </h3>
                <p className="text-gray-800 dark:text-gray-200 group-hover:text-white dark:group-hover:text-gray-900 font-bold leading-relaxed transition-colors mb-8 text-lg">
                  Professional {service.name.toLowerCase()} solutions for your
                  home. Ready for 24/7 emergency response.
                </p>
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-black uppercase text-sm tracking-widest group-hover:text-yellow-400 dark:group-hover:text-gray-900 transition-colors">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Worker Section */}
      <section className="py-24 bg-yellow-500 shadow-[inset_0_20px_100px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/90 backdrop-blur-md p-12 rounded-[3rem] flex flex-col md:flex-row items-center gap-12 border border-white/50 shadow-2xl">
            <div className="relative">
              <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400&h=400"
                  alt="Top Expert"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 p-4 rounded-2xl shadow-xl">
                <Star className="w-8 h-8 text-white fill-current" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest mb-4 inline-block">
                Worker of the Month 🏆
              </span>
              <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
                Meet Jabir Rumi
              </h2>
              <p className="text-gray-700 text-xl font-bold mb-8 max-w-xl">
                With 150+ completed jobs and a perfect 5.0 rating, Jabir is our
                top-rated electrical expert in Kannur this month.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-gray-100 px-6 py-3 rounded-2xl font-black text-gray-900">
                  150+ Jobs
                </div>
                <div className="bg-gray-100 px-6 py-3 rounded-2xl font-black text-gray-900">
                  5.0 Rating
                </div>
                <div className="bg-gray-100 px-6 py-3 rounded-2xl font-black text-gray-900">
                  Expert Electrician
                </div>
              </div>
              <Link
                to="/workers"
                className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all"
              >
                Browse All Experts
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="text-left">
              <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
                Verified Reviews
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md font-bold text-lg">
                Real stories from local customers in Kannur.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-8 h-8 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-3 font-black text-3xl text-gray-900 dark:text-white">
                4.9
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="neumorph p-10 rounded-[3rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all hover:scale-[1.05] duration-500"
              >
                <div className="flex justify-center md:justify-start gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-800 dark:text-gray-100 text-xl font-bold leading-relaxed mb-8 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center font-black text-white shadow-lg text-xl">
                    {t.name[0]}
                  </div>
                  <p className="font-black text-2xl text-gray-900 dark:text-white tracking-tighter">
                    {t.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png"
                alt="Fixivo Logo"
                className="w-16 h-16 rounded-xl object-contain bg-white p-1"
              />
              <span className="text-3xl font-black tracking-tighter">
                FIXIVO
              </span>
            </div>
            <p className="text-gray-100 max-w-sm mb-8 font-bold leading-relaxed opacity-90">
              Fixivo is Kannur's leading 24/7 home service platform. We connect
              you with verified professionals for all your home needs.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-yellow-400 transition-colors cursor-pointer">
                <Star className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-8">Quick Links</h4>
            <ul className="space-y-4 text-gray-300 font-bold">
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <Link
                  to="/worker/register"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Worker Registration
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-8">Contact Info</h4>
            <ul className="space-y-4 text-gray-300 font-bold">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-yellow-400" />
                Kannur, Kerala, India
              </li>
              <li className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-yellow-400" />+
                {supportNumber}
              </li>
              <li className="flex items-center gap-3 text-yellow-400 font-black">
                UPI ID: rumijabir12@oksbi
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-20 pt-8 text-center text-gray-500 text-sm">
          © 2026 Fixivo – 24/7 SERVICE. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
