import { useState } from 'react';
import profileImage from '../assets/temp-profile.webp';
import './Messaging.css';

// Mock data for testing
const mockUsers = [
  { id: 1, name: 'John Smith', email: 'john@example.com', lastMessage: 'Hey, how are you?' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', lastMessage: 'Did you get my notes?' },
  { id: 3, name: 'Mike Wilson', email: 'mike@example.com', lastMessage: 'See you at the event!' },
];

const mockMessages = {
  1: [
    { id: 1, sender: 'john@example.com', text: 'Hey, how are you?', timestamp: '2024-04-10T10:00:00' },
    { id: 2, sender: 'user@example.com', text: 'I\'m good, thanks! How about you?', timestamp: '2024-04-10T10:01:00' },
    { id: 3, sender: 'john@example.com', text: 'Doing great! Ready for the exam?', timestamp: '2024-04-10T10:02:00' },
  ],
  2: [
    { id: 1, sender: 'sarah@example.com', text: 'Did you get my notes?', timestamp: '2024-04-10T09:00:00' },
    { id: 2, sender: 'user@example.com', text: 'Yes, thank you so much!', timestamp: '2024-04-10T09:05:00' },
  ],
  3: [
    { id: 1, sender: 'mike@example.com', text: 'See you at the event!', timestamp: '2024-04-10T11:00:00' },
  ],
};

function Messaging() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const currentUserEmail = 'user@example.com'; // This would come from your auth system

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // For now, just log the message
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messaging-container">
      <div className="contacts-sidebar">
        <h2>Messages</h2>
        <div className="contacts-list">
          {mockUsers.map(user => (
            <div
              key={user.id}
              className={`contact-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <img src={profileImage} alt={user.name} className="contact-avatar" />
              <div className="contact-info">
                <h3>{user.name}</h3>
                <p className="last-message">{user.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <img src={profileImage} alt={selectedUser.name} className="chat-avatar" />
              <div className="chat-user-info">
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
              </div>
            </div>

            <div className="messages-container">
              {mockMessages[selectedUser.id].map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender === currentUserEmail ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a conversation to start messaging</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messaging;