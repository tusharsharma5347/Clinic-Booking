const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const slotController = require('../controllers/slotController');

const router = express.Router();

// Get available slots (public route, but requires authentication for better UX)
router.get('/slots', authenticateToken, slotController.getAvailableSlots);

// Get all slots including booked ones (admin only)
router.get('/slots/all', authenticateToken, requireAdmin, slotController.getAllSlots);

// Generate slots (admin only)
router.post('/slots/generate', authenticateToken, requireAdmin, slotController.generateSlots);

// Add single slot (admin only)
router.post('/slots', authenticateToken, requireAdmin, slotController.addSlot);

// Remove slot (admin only)
router.delete('/slots/:slotId', authenticateToken, requireAdmin, slotController.removeSlot);

module.exports = router;
