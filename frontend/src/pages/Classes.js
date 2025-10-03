import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { classService, userService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningClass, setAssigningClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newClass, setNewClass] = useState({
    class_name: '',
    faculty: user.faculty || 'ICT',
    total_registered_students: 30,
    description: ''
  });

  const [editClass, setEditClass] = useState({
    class_name: '',
    faculty: '',
    total_registered_students: 0,
    description: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classesResponse = await classService.getAll();
      const usersResponse = await userService.getAll();
      
      setClasses(classesResponse.data.data || []);
      
      // Filter lecturers only
      const lecturersList = usersResponse.data.data.filter(u => u.role === 'lecturer');
      setLecturers(lecturersList);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error loading data: ' + (error.response?.data?.message || error.message) 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      // 🔥 FIXED: Ensure description is sent properly
      const classData = {
        ...newClass,
        description: newClass.description || null
      };
      
      await classService.create(classData);
      setMessage({ type: 'success', text: 'Class created successfully!' });
      setShowCreateForm(false);
      setNewClass({ 
        class_name: '', 
        faculty: user.faculty || 'ICT', 
        total_registered_students: 30, 
        description: '' 
      });
      fetchData();
    } catch (error) {
      console.error('Create class error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error creating class: ' + (error.response?.data?.message || error.message || 'Unknown error') 
      });
    }
  };

  const handleAssignLecturer = async (classId, lecturerId) => {
    try {
      console.log('Assigning lecturer to class:', { classId, lecturerId });
      
      if (!lecturerId) {
        setMessage({ type: 'error', text: 'Please select a lecturer' });
        return;
      }

      const response = await classService.assignLecturer(classId, { lecturer_id: lecturerId });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Lecturer assigned to class successfully!' });
        setAssigningClass(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning lecturer to class:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Unknown error occurred';
      
      setMessage({ 
        type: 'error', 
        text: `Error assigning lecturer: ${errorMessage}` 
      });
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    try {
      // 🔥 FIXED: Ensure description is sent properly
      const classData = {
        ...editClass,
        description: editClass.description || null
      };
      
      await classService.update(editingClass.id, classData);
      setMessage({ type: 'success', text: 'Class updated successfully!' });
      setEditingClass(null);
      fetchData();
    } catch (error) {
      console.error('Error updating class:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error updating class: ' + (error.response?.data?.message || error.message) 
      });
    }
  };

  const startEditClass = (classItem) => {
    setEditingClass(classItem);
    setEditClass({
      class_name: classItem.class_name,
      faculty: classItem.faculty,
      total_registered_students: classItem.total_registered_students,
      description: classItem.description || '',
      active: classItem.active !== undefined ? classItem.active : true
    });
  };

  const handleDeleteClass = async (classId, className) => {
    if (window.confirm(`Are you sure you want to delete class: ${className}?`)) {
      try {
        await classService.delete(classId);
        setMessage({ type: 'success', text: 'Class deleted successfully!' });
        fetchData();
      } catch (error) {
        console.error('Error deleting class:', error);
        setMessage({ 
          type: 'error', 
          text: 'Error deleting class: ' + (error.response?.data?.message || error.message) 
        });
      }
    }
  };

  const handleToggleClassStatus = async (classId, currentStatus) => {
    try {
      await classService.update(classId, { active: !currentStatus });
      setMessage({ type: 'success', text: `Class ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
      fetchData();
    } catch (error) {
      console.error('Error updating class status:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error updating class status: ' + (error.response?.data?.message || error.message) 
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Classes Management</h1>
        {user.role === 'program_leader' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create New Class'}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* Create Class Form */}
      {showCreateForm && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>Create New Class</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateClass}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newClass.class_name}
                    onChange={(e) => setNewClass({...newClass, class_name: e.target.value})}
                    required
                    placeholder="e.g., BIT-3A, DIT-2B"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={newClass.faculty}
                    onChange={(e) => setNewClass({...newClass, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Registered Students *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newClass.total_registered_students}
                    onChange={(e) => setNewClass({...newClass, total_registered_students: parseInt(e.target.value) || 0})}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  placeholder="Class description..."
                />
              </div>
              <button type="submit" className="btn btn-success">Create Class</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Form */}
      {editingClass && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #007bff' }}>
          <div className="card-header" style={{ background: '#007bff' }}>
            <h3 style={{ margin: 0, color: 'white' }}>Edit Class</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleEditClass}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editClass.class_name}
                    onChange={(e) => setEditClass({...editClass, class_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={editClass.faculty}
                    onChange={(e) => setEditClass({...editClass, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Students *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editClass.total_registered_students}
                    onChange={(e) => setEditClass({...editClass, total_registered_students: parseInt(e.target.value) || 0})}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={editClass.description}
                  onChange={(e) => setEditClass({...editClass, description: e.target.value})}
                />
              </div>
              <div className="form-group form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={editClass.active}
                  onChange={(e) => setEditClass({...editClass, active: e.target.checked})}
                />
                <label className="form-check-label">Active Class</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-success">Update Class</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditingClass(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>
            {user.role === 'lecturer' ? 'My Classes' : 'All Classes'} ({classes.length})
          </h3>
        </div>
        <div className="card-body">
          {classes.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Faculty</th>
                    <th>Total Students</th>
                    <th>Assigned Lecturer</th>
                    <th>Status</th>
                    {user.role === 'program_leader' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {classes.map(classItem => (
                    <tr key={classItem.id}>
                      <td><strong>{classItem.class_name}</strong></td>
                      <td>{classItem.faculty}</td>
                      <td>{classItem.total_registered_students}</td>
                      <td>
                        {classItem.lecturer_name ? (
                          `${classItem.lecturer_first_name} ${classItem.lecturer_last_name}`
                        ) : (
                          <span style={{ color: '#e67e22' }}>Not Assigned</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: classItem.active ? '#28a745' : '#dc3545',
                          color: 'white'
                        }}>
                          {classItem.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {user.role === 'program_leader' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {assigningClass === classItem.id ? (
                              <div>
                                <select
                                  className="form-select form-select-sm"
                                  onChange={(e) => handleAssignLecturer(classItem.id, e.target.value)}
                                  style={{ marginBottom: '0.5rem', width: '150px' }}
                                >
                                  <option value="">Select Lecturer</option>
                                  {lecturers.map(lecturer => (
                                    <option key={lecturer.id} value={lecturer.id}>
                                      {lecturer.first_name} {lecturer.last_name}
                                    </option>
                                  ))}
                                </select>
                                <button 
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setAssigningClass(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => setAssigningClass(classItem.id)}
                                title="Assign Lecturer"
                              >
                                Assign Lecturer
                              </button>
                            )}
                            
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => startEditClass(classItem)}
                              title="Edit Class"
                            >
                              Edit
                            </button>
                            
                            <button 
                              className={`btn btn-sm ${classItem.active ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleClassStatus(classItem.id, classItem.active)}
                              title={classItem.active ? 'Deactivate Class' : 'Activate Class'}
                            >
                              {classItem.active ? 'Deactivate' : 'Activate'}
                            </button>
                            
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteClass(classItem.id, classItem.class_name)}
                              title="Delete Class"
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
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No classes found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;