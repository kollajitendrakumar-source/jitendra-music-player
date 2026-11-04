import express from 'express';
import { getHistory, recordHistory, getStats } from '../controllers/historyController.js';

const router = express.Router();

router.get('/history', getHistory);
router.post('/history', recordHistory);
router.get('/stats', getStats);

export default router;

