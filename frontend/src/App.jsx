import React, { useState, useEffect } from 'react';
import AuthService from './services/auth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Attendance from './components/Attendance';
import Grades from './components/Grades';
import UserManagement from './components/UserManagement';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      setCurrentUser(AuthService.getUser());
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'attendance':
        return <Attendance />;
      case 'grades':
        return <Grades />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  const NavButton = ({ page, icon, label, requiredPermission }) => {
    if (requiredPermission && !AuthService.hasPermission(requiredPermission)) {
      return null;
    }

    return (
      <button
        onClick={() => setCurrentPage(page)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          currentPage === page
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">Attendance & Academics</h1>
              <div className="hidden md:flex space-x-2">
                <NavButton page="dashboard" icon="📊" label="Dashboard" requiredPermission="view_analytics" />
                <NavButton page="students" icon="👥" label="Students" requiredPermission="view_data" />
                <NavButton page="attendance" icon="📝" label="Attendance" requiredPermission="view_data" />
                <NavButton page="grades" icon="📚" label="Grades" requiredPermission="view_data" />
                <NavButton page="users" icon="⚙️" label="Users" requiredPermission="admin" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-700">{currentUser.username}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:hidden bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            <NavButton page="dashboard" icon="📊" label="Dashboard" requiredPermission="view_analytics" />
            <NavButton page="students" icon="👥" label="Students" requiredPermission="view_data" />
            <NavButton page="attendance" icon="📝" label="Attendance" requiredPermission="view_data" />
            <NavButton page="grades" icon="📚" label="Grades" requiredPermission="view_data" />
            <NavButton page="users" icon="⚙️" label="Users" requiredPermission="admin" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
