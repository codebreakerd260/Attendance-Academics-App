import React, { useState, useEffect } from 'react';
import { analyticsAPI, exportAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AuthService from '../services/auth';

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    subject: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const params = {};
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.subject) params.subject = filters.subject;

      const [attendanceRes, gradesRes] = await Promise.all([
        analyticsAPI.attendanceSummary(params),
        analyticsAPI.gradesSummary(params)
      ]);
      setAttendanceData(attendanceRes.data);
      setGradesData(gradesRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleApplyFilters = () => {
    setLoading(true);
    loadAnalytics();
  };

  const handleExport = async (type) => {
    try {
      let response;
      switch (type) {
        case 'students':
          response = await exportAPI.students();
          break;
        case 'attendance':
          response = await exportAPI.attendance();
          break;
        case 'grades':
          response = await exportAPI.grades();
          break;
        default:
          return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('students')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            Export Students
          </button>
          <button
            onClick={() => handleExport('attendance')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Export Attendance
          </button>
          <button
            onClick={() => handleExport('grades')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
          >
            Export Grades
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by subject"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
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
