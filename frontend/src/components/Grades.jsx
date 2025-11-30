import React, { useState, useEffect } from 'react';
import { studentAPI, gradesAPI } from '../services/api';
import AuthService from '../services/auth';

const Grades = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  const [gradeData, setGradeData] = useState({
    subject: '',
    assignment: '',
    score: '',
    max_score: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [gradesHistory, setGradesHistory] = useState([]);
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

  const loadGradesHistory = async (studentId) => {
    try {
      const response = await gradesAPI.getByStudent(studentId);
      setGradesHistory(response.data);
    } catch (error) {
      console.error('Error loading grades history:', error);
    }
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
    if (studentId) {
      loadGradesHistory(studentId);
    } else {
      setGradesHistory([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (editingGrade) {
      try {
        await gradesAPI.update(editingGrade.id, gradeData);
        setEditingGrade(null);
        setGradeData({
          subject: '',
          assignment: '',
          score: '',
          max_score: '',
          date: new Date().toISOString().split('T')[0]
        });
        if (selectedStudent) loadGradesHistory(selectedStudent);
      } catch (error) {
        setError(error.response?.data?.message || 'Error updating grade');
      }
      return;
    }
    
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    try {
      await gradesAPI.add({
        student_id: selectedStudent,
        ...gradeData
      });
      setGradeData({
        subject: '',
        assignment: '',
        score: '',
        max_score: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadGradesHistory(selectedStudent);
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding grade');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setGradeData({
      subject: grade.subject,
      assignment: grade.assignment,
      score: grade.score,
      max_score: grade.max_score,
      date: grade.date
    });
    setSelectedStudent('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await gradesAPI.delete(id);
        if (selectedStudent) loadGradesHistory(selectedStudent);
      } catch (error) {
        alert('Error deleting grade');
      }
    }
  };

  const canManage = AuthService.hasPermission('manage_grades');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Grades Management</h2>

      {canManage && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingGrade ? 'Edit Grade' : 'Add Grade'}
          </h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editingGrade && (
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
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={gradeData.subject}
                onChange={(e) => setGradeData({...gradeData, subject: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
              <input
                type="text"
                value={gradeData.assignment}
                onChange={(e) => setGradeData({...gradeData, assignment: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Midterm Exam"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Score</label>
              <input
                type="number"
                step="0.01"
                value={gradeData.score}
                onChange={(e) => setGradeData({...gradeData, score: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
              <input
                type="number"
                step="0.01"
                value={gradeData.max_score}
                onChange={(e) => setGradeData({...gradeData, max_score: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={gradeData.date}
                onChange={(e) => setGradeData({...gradeData, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2 flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingGrade ? 'Update Grade' : 'Add Grade'}
              </button>
              {editingGrade && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGrade(null);
                    setGradeData({
                      subject: '',
                      assignment: '',
                      score: '',
                      max_score: '',
                      date: new Date().toISOString().split('T')[0]
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
      )}

      {selectedStudent && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Grades History</h3>
          {gradesHistory.length === 0 ? (
            <p className="text-gray-500">No grades found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    {canManage && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gradesHistory.map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.assignment}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grade.score} / {grade.max_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          grade.percentage >= 90 ? 'bg-green-100 text-green-800' :
                          grade.percentage >= 70 ? 'bg-blue-100 text-blue-800' :
                          grade.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.percentage}%
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(grade)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(grade.id)}
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

export default Grades;
