import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  MapPin,
  Award,
  ShieldCheck,
  Search,
  Briefcase,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { LogoLoader } from "./components/LogoLoader";

const skillOptions = [
  "Electrical",
  "Plumbing",
  "CCTV Installation",
  "Carpentry",
  "Painting",
  "AC Repair",
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, "workers"), where("verified", "==", true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch = w.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSkill =
      selectedSkill === "All" || w.skills?.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-left">
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white mb-4 uppercase">
            <span className="text-black opacity-75">FIX</span>
            <span className="text-yellow-500">IVO</span> <span className="text-black">EXPERTS</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
            Meet our certified professionals in Kannur. Every expert undergoes a
            rigorous background check and verification process.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 p-5 pl-16 rounded-[2rem] outline-none focus:border-yellow-400 transition-all font-bold text-gray-700 shadow-sm"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedSkill("All")}
              className={`px-8 py-5 rounded-[2rem] font-bold whitespace-nowrap transition-all shadow-sm ${selectedSkill === "All" ? "bg-yellow-400 text-white" : "bg-white text-gray-500 border-2 border-gray-100"}`}
            >
              All Experts
            </button>
            {skillOptions.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`px-8 py-5 rounded-[2rem] font-bold whitespace-nowrap transition-all shadow-sm ${selectedSkill === skill ? "bg-yellow-400 text-white" : "bg-white text-gray-500 border-2 border-gray-100"}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredWorkers.map((worker) => (
              <motion.div
                key={worker.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                onClick={() => setSelectedWorker(worker)}
                className="neumorph p-8 rounded-[3rem] cursor-pointer group hover:bg-gray-900 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-gray-100 flex items-center justify-center text-3xl font-black text-gray-300 group-hover:bg-gray-800 transition-colors">
                      {worker.name?.[0]}
                    </div>
                    {worker.verified && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-xl border-4 border-white dark:border-gray-900 shadow-lg">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-black text-lg">
                      <Star className="w-5 h-5 fill-current" />
                      {worker.rating || "5.0"}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 group-hover:text-yellow-400/50">
                      Top Rated
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-white mb-2 truncate transition-colors">
                  {worker.name}
                </h3>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {worker.skills?.slice(0, 2).map((s: string) => (
                    <span
                      key={s}
                      className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter group-hover:bg-gray-800 group-hover:text-gray-400 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                  {worker.skills?.length > 2 && (
                    <span className="text-[10px] text-gray-400 font-bold">
                      +{worker.skills.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 group-hover:border-gray-800 transition-colors">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                      Experience
                    </p>
                    <p className="text-sm font-black text-gray-900 group-hover:text-white">
                      {worker.experience || 0} Years
                    </p>
                  </div>
                  <button className="bg-gray-100 p-3 rounded-2xl text-gray-400 group-hover:bg-yellow-400 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredWorkers.length === 0 && (
          <div className="py-32 text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 mb-2">
              No experts found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search term.
            </p>
          </div>
        )}

        {/* Worker Modal */}
        <AnimatePresence>
          {selectedWorker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedWorker(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
              >
                {/* Left Side - Visual */}
                <div className="w-full md:w-[40%] bg-gray-900 p-12 text-white flex flex-col justify-between">
                  <button
                    onClick={() => setSelectedWorker(null)}
                    className="md:hidden absolute top-6 right-6 p-2 bg-white/10 rounded-full"
                  >
                    <X />
                  </button>

                  <div>
                    <div className="w-32 h-32 rounded-[2.5rem] bg-yellow-400 flex items-center justify-center text-5xl font-black mb-8 shadow-2xl shadow-yellow-400/20">
                      {selectedWorker.name?.[0]}
                    </div>
                    <h2 className="text-4xl font-black mb-4 tracking-tighter">
                      {selectedWorker.name}
                    </h2>
                    <div className="flex items-center gap-4 mb-8">
                      <span className="flex items-center gap-1 text-yellow-400 font-black">
                        <Star className="w-5 h-5 fill-current" />
                        {selectedWorker.rating || "5.0"}
                      </span>
                      <span className="text-gray-400 font-bold text-sm bg-white/10 px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
                        ID Verified
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black uppercase">
                            Experience
                          </p>
                          <p className="text-lg font-black text-white">
                            {selectedWorker.experience || 0} Years Pro
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black uppercase">
                            Jobs Handled
                          </p>
                          <p className="text-lg font-black text-white">
                            {selectedWorker.jobsCompleted || 0} Successful Works
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">
                      Hand-picked professional with specialized expertise in{" "}
                      {selectedWorker.skills?.[0] || "maintenance"}.
                    </p>
                  </div>
                </div>

                {/* Right Side - Details */}
                <div className="flex-1 p-12 overflow-y-auto max-h-[90vh]">
                  <button
                    onClick={() => setSelectedWorker(null)}
                    className="hidden md:block absolute top-10 right-10 p-4 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-4">
                    Professional Profile
                  </h3>
                  <div className="mb-12">
                    <h4 className="text-xl font-black text-gray-900 mb-6">
                      Expertise & Skills
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedWorker.skills?.map((s: string) => (
                        <div
                          key={s}
                          className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black text-gray-600 uppercase tracking-tighter flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-400 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 shadow-2xl shadow-yellow-400/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-yellow-900 uppercase tracking-widest">
                          Base Location
                        </p>
                        <p className="font-black text-white text-lg">
                          Kannur City
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-yellow-900 uppercase">
                        Availability
                      </p>
                      <p className="font-black text-white text-lg">
                        Instant Booking
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
