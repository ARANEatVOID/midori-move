// Session management with expiry logic

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function createSession(user) {
  const session = {
    isLoggedIn: true,
    userId: user?.id || '',
    name: user?.name || '',
    loginTime: Date.now(),
  }
  localStorage.setItem('midoriMove_session', JSON.stringify(session))
  return session
}

function getSession() {
  try {
    const sessionRaw = localStorage.getItem('midoriMove_session')
    return sessionRaw ? JSON.parse(sessionRaw) : null
  } catch (error) {
    console.error('Error retrieving session:', error)
    return null
  }
}

function isSessionValid() {
  const session = getSession()

  if (!session?.isLoggedIn) {
    return false
  }

  const currentTime = Date.now()
  const loginTime = session.loginTime || 0
  const elapsedMs = currentTime - loginTime

  if (elapsedMs > SESSION_EXPIRY_MS) {
    clearSession()
    return false
  }

  return true
}

function clearSession() {
  try {
    localStorage.removeItem('midoriMove_session')
  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

function getCurrentUserId() {
  return getSession()?.userId || ''
}

export { createSession, getSession, isSessionValid, clearSession, getCurrentUserId, SESSION_EXPIRY_MS }
