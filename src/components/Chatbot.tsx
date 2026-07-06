import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Trash2, Sprout, Sparkles, Loader2 } from 'lucide-react';

interface ChatbotProps {
  token: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ token }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [token]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user's message
    const tempUserMsg: ChatMessage = {
      sender: 'user',
      text: userText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      if (!response.ok) {
        throw new Error('Could not contact assistant core.');
      }

      const data = await response.json();
      // Replace optimistic or append server responses
      setMessages(prev => [
        ...prev.filter(m => m !== tempUserMsg),
        data.userMessage,
        data.aiResponse
      ]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        sender: 'ai',
        text: `⚠️ Error: Could not get response from OptiCrop AI. Please verify your GEMINI_API_KEY environment variable.`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history with OptiCrop AI?')) return;
    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-zinc-950/70 border border-emerald-500/10 rounded-3xl overflow-hidden relative shadow-lg">
      
      {/* Bot Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-4 border-b border-emerald-500/20 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl relative">
            <Bot size={18} />
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-400 rounded-full border border-zinc-900" />
          </div>
          <div>
            <h3 className="text-white text-sm font-extrabold font-display flex items-center gap-1">
              OptiCrop Agronomist AI <Sparkles size={12} className="text-amber-400" />
            </h3>
            <p className="text-[11px] text-zinc-400">
              Personalized crop advice & soil guidance
            </p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition cursor-pointer"
            title="Wipe Chat History"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fetching ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">Loading assistant history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="p-4 bg-emerald-950/30 text-emerald-400 rounded-full border border-emerald-500/10 animate-bounce">
              <Sprout size={32} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-200">Hello, I'm your OptiCrop AI assistant!</h4>
              <p className="text-xs text-zinc-500 max-w-[280px] mx-auto mt-1 leading-relaxed">
                Ask me anything about fertilizer application, weather forecasts, pest control, or irrigation strategies!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              <button 
                onClick={() => setInput("What can I grow in clay soil?")}
                className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-400 px-3 py-1.5 rounded-full hover:text-white transition cursor-pointer"
              >
                What grows in clay soil?
              </button>
              <button 
                onClick={() => setInput("How to improve low potassium levels?")}
                className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-zinc-400 px-3 py-1.5 rounded-full hover:text-white transition cursor-pointer"
              >
                Improve low potassium?
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border ${
                  isUser 
                    ? 'bg-amber-600/10 border-amber-500/20 text-amber-500' 
                    : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                  isUser 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-none border-transparent' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>OptiCrop AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-900 bg-zinc-950 flex gap-2">
        <input
          type="text"
          placeholder="Ask OptiCrop AI an agricultural query..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-emerald-500 text-white text-xs outline-none transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:bg-zinc-800 disabled:text-zinc-500 transition cursor-pointer"
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
};
