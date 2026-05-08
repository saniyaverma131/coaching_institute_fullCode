import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import { api, downloadBlob } from '../api'
import { ADMIN_NAV, TEACHER_NAV, STUDENT_NAV } from './navConfig'

function PanelHead({ nav, id }) {
  const m = nav.find((x) => x.id === id)
  if (!m) return null
  return (
    <>
      <h2>{m.title}</h2>
      <p className="panel-lead">{m.description}</p>
    </>
  )
}

function EmptyHint({ title = 'Nothing to show yet', hint }) {
  return (
    <p className="empty-hint" role="status">
      <strong>{title}</strong>
      {hint ? <> {hint}</> : null}
    </p>
  )
}

const ADMIN_FLOW = [
  { id: 'users', label: 'Add staff & students' },
  { id: 'courses', label: 'Create courses' },
  { id: 'batches', label: 'Open batches & enroll students' },
  { id: 'timetable', label: 'Build the weekly timetable' },
  { id: 'fees', label: 'Send fee invoices' },
  { id: 'notices', label: 'Post announcements' },
  { id: 'certificates', label: 'Upload certificates when ready' },
]

export function AdminPanel({ section, onNavigate }) {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [invoices, setInvoices] = useState([])
  const load = useCallback(async () => {
    const [u, c, b, inv] = await Promise.all([
      api('/api/admin/users'),
      api('/api/courses'),
      api('/api/batches'),
      api('/api/admin/invoices'),
    ])
    setUsers(u)
    setCourses(c)
    setBatches(b)
    setInvoices(inv)
  }, [])
  useEffect(() => {
    load().catch((e) => toast.error(e.message))
  }, [load, toast])

  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length

  return (
    <>
      {section === 'home' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="home" />
            <div className="stat-row">
              <div className="stat-card">
                <span className="stat-num">{users.length}</span>
                <span className="stat-label">People</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{courses.length}</span>
                <span className="stat-label">Courses</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{batches.length}</span>
                <span className="stat-label">Batches</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{pendingInvoices}</span>
                <span className="stat-label">Pending fees</span>
              </div>
            </div>
            <h3 className="panel-subtitle">Recommended setup order</h3>
            <ol className="flow-steps">
              {ADMIN_FLOW.map((step, i) => (
                <li key={step.id}>
                  <button type="button" className="flow-step-link" onClick={() => onNavigate(step.id)}>
                    <span className="flow-step-num">{i + 1}</span>
                    {step.label}
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {section === 'users' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="users" />
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/users', {
                    method: 'POST',
                    body: {
                      email: fd.get('email'),
                      password: fd.get('password'),
                      name: fd.get('name'),
                      phone: fd.get('phone'),
                      role: fd.get('role'),
                    },
                  })
                  e.target.reset()
                  load()
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <input name="name" placeholder="Full name" required />
              <input name="email" type="email" placeholder="Email (used to log in)" required />
              <input name="phone" placeholder="Phone" />
              <input name="password" type="password" placeholder="Initial password" required />
              <select name="role" required defaultValue="student">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <button type="submit">Add user</button>
            </form>
            {users.length === 0 ? (
              <EmptyHint hint="Add at least one teacher and one student so batches and attendance can work." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {section === 'courses' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="courses" />
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/courses', {
                    method: 'POST',
                    body: {
                      name: fd.get('name'),
                      duration_text: fd.get('duration_text'),
                      fee_amount: Number(fd.get('fee_amount')) || 0,
                      description: fd.get('description'),
                    },
                  })
                  e.target.reset()
                  load()
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <input name="name" placeholder="Course name" required />
              <input name="duration_text" placeholder="Duration (e.g. 12 weeks)" />
              <input name="fee_amount" type="number" placeholder="Default fee amount" />
              <input name="description" placeholder="Short description" />
              <button type="submit">Add course</button>
            </form>
            {courses.length === 0 ? (
              <EmptyHint hint="Courses are required before you can create batches." />
            ) : (
              <p className="muted small">
                {courses.length} course{courses.length !== 1 ? 's' : ''} on file. Batches link to these.
              </p>
            )}
          </section>
        </div>
      )}

      {section === 'batches' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="batches" />
            <h3 className="panel-subtitle">Step 1 — Create a batch</h3>
            <p className="panel-aside">A batch is a running class group under one course. You can assign a teacher now or later.</p>
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/batches', {
                    method: 'POST',
                    body: {
                      course_id: Number(fd.get('course_id')),
                      teacher_id: fd.get('teacher_id') ? Number(fd.get('teacher_id')) : null,
                      name: fd.get('name'),
                      schedule_text: fd.get('schedule_text'),
                      capacity: Number(fd.get('capacity')) || 30,
                    },
                  })
                  e.target.reset()
                  load()
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="course_id" required defaultValue="">
                <option value="" disabled>
                  Select course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="teacher_id" defaultValue="">
                <option value="">Teacher (optional)</option>
                {users
                  .filter((u) => u.role === 'teacher')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <input name="name" placeholder="Batch name (e.g. Morning JEE)" required />
              <input name="schedule_text" placeholder="Schedule summary for students" />
              <input name="capacity" type="number" placeholder="Max students" />
              <button type="submit">Create batch</button>
            </form>
            <h3 className="panel-subtitle">Step 2 — Enroll a student in a batch</h3>
            <p className="panel-aside">Pick the student, then the batch they should join.</p>
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/enrollments', {
                    method: 'POST',
                    body: {
                      student_id: Number(fd.get('student_id')),
                      batch_id: Number(fd.get('batch_id')),
                    },
                  })
                  toast.success('Student enrolled successfully.')
                  load()
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="student_id" required defaultValue="">
                <option value="" disabled>
                  Select student
                </option>
                {users
                  .filter((u) => u.role === 'student')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <select name="batch_id" required defaultValue="">
                <option value="" disabled>
                  Select batch
                </option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button type="submit">Enroll student</button>
            </form>
          </section>
        </div>
      )}

      {section === 'timetable' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="timetable" />
            <p className="panel-aside">
              Day: 0 = Sunday through 6 = Saturday. Add one row per time slot; students see the combined timetable in their portal.
            </p>
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/timetable', {
                    method: 'POST',
                    body: {
                      batch_id: Number(fd.get('batch_id')),
                      day_of_week: Number(fd.get('day_of_week')),
                      start_time: fd.get('start_time'),
                      end_time: fd.get('end_time'),
                      subject: fd.get('subject'),
                      room: fd.get('room'),
                    },
                  })
                  toast.success('Timetable slot saved.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="batch_id" required defaultValue="">
                <option value="" disabled>
                  Batch
                </option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input name="day_of_week" type="number" min="0" max="6" placeholder="Day 0–6" required />
              <input name="start_time" type="time" required />
              <input name="end_time" type="time" required />
              <input name="subject" placeholder="Subject" required />
              <input name="room" placeholder="Room (optional)" />
              <button type="submit">Add slot</button>
            </form>
          </section>
        </div>
      )}

      {section === 'fees' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="fees" />
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/invoices', {
                    method: 'POST',
                    body: {
                      student_id: Number(fd.get('student_id')),
                      course_id: Number(fd.get('course_id')),
                      amount: Number(fd.get('amount')),
                      due_date: fd.get('due_date') || null,
                    },
                  })
                  load()
                  toast.success('Invoice created.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="student_id" required defaultValue="">
                <option value="" disabled>
                  Student
                </option>
                {users
                  .filter((u) => u.role === 'student')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <select name="course_id" required defaultValue="">
                <option value="" disabled>
                  Course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input name="amount" type="number" step="0.01" placeholder="Amount" required />
              <input name="due_date" type="date" />
              <button type="submit">Create invoice</button>
            </form>
            {invoices.length === 0 ? (
              <EmptyHint hint="Students will see pending invoices under Fees & payments and can use Pay now (demo)." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td>{i.Student?.name}</td>
                      <td>{i.Course?.name}</td>
                      <td>{i.amount}</td>
                      <td>{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {section === 'notices' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="notices" />
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/admin/notices', {
                    method: 'POST',
                    body: { title: fd.get('title'), body: fd.get('body') },
                  })
                  toast.success('Notice posted for everyone.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <input name="title" placeholder="Announcement title" required aria-label="Title" />
              <textarea name="body" rows={4} placeholder="Write your message…" required />
              <button type="submit">Publish announcement</button>
            </form>
          </section>
        </div>
      )}

      {section === 'certificates' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={ADMIN_NAV} id="certificates" />
            <form
              encType="multipart/form-data"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await fetch('/api/admin/certificates', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    body: fd,
                  }).then(async (r) => {
                    const d = await r.json().catch(() => ({}))
                    if (!r.ok) throw new Error(d.error || r.statusText)
                  })
                  toast.success('Certificate uploaded.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="student_id" required defaultValue="">
                <option value="" disabled>
                  Student
                </option>
                {users
                  .filter((u) => u.role === 'student')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <input name="title" placeholder="Certificate title" required />
              <input name="file" type="file" required />
              <button type="submit">Upload file</button>
            </form>
          </section>
        </div>
      )}

    </>
  )
}

const TEACHER_FLOW = [
  { id: 'notes', label: 'Share study files' },
  { id: 'attendance', label: 'Mark attendance by batch' },
  { id: 'marks', label: 'Record marks' },
  { id: 'assignments', label: 'Publish assignments' },
  { id: 'notices', label: 'Send a class notice' },
]

export function TeacherPanel({ section, onNavigate }) {
  const toast = useToast()
  const [batches, setBatches] = useState([])
  const [notes, setNotes] = useState([])
  const [students, setStudents] = useState([])
  const [selBatch, setSelBatch] = useState('')
  const [courses, setCourses] = useState([])
  const load = useCallback(async () => {
    const [b, n, c] = await Promise.all([api('/api/batches'), api('/api/teacher/notes'), api('/api/courses')])
    setBatches(b)
    setNotes(n)
    setCourses(c)
  }, [])
  useEffect(() => {
    load().catch((e) => toast.error(e.message))
  }, [load, toast])
  useEffect(() => {
    if (!selBatch) {
      setStudents([])
      return
    }
    api(`/api/teacher/batches/${selBatch}/students`)
      .then(setStudents)
      .catch(() => setStudents([]))
  }, [selBatch])

  return (
    <>
      {section === 'home' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="home" />
            <p className="panel-aside">Use the menu on the left to jump to a task. Most actions need a course or batch first.</p>
            <h3 className="panel-subtitle">Typical class day flow</h3>
            <ol className="flow-steps">
              {TEACHER_FLOW.map((step, i) => (
                <li key={step.id}>
                  <button type="button" className="flow-step-link" onClick={() => onNavigate(step.id)}>
                    <span className="flow-step-num">{i + 1}</span>
                    {step.label}
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {section === 'notes' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="notes" />
            <form
              encType="multipart/form-data"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await fetch('/api/teacher/notes', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    body: fd,
                  }).then(async (r) => {
                    const d = await r.json().catch(() => ({}))
                    if (!r.ok) throw new Error(d.error || r.statusText)
                  })
                  load()
                  toast.success('File uploaded.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="course_id" required defaultValue="">
                <option value="" disabled>
                  Course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Title shown to students" required />
              <input name="file" type="file" required />
              <button type="submit">Upload material</button>
            </form>
            {notes.length === 0 ? (
              <EmptyHint hint="Uploaded files appear in this list and on each student’s Study materials tab." />
            ) : (
              <ul className="list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <strong>{n.title}</strong> <span className="muted">— {n.Course?.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'attendance' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="attendance" />
            <label className="field-label" htmlFor="teacher-batch">
              Batch for this class
            </label>
            <select id="teacher-batch" value={selBatch} onChange={(e) => setSelBatch(e.target.value)}>
              <option value="">Choose a batch first</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {!selBatch ? (
              <EmptyHint title="Select a batch" hint="The student list loads from the batch you pick." />
            ) : students.length === 0 ? (
              <EmptyHint title="No students in this batch" hint="Ask an admin to enroll students into this batch." />
            ) : (
              <form
                className="rowform"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const fd = new FormData(e.target)
                  try {
                    await api('/api/teacher/attendance', {
                      method: 'POST',
                      body: {
                        student_id: Number(fd.get('student_id')),
                        batch_id: Number(selBatch),
                        class_date: fd.get('class_date'),
                        status: fd.get('status'),
                      },
                    })
                    toast.success('Attendance saved.')
                  } catch (ex) {
                    toast.error(ex.message)
                  }
                }}
              >
                <select name="student_id" required defaultValue="">
                  <option value="" disabled>
                    Student
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input name="class_date" type="date" required />
                <select name="status" defaultValue="present">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
                <button type="submit">Save attendance</button>
              </form>
            )}
          </section>
        </div>
      )}

      {section === 'marks' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="marks" />
            <label className="field-label" htmlFor="teacher-batch-marks">
              Batch (loads student list)
            </label>
            <select id="teacher-batch-marks" value={selBatch} onChange={(e) => setSelBatch(e.target.value)}>
              <option value="">Choose batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {!selBatch ? (
              <EmptyHint title="Pick a batch first" hint="Marks use the same student list as attendance." />
            ) : (
              <form
                className="rowform"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const fd = new FormData(e.target)
                  try {
                    await api('/api/teacher/marks', {
                      method: 'POST',
                      body: {
                        student_id: Number(fd.get('student_id')),
                        course_id: Number(fd.get('course_id')),
                        exam_title: fd.get('exam_title'),
                        score: Number(fd.get('score')),
                        max_score: Number(fd.get('max_score')) || 100,
                      },
                    })
                    toast.success('Mark recorded.')
                  } catch (ex) {
                    toast.error(ex.message)
                  }
                }}
              >
                <select name="student_id" required defaultValue="">
                  <option value="" disabled>
                    Student
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select name="course_id" required defaultValue="">
                  <option value="" disabled>
                    Course
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input name="exam_title" placeholder="Exam or assignment name" required />
                <input name="score" type="number" step="0.01" placeholder="Score" required />
                <input name="max_score" type="number" step="0.01" placeholder="Out of (default 100)" />
                <button type="submit">Save mark</button>
              </form>
            )}
          </section>
        </div>
      )}

      {section === 'assignments' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="assignments" />
            <form
              className="rowform"
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/teacher/assignments', {
                    method: 'POST',
                    body: {
                      course_id: Number(fd.get('course_id')),
                      title: fd.get('title'),
                      description: fd.get('description'),
                      due_date: fd.get('due_date') || null,
                    },
                  })
                  toast.success('Assignment created.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <select name="course_id" required defaultValue="">
                <option value="" disabled>
                  Course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Assignment title" required />
              <input name="due_date" type="date" />
              <input name="description" placeholder="Instructions (optional)" />
              <button type="submit">Create assignment</button>
            </form>
          </section>
        </div>
      )}

      {section === 'notices' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={TEACHER_NAV} id="notices" />
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/teacher/notices', {
                    method: 'POST',
                    body: { title: fd.get('title'), body: fd.get('body') },
                  })
                  toast.success('Notice posted.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <input name="title" placeholder="Title" required />
              <textarea name="body" rows={4} placeholder="Message to students" required />
              <button type="submit">Publish</button>
            </form>
          </section>
        </div>
      )}

    </>
  )
}

const STUDENT_MAP = [
  { id: 'timetable', label: 'See your weekly timetable' },
  { id: 'notes', label: 'Download study materials' },
  { id: 'assignments', label: 'Check assignments & due dates' },
  { id: 'fees', label: 'Pay fees when you have an invoice' },
  { id: 'marks', label: 'View your scores' },
  { id: 'certificates', label: 'Get certificates' },
  { id: 'notices', label: 'Read announcements' },
  { id: 'profile', label: 'Keep your profile up to date' },
]

export function StudentPanel({ section, onNavigate }) {
  const toast = useToast()
  const { user, refreshUser } = useAuth()
  const [timetable, setTimetable] = useState([])
  const [notes, setNotes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [certs, setCerts] = useState([])
  const [marks, setMarks] = useState([])
  const [notices, setNotices] = useState([])

  const load = useCallback(async () => {
    const [tt, n, a, inv, pay, c, m, no] = await Promise.all([
      api('/api/timetable'),
      api('/api/student/notes'),
      api('/api/student/assignments'),
      api('/api/student/invoices'),
      api('/api/student/payments'),
      api('/api/student/certificates'),
      api('/api/student/marks'),
      api('/api/notices'),
    ])
    setTimetable(tt)
    setNotes(n)
    setAssignments(a)
    setInvoices(inv)
    setPayments(pay)
    setCerts(c)
    setMarks(m)
    setNotices(no)
  }, [])

  useEffect(() => {
    load().catch((e) => toast.error(e.message))
  }, [load, toast])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      {section === 'home' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="home" />
            <p className="panel-aside">Your menu is on the left. Below is a quick map of what each area is for.</p>
            <ul className="link-grid">
              {STUDENT_MAP.map((item) => (
                <li key={item.id}>
                  <button type="button" className="link-tile" onClick={() => onNavigate(item.id)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {section === 'timetable' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="timetable" />
            {timetable.length === 0 ? (
              <EmptyHint hint="When your batch has a timetable, rows will show here." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((row) => (
                    <tr key={row.id}>
                      <td>{days[row.day_of_week]}</td>
                      <td>
                        {row.start_time}–{row.end_time}
                      </td>
                      <td>{row.subject}</td>
                      <td>{row.Batch?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {section === 'notes' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="notes" />
            {notes.length === 0 ? (
              <EmptyHint hint="Teachers upload files per course; they will list here." />
            ) : (
              <ul className="list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <strong>{n.title}</strong> <span className="muted">({n.Course?.name})</span>
                    <button
                      type="button"
                      className="link"
                      onClick={() => downloadBlob(`/api/download/note/${n.id}`, n.file_name)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'assignments' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="assignments" />
            {assignments.length === 0 ? (
              <EmptyHint hint="New work from your teachers will appear here with due dates." />
            ) : (
              <ul className="list">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    <div className="muted small">
                      Due: {a.due_date || '—'} · {a.Course?.name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'fees' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="fees" />
            <p className="panel-aside">Demo only: Pay now simulates a successful card payment.</p>
            {invoices.length === 0 ? (
              <EmptyHint hint="Your institute will create invoices; pending ones show Pay now." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td>{i.Course?.name}</td>
                      <td>{i.amount}</td>
                      <td>{i.status}</td>
                      <td>
                        {i.status === 'pending' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api('/api/student/pay', {
                                  method: 'POST',
                                  body: { invoice_id: i.id, payment_method: 'demo_card' },
                                })
                                load()
                                toast.success('Payment recorded.')
                              } catch (ex) {
                                toast.error(ex.message)
                              }
                            }}
                          >
                            Pay now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <h3 className="panel-subtitle">Payment history</h3>
            {payments.length === 0 ? (
              <EmptyHint title="No receipts yet" hint="After you pay an invoice, a receipt line appears here." />
            ) : (
              <ul className="list">
                {payments.map((p) => (
                  <li key={p.id}>
                    Receipt <strong>{p.receipt_number}</strong> — {p.amount} — {p.paid_at?.slice?.(0, 10)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'marks' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="marks" />
            {marks.length === 0 ? (
              <EmptyHint hint="Teachers add marks per course; they will show in this table." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Exam</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((m) => (
                    <tr key={m.id}>
                      <td>{m.Course?.name}</td>
                      <td>{m.exam_title}</td>
                      <td>
                        {m.score} / {m.max_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {section === 'certificates' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="certificates" />
            {certs.length === 0 ? (
              <EmptyHint hint="The office can upload certificates for you to download anytime." />
            ) : (
              <ul className="list">
                {certs.map((c) => (
                  <li key={c.id}>
                    {c.title}
                    <button
                      type="button"
                      className="link"
                      onClick={() => downloadBlob(`/api/download/certificate/${c.id}`, c.file_name)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'notices' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="notices" />
            {notices.length === 0 ? (
              <EmptyHint hint="Important messages from your institute show up here." />
            ) : (
              <ul className="list">
                {notices.map((n) => (
                  <li key={n.id}>
                    <strong>{n.title}</strong>
                    <div className="muted small">{n.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {section === 'profile' && (
        <div className="grid">
          <section className="panel">
            <PanelHead nav={STUDENT_NAV} id="profile" />
            <form
              key={user?.id}
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                try {
                  await api('/api/auth/me', {
                    method: 'PATCH',
                    body: { name: fd.get('name'), phone: fd.get('phone') },
                  })
                  await refreshUser()
                  toast.success('Profile updated.')
                } catch (ex) {
                  toast.error(ex.message)
                }
              }}
            >
              <input name="name" placeholder="Full name" required defaultValue={user?.name || ''} />
              <input name="phone" placeholder="Phone number" defaultValue={user?.phone || ''} />
              <button type="submit">Save changes</button>
            </form>
          </section>
        </div>
      )}

    </>
  )
}
