import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AuthService from '../services/auth';

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [attendanceRes, gradesRes] = await Promise.all([
        analyticsAPI.attendanceSummary(),
        analyticsAPI.gradesSummary()
      ]);
      setAttendanceData(attendanceRes.data);
      setGradesData(gradesRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{attendanceData.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg Attendance</h3>
          <p className="text-3xl font-bold text-green-600">
            {attendanceData.length > 0 
              ? (attendanceData.reduce((sum, s) => sum + s.attendance_rate, 0) / attendanceData.length).toFixed(1)
              : 0}%
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg Grade</h3>
          <p className="text-3xl font-bold text-purple-600">
            {gradesData.length > 0
              ? (gradesData.reduce((sum, s) => sum + s.average_grade, 0) / gradesData.length).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Attendance Rates by Student</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="student_name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendance_rate" fill="#3b82f6" name="Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Grades by Student</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gradesData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="student_name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="average_grade" fill="#8b5cf6" name="Average Grade %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
