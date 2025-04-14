import  { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Events.css';
import { base_url } from '../config';

function Events() {
    const [myEvents, setMyEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [maxUsers, setMaxUsers] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [locationId, setLocationId] = useState("all");
    const [includePastEvents, setIncludePastEvents] = useState(false);
    const [onlyFullEvents, setOnlyFullEvents] = useState(false);

    const hardcodedLocations = [
        { id: 1, shortName: "WALC" },
        { id: 2, shortName: "LWSN" },
        { id: 3, shortName: "PMUC" },
        { id: 4, shortName: "HAMP" },
        { id: 5, shortName: "RAWL" },
        { id: 6, shortName: "CHAS" },
        { id: 7, shortName: "CL50" },
        { id: 8, shortName: "FRNY" },
        { id: 9, shortName: "KRAN" },
        { id: 10, shortName: "MSEE" },
        { id: 11, shortName: "MATH" },
        { id: 12, shortName: "PHYS" },
        { id: 13, shortName: "POTR" },
        { id: 14, shortName: "HAAS" },
        { id: 15, shortName: "HIKS" },
        { id: 16, shortName: "BRWN" },
        { id: 17, shortName: "HEAV" },
        { id: 18, shortName: "BRNG" },
        { id: 19, shortName: "SC" },
        { id: 20, shortName: "WTHR" },
        { id: 21, shortName: "UNIV" },
        { id: 22, shortName: "YONG" },
        { id: 23, shortName: "ME" },
        { id: 24, shortName: "ELLT" },
        { id: 25, shortName: "PMU" },
        { id: 26, shortName: "STEW" }
    ];

    const navigate = useNavigate();
    const scrollContainerRef = useRef(null);

    // Fetch My Events on mount
    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('userData'));
                const sessionId = localStorage.getItem('sessionId');
                if (!userData || !sessionId) return;

                const email = userData.userEmail;

                const response = await axios.get(
                    `${base_url}/events/all`,
                    { headers: { 'Session-Id': sessionId } }
                );

                const allEvents = response.data;

                // Filter for events where the user is a host or participant
                const userEvents = allEvents.filter(ev =>
                    ev.hosts?.includes(email) || ev.participants?.includes(email)
                );

                setMyEvents(userEvents);
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };

        fetchMyEvents();
    }, []);

    // Apply filter based on provided criteria
    const applyEventFilter = useCallback(async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                toast.error("Session expired. Please login again.");
                navigate("/");
                return;
            }

            const params = {};
            if (search.trim() !== "") {
                params.search = search.trim();
            }
            if (maxUsers.trim() !== "") {
                params.maxUsers = maxUsers;
            }
            if (startTime.trim() !== "") {
                params.startTime = startTime + ":00";
            }
            if (endTime.trim() !== "") {
                params.endTime = endTime + ":00";
            }
            if (locationId !== "all") {
                params.locationId = locationId;
            }
            params.includePastEvents = includePastEvents;
            params.onlyFullEvents = onlyFullEvents;

            const query = new URLSearchParams();
            Object.keys(params).forEach(key => {
                const val = params[key];
                if (val !== null && val !== "") {
                    query.append(key, val);
                }
            });
            const url = `${base_url}/events/all-short?${query.toString()}`;
            console.log("Requesting:", url);
            const response = await axios.get(url, {
                headers: { 'Session-Id': sessionId }
            });
            setFilteredEvents(response.data);
        } catch (error) {
            console.error("Error applying event filter:", error);
            toast.error("Failed to fetch events with the given filters.");
        }
    }, [search, maxUsers, startTime, endTime, locationId, includePastEvents, onlyFullEvents, navigate, setFilteredEvents]);

    // Fetch All Events initially
    useEffect(() => {
        const fetchAllEvents = async () => {
            try {
                const sessionId = localStorage.getItem('sessionId');
                if (!sessionId) {
                    toast.error("Session expired. Please login again.");
                    navigate("/");
                    return;
                }
                /*
                const response = await axios.get("http://localhost:8080/events/all-short", {
                    headers: {'Session-Id': sessionId}
                });
                setAllEvents(response.data);
                setFilteredEvents(response.data);
                */
               applyEventFilter();
            } catch (error) {
                console.error("Error fetching all events:", error);
            }
        };
        fetchAllEvents();
    }, [applyEventFilter, navigate]);

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
                    {myEvents.length === 0 ? (
                        <div className="no-events-message">
                            <p>You are not part of any events.</p>
                        </div>
                    ) : (
                        myEvents.map((ev) => (
                            <div key={ev.eventId} className="group-card" onClick={() => handleEventClick(ev.eventId)}>
                                <h3>{ev.name}</h3>
                                <div className="event-location-footer">
                                    📍 {hardcodedLocations.find(loc => loc.id === ev.locationId)?.shortName || "N/A"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button className="scroll-arrow2 right" onClick={scrollRight}>&gt;</button>
            </div>

            <div className="section-header">All Events</div>
            <div className="all-events-container">
                <div className="events-filter-panel">
                    <h2>Filter Events</h2>

                    <div className="filter-group">
                        <label>Search:</label>
                        <input
                            type="text"
                            placeholder="Enter keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    applyEventFilter();
                                }
                            }}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Location:</label>
                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                        >
                            <option value="all">All Locations</option>
                            {hardcodedLocations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.shortName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Max Users:</label>
                        <input
                            type="number"
                            placeholder="e.g. 25"
                            value={maxUsers}
                            onChange={(e) => setMaxUsers(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Start Time:</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>End Time:</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={includePastEvents}
                                onChange={(e) => setIncludePastEvents(e.target.checked)}
                            />
                            <span>Include Past Events</span>
                        </label>
                    </div>

                    <div className="filter-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={onlyFullEvents}
                                onChange={(e) => setOnlyFullEvents(e.target.checked)}
                            />
                            <span>Only Full Events</span>
                        </label>
                    </div>

                    <button className="filter-button" onClick={applyEventFilter}>
                        Search
                    </button>
                </div>

                <div className="all-events-grid">
                    {filteredEvents.length === 0 ? (
                        <p>No events found.</p>
                    ) : (
                        filteredEvents.map((event) => (
                            <div key={event.eventId} className="group-card" onClick={() => handleEventClick(event.eventId)}>
                                <h3>{event.name}</h3>
                                <div className="event-location-footer">
                                    📍 {hardcodedLocations.find(loc => loc.id === event.locationId)?.shortName || "N/A"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Events;