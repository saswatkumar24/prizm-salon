'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, X, Send, Sparkles, Calendar, ChevronRight, Phone, Bot } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: Array<{ label: string; action: string; serviceId?: string; target?: string }>;
  timestamp: string;
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm your PRIZM AI Concierge. I can answer questions about our signature services, check slot availability, or help you book an appointment. How can I assist you today?`,
      actions: [
        { label: '💈 Architectural Cut (₹1,800)', action: 'book', serviceId: 'architectural-cut' },
        { label: '🌈 Prism Colour (₹4,500)', action: 'book', serviceId: 'prism-colour' },
        { label: '📅 Check Open Slots', action: 'navigate', target: '/booking' },
        { label: '📍 Studio Hours & Address', action: 'faq' }
      ],
      timestamp: 'Just now'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          userProfile: user
        })
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: data.reply || "I'm delighted to help. You can view our booking page or contact our Bandra studio directly!",
        actions: data.suggestedActions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: "I couldn't reach the studio server. Please check your connection or book directly via the 'Book a slot' button.",
          timestamp: 'Now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; action: string; serviceId?: string; target?: string }) => {
    if (action.action === 'book') {
      setIsOpen(false);
      router.push(`/booking?service=${action.serviceId || 'architectural-cut'}`);
    } else if (action.action === 'navigate' && action.target) {
      setIsOpen(false);
      router.push(action.target);
    } else {
      handleSend(action.label);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-surface border border-neon-cyan/40 hover:border-neon-cyan shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)] transition-all transform hover:-translate-y-0.5"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-neon-cyan" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-pink animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-pink" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              PRIZM AI Concierge
              <Sparkles className="w-3 h-3 text-neon-pink" />
            </p>
            <p className="text-[10px] text-zinc-400">Ask queries · Book slots</p>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[540px] max-h-[85vh] bg-surface/95 backdrop-blur-2xl border border-surface-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 bg-zinc-950/80 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-black font-black text-sm shadow-md">
                P
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  PRIZM Salon AI
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-zinc-400">Bandra West · Online</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-neon-cyan/90 to-cyan-500 text-black font-medium rounded-tr-none'
                      : 'bg-zinc-900 border border-surface-border text-zinc-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>

                <span className="text-[9px] text-zinc-500 mt-1 px-1">{m.timestamp}</span>

                {/* Interactive Action Pills */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                    {m.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act)}
                        className="px-2.5 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-[11px] font-medium flex items-center gap-1 transition-all"
                      >
                        {act.label}
                        <ChevronRight className="w-3 h-3 text-neon-cyan" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-zinc-500 ml-1">Consulting stylist calendar...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if user is looking */}
          <div className="px-4 py-1.5 bg-zinc-950/40 border-t border-surface-border/50 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            <button
              onClick={() => handleSend('What are the prices for hair colour?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            >
              💰 Price list
            </button>
            <button
              onClick={() => handleSend('Can I book for tomorrow?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            >
              📅 Tomorrow slots
            </button>
            <button
              onClick={() => handleSend('Where is PRIZM Salon located?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            >
              📍 Location
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-zinc-950 border-t border-surface-border flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question or request a slot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-zinc-900 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 disabled:opacity-40 text-black transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
