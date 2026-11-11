const express = require('express');
const eventController = require('../controllers/eventController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/rbacMiddleware');
const validateId = require('../middlewares/validateId');

const { ADMIN, EDITOR } = checkRole.ROLES;
const router = express.Router();

// Público
router.get('/', eventController.list);
router.get('/:id', validateId, eventController.getById);

// Restrito
router.post('/', verifyToken, checkRole([ADMIN, EDITOR]), eventController.create);
router.put('/:id', validateId, verifyToken, checkRole([ADMIN, EDITOR]), eventController.update);
router.delete('/:id', validateId, verifyToken, checkRole([ADMIN]), eventController.remove);

module.exports = router;
