import { format, isToday, isYesterday, isPast, parseISO } from 'date-fns';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (isToday(date)) return `Today, ${format(date, 'MMM d')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'MMM d')}`;
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid Date';
  }
};

export const getWhatsAppUrl = (phone, customerName = '', destination = '') => {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^\d+]/g, '').replace('+', '');
  const greeting = customerName
    ? `Hi ${customerName}, this is regarding your enquiry for ${destination || 'your trip'}. How can I assist you today?`
    : 'Hello, regarding your travel enquiry:';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
};

export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Contacted':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Follow-up Required':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Interested':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Quote Sent':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Negotiation':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Booked':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    case 'Lost':
    case 'Not Interested':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const getPriorityBadgeColor = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-500 text-white animate-pulse';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-amber-500 text-white';
    case 'Low':
      return 'bg-slate-400 text-white';
    default:
      return 'bg-slate-400 text-white';
  }
};
