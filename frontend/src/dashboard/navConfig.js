/** Sidebar: one primary place to go; descriptions show under the page title. */

export const ADMIN_NAV = [
  {
    id: 'home',
    label: 'Home',
    title: 'Admin overview',
    description: 'See alerts and the recommended order to set up your institute.',
  },
  {
    id: 'users',
    label: 'Staff & students',
    title: 'Teachers & students',
    description: 'Create accounts so teachers and students can sign in with their email.',
  },
  {
    id: 'courses',
    label: 'Courses',
    title: 'Courses',
    description: 'Add each program or subject. Fee here is used when you create invoices.',
  },
  {
    id: 'batches',
    label: 'Batches & enrollment',
    title: 'Batches & enrollment',
    description: 'Create a batch under a course, then add students to that batch.',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    title: 'Class timetable',
    description: 'Pick a batch and add weekly slots (day, time, subject, room).',
  },
  {
    id: 'fees',
    label: 'Fee invoices',
    title: 'Fee invoices',
    description: 'Raise fees against a course; students pay from the Fees page in their account.',
  },
  {
    id: 'notices',
    label: 'Announcements',
    title: 'Announcements',
    description: 'Post an institute-wide message. Everyone sees it in their Notices area.',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    title: 'Certificates',
    description: 'Upload a PDF or file for a student; they download it from their portal.',
  },
]

export const TEACHER_NAV = [
  {
    id: 'home',
    label: 'Home',
    title: 'Teacher overview',
    description: 'Quick tips and your latest alerts.',
  },
  {
    id: 'notes',
    label: 'Study materials',
    title: 'Study materials',
    description: 'Upload files per course. Students download them from Study materials.',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    title: 'Attendance',
    description: 'Choose your batch first, then mark each student for the class date.',
  },
  {
    id: 'marks',
    label: 'Marks & grades',
    title: 'Marks & grades',
    description: 'Select batch students, then record scores for an exam or assignment.',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    title: 'Assignments',
    description: 'Create tasks with optional due dates; students see them under Assignments.',
  },
  {
    id: 'notices',
    label: 'Class messages',
    title: 'Teacher notices',
    description: 'Share updates with students who use the app.',
  },
]

export const STUDENT_NAV = [
  {
    id: 'home',
    label: 'Home',
    title: 'Your overview',
    description: 'Start here for alerts and how the student portal is organized.',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    title: 'Timetable',
    description: 'Your weekly class schedule across batches.',
  },
  {
    id: 'notes',
    label: 'Study materials',
    title: 'Study materials',
    description: 'Notes uploaded by teachers — use Download to save the file.',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    title: 'Assignments',
    description: 'What your teachers assigned and when it is due.',
  },
  {
    id: 'fees',
    label: 'Fees & payments',
    title: 'Fees & payments',
    description: 'Pay pending invoices (demo). Receipts appear below after payment.',
  },
  {
    id: 'marks',
    label: 'Marks',
    title: 'Marks',
    description: 'Scores and exams recorded by your teachers.',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    title: 'Certificates',
    description: 'Documents shared by the office — download when you need them.',
  },
  {
    id: 'notices',
    label: 'Notices',
    title: 'Notices',
    description: 'Announcements from admin and teachers.',
  },
  {
    id: 'profile',
    label: 'Profile',
    title: 'Your profile',
    description: 'Update the name and phone shown on your account.',
  },
]

export function navForRole(role) {
  if (role === 'admin') return ADMIN_NAV
  if (role === 'teacher') return TEACHER_NAV
  if (role === 'student') return STUDENT_NAV
  return []
}
