const express = require('express');
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/rbacMiddleware');
const validateId = require('../middlewares/validateId');

const { ADMIN, EDITOR, USER } = checkRole.ROLES;
const router = express.Router();

// Público
router.post('/register', userController.register);
router.post('/login', userController.login);

// Autenticado
router.get('/me', verifyToken, userController.me);
router.get('/', verifyToken, checkRole([ADMIN, EDITOR]), userController.list);
router.get('/:id', validateId, verifyToken, userController.getById);
// Regras de "próprio perfil"/"apenas perfil USER" são verificadas no controller
router.put('/:id', validateId, verifyToken, checkRole([ADMIN, EDITOR, USER]), userController.update);
router.patch('/:id', validateId, verifyToken, checkRole([ADMIN, EDITOR, USER]), userController.update);
router.delete('/:id', validateId, verifyToken, checkRole([ADMIN]), userController.remove);

module.exports = router;
