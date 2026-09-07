const Followup = require('../models/Followup');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

// @desc Get follow-ups with filters (today, overdue, upcoming)
// @route GET /api/followups
exports.getFollowups = async (req, res, next) => {
  try {
    const { status, filter } = req.query;
    const query = {};

    // Role restriction
    if (req.user.role === 'team_member') {
      query.assignedTo = req.user.id;
    }

    if (status) query.status = status;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (filter === 'today') {
      query.scheduledAt = { $gte: todayStart, $lte: todayEnd };
      if (!status) query.status = 'pending';
    } else if (filter === 'overdue') {
      query.scheduledAt = { $lt: todayStart };
      query.status = 'pending';
    } else if (filter === 'upcoming') {
      query.scheduledAt = { $gt: todayEnd };
      if (!status) query.status = 'pending';
    }

    const followups = await Followup.find(query)
      .sort({ scheduledAt: 1 })
      .populate({
        path: 'leadId',
        select: 'leadId customerName phone whatsapp destination status priority source estimatedValue',
      })
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: followups });
  } catch (error) {
    next(error);
  }
};

// @desc Create new follow-up
// @route POST /api/followups
exports.createFollowup = async (req, res, next) => {
  try {
    const { leadId, scheduledAt, notes, assignedTo } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const followup = await Followup.create({
      leadId,
      assignedTo: assignedTo || lead.assignedTo || req.user.id,
      scheduledAt,
      notes: notes || '',
      status: 'pending',
    });

    // Sync Lead's nextFollowUpDate
    lead.nextFollowUpDate = scheduledAt;
    await lead.save();

    await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      type: 'follow_up_scheduled',
      description: `Follow-up scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      metadata: { notes },
    });

    const populated = await Followup.findById(followup._id)
      .populate('leadId', 'leadId customerName phone whatsapp destination status priority')
      .populate('assignedTo', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc Complete a follow-up and optionally schedule next one
// @route PATCH /api/followups/:id/complete
exports.completeFollowup = async (req, res, next) => {
  try {
    const { completionNotes, nextScheduledAt, nextNotes, updateStatus } = req.body;

    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }

    followup.status = 'completed';
    followup.completedAt = new Date();
    if (completionNotes) {
      followup.notes = (followup.notes ? followup.notes + ' | ' : '') + `Completed note: ${completionNotes}`;
    }
    await followup.save();

    const lead = await Lead.findById(followup.leadId);
    if (lead) {
      lead.lastContactedAt = new Date();
      if (updateStatus) {
        lead.status = updateStatus;
      }

      if (nextScheduledAt) {
        lead.nextFollowUpDate = nextScheduledAt;
        await Followup.create({
          leadId: lead._id,
          assignedTo: followup.assignedTo,
          scheduledAt: nextScheduledAt,
          status: 'pending',
          notes: nextNotes || 'Next follow-up',
        });
      } else {
        lead.nextFollowUpDate = null;
      }
      await lead.save();

      await Activity.create({
        leadId: lead._id,
        userId: req.user.id,
        type: 'follow_up_completed',
        description: `Follow-up completed${completionNotes ? `: ${completionNotes}` : ''}`,
      });
    }

    res.json({ success: true, message: 'Follow-up completed.', data: followup });
  } catch (error) {
    next(error);
  }
};

// @desc Delete follow-up
// @route DELETE /api/followups/:id
exports.deleteFollowup = async (req, res, next) => {
  try {
    const followup = await Followup.findByIdAndDelete(req.params.id);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found.' });
    }
    res.json({ success: true, message: 'Follow-up deleted.' });
  } catch (error) {
    next(error);
  }
};
