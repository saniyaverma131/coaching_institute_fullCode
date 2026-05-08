import sequelize from '../config/database.js';
import User from './User.js';
import Course from './Course.js';
import Batch from './Batch.js';
import Enrollment from './Enrollment.js';
import TimetableEntry from './TimetableEntry.js';
import Note from './Note.js';
import Assignment from './Assignment.js';
import Notice from './Notice.js';
import Invoice from './Invoice.js';
import Payment from './Payment.js';
import Certificate from './Certificate.js';
import Attendance from './Attendance.js';
import Mark from './Mark.js';

Course.hasMany(Batch, { foreignKey: 'course_id' });
Batch.belongsTo(Course, { foreignKey: 'course_id' });

User.hasMany(Batch, { as: 'TeachingBatches', foreignKey: 'teacher_id' });
Batch.belongsTo(User, { as: 'Teacher', foreignKey: 'teacher_id' });

User.hasMany(Enrollment, { as: 'Enrollments', foreignKey: 'student_id' });
Enrollment.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
Batch.hasMany(Enrollment, { foreignKey: 'batch_id' });
Enrollment.belongsTo(Batch, { foreignKey: 'batch_id' });

Batch.hasMany(TimetableEntry, { foreignKey: 'batch_id' });
TimetableEntry.belongsTo(Batch, { foreignKey: 'batch_id' });

Course.hasMany(Note, { foreignKey: 'course_id' });
Note.belongsTo(Course, { foreignKey: 'course_id' });
User.hasMany(Note, { as: 'UploadedNotes', foreignKey: 'uploaded_by' });
Note.belongsTo(User, { as: 'Uploader', foreignKey: 'uploaded_by' });

Course.hasMany(Assignment, { foreignKey: 'course_id' });
Assignment.belongsTo(Course, { foreignKey: 'course_id' });
User.hasMany(Assignment, { as: 'CreatedAssignments', foreignKey: 'created_by' });
Assignment.belongsTo(User, { as: 'Creator', foreignKey: 'created_by' });

User.hasMany(Notice, { as: 'AuthoredNotices', foreignKey: 'author_id' });
Notice.belongsTo(User, { as: 'Author', foreignKey: 'author_id' });

User.hasMany(Invoice, { as: 'StudentInvoices', foreignKey: 'student_id' });
Invoice.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
Course.hasMany(Invoice, { foreignKey: 'course_id' });
Invoice.belongsTo(Course, { foreignKey: 'course_id' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

User.hasMany(Certificate, { as: 'StudentCertificates', foreignKey: 'student_id' });
Certificate.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
User.hasMany(Certificate, { as: 'IssuedCertificates', foreignKey: 'issued_by' });
Certificate.belongsTo(User, { as: 'Issuer', foreignKey: 'issued_by' });

User.hasMany(Attendance, { as: 'AttendanceRecords', foreignKey: 'student_id' });
Attendance.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
Batch.hasMany(Attendance, { foreignKey: 'batch_id' });
Attendance.belongsTo(Batch, { foreignKey: 'batch_id' });
User.hasMany(Attendance, { as: 'RecordedAttendance', foreignKey: 'recorded_by' });
Attendance.belongsTo(User, { as: 'Recorder', foreignKey: 'recorded_by' });

User.hasMany(Mark, { as: 'StudentMarks', foreignKey: 'student_id' });
Mark.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
Course.hasMany(Mark, { foreignKey: 'course_id' });
Mark.belongsTo(Course, { foreignKey: 'course_id' });
User.hasMany(Mark, { as: 'RecordedMarks', foreignKey: 'recorded_by' });
Mark.belongsTo(User, { as: 'Recorder', foreignKey: 'recorded_by' });

export {
  sequelize,
  User,
  Course,
  Batch,
  Enrollment,
  TimetableEntry,
  Note,
  Assignment,
  Notice,
  Invoice,
  Payment,
  Certificate,
  Attendance,
  Mark,
};
