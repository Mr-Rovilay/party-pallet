import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/redux/slice/authSlice';

// Import Tooltip components (shadcn/ui style)
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate('/');
        setIsOpen(false);
      })
      .catch((error) => {
        toast.error('Logout failed');
        console.error('Logout error:', error);
      });
  };

  // Navigation items with optional tooltips
  const navItems = [
    { to: '/', label: 'Home' },
    // { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/rentals', label: 'Rentals' },
    { to: '/portfolio', label: 'Portfolio' },
    {
      to: '/booking',
      label: 'Book Now',
      tooltip: 'Book an appointment for your event',
    },
    { to: '/contact', label: 'Contact' },
    {
      to: '/admin/dashboard',
      label: 'Admin',
      auth: true,
      adminOnly: true,
      tooltip: 'Administrator dashboard',
    },
  ];

  const NavLink = ({ item }) => {
    if (item.auth && !isAuthenticated) return null;
    if (item.adminOnly && user?.role !== 'admin') return null;

    const link = (
      <Link
        to={item.to}
        className="relative group"
        onClick={() => setIsOpen(false)}
      >
        <motion.span
          className="text-cream font-medium hover:text-gold transition-colors duration-300"
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {item.label}
        </motion.span>
        <motion.div
          className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"
          layoutId="underline"
        />
      </Link>
    );

    // Wrap in Tooltip only if tooltip text exists
    if (item.tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent
            className="bg-cream text-brown border border-brown"
            side="bottom"
          >
            {item.tooltip}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-brown/95 backdrop-blur-sm shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/"
              className="text-3xl font-script text-cream hover:text-gold transition-colors duration-300"
            >
              P/P
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Main Nav Links */}
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <NavLink key={item.to} item={item} />
              ))}
            </div>

            {/* Auth / User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2 text-cream">
                    <User size={18} />
                    <span className="text-sm">Hi, {user?.name || 'Admin'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-cream border-cream hover:bg-gold hover:text-cream hover:border-gold transition-all duration-300 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </Button>
                </>
              ) : (
                <Link to="/admin/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-cream border-cream hover:bg-gold hover:text-cream hover:border-gold transition-all duration-300 cursor-pointer"
                  >
                    Admin Login
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-cream"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-brown/95 backdrop-blur-sm border-t border-cream/10"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col space-y-6">
              {/* Mobile Nav Links */}
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <NavLink key={item.to} item={item} />
                ))}
              </div>

              {/* Auth Section */}
              <div className="pt-4 border-t border-cream/10">
                {isAuthenticated ? (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2 text-cream">
                      <User size={18} />
                      <span>Hi, {user?.name || 'Admin'}</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full text-cream border-cream hover:bg-gold hover:text-cream hover:border-gold transition-all duration-300"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <Link to="/admin/login" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full text-cream border-cream hover:bg-gold hover:text-cream hover:border-gold transition-all duration-300"
                    >
                      Admin Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;