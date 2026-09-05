// server/routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getNotifications);
router.get('/:id', getNotification);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;