const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: [true, 'Slot ID is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});



// Pre-save middleware to update slot status (only for new bookings)
bookingSchema.pre('save', async function(next) {
  try {
    // Only run this middleware for new bookings, not updates
    if (!this.isNew) {
      return next();
    }
    
    const Slot = mongoose.model('Slot');
    
    // Check if slot exists and is available
    const slot = await Slot.findById(this.slotId);
    if (!slot) {
      return next(new Error('Slot not found'));
    }
    
    if (slot.isBooked) {
      return next(new Error('Slot is already booked'));
    }
    
    // Mark slot as booked
    slot.isBooked = true;
    await slot.save();
    
    next();
  } catch (error) {
    next(error);
  }
});



module.exports = mongoose.model('Booking', bookingSchema);
