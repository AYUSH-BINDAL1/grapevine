import React, { useEffect, useState } from 'react';
import './NotificationDropdown.css';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { base_url } from '../config';

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const sessionId = localStorage.getItem('sessionId');
    const userEmail = JSON.parse(localStorage.getItem('userData'))?.userEmail;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${base_url}/notifications`, {
                    headers: { 'Session-Id': sessionId }
                });
                setNotifications(response.data);
            } catch (error) {
                console.error("Failed to load notifications", error);
            }
        };

        if (open) fetchNotifications();
    }, [open, sessionId]);

    const handleNotificationClick = async (notif) => {
        // Mark as read
        try {
            await axios.post(`${base_url}/notifications/mark-read/${notif.notificationId}`, {}, {
                headers: { 'Session-Id': sessionId }
            });
        } catch (err) {
            console.error("Failed to mark as read");
        }

        if (notif.type === 'MESSAGE') {
            navigate('/messaging');
        }
        if (notif.type === 'EVENT_REMINDER') {
            navigate(`/events/${notif.referenceId}`);
        }
        if (notif.type === 'COMMENT') {
            navigate(`/forum/thread/${notif.referenceId}`);
        }

        // You can add handling for other types here
    };

    return (
        <div className="notification-wrapper">
            <button
                className={`bell-button ${notifications.some(n => !n.read) ? 'has-unread' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <FaBell />
            </button>
            {open && (
                <div className="notification-dropdown">
                    {notifications.length === 0 ? (
                        <p className="no-notifications">No notifications</p>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.notificationId}
                                className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className="notif-content">
                                    <strong>{notif.content}</strong>
                                    <span className="notif-time">
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;