class SessionManager {
  constructor() {
    this.SESSION_KEY = "auth_session"
    this.USER_KEY = "auth_user"
    this.TOKEN_KEY = "token"
  }

  async setSession(sessionData) {
    const { user, sessionId, expiresAt } = sessionData
    const expires = expiresAt || Date.now() + 24 * 60 * 60 * 1000

    try {
      sessionStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify({
          user: user ? { id: user.id, username: user.username, privileges: user.privileges, roles: user.roles } : null,
          expiresAt: expires,
          createdAt: Date.now(),
        })
      )
      if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user))
      if (sessionId) localStorage.setItem(this.TOKEN_KEY, sessionId)
    } catch (e) {
      console.error("Failed to save session:", e)
      throw new Error("无法保存登录信息")
    }
  }

  async getSession() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY)
      if (!raw) return null
      const session = JSON.parse(raw)
      if (Date.now() > session.expiresAt) {
        this.clearSession()
        return null
      }
      return session
    } catch (e) {
      return null
    }
  }

  getSessionId() {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  }

  async hasValidSession() {
    const session = await this.getSession()
    return !!session && Date.now() < session.expiresAt
  }

  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.USER_KEY)
    localStorage.removeItem(this.TOKEN_KEY)
  }
}

export default new SessionManager()
