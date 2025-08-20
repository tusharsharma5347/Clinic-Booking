const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requirePatient, requireAdmin } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Validation middleware
const bookSlotValidation = [
  body('slotId')
    .isMongoId()
    .withMessage('Please provide a valid slot ID')
];

// Routes
router.post('/book', authenticateToken, requirePatient, bookSlotValidation, bookingController.bookSlot);
router.get('/my-bookings', authenticateToken, requirePatient, bookingController.getMyBookings);
router.get('/all-bookings', authenticateToken, requireAdmin, bookingController.getAllBookings);
router.patch('/bookings/:bookingId/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;
