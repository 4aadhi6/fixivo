import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Droplets,
  Camera,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const diagnosisSteps = [
  {
    id: "category",
    question: "What type of service do you need?",
    options: [
      { id: "elec", label: "Electrical", icon: Zap, color: "text-yellow-500" },
      { id: "plum", label: "Plumbing", icon: Droplets, color: "text-blue-500" },
      {
        id: "cctv",
        label: "CCTV Installation",
        icon: Camera,
        color: "text-orange-500",
      },
    ],
  },
  {
    id: "cctv_sub",
    parent: "cctv",
    question: "Select CCTV service type:",
    options: [
      { id: "new_install", label: "New Installation" },
      { id: "repair_cctv", label: "CCTV Repair & Service" },
      { id: "online_config", label: "Mobile/Online Viewing Setup" },
    ],
  },
  {
    id: "elec_sub",
    parent: "elec",
    question: "What is the electrical issue?",
    options: [
      { id: "power_cut", label: "Full Power Cut" },
      { id: "short_circuit", label: "Short Circuit" },
      { id: "appliance", label: "Appliance Repair" },
      { id: "wiring", label: "New Wiring/Fitting" },
    ],
  },
  {
    id: "plum_sub",
    parent: "plum",
    question: "Where is the leak or issue?",
    options: [
      { id: "bathroom", label: "Bathroom" },
      { id: "kitchen", label: "Kitchen" },
      { id: "tank", label: "Water Tank" },
      { id: "pipe", label: "External Piping" },
    ],
  },
];

export default function SmartDiagnosis() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentStep = diagnosisSteps.find((s) => {
    if (step === 0) return s.id === "category";
    return s.parent === answers.category;
  });

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers };
    if (step === 0) {
      newAnswers.category = optionId;
      setAnswers(newAnswers);

      // Check if there is a sub-step for this category
      const nextStepExists = diagnosisSteps.some((s) => s.parent === optionId);
      if (nextStepExists) {
        setStep(1);
      } else {
        completeDiagnosis(newAnswers);
      }
    } else {
      newAnswers.subCategory = optionId;
      setAnswers(newAnswers);
      completeDiagnosis(newAnswers);
    }
  };

  const completeDiagnosis = (finalAnswers: any) => {
    toast.success("Diagnosis complete! Suggesting best service...");
    setTimeout(() => {
      navigate("/booking/new", { state: { diagnosis: finalAnswers } });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" />
            Smart Diagnosis AI
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Let's find the right fix.
          </h1>
          <p className="text-gray-500 mt-2">
            Answer a few questions to help us assign the best expert.
          </p>
        </div>

        <div className="neumorph p-10 rounded-[2.5rem] min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex-1"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-yellow-500" />
                {currentStep?.question}
              </h2>

              <div className="grid gap-4">
                {currentStep?.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="group flex items-center justify-between p-6 rounded-2xl border-2 border-gray-100 hover:border-yellow-400 hover:bg-yellow-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      {opt.icon && (
                        <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                          <opt.icon className={`w-6 h-6 ${opt.color}`} />
                        </div>
                      )}
                      <span className="text-lg font-bold text-gray-700 group-hover:text-gray-900">
                        {opt.label}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-between items-center">
            <div className="flex gap-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-yellow-400" : "w-2 bg-gray-200"}`}
                />
              ))}
            </div>
            {step > 0 && (
              <button
                onClick={() => setStep(0)}
                className="text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
