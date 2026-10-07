import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

const whatsappNumber = '919741264243';
const suggestedMessages = ['Product enquiry', 'Order support', 'Wholesale enquiry'];

export const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const openWhatsApp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim() || 'Hi! I would like to know more about your products.';
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end gap-3">
      {isOpen && (
        <section
          id="whatsapp-chat-panel"
          role="dialog"
          aria-label="Chat with us on WhatsApp"
          className="w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-[#DBD5C5] bg-white shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="flex items-center justify-between bg-[#173F35] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold">VIVEPANYA Support</p>
                <p className="mt-0.5 text-[11px] text-white/75">Chat with us on WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat"
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="bg-[#F5F2EB] p-4">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-3 text-xs leading-relaxed text-[#344640] shadow-sm">
              Hello! 👋 How can we help you today? Send us a message and we’ll continue the conversation on WhatsApp.
            </div>
            <p className="mt-2 text-[10px] text-[#7A8A84]">Usually replies within a few hours</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedMessages.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setMessage(`Hi, I need help with ${suggestion.toLowerCase()}.`)}
                  className="rounded-full border border-[#C8D8CE] bg-white px-3 py-1.5 text-[10px] font-medium text-[#173F35] transition-colors hover:bg-[#EAF2EC]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={openWhatsApp} className="flex items-center gap-2 border-t border-[#E7E2D6] bg-white p-3">
            <label className="sr-only" htmlFor="whatsapp-message">Your message</label>
            <input
              id="whatsapp-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message..."
              className="min-w-0 flex-1 rounded-full border border-[#E7E2D6] bg-[#FAF8F5] px-4 py-2.5 text-xs text-[#17372F] outline-none transition focus:border-[#173F35]"
            />
            <button
              type="submit"
              aria-label="Send message on WhatsApp"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1FB85A]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
        aria-expanded={isOpen}
        aria-controls="whatsapp-chat-panel"
        className="group flex h-14 items-center gap-2.5 rounded-full bg-[#25D366] px-4 text-white shadow-lg transition duration-200 hover:scale-105 hover:bg-[#1FB85A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173F35] sm:h-15 sm:px-5"
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
        <span className="text-xs font-bold sm:text-sm">Chat with us</span>
      </button>
    </div>
  );
};
