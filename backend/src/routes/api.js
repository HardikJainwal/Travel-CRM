const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const authController = require('../controllers/authController');
const leadController = require('../controllers/leadController');
const activityController = require('../controllers/activityController');
const followupController = require('../controllers/followupController');
const dashboardController = require('../controllers/dashboardController');
const userController = require('../controllers/userController');

// 1. Auth Routes
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', protect, authController.getMe);

// 2. Lead Routes
router.post('/leads/check-duplicate', protect, leadController.checkDuplicate);
router.get('/leads', protect, leadController.getLeads);
router.post('/leads', protect, leadController.createLead);
router.get('/leads/:id', protect, leadController.getLeadById);
router.put('/leads/:id', protect, leadController.updateLead);
router.patch('/leads/:id/status', protect, leadController.updateLeadStatus);
router.patch('/leads/:id/assign', protect, authorize('admin'), leadController.assignLead);
router.delete('/leads/:id', protect, authorize('admin'), leadController.deleteLead);

// 3. Activity Routes
router.get('/leads/:id/activities', protect, activityController.getLeadActivities);
router.post('/leads/:id/activities', protect, activityController.addLeadActivity);

// 4. Followup Routes
router.get('/followups', protect, followupController.getFollowups);
router.post('/followups', protect, followupController.createFollowup);
router.patch('/followups/:id/complete', protect, followupController.completeFollowup);
router.delete('/followups/:id', protect, followupController.deleteFollowup);

// 5. Dashboard Routes
router.get('/dashboard/stats', protect, dashboardController.getStats);
router.get('/dashboard/sources', protect, dashboardController.getLeadSources);
router.get('/dashboard/pipeline', protect, dashboardController.getPipelines);
router.get('/dashboard/trends', protect, dashboardController.getTrends);
router.get('/dashboard/team-performance', protect, authorize('admin'), dashboardController.getTeamPerformance);

// 6. User Management Routes (Admin Only)
router.get('/users', protect, authorize('admin'), userController.getUsers);
router.post('/users', protect, authorize('admin'), userController.createUser);
router.put('/users/:id', protect, authorize('admin'), userController.updateUser);
router.patch('/users/:id/status', protect, authorize('admin'), userController.updateUserStatus);
router.patch('/users/:id/reset-password', protect, authorize('admin'), userController.resetPassword);

module.exports = router;
