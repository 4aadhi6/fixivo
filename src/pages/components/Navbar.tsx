import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wrench, 
  Menu, 
  X, 
  User as UserIcon, 
  LayoutDashboard, 
  Briefcase,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';

export const Navbar = () => {
  const { user, profile, isAdmin, isWorker } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide Navbar on specific pages that have their own navigation
  const hidePaths = ['/admin', '/worker/dashboard'];
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (shouldHide) return null;

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="https://res.cloudinary.com/dfkw8x3yf/image/upload/v1777212345/file_000000000b8871faac52c877019d5db2_ilkihv.png" 
            alt="Fixivo Logo" 
            className="w-20 h-20 md:w-24 md:h-24 object-contain transition-transform hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <span className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">FIXIVO</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-bold text-gray-800">
          <Link to="/workers" className="hover:text-yellow-500 transition-colors">Our Experts</Link>
          <Link to="/diagnosis" className="hover:text-yellow-500 transition-colors">Book Now</Link>
          
          {/* <button onClick={toggleDark} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:scale-110 transition-all">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button> */}

          {user ? (
            <div className="flex items-center gap-6">
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
              {isWorker && (
                <Link to="/worker/dashboard" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                  <Briefcase className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-all">
                <UserIcon className="w-4 h-4" />
                {profile?.name?.split(' ')[0] || 'Profile'}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="bg-yellow-400 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-yellow-200 hover:bg-yellow-500 transition-all">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden glass absolute top-full left-0 w-full p-6 space-y-4 border-t border-gray-100 shadow-2xl">
          <Link to="/workers" onClick={() => setIsMenuOpen(false)} className="block font-bold text-gray-900">Our Experts</Link>
          <Link to="/diagnosis" onClick={() => setIsMenuOpen(false)} className="block font-bold text-gray-900">Book Service</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block font-bold text-gray-900">My Profile</Link>
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block font-bold text-blue-600">Admin Panel</Link>}
              {isWorker && <Link to="/worker/dashboard" onClick={() => setIsMenuOpen(false)} className="block font-bold text-purple-600">Worker Dashboard</Link>}
              <button onClick={() => auth.signOut()} className="block font-bold text-red-500">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-bold text-yellow-500">Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  );
};
