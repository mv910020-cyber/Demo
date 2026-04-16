"use client";
import React, { useState } from 'react';
import { Building2, Mail, User, Phone, Calendar, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import ErrorBanner from '../ui/ErrorBanner';

export default function DemoForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    product: '',
    company: '',
    email: '',
    contactName: '',
    phone: '',
    date: '',
    type: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.createDemo({
        product_interest: formData.product,
        company_name: formData.company,
        contact_name: formData.contactName,
        contact_email: formData.email,
        contact_phone: formData.phone || null,
        preferred_datetime: formData.date ? new Date(formData.date).toISOString() : null,
        demo_type: formData.type === 'online' ? 'online' : 'offline',
        use_case_notes: formData.notes || null,
      });

      setIsSubmitting(false);
      showToast('Demo request submitted', 'success');
      router.push('/status-tracking');

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to submit demo request.');
      } else {
        setError('Unable to submit demo request right now.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
      
      <div className="space-y-6">
        <ErrorBanner message={error} />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Interest</label>
          <select 
            name="product" value={formData.product} onChange={handleChange} required
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-700 appearance-none"
          >
            <option value="" disabled>Select Product...</option>
            <option value="FastTrade99">FastTrade99</option>
            <option value="FastSales99">FastSales99</option>
            <option value="FastHire99">FastHire99</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Building2 size={18} className="text-slate-400" />
              </div>
              <input 
                name="company" type="text" value={formData.company} onChange={handleChange} disabled={isSubmitting} required placeholder="Acme Corp" 
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                name="email" type="email" value={formData.email} onChange={handleChange} disabled={isSubmitting} required placeholder="name@company.com" 
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input 
                name="contactName" type="text" value={formData.contactName} onChange={handleChange} disabled={isSubmitting} required placeholder="John Doe" 
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone size={18} className="text-slate-400" />
              </div>
              <input 
                name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSubmitting} placeholder="+1 (555) 000-0000" 
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Date & Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Calendar size={18} className="text-slate-400" />
              </div>
              <input 
                name="date" type="datetime-local" value={formData.date} onChange={handleChange} disabled={isSubmitting} required 
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed text-slate-700" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Demo Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Video size={18} className="text-slate-400" />
              </div>
              <select 
                name="type" value={formData.type} onChange={handleChange} disabled={isSubmitting} required
                className="w-full pl-10 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed text-slate-700 appearance-none"
              >
                <option value="" disabled>Select Demo Type...</option>
                <option value="online">Online Demo</option>
                <option value="offline">In-Person Meeting</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Use Case or Notes</label>
          <textarea 
            name="notes" value={formData.notes} onChange={handleChange} rows={4} placeholder="Briefly describe the pain points..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none"
          ></textarea>
        </div>

        <button 
          type="submit" disabled={isSubmitting}
          className="w-full bg-cyan-500 text-white font-bold text-lg p-4 rounded-xl shadow-md shadow-cyan-200 hover:bg-cyan-600 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait mt-4"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Demo Request'}
        </button>
      </div>
    </form>
  );
}