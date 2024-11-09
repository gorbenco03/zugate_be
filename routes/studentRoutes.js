// routes/studentRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getSchedule,
  getLesson,
  submitQuizAnswers,
  submitFeedback,
  markAttendance,
  getAttendanceStatus,
  getQuizForLesson,
} from '../controllers/studentController.js';

const router = express.Router();

// Routes for students
router.get('/schedule', protect, authorizeRoles('student'), getSchedule);
router.get('/lessons/:id', protect, authorizeRoles('student'), getLesson);
router.post('/lessons/:id/feedback', protect, authorizeRoles('student'), submitFeedback);
router.post('/lessons/:id/attendance', protect, authorizeRoles('student'), markAttendance);
router.get('/quizzes/:lessonId', protect, authorizeRoles('student'), getQuizForLesson);
router.post('/quizzes/:lessonId/submit', protect, authorizeRoles('student'), submitQuizAnswers);
router.get('/lessons/:id/attendance', protect, authorizeRoles('student'), getAttendanceStatus);
export default router;