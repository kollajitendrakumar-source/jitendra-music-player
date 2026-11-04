import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController.js';

const router = express.Router();

router.get('/', getFavorites);
router.post('/:songId', addFavorite);
router.delete('/:songId', removeFavorite);

export default router;

