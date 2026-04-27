import { motion } from 'motion/react';
import { Home, AlertTriangle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const TesterIcon = () => (
  <div className="relative w-40 h-80 flex items-center justify-center">
    {/* Handle with movement */}
    <motion.div 
      animate={{ 
        y: [0, -10, 0],
        rotate: [10, 15, 5, 10]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-0 w-20 h-48 bg-gray-600 rounded-t-[2.5rem] rounded-b-2xl border-4 border-gray-700 shadow-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Blinking Light */}
      <motion.div 
        animate={{ 
          backgroundColor: ['#ef4444', '#1f2937', '#ef4444'],
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 20px rgba(239, 68, 68, 0.8)',
            '0 0 0px rgba(239, 68, 68, 0)',
            '0 0 20px rgba(239, 68, 68, 0.8)'
          ]
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-red-900 z-20"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-800 rounded-full" />
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-800 rounded-full" />
    </motion.div>
    {/* Metal tip with vibration */}
    <motion.div 
      animate={{ x: [-1, 1, -1] }}
      transition={{ duration: 0.1, repeat: Infinity }}
      className="absolute bottom-4 w-4 h-40 bg-gradient-to-b from-gray-400 to-gray-200 rounded-full border-x-2 border-gray-500 shadow-inner" 
    />
    {/* Electric Pulse */}
    <motion.div
      animate={{ 
        scale: [0, 2, 2.5], 
        opacity: [0.8, 0.4, 0],
        borderColor: ['#facc15', '#eab308', '#ca8a04']
      }}
      transition={{ duration: 0.8, repeat: Infinity }}
      className="absolute bottom-0 w-20 h-20 border-4 rounded-full"
    />
    <motion.div
      animate={{ 
        scale: [0, 1.8], 
        opacity: [1, 0],
        rotate: [0, 45]
      }}
      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
      className="absolute bottom-0 w-32 h-32 border-2 border-dashed border-red-400 rounded-full"
    />
    <motion.div
      animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
      transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
      className="absolute bottom-0 text-yellow-400"
    >
      <Zap className="w-12 h-12 fill-current" />
    </motion.div>
  </div>
);

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 10, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <TesterIcon />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertTriangle className="text-red-500 w-10 h-10" />
          <h1 className="text-9xl font-black text-gray-900 tracking-tighter">404</h1>
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-6 uppercase tracking-tight">Circuit Overload! ⚡</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
          Looks like the connection to this page was cut. Don't touch the exposed wires! 
          We've dispatched our expert technicians to fix this "leak".
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-10 py-5 rounded-2xl font-black shadow-xl shadow-yellow-200 hover:bg-yellow-500 transition-all hover:scale-105 active:scale-95"
        >
          <Home className="w-5 h-5" />
          GO BACK HOME
        </Link>
      </motion.div>

      <div className="mt-20 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
        Fatal Error: Document_Not_Found | Fixivo Support
      </div>
    </div>
  );
}
