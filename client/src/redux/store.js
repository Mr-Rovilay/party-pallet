import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import bookingReducer from "./slice/bookingSlice";
import availabilityReducer from "./slice/availabilitySlice";
// import testimonialReducer from "./slices/testimonialSlice";
import rentalReducer from "./slice/rentalSlice";
import portfolioReducer from "./slice/portfolioSlice"
import paymentReducer from "./slice/paymentSlice";
// import analyticsReducer from "./slices/analyticsSlice";

export const Store = configureStore({
  reducer: {
    auth: authReducer,
    portfolio: portfolioReducer,
    bookings: bookingReducer,
    availability: availabilityReducer,
    // testimonials: testimonialReducer,
    rentals: rentalReducer,
    payments: paymentReducer,
    // analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default Store;
