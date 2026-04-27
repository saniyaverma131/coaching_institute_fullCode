import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { api, downloadBlob } from '../api'

function Notifications({ items, onRead }) {
  if (!items?.length) return <p className="muted">No notifications.</p>
  return (
    <ul className="list">
      {items.map((n) => (
        <li key={n.id} className={n.is_read ? '' : 'unread'}>
          <strong>{n.title}</strong>
          {n.body && <div className="muted small">{n.body}</div>}
          {!n.is_read && (
            <button type="button" className="link" onClick={() => onRead(n.id)}>
              Mark read
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function AdminPanel() {
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [invoices, setInvoices] = useState([])
  const [msg, setMsg] = useState('')
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
    load().catch((e) => setMsg(e.message))
  }, [load])

  return (
    <div className="grid">
      <section className="panel">
        <h2>Users (manage teachers & students)</h2>
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
              setMsg(ex.message)
            }
          }}
        >
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="phone" placeholder="Phone" />
          <input name="password" type="password" placeholder="Password" required />
          <select name="role" required defaultValue="student">
            <option value="student">student</option>
            <option value="teacher">teacher</option>
          </select>
          <button type="submit">Add user</button>
        </form>
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
      </section>

      <section className="panel">
        <h2>Courses</h2>
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
              setMsg(ex.message)
            }
          }}
        >
          <input name="name" placeholder="Course name" required />
          <input name="duration_text" placeholder="Duration" />
          <input name="fee_amount" type="number" placeholder="Fee" />
          <input name="description" placeholder="Description" />
          <button type="submit">Add course</button>
        </form>
      </section>

      <section className="panel">
        <h2>Batches & enrollment</h2>
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
              setMsg(ex.message)
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
          <input name="name" placeholder="Batch name" required />
          <input name="schedule_text" placeholder="Schedule summary" />
          <input name="capacity" type="number" placeholder="Capacity" />
          <button type="submit">Create batch</button>
        </form>
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
              setMsg('Enrolled.')
              load()
            } catch (ex) {
              setMsg(ex.message)
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
          <button type="submit">Enroll</button>
        </form>
      </section>

      <section className="panel">
        <h2>Timetable (admin)</h2>
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
              setMsg('Timetable row added.')
            } catch (ex) {
              setMsg(ex.message)
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
          <input name="room" placeholder="Room" />
          <button type="submit">Add slot</button>
        </form>
      </section>

      <section className="panel">
        <h2>Fee invoices</h2>
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
            } catch (ex) {
              setMsg(ex.message)
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
      </section>

      <section className="panel">
        <h2>Notice (broadcast)</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target)
            try {
              await api('/api/admin/notices', {
                method: 'POST',
                body: { title: fd.get('title'), body: fd.get('body') },
              })
              setMsg('Notice posted.')
            } catch (ex) {
              setMsg(ex.message)
            }
          }}
        >
          <input name="title" placeholder="Title" required />
          <textarea name="body" rows={3} placeholder="Message" required />
          <button type="submit">Publish</button>
        </form>
      </section>

      <section className="panel">
        <h2>Certificate upload</h2>
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
              setMsg('Certificate uploaded.')
            } catch (ex) {
              setMsg(ex.message)
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
          <button type="submit">Upload</button>
        </form>
      </section>

      {msg && <div className="banner">{msg}</div>}
    </div>
  )
}

function TeacherPanel() {
  const [batches, setBatches] = useState([])
  const [notes, setNotes] = useState([])
  const [students, setStudents] = useState([])
  const [selBatch, setSelBatch] = useState('')
  const [courses, setCourses] = useState([])
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const [b, n, c] = await Promise.all([api('/api/batches'), api('/api/teacher/notes'), api('/api/courses')])
    setBatches(b)
    setNotes(n)
    setCourses(c)
  }, [])
  useEffect(() => {
    load().catch((e) => setMsg(e.message))
  }, [load])
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
    <div className="grid">
      <section className="panel">
        <h2>Upload notes</h2>
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
            } catch (ex) {
              setMsg(ex.message)
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
          <input name="title" placeholder="Title" required />
          <input name="file" type="file" required />
          <button type="submit">Upload</button>
        </form>
        <ul className="list">
          {notes.map((n) => (
            <li key={n.id}>
              {n.title} — {n.Course?.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Attendance</h2>
        <select value={selBatch} onChange={(e) => setSelBatch(e.target.value)}>
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
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
              setMsg('Attendance saved.')
            } catch (ex) {
              setMsg(ex.message)
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
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="late">late</option>
          </select>
          <button type="submit" disabled={!selBatch}>
            Save
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Marks</h2>
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
              setMsg('Mark recorded.')
            } catch (ex) {
              setMsg(ex.message)
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
          <input name="exam_title" placeholder="Exam / assignment" required />
          <input name="score" type="number" step="0.01" required />
          <input name="max_score" type="number" step="0.01" placeholder="Max" />
          <button type="submit">Save mark</button>
        </form>
      </section>

      <section className="panel">
        <h2>Assignments</h2>
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
              setMsg('Assignment created.')
            } catch (ex) {
              setMsg(ex.message)
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
          <input name="title" placeholder="Title" required />
          <input name="due_date" type="date" />
          <input name="description" placeholder="Description" />
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <h2>Teacher notice</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target)
            try {
              await api('/api/teacher/notices', {
                method: 'POST',
                body: { title: fd.get('title'), body: fd.get('body') },
              })
              setMsg('Notice posted.')
            } catch (ex) {
              setMsg(ex.message)
            }
          }}
        >
          <input name="title" required />
          <textarea name="body" rows={3} required />
          <button type="submit">Publish</button>
        </form>
      </section>

      {msg && <div className="banner">{msg}</div>}
    </div>
  )
}

function StudentPanel() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState('timetable')
  const [timetable, setTimetable] = useState([])
  const [notes, setNotes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [certs, setCerts] = useState([])
  const [marks, setMarks] = useState([])
  const [notices, setNotices] = useState([])
  const [msg, setMsg] = useState('')

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
    load().catch((e) => setMsg(e.message))
  }, [load])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="tabs">
        {['timetable', 'notes', 'assignments', 'fees', 'marks', 'certificates', 'notices', 'profile'].map(
          (t) => (
            <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          )
        )}
      </div>
      {msg && <div className="banner">{msg}</div>}

      {tab === 'timetable' && (
        <section className="panel">
          <h2>Timetable</h2>
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
        </section>
      )}

      {tab === 'notes' && (
        <section className="panel">
          <h2>Study notes</h2>
          <ul className="list">
            {notes.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong> ({n.Course?.name})
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
        </section>
      )}

      {tab === 'assignments' && (
        <section className="panel">
          <h2>Assignments</h2>
          <ul className="list">
            {assignments.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong> — due {a.due_date || '—'} — {a.Course?.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'fees' && (
        <section className="panel">
          <h2>Invoices & pay (demo online payment)</h2>
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
                          } catch (ex) {
                            setMsg(ex.message)
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
          <h3>Payment history / receipts</h3>
          <ul className="list">
            {payments.map((p) => (
              <li key={p.id}>
                Receipt <strong>{p.receipt_number}</strong> — {p.amount} — {p.paid_at?.slice?.(0, 10)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'marks' && (
        <section className="panel">
          <h2>Marks</h2>
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
        </section>
      )}

      {tab === 'certificates' && (
        <section className="panel">
          <h2>Certificates</h2>
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
        </section>
      )}

      {tab === 'notices' && (
        <section className="panel">
          <h2>Notices</h2>
          <ul className="list">
            {notices.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong>
                <div className="muted small">{n.body}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'profile' && (
        <section className="panel">
          <h2>Update profile</h2>
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
                setMsg('Profile updated.')
              } catch (ex) {
                setMsg(ex.message)
              }
            }}
          >
            <input name="name" placeholder="Name" required defaultValue={user?.name || ''} />
            <input name="phone" placeholder="Phone" defaultValue={user?.phone || ''} />
            <button type="submit">Save</button>
          </form>
        </section>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    api('/api/notifications')
      .then(setNotifications)
      .catch(() => {})
  }, [user])

  async function markRead(id) {
    await api(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>Smart Coaching Institute</h1>
          <p className="muted">
            {user?.name} · <span className="role">{user?.role}</span>
          </p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            logout()
            nav('/login', { replace: true })
          }}
        >
          Logout
        </button>
      </header>

      <section className="panel">
        <h2>Notifications</h2>
        <Notifications items={notifications} onRead={markRead} />
      </section>

      {user?.role === 'admin' && <AdminPanel />}
      {user?.role === 'teacher' && <TeacherPanel />}
      {user?.role === 'student' && <StudentPanel />}
    </div>
  )
}
