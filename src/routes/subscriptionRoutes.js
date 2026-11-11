const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/rbacMiddleware');

const { ADMIN, EDITOR, USER } = checkRole.ROLES;
const router = express.Router();

router.use(verifyToken, checkRole([ADMIN, EDITOR, USER]));
router.post('/', subscriptionController.create);
// ADMIN/EDITOR: todas | USER: apenas as suas (filtrado no controller)
router.get('/', subscriptionController.list);

module.exports = router;
