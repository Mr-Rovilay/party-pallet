import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

const SettingsPage = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-script text-card-foreground">Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Settings management (Implement user profile and system settings here)</p>
        {/* Add form for updating user email, password, etc. */}
      </CardContent>
    </Card>
  </motion.div>
)

export default SettingsPage