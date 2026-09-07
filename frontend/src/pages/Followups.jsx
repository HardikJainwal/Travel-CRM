import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Phone,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import {
  formatDate,
  formatDateTime,
  getWhatsAppUrl,
  getStatusBadgeColor,
  getPriorityBadgeColor,
} from '../utils/formatters';
import WhatsAppLogo from '../components/WhatsAppLogo';

export default function Followups() {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('filter') || 'today');
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Complete Followup Modal
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextScheduledAt, setNextScheduledAt] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/followups?filter=${filter}`);
      if (res.data.success) {
        setFollowups(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [filter]);

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowup) return;

    try {
      const res = await api.patch(`/followups/${selectedFollowup._id}/complete`, {
        completionNotes,
        nextScheduledAt: nextScheduledAt || null,
        nextNotes,
        updateStatus: updateStatus || null,
      });

      if (res.data.success) {
        setSelectedFollowup(null);
        setCompletionNotes('');
        setNextScheduledAt('');
        setNextNotes('');
        setUpdateStatus('');
        fetchFollowups();
      }
    } catch (err) {
      alert('Error completing follow-up');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up Command Center</h1>
          <p className="text-xs text-slate-500">Track and complete daily customer follow-ups and calls</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overdue', label: 'Overdue Follow-ups', icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200 font-bold' },
          { id: 'today', label: "Today's Follow-ups", icon: Clock, color: 'text-amber-800 bg-amber-50 border-amber-200 font-bold' },
          { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck, color: 'text-blue-700 bg-blue-50 border-blue-200 font-bold' },
          { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? `${tab.color} border shadow-2xs`
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Followups List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading follow-ups...</div>
      ) : followups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2 shadow-xs">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <p className="font-bold text-slate-800">No follow-ups found under this section</p>
          <p className="text-xs text-slate-500">All customer communications in this bucket are up to date!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followups.map((item) => {
            const lead = item.leadId;
            const isOverdue = filter === 'overdue' || (new Date(item.scheduledAt) < new Date() && item.status === 'pending');
            return (
              <div
                key={item._id}
                className={`p-5 rounded-2xl border transition space-y-4 shadow-xs ${
                  isOverdue
                    ? 'bg-rose-50/50 border-rose-200'
                    : filter === 'today'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold mr-2">
                      {lead?.leadId}
                    </span>
                    <Link to={`/leads/${lead?._id}`} className="text-base font-bold text-slate-900 hover:text-blue-600">
                      {lead?.customerName || 'Customer'}
                    </Link>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{lead?.destination}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(lead?.priority)}`}>
                    {lead?.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Clock className={`w-4 h-4 ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
                  <span className="font-bold">{formatDateTime(item.scheduledAt)}</span>
                  {item.notes && <span className="text-slate-500 text-[11px] truncate">({item.notes})</span>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <a
                    href={getWhatsAppUrl(lead?.whatsapp || lead?.phone, lead?.customerName, lead?.destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs hover:bg-emerald-100 transition"
                  >
                    <WhatsAppLogo className="w-4 h-4 text-emerald-600 fill-current" />
                    <span>WhatsApp</span>
                  </a>

                  {item.status === 'pending' && (
                    <button
                      onClick={() => setSelectedFollowup(item)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-xs shadow-md shadow-blue-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Follow-up Modal */}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Complete Follow-up & Schedule Next</span>
            </h3>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Completion Outcome Note</label>
                <textarea
                  rows="2"
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Customer agreed to quotation, asked for flight inclusion..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Lead Status (Optional)</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Keep Current Status</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Quote Sent">Quote Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Booked">Booked</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-semibold text-blue-700 block">Schedule Next Follow-up (Optional)</span>
                <input
                  type="datetime-local"
                  value={nextScheduledAt}
                  onChange={(e) => setNextScheduledAt(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFollowup(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
