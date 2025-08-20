const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startAt: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true
  },
  endAt: {
    type: Date,
    required: [true, 'End time is required'],
    index: true
  },
  isBooked: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure start time is before end time
slotSchema.pre('save', function(next) {
  if (this.startAt >= this.endAt) {
    return next(new Error('Start time must be before end time'));
  }
  next();
});

// Virtual for duration in minutes
slotSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endAt - this.startAt) / (1000 * 60));
});

// Ensure virtuals are serialized
slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

// Index for efficient queries
slotSchema.index({ startAt: 1, endAt: 1, isBooked: 1 });

module.exports = mongoose.model('Slot', slotSchema);
