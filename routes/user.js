const express = require('express');
const router = express.Router();

const rateLimiter = require('../middleware/rate-limiter'); //middleware qui limite le nombre de requête

const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', rateLimiter, userCtrl.login);

module.exports = router;