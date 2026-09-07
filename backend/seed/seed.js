const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const Activity = require('../src/models/Activity');
const Followup = require('../src/models/Followup');

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Activity.deleteMany({});
    await Followup.deleteMany({});

    console.log('[Seed] Creating team members (Amit & Hardik)...');
    const amit = await User.create({
      name: 'Amit (Admin)',
      email: 'amit@mytripwala.com',
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });

    const hardik = await User.create({
      name: 'Hardik',
      email: 'hardik@mytripwala.com',
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });

    const team = [amit, hardik];

    console.log('[Seed] Creating sample Indian travel leads...');

    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 5);
    const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 18);

    const indianServices = [
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

    const sampleLeadsData = [
      {
        leadId: 'TRV-1001',
        customerName: 'Rahul Verma',
        phone: '+919876543210',
        whatsapp: '+919876543210',
        email: 'rahul.verma@example.com',
        destination: 'Manali - Kasol 4N/5D',
        adults: 2,
        children: 0,
        budget: 15000,
        tripType: 'Honeymoon',
        source: 'Meta/Facebook Ads',
        campaignName: 'Manali_Kasol_Summer_2026',
        adName: 'Manali_Snow_Video_Ad',
        status: 'Booked',
        priority: 'High',
        assignedTo: amit._id,
        createdBy: amit._id,
        estimatedValue: 15000,
        actualBookingValue: 16500,
        bookingDate: yesterday,
        notes: 'Requested VOLVO bus option and cottage stay.',
        createdAt: lastMonth,
      },
      {
        leadId: 'TRV-1002',
        customerName: 'Anita Gupta',
        phone: '+919812345678',
        whatsapp: '+919812345678',
        email: 'anita.g@example.com',
        destination: 'Chopta - Tungnath 4N/5D',
        adults: 2,
        children: 2,
        budget: 22000,
        tripType: 'Family',
        source: 'Meta/Facebook Ads',
        campaignName: 'Trekking_North_India_Special',
        adName: 'Tungnath_Temple_Trek_Ad',
        status: 'Quote Sent',
        priority: 'Urgent',
        assignedTo: hardik._id,
        createdBy: amit._id,
        estimatedValue: 22000,
        quoteAmount: 21500,
        quoteDate: yesterday,
        quoteNotes: 'Shared complete itinerary with Deoriatal camping.',
        nextFollowUpDate: today,
        createdAt: lastWeek,
      },
      {
        leadId: 'TRV-1003',
        customerName: 'Deepak Malhotra',
        phone: '+919711223344',
        whatsapp: '+919711223344',
        email: 'deepak.m@example.com',
        destination: 'Yulla Kanda 4N/5D',
        adults: 4,
        children: 0,
        budget: 28000,
        tripType: 'Group',
        source: 'Instagram',
        campaignName: 'Himachal_Hidden_Gems',
        adName: 'YullaKanda_Krishna_Temple_Reel',
        status: 'Follow-up Required',
        priority: 'High',
        assignedTo: hardik._id,
        createdBy: hardik._id,
        estimatedValue: 28000,
        nextFollowUpDate: lastWeek,
        notes: 'Enquired about trekking equipment and local guide.',
        createdAt: lastWeek,
      },
      {
        leadId: 'TRV-1004',
        customerName: 'Sanjay Dutt',
        phone: '+919898989898',
        whatsapp: '+919898989898',
        email: 'sanjay.d@example.com',
        destination: 'Char Dham 10N/11D',
        adults: 3,
        children: 0,
        budget: 65000,
        tripType: 'Family',
        source: 'WhatsApp',
        campaignName: '',
        adName: '',
        status: 'Booked',
        priority: 'High',
        assignedTo: amit._id,
        createdBy: amit._id,
        estimatedValue: 65000,
        actualBookingValue: 68000,
        bookingDate: today,
        createdAt: lastWeek,
      },
      {
        leadId: 'TRV-1005',
        customerName: 'Pooja Mehta',
        phone: '+919988776655',
        whatsapp: '+919988776655',
        email: 'pooja.mehta@example.com',
        destination: 'Udaipur - Mount Abu 2N/3D',
        adults: 2,
        children: 0,
        budget: 18000,
        tripType: 'Honeymoon',
        source: 'Website',
        campaignName: '',
        adName: '',
        status: 'New',
        priority: 'Medium',
        assignedTo: amit._id,
        createdBy: amit._id,
        estimatedValue: 18000,
        notes: 'Submitted enquiry for Lake Pichola heritage hotel stay.',
        createdAt: today,
      },
    ];

    const createdLeads = await Lead.insertMany(sampleLeadsData);
    console.log(`[Seed] Created ${createdLeads.length} Indian travel leads successfully!`);

    console.log('[Seed] Creating activities and follow-ups...');
    for (const lead of createdLeads) {
      await Activity.create({
        leadId: lead._id,
        userId: lead.createdBy,
        type: 'created',
        description: `Lead created (${lead.leadId}) for ${lead.destination} via ${lead.source}`,
      });

      if (lead.assignedTo) {
        await Activity.create({
          leadId: lead._id,
          userId: lead.createdBy,
          type: 'assigned',
          description: `Assigned lead to team member`,
        });
      }

      if (lead.status === 'Booked') {
        await Activity.create({
          leadId: lead._id,
          userId: lead.assignedTo || amit._id,
          type: 'booked',
          description: `Booking confirmed! Total amount ₹${lead.actualBookingValue}`,
        });
      } else if (lead.nextFollowUpDate) {
        const isOverdue = lead.nextFollowUpDate < today;
        await Followup.create({
          leadId: lead._id,
          assignedTo: lead.assignedTo || amit._id,
          scheduledAt: lead.nextFollowUpDate,
          status: 'pending',
          notes: isOverdue ? 'URGENT: Overdue call regarding custom quotation details.' : 'Scheduled follow-up call to finalize dates.',
        });
      }
    }

    console.log('====================================================');
    console.log(' SEED COMPLETED SUCCESSFULLY!');
    console.log(' Credentials:');
    console.log(' Amit (Main Admin): amit@mytripwala.com / Password123!');
    console.log(' Hardik (Admin/Team): hardik@mytripwala.com / Password123!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
