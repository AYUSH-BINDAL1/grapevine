import './Events.css'
import { useNavigate } from 'react-router-dom';
import axios from "axios";

function Events() {
    const events = [
        { id: 1, title: 'Event 1', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 2, title: 'Event 2', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 3, title: 'Event 3', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 4, title: 'Event 4', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 5, title: 'Event 5', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 6, title: 'Event 6', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 7, title: 'Event 7', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
        { id: 8, title: 'Event 8', image: 'https://via.placeholder.com/150?text=Image+Not+Found' },
    ];

    const navigate = useNavigate();

    const handleCreateEvent = () => {
        navigate('/create-event');
    };

    const handleEventClick = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    return (
        <div className="app">
            <h1>Events</h1>
            <button onClick={handleCreateEvent} className="create-event-button">
                Create Event
            </button>
            <div className="scroll-container">
                {events.length === 0 ? (
                    <p>You are not part of any events. Create one or join an existing event!</p>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="event-card" onClick={() => handleEventClick(event.id)}>
                            <img src={event.image} alt={event.title} />
                            <h3>{event.title}</h3>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Events
