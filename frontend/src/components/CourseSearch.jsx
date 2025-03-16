import { useState } from 'react';
import './CourseSearch.css';

function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Placeholder courses
  const placeholderCourses = [
    { id: 1, name: 'CS 18000 - Problem Solving and Object-Oriented Programming' },
    { id: 2, name: 'CS 24000 - Programming in C' },
    { id: 3, name: 'CS 25100 - Data Structures and Algorithms' },
    { id: 4, name: 'CS 30700 - Software Engineering' },
    { id: 5, name: 'CS 35200 - Compilers: Principles and Practice' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Future implementation: API call to search courses
    console.log('Searching for:', searchQuery);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  const handleAddCourse = () => {
    // Future implementation: API call to add course
    console.log('Adding course:', selectedCourse);
    setSelectedCourse(null);
  };

  return (
    <div className="course-search-container">
      <h1>Course Directory</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter course code..."
            className="search-input"
            pattern="[A-Z0-9]+"
            title="Please enter only capital letters and numbers"
            required
          />
        </div>
        <button type="submit" className="search-button">Search</button>
      </form>

      <div className="course-list">
        {placeholderCourses.length === 0 ? (
          <div className="no-courses-message">
            There aren't any courses that match your search.
          </div>
        ) : (
          placeholderCourses.map(course => (
            <div 
              key={course.id}
              className="course-bar"
              onClick={() => handleCourseClick(course)}
            >
              {course.name}
            </div>
          ))
        )}
      </div>

      {selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Course</h3>
            <p>Would you like to add {selectedCourse.name} to your courses?</p>
            <div className="modal-buttons">
              <button onClick={handleAddCourse} className="modal-button confirm">Yes</button>
              <button onClick={() => setSelectedCourse(null)} className="modal-button cancel">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseSearch;