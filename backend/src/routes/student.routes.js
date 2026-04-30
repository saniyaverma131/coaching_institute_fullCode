import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Invoice,
  Payment,
  Certificate,
  Note,
  Assignment,
  Course,
  Batch,
  Enrollment,
  User,
  Mark,
} from '../models/index.js';
import { authenticate, loadUser, requireRole } from '../middleware/auth.js';
import { makeReceiptNumber } from '../utils/receipt.js';
// import { notifyUser } from '../utils/notify.js';
import { uploadsDir } from '../middleware/upload.js';

const router = Router();

router.use(authenticate, loadUser, requireRole('student'));

async function courseIdsForStudent(studentId) {
  const enrolls = await Enrollment.findAll({
    where: { student_id: studentId },
    include: [Batch],
  });
  return [...new Set(enrolls.map((e) => e.Batch?.course_id).filter(Boolean))];
}

router.get('/invoices', async (req, res, next) => {
  try {
    const rows = await Invoice.findAll({
      where: { student_id: req.userId },
      include: [Course],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/pay', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { invoice_id, payment_method } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id required' });
    const inv = await Invoice.findOne({
      where: { id: invoice_id, student_id: req.userId },
      transaction: t,
    });
    if (!inv) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (inv.status === 'paid') {
      await t.rollback();
      return res.status(400).json({ error: 'Already paid' });
    }
    const receipt_number = makeReceiptNumber();
    await Payment.create(
      {
        invoice_id: inv.id,
        amount: inv.amount,
        payment_method: payment_method || 'online',
        receipt_number,
      },
      { transaction: t }
    );
    await inv.update({ status: 'paid' }, { transaction: t });
    await t.commit();
    // await notifyUser(req.userId, 'Payment successful', `Receipt ${receipt_number}`);
    res.status(201).json({ receipt_number, amount: inv.amount, invoice_id: inv.id });
  } catch (e) {
    await t.rollback();
    next(e);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { student_id: req.userId },
      attributes: ['id'],
    });
    const ids = invoices.map((i) => i.id);
    if (ids.length === 0) return res.json([]);
    const rows = await Payment.findAll({
      where: { invoice_id: { [Op.in]: ids } },
      include: [{ model: Invoice, include: [Course] }],
      order: [['paid_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/certificates', async (req, res, next) => {
  try {
    const rows = await Certificate.findAll({
      where: { student_id: req.userId },
      include: [{ model: User, as: 'Issuer', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/notes', async (req, res, next) => {
  try {
    const cids = await courseIdsForStudent(req.userId);
    if (cids.length === 0) return res.json([]);
    const rows = await Note.findAll({
      where: { course_id: { [Op.in]: cids } },
      include: [Course, { model: User, as: 'Uploader', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/assignments', async (req, res, next) => {
  try {
    const cids = await courseIdsForStudent(req.userId);
    if (cids.length === 0) return res.json([]);
    const rows = await Assignment.findAll({
      where: { course_id: { [Op.in]: cids } },
      include: [Course, { model: User, as: 'Creator', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/marks', async (req, res, next) => {
  try {
    const cids = await courseIdsForStudent(req.userId);
    if (cids.length === 0) return res.json([]);
    const rows = await Mark.findAll({
      where: { student_id: req.userId, course_id: { [Op.in]: cids } },
      include: [Course],
      order: [['created_at', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;

/** Shared download handler mounted separately */
export async function downloadNote(req, res, next) {
  try {
    const note = await Note.findByPk(req.params.id, { include: [Course] });
    if (!note) return res.status(404).json({ error: 'Not found' });

    if (req.userRole === 'admin') {
      // ok
    } else if (req.userRole === 'teacher') {
      if (note.uploaded_by !== req.userId) {
        const batch = await Batch.findOne({ where: { course_id: note.course_id, teacher_id: req.userId } });
        if (!batch) return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.userRole === 'student') {
      const cids = await courseIdsForStudent(req.userId);
      if (!cids.includes(note.course_id)) return res.status(403).json({ error: 'Forbidden' });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const abs = path.join(uploadsDir(), note.file_path);
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing' });
    res.download(abs, note.file_name);
  } catch (e) {
    next(e);
  }
}

export async function downloadCertificate(req, res, next) {
  try {
    const cert = await Certificate.findByPk(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Not found' });
    if (req.userRole !== 'admin' && cert.student_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const abs = path.join(uploadsDir(), cert.file_path);
    if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing' });
    res.download(abs, cert.file_name);
  } catch (e) {
    next(e);
  }
}
