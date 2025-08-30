import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Calendar, Clock, MapPin, User, Mail, Phone, DollarSign, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import { createBooking } from '@/redux/slice/bookingSlice';
import { initializePayment } from '@/redux/slice/paymentSlice';
import { formatCurrency } from '@/redux/slice/analyticsSlice';

const PublicBookingPage = () => {
  const dispatch = useDispatch();
  const { status, error, booking } = useSelector(state => state.bookings);
  const { availability, availabilityStatus } = useSelector(state => state.availability);
  const { paymentUrl, paymentStatus } = useSelector(state => state.payments);

  const [formData, setFormData] = useState({
    client: { fullName: '', email: '', phone: '' },
    event: {
      type: '',
      title: '',
      location: '',
      date: null,
      startTime: '',
      endTime: '',
      consultationMode: 'whatsapp',
      notes: ''
    },
    pricing: { estimate: '', depositRequired: '', currency: 'NGN', overnightSurcharge: 0 },
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isOvernight, setIsOvernight] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (formData.event.date) {
      dispatch(getAvailability({ date: moment(formData.event.date).format('YYYY-MM-DD') }));
    }
  }, [formData.event.date, dispatch]);

  useEffect(() => {
    if (availability && formData.event.date) {
      const slots = availability.slots?.filter(slot => slot.status === 'available') || [];
      if (slots.length === 0) {
        // Generate default slots if none exist (mimicking backend's new Availability creation)
        const defaultSlots = Array.from({ length: 12 }, (_, i) => {
          const hour = 8 + i; // 8 AM to 7 PM
          const start = `${hour.toString().padStart(2, '0')}:00`;
          const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
          return { start, end };
        });
        setAvailableSlots(defaultSlots);
      } else {
        setAvailableSlots(slots.map(slot => ({ start: slot.start, end: slot.end })));
      }
    } else {
      setAvailableSlots([]);
    }
  }, [availability, formData.event.date]);

  useEffect(() => {
    if (paymentUrl && booking) {
      window.location.href = paymentUrl;
    }
  }, [paymentUrl, booking]);

  useEffect(() => {
    if (formData.event.startTime && formData.event.endTime && formData.event.date) {
      const dateStr = moment(formData.event.date).format('YYYY-MM-DD');
      const start = moment(`${dateStr} ${formData.event.startTime}`, 'YYYY-MM-DD HH:mm');
      let end = moment(`${dateStr} ${formData.event.endTime}`, 'YYYY-MM-DD HH:mm');
      if (end.isBefore(start)) {
        end.add(1, 'day');
      }
      const duration = end.diff(start, 'hours');
      const isOvernightEvent = end.hour() < 6 || duration > 12;
      setIsOvernight(isOvernightEvent);
      if (isOvernightEvent && formData.pricing.estimate) {
        setFormData(prev => ({
          ...prev,
          pricing: { ...prev.pricing, overnightSurcharge: Number(prev.pricing.estimate) * 0.2 }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          pricing: { ...prev.pricing, overnightSurcharge: 0 }
        }));
      }
    }
  }, [formData.event.startTime, formData.event.endTime, formData.event.date, formData.pricing.estimate]);

  const validateForm = () => {
    const errors = {};
    if (!formData.client.fullName) errors.fullName = 'Full name is required';
    if (!formData.client.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.client.email)) {
      errors.email = 'Valid email is required';
    }
    if (!formData.client.phone) errors.phone = 'Phone number is required';
    if (!formData.event.type) errors.type = 'Event type is required';
    if (!formData.event.location) errors.location = 'Event location is required';
    if (!formData.event.date) errors.date = 'Event date is required';
    if (!formData.event.startTime || !formData.event.endTime) errors.time = 'Time slot is required';
    if (!formData.pricing.estimate || Number(formData.pricing.estimate) <= 0) errors.estimate = 'Valid estimate is required';
    if (!formData.pricing.depositRequired || Number(formData.pricing.depositRequired) <= 0) {
      errors.depositRequired = 'Valid deposit amount is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    const keys = field.split('.');
    setFormData(prev => {
      let newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    // Re-validate on input change
    setFormErrors(prev => ({ ...prev, [keys[keys.length - 1]]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    const bookingData = {
      ...formData,
      event: {
        ...formData.event,
        date: moment(formData.event.date).format('YYYY-MM-DD')
      },
      pricing: {
        ...formData.pricing,
        estimate: Number(formData.pricing.estimate),
        depositRequired: Number(formData.pricing.depositRequired),
        overnightSurcharge: Number(formData.pricing.overnightSurcharge)
      },
      isOvernight
    };

    try {
      const result = await dispatch(createBooking(bookingData)).unwrap();
      if (result.booking) {
        toast.success('Booking created! Redirecting to payment...');
        await dispatch(initializePayment({
          bookingId: result.booking._id,
          amount: result.booking.pricing.depositRequired * 100, // Convert to kobo
          email: result.booking.client.email,
          currency: 'NGN'
        })).unwrap();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    }
  };

  const isFormValid = () => {
    return (
      formData.client.fullName &&
      formData.client.email &&
      formData.client.phone &&
      formData.event.type &&
      formData.event.location &&
      formData.event.date &&
      formData.event.startTime &&
      formData.event.endTime &&
      Number(formData.pricing.estimate) > 0 &&
      Number(formData.pricing.depositRequired) > 0
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-8 bg-[#FFF5E1]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster richColors position="top-right" />
      <h1 className="text-3xl font-bold text-[#8B4513] mb-6">Book Your Event</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Client Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#8B4513]">Your Information</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    placeholder="Full Name"
                    value={formData.client.fullName}
                    onChange={(e) => handleInputChange('client.fullName', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.fullName ? 'border-red-500' : ''}`}
                    icon={<User className="w-5 h-5 text-[#8B4513]" />}
                    required
                  />
                  {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter your full name</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.client.email}
                    onChange={(e) => handleInputChange('client.email', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.email ? 'border-red-500' : ''}`}
                    icon={<Mail className="w-5 h-5 text-[#8B4513]" />}
                    required
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter a valid email for booking confirmation</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    placeholder="Phone Number"
                    value={formData.client.phone}
                    onChange={(e) => handleInputChange('client.phone', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.phone ? 'border-red-500' : ''}`}
                    icon={<Phone className="w-5 h-5 text-[#8B4513]" />}
                    required
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter your phone number (e.g., +2348012345678)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#8B4513]">Event Details</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={formData.event.type}
                  onValueChange={(value) => handleInputChange('event.type', value)}
                  required
                >
                  <SelectTrigger className={`border-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Birthday', 'Bridal Shower', 'Baby Shower', 'House', 'Hall', 'Other'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>}
              </TooltipTrigger>
              <TooltipContent>Choose the type of event</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    placeholder="Event Title (Optional)"
                    value={formData.event.title}
                    onChange={(e) => handleInputChange('event.title', e.target.value)}
                    className="border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513]"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Optional title for your event</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    placeholder="Event Location"
                    value={formData.event.location}
                    onChange={(e) => handleInputChange('event.location', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.location ? 'border-red-500' : ''}`}
                    icon={<MapPin className="w-5 h-5 text-[#8B4513]" />}
                    required
                  />
                  {formErrors.location && <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter the venue or address</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <DatePicker
                    selected={formData.event.date}
                    onChange={(date) => handleInputChange('event.date', date)}
                    minDate={new Date()}
                    className={`w-full p-2 border rounded-md bg-[#F5F5DC] text-[#8B4513] ${formErrors.date ? 'border-red-500' : 'border-[#DAA520]'}`}
                    placeholderText="Select Event Date"
                    required
                  />
                  <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-[#8B4513]" />
                  {formErrors.date && <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Select the date of your event</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={formData.event.startTime && formData.event.endTime ? `${formData.event.startTime}-${formData.event.endTime}` : ''}
                  onValueChange={(value) => {
                    const [start, end] = value.split('-');
                    handleInputChange('event.startTime', start);
                    handleInputChange('event.endTime', end);
                  }}
                  disabled={!formData.event.date || availableSlots.length === 0}
                  required
                >
                  <SelectTrigger className={`border-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.time ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Time Slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map(slot => (
                      <SelectItem key={`${slot.start}-${slot.end}`} value={`${slot.start}-${slot.end}`}>
                        {`${slot.start} - ${slot.end}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.time && <p className="text-red-red-500 text-sm mt-1">{formErrors.time}</p>}
                {formData.event.date && availableSlots.length === 0 && availabilityStatus !== 'loading' && (
                  <p className="text-red-500 text-sm mt-1">No available time slots for this date. Please choose another date.</p>
                )}
              </TooltipTrigger>
              <TooltipContent>Select an available time slot</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={formData.event.consultationMode}
                  onValueChange={(value) => handleInputChange('event.consultationMode', value)}
                >
                  <SelectTrigger className="border-[#DAA520] bg-[#F5F5DC] text-[#8B4513]">
                    <SelectValue placeholder="Consultation Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="video-call">Video Call</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>How would you like to discuss details?</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Textarea
                    placeholder="Event Notes (Optional)"
                    value={formData.event.notes}
                    onChange={(e) => handleInputChange('event.notes', e.target.value)}
                    className="border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513]"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Any specific details about the event?</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Pricing Details */}
        <div className="space-y-4 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold text-[#8B4513]">Pricing Details</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Estimated Cost (NGN)"
                    value={formData.pricing.estimate}
                    onChange={(e) => handleInputChange('pricing.estimate', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.estimate ? 'border-red-500' : ''}`}
                    icon={<DollarSign className="w-5 h-5 text-[#8B4513]" />}
                    min="0"
                    required
                  />
                  {formErrors.estimate && <p className="text-red-500 text-sm mt-1">{formErrors.estimate}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter estimated cost (negotiable)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Deposit Amount (NGN)"
                    value={formData.pricing.depositRequired}
                    onChange={(e) => handleInputChange('pricing.depositRequired', e.target.value)}
                    className={`border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513] ${formErrors.depositRequired ? 'border-red-500' : ''}`}
                    icon={<DollarSign className="w-5 h-5 text-[#8B4513]" />}
                    min="0"
                    required
                  />
                  {formErrors.depositRequired && <p className="text-red-500 text-sm mt-1">{formErrors.depositRequired}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent>Enter deposit to secure booking</TooltipContent>
            </Tooltip>
            {isOvernight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#8B4513]"
              >
                Overnight Surcharge: {formatCurrency(formData.pricing.overnightSurcharge)} (20% of estimate)
              </motion.div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Textarea
                    placeholder="Additional Notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="border-[#DAA520] focus:ring-[#DAA520] bg-[#F5F5DC] text-[#8B4513]"
                    icon={<MessageSquare className="w-5 h-5 text-[#8B4513]" />}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>Any additional comments or requests?</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="col-span-1 md:col-span-2">
          <Button
            type="submit"
            className="w-full bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
            disabled={status === 'loading' || paymentStatus === 'loading' || !isFormValid()}
          >
            {status === 'loading' || paymentStatus === 'loading' ? 'Processing...' : 'Book and Pay Deposit'}
          </Button>
        </div>
      </form>
      {availabilityStatus === 'loading' && (
        <motion.div
          className="mt-4 text-center text-[#8B4513]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Checking availability...
        </motion.div>
      )}
      {error && (
        <motion.div
          className="mt-4 text-center text-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error.message}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PublicBookingPage;