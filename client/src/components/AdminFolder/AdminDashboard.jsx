import { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Calendar, Image, Package, BookOpen, Star, LayoutDashboard, LogOut, ChevronRight, ChevronLeft, User, Settings } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { logout } from '@/redux/slice/authSlice'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import BookingsPage from './pages/BookingsPage'
import PortfolioPage from './pages/PortfolioPage'
import RentalsPage from './pages/RentalsPage'
import AvailabilityPage from './pages/AvailabilityPage'
import SettingsPage from './pages/SettingsPage'
import DashboardHome from './pages/DashboardHome'

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate('/')
        setIsMobileSidebarOpen(false)
      })
      .catch((error) => {
        toast.error('Logout failed')
        console.error('Logout error:', error)
      })
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const sidebarItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'View dashboard overview' },
    { to: '/admin/dashboard/bookings', label: 'Bookings', icon: BookOpen, tooltip: 'Manage customer bookings' },
    { to: '/admin/dashboard/portfolio', label: 'Portfolio', icon: Image, tooltip: 'Upload and manage portfolio images' },
    { to: '/admin/dashboard/rentals', label: 'Rentals', icon: Package, tooltip: 'Manage rental items' },
    { to: '/admin/dashboard/availability', label: 'Availability', icon: Calendar, tooltip: 'Set available dates and times' },
    { to: '/admin/dashboard/testimonials', label: 'Testimonials', icon: Star, tooltip: 'Review and approve testimonials' },
    { to: '/admin/dashboard/settings', label: 'Settings', icon: Settings, tooltip: 'Account and system settings' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden md:flex flex-col bg-sidebar text-sidebar-foreground z-10 ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {isSidebarOpen && (
            <motion.h2
              className="text-2xl font-script"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Party Pallet
            </motion.h2>
          )}
          <Button
            variant="ghost"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </Button>
        </div>
          <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <Tooltip key={item.to} side="right">
                <TooltipTrigger asChild>
                  <Link to={item.to}>
                    <Button
                      variant="ghost"
                      className={`w-full cursor-pointer justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary ${!isSidebarOpen && 'justify-center px-2'}`}
                    >
                      <item.icon className="h-5 w-5 " />
                      {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isSidebarOpen ? null : (
                  <TooltipContent side="right" className="bg-card text-card-foreground border-border">
                    {item.tooltip}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full cursor-pointer justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary ${!isSidebarOpen && 'justify-center px-2'}`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Logout</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarOpen ? null : (
                <TooltipContent side="right" className="bg-card text-card-foreground border-border">
                  Logout from admin panel
                </TooltipContent>
              )}
            </Tooltip>
          </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground z-30 md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <h2 className="text-2xl font-script">Party Pallet</h2>
                <Button
                  variant="ghost"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary cursor-pointer"
                  onClick={toggleMobileSidebar}
                >
                  <X size={24} />
                </Button>
              </div>
              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <User className="text-primary-foreground" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sidebar-foreground">{user?.email || 'Admin'}</p>
                    <p className="text-xs text-sidebar-foreground/70">Administrator</p>
                  </div>
                </div>
              </div>
                <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
                  {sidebarItems.map((item) => (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <Link to={item.to} onClick={toggleMobileSidebar}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-card text-card-foreground border-border">
                        {item.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </nav>
                <div className="p-3 border-t border-sidebar-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="md:hidden text-foreground mr-4"
              onClick={toggleMobileSidebar}
            >
              <Menu size={24} />
            </Button>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-script text-foreground">
                Welcome, {user?.email?.split('@')[0] || 'Admin'}
              </h1>
            </motion.div>
          </div>
          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground cursor-pointer">
                  <Settings size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-card text-card-foreground border-border">
                Settings
              </TooltipContent>
            </Tooltip>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="text-primary-foreground" size={18} />
              </div>
              <span className="text-sm font-medium text-foreground">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/rentals" element={<RentalsPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard