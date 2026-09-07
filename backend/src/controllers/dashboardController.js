const Lead = require('../models/Lead');
const Followup = require('../models/Followup');
const User = require('../models/User');

// Helper to construct date match condition
const getDateRangeFilter = (range, startDate, endDate) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { createdAt: { $gte: start, $lte: end } };
  }
  if (range === 'yesterday') {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { createdAt: { $gte: start, $lte: end } };
  }
  if (range === '7d') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }
  if (range === '30d') {
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }
  if (range === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { createdAt: { $gte: start } };
  }
  if (range === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { createdAt: { $gte: start, $lte: end } };
  }
  return {}; // default all time
};

// @desc Get overview stats
// @route GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;
    const dateFilter = getDateRangeFilter(range, startDate, endDate);

    // Role scoping
    if (req.user.role === 'team_member') {
      dateFilter.assignedTo = req.user.id;
    }

    const totalLeads = await Lead.countDocuments(dateFilter);
    const newLeads = await Lead.countDocuments({ ...dateFilter, status: 'New' });
    const contactedLeads = await Lead.countDocuments({ ...dateFilter, status: 'Contacted' });
    const interestedLeads = await Lead.countDocuments({ ...dateFilter, status: 'Interested' });
    const quotesSent = await Lead.countDocuments({ ...dateFilter, status: 'Quote Sent' });
    const bookings = await Lead.countDocuments({ ...dateFilter, status: 'Booked' });
    const lostLeads = await Lead.countDocuments({ ...dateFilter, status: 'Lost' });

    // Revenue calculation
    const bookedLeadsDocs = await Lead.find({ ...dateFilter, status: 'Booked' }, { actualBookingValue: 1 });
    const totalBookingValue = bookedLeadsDocs.reduce((acc, lead) => acc + (lead.actualBookingValue || 0), 0);
    const avgBookingValue = bookings > 0 ? Math.round(totalBookingValue / bookings) : 0;
    const conversionRate = totalLeads > 0 ? parseFloat(((bookings / totalLeads) * 100).toFixed(1)) : 0;

    // Followups counters
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const followupUserFilter = req.user.role === 'team_member' ? { assignedTo: req.user.id } : {};

    const todaysFollowups = await Followup.countDocuments({
      ...followupUserFilter,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: 'pending',
    });

    const overdueFollowups = await Followup.countDocuments({
      ...followupUserFilter,
      scheduledAt: { $lt: todayStart },
      status: 'pending',
    });

    res.json({
      success: true,
      stats: {
        totalLeads,
        newLeads,
        todaysFollowups,
        overdueFollowups,
        contactedLeads,
        interestedLeads,
        quotesSent,
        bookings,
        lostLeads,
        totalBookingValue,
        avgBookingValue,
        conversionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Lead Sources distribution
// @route GET /api/dashboard/sources
exports.getLeadSources = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;
    const match = getDateRangeFilter(range, startDate, endDate);
    if (req.user.role === 'team_member') match.assignedTo = req.user.id;

    const sources = await Lead.aggregate([
      { $match: match },
      { $group: { _id: '$source', count: { $sum: 1 }, bookings: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
};

// @desc Get Sales Pipeline distribution
// @route GET /api/dashboard/pipeline
exports.getPipelines = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;
    const match = getDateRangeFilter(range, startDate, endDate);
    if (req.user.role === 'team_member') match.assignedTo = req.user.id;

    const pipelineStatuses = [
      'New',
      'Contacted',
      'Follow-up Required',
      'Interested',
      'Quote Sent',
      'Negotiation',
      'Booked',
      'Lost',
      'Not Interested',
    ];

    const counts = await Promise.all(
      pipelineStatuses.map(async (status) => {
        const count = await Lead.countDocuments({ ...match, status });
        return { status, count };
      })
    );

    res.json({ success: true, data: counts });
  } catch (error) {
    next(error);
  }
};

// @desc Get Daily/Weekly Lead Acquisition Trends
// @route GET /api/dashboard/trends
exports.getTrends = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '7d' ? 7 : range === 'today' ? 1 : 30;

    const match = {};
    if (req.user.role === 'team_member') match.assignedTo = req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    match.createdAt = { $gte: startDate };

    const trends = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          leads: { $sum: 1 },
          bookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

// @desc Get Team Performance Metrics (Admin)
// @route GET /api/dashboard/team-performance
exports.getTeamPerformance = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'active' }).select('name email role');

    const performance = await Promise.all(
      users.map(async (u) => {
        const totalAssigned = await Lead.countDocuments({ assignedTo: u._id });
        const contacted = await Lead.countDocuments({ assignedTo: u._id, status: { $ne: 'New' } });
        const bookings = await Lead.countDocuments({ assignedTo: u._id, status: 'Booked' });
        const bookedDocs = await Lead.find({ assignedTo: u._id, status: 'Booked' }, { actualBookingValue: 1 });
        const bookingValue = bookedDocs.reduce((sum, l) => sum + (l.actualBookingValue || 0), 0);
        const conversionRate = totalAssigned > 0 ? parseFloat(((bookings / totalAssigned) * 100).toFixed(1)) : 0;
        const completedFollowups = await Followup.countDocuments({ assignedTo: u._id, status: 'completed' });

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          assignedLeads: totalAssigned,
          contactedLeads: contacted,
          completedFollowups,
          bookings,
          bookingValue,
          conversionRate,
        };
      })
    );

    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};
