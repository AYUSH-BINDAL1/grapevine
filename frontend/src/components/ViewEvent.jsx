import  { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewEvent.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { base_url } from '../config';

function ViewEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserHost, setIsUserHost] = useState(false);
  const [isUserParticipant, setIsUserParticipant] = useState(false);
  const sessionId = localStorage.getItem('sessionId');
  const userData = JSON.parse(localStorage.getItem('userData'));
  const userEmail = userData?.userEmail;

  // Location mapping
  const locationMap = {
    1: "WALC",
    2: "LWSN",
    3: "PMUC",
    4: "HAMP",
    5: "RAWL",
    6: "CHAS",
    7: "CL50",
    8: "FRNY",
    9: "KRAN",
    10: "MSEE",
    11: "MATH",
    12: "PHYS",
    13: "POTR",
    14: "HAAS",
    15: "HIKS",
    16: "BRWN",
    17: "HEAV",
    18: "BRNG",
    19: "SC",
    20: "WTHR",
    21: "UNIV",
    22: "YONG",
    23: "ME",
    24: "ELLT",
    25: "PMU",
    26: "STEW"
  };

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${base_url}/events/${eventId}`,
        { headers: { 'Session-Id': sessionId } }
      );
      
      setEvent(response.data);
      
      // Check if user is a host or participant
      if (userEmail) {
        const isHost = response.data.hosts?.includes(userEmail);
        const isParticipant = response.data.participants?.includes(userEmail);
        
        setIsUserHost(isHost);
        setIsUserParticipant(isParticipant);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
      toast.error('Failed to load event details. Please try again later.');
    }
  }, [eventId, sessionId, userEmail]);

  useEffect(() => {
    if (!sessionId) {
      toast.error('You must be logged in to view event details');
      navigate('/');
      return;
    }
    
    fetchEvent();
  }, [eventId, navigate, sessionId, userEmail, fetchEvent]);

  const handleJoinEvent = async () => {
    try {
      const response = await axios.post(
        `${base_url}/events/${eventId}/join`,
        null,
        { headers: { 'Session-Id': sessionId } }
      );

      if (response.status === 200) {
        toast.success('Successfully joined the event!');
        setIsUserParticipant(true);
        // Refresh event data to update participants
        fetchEvent();
      }
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error(error.response?.data?.message || 'Failed to join event. Please try again.');
    }
  };

  const handleLeaveEvent = async () => {
    try {
      const response = await axios.post(
        `${base_url}/events/${eventId}/leave`,
        null,
        { headers: { 'Session-Id': sessionId } }
      );

      if (response.status === 200) {
        toast.success('Successfully left the event.');
        setIsUserParticipant(false);
        // Refresh event data to update participants
        fetchEvent();
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error(error.response?.data?.message || 'Failed to leave event. Please try again.');
    }
  };

  const handleDeleteEvent = async () => {
    // Display confirmation dialog
    const confirmDelete = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    
    if (!confirmDelete) {
      return; // User canceled the action
    }
    
    try {
      const response = await axios.delete(
        `${base_url}/events/${eventId}`,
        { headers: { 'Session-Id': sessionId } }
      );
      
      if (response.status === 200) {
        toast.success('Event deleted successfully!');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/events')}>Back to Events</button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="error-container">
        <h2>Event Not Found</h2>
        <p>The event you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <button onClick={() => navigate('/events')}>Back to Events</button>
      </div>
    );
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    // Format date as MM/DD/YYYY
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    // Format time as HH:MM AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
    
    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <div className="view-event-container">
      <div className="event-header">
        <h1>{event.name}</h1>
        <div className="event-actions">
          {isUserHost ? (
            <button className="delete-event-button" onClick={handleDeleteEvent}>
              Delete Event
            </button>
          ) : isUserParticipant ? (
            <button className="leave-event-button" onClick={handleLeaveEvent}>
              Leave Event
            </button>
          ) : (
            <button 
              className="join-event-button" 
              onClick={handleJoinEvent}
              disabled={event.participants?.length >= event.maxUsers}
            >
              {event.participants?.length >= event.maxUsers ? 'Event Full' : 'Join Event'}
            </button>
          )}
          <button className="back-button" onClick={() => navigate('/events')}>
            Back to Events
          </button>
        </div>
      </div>
      
      <div className="event-details">
        <div className="event-info">
          <div className="info-item">
            <span className="label">Date & Time:</span>
            <span className="value">{formatDateTime(event.eventTime)}</span>
          </div>
          <div className="info-item">
            <span className="label">Location:</span>
            <span className="value">{locationMap[event.locationId] || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">Group:</span>
            <span className="value">{event.group?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Capacity:</span>
            <span className="value">{event.participants?.length || 0} / {event.maxUsers}</span>
          </div>
        </div>
        
        <div className="event-description">
          <h3>Description</h3>
          <p>{event.description}</p>
        </div>
        
        <div className="event-participants">
          <h3>Participants ({event.participants?.length || 0})</h3>
          <div className="participant-list">
            {event.participants && event.participants.length > 0 ? (
              event.participants.map((participant, index) => (
                <div key={index} className="participant-item">
                  <div className="participant-avatar"></div>
                  <div className="participant-name">
                    {participant === userEmail ? `${participant} (You)` : participant}
                  </div>
                </div>
              ))
            ) : (
              <p>No participants yet</p>
            )}
          </div>
        </div>
        
        <div className="event-hosts">
          <h3>Hosts</h3>
          <div className="host-list">
            {event.hosts && event.hosts.length > 0 ? (
              event.hosts.map((host, index) => (
                <div key={index} className="host-item">
                  <div className="host-avatar"></div>
                  <div className="host-name">
                    {host === userEmail ? `${host} (You)` : host}
                  </div>
                </div>
              ))
            ) : (
              <p>No host information available</p>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default ViewEvent;