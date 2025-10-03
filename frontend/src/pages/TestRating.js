import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService } from '../services/api';

const TestRating = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('Click "Test Endpoints" to start');

  const testEndpoints = async () => {
    try {
      setMessage('Testing endpoints...');
      
      // Test 1: Check if reports endpoint works
      const reportsResponse = await reportService.getAll();
      setReports(reportsResponse.data.data || []);
      setMessage(prev => prev + `\n✅ Found ${reportsResponse.data.data.length} reports`);
      
      // Test 2: Try to rate the first report
      if (reportsResponse.data.data.length > 0) {
        const firstReport = reportsResponse.data.data[0];
        setMessage(prev => prev + `\n🎯 Testing rating on report ${firstReport.id}...`);
        
        try {
          const ratingResponse = await reportService.addRating(firstReport.id, {
            rating: 5,
            comment: 'Test rating from debug'
          });
          setMessage(prev => prev + `\n✅ Rating successful: ${ratingResponse.data.message}`);
        } catch (ratingError) {
          setMessage(prev => prev + `\n❌ Rating failed: ${ratingError.response?.data?.message || ratingError.message}`);
        }
      }
      
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const rateReport = async (reportId, rating) => {
    try {
      setMessage(`Rating report ${reportId} with ${rating} stars...`);
      const response = await reportService.addRating(reportId, {
        rating: rating,
        comment: `I give this ${rating} stars!`
      });
      setMessage(`✅ ${response.data.message}`);
    } catch (error) {
      setMessage(`❌ Rating error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1>Rating System Test</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h3>Debug Information</h3>
          <p><strong>User:</strong> {user.first_name} {user.last_name} ({user.role})</p>
          <p><strong>User ID:</strong> {user.id}</p>
          
          <button 
            onClick={testEndpoints}
            className="btn btn-primary"
            style={{ marginRight: '1rem' }}
          >
            Test All Endpoints
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3>Test Results</h3>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            minHeight: '200px'
          }}>
            {message}
          </pre>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-body">
            <h3>Available Reports ({reports.length})</h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Class</th>
                    <th>Topic</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.id}</td>
                      <td>{report.class_name}</td>
                      <td>{report.topic_taught?.substring(0, 50)}...</td>
                      <td>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => rateReport(report.id, star)}
                            className="btn btn-sm btn-outline-primary"
                            style={{ margin: '2px' }}
                          >
                            {star}⭐
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRating;