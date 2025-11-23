import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import AuthService from '../services/auth';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    student_id: '',
    name: '',
    email: '',
    class_name: ''
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingStudent) {
        await studentAPI.update(editingStudent.id, newStudent);
        setEditingStudent(null);
      } else {
        await studentAPI.create(newStudent);
      }
      setNewStudent({ student_id: '', name: '', email: '', class_name: '' });
      setShowForm(false);
      loadStudents();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving student');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setNewStudent({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      class_name: student.class_name
    });
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
    setNewStudent({ student_id: '', name: '', email: '', class_name: '' });
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.delete(id);
        loadStudents();
      } catch (error) {
        alert('Error deleting student');
      }
    }
  };

  const canManage = AuthService.hasPermission('manage_students');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Students</h2>
        {canManage && (
          <button
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
                setEditingStudent(null);
                setNewStudent({ student_id: '', name: '', email: '', class_name: '' });
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Student'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input
                type="text"
                value={newStudent.student_id}
                onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!editingStudent}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <input
                type="text"
                value={newStudent.class_name}
                onChange={(e) => setNewStudent({...newStudent, class_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingStudent ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class_name}</td>
                {canManage && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
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
    </div>
  );
};

export default Students;
