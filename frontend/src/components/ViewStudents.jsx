import { useRef } from 'react';
import profileImage from '../assets/temp-profile.webp';
import './Friends.css';

function ViewStudents() {
    const studentsListRef = useRef(null);
    
    // Sample student profiles
    const students = [
        { 
            id: 1, 
            name: "Alice Johnson",
            image: profileImage,
            major: "Computer Science"
        },
        { 
            id: 2, 
            name: "Bob Smith",
            image: profileImage,
            major: "Data Science"
        },
        { 
            id: 3, 
            name: "Carol Williams",
            image: profileImage,
            major: "Software Engineering"
        },
        { 
            id: 4, 
            name: "David Brown",
            image: profileImage,
            major: "Computer Engineering"
        },
        { 
            id: 5, 
            name: "Eva Martinez",
            image: profileImage,
            major: "Cybersecurity"
        }
    ];
    
    return (
        <div className="friends-page">
            <div className="friends-container">
                <h2>My Students</h2>
                
                {students.length > 0 ? (
                    <div className="friends-list" ref={studentsListRef}>
                        {students.map(student => (
                            <div className="friend-card" key={student.id}>
                                <img src={student.image} alt={student.name} />
                                <h3>{student.name}</h3>
                                <p className="student-major">{student.major}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-friends-message">
                        <div className="empty-state-icon">👥</div>
                        <h3>No students found</h3>
                        <p>There are currently no students in this course.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewStudents;