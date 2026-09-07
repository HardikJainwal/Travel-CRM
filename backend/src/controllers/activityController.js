const Activity = require('../models/Activity');
const Lead = require('../models/Lead');

// @desc Get activities for a lead
// @route GET /api/leads/:id/activities
exports.getLeadActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ leadId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role');

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// @desc Add a custom activity / note / call / whatsapp interaction
// @route POST /api/leads/:id/activities
exports.addLeadActivity = async (req, res, next) => {
  try {
    const { type, description, metadata } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    if (!type || !description) {
      return res.status(400).json({ success: false, message: 'Type and description are required.' });
    }

    const activity = await Activity.create({
      leadId: lead._id,
      userId: req.user.id,
      type,
      description,
      metadata: metadata || {},
    });

    // Update last contacted date if communication activity
    if (['whatsapp_message', 'call', 'email'].includes(type)) {
      lead.lastContactedAt = new Date();
      if (lead.status === 'New') {
        lead.status = 'Contacted';
      }
      await lead.save();
    }

    const populated = await Activity.findById(activity._id).populate('userId', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
