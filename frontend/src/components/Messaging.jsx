import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import profileImage from '../assets/temp-profile.webp';
import './Messaging.css';
import { base_url } from '../config';

function Messaging() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Get current user's email from localStorage
  const currentUserEmail = JSON.parse(localStorage.getItem('userData'))?.userEmail;

  const fetchConversations = useCallback(async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }

    try {
      const response = await axios.get(
        `${base_url}/conversations`,
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(
          `${base_url}/conversations/${selectedConversation.conversationId}`,
          {
            headers: {
              'Session-Id': sessionId,
              'Content-Type': 'application/json'
            }
          }
        );
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    };

    fetchMessages();
  }, [selectedConversation, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
  
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }
  
    try {
      await axios.post(
        `${base_url}/messages/${selectedConversation.conversationId}/send`,
        { content: newMessage.trim() },
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Clear input and fetch updated messages
      setNewMessage('');
      await fetchMessages();
      await fetchConversations(); // Refresh conversation list to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleProfileClick = useCallback((userEmail) => {
    navigate(`/user/${userEmail}`);
  }, [navigate]);

  const handleSearch = async (query) => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }

    try {
      const response = await axios.get(
        `${base_url}/conversations/search-friends?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching friends:', error);
      toast.error('Failed to search friends');
    }
  };

  const handleCreateConversation = async (friendEmail) => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/');
      return;
    }

    try {
      const response = await axios.post(
        `${base_url}/conversations/create/${friendEmail}`,
        {},
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );
      setSelectedConversation(response.data);
      setIsSearchMode(false);
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherParticipantEmail = (participantEmails) => {
    return participantEmails.find(email => email !== currentUserEmail) || 'Unknown User';
  };

  if (loading) {
    return <div className="messaging-loading">Loading conversations...</div>;
  }

  return (
    <div className="messaging-container">
      <div className="contacts-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <button 
            className="toggle-search-button"
            onClick={() => setIsSearchMode(!isSearchMode)}
          >
            {isSearchMode ? 'Back to Conversations' : 'New Message'}
          </button>
        </div>

        {isSearchMode ? (
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search friends..."
              className="search-input"
            />
            <div className="search-results">
              {searchResults.map(friend => (
                <div
                  key={friend.userEmail}
                  className="contact-card"
                  onClick={() => handleCreateConversation(friend.userEmail)}
                >
                  <img 
                    src={profileImage} 
                    alt={friend.name} 
                    className="contact-avatar" 
                  />
                  <div className="contact-info">
                    <h3>{friend.name}</h3>
                    <p className="friend-email">{friend.userEmail}</p>
                  </div>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="no-results">
                  <p>No friends found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="contacts-list">
            {conversations.map(conversation => (
              <div
                key={conversation.conversationId}
                className={`contact-card ${
                  selectedConversation?.conversationId === conversation.conversationId 
                    ? 'selected' 
                    : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="contact-avatar" 
                />
                <div className="contact-info">
                  <h3>{getOtherParticipantEmail(conversation.participantEmails)}</h3>
                  <p className="last-message">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="unread-count">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="no-conversations">
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chat-window">
        {selectedConversation ? (
          <>
            <div 
              className="chat-header"
              onClick={() => handleProfileClick(getOtherParticipantEmail(selectedConversation.participantEmails))}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={profileImage} 
                alt="Profile" 
                className="chat-avatar" 
              />
              <div className="chat-user-info">
                <h3>
                  {getOtherParticipantEmail(selectedConversation.participantEmails)}
                </h3>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${
                    message.senderEmail === currentUserEmail ? 'sent' : 'received'
                  }`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
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
              <button 
                type="submit" 
                className="send-button"
                disabled={!newMessage.trim()}
              >
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