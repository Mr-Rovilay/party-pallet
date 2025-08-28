import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast } from 'sonner';
import moment from 'moment';
import { Clock, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { blockSlot, deleteAvailability, getAvailability, setAvailability } from '@/redux/slice/availabilitySlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

const AvailabilityPage = () => {
  const dispatch = useDispatch();
  const { availability, status, error } = useSelector((state) => state.availability);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAvailable, setIsAvailable] = useState(true);
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ start: '', end: '', note: '' });

  useEffect(() => {
    // Fetch availability for the selected date's month
    const startDate = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
    const endDate = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
    dispatch(getAvailability({ startDate, endDate }));
  }, [dispatch, selectedDate]);

  useEffect(() => {
    // Update form when selected date changes
    // Normalize both dates to the same timezone for comparison
    const normalizedSelectedDate = moment(selectedDate).startOf('day');
    
    const selectedAvailability = availability.find(item => {
      const itemDate = moment(item.date).startOf('day');
      return itemDate.isSame(normalizedSelectedDate);
    });
    
    setIsAvailable(selectedAvailability ? selectedAvailability.isAvailable : true);
    setSlots(selectedAvailability?.slots || []);
  }, [selectedDate, availability]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAvailabilityToggle = () => {
    const date = moment(selectedDate).format('YYYY-MM-DD');
    if (moment(selectedDate).isBefore(moment(), 'day')) {
      toast.error('Cannot set availability for past dates');
      return;
    }
    
    const newAvailability = !isAvailable;
    dispatch(setAvailability({ date, isAvailable: newAvailability }))
      .unwrap()
      .then(() => {
        setIsAvailable(newAvailability);
        toast.success(`Date marked as ${newAvailability ? 'available' : 'unavailable'}`);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to update availability');
        console.error(err);
      });
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    const { start, end, note } = newSlot;
    const date = moment(selectedDate).format('YYYY-MM-DD');
    
    if (moment(selectedDate).isBefore(moment(), 'day')) {
      toast.error('Cannot add slots for past dates');
      return;
    }
    
    if (!start || !end) {
      toast.error('Start and end times are required');
      return;
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      toast.error('Time must be in HH:mm format');
      return;
    }
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      toast.error('End time must be after start time');
      return;
    }
    
    const hasOverlap = slots.some(slot => {
      const [slotStartHours, slotStartMinutes] = slot.start.split(':').map(Number);
      const [slotEndHours, slotEndMinutes] = slot.end.split(':').map(Number);
      const slotStartTotal = slotStartHours * 60 + slotStartMinutes;
      const slotEndTotal = slotEndHours * 60 + slotEndMinutes;
      return (startTotal < slotEndTotal && endTotal > slotStartTotal);
    });
    
    if (hasOverlap) {
      toast.error('Time slots must not overlap');
      return;
    }
    
    const updatedSlots = [...slots, { start, end, status: 'available', note }];
    dispatch(setAvailability({ date, slots: updatedSlots }))
      .unwrap()
      .then(() => {
        setSlots(updatedSlots);
        setNewSlot({ start: '', end: '', note: '' });
        toast.success('Time slot added successfully');
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to add time slot');
        console.error(err);
      });
  };

  const handleBlockSlot = (slot) => {
    const date = moment(selectedDate).format('YYYY-MM-DD');
    
    if (moment(selectedDate).isBefore(moment(), 'day')) {
      toast.error('Cannot block slots for past dates');
      return;
    }
    
    dispatch(blockSlot({ date, start: slot.start, end: slot.end, note: slot.note }))
      .unwrap()
      .then(() => {
        const updatedSlots = slots.map(s => 
          (s.start === slot.start && s.end === slot.end) 
            ? { ...s, status: 'blocked' } 
            : s
        );
        setSlots(updatedSlots);
        toast.success('Time slot blocked successfully');
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to block time slot');
        console.error(err);
      });
  };

  const handleDeleteAvailability = () => {
    const date = moment(selectedDate).format('YYYY-MM-DD');
    
    if (moment(selectedDate).isBefore(moment(), 'day')) {
      toast.error('Cannot delete availability for past dates');
      return;
    }
    
    dispatch(deleteAvailability(date))
      .unwrap()
      .then(() => {
        setIsAvailable(true);
        setSlots([]);
        toast.success('Availability deleted successfully');
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to delete availability');
        console.error(err);
      });
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    // Normalize both dates to the same timezone for comparison
    const normalizedDate = moment(date).startOf('day');
    
    if (moment(date).isBefore(moment(), 'day')) {
      return 'bg-muted text-muted-foreground opacity-50';
    }
    
    const availabilityItem = availability.find(item => {
      const itemDate = moment(item.date).startOf('day');
      return itemDate.isSame(normalizedDate);
    });
    
    if (availabilityItem) {
      return availabilityItem.isAvailable 
        ? 'bg-green-100 border-green-300 text-green-800' 
        : 'bg-red-100 border-red-300 text-red-800';
    }
    
    return 'bg-card border-border';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    // Normalize both dates to the same timezone for comparison
    const normalizedDate = moment(date).startOf('day');
    
    const availabilityItem = availability.find(item => {
      const itemDate = moment(item.date).startOf('day');
      return itemDate.isSame(normalizedDate);
    });
    
    if (availabilityItem?.slots?.length > 0) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-1 h-1 rounded-full bg-brown-600"></div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-script text-card-foreground flex items-center gap-2">
            <Clock className="text-primary" size={24} />
            Manage Availability
          </CardTitle>
          <p className="text-muted-foreground">
            Set your available dates and time slots for bookings
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-script text-card-foreground flex items-center gap-2">
                Calendar View
              </h3>
              
              <div className="bg-card p-4 rounded-lg border border-border">
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  className="border-0 bg-transparent w-full"
                  tileClassName={tileClassName}
                  tileContent={tileContent}
                  minDetail="month"
                  maxDetail="month"
                  minDate={new Date()}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <p className="font-medium text-card-foreground">
                    {moment(selectedDate).format('MMMM D, YYYY')}
                  </p>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={handleAvailabilityToggle}
                        disabled={status === 'loading' || moment(selectedDate).isBefore(moment(), 'day')}
                        className="data-[state=checked]:bg-gold"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-card text-card-foreground border-border">
                      Toggle availability for {moment(selectedDate).format('MMMM D, YYYY')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Time Slots Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-script text-card-foreground flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Time Slots for {moment(selectedDate).format('MMMM D, YYYY')}
              </h3>
              
              {moment(selectedDate).isBefore(moment(), 'day') ? (
                <div className="text-center py-8 bg-muted rounded-lg border border-border">
                  <AlertCircle className="mx-auto text-destructive mb-2" size={32} />
                  <p className="text-muted-foreground">Cannot modify past dates</p>
                </div>
              ) : isAvailable ? (
                <div className="space-y-6">
                  {/* Add Slot Form */}
                  <Card className="bg-muted border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-script text-card-foreground flex items-center gap-2">
                        <Plus size={18} />
                        Add Time Slot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddSlot} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="start" className="text-card-foreground">Start Time</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    id="start"
                                    type="time"
                                    value={newSlot.start}
                                    onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                                    className="border-border focus:ring-primary focus:border-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-card text-card-foreground border-border">
                                  Enter start time (e.g., 09:00)
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div>
                            <Label htmlFor="end" className="text-card-foreground">End Time</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    id="end"
                                    type="time"
                                    value={newSlot.end}
                                    onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                                    className="border-border focus:ring-primary focus:border-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-card text-card-foreground border-border">
                                  Enter end time (e.g., 12:00)
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div>
                            <Label htmlFor="note" className="text-card-foreground">Note (Optional)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    id="note"
                                    type="text"
                                    placeholder="Add a note"
                                    value={newSlot.note}
                                    onChange={(e) => setNewSlot({ ...newSlot, note: e.target.value })}
                                    className="border-border focus:ring-primary focus:border-primary"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-card text-card-foreground border-border">
                                  Add a note for this time slot
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          className="bg-gold hover:bg-gold/90 text-brown-900 font-medium w-full"
                          disabled={status === 'loading'}
                        >
                          {status === 'loading' ? 'Adding...' : 'Add Time Slot'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Slots Table */}
                  {slots.length > 0 ? (
                    <Card className="bg-muted border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-script text-card-foreground">
                          Existing Time Slots
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead className="text-card-foreground">Time</TableHead>
                              <TableHead className="text-card-foreground">Status</TableHead>
                              <TableHead className="text-card-foreground">Note</TableHead>
                              <TableHead className="text-card-foreground text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slots.map((slot, index) => (
                              <TableRow key={index} className="border-border">
                                <TableCell className="text-card-foreground font-medium">
                                  {slot.start} - {slot.end}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {slot.status === 'available' ? (
                                      <>
                                        <CheckCircle className="text-green-600" size={16} />
                                        <span className="text-green-600">Available</span>
                                      </>
                                    ) : slot.status === 'blocked' ? (
                                      <>
                                        <AlertCircle className="text-destructive" size={16} />
                                        <span className="text-destructive">Blocked</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="text-primary" size={16} />
                                        <span className="text-primary">Booked</span>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {slot.note || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {slot.status !== 'booked' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => handleBlockSlot(slot)}
                                            disabled={status === 'loading'}
                                          >
                                            {slot.status === 'blocked' ? 'Unblock' : 'Block'}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-card text-card-foreground border-border">
                                          {slot.status === 'blocked' 
                                            ? 'Make this time slot available again' 
                                            : 'Block this time slot from bookings'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 bg-muted rounded-lg border border-border">
                      <Clock className="mx-auto text-muted-foreground mb-2" size={32} />
                      <p className="text-muted-foreground">No time slots added for this date</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted rounded-lg border border-border">
                  <AlertCircle className="mx-auto text-destructive mb-2" size={32} />
                  <p className="text-muted-foreground">This date is marked as unavailable</p>
                  <p className="text-sm text-muted-foreground mt-1">Toggle the switch above to make it available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Delete Availability Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleDeleteAvailability}
                    disabled={status === 'loading' || moment(selectedDate).isBefore(moment(), 'day')}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Availability for {moment(selectedDate).format('MMMM D, YYYY')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-card text-card-foreground border-border">
                  Remove all availability data for this date
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {status === 'failed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-600">{error?.message || 'Failed to load availability'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AvailabilityPage;