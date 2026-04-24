import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  CheckCheck,
  User as UserIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ChatService from '../services/ChatService';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuth();
  const scrollRef = useRef();

  const isStaff = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATIVE';
  const isAdmin = user?.role === 'ADMIN';
  
  const accentColor = isAdmin ? '#f85149' : (isStaff ? 'var(--accent-admin)' : 'var(--accent-student)');
  const accentBg = isAdmin ? 'rgba(248, 81, 73, 0.1)' : (isStaff ? 'rgba(250, 204, 21, 0.1)' : 'rgba(35, 134, 54, 0.1)');
  const accentBgStrong = isAdmin ? 'rgba(248, 81, 73, 0.2)' : (isStaff ? 'rgba(250, 204, 21, 0.2)' : 'rgba(35, 134, 54, 0.2)');

  const fetchContacts = async () => {
    try {
      const data = await ChatService.getConversations();
      setContacts(data);
      // Don't auto-select if we already have one
      if (data.length > 0 && !selectedChat) setSelectedChat(data[0]);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 10000); // Sync contacts every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const fetchChat = async () => {
        try {
          const data = await ChatService.getMessages(selectedChat.userId || selectedChat.id);
          setChatHistory(data);
        } catch (err) {
          console.error('Failed to load chat history');
        }
      };
      fetchChat();
      
      const interval = setInterval(fetchChat, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await ChatService.searchUsers(val);
      setSearchResults(results.filter(r => r.id !== user.id));
    } catch (err) { console.error(err); }
  };

  const startNewChat = (targetUser) => {
    // Check if exists in contacts
    const existing = contacts.find(c => (c.userId || c.id) === targetUser.id);
    if (existing) {
      setSelectedChat(existing);
    } else {
      setSelectedChat({
        userId: targetUser.id,
        fullName: targetUser.fullName,
        role: targetUser.role,
        isNew: true
      });
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      await ChatService.sendMessage(selectedChat.userId || selectedChat.id, message);
      setMessage('');
      // Refresh chat immediately
      const data = await ChatService.getMessages(selectedChat.userId || selectedChat.id);
      setChatHistory(data);
      fetchContacts();
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  if (loading && contacts.length === 0) return (
    <div style={styles.center}>
      <Loader2 className="animate-spin" size={40} color={accentColor} />
    </div>
  );

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.chatWrapper}>
        
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.title}>Messages</h2>
            <div style={styles.searchBox}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={styles.searchInput}
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div style={styles.searchDropdown} className="glass-card">
                  {searchResults.map(res => (
                    <div key={res.id} style={styles.searchResultItem} onClick={() => startNewChat(res)}>
                      <div style={styles.avatarSmall}>{res.fullName[0]}</div>
                      <div>
                        <div style={{fontWeight: '600', fontSize: '0.85rem'}}>{res.fullName}</div>
                        <div style={{fontSize: '0.7rem', color: 'var(--text-dim)'}}>{res.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.contactList}>
            {contacts.map((contact) => (
              <div 
                key={contact.userId || contact.id}
                onClick={() => setSelectedChat(contact)}
                style={{
                  ...styles.contactItem,
                  background: (selectedChat?.userId || selectedChat?.id) === (contact.userId || contact.id) ? accentBg : 'transparent',
                  borderColor: (selectedChat?.userId || selectedChat?.id) === (contact.userId || contact.id) ? accentColor : 'transparent'
                }}
              >
                <div style={styles.avatar}>
                  {(contact.fullName || contact.name)[0]}
                  {contact.unreadCount > 0 && <div style={styles.unreadBadge}>{contact.unreadCount}</div>}
                </div>
                <div style={styles.contactInfo}>
                  <div style={styles.contactHeader}>
                    <span style={styles.contactName}>{contact.fullName || contact.name}</span>
                    <span style={styles.contactTime}>
                      {contact.lastMessageTimestamp ? new Date(contact.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p style={styles.lastMsg}>{contact.lastMessage || contact.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.activeContact}>
                  <div style={{...styles.avatar, background: accentBgStrong, color: accentColor}}>
                    {(selectedChat.fullName || selectedChat.name)[0]}
                  </div>
                  <div>
                    <h3 style={styles.activeName}>{selectedChat.fullName || selectedChat.name}</h3>
                    <p style={styles.activeRole}>{selectedChat.role}</p>
                  </div>
                </div>
                <div style={styles.headerActions}>
                  <Phone size={20} style={styles.actionIcon} />
                  <Video size={20} style={styles.actionIcon} />
                  <MoreVertical size={20} style={styles.actionIcon} />
                </div>
              </div>

              {/* Messages */}
              <div style={styles.messagesList} ref={scrollRef}>
                {chatHistory.length > 0 ? (
                  chatHistory.map((msg) => (
                    <div key={msg.id} style={{
                      ...styles.messageRow,
                      justifyContent: msg.senderId === user.id ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        ...styles.messageBubble,
                        background: msg.senderId === user.id ? accentColor : 'var(--bg-secondary)',
                        color: msg.senderId === user.id ? 'black' : 'white',
                        borderBottomRightRadius: msg.senderId === user.id ? '4px' : '16px',
                        borderBottomLeftRadius: msg.senderId === user.id ? '16px' : '4px',
                      }}>
                        <p style={styles.messageText}>{msg.content}</p>
                        <div style={{
                          ...styles.messageMeta,
                          color: msg.senderId === user.id ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {msg.senderId === user.id && <CheckCheck size={14} style={{marginLeft: '4px', color: msg.isRead ? '#00d4ff' : 'inherit'}} />}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.center}><p style={styles.emptyText}>{selectedChat.isNew ? 'Start a new conversation!' : 'No messages yet. Say hello!'}</p></div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <div style={styles.inputWrapper}>
                  <Smile size={20} style={styles.inputAction} />
                  <Paperclip size={20} style={styles.inputAction} />
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={styles.textInput}
                  />
                  <button type="submit" style={{...styles.sendBtn, background: accentColor, color: isAdmin ? 'white' : (isStaff ? 'black' : 'white')}}>
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={styles.center}>
              <div style={{textAlign: 'center'}}>
                <AlertCircle size={48} color="var(--text-dim)" style={{marginBottom: '1rem'}} />
                <h3>Select a contact or search to start messaging</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    height: 'calc(100vh - 100px)',
    display: 'flex',
    flexDirection: 'column'
  },
  chatWrapper: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    borderRadius: '24px',
    border: '1px solid var(--border-glass)'
  },
  sidebar: {
    width: '320px',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0,0,0,0.1)'
  },
  sidebarHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-glass)'
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: 'var(--text-primary)'
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-dim)'
  },
  searchInput: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '0.6rem 1rem 0.6rem 2.5rem',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none'
  },
  searchDropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    zIndex: 100,
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '0.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    padding: '0.8rem',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.05)'
    }
  },
  avatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  contactList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginBottom: '0.3rem',
    borderLeft: '3px solid transparent'
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    position: 'relative',
    color: 'var(--text-primary)'
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#f85149',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '0.7rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid var(--bg-primary)'
  },
  contactInfo: {
    flex: 1,
    minWidth: 0
  },
  contactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.2rem'
  },
  contactName: {
    fontWeight: '700',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  contactTime: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)'
  },
  lastMsg: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.01)'
  },
  chatHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activeContact: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  activeName: {
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  activeRole: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)'
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    color: 'var(--text-secondary)'
  },
  actionIcon: {
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  messagesList: {
    flex: 1,
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  messageRow: {
    display: 'flex'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '0.8rem 1rem',
    borderRadius: '16px',
    position: 'relative',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  messageText: {
    fontSize: '0.9rem',
    lineHeight: '1.4'
  },
  messageMeta: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '0.4rem',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  emptyText: {
    color: 'var(--text-dim)',
    fontSize: '0.9rem'
  },
  center: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputArea: {
    padding: '1.5rem',
    borderTop: '1px solid var(--border-glass)'
  },
  inputWrapper: {
    background: 'var(--bg-secondary)',
    borderRadius: '15px',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid var(--border-glass)'
  },
  inputAction: {
    color: 'var(--text-dim)',
    cursor: 'pointer'
  },
  textInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'white',
    outline: 'none',
    fontSize: '0.9rem'
  },
  sendBtn: {
    background: 'var(--accent-student)',
    color: 'white',
    padding: '0.6rem',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer'
  }
};

export default Messages;
