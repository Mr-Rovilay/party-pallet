import Availability from '../models/Availability.js'
import moment from 'moment'

// Set availability (admin only)
export const setAvailability = async (req, res) => {
  try {
    const { date, isAvailable, slots } = req.body
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      })
    }
    
    // Validate date format
    const parsedDate = moment(date, ['YYYY-MM-DD', moment.ISO_8601], true)
    if (!parsedDate.isValid()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD' 
      })
    }
    
    // Prevent setting availability for past dates
    if (parsedDate.isBefore(moment(), 'day')) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot set availability for past dates' 
      })
    }
    
    // Normalize date to start of day
    const normalizedDate = parsedDate.startOf('day').toDate()
    
    // Validate slots if provided
    if (slots) {
      for (const slot of slots) {
        if (!slot.start || !slot.end) {
          return res.status(400).json({ 
            success: false,
            message: 'Each slot must have start and end times' 
          })
        }
        
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
          return res.status(400).json({ 
            success: false,
            message: 'Time must be in HH:mm format' 
          })
        }
        
        // Validate time sequence
        const [startHours, startMinutes] = slot.start.split(':').map(Number)
        const [endHours, endMinutes] = slot.end.split(':').map(Number)
        const startTotal = startHours * 60 + startMinutes
        const endTotal = endHours * 60 + endMinutes
        
        if (endTotal <= startTotal) {
          return res.status(400).json({ 
            success: false,
            message: 'End time must be after start time' 
          })
        }
      }
    }
    
    let availability = await Availability.findOne({ date: normalizedDate })
    
    if (availability) {
      // Update existing availability
      availability.isAvailable = isAvailable !== undefined ? isAvailable : availability.isAvailable
      if (slots !== undefined) {
        // Don't allow changing slots that are already booked
        const bookedSlots = availability.slots.filter(slot => slot.status === 'booked')
        const newSlots = slots.filter(slot => 
          !bookedSlots.some(booked => 
            booked.start === slot.start && booked.end === slot.end
          )
        )
        availability.slots = [...bookedSlots, ...newSlots]
      }
      await availability.save()
    } else {
      // Create new availability
      availability = new Availability({
        date: normalizedDate,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        slots: slots || []
      })
      await availability.save()
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Availability updated successfully',
      availability: {
        ...availability.toObject(),
        date: moment(availability.date).format('YYYY-MM-DD'),
        slots: availability.slots || []
      }
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message)
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: messages 
      })
    }
    if (error.message === 'Time slots must not overlap') {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      })
    }
    console.error('Error setting availability:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    })
  }
}

// Get availability (public)
export const getAvailability = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query
    let query = {}
    
    if (date) {
      const parsedDate = moment(date, ['YYYY-MM-DD', moment.ISO_8601], true)
      if (!parsedDate.isValid()) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD' 
        })
      }
      query.date = parsedDate.startOf('day').toDate()
    } else if (startDate && endDate) {
      const start = moment(startDate, ['YYYY-MM-DD', moment.ISO_8601], true)
      const end = moment(endDate, ['YYYY-MM-DD', moment.ISO_8601], true)
      
      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD' 
        })
      }
      
      query.date = {
        $gte: start.startOf('day').toDate(),
        $lte: end.endOf('day').toDate()
      }
    }
    
    const availabilities = await Availability.find(query).sort({ date: 1 })
    
    const formattedAvailabilities = availabilities.map(avail => ({
      ...avail.toObject(),
      date: moment(avail.date).format('YYYY-MM-DD'),
      slots: avail.slots || []
    }))
    
    res.status(200).json({
      success: true,
      data: formattedAvailabilities
    })
  } catch (error) {
    console.error('Error getting availability:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    })
  }
}

// Block specific time slot (admin only)
export const blockSlot = async (req, res) => {
  try {
    const { date, start, end, note } = req.body
    
    if (!date || !start || !end) {
      return res.status(400).json({ 
        success: false,
        message: 'Date, start time, and end time are required' 
      })
    }
    
    const parsedDate = moment(date, ['YYYY-MM-DD', moment.ISO_8601], true)
    if (!parsedDate.isValid()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD' 
      })
    }
    
    if (parsedDate.isBefore(moment(), 'day')) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot block slots for past dates' 
      })
    }
    
    const normalizedDate = parsedDate.startOf('day').toDate()
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      return res.status(400).json({ 
        success: false,
        message: 'Time must be in HH:mm format' 
      })
    }
    
    const [startHours, startMinutes] = start.split(':').map(Number)
    const [endHours, endMinutes] = end.split(':').map(Number)
    const startTotal = startHours * 60 + startMinutes
    const endTotal = endHours * 60 + endMinutes
    
    if (endTotal <= startTotal) {
      return res.status(400).json({ 
        success: false,
        message: 'End time must be after start time' 
      })
    }
    
    let availability = await Availability.findOne({ date: normalizedDate })
    
    if (!availability) {
      availability = new Availability({
        date: normalizedDate,
        isAvailable: true,
        slots: []
      })
    }
    
    const existingSlotIndex = availability.slots.findIndex(
      slot => slot.start === start && slot.end === end
    )
    
    if (existingSlotIndex !== -1) {
      if (availability.slots[existingSlotIndex].status === 'booked') {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot block a booked slot' 
        })
      }
      availability.slots[existingSlotIndex].status = 'blocked'
      if (note) availability.slots[existingSlotIndex].note = note
    } else {
      availability.slots.push({
        start,
        end,
        status: 'blocked',
        note: note || ''
      })
    }
    
    await availability.save()
    
    res.status(200).json({ 
      success: true,
      message: 'Slot blocked successfully',
      availability: {
        ...availability.toObject(),
        date: moment(availability.date).format('YYYY-MM-DD'),
        slots: availability.slots || []
      }
    })
  } catch (error) {
    console.error('Error blocking slot:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    })
  }
}

// Delete availability (admin only)
export const deleteAvailability = async (req, res) => {
  try {
    const { date } = req.params
    const parsedDate = moment(date, ['YYYY-MM-DD', moment.ISO_8601], true)
    
    if (!parsedDate.isValid()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD' 
      })
    }
    
    if (parsedDate.isBefore(moment(), 'day')) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete availability for past dates' 
      })
    }
    
    const result = await Availability.deleteOne({ 
      date: parsedDate.startOf('day').toDate() 
    })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Availability not found' 
      })
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Availability deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting availability:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    })
  }
}