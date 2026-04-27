const base = import.meta.env.VITE_API_URL || ''

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(t) {
  if (t) localStorage.setItem('token', t)
  else localStorage.removeItem('token')
}

export async function api(path, options = {}) {
  const headers = { ...options.headers }
  const body = options.body
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options = { ...options, body: JSON.stringify(body) }
  }
  const t = getToken()
  if (t) headers.Authorization = `Bearer ${t}`

  const res = await fetch(`${base}${path}`, { ...options, headers })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function downloadBlob(path, filename) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Download failed')
  }
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename || 'file'
  a.click()
  URL.revokeObjectURL(href)
}
