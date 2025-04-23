import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import { base_url } from '../config';

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const sessionId = localStorage.getItem("sessionId");

    // Set up click outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        // Add event listener only when dropdown is open
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get(`${base_url}/notifications`, {
                headers: {
                    "Session-Id": sessionId
                }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [sessionId]);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [fetchNotifications, open]);
    
    // Handle notification click based on type
    const handleNotificationClick = async (notification) => {
        // Close the dropdown
        setOpen(false);
        
        // Mark notification as read
        try {
            await axios.post(
                `${base_url}/notifications/mark-read/${notification.notificationId}`,
                {},
                {
                    headers: { "Session-Id": sessionId }
                }
            );
            
            // Update local state to show as read
            setNotifications(prevNotifications => 
                prevNotifications.map(n => 
                    n.notificationId === notification.notificationId 
                        ? {...n, read: true} 
                        : n
                )
            );
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
        
        // Navigate based on notification type
        switch(notification.type) {
            case "MESSAGE":
                navigate(`/forum/thread/${notification.referenceId}`);
                break;
            case "THREAD":
                navigate(`/forum/thread/${notification.referenceId}`);
                break;
            default:
                // If type is unknown, try to navigate based on referenceId
                if (notification.referenceId) {
                    navigate(`/forum/thread/${notification.referenceId}`);
                }
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="bell-button" onClick={() => setOpen(!open)}>
                <FaBell />
                {notifications.some(n => !n.read) && (
                    <span className="notification-badge"></span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    {notifications.length === 0 ? (
                        <div className="notification-card">
                            <span className="notif-content">No new notifications.</span>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div 
                                key={n.notificationId} 
                                className={`notification-card ${n.read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(n)}
                            >
                                <div className="notif-img-placeholder"></div>
                                <div className="notif-content">
                                    <strong>{n.title || 'New Notification'}</strong>
                                    <p>{n.body || n.content || 'You have a new update.'}</p>
                                    <span className="notif-time">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    {notifications.length > 0 && (
                        <div className="notification-actions">
                            <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await axios.post(
                                            `${base_url}/notifications/mark-all-read`,
                                            {},
                                            {
                                                headers: { "Session-Id": sessionId }
                                            }
                                        );
                                        setNotifications(prevNotifications => 
                                            prevNotifications.map(n => ({...n, read: true}))
                                        );
                                    } catch (error) {
                                        console.error("Failed to mark all as read", error);
                                    }
                                }}
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;