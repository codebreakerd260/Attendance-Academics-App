import React, { useState, useEffect } from 'react';
import { studentAPI, attendanceAPI } from '../services/api';
import AuthService from '../services/auth';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    subject: ''
  });
  const [bulkData, setBulkData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    records: []
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
    
    if (editingRecord) {
      try {
        await attendanceAPI.update(editingRecord.id, attendanceData);
        setEditingRecord(null);
        setAttendanceData({
          date: new Date().toISOString().split('T')[0],
          status: 'Present',
          subject: ''
        });
        if (selectedStudent) loadAttendanceHistory(selectedStudent);
      } catch (error) {
        setError(error.response?.data?.message || 'Error updating attendance');
      }
      return;
    }
    
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

  const handleEdit = (record) => {
    setEditingRecord(record);
    setAttendanceData({
      date: record.date,
      status: record.status,
      subject: record.subject
    });
    setSelectedStudent('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceAPI.delete(id);
        if (selectedStudent) loadAttendanceHistory(selectedStudent);
      } catch (error) {
        alert('Error deleting attendance record');
      }
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (bulkData.records.length === 0) {
      setError('Please mark attendance for at least one student');
      return;
    }

    try {
      await attendanceAPI.bulkMark(bulkData);
      setBulkData({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        records: []
      });
      setShowBulkForm(false);
      alert('Bulk attendance marked successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Error marking bulk attendance');
    }
  };

  const toggleBulkStudent = (studentId) => {
    const existing = bulkData.records.find(r => r.student_id === studentId);
    if (existing) {
      setBulkData({
        ...bulkData,
        records: bulkData.records.filter(r => r.student_id !== studentId)
      });
    } else {
      setBulkData({
        ...bulkData,
        records: [...bulkData.records, { student_id: studentId, status: 'Present' }]
      });
    }
  };

  const updateBulkStatus = (studentId, status) => {
    setBulkData({
      ...bulkData,
      records: bulkData.records.map(r =>
        r.student_id === studentId ? { ...r, status } : r
      )
    });
  };

  const canManage = AuthService.hasPermission('manage_attendance');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>

      {canManage && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowBulkForm(false);
                setEditingRecord(null);
                setAttendanceData({
                  date: new Date().toISOString().split('T')[0],
                  status: 'Present',
                  subject: ''
                });
              }}
              className={`px-4 py-2 rounded-lg ${!showBulkForm && !editingRecord ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Single Entry
            </button>
            <button
              onClick={() => {
                setShowBulkForm(true);
                setEditingRecord(null);
                setSelectedStudent('');
              }}
              className={`px-4 py-2 rounded-lg ${showBulkForm ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Bulk Entry
            </button>
          </div>

          {!showBulkForm ? (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">
                {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
              </h3>
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
            <div className="md:col-span-2 flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingRecord ? 'Update Attendance' : 'Mark Attendance'}
              </button>
              {editingRecord && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setAttendanceData({
                      date: new Date().toISOString().split('T')[0],
                      status: 'Present',
                      subject: ''
                    });
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Bulk Mark Attendance</h3>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={bulkData.date}
                      onChange={(e) => setBulkData({...bulkData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={bulkData.subject}
                      onChange={(e) => setBulkData({...bulkData, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {students.map((student) => {
                      const isSelected = bulkData.records.find(r => r.student_id === student.id);
                      const status = isSelected ? isSelected.status : 'Present';
                      return (
                        <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => toggleBulkStudent(student.id)}
                            className="rounded"
                          />
                          <span className="flex-1">{student.student_id} - {student.name}</span>
                          {isSelected && (
                            <select
                              value={status}
                              onChange={(e) => updateBulkStatus(student.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Mark Attendance ({bulkData.records.length} students)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkForm(false);
                      setBulkData({
                        date: new Date().toISOString().split('T')[0],
                        subject: '',
                        records: []
                      });
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
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
                    {canManage && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
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
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
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
