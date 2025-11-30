# Attendance & Academics Management System

A comprehensive full-stack application for educational institutions to manage students, track attendance, and record grades. This system features Role-Based Access Control (RBAC), interactive analytics, and data export capabilities.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## 🚀 Features

### Core Functionality
- **Student Management**: Complete CRUD operations for student records.
- **Attendance Tracking**: 
  - Daily attendance marking.
  - Bulk attendance entry for entire classes.
  - Historical views and editing capabilities.
- **Grade Management**: 
  - Record scores for assignments and exams.
  - Automatic percentage calculations.
  - Progress tracking.

### Analytics & Reporting
- **Interactive Dashboard**: Visual charts for attendance trends and grade performance.
- **Filtering**: Analyze data by date range and subject.
- **Data Export**: Download Students, Attendance, and Grades data as CSV files.

### Security & Access Control
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, user management.
  - **Teacher**: Manage students, attendance, and grades.
  - **Viewer**: Read-only access to data and analytics.
- **Secure Authentication**: JWT-based login system.

## 🛠️ Technology Stack

- **Backend**: Python, Flask, SQLAlchemy, SQLite (Development)
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios
- **Authentication**: PyJWT

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
# Navigate to the project root
cd Attendance-Academics-App-main

# Install Python dependencies
pip install flask flask-cors flask-sqlalchemy psycopg2-binary pyjwt werkzeug requests

# Run the backend server
python backend/app.py
```
*The backend server will start on `http://127.0.0.1:5002`*

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Run the development server
npm run dev
```
*The frontend application will be available at `http://localhost:5173`*

## 🔑 Default Credentials

Use the following accounts to test different permission levels:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | `admin` | `admin123` | Full Access (User Management) |
| **Teacher** | `teacher` | `teacher123` | Manage Data (Students, Attendance, Grades) |
| **Viewer** | `viewer` | `viewer123` | Read-Only View |

## 📁 Project Structure

```
├── backend/
│   ├── app.py           # Main application entry point & API routes
│   ├── auth.py          # Authentication logic & decorators
│   ├── config.py        # App configuration
│   ├── database.py      # DB instance
│   └── models.py        # SQLAlchemy database models
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components (Dashboard, Students, etc.)
│   │   ├── services/    # API integration services
│   │   └── App.jsx      # Main frontend routing
│   └── vite.config.js   # Vite configuration
│
└── README.md            # Project documentation
```

## 🧪 Verification

A verification script is included to test the backend API endpoints:
```bash
python backend/verify_api.py
```

## 📄 License

This project is open-source and available for educational purposes.
