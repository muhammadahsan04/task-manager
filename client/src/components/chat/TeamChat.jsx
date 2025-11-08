import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useSelector } from 'react-redux';

// Keep REST and Socket endpoints distinct.
// VITE_API_URL should include the /api prefix for REST (e.g., http://localhost:5000/api)
// VITE_SOCKET_URL should be the bare origin without /api (e.g., http://localhost:5000)
const REST_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || REST_API.replace(/\/api\/?$/, '');

export default function TeamChat() {
  const { teamId } = useParams();
  const user = useSelector((s) => s.auth.user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });

    setSocket(newSocket);

    // Join team chat room
    newSocket.emit('join_team', teamId);

    // Ensure we don't register duplicate listeners (StrictMode/dev)
    newSocket.off('new_message');
    // Listen for new messages (de-duplicate by id)
    newSocket.on('new_message', (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => Number(m.id) === Number(message.id));
        return exists ? prev : [...prev, message];
      });
    });

    newSocket.off('message_edited');
    // Listen for edited messages
    newSocket.on('message_edited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (Number(msg.id) === Number(updatedMessage.id) ? updatedMessage : msg))
      );
    });

    newSocket.off('message_deleted');
    // Listen for deleted messages
    newSocket.on('message_deleted', ({ id }) => {
      setMessages((prev) => prev.filter((msg) => Number(msg.id) !== Number(id)));
    });

    // Listen for typing indicators
    newSocket.on('user_typing', ({ user: typingUser }) => {
      setTypingUsers((prev) => {
        if (!prev.find((u) => u.id === typingUser.id)) {
          return [...prev, typingUser];
        }
        return prev;
      });
    });

    newSocket.on('user_stop_typing', ({ user: typingUser }) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== typingUser.id));
    });

    return () => {
      newSocket.emit('leave_team', teamId);
      newSocket.disconnect();
    };
  }, [teamId]);

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, [teamId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${REST_API}/chat/teams/${teamId}/messages`, {
        withCredentials: true
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      if (editingMessage) {
        // Edit existing message
        const { data: updated } = await axios.put(
          `${REST_API}/chat/messages/${editingMessage.id}`,
          { message: newMessage },
          { withCredentials: true }
        );
        // Optimistically apply update in case socket event is delayed/missed
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditingMessage(null);
      } else {
        // Send new message
        const { data: created } = await axios.post(
          `${REST_API}/chat/teams/${teamId}/messages`,
          { message: newMessage },
          { withCredentials: true }
        );
        // Optimistically append in case room event arrives late; de-duplicate by id
        setMessages((prev) => {
          const exists = prev.some((m) => Number(m.id) === Number(created.id));
          return exists ? prev : [...prev, created];
        });
      }

      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.message);
    setShowOptions(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await axios.delete(`${REST_API}/chat/messages/${messageId}`, {
        withCredentials: true
      });
      // Optimistically remove the message immediately; socket event will also handle others
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setShowOptions(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { teamId, user: { id: user.id, name: user.name } });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    }
  };

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('stop_typing', { teamId, user: { id: user.id, name: user.name } });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-800">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = Number(message.sender_id) === Number(user.id);
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                  {!isOwnMessage && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1">
                      {message.sender_name}
                    </div>
                  )}
                  <div className="relative group">
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="break-words">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatTime(message.created_at)}
                          {message.is_edited && ' (edited)'}
                        </span>
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div className="absolute right-2 top-2 z-10">
                        <button
                          onClick={() => setShowOptions(showOptions === message.id ? null : message.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          aria-label="Message options"
                          title="Message options"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {showOptions === message.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => handleEditMessage(message)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <span>
            {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t dark:border-gray-700 p-4">
        {editingMessage && (
          <div className="mb-2 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded">
            <span className="text-sm text-indigo-600 dark:text-indigo-400">Editing message</span>
            <button
              type="button"
              onClick={() => {
                setEditingMessage(null);
                setNewMessage('');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {editingMessage ? 'Update' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
