const Lead = require('../models/Lead');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Followup = require('../models/Followup');

// Helper to generate next Lead ID safely
const generateLeadId = async () => {
  try {
    const leads = await Lead.find({}, { leadId: 1 }).lean();
    let maxNum = 1000;
    for (const l of leads) {
      if (l.leadId) {
        const match = l.leadId.match(/TRV-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidateId = `TRV-${nextNum}`;

    // Loop until a guaranteed unique leadId is found
    while (await Lead.exists({ leadId: candidateId })) {
      nextNum += 1;
      candidateId = `TRV-${nextNum}`;
    }

    return candidateId;
  } catch (err) {
    return `TRV-${Date.now().toString().slice(-6)}`;
  }
};

// Helper for round-robin assignment
const getNextRoundRobinUser = async () => {
  const activeMembers = await User.find({ role: 'team_member', status: 'active' }).sort({ createdAt: 1 });
  if (activeMembers.length === 0) return null;

  // Find user with least assigned leads
  const counts = await Promise.all(
    activeMembers.map(async (u) => {
      const count = await Lead.countDocuments({ assignedTo: u._id, status: { $ne: 'Booked' } });
      return { user: u, count };
    })
  );

  counts.sort((a, b) => a.count - b.count);
  return counts[0].user;
};

// @desc Check duplicate phone number
// @route POST /api/leads/check-duplicate
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.json({ isDuplicate: false });
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const existing = await Lead.findOne({
      $or: [
        { phone: new RegExp(cleanPhone, 'i') },
        { whatsapp: new RegExp(cleanPhone, 'i') },
      ],
    }).populate('assignedTo', 'name email');

    if (existing) {
      return res.json({
        isDuplicate: true,
        existingLead: {
          id: existing._id,
          leadId: existing.leadId,
          customerName: existing.customerName,
          phone: existing.phone,
          status: existing.status,
          destination: existing.destination,
          assignedTo: existing.assignedTo ? existing.assignedTo.name : 'Unassigned',
          createdAt: existing.createdAt,
        },
      });
    }

    return res.json({ isDuplicate: false });
  } catch (error) {
    next(error);
  }
};

// @desc Get leads with pagination, search, & filtering
// @route GET /api/leads
exports.getLeads = async (req, res, next) => {
  try {
    const {
      search,
      status,
      source,
      priority,
      assignedTo,
      followUpFilter,
      startDate,
      endDate,
      view, // 'my_leads', 'unassigned', 'all'
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role scoping
    if (req.user.role === 'team_member') {
      if (view === 'my_leads') {
        query.assignedTo = req.user.id;
      } else if (view === 'unassigned') {
        query.assignedTo = null;
      } else {
        query.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
      }
    } else {
      // Admin filter options
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else if (assignedTo === 'my_leads') {
        query.assignedTo = req.user.id;
      } else if (assignedTo && assignedTo !== 'all') {
        query.assignedTo = assignedTo;
      }
    }

    // Search term
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { customerName: searchRegex },
          { phone: searchRegex },
          { whatsapp: searchRegex },
          { destination: searchRegex },
          { leadId: searchRegex },
          { campaignName: searchRegex },
        ],
      });
    }

    // Exact Filters
    if (status && status !== 'all') query.status = status;
    if (source && source !== 'all') query.source = source;
    if (priority && priority !== 'all') query.priority = priority;

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Follow-up Filters
    if (followUpFilter) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (followUpFilter === 'today') {
        query.nextFollowUpDate = { $gte: todayStart, $lte: todayEnd };
      } else if (followUpFilter === 'overdue') {
        query.nextFollowUpDate = { $lt: todayStart };
        query.status = { $nin: ['Booked', 'Lost', 'Not Interested'] };
      } else if (followUpFilter === 'upcoming') {
        query.nextFollowUpDate = { $gt: todayEnd };
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: leads,
      pagination: {
        total: totalLeads,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalLeads / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single lead detail
// @route GET /api/leads/:id
exports.getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc Create new lead
// @route POST /api/leads
exports.createLead = async (req, res, next) => {
  try {
    const {
      customerName,
      phone,
      whatsapp,
      email,
      destination,
      startDate,
      endDate,
      adults,
      children,
      budget,
      tripType,
      source,
      campaignName,
      adName,
      priority,
      assignedTo,
      nextFollowUpDate,
      estimatedValue,
      notes,
      autoAssignRoundRobin,
    } = req.body;

    if (!customerName || !phone || !destination || !source) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields: Customer Name, Phone, Destination, Source.',
      });
    }

    const leadId = await generateLeadId();
    let assignedUserId = assignedTo;

    // Handle Round Robin
    if (autoAssignRoundRobin && !assignedUserId) {
      const nextUser = await getNextRoundRobinUser();
      if (nextUser) {
        assignedUserId = nextUser._id;
      }
    }

    const lead = await Lead.create({
      leadId,
      customerName,
      phone,
      whatsapp: whatsapp || phone,
      email,
      destination,
      startDate: startDate || null,
      endDate: endDate || null,
      adults: adults || 1,
      children: children || 0,
      budget: budget || 0,
      tripType: tripType || 'Family',
      source,
      campaignName: campaignName || '',
      adName: adName || '',
      priority: priority || 'Medium',
      assignedTo: assignedUserId || null,
      createdBy: req.user.id,
      nextFollowUpDate: nextFollowUpDate || null,
      estimatedValue: estimatedValue || 0,
      notes: notes || '',
      status: 'New',
    });

    // Audit activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      type: 'created',
      description: `Lead created (${lead.leadId}) for ${lead.destination}`,
      metadata: { source, destination, createdBy: req.user.name },
    });

    if (assignedUserId) {
      const assignedUser = await User.findById(assignedUserId);
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'assigned',
        description: `Lead assigned to ${assignedUser ? assignedUser.name : 'Team Member'}`,
      });
    }

    if (nextFollowUpDate) {
      await Followup.create({
        leadId: lead._id,
        assignedTo: assignedUserId || req.user.id,
        scheduledAt: nextFollowUpDate,
        status: 'pending',
        notes: notes || 'Initial follow-up scheduled on lead creation',
      });
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'follow_up_scheduled',
        description: `Follow-up scheduled for ${new Date(nextFollowUpDate).toLocaleString()}`,
      });
    }

    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedLead });
  } catch (error) {
    next(error);
  }
};

// @desc Update lead details
// @route PUT /api/leads/:id
exports.updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const oldStatus = lead.status;
    const oldAssigned = lead.assignedTo;

    // Allowed updates
    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        lead[key] = updates[key];
      }
    });

    // Special status transitions
    if (updates.status === 'Booked' && oldStatus !== 'Booked') {
      lead.bookingDate = updates.bookingDate || new Date();
      lead.actualBookingValue = updates.actualBookingValue || lead.estimatedValue || 0;
      
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'booked',
        description: `Booking confirmed! Value: ₹${lead.actualBookingValue}`,
        metadata: { value: lead.actualBookingValue },
      });
    }

    if (updates.status === 'Quote Sent' && oldStatus !== 'Quote Sent') {
      lead.quoteDate = updates.quoteDate || new Date();
      lead.quoteAmount = updates.quoteAmount || lead.estimatedValue || 0;
      if (updates.quoteNotes) lead.quoteNotes = updates.quoteNotes;

      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'quote_sent',
        description: `Quote sent: ₹${lead.quoteAmount}`,
        metadata: { amount: lead.quoteAmount, notes: updates.quoteNotes },
      });
    }

    if (updates.status && updates.status !== oldStatus) {
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'status_change',
        description: `Status changed from '${oldStatus}' to '${updates.status}'`,
        metadata: { oldStatus, newStatus: updates.status },
      });
    }

    if (updates.assignedTo && String(updates.assignedTo) !== String(oldAssigned)) {
      const newAssignee = await User.findById(updates.assignedTo);
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'assigned',
        description: `Reassigned lead to ${newAssignee ? newAssignee.name : 'Unassigned'}`,
      });
    }

    await lead.save();

    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    res.json({ success: true, data: updatedLead });
  } catch (error) {
    next(error);
  }
};

// @desc Update lead status
// @route PATCH /api/leads/:id/status
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { status, bookingValue, quoteAmount, lostReason, notes } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const oldStatus = lead.status;
    lead.status = status;

    if (status === 'Booked') {
      lead.actualBookingValue = bookingValue !== undefined ? Number(bookingValue) : lead.estimatedValue;
      lead.bookingDate = new Date();
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'booked',
        description: `Booking confirmed with value ₹${lead.actualBookingValue}`,
      });
    } else if (status === 'Quote Sent') {
      lead.quoteAmount = quoteAmount !== undefined ? Number(quoteAmount) : lead.estimatedValue;
      lead.quoteDate = new Date();
      if (notes) lead.quoteNotes = notes;
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'quote_sent',
        description: `Quote sent for amount ₹${lead.quoteAmount}`,
      });
    } else if (status === 'Lost') {
      if (lostReason) lead.lostReason = lostReason;
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'lost',
        description: `Lead marked as lost. Reason: ${lostReason || 'N/A'}`,
      });
    } else {
      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'status_change',
        description: `Status changed from '${oldStatus}' to '${status}'`,
      });
    }

    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc Assign/Reassign Lead
// @route PATCH /api/leads/:id/assign
exports.assignLead = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    lead.assignedTo = assignedTo || null;
    await lead.save();

    const assignee = assignedTo ? await User.findById(assignedTo) : null;
    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      type: 'assigned',
      description: assignedTo
        ? `Lead assigned to ${assignee ? assignee.name : 'Team Member'}`
        : 'Lead unassigned',
    });

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc Delete Lead (Admin only)
// @route DELETE /api/leads/:id
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    await Activity.deleteMany({ leadId: req.params.id });
    await Followup.deleteMany({ leadId: req.params.id });

    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
