import { motion } from 'motion/react';
import { Wrench } from 'lucide-react';

export const LogoLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background decoration */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-[800px] h-[800px] bg-yellow-100/50 rounded-full blur-3xl -z-10"
      />

      <div className="relative">
        {/* Decorative rotating rings */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-12 border-2 border-dashed border-yellow-200 rounded-[4rem]"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-8 border-2 border-yellow-100 rounded-[3.5rem]"
        />

        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="flex items-center gap-2 relative z-10"
        >
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-yellow-400/30 bg-white p-6 border-2 border-yellow-50">
            <img 
              src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png" 
              alt="Fixivo Logo" 
              className="w-48 h-48 md:w-64 md:h-64 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-12"
      >
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">FIXIVO</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-yellow-400 rounded-full"
            />
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 font-bold uppercase text-[10px] tracking-widest"
        >
          24/7 Premium Home Services
        </motion.p>
      </motion.div>
    </div>
  );
};
