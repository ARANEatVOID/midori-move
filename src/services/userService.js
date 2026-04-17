const USERS_STORAGE_KEY = 'midoriMove_users'
const LEGACY_USER_STORAGE_KEY = 'midoriMove_user'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeUser(user) {
  if (!user) return null

  return {
    id: user.id || generateUserId(),
    name: user.name || '',
    email: user.email || '',
    password: user.password || '',
    country: user.country || 'DEFAULT',
    homeAddress: user.homeAddress || '',
    profilePicture: user.profilePicture || '',
  }
}

function getAllUsers() {
  const users = readJson(USERS_STORAGE_KEY, [])
  if (Array.isArray(users) && users.length > 0) {
    return users.map(normalizeUser)
  }

  const legacyUser = normalizeUser(readJson(LEGACY_USER_STORAGE_KEY, null))
  if (!legacyUser) {
    return []
  }

  writeUsers([legacyUser])
  return [legacyUser]
}

function saveUser(user) {
  const normalizedUser = normalizeUser(user)
  const users = getAllUsers()
  const existingIndex = users.findIndex((existingUser) => existingUser.id === normalizedUser.id)

  if (existingIndex >= 0) {
    users.splice(existingIndex, 1, normalizedUser)
  } else {
    users.push(normalizedUser)
  }

  writeUsers(users)
  return normalizedUser
}

function findUserByCredentials(name, password) {
  const enteredName = String(name || '').trim().toLowerCase()
  const enteredPassword = String(password || '')

  return getAllUsers().find((user) => {
    return (
      String(user.name || '').trim().toLowerCase() === enteredName &&
      String(user.password || '') === enteredPassword
    )
  }) || null
}

function getUserById(userId) {
  if (!userId) return null
  return getAllUsers().find((user) => user.id === userId) || null
}

export { findUserByCredentials, getAllUsers, getUserById, saveUser }
