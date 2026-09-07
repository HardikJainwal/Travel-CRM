import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Plus,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getWhatsAppUrl,
  getStatusBadgeColor,
  getPriorityBadgeColor,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import WhatsAppLogo from '../components/WhatsAppLogo';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Communication & Status Modals State
  const [noteText, setNoteText] = useState('');
  const [commType, setCommType] = useState('whatsapp_message');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    bookingValue: '',
    quoteAmount: '',
    lostReason: '',
    notes: '',
  });

  // Follow-up modal
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const [leadRes, actRes, teamRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/leads/${id}/activities`),
        api.get('/users'),
      ]);

      if (leadRes.data.success) setLead(leadRes.data.data);
      if (actRes.data.success) setActivities(actRes.data.data);
      if (teamRes.data?.success) setTeamMembers(teamRes.data.data);
    } catch (err) {
      console.error('Error fetching lead detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      const res = await api.post(`/leads/${id}/activities`, {
        type: commType,
        description: noteText,
      });

      if (res.data.success) {
        setNoteText('');
        fetchLeadDetails();
      }
    } catch (err) {
      alert('Error adding activity note');
    }
  };

  const handleQuickStatus = async (newStatus) => {
    try {
      const res = await api.patch(`/leads/${id}/status`, { status: newStatus });
      if (res.data.success) fetchLeadDetails();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await api.put(`/leads/${id}`, { priority: newPriority });
      if (res.data.success) fetchLeadDetails();
    } catch (err) {
      alert('Error updating priority');
    }
  };

  const handleAssignChange = async (newAssigneeId) => {
    try {
      const res = await api.patch(`/leads/${id}/assign`, { assignedTo: newAssigneeId });
      if (res.data.success) {
        fetchLeadDetails();
      }
    } catch (err) {
      alert('Error assigning lead');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (statusForm.status === 'Follow-up Required' && statusForm.nextScheduledAt) {
        await api.post('/followups', {
          leadId: id,
          scheduledAt: statusForm.nextScheduledAt,
          notes: statusForm.notes || 'Scheduled follow-up call',
        });
      }
      const res = await api.patch(`/leads/${id}/status`, statusForm);
      if (res.data.success) {
        setShowStatusModal(false);
        fetchLeadDetails();
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate) return;

    try {
      const res = await api.post(`/followups`, {
        leadId: id,
        scheduledAt: followupDate,
        notes: followupNotes,
      });

      if (res.data.success) {
        setShowFollowupModal(false);
        setFollowupDate('');
        setFollowupNotes('');
        fetchLeadDetails();
      }
    } catch (err) {
      alert('Error scheduling follow-up');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading lead details...</div>;
  }

  if (!lead) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-800 font-bold">Lead not found</p>
        <Link to="/leads" className="text-blue-600 text-xs hover:underline">
          Return to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                {lead.leadId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{lead.customerName}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Enquiry for {lead.destination}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent WhatsApp Link Button */}
          <a
            href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.customerName, lead.destination)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-95"
          >
            <WhatsAppLogo className="w-4 h-4 text-white fill-current" />
            <span>Open WhatsApp Chat</span>
          </a>

          {lead.status === 'New' && (
            <button
              onClick={() => handleQuickStatus('Contacted')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition transform active:scale-95"
            >
              ⚡ Mark as Contacted
            </button>
          )}

          <button
            onClick={() => {
              setStatusForm({
                status: lead.status,
                bookingValue: lead.actualBookingValue || lead.estimatedValue || '',
                quoteAmount: lead.quoteAmount || lead.estimatedValue || '',
                lostReason: lead.lostReason || '',
                notes: '',
              });
              setShowStatusModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs shadow-2xs"
          >
            Update Pipeline Status
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Info Sections, Right Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (4 Sections) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Customer Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Customer Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Customer Name</span>
                <span className="text-slate-900 font-bold text-sm">{lead.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Phone Number</span>
                <div className="flex items-center gap-2 text-slate-800 font-mono font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">WhatsApp Number</span>
                <div className="flex items-center gap-2 text-emerald-700 font-mono font-bold">
                  <WhatsAppLogo className="w-4 h-4 text-emerald-600 fill-current" />
                  <span>{lead.whatsapp || lead.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Email Address</span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.email || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Travel Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Indian Travel Requirements</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Service Package</span>
                <span className="text-slate-900 font-bold">{lead.destination}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Client Travel Date</span>
                <span className="text-blue-700 font-bold">
                  {lead.startDate ? formatDate(lead.startDate) : 'To Be Finalized'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Pax (Travelers)</span>
                <span className="text-slate-800 font-semibold">
                  {lead.adults} Adults, {lead.children} Children
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Trip Type</span>
                <span className="text-slate-800 font-medium">{lead.tripType || 'Family'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Estimated Budget</span>
                <span className="text-emerald-700 font-extrabold">{formatCurrency(lead.budget)}</span>
              </div>
            </div>
          </div>

          {/* 3. Lead Attribution Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Lead Attribution & Team Assignment</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Lead Source</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  {lead.source}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Meta Campaign Name</span>
                <span className="text-slate-700 font-mono text-[11px] truncate block">
                  {lead.campaignName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status & Priority</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  <select
                    value={lead.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${getPriorityBadgeColor(lead.priority)}`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Assigned (Amit / Hardik)</span>
                {isAdmin ? (
                  <select
                    value={lead.assignedTo?._id || ''}
                    onChange={(e) => handleAssignChange(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-slate-800 font-bold">{lead.assignedTo?.name || 'Unassigned'}</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Created Date</span>
                <span className="text-slate-600">{formatDateTime(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 4. Commercial Tracking Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              <span>Commercial & Quotation Details (₹)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Estimated Value</span>
                <span className="text-slate-900 font-bold">{formatCurrency(lead.estimatedValue)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Quote Amount</span>
                <span className="text-blue-700 font-bold">{formatCurrency(lead.quoteAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Actual Booking Value</span>
                <span className="text-emerald-700 font-extrabold text-sm">{formatCurrency(lead.actualBookingValue)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Lost Reason (if Lost)</span>
                <span className="text-rose-600 font-medium">{lead.lostReason || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline & Interaction Logger */}
        <div className="space-y-6">
          {/* Interaction Logger Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Record Communication</span>
              <button
                onClick={() => setShowFollowupModal(true)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>+ Follow-up</span>
              </button>
            </h3>

            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="flex items-center gap-2">
                {[
                  { id: 'whatsapp_message', label: 'WhatsApp' },
                  { id: 'call', label: 'Call' },
                  { id: 'note', label: 'Note' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCommType(type.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      commType === type.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <textarea
                rows="3"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log customer notes, package discussion, dates..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              ></textarea>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Activity Log</span>
              </button>
            </form>
          </div>

          {/* Chronological Activity Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Activity & Communication Feed</h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activities logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="relative pl-6 pb-3 border-l border-slate-200 last:pb-0">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-800">{act.userId?.name || 'System'}</span>
                      <span>{formatDateTime(act.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{act.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Update Lead Pipeline Status</h3>
            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Interested">Interested</option>
                  <option value="Quote Sent">Quote Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Booked">Booked</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {statusForm.status === 'Follow-up Required' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">📅 Follow-up Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={statusForm.nextScheduledAt || ''}
                      onChange={(e) => setStatusForm({ ...statusForm, nextScheduledAt: e.target.value })}
                      className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Follow-up Objective / Note</label>
                    <input
                      type="text"
                      value={statusForm.notes || ''}
                      onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                      placeholder="e.g. Call regarding package details and flight options"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              )}

              {statusForm.status === 'Booked' && (
                <div>
                  <label className="block font-semibold text-emerald-700 mb-1">Confirmed Booking Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={statusForm.bookingValue}
                    onChange={(e) => setStatusForm({ ...statusForm, bookingValue: e.target.value })}
                    placeholder="e.g. 16500"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-600 font-bold"
                  />
                </div>
              )}

              {statusForm.status === 'Quote Sent' && (
                <div>
                  <label className="block font-semibold text-blue-700 mb-1">Quotation Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={statusForm.quoteAmount}
                    onChange={(e) => setStatusForm({ ...statusForm, quoteAmount: e.target.value })}
                    placeholder="e.g. 21500"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
              )}

              {statusForm.status === 'Lost' && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Reason for Lost Lead</label>
                  <input
                    type="text"
                    required
                    value={statusForm.lostReason}
                    onChange={(e) => setStatusForm({ ...statusForm, lostReason: e.target.value })}
                    placeholder="e.g. Client postponed travel plans"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Scheduler Modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Schedule Customer Follow-up</span>
            </h3>
            <form onSubmit={handleScheduleFollowup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Objective / Note</label>
                <textarea
                  rows="2"
                  value={followupNotes}
                  onChange={(e) => setFollowupNotes(e.target.value)}
                  placeholder="Call to confirm hotel room preference..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFollowupModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
