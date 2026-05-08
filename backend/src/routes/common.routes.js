import { Router } from 'express';
import { Op } from 'sequelize';
import {
  Course,
  Notice,
  Batch,
  Enrollment,
  TimetableEntry,
  User,
} from '../models/index.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, loadUser);

router.get('/courses', async (_req, res, next) => {
  try {
    const rows = await Course.findAll({ order: [['name', 'ASC']] });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/notices', async (_req, res, next) => {
  try {
    const rows = await Notice.findAll({
      include: [{ model: User, as: 'Author', attributes: ['id', 'name', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/timetable', async (req, res, next) => {
  try {
    const { batch_id: batchId } = req.query;
    console.log(req.userId, "userID")
    if (req.userRole === 'student') {
      const enrolls = await Enrollment.findAll({
        where: { student_id: req.userId },
        include: [{ model: Batch, include: [Course] }],
      });
      const batchIds = enrolls.map((e) => e.batch_id);
      if (batchIds.length === 0) return res.json([]);
      const entries = await TimetableEntry.findAll({
        where: { batch_id: { [Op.in]: batchIds } },
        include: [{ model: Batch, include: [Course, { model: User, as: 'Teacher', attributes: ['id', 'name'] }] }],
        order: [
          ['day_of_week', 'ASC'],
          ['start_time', 'ASC'],
        ],
      });
      return res.json(entries);
    }
    if (req.userRole === 'teacher') {
      const batches = await Batch.findAll({ where: { teacher_id: req.userId } });
      const ids = batches.map((b) => b.id);
      if (ids.length === 0) return res.json([]);
      const entries = await TimetableEntry.findAll({
        where: { batch_id: { [Op.in]: ids } },
        include: [{ model: Batch, include: [Course] }],
        order: [
          ['day_of_week', 'ASC'],
          ['start_time', 'ASC'],
        ],
      });
      return res.json(entries);
    }
    if (batchId) {
      const entries = await TimetableEntry.findAll({
        where: { batch_id: batchId },
        include: [{ model: Batch, include: [Course] }],
        order: [
          ['day_of_week', 'ASC'],
          ['start_time', 'ASC'],
        ],
      });
      return res.json(entries);
    }
    return res.status(400).json({ error: 'batch_id required for admin timetable query' });
  } catch (e) {
    next(e);
  }
});

router.get('/batches', async (req, res, next) => {
  try {
    const include = [Course, { model: User, as: 'Teacher', attributes: ['id', 'name', 'email'] }];
    if (req.userRole === 'admin') {
      const rows = await Batch.findAll({ include, order: [['id', 'ASC']] });
      return res.json(rows);
    }
    if (req.userRole === 'teacher') {
      const rows = await Batch.findAll({
        where: { teacher_id: req.userId },
        include,
        order: [['id', 'ASC']],
      });
      return res.json(rows);
    }
    const enrolls = await Enrollment.findAll({
      where: { student_id: req.userId },
      include: [{ model: Batch, include }],
    });
    res.json(enrolls.map((e) => e.Batch).filter(Boolean));
  } catch (e) {
    next(e);
  }
});

export default router;
