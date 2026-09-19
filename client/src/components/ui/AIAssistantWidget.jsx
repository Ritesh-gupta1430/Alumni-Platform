import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  Compass,
  FileText,
  Users,
  Briefcase
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';

export default function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.firstName || 'there'}! 👋 How can I help you today? You can ask me for mentor recommendations, interview tips, resume ATS suggestions, or campus job opportunities.`,
      time: 'Just now',
      actions: [
        { label: 'Find Mentors', query: 'Find mentors matching my career goals' },
        { label: 'Latest Jobs', query: 'Show me latest job and internship openings' },
        { label: 'ATS Resume Review', query: 'How do I improve my resume for placements?' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query, time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', { message: query });
      const replyData = res.data?.data;
      const replyText = replyData?.reply || 'I am ready to help with any queries regarding AlumNetra features!';
      const actions = replyData?.actions || [];

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: replyText,
          actions: actions,
          time: 'Just now',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an issue. Please try asking again.', time: 'Just now' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderInlineMarkup = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line;
      let isHeader = false;
      if (trimmed.startsWith('### ')) {
        isHeader = true;
        trimmed = trimmed.replace('### ', '');
      }

      const parts = trimmed.split(/(\*\*.*?\*\*|`.*?`)/g);

      const parsedLine = parts.map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx} className="font-bold text-text-primary">{seg.slice(2, -2)}</strong>;
        }
        if (seg.startsWith('`') && seg.endsWith('`')) {
          return <code key={sIdx} className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px] font-mono text-primary">{seg.slice(1, -1)}</code>;
        }
        return seg;
      });

      if (isHeader) {
        return <h4 key={idx} className="font-extrabold text-xs text-text-primary mt-1 mb-0.5">{parsedLine}</h4>;
      }
      return <div key={idx}>{parsedLine}</div>;
    });
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    if (text.includes('```')) {
      const parts = text.split('```');
      return (
        <div className="space-y-1.5">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              const lines = part.trim().split('\n');
              const codeContent = lines[0] === 'text' || lines[0] === 'javascript' ? lines.slice(1).join('\n') : part;
              return (
                <div key={i} className="my-1.5 p-2 rounded-xl bg-surface-elevated border border-border font-mono text-[11px] text-text-primary whitespace-pre-wrap overflow-x-auto">
                  {codeContent.trim()}
                </div>
              );
            }
            return <div key={i} className="whitespace-pre-line leading-relaxed">{renderInlineMarkup(part)}</div>;
          })}
        </div>
      );
    }
    return <div className="whitespace-pre-line leading-relaxed space-y-0.5">{renderInlineMarkup(text)}</div>;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            id="ai-assistant-fab"
            className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all group cursor-pointer"
          >
            <div className="relative">
              <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline">AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[520px] rounded-3xl glass border border-border/80 shadow-2xl flex flex-col overflow-hidden bg-[var(--color-surface-1)] backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60 bg-surface/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-text-primary flex items-center gap-1.5">
                    AlumNetra AI Assistant
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Live
                    </span>
                  </h3>
                  <p className="text-[10px] text-text-muted">TCET Guidance & Recommender</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-surface border border-transparent hover:border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Bar */}
            <div className="px-3 py-2 border-b border-border/40 bg-surface/30 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {[
                { label: '🤝 Mentors', query: 'Find mentors for React and AI' },
                { label: '💼 Jobs', query: 'What are the latest openings?' },
                { label: '📄 Resume', query: 'How do I improve my resume?' },
                { label: '✉️ Outreach', query: 'Help me draft a cold reach-out message to an alumnus' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border/70 hover:border-primary/40 text-[11px] text-text-secondary hover:text-text-primary whitespace-nowrap transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.sender === 'bot' ? (
                    <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-surface-elevated text-text-secondary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] border border-border">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className={`p-3 rounded-2xl leading-relaxed text-xs ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-sm font-medium'
                          : 'glass border border-border/80 text-text-primary rounded-tl-none shadow-sm'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => {
                              if (act.query) handleSend(act.query);
                              else if (act.url) window.location.href = act.url;
                            }}
                            className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-[10px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-2.5 rounded-xl glass border border-border text-[11px] text-text-muted rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-border/60 bg-surface/80 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AlumNetra AI anything..."
                className="flex-1 py-2 px-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs text-text-primary outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-40 cursor-pointer shadow-sm shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
