import React, { useState } from 'react';
import { Send, User, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';
import { DR_EMILY_CHEN, PATIENT_INFO } from '../data/mockData';
import { Message } from '../types';

interface InboxTabProps {
  messages: Message[];
}

export const InboxTab: React.FC<InboxTabProps> = ({ messages: initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessageText, setNewMessageText] = useState('');
  const [isDoctorTyping, setIsDoctorTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      senderName: PATIENT_INFO.name,
      senderRole: 'Patient',
      senderAvatar: PATIENT_INFO.avatar,
      text: newMessageText,
      timestamp: 'Just now',
      isDoctor: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessageText('');

    // Doctor simulated response after 1.5 seconds
    setIsDoctorTyping(true);
    setTimeout(() => {
      setIsDoctorTyping(false);
      const doctorReply: Message = {
        id: `msg-doc-${Date.now()}`,
        senderName: DR_EMILY_CHEN.name,
        senderRole: DR_EMILY_CHEN.role,
        senderAvatar: DR_EMILY_CHEN.avatar,
        text: "Thank you for reaching out, Sarah! I have logged your message in your patient chart. Everything on your metabolic panel looks optimal, so please continue your current wellness plan.",
        timestamp: 'Just now',
        isDoctor: true,
      };
      setMessages((prev) => [...prev, doctorReply]);
    }, 1500);
  };

  return (
    <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* Active Care Team Header */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={DR_EMILY_CHEN.avatar}
              alt={DR_EMILY_CHEN.name}
              className="w-11 h-11 rounded-full object-cover border border-secondary"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-on-surface">{DR_EMILY_CHEN.name}</h2>
            <p className="text-xs text-on-surface-variant">{DR_EMILY_CHEN.role} • Active Online</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-full">
          Care Team
        </span>
      </div>

      {/* Message History Thread */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isDoctor ? 'justify-start' : 'justify-end'}`}
            >
              {msg.isDoctor && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 border border-outline-variant"
                />
              )}
              <div
                className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 ${
                  msg.isDoctor
                    ? 'bg-surface-container-lowest text-on-surface border border-outline-variant/80 rounded-tl-xs'
                    : 'bg-primary text-on-primary rounded-tr-xs shadow-xs'
                }`}
              >
                <div className="flex justify-between items-center gap-2 text-[10px] opacity-75">
                  <span className="font-bold">{msg.senderName}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed font-normal">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isDoctorTyping && (
            <div className="flex gap-2 items-center text-xs text-on-surface-variant p-2 bg-surface-container rounded-xl w-fit animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> {DR_EMILY_CHEN.name} is typing...
            </div>
          )}
        </div>

        {/* Message Form Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-outline-variant/50">
          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Type your message to Dr. Chen..."
            className="flex-1 text-xs p-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!newMessageText.trim()}
            className="w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center shrink-0 shadow-md hover:bg-primary/95 disabled:opacity-40 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
};
