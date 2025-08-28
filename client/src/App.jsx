import React, { useEffect } from "react";
import AdminLogin from "./components/pages/AdminLogin";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminDashboard from "./components/AdminFolder/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { motion } from "framer-motion";
import HomePage from "./components/pages/HomePage";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "./redux/slice/authSlice";

const App = () => {
   const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}
      <motion.main
        className="flex-grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard/*"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
          </Route>
        </Routes>
      </motion.main>
    </div>
  );
};

export default App;
