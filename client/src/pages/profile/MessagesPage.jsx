import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Plus,
  Clock,
  CheckCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { messagesAPI, connectionsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate, timeAgo } from '../../lib/utils';

export default function MessagesPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const convoParam = searchParams.get('convo');
  const userParam = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [myConnections, setMyConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (currentUser?.accountStatus !== 'active') {
      setLoadingConvos(false);
      return [];
    }
    try {
      const res = await messagesAPI.getConversations();
      const list = res.data.data || [];
      setConversations(list);
      return list;
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error('Failed to load conversations.');
      }
      return [];
    } finally {
      setLoadingConvos(false);
    }
  }, [currentUser?.accountStatus, toast]);

  // 2. Fetch Messages for active conversation
  const fetchMessages = useCallback(async (conversationId, isSilent = false) => {
    if (!conversationId || currentUser?.accountStatus !== 'active') return;
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await messagesAPI.getMessages(conversationId);
      setMessages(res.data.data || []);
    } catch (err) {
      if (!isSilent && err.response?.status !== 403) {
        toast.error('Failed to load messages.');
      }
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, [currentUser?.accountStatus, toast]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const list = await fetchConversations();

      // If userParam is specified, create or select conversation
      if (userParam) {
        try {
          const res = await messagesAPI.startConversation({ recipientId: userParam });
          const convo = res.data.data;
          setActiveConversation(convo);
          setSearchParams({ convo: convo._id });
        } catch (err) {
          toast.error(err.response?.data?.message || 'Could not start conversation.');
        }
      } else if (convoParam) {
        const found = list.find((c) => c._id === convoParam);
        if (found) {
          setActiveConversation(found);
        } else {
          // Attempt to load direct
          setActiveConversation({ _id: convoParam });
        }
      } else if (list.length > 0) {
        setActiveConversation(list[0]);
        setSearchParams({ convo: list[0]._id });
      }
    };
    init();
  }, [convoParam, userParam, fetchConversations, setSearchParams, toast]);

  // Load messages when activeConversation changes
  useEffect(() => {
    if (activeConversation?._id) {
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation?._id, fetchMessages]);

  // Auto-scroll on messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages every 4 seconds
  useEffect(() => {
    if (!activeConversation?._id) return;
    const interval = setInterval(() => {
      fetchMessages(activeConversation._id, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConversation?._id, fetchMessages]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation?._id) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const res = await messagesAPI.sendMessage(activeConversation._id, { content, type: 'text' });
      setMessages((prev) => [...prev, res.data.data]);
      fetchConversations(); // refresh snippet in sidebar
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Open New Chat Modal
  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setLoadingConnections(true);
    try {
      const res = await connectionsAPI.getMine({ status: 'accepted', limit: 100 });
      setMyConnections(res.data.data.connections || []);
    } catch {
      toast.error('Failed to load connections.');
    } finally {
      setLoadingConnections(false);
    }
  };

  // Start chat with connection
  const handleStartChatWith = async (targetId) => {
    try {
      const res = await messagesAPI.startConversation({ recipientId: targetId });
      const convo = res.data.data;
      setShowNewChatModal(false);
      await fetchConversations();
      setActiveConversation(convo);
      setSearchParams({ convo: convo._id });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation.');
    }
  };

  // Helper to get other participant
  const getOtherParticipant = (convo) => {
    if (!convo || !convo.participants) return null;
    return convo.participants.find((p) => (p._id || p) !== currentUser?._id) || convo.participants[0];
  };

  const otherUser = activeConversation ? getOtherParticipant(activeConversation) : null;

  const filteredConversations = conversations.filter((c) => {
    const partner = getOtherParticipant(c);
    if (!partner) return true;
    const fullName = `${partner.firstName || ''} ${partner.lastName || ''}`.toLowerCase();
    return fullName.includes(searchFilter.toLowerCase());
  });

  if (currentUser?.accountStatus !== 'active') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="glass p-8 rounded-3xl border border-primary/20 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2 text-text-primary">Verification Required</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md">
            Direct student-alumni messaging is unlocked once your college ID is verified by our admin team to maintain a safe institutional community.
          </p>
          <Link
            to="/settings/verification"
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            Submit College ID Verification →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col pb-4">
      <div className="card flex-1 flex overflow-hidden border border-[var(--color-surface-border)] shadow-xl">
        {/* ===== LEFT SIDEBAR: CONVERSATION LIST ===== */}
        <div className="w-full sm:w-80 md:w-96 border-r border-[var(--color-surface-border)] flex flex-col bg-[var(--color-surface-1)]">
          {/* Top Search & New Message Bar */}
          <div className="p-4 border-b border-[var(--color-surface-border)] space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-400" />
                Messages
              </h1>
              <Button
                onClick={handleOpenNewChat}
                size="sm"
                variant="primary"
                className="flex items-center gap-1 text-xs"
              >
                <Plus size={14} /> New Chat
              </Button>
            </div>

            <Input
              icon={Search}
              placeholder="Search chats..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-surface-border)]">
            {loadingConvos ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                Loading conversations...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => {
                const partner = getOtherParticipant(convo);
                const isActive = activeConversation?._id === convo._id;

                return (
                  <button
                    key={convo._id}
                    onClick={() => {
                      setActiveConversation(convo);
                      setSearchParams({ convo: convo._id });
                    }}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 border-l-4 border-blue-500'
                        : 'hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <Avatar
                      src={partner?.profilePhoto}
                      firstName={partner?.firstName}
                      lastName={partner?.lastName}
                      size="md"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                          {partner?.firstName} {partner?.lastName}
                        </span>
                        {convo.lastMessageAt && (
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap ml-2">
                            {timeAgo(convo.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {convo.lastMessagePreview || convo.lastMessage?.content || 'Started a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] space-y-2">
                <MessageSquare size={28} className="mx-auto opacity-40 mb-2" />
                <p>No active conversations yet.</p>
                <Button size="sm" variant="outline" onClick={handleOpenNewChat} className="text-xs mt-2">
                  Start a Conversation
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT CHAT PANE ===== */}
        {activeConversation ? (
          <div className="hidden sm:flex flex-1 flex-col bg-[var(--color-surface-0)]">
            {/* Chat Header */}
            {otherUser && (
              <div className="p-4 border-b border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={otherUser.profilePhoto}
                    firstName={otherUser.firstName}
                    lastName={otherUser.lastName}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${otherUser._id}`}
                        className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400"
                      >
                        {otherUser.firstName} {otherUser.lastName}
                      </Link>
                      <RoleBadge role={otherUser.role} />
                      <VerificationBadge badge={otherUser.verificationBadge} />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {otherUser.department || 'TCET Member'}
                    </p>
                  </div>
                </div>

                <Link to={`/profile/${otherUser._id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Profile
                  </Button>
                </Link>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-muted)]">
                  Loading chat history...
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMine = (msg.sender?._id || msg.sender) === currentUser?._id;

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <Avatar
                          src={msg.sender?.profilePhoto}
                          firstName={msg.sender?.firstName}
                          lastName={msg.sender?.lastName}
                          size="xs"
                          className="mb-1"
                        />
                      )}

                      <div className={`max-w-md sm:max-w-lg space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-xs shadow-md'
                              : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-surface-border)] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                        <div className={`text-[10px] text-[var(--color-text-muted)] px-1 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatDate(msg.createdAt, 'h:mm a')}</span>
                          {isMine && <CheckCheck size={12} className="text-blue-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-sm text-[var(--color-text-muted)]">
                  <MessageSquare size={36} className="opacity-30 mb-2" />
                  <p className="font-semibold text-[var(--color-text-primary)]">No messages in this chat yet</p>
                  <p className="text-xs">Say hello and start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-[var(--color-surface-border)] bg-[var(--color-surface-1)] flex items-center gap-2"
            >
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                loading={sending}
                disabled={!messageInput.trim()}
                className="flex items-center gap-1.5 px-4"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center p-8 bg-[var(--color-surface-0)] text-[var(--color-text-muted)]">
            <MessageSquare size={48} className="opacity-30 mb-3" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Select a conversation</h3>
            <p className="text-xs max-w-sm mt-1">
              Choose an existing chat from the left or click 'New Chat' to connect with one of your connections.
            </p>
          </div>
        )}
      </div>

      {/* ===== NEW CHAT MODAL ===== */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        title="Start a New Chat"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Choose someone from your accepted connections to message:
          </p>

          {loadingConnections ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
              Loading your connections...
            </div>
          ) : myConnections.length > 0 ? (
            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--color-surface-border)]">
              {myConnections.map((conn) => {
                const partner = conn.requester?._id === currentUser?._id ? conn.recipient : conn.requester;
                if (!partner) return null;

                return (
                  <button
                    key={conn._id}
                    onClick={() => handleStartChatWith(partner._id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-[var(--color-surface-2)] rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={partner.profilePhoto}
                        firstName={partner.firstName}
                        lastName={partner.lastName}
                        size="md"
                      />
                      <div>
                        <div className="font-bold text-sm text-[var(--color-text-primary)]">
                          {partner.firstName} {partner.lastName}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">{partner.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 font-semibold">Message</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
              <p>You don't have any connections yet.</p>
              <Link to="/network">
                <Button size="sm" variant="outline" className="mt-3">
                  Find Connections
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
