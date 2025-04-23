import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import profileImage from '../assets/temp-profile.webp';
import './Messaging.css';
import { base_url } from '../config';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

function Messaging() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [debugMessages, setDebugMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  const currentUserEmail = JSON.parse(localStorage.getItem('userData'))?.userEmail;
  const sessionId = localStorage.getItem('sessionId');

  const addDebugMessage = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMsg = `${timestamp}: ${message}`;
    console.log(debugMsg);
    setDebugMessages(prev => [...prev, debugMsg]);
  }, []);

  const updateConversationWithMessage = useCallback((messageData) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv.conversationId === messageData.conversationId) {
          return {
            ...conv,
            lastMessage: messageData.content,
            lastMessageTime: messageData.sentAt
          };
        }
        return conv;
      })
    );
  }, []);

    useEffect(() => {
      let client = null;
  
      if (!currentUserEmail || !sessionId) {
        addDebugMessage('Missing user data or session - redirecting to login');
        navigate('/');
        return;
      }
  
      addDebugMessage('Initializing WebSocket connection...');
      const socket = new SockJS(`${base_url}/ws?email=${encodeURIComponent(currentUserEmail)}`);
      addDebugMessage('SockJS instance created');
      
      client = Stomp.over(socket);
      client.debug = null;
  
      client.connect(
        {},
        frame => {
          addDebugMessage(`Connected to WebSocket - Username: ${frame.headers['user-name']}`);
          setStompClient(client);
          setIsConnected(true); // Mark as connected
          setLoading(false);
  
          // Subscribe to messages
          // Update the message subscription in the WebSocket connection
          // Update the message subscription handler
          // Update the message subscription handler in the WebSocket connection
          client.subscribe(
            '/user/queue/messages',
            msg => {
              const messageData = JSON.parse(msg.body);
              addDebugMessage(`Received message data: ${JSON.stringify(messageData)}`);

              // Check if this conversation exists in our current list
              const conversationExists = conversations.some(
                conv => conv.conversationId === messageData.conversationId
              );

              if (!conversationExists) {
                addDebugMessage('New conversation detected - fetching and updating');
                // First fetch new conversations
                fetchConversations().then(newConversations => {
                  // Then update the most recent message
                  setConversations(prevConvs => 
                    prevConvs.map(conv => {
                      if (conv.conversationId === messageData.conversationId) {
                        return {
                          ...conv,
                          lastMessage: messageData.content,
                          lastMessageTime: messageData.sentAt
                        };
                      }
                      return conv;
                    })
                  );
                  addDebugMessage('Updated new conversation with latest message');
                });
              } else {
                // For existing conversations, update immediately
                setConversations(prevConvs => 
                  prevConvs.map(conv => {
                    if (conv.conversationId === messageData.conversationId) {
                      return {
                        ...conv,
                        lastMessage: messageData.content,
                        lastMessageTime: messageData.sentAt
                      };
                    }
                    return conv;
                  })
                );
                addDebugMessage('Updated existing conversation with latest message');
              }

              // Update messages if we're in the correct conversation
              if (selectedConversation?.conversationId === messageData.conversationId) {
                addDebugMessage('Message matches current conversation - updating messages');
                setMessages(prevMessages => {
                  if (!prevMessages.some(m => m.messageId === messageData.messageId)) {
                    return [...prevMessages, messageData];
                  }
                  return prevMessages;
                });
              }
            },
            { id: 'messages-sub' }
          );
  
          // Subscribe to connect status
          client.subscribe(
            '/user/queue/connect',
            msg => {
              const data = JSON.parse(msg.body);
              addDebugMessage(`Connection status update: ${data.status}`);
              if (data.status === 'CONNECTED') {
                fetchConversations();
              }
            },
            { id: 'connect-sub' }
          );
  
          addDebugMessage('Sending initial connection message');
          client.send('/app/chat.addUser', {}, '{}');
        },
        error => {
          addDebugMessage(`WebSocket connection error: ${error}`);
          toast.error('Failed to connect to chat service');
          setLoading(false);
          setIsConnected(false); // Mark as disconnected on error
        }
      );
  
      return () => {
        // Only attempt disconnect if connection was established
        if (client && isConnected) {
          addDebugMessage('Cleaning up WebSocket connection');
          try {
            ['messages-sub', 'connect-sub'].forEach(id => {
              try {
                client.unsubscribe(id);
                addDebugMessage(`Unsubscribed from ${id}`);
              } catch (e) {
                addDebugMessage(`Error unsubscribing from ${id}: ${e}`);
              }
            });
            client.disconnect(() => {
              addDebugMessage('WebSocket disconnected');
              setIsConnected(false);
            });
          } catch (error) {
            addDebugMessage(`Error during cleanup: ${error}`);
          }
        }
      };
    }, [currentUserEmail, sessionId, selectedConversation, addDebugMessage, updateConversationWithMessage, navigate]);
  
    useEffect(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, [messages]);

    const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedConversation || !stompClient) {
        addDebugMessage('Send message blocked: missing data');
        return;
      }
    
      const content = newMessage.trim();
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const messageData = {
        messageId: tempId, // Add temporary ID
        conversationId: selectedConversation.conversationId,
        content,
        senderEmail: currentUserEmail,
        sentAt: new Date().toISOString()
      };
    
      addDebugMessage(`Sending message: "${content}" to conversation: ${selectedConversation.conversationId}`);
      
      try {
        // Send message through WebSocket
        stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(messageData));
        
        // Immediately update UI for sender with temp ID
        setMessages(prev => [...prev, messageData]);
        updateConversationWithMessage(messageData);
        
        addDebugMessage('Message sent and UI updated');
        setNewMessage('');
      } catch (error) {
        addDebugMessage(`Error sending message: ${error}`);
        toast.error('Failed to send message');
      }
    };

    const fetchConversations = useCallback(async () => {
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
        return response.data; // Return the data for chaining
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }, [sessionId, navigate]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation || !sessionId) return;

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
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    }
  }, [selectedConversation, sessionId]);

  // Fetch messages when conversation selected
  useEffect(() => {
    fetchMessages();
  }, [selectedConversation?.conversationId]);

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
  
    // First check if conversation already exists
    const existingConversation = conversations.find(
      conv => conv.friendEmail === friendEmail
    );
  
    if (existingConversation) {
      addDebugMessage(`Found existing conversation with ${friendEmail}`);
      setSelectedConversation(existingConversation);
      setIsSearchMode(false);
      setSearchQuery('');
      return;
    }
  
    // If no existing conversation, create new one
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
  
      // Update conversations list and get the new data
      const updatedConversations = await fetchConversations();
      
      // Find the newly created conversation in the updated list
      const newConversation = updatedConversations.find(
        conv => conv.friendEmail === friendEmail
      );
  
      if (newConversation) {
        // Set selected conversation and exit search mode
        setSelectedConversation(newConversation);
        setIsSearchMode(false);
        setSearchQuery('');
        addDebugMessage(`Created and selected new conversation with ${friendEmail}`);
      } else {
        addDebugMessage('New conversation created but not found in updated list');
        toast.error('Error selecting new conversation');
      }
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
            {isSearchMode ? 'Back' : 'Search'}
          </button>
        </div>

        {isSearchMode ? (
          <div className="contacts-list">
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
            {searchResults.map(friend => (
              <div
                key={friend.userEmail}
                className="contact-card"
                onClick={() => handleCreateConversation(friend.userEmail)}
              >
                <img 
                  src={friend.profilePicUrl || profileImage} 
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
              <div className="no-conversations">
                <p>No friends found matching "{searchQuery}"</p>
              </div>
            )}
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
                  src={conversation.friendProfilePicUrl || profileImage}
                  alt={conversation.friendName} 
                  className="contact-avatar" 
                />
                <div className="contact-info">
                  <h3>{conversation.friendName}</h3>
                  <p className="last-message">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="unread-count">
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
              onClick={() => handleProfileClick(selectedConversation.friendEmail)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={selectedConversation.friendProfilePicUrl || profileImage}
                alt={selectedConversation.friendName}
                className="chat-avatar" 
              />
              <div className="chat-user-info">
                <h3>
                  {selectedConversation.friendName}
                </h3>
              </div>
            </div>


            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.messageId}  // Changed from message.id to message.messageId
                  className={`message ${
                    message.senderEmail === currentUserEmail ? 'sent' : 'received'
                  }`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">
                      {formatTime(message.sentAt)}
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