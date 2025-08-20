const Slot = require('../models/Slot');

// Get all slots including booked ones (admin only)
const getAllSlots = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Validate date parameters
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: 'MISSING_DATES',
          message: 'Both from and to dates are required'
        }
      });
    }

    // Parse dates as UTC to match the stored slot times
    const fromDate = new Date(Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), new Date(from).getUTCDate(), 0, 0, 0));
    const toDate = new Date(Date.UTC(new Date(to).getUTCFullYear(), new Date(to).getUTCMonth(), new Date(to).getUTCDate(), 23, 59, 59));

    // Validate date format
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format. Use YYYY-MM-DD'
        }
      });
    }

    // Find ALL slots in the date range (including booked ones)
    const slots = await Slot.find({
      startAt: { $gte: fromDate, $lte: toDate }
    }).sort({ startAt: 1 });

    // Group slots by date for better organization
    const slotsByDate = {};
    slots.forEach(slot => {
      const dateKey = slot.startAt.toISOString().split('T')[0];
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push({
        id: slot._id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        durationMinutes: slot.durationMinutes,
        isBooked: slot.isBooked
      });
    });

    res.json({
      data: {
        slots: slotsByDate,
        totalSlots: slots.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get all slots error:', error);
    res.status(500).json({
      error: {
        code: 'SLOTS_ERROR',
        message: 'Failed to retrieve all slots'
      }
    });
  }
};

// Get available slots for a date range
const getAvailableSlots = async (req, res) => {
  try {
    const { from, to, includeBooked } = req.query;
    
    // Validate date parameters
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: 'MISSING_DATES',
          message: 'Both from and to dates are required'
        }
      });
    }

    // Parse dates as UTC to match the stored slot times
    const fromDate = new Date(Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), new Date(from).getUTCDate(), 0, 0, 0));
    const toDate = new Date(Date.UTC(new Date(to).getUTCFullYear(), new Date(to).getUTCMonth(), new Date(to).getUTCDate(), 23, 59, 59));

    // Validate date format
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format. Use YYYY-MM-DD'
        }
      });
    }

    // Ensure from date is not in the past
    const now = new Date();
    if (fromDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        error: {
          code: 'PAST_DATE',
          message: 'Cannot query slots in the past'
        }
      });
    }

    // Ensure date range is not more than 7 days
    const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) {
      return res.status(400).json({
        error: {
          code: 'DATE_RANGE_TOO_LARGE',
          message: 'Date range cannot exceed 7 days'
        }
      });
    }

    // Find slots in the date range (all or available only)
    const query = { startAt: { $gte: fromDate, $lte: toDate } };
    if (!includeBooked) {
      query.isBooked = false;
    }
    
    const slots = await Slot.find(query).sort({ startAt: 1 });

    // Group slots by date for better organization
    const slotsByDate = {};
    slots.forEach(slot => {
      const dateKey = slot.startAt.toISOString().split('T')[0];
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push({
        id: slot._id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        durationMinutes: slot.durationMinutes,
        isBooked: slot.isBooked
      });
    });

    res.json({
      data: {
        slots: slotsByDate,
        totalSlots: slots.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      error: {
        code: 'SLOTS_ERROR',
        message: 'Failed to retrieve available slots'
      }
    });
  }
};

// Generate slots for the next 7 days (admin function)
const generateSlots = async (req, res) => {
  try {
    const { days = 7 } = req.body;
    
    if (days < 1 || days > 30) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DAYS',
          message: 'Days must be between 1 and 30'
        }
      });
    }

    const slots = [];
    const now = new Date();
    // Start from tomorrow to avoid past dates, using UTC to avoid timezone issues
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const startDate = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 9, 0, 0)); // 9 AM tomorrow UTC

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        continue;
      }

      // Generate 30-minute slots from 9 AM to 5 PM (UTC)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), hour, minute, 0));

          const slotEnd = new Date(slotStart);
          slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + 30);

          // Check if slot already exists
          const existingSlot = await Slot.findOne({
            startAt: slotStart,
            endAt: slotEnd
          });

          if (!existingSlot) {
            slots.push({
              startAt: slotStart,
              endAt: slotEnd,
              isBooked: false
            });
          }
        }
      }
    }

    if (slots.length > 0) {
      await Slot.insertMany(slots);
    }

    res.json({
      message: 'Slots generated successfully',
      data: {
        slotsGenerated: slots.length,
        dateRange: {
          from: startDate.toISOString(),
          to: new Date(startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({
      error: {
        code: 'GENERATE_SLOTS_ERROR',
        message: 'Failed to generate slots'
      }
    });
  }
};

// Add single slot
const addSlot = async (req, res) => {
  try {
    const { startAt, endAt } = req.body;
    
    if (!startAt || !endAt) {
      return res.status(400).json({
        error: {
          code: 'MISSING_DATES',
          message: 'Start time and end time are required'
        }
      });
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // Validate date format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Invalid date format'
        }
      });
    }

    // Ensure start time is before end time
    if (startDate >= endDate) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TIME_RANGE',
          message: 'Start time must be before end time'
        }
      });
    }

    // Check if slot already exists
    const existingSlot = await Slot.findOne({
      startAt: startDate,
      endAt: endDate
    });

    if (existingSlot) {
      return res.status(409).json({
        error: {
          code: 'SLOT_EXISTS',
          message: 'Slot already exists for this time'
        }
      });
    }

    // Create new slot
    const slot = new Slot({
      startAt: startDate,
      endAt: endDate,
      isBooked: false
    });

    await slot.save();

    res.status(201).json({
      message: 'Slot added successfully',
      data: {
        slot: {
          id: slot._id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          durationMinutes: slot.durationMinutes
        }
      }
    });
  } catch (error) {
    console.error('Add slot error:', error);
    res.status(500).json({
      error: {
        code: 'ADD_SLOT_ERROR',
        message: 'Failed to add slot'
      }
    });
  }
};

// Remove slot
const removeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'Slot not found'
        }
      });
    }

    // Check if slot is booked
    if (slot.isBooked) {
      return res.status(400).json({
        error: {
          code: 'SLOT_BOOKED',
          message: 'Cannot remove a booked slot'
        }
      });
    }

    await Slot.findByIdAndDelete(slotId);

    res.json({
      message: 'Slot removed successfully'
    });
  } catch (error) {
    console.error('Remove slot error:', error);
    res.status(500).json({
      error: {
        code: 'REMOVE_SLOT_ERROR',
        message: 'Failed to remove slot'
      }
    });
  }
};

module.exports = {
  getAllSlots,
  getAvailableSlots,
  generateSlots,
  addSlot,
  removeSlot
};
