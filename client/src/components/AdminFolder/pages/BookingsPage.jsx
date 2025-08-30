import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { cancelBooking, getBookings, updateBookingStatus } from '@/redux/slice/bookingSlice';
import { formatCurrency } from '@/redux/slice/analyticsSlice';

const BookingsPage = () => {
  const dispatch = useDispatch();
  const { bookings, pagination, status, error } = useSelector(state => state.bookings);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(null);
  const [statusData, setStatusData] = useState({ id: '', status: '', note: '' });
  const [cancelData, setCancelData] = useState({ id: '', reason: '' });

  useEffect(() => {
    dispatch(getBookings({ page, limit: 10, status: filterStatus }));
  }, [page, filterStatus, dispatch]);

  const handleStatusUpdate = async () => {
    try {
      await dispatch(updateBookingStatus(statusData)).unwrap();
      setOpenDialog(null);
      setStatusData({ id: '', status: '', note: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update booking status');
    }
  };

  const handleCancelBooking = async () => {
    try {
      await dispatch(cancelBooking(cancelData)).unwrap();
      setOpenDialog(null);
      setCancelData({ id: '', reason: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      className="container mx-auto px-4 py-8 bg-[#FFF5E1]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster richColors position="top-right" />
      <h1 className="text-3xl font-bold text-[#8B4513] mb-6">Manage Bookings</h1>
      <div className="mb-4">
        {/* <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] border-[#DAA520] bg-[#F5F5DC]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {['pending', 'deposit-paid', 'confirmed', 'completed', 'cancelled'].map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select> */}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[#8B4513]">Client</TableHead>
            <TableHead className="text-[#8B4513]">Event</TableHead>
            <TableHead className="text-[#8B4513]">Date</TableHead>
            <TableHead className="text-[#8B4513]">Time</TableHead>
            <TableHead className="text-[#8B4513]">Status</TableHead>
            <TableHead className="text-[#8B4513]">Total</TableHead>
            <TableHead className="text-[#8B4513]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(booking => (
            <motion.tr key={booking._id} variants={rowVariants}>
              <TableCell>{booking.client.fullName}</TableCell>
              <TableCell>{booking.event.type}</TableCell>
              <TableCell>{moment(booking.event.date).format('MMM D, YYYY')}</TableCell>
              <TableCell>{`${booking.event.startTime} - ${booking.event.endTime}`}</TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>{formatCurrency(booking.pricing.estimate + booking.pricing.overnightSurcharge)}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="mr-2 border-[#DAA520] text-[#8B4513]"
                        onClick={() => setOpenDialog('status-' + booking._id)}
                      >
                        Update Status
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Change booking status</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
                        onClick={() => setOpenDialog('cancel-' + booking._id)}
                      >
                        Cancel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cancel this booking</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4 flex justify-between">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
        >
          Previous
        </Button>
        <span className="text-[#8B4513]">Page {pagination.page} of {pagination.pages}</span>
        <Button
          disabled={page === pagination.pages}
          onClick={() => setPage(page + 1)}
          className="bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
        >
          Next
        </Button>
      </div>
      {status === 'loading' && (
        <motion.div
          className="mt-4 text-center text-[#8B4513]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading bookings...
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

      {/* Status Update Dialog */}
      <Dialog open={openDialog?.startsWith('status')} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="bg-[#F5F5DC]">
          <DialogHeader>
            <DialogTitle className="text-[#8B4513]">Update Booking Status</DialogTitle>
          </DialogHeader>
          <Select
            value={statusData.status}
            onValueChange={(value) => setStatusData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="border-[#DAA520] bg-[#FFF5E1]">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {['pending', 'deposit-paid', 'confirmed', 'completed', 'cancelled'].map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Note (optional)"
            value={statusData.note}
            onChange={(e) => setStatusData(prev => ({ ...prev, note: e.target.value }))}
            className="mt-4 border-[#DAA520] bg-[#FFF5E1]"
          />
          <DialogFooter>
            <Button
              onClick={handleStatusUpdate}
              className="bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={openDialog?.startsWith('cancel')} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="bg-[#F5F5DC]">
          <DialogHeader>
            <DialogTitle className="text-[#8B4513]">Cancel Booking</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Cancellation Reason"
            value={cancelData.reason}
            onChange={(e) => setCancelData(prev => ({ ...prev, reason: e.target.value }))}
            className="border-[#DAA520] bg-[#FFF5E1]"
          />
          <DialogFooter>
            <Button
              onClick={handleCancelBooking}
              className="bg-[#8B4513] hover:bg-[#DAA520] text-[#FFF5E1]"
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div> 
  );
};

export default BookingsPage;