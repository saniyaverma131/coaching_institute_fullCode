import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  User,
  Course,
  Batch,
  Enrollment,
  TimetableEntry,
  Invoice,
  Notice,
  Certificate,
} from '../models/index.js';
import { authenticate, loadUser, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
// import { notifyUser } from '../utils/notify.js';

const router = Router();

router.use(authenticate, loadUser, requireRole('admin'));

router.get('/users', async (_req, res, next) => {
  try {
    const rows = await User.findAll({
      attributes: ['id', 'email', 'role', 'name', 'phone', 'created_at'],
      order: [['id', 'ASC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, role required' });
    }
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'role must be teacher or student' });
    }
    const exists = await User.unscoped().findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email exists' });
    const password_hash = password;
    const u = await User.create({ email, password_hash, name, phone: phone || null, role });
    res.status(201).json(u);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.userId) return res.status(400).json({ error: 'Cannot delete self' });
    const n = await User.destroy({ where: { id } });
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.post('/courses', async (req, res, next) => {
  try {
    const { name, description, duration_text, fee_amount } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const c = await Course.create({
      name,
      description: description || null,
      duration_text: duration_text || null,
      fee_amount: fee_amount ?? 0,
    });
    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
});

router.put('/courses/:id', async (req, res, next) => {
  try {
    const c = await Course.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const { name, description, duration_text, fee_amount } = req.body;
    await c.update({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(duration_text !== undefined && { duration_text }),
      ...(fee_amount !== undefined && { fee_amount }),
    });
    res.json(c);
  } catch (e) {
    next(e);
  }
});

router.post('/batches', async (req, res, next) => {
  try {
    const { course_id, teacher_id, name, schedule_text, start_date, end_date, capacity } = req.body;
    
    if (!course_id || !name) return res.status(400).json({ error: 'course_id and name required' });
    const b = await Batch.create({
      course_id,
      teacher_id: teacher_id || null,
      name,
      schedule_text: schedule_text || null,
      start_date: start_date || null,
      end_date: end_date || null,
      capacity: capacity ?? 30,
    });
    // if (teacher_id) await notifyUser(teacher_id, 'New batch assigned', `You are assigned to batch: ${name}`);
    res.status(201).json(b);
  } catch (e) {
    next(e);
  }
});

router.put('/batches/:id', async (req, res, next) => {
  try {
    const b = await Batch.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    const { teacher_id, name, schedule_text, start_date, end_date, capacity } = req.body;
    await b.update({
      ...(teacher_id !== undefined && { teacher_id }),
      ...(name !== undefined && { name }),
      ...(schedule_text !== undefined && { schedule_text }),
      ...(start_date !== undefined && { start_date }),
      ...(end_date !== undefined && { end_date }),
      ...(capacity !== undefined && { capacity }),
    });
    res.json(b);
  } catch (e) {
    next(e);
  }
});

router.post('/enrollments', async (req, res, next) => {
  try {
    const { student_id, batch_id } = req.body;
    if (!student_id || !batch_id) return res.status(400).json({ error: 'student_id and batch_id required' });
    const e = await Enrollment.create({ student_id, batch_id });
    // const batch = await Batch.findByPk(batch_id, { include: [Course] });
    // await notifyUser(student_id, 'Enrolled in batch', batch ? `${batch.name} — ${batch.Course?.name || ''}` : 'New enrollment');
    res.status(201).json(e);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Already enrolled in this batch' });
    }
    next(e);
  }
});

router.post('/timetable', async (req, res, next) => {
  try {
    const { batch_id, day_of_week, start_time, end_time, subject, room } = req.body;
    if (
      batch_id == null ||
      day_of_week == null ||
      !start_time ||
      !end_time ||
      !subject
    ) {
      return res.status(400).json({ error: 'batch_id, day_of_week, start_time, end_time, subject required' });
    }
    const row = await TimetableEntry.create({
      batch_id,
      day_of_week,
      start_time,
      end_time,
      subject,
      room: room || null,
    });
    // const enrollRows = await Enrollment.findAll({ where: { batch_id } });
    // const studentIds = enrollRows.map((en) => en.student_id);
    // for (const sid of studentIds) {
    //   await notifyUser(sid, 'Timetable updated', `New slot: ${subject}`);
    // }
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

router.delete('/timetable/:id', async (req, res, next) => {
  try {
    const n = await TimetableEntry.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.post('/invoices', async (req, res, next) => {
  try {
    const { student_id, course_id, amount, due_date } = req.body;
    if (!student_id || !course_id || amount == null) {
      return res.status(400).json({ error: 'student_id, course_id, amount required' });
    }
    const inv = await Invoice.create({
      student_id,
      course_id,
      amount,
      status: 'pending',
      due_date: due_date || null,
    });
    // await notifyUser(student_id, 'New fee invoice', `Amount ${amount} — please pay from your dashboard.`);
    res.status(201).json(inv);
  } catch (e) {
    next(e);
  }
});

router.get('/invoices', async (_req, res, next) => {
  try {
    const rows = await Invoice.findAll({
      include: [
        { model: User, as: 'Student', attributes: ['id', 'name', 'email'] },
        Course,
      ],
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
    // const students = await User.findAll({ where: { role: 'student' } });
    // for (const s of students) {
    //   await notifyUser(s.id, `Notice: ${title}`, body.slice(0, 200));
    // }
    res.status(201).json(n);
  } catch (e) {
    next(e);
  }
});

router.post('/certificates', upload.single('file'), async (req, res, next) => {
  try {
    const { student_id, title } = req.body;
    if (!student_id || !title || !req.file) {
      return res.status(400).json({ error: 'student_id, title, and file required' });
    }
    const c = await Certificate.create({
      student_id,
      title,
      file_name: req.file.originalname,
      file_path: req.file.filename,
      issued_by: req.userId,
    });
    // await notifyUser(Number(student_id), 'New certificate', title);
    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
});

export default router;
