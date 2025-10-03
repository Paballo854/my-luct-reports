import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, headers = null) => {
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // If custom headers are provided, set them
  if (headers) {
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Specific export functions for different modules
export const exportReportsToExcel = (reports) => {
  const data = reports.map(report => ({
    'Class Name': report.class_name,
    'Date': new Date(report.date_of_lecture).toLocaleDateString(),
    'Course Code': report.course_code || 'N/A',
    'Course Name': report.course_name || 'N/A',
    'Lecturer': `${report.lecturer_first_name} ${report.lecturer_last_name}`,
    'Students Present': report.actual_students_present,
    'Total Students': report.total_registered_students,
    'Attendance %': `${((report.actual_students_present / report.total_registered_students) * 100).toFixed(1)}%`,
    'Topic Taught': report.topic_taught?.substring(0, 100) + '...',
    'PRL Feedback': report.prl_feedback ? 'Yes' : 'No',
    'Venue': report.venue,
    'Week': report.week_of_reporting
  }));

  const headers = [
    'Class Name', 'Date', 'Course Code', 'Course Name', 'Lecturer',
    'Students Present', 'Total Students', 'Attendance %', 'Topic Taught',
    'PRL Feedback', 'Venue', 'Week'
  ];

  exportToExcel(data, 'lecture_reports', headers);
};

export const exportCoursesToExcel = (courses) => {
  const data = courses.map(course => ({
    'Course Code': course.course_code,
    'Course Name': course.course_name,
    'Faculty': course.faculty,
    'Assigned Lecturer': course.lecturer_name || 'Not Assigned',
    'Status': course.active ? 'Active' : 'Inactive',
    'Description': course.description || 'N/A'
  }));

  const headers = [
    'Course Code', 'Course Name', 'Faculty', 'Assigned Lecturer', 'Status', 'Description'
  ];

  exportToExcel(data, 'courses', headers);
};

export const exportClassesToExcel = (classes) => {
  const data = classes.map(classItem => ({
    'Class Name': classItem.class_name,
    'Faculty': classItem.faculty,
    'Total Students': classItem.total_registered_students,
    'Assigned Lecturer': classItem.lecturer_name || 'Not Assigned',
    'Status': classItem.active ? 'Active' : 'Inactive',
    'Description': classItem.description || 'N/A'
  }));

  const headers = [
    'Class Name', 'Faculty', 'Total Students', 'Assigned Lecturer', 'Status', 'Description'
  ];

  exportToExcel(data, 'classes', headers);
};

export const exportUsersToExcel = (users) => {
  const data = users.map(user => ({
    'First Name': user.first_name,
    'Last Name': user.last_name,
    'Email': user.email,
    'Role': user.role,
    'Faculty': user.faculty || 'N/A',
    'Status': user.active ? 'Active' : 'Inactive'
  }));

  const headers = [
    'First Name', 'Last Name', 'Email', 'Role', 'Faculty', 'Status'
  ];

  exportToExcel(data, 'users', headers);
};