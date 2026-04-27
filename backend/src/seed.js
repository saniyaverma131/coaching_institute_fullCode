import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import {
  User,
  Course,
  Batch,
  Enrollment,
  TimetableEntry,
  Invoice,
  Notice,
} from './models/index.js';

dotenv.config();

async function run() {
  await sequelize.authenticate();
  console.log('DB connected. Seeding...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const [adminUser, adminCreated] = await User.unscoped().findOrCreate({
    where: { email: 'admin@coaching.local' },
    defaults: {
      password_hash: adminHash,
      role: 'admin',
      name: 'System Admin',
      phone: null,
    },
  });
  if (adminCreated) console.log('Created admin@coaching.local / admin123');

  let teacher = await User.unscoped().findOne({ where: { email: 'teacher@coaching.local' } });
  if (!teacher) {
    teacher = await User.create({
      email: 'teacher@coaching.local',
      password_hash: await bcrypt.hash('teacher123', 10),
      role: 'teacher',
      name: 'Demo Teacher',
      phone: '9000000001',
    });
    console.log('Created teacher@coaching.local / teacher123');
  }

  let student = await User.unscoped().findOne({ where: { email: 'student@coaching.local' } });
  if (!student) {
    student = await User.create({
      email: 'student@coaching.local',
      password_hash: await bcrypt.hash('student123', 10),
      role: 'student',
      name: 'Demo Student',
      phone: '9000000002',
    });
    console.log('Created student@coaching.local / student123');
  }

  let course = await Course.findOne({ where: { name: 'Full Stack Web' } });
  if (!course) {
    course = await Course.create({
      name: 'Full Stack Web',
      description: 'React, Node, MySQL',
      duration_text: '6 months',
      fee_amount: 25000,
    });
  }

  let batch = await Batch.findOne({ where: { name: 'FSW Morning 2026' } });
  if (!batch) {
    batch = await Batch.create({
      course_id: course.id,
      teacher_id: teacher.id,
      name: 'FSW Morning 2026',
      schedule_text: 'Mon–Fri 9:00–11:00',
      start_date: '2026-01-15',
      end_date: '2026-07-15',
      capacity: 40,
    });
  }

  const [, enCreated] = await Enrollment.findOrCreate({
    where: { student_id: student.id, batch_id: batch.id },
    defaults: {},
  });
  if (enCreated) console.log('Enrolled demo student in batch');

  const ttCount = await TimetableEntry.count({ where: { batch_id: batch.id } });
  if (ttCount === 0) {
    await TimetableEntry.bulkCreate([
      {
        batch_id: batch.id,
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '10:30:00',
        subject: 'React Lab',
        room: 'Lab 1',
      },
      {
        batch_id: batch.id,
        day_of_week: 3,
        start_time: '09:00:00',
        end_time: '10:30:00',
        subject: 'Node & MySQL',
        room: 'Room 2',
      },
    ]);
    console.log('Added sample timetable rows');
  }

  const invExists = await Invoice.findOne({
    where: { student_id: student.id, course_id: course.id, status: 'pending' },
  });
  if (!invExists) {
    await Invoice.create({
      student_id: student.id,
      course_id: course.id,
      amount: course.fee_amount,
      status: 'pending',
      due_date: '2026-05-01',
    });
    console.log('Added pending invoice for demo student');
  }

  const nCount = await Notice.count();
  if (nCount === 0) {
    await Notice.create({
      title: 'Welcome',
      body: 'Welcome to the Smart Coaching Institute Management System.',
      author_id: adminUser.id,
    });
  }

  console.log('Seed complete.');
  await sequelize.close();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
