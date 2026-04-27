import { Router } from 'express';
import { Op } from 'sequelize';
import {
  Note,
  Course,
  Batch,
  Attendance,
  Mark as MarkModel,
  Assignment,
  Notice,
  User,
  Enrollment,
} from '../models/index.js';
import { authenticate, loadUser, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { notifyUser } from '../utils/notify.js';

const router = Router();

router.use(authenticate, loadUser, requireRole('teacher'));

router.get('/batches/:batchId/students', async (req, res, next) => {
  try {
    const batch = await Batch.findOne({
      where: { id: req.params.batchId, teacher_id: req.userId },
    });
    if (!batch) return res.status(403).json({ error: 'Not your batch' });
    const enrolls = await Enrollment.findAll({
      where: { batch_id: batch.id },
      include: [{ model: User, as: 'Student', attributes: ['id', 'name', 'email'] }],
    });
    res.json(enrolls.map((e) => e.Student).filter(Boolean));
  } catch (e) {
    next(e);
  }
});

router.post('/notes', upload.single('file'), async (req, res, next) => {
  try {
    const { course_id, title } = req.body;
    if (!course_id || !title || !req.file) {
      return res.status(400).json({ error: 'course_id, title, and file required' });
    }
    const n = await Note.create({
      course_id,
      uploaded_by: req.userId,
      title,
      file_name: req.file.originalname,
      file_path: req.file.filename,
    });
    const enrolls = await Enrollment.findAll({
      include: [{ model: Batch, where: { course_id }, attributes: ['id'] }],
    });
    const studentIds = [...new Set(enrolls.map((e) => e.student_id))];
    for (const sid of studentIds) {
      await notifyUser(sid, 'New study note', title);
    }
    res.status(201).json(n);
  } catch (e) {
    next(e);
  }
});

router.get('/notes', async (req, res, next) => {
  try {
    const rows = await Note.findAll({
      where: { uploaded_by: req.userId },
      include: [Course],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/attendance', async (req, res, next) => {
  try {
    const { student_id, batch_id, class_date, status } = req.body;
    if (!student_id || !batch_id || !class_date) {
      return res.status(400).json({ error: 'student_id, batch_id, class_date required' });
    }
    const batch = await Batch.findOne({ where: { id: batch_id, teacher_id: req.userId } });
    if (!batch) return res.status(403).json({ error: 'Not your batch' });
    const [row, created] = await Attendance.findOrCreate({
      where: { student_id, batch_id, class_date },
      defaults: {
        status: status || 'present',
        recorded_by: req.userId,
      },
    });
    if (!created) {
      await row.update({ status: status || row.status, recorded_by: req.userId });
    }
    await notifyUser(student_id, 'Attendance recorded', `${class_date}: ${row.status}`);
    res.status(created ? 201 : 200).json(row);
  } catch (e) {
    next(e);
  }
});

router.get('/attendance', async (req, res, next) => {
  try {
    const { batch_id } = req.query;
    if (!batch_id) return res.status(400).json({ error: 'batch_id required' });
    const batch = await Batch.findOne({ where: { id: batch_id, teacher_id: req.userId } });
    if (!batch) return res.status(403).json({ error: 'Not your batch' });
    const rows = await Attendance.findAll({
      where: { batch_id },
      include: [{ model: User, as: 'Student', attributes: ['id', 'name', 'email'] }],
      order: [['class_date', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/marks', async (req, res, next) => {
  try {
    const { student_id, course_id, exam_title, score, max_score } = req.body;
    if (!student_id || !course_id || !exam_title || score == null) {
      return res.status(400).json({ error: 'student_id, course_id, exam_title, score required' });
    }
    const teaches = await Batch.findOne({ where: { course_id, teacher_id: req.userId } });
    if (!teaches) return res.status(403).json({ error: 'You do not teach this course' });
    const m = await MarkModel.create({
      student_id,
      course_id,
      exam_title,
      score,
      max_score: max_score ?? 100,
      recorded_by: req.userId,
    });
    await notifyUser(student_id, 'Marks updated', `${exam_title}: ${score}`);
    res.status(201).json(m);
  } catch (e) {
    next(e);
  }
});

router.get('/marks', async (req, res, next) => {
  try {
    const { course_id } = req.query;
    if (!course_id) return res.status(400).json({ error: 'course_id required' });
    const teaches = await Batch.findOne({ where: { course_id, teacher_id: req.userId } });
    if (!teaches) return res.status(403).json({ error: 'You do not teach this course' });
    const rows = await MarkModel.findAll({
      where: { course_id },
      include: [{ model: User, as: 'Student', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/assignments', async (req, res, next) => {
  try {
    const { course_id, title, description, due_date } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const teaches = await Batch.findOne({ where: { course_id, teacher_id: req.userId } });
    if (!teaches) return res.status(403).json({ error: 'You do not teach this course' });
    const a = await Assignment.create({
      course_id,
      created_by: req.userId,
      title,
      description: description || null,
      due_date: due_date || null,
    });
    const batches = await Batch.findAll({ where: { course_id } });
    const batchIds = batches.map((b) => b.id);
    const enrolls = await Enrollment.findAll({ where: { batch_id: { [Op.in]: batchIds } } });
    const sids = [...new Set(enrolls.map((e) => e.student_id))];
    for (const sid of sids) {
      await notifyUser(sid, 'New assignment', title);
    }
    res.status(201).json(a);
  } catch (e) {
    next(e);
  }
});

router.get('/assignments', async (req, res, next) => {
  try {
    const batches = await Batch.findAll({ where: { teacher_id: req.userId } });
    const courseIds = [...new Set(batches.map((b) => b.course_id))];
    if (courseIds.length === 0) return res.json([]);
    const rows = await Assignment.findAll({
      where: { course_id: { [Op.in]: courseIds } },
      include: [Course],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/notices', async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const n = await Notice.create({ title, body, author_id: req.userId });
    const students = await User.findAll({ where: { role: 'student' } });
    for (const s of students) {
      await notifyUser(s.id, `Notice: ${title}`, body.slice(0, 200));
    }
    res.status(201).json(n);
  } catch (e) {
    next(e);
  }
});

export default router;
