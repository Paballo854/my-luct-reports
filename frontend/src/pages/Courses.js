import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { courseService, userService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar'; // Add import
import { exportCoursesToExcel } from '../utils/excelExport'; // Add import

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]); // Add filtered state
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    faculty: user.faculty || 'ICT',
    description: ''
  });

  const [editCourse, setEditCourse] = useState({
    course_code: '',
    course_name: '',
    faculty: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesResponse = await courseService.getAll();
      const usersResponse = await userService.getAll();
      
      const coursesData = coursesResponse.data.data || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData); // Initialize filtered courses
      
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

  // 🔥 NEW: Handle search
  const handleSearch = (filteredData) => {
    setFilteredCourses(filteredData);
  };

  // 🔥 NEW: Export to Excel
  const handleExportToExcel = () => {
    try {
      exportCoursesToExcel(filteredCourses);
      setMessage({ type: 'success', text: 'Courses exported to Excel successfully!' });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setMessage({ type: 'error', text: 'Error exporting to Excel' });
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await courseService.create(newCourse);
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setShowCreateForm(false);
      setNewCourse({ course_code: '', course_name: '', faculty: user.faculty || 'ICT', description: '' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating course: ' + error.response?.data?.message });
    }
  };

  const handleAssignLecturer = async (courseId, lecturerId) => {
    try {
      await courseService.assignLecturer(courseId, { lecturer_id: lecturerId });
      setMessage({ type: 'success', text: 'Lecturer assigned successfully!' });
      setAssigningCourse(null);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error assigning lecturer: ' + error.response?.data?.message });
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      await courseService.update(editingCourse.id, editCourse);
      setMessage({ type: 'success', text: 'Course updated successfully!' });
      setEditingCourse(null);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating course: ' + error.response?.data?.message });
    }
  };

  const startEditCourse = (course) => {
    setEditingCourse(course);
    setEditCourse({
      course_code: course.course_code,
      course_name: course.course_name,
      faculty: course.faculty,
      description: course.description || '',
      active: course.active
    });
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      await courseService.update(courseId, { active: !currentStatus });
      setMessage({ type: 'success', text: `Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating course status: ' + error.response?.data?.message });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Courses Management</h1>
        {user.role === 'program_leader' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* 🔥 NEW: Export to Excel button */}
            <button 
              className="btn btn-success"
              onClick={handleExportToExcel}
              disabled={filteredCourses.length === 0}
            >
              <i className="fas fa-file-excel" style={{ marginRight: '0.5rem' }}></i>
              Export to Excel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Add New Course'}
            </button>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* 🔥 NEW: Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <SearchBar
            data={courses}
            searchFields={['course_code', 'course_name', 'faculty', 'lecturer_name']}
            onSearch={handleSearch}
            placeholder="Search courses by code, name, faculty..."
          />
        </div>
        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>

      {/* Create Course Form */}
      {showCreateForm && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>Create New Course</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCourse.course_code}
                    onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})}
                    required
                    placeholder="e.g., DIT211"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCourse.course_name}
                    onChange={(e) => setNewCourse({...newCourse, course_name: e.target.value})}
                    required
                    placeholder="e.g., Web Development"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={newCourse.faculty}
                    onChange={(e) => setNewCourse({...newCourse, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  placeholder="Course description..."
                />
              </div>
              <button type="submit" className="btn btn-success">Create Course</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Form */}
      {editingCourse && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #007bff' }}>
          <div className="card-header" style={{ background: '#007bff' }}>
            <h3 style={{ margin: 0, color: 'white' }}>Edit Course</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleEditCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCourse.course_code}
                    onChange={(e) => setEditCourse({...editCourse, course_code: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCourse.course_name}
                    onChange={(e) => setEditCourse({...editCourse, course_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={editCourse.faculty}
                    onChange={(e) => setEditCourse({...editCourse, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={editCourse.description}
                  onChange={(e) => setEditCourse({...editCourse, description: e.target.value})}
                />
              </div>
              <div className="form-group form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={editCourse.active}
                  onChange={(e) => setEditCourse({...editCourse, active: e.target.checked})}
                />
                <label className="form-check-label">Active Course</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-success">Update Course</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditingCourse(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses List - Updated to use filteredCourses */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>All Courses ({filteredCourses.length})</h3>
        </div>
        <div className="card-body">
          {filteredCourses.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    <th>Assigned Lecturer</th>
                    <th>Status</th>
                    {user.role === 'program_leader' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => ( // Use filteredCourses instead of courses
                    <tr key={course.id}>
                      <td><strong>{course.course_code}</strong></td>
                      <td>{course.course_name}</td>
                      <td>{course.faculty}</td>
                      <td>
                        {course.lecturer_name ? (
                          `${course.lecturer_name}`
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
                          background: course.active ? '#28a745' : '#dc3545',
                          color: 'white'
                        }}>
                          {course.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {user.role === 'program_leader' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {assigningCourse === course.id ? (
                              <div>
                                <select
                                  className="form-select form-select-sm"
                                  onChange={(e) => handleAssignLecturer(course.id, e.target.value)}
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
                                  onClick={() => setAssigningCourse(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => setAssigningCourse(course.id)}
                                title="Assign Lecturer"
                              >
                                Assign
                              </button>
                            )}
                            
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => startEditCourse(course)}
                              title="Edit Course"
                            >
                              Edit
                            </button>
                            
                            <button 
                              className={`btn btn-sm ${course.active ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleCourseStatus(course.id, course.active)}
                              title={course.active ? 'Deactivate Course' : 'Activate Course'}
                            >
                              {course.active ? 'Deactivate' : 'Activate'}
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
              {courses.length === 0 ? 'No courses found.' : 'No courses match your search criteria.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;