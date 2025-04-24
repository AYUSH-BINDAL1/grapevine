import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CourseSearch.css';
import { base_url } from '../config';

function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      if (parsedData.userEmail) {
        setUserEmail(parsedData.userEmail);
      }
    }
  }, []);

  // Fetch user's courses when email is available
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userEmail) return;

      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setError('Session expired. Please login again.');
        return;
      }

      try {
        const response = await axios.get(
          `${base_url}/users/${userEmail}`,
          { headers: { 'Session-Id': sessionId } }
        );
        setUserCourses(response.data.courses || []);
      } catch (error) {
        console.error('Error fetching user courses:', error);
      }
    };

    fetchUserCourses();
  }, [userEmail]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const sessionId = localStorage.getItem('sessionId');
    
    if (!sessionId) {
      setError('Session expired. Please login again.');
      return;
    }
  
    setHasSearched(true); // Set flag when search is performed
  
    try {
      const response = await axios.get(`${base_url}/courses/search/short?query=${searchQuery}`, {
        headers: {
          'Session-Id': sessionId
        }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error searching courses:', error);
      setError('Failed to search courses. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value.toUpperCase());
    setError('');
    setHasSearched(false); // Reset search flag when input changes
  };

  const handleCourseClick = (course) => {
    setSelectedCourse({
      ...course,
      isEnrolled: userCourses.includes(course.courseKey)
    });
  };

  const handleAddCourse = async () => {
    const sessionId = localStorage.getItem('sessionId');
    
    if (!sessionId || !userEmail) {
      setError('Session expired. Please login again.');
      return;
    }
  
    try {
      const courseCode = selectedCourse.courseKey;
      
      await axios.put(
        `${base_url}/users/${userEmail}`,
        {
          courses: [courseCode]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Session-Id': sessionId
          }
        }
      );
      
      setUserCourses([...userCourses, courseCode]);
      toast.success(`Successfully added ${courseCode} to your courses!`);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error adding course:', error);
      setError('Failed to add course. Please try again.');
      toast.error('Failed to add course. Please try again.');
    }
  };

  const handleRemoveCourse = async () => {
    const sessionId = localStorage.getItem('sessionId');
    
    if (!sessionId || !userEmail) {
      setError('Session expired. Please login again.');
      return;
    }

    try {
      const courseCode = selectedCourse.courseKey;
      
      await axios.delete(
        `${base_url}/users/${userEmail}/courses/${courseCode}`,
        {
          headers: {
            'Session-Id': sessionId
          }
        }
      );

      setUserCourses(userCourses.filter(code => code !== courseCode));
      toast.success(`Successfully removed ${courseCode} from your courses!`);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error removing course:', error);
      setError('Failed to remove course. Please try again.');
      toast.error('Failed to remove course. Please try again.');
    }
  };

  return (
    <div className="course-search-container">
      <ToastContainer position="bottom-left" autoClose={3000} />
      <h1>Course Directory</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter course code..."
            id='course-search-input'
            name='course-search-input'
            className="search-input"
            pattern="[A-Za-z0-9 ]+"
            title="Please enter letters, numbers, and spaces only"
            required
          />
          {error && <div className="error-message">{error}</div>}
        </div>
        <button type="submit" className="search-button">Search</button>
      </form>

      <div className="course-list">
        {hasSearched ? (
          courses.length === 0 ? (
            <div className="no-courses-message">
              There aren&apos;t any courses that match your search.
            </div>
          ) : (
            courses.map(course => (
              <div 
                key={course.courseKey}
                className={`course-bar ${userCourses.includes(course.courseKey) ? 'enrolled' : ''}`}
                onClick={() => handleCourseClick(course)}
              >
                {course.courseKey} - {course.title}
                {userCourses.includes(course.courseKey) && <span className="enrolled-star">★</span>}
              </div>
            ))
          )
        ) : null}
      </div>

      {selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedCourse.isEnrolled ? 'Remove Course' : 'Add Course'}</h3>
            <p>
              {selectedCourse.isEnrolled 
                ? `Would you like to remove ${selectedCourse.courseKey} - ${selectedCourse.title} from your courses?`
                : `Would you like to add ${selectedCourse.courseKey} - ${selectedCourse.title} to your courses?`}
            </p>
            <div className="modal-buttons">
              <button 
                onClick={selectedCourse.isEnrolled ? handleRemoveCourse : handleAddCourse} 
                className={`modal-button ${selectedCourse.isEnrolled ? 'delete' : 'confirm'}`}
              >
                Yes
              </button>
              <button onClick={() => setSelectedCourse(null)} className="modal-button cancel">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseSearch;