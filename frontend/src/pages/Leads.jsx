import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  MessageSquare,
  Phone,
  Calendar,
  CalendarCheck,
  User,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Compass,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import {
  formatDate,
  formatCurrency,
  getWhatsAppUrl,
  getStatusBadgeColor,
  getPriorityBadgeColor,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import WhatsAppLogo from '../components/WhatsAppLogo';

const INDIAN_SERVICES = [
  'Manali - Kasol 4N/5D',
  'Manali - Kasol 5N/6D',
  'Yulla Kanda 4N/5D',
  'Udaipur - Mount Abu 2N/3D',
  'Chopta - Tungnath 4N/5D',
  'Madhyamaheshwar 4N/5D',
  'Jibhi - Tirthan 4N/5D',
  'Kasol - Kheerganga 2N/3D',
  'Chakrata - Tigerfall 1N/2D',
  'Char Dham 10N/11D',
  'Do Dham 4N/5D',
  'Mcleodganj - Triund 2N/3D',
];

export default function Leads() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState(searchParams.get('assigned') || 'all');
  const [activeTab, setActiveTab] = useState(searchParams.get('view') || 'all');

  // Lead Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'create');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('Manali - Kasol 4N/5D');
  const [customDestination, setCustomDestination] = useState('');
  const [createForm, setCreateForm] = useState({
    customerName: '',
    phone: '',
    whatsapp: '',
    email: '',
    destination: 'Manali - Kasol 4N/5D',
    startDate: '',
    adults: 2,
    children: 0,
    source: 'Meta/Facebook Ads',
    campaignName: '',
    adName: '',
    priority: 'Medium',
    assignedTo: '',
    budget: '',
    notes: '',
    autoAssignRoundRobin: false,
  });

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        view: activeTab,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assignedFilter !== 'all' && { assignedTo: assignedFilter }),
      });

      const res = await api.get(`/leads?${params.toString()}`);
      if (res.data.success) {
        setLeads(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) setTeamMembers(res.data.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    fetchLeads(1);
  }, [search, statusFilter, sourceFilter, priorityFilter, assignedFilter, activeTab]);

  // Phone duplicate checker
  const handlePhoneBlur = async () => {
    if (!createForm.phone || createForm.phone.length < 7) return;
    try {
      const res = await api.post('/leads/check-duplicate', { phone: createForm.phone });
      if (res.data.isDuplicate) {
        setDuplicateWarning(res.data.existingLead);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      // ignore
    }
  };

  // Schedule Follow-up modal state for status change
  const [scheduleModalLead, setScheduleModalLead] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Inline status & priority update handlers
  const handleInlineStatusUpdate = async (leadObj, newStatus) => {
    if (newStatus === 'Follow-up Required') {
      setScheduleModalLead(leadObj);
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setScheduleDate(tomorrow.toISOString().slice(0, 16));
      setScheduleNotes(`Scheduled follow-up call regarding ${leadObj.destination || 'trip'}`);
      return;
    }

    try {
      const res = await api.patch(`/leads/${leadObj._id}/status`, { status: newStatus });
      if (res.data.success) fetchLeads(pagination.page);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleScheduleModalSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleModalLead || !scheduleDate) return;

    try {
      // 1. Create Followup item
      await api.post('/followups', {
        leadId: scheduleModalLead._id,
        scheduledAt: scheduleDate,
        notes: scheduleNotes,
      });

      // 2. Set Lead status to Follow-up Required
      await api.patch(`/leads/${scheduleModalLead._id}/status`, { status: 'Follow-up Required' });

      setScheduleModalLead(null);
      setScheduleDate('');
      setScheduleNotes('');
      fetchLeads(pagination.page);
    } catch (err) {
      alert('Error scheduling follow-up');
    }
  };

  const handleInlinePriorityUpdate = async (leadId, newPriority) => {
    try {
      const res = await api.put(`/leads/${leadId}`, { priority: newPriority });
      if (res.data.success) fetchLeads(pagination.page);
    } catch (err) {
      alert('Failed to update priority');
    }
  };

  const handleCreateSubmit = async (e, forceContinue = false) => {
    if (e) e.preventDefault();

    if (duplicateWarning && !forceContinue) {
      return; // Wait for user decision
    }

    const finalDestination = selectedPackage === 'Other' ? customDestination.trim() : selectedPackage;
    if (!finalDestination) {
      alert('Please specify the destination.');
      return;
    }

    try {
      const payload = {
        ...createForm,
        destination: finalDestination,
      };

      const res = await api.post('/leads', payload);
      if (res.data.success) {
        setIsModalOpen(false);
        setDuplicateWarning(null);
        setSelectedPackage('Manali - Kasol 4N/5D');
        setCustomDestination('');
        setCreateForm({
          customerName: '',
          phone: '',
          whatsapp: '',
          email: '',
          destination: 'Manali - Kasol 4N/5D',
          startDate: '',
          adults: 2,
          children: 0,
          source: 'Meta/Facebook Ads',
          campaignName: '',
          adName: '',
          priority: 'Medium',
          assignedTo: '',
          budget: '',
          notes: '',
          autoAssignRoundRobin: false,
        });
        fetchLeads(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-xs text-slate-500">Filter, assign, and track customer enquiries for Indian travel packages</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Fast Lead Entry</span>
        </button>
      </div>

      {/* Tabs View (All Leads / My Leads / Unassigned) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'all', label: 'All Leads' },
          { id: 'my_leads', label: 'My Leads' },
          { id: 'unassigned', label: 'Unassigned Leads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, package, TRV ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-up Required">Follow-up Required</option>
            <option value="Interested">Interested</option>
            <option value="Quote Sent">Quote Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Booked">Booked</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
          >
            <option value="all">All Lead Sources</option>
            <option value="Meta/Facebook Ads">Meta/Facebook Ads</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Existing Customer">Existing Customer</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Desktop Data Table / Mobile Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading leads data...</div>
      ) : leads.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3 shadow-xs">
          <Compass className="w-12 h-12 text-slate-400 mx-auto animate-bounce" />
          <p className="font-semibold text-slate-800">No leads found matching your criteria</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Lead ID & Customer</th>
                  <th className="p-4">Service Package</th>
                  <th className="p-4">Source & Ad</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Next Follow-up</th>
                  <th className="p-4 text-right">Instant WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium">
                      <Link to={`/leads/${lead._id}`} className="text-slate-900 hover:text-blue-600 font-bold block text-sm">
                        {lead.customerName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
                          {lead.leadId}
                        </span>
                        <span className="text-slate-500">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      <div>{lead.destination}</div>
                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                          👥 {lead.adults || 1} Pax{lead.children > 0 ? ` (+${lead.children} Child)` : ''}
                        </span>
                        {lead.startDate && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                            🗓️ {formatDate(lead.startDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {lead.source}
                      </span>
                      {lead.campaignName && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">{lead.campaignName}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleInlineStatusUpdate(lead, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${getStatusBadgeColor(lead.status)}`}
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
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.priority}
                        onChange={(e) => handleInlinePriorityUpdate(lead._id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${getPriorityBadgeColor(lead.priority)}`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-700">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 text-[10px] text-blue-700 flex items-center justify-center font-bold">
                            {lead.assignedTo.name.charAt(0)}
                          </div>
                          <span className="font-medium">{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-semibold italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : <span className="text-slate-400">None set</span>}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.customerName, lead.destination)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition"
                      >
                        <WhatsAppLogo className="w-4 h-4 text-emerald-600 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden space-y-3">
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono mr-2">
                      {lead.leadId}
                    </span>
                    <Link to={`/leads/${lead._id}`} className="text-base font-bold text-slate-900 hover:text-blue-600">
                      {lead.customerName}
                    </Link>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{lead.destination}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeColor(lead.priority)}`}>
                    {lead.priority}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  <a
                    href={getWhatsAppUrl(lead.whatsapp || lead.phone, lead.customerName, lead.destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs"
                  >
                    <WhatsAppLogo className="w-4 h-4 text-emerald-600 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 shadow-xs">
            <div>
              Showing page <span className="text-slate-900 font-bold">{pagination.page}</span> of{' '}
              <span className="text-slate-900 font-bold">{pagination.totalPages}</span> ({pagination.total} total leads)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeads(pagination.page - 1)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.page + 1)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fast Lead Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Fast Lead Entry (Indian Packages)</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate Detection Alert Banner */}
            {duplicateWarning && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Possible Duplicate Lead Detected</span>
                </div>
                <p>
                  A lead for <strong className="text-slate-900">{duplicateWarning.customerName}</strong> ({duplicateWarning.phone}) already exists for service: {duplicateWarning.destination}.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to={`/leads/${duplicateWarning.id}`}
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
                  >
                    Open Existing Lead ({duplicateWarning.leadId})
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleCreateSubmit(e, true)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                  >
                    Continue Creating Anyway
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={(e) => handleCreateSubmit(e, false)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={createForm.phone}
                    onBlur={handlePhoneBlur}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Client Travel Date & Pax Count (Prominent Highlight Box) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                <div>
                  <label className="block font-bold text-blue-900 mb-1">📅 Client Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-900 mb-1">👥 Adults (Pax) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createForm.adults}
                    onChange={(e) => setCreateForm({ ...createForm, adults: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-900 mb-1">👶 Children (Pax)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.children}
                    onChange={(e) => setCreateForm({ ...createForm, children: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination / Package *</label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => {
                      setSelectedPackage(e.target.value);
                      if (e.target.value !== 'Other') {
                        setCreateForm({ ...createForm, destination: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                  >
                    {INDIAN_SERVICES.map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                    <option value="Other">✨ Other (Write Custom Destination)</option>
                  </select>
                </div>

                {selectedPackage === 'Other' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-blue-700 mb-1">Specify Custom Destination *</label>
                    <input
                      type="text"
                      required
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      placeholder="e.g. Spiti Valley 6N/7D or Goa Beach Resort"
                      className="w-full p-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source *</label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="Meta/Facebook Ads">Meta/Facebook Ads</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp Direct</option>
                    <option value="Website">Website Form</option>
                    <option value="Referral">Referral</option>
                    <option value="Existing Customer">Existing Customer</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campaign Name (Meta Ad)</label>
                  <input
                    type="text"
                    value={createForm.campaignName}
                    onChange={(e) => setCreateForm({ ...createForm, campaignName: e.target.value })}
                    placeholder="e.g. Manali_Summer_Sale_2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={createForm.budget}
                    onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                    placeholder="15000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign To (Amit / Hardik)</label>
                  <select
                    value={createForm.assignedTo}
                    onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                  >
                    <option value="">Leave Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Notes</label>
                <textarea
                  rows="2"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Customer asked for hotel stay inclusion details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-sky-700"
                >
                  Save & Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal when status is set to Follow-up Required */}
      {scheduleModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <span>Schedule Next Follow-Up</span>
            </h3>
            <p className="text-xs text-slate-500">
              Moving <strong className="text-slate-800">{scheduleModalLead.customerName}</strong> ({scheduleModalLead.leadId}) to <strong>Follow-up Required</strong>. When should the team call back?
            </p>

            <form onSubmit={handleScheduleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Objective / Note</label>
                <textarea
                  rows="2"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="Call to finalize package dates and flights..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalLead(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Schedule & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
