// server/routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/:id', getNotification);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);

export default router;