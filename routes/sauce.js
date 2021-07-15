const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth'); //middleware qui vérifie les tokens d'authentification
const multer = require('../middleware/multer-config'); //middleware qui gère les fichiers entrants

const saucesCtrl = require('../controllers/sauce');

router.get('/', auth, saucesCtrl.getAllSauces);
router.get('/:id', auth, saucesCtrl.getOneSauce);
router.post('/', auth, multer, saucesCtrl.createSauce);
router.put('/:id', auth, multer, saucesCtrl.modifySauce);
router.delete('/:id', auth, saucesCtrl.deleteSauce);
router.post('/:id/like', auth, saucesCtrl.likeSauce);


module.exports = router;