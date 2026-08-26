const express = require('express');
const router = express.Router();
const { getBranches, getCities } = require('../controllers/branchController');

router.get('/cities', getCities);
router.get('/', getBranches);

module.exports = router;
