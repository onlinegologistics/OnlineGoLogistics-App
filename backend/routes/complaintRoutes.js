const express = require('express');
const router = express.Router();
const { getComplaints, createComplaint, updateComplaint } = require('../controllers/complaintController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Note: We need a new middleware 'optionalProtect' if we want to attach user if present, but not fail if missing.
// For now, let's just use open route for POST, and handle req.user in controller if we can inject it manually or use a custom middleware.
// Actually, `protect` throws error if no token.
// We need a middleware that checks for token but doesn't error if missing.

// Let's create a quick inline middleware or update authMiddleware?
// Simpler: Just make POST public. The controller will check `req.user`. 
// BUT `req.user` is only set by `protect`.
// So we need a middleware that attempts to set `req.user` but continues if no token.

const identifyUser = require('../middleware/identifyUser'); // We will create this

router.route('/').get(protect, getComplaints).post(identifyUser, createComplaint);
router.route('/:id').put(protect, updateComplaint);

module.exports = router;
