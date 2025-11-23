class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  hasPermission(permission) {
    if (!this.user) return false;
    if (this.user.role === 'admin') return true;
    return this.user.permissions?.includes(permission) || false;
  }

  isAdmin() {
    return this.user?.role === 'admin';
  }

  isTeacher() {
    return this.user?.role === 'teacher' || this.user?.role === 'admin';
  }
}

export default new AuthService();
