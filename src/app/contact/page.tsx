'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Concierge Desk</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Contact VORQUEN Atelier</h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
          Our client relations and haute couture concierge team is ready to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact info cards */}
        <div className="space-y-4">
          <div className="p-5 bg-white border border-stone-200/80 rounded-sm space-y-2">
            <Mail size={18} className="text-stone-800" />
            <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Email Us</h4>
            <p className="text-xs text-stone-600">concierge@vorquen.com</p>
            <p className="text-[11px] text-stone-400">Response within 12–24 business hours</p>
          </div>

          <div className="p-5 bg-white border border-stone-200/80 rounded-sm space-y-2">
            <Phone size={18} className="text-stone-800" />
            <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Call Assistance</h4>
            <p className="text-xs text-stone-600">+91 80 4567 8900</p>
            <p className="text-[11px] text-stone-400">Mon to Sat • 10:00 AM to 7:00 PM IST</p>
          </div>

          <div className="p-5 bg-white border border-stone-200/80 rounded-sm space-y-2">
            <MapPin size={18} className="text-stone-800" />
            <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Atelier Studio</h4>
            <p className="text-xs text-stone-600">Bengaluru Design Studio, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white border border-stone-200/80 rounded-sm p-6 sm:p-8">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h3 className="font-serif text-xl font-bold text-stone-900">Message Received</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Thank you for getting in touch. One of our client relations executives will follow up via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Order enquiry / Sizing help"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can our styling and logistics team help you today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 bg-sand-50 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-stone-900 text-white font-bold uppercase tracking-wider text-xs rounded hover:bg-stone-800 transition flex items-center gap-1.5"
              >
                <span>Send Message</span>
                <Send size={13} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
