import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Briefcase, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowRight,
  Wrench,
  Info,
  Phone,
  RefreshCw
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LogoLoader } from './components/LogoLoader';

const skillOptions = ['Electrical', 'Plumbing', 'AC Repair', 'Painting', 'CCTV Installation', 'Carpentry'];

export default function WorkerRegistration() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataFetching, setDataFetching] = useState(true);
  const [step, setStep] = useState(1);
  const [isUpdate, setIsUpdate] = useState(false);
  const [existingDocs, setExistingDocs] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '', // Added phone field
    experience: '',
    skills: [] as string[],
    documents: [] as File[],
    bankAccountName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    bankName: ''
  });

  useEffect(() => {
    async function fetchExistingData() {
      if (!user) {
        setDataFetching(false);
        return;
      }
      try {
        const docRef = doc(db, 'workers', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || user.displayName || '',
            phone: data.phone || '', // Added phone field
            experience: data.experience?.toString() || '',
            skills: data.skills || [],
            documents: [],
            bankAccountName: data.bankAccountName || '',
            bankAccountNumber: data.bankAccountNumber || '',
            bankIFSC: data.bankIFSC || '',
            bankName: data.bankName || ''
          });
          setExistingDocs(data.documents || []);
          setIsUpdate(true);
        }
      } catch (error) {
        console.error("Error fetching worker data:", error);
      } finally {
        setDataFetching(false);
      }
    }
    fetchExistingData();
  }, [user]);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login or create an account to submit your application');
      navigate('/login?redirect=worker-reg');
      return;
    }
    if (formData.skills.length === 0) return toast.error('Select at least one skill');
    if (!formData.phone) return toast.error('Contact/WhatsApp number is required'); // Phone validation
    if (!isUpdate && formData.documents.length === 0) return toast.error('Upload at least one document');
    if (!formData.bankAccountNumber) return toast.error('Bank Account Number is required for payments');

    setLoading(true);

    try {
      // 1. Save profile data directly to Firestore first (for reliability)
      const expNum = parseInt(formData.experience);
      await setDoc(doc(db, 'workers', user.uid), {
        name: formData.name || user.displayName || 'Worker',
        phone: formData.phone, // Save phone
        experience: isNaN(expNum) ? 0 : expNum,
        skills: formData.skills,
        uid: user.uid,
        verificationStatus: 'pending',
        updatedAt: new Date().toISOString(),
        bankAccountName: formData.bankAccountName,
        bankAccountNumber: formData.bankAccountNumber,
        bankIFSC: formData.bankIFSC,
        bankName: formData.bankName
      }, { merge: true });

      // 2. Upload documents via API
      const data = new FormData();
      data.append('firebaseId', user.uid);
      data.append('name', formData.name || user.displayName || 'Worker');
      data.append('phone', formData.phone);
      data.append('experience', formData.experience);
      data.append('skills', JSON.stringify(formData.skills));
      data.append('bankAccountName', formData.bankAccountName);
      data.append('bankAccountNumber', formData.bankAccountNumber);
      data.append('bankIFSC', formData.bankIFSC);
      data.append('bankName', formData.bankName);
      
      if (formData.documents.length > 0 || isUpdate) {
        if (formData.documents.length > 0) {
          formData.documents.forEach(file => data.append('documents', file));
        }
        
        const res = await axios.post('https://fixivobeckend.onrender.com/api/workers/register', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Worker Registration] API Success:", res.data);
      }

      toast.success('Registration details saved! Admin will review your profile.');
      navigate('/worker/dashboard');
    } catch (error: any) {
      console.error("[Worker Registration] Error:", error);
      toast.error('Registration failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataFetching) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
      {!user && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-3xl flex items-center gap-4">
            <Info className="w-8 h-8 text-yellow-500 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Almost there!</p>
              <p className="text-yellow-700 text-sm">You can fill out the form now, but you'll need to create an account to submit your application.</p>
            </div>
            <Link to="/login?redirect=worker-reg" className="ml-auto bg-yellow-400 text-white px-6 py-2 rounded-xl font-bold hover:bg-yellow-500 transition-all">
              Login / Register
            </Link>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-white p-3 rounded-3xl shadow-xl shadow-yellow-200 mb-6">
            <img 
              src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png" 
              alt="Fixivo Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">Become a Fixivo Expert</h1>
          <p className="text-gray-500 font-medium">Join our network of premium service providers in Kannur.</p>
        </div>

        <div className="neumorph p-10 rounded-[2.5rem]">
          {/* Progress Bar */}
          <div className="flex gap-4 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`flex-1 h-2 rounded-full transition-all duration-500 ${step >= i ? 'bg-yellow-400' : 'bg-gray-200'}`} 
              />
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-8">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 pl-12 rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Years of Experience</label>
                  <div className="relative">
                    <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="number" 
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 pl-12 rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">WhatsApp / Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="tel" 
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 pl-12 rounded-2xl outline-none font-medium"
                      required
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase">Must be a valid WhatsApp number for coordination</p>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-8">Select Your Skills</h2>
              <div className="grid grid-cols-2 gap-4 mb-12">
                {skillOptions.map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-4 rounded-2xl border-2 transition-all font-bold ${formData.skills.includes(skill) ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-100 text-gray-500'}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold">Next Step</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-8">Verification Documents</h2>
              
              {existingDocs.length > 0 && (
                <div className="mb-8 p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-blue-900">Current Documents</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {existingDocs.map((url, i) => (
                      <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={url} alt="Doc" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-blue-600 font-medium">Uploading new documents will replace the current ones.</p>
                </div>
              )}

              <p className="text-gray-500 mb-8">Upload ID proof, certificates, or work samples (Max 5 files).</p>
              
              <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-12 text-center mb-8 hover:border-yellow-400 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="font-bold text-gray-400">Click or drag files to upload</p>
              </div>

              <div className="space-y-2 mb-12">
                {formData.documents.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <FileText className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600 truncate">{file.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold">Back</button>
                <button 
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl font-bold mb-8">Bank Details (For Payments)</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Account Holder Name</label>
                  <input 
                    type="text" 
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})}
                    placeholder="As per passbook"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 rounded-2xl outline-none font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">Account Number</label>
                    <input 
                      type="text" 
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 rounded-2xl outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">IFSC Code</label>
                    <input 
                      type="text" 
                      value={formData.bankIFSC}
                      onChange={(e) => setFormData({...formData, bankIFSC: e.target.value.toUpperCase()})}
                      placeholder="SBIN000..."
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    placeholder="e.g. State Bank of India"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-yellow-400 p-4 rounded-2xl outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold">Back</button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-yellow-400 text-white py-4 rounded-2xl font-bold shadow-xl shadow-yellow-100 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
