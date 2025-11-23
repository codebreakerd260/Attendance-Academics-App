import React, { useState, useEffect } from 'react';
import { studentAPI, attendanceAPI } from '../services/api';
import AuthService from '../services/auth';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    subject: ''
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await studentAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAttendanceHistory = async (studentId) => {
    try {
      const response = await attendanceAPI.getByStudent(studentId);
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    if (studentId) {
      loadAttendanceHistory(studentId);
    } else {
      setAttendanceHistory([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    try {
      await attendanceAPI.mark({
        student_id: selectedStudent,
        ...attendanceData
      });
      setAttendanceData({
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        subject: ''
      });
      loadAttendanceHistory(selectedStudent);
    } catch (error) {
      setError(error.response?.data?.message || 'Error marking attendance');
    }
  };

  const canManage = AuthService.hasPermission('manage_attendance');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>

      {canManage && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Mark Attendance</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_id} - {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={attendanceData.date}
                onChange={(e) => setAttendanceData({...attendanceData, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={attendanceData.status}
                onChange={(e) => setAttendanceData({...attendanceData, status: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={attendanceData.subject}
                onChange={(e) => setAttendanceData({...attendanceData, subject: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Mark Attendance
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedStudent && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Attendance History</h3>
          {attendanceHistory.length === 0 ? (
            <p className="text-gray-500">No attendance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' :
                          record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
