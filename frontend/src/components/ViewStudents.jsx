import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import profileImage from '../assets/temp-profile.webp';
import './Friends.css';

function ViewStudents() {
    const [students, setStudents] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            if (parsedData.userEmail) {
                setUserEmail(parsedData.userEmail);
            }
        }
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            const sessionId = localStorage.getItem('sessionId');
            
            if (!sessionId || !userEmail) {
                setError('Session expired. Please login again.');
                setLoading(false);
                navigate('/');
                return;
            }

            try {
                // First get the instructor's courses
                const userResponse = await axios.get(
                    `http://localhost:8080/users/${userEmail}`,
                    { headers: { 'Session-Id': sessionId } }
                );

                const courses = userResponse.data.courses || [];
                
                if (courses.length === 0) {
                    setStudents([]);
                    setLoading(false);
                    return;
                }

                let allStudents = [];

                // Fetch enrolled students for each course
                for (const courseCode of courses) {
                    try {
                        const courseResponse = await axios.get(
                            `http://localhost:8080/courses/${courseCode}/enrolled-students`,
                            { headers: { 'Session-Id': sessionId } }
                        );
                        
                        // Filter out current user and add course code to each student's data
                        const courseStudents = courseResponse.data
                            .filter(student => student.userEmail !== userEmail) // Filter out current user
                            .map(student => ({
                                ...student,
                                course: courseCode
                            }));
                        
                        allStudents = [...allStudents, ...courseStudents];
                    } catch (courseError) {
                        console.error(`Error fetching students for ${courseCode}:`, courseError);
                    }
                }

                // Remove duplicates based on email
                const uniqueStudents = Array.from(new Map(
                    allStudents.map(student => [student.userEmail, student])
                ).values());

                setStudents(uniqueStudents);
            } catch (error) {
                console.error('Error fetching data:', error);
                if (error.response?.status === 401) {
                    setError('Session expired. Please login again.');
                    navigate('/');
                } else {
                    setError('Failed to fetch students. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (userEmail) {
            fetchStudents();
        }
    }, [navigate, userEmail]);

    const handleStudentClick = (studentEmail) => {
        navigate(`/user/${studentEmail}`);
    };

    if (loading) {
        return (
            <div className="friends-page">
                <div className="friends-container">
                    <h2>Loading Students...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="friends-page">
                <div className="friends-container">
                    <h2>Error</h2>
                    <p className="error-message">{error}</p>
                </div>
            </div>
        );
    }

    // Add the handleStudentClick function near your other handlers

// Then modify the student card rendering in your return statement
    return (
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Students</h2>
                
                {students.length > 0 ? (
                    <div className="friends-list">
                        {students.map(student => (
                            <div 
                                className="friend-card" 
                                key={student.userEmail}
                                onClick={() => handleStudentClick(student.userEmail)}
                                style={{ cursor: 'pointer' }} // Add cursor pointer to indicate clickable
                            >
                                <img src={profileImage} alt={student.name} />
                                <h3>{student.name}</h3>
                                <p className="student-email">{student.userEmail}</p>
                                {student.majors && student.majors.length > 0 && (
                                    <p className="student-major">{student.majors.join(', ')}</p>
                                )}
                                <p className="student-course">Course: {student.course}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-friends-message">
                        <div className="empty-state-icon">👥</div>
                        <h3>No students found</h3>
                        <p>You don't have any students enrolled in your courses yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewStudents;