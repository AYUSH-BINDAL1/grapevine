import './Events.css'
import { useNavigate } from 'react-router-dom';

function Events() {
    const events = [
        { id: 1, title: 'Event 1', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 2, title: 'Event 2', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 3, title: 'Event 3', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 4, title: 'Event 4', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 5, title: 'Event 5', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 6, title: 'Event 6', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 7, title: 'Event 7', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
        { id: 8, title: 'Event 8', image: 'https://monikahibbs.com/wp-content/uploads/2014/07/image-200x300.jpg' },
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
