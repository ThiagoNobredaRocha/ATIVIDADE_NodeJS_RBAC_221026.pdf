const express = require('express');
const certificateController = require('../controllers/certificateController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/rbacMiddleware');
const validateId = require('../middlewares/validateId');

const { ADMIN, EDITOR, USER } = checkRole.ROLES;
const router = express.Router();

// ADMIN/EDITOR: qualquer certificado | USER: apenas das suas inscrições (verificado no controller)
router.get('/:id', validateId, verifyToken, checkRole([ADMIN, EDITOR, USER]), certificateController.getBySubscription);

module.exports = router;
