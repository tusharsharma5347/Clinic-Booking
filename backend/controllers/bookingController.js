const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');

// Book a slot
const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    const userId = req.user._id;

    if (!slotId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_SLOT_ID',
          message: 'Slot ID is required'
        }
      });
    }

    // Check if slot exists and is available
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'Slot not found'
        }
      });
    }

    if (slot.isBooked) {
      return res.status(409).json({
        error: {
          code: 'SLOT_TAKEN',
          message: 'This slot is already booked'
        }
      });
    }

    // Check if slot is in the past
    if (slot.startAt < new Date()) {
      return res.status(400).json({
        error: {
          code: 'PAST_SLOT',
          message: 'Cannot book a slot in the past'
        }
      });
    }

    // Check if user already has a CONFIRMED booking for this time
    const existingBooking = await Booking.findOne({
      userId,
      status: 'confirmed',
      slotId: { $in: await Slot.find({
        startAt: { $lt: slot.endAt },
        endAt: { $gt: slot.startAt }
      }).distinct('_id') }
    });

    if (existingBooking) {
      return res.status(409).json({
        error: {
          code: 'OVERLAPPING_BOOKING',
          message: 'You already have a booking that overlaps with this time slot'
        }
      });
    }

    // Create the booking
    const booking = new Booking({
      userId,
      slotId,
      status: 'confirmed'
    });

    await booking.save();

    // Populate slot details for response
    await booking.populate('slotId');

    res.status(201).json({
      message: 'Slot booked successfully',
      data: {
        booking: {
          id: booking._id,
          slot: {
            id: slot._id,
            startAt: slot.startAt,
            endAt: slot.endAt
          },
          status: booking.status,
          createdAt: booking.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Book slot error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          code: 'SLOT_TAKEN',
          message: 'This slot is already booked'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'BOOKING_ERROR',
        message: 'Failed to book slot'
      }
    });
  }
};

// Get user's bookings
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ userId })
      .populate('slotId')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      slot: {
        id: booking.slotId._id,
        startAt: booking.slotId.startAt,
        endAt: booking.slotId.endAt,
        durationMinutes: booking.slotId.durationMinutes
      },
      status: booking.status,
      createdAt: booking.createdAt
    }));

    res.json({
      data: {
        bookings: formattedBookings,
        total: formattedBookings.length
      }
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      error: {
        code: 'GET_BOOKINGS_ERROR',
        message: 'Failed to retrieve bookings'
      }
    });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('slotId')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      user: {
        id: booking.userId._id,
        name: booking.userId.name,
        email: booking.userId.email
      },
      slot: {
        id: booking.slotId._id,
        startAt: booking.slotId.startAt,
        endAt: booking.slotId.endAt,
        durationMinutes: booking.slotId.durationMinutes
      },
      status: booking.status,
      createdAt: booking.createdAt
    }));

    res.json({
      data: {
        bookings: formattedBookings,
        total: formattedBookings.length
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      error: {
        code: 'GET_ALL_BOOKINGS_ERROR',
        message: 'Failed to retrieve all bookings'
      }
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    // Only allow users to cancel their own bookings, or admins to cancel any
    if (booking.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only cancel your own bookings'
        }
      });
    }

    // Check if booking can be cancelled (not in the past)
    const slot = await Slot.findById(booking.slotId);
    if (!slot) {
      return res.status(404).json({
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'Associated slot not found'
        }
      });
    }
    
    if (slot.startAt < new Date()) {
      return res.status(400).json({
        error: {
          code: 'PAST_BOOKING',
          message: 'Cannot cancel a booking in the past'
        }
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Mark slot as available again
    const updatedSlot = await Slot.findByIdAndUpdate(booking.slotId, { isBooked: false }, { new: true });
    if (!updatedSlot) {
      return res.status(500).json({
        error: {
          code: 'SLOT_UPDATE_FAILED',
          message: 'Failed to update slot status'
        }
      });
    }

    res.json({
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status
        }
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      error: {
        code: 'CANCEL_BOOKING_ERROR',
        message: 'Failed to cancel booking'
      }
    });
  }
};

module.exports = {
  bookSlot,
  getMyBookings,
  getAllBookings,
  cancelBooking
};
