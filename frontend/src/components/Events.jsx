import './Events.css';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function Events() {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const userDataString = localStorage.getItem('userData');

                const sessionId = localStorage.getItem('sessionId');
                if (!userDataString || !sessionId) {
                    alert('No user information or session found. Please login again.');
                    navigate('/');
                    return;
                }
                const userData = JSON.parse(userDataString);
                const email = userData.userEmail;

                const url = `http://localhost:8080/users/${email}/all-events-short`;
                const response = await axios.get(url, {
                    headers: { 'Session-Id': sessionId }
                });
                console.log('Events fetched:', response.data);
                setEvents(response.data);
            } catch (error) {
                console.error('Error fetching events:', error);
                if (error.response && error.response.status === 401) {
                    alert('Session expired. Please login again.');
                    navigate('/');
                }
            }
        };

        fetchEvents();
    }, []);

    const handleCreateEvent = () => {
        navigate('/create-event');
    };

    const handleEventClick = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    const scrollLeft = () => {
        scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    };

    return (
        <div className="app">
            <h1>Events</h1>
            <button onClick={handleCreateEvent} className="create-event-button">
                Create Event
            </button>
            <div className="scroll-wrapper2">
                <button className="scroll-arrow2 left" onClick={scrollLeft}>&lt;</button>
                <div className="scroll-container2" ref={scrollContainerRef}>
                    {events.length > 0 ? (
                        events.map((ev) => (
                            <div
                                key={ev.eventId}
                                className="event-card"
                                onClick={() => handleEventClick(ev.eventId)}
                            >
                                <h3 className="event-name">{ev.name || "Unnamed Event"}</h3>
                            </div>
                        ))
                    ) : (
                        <p>No events found</p>
                    )}
                </div>
                <button className="scroll-arrow2 right" onClick={scrollRight}>&gt;</button>
            </div>
        </div>
    );
}

export default Events;
