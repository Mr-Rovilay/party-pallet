import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    toast.error('Please log in to access this page')
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Navigate to="/admin/login" replace />
      </motion.div>
    )
  }

  // If route requires a specific role and user role doesn't match
  if (role && user?.role !== role) {
    const redirectTo = user?.role === 'admin' ? '/admin/dashboard' : '/'
    toast.error('Access denied: Insufficient permissions')
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Navigate to={redirectTo} replace />
      </motion.div>
    )
  }

  // Allow access if authenticated and role matches (or no role specified)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

export default ProtectedRoute