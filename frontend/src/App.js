import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Landing from './pages/Landing'; // Add Landing page import
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import PRLDashboard from './pages/PRLDashboard';
import PLDashboard from './pages/PLDashboard';
import Reports from './pages/Reports';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Classes from './pages/Classes';
import LecturerClasses from './pages/LecturerClasses';
import TestRating from './pages/TestRating';

// Styles
import './styles/global.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {/* Show Navbar only when user is logged in AND not on landing page */}
      {user && <Navbar />}
      <main>
        <Routes>
          {/* 🔥 ADD LANDING PAGE ROUTE */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" /> : <Landing />
          } />
          
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/dashboard" /> : <Register />
          } />
          
          {/* Role-specific dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {user?.role === 'student' ? <StudentDashboard /> : 
               user?.role === 'lecturer' ? <LecturerDashboard /> :
               user?.role === 'principal_lecturer' ? <PRLDashboard /> : 
               user?.role === 'program_leader' ? <PLDashboard /> :
               <Dashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/classes" element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          } />
          
          {/* Lecturer-specific routes */}
          <Route path="/my-classes" element={
            <ProtectedRoute requiredRole="lecturer">
              <LecturerClasses />
            </ProtectedRoute>
          } />
          
          {/* Test route for debugging */}
          <Route path="/test-rating" element={
            <ProtectedRoute>
              <TestRating />
            </ProtectedRoute>
          } />
          
          {/* Catch all route - redirect to appropriate page */}
          <Route path="*" element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/" />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;