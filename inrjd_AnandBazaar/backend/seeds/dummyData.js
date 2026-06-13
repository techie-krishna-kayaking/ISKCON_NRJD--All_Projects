/**
 * Seed dummy transactional data: orders, stock entries, procurement, invoices, payments, notifications.
 * Run: node seeds/dummyData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');
const RawMaterial = require('../models/RawMaterial');
const Order = require('../models/Order');
const StockEntry = require('../models/StockEntry');
const Procurement = require('../models/Procurement');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

async function seedDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anandbazaar');
    console.log('Connected to MongoDB');

    // Clear transactional data only (keep master data)
    await Promise.all([
      Order.deleteMany({}),
      StockEntry.deleteMany({}),
      Procurement.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('Cleared old transactional data');

    // Get references
    const admin = await User.findOne({ email: 'admin@anandbazaar.com' });
    const stockUser = await User.findOne({ email: 'stock@anandbazaar.com' });
    const procUser = await User.findOne({ email: 'procurement@anandbazaar.com' });
    const customer = await User.findOne({ email: 'customer@test.com' });

    const foodItems = await FoodItem.find({}).sort({ sortOrder: 1 });
    const rawMaterials = await RawMaterial.find({}).sort({ name: 1 });

    if (!admin || !customer || foodItems.length === 0 || rawMaterials.length === 0) {
      console.error('Master data not found. Run "npm run seed" first.');
      process.exit(1);
    }

    // ─── ORDERS ───────────────────────────────────────────────
    const rice = foodItems.find(f => f.name.includes('Govinda'));
    const khichdi = foodItems.find(f => f.name === 'Khichdi');
    const dalTadka = foodItems.find(f => f.name === 'Dal Tadka');
    const dalFry = foodItems.find(f => f.name === 'Dal Fry');
    const puri = foodItems.find(f => f.name === 'Puri');
    const roti = foodItems.find(f => f.name === 'Roti');
    const aloo = foodItems.find(f => f.name === 'Aloo Sabji');
    const paneer = foodItems.find(f => f.name === 'Paneer Butter Masala');
    const kheer = foodItems.find(f => f.name === 'Kheer');
    const gulab = foodItems.find(f => f.name === 'Gulab Jamun');
    const raita = foodItems.find(f => f.name === 'Raita');
    const papadF = foodItems.find(f => f.name === 'Papad (Fried)');
    const mixed = foodItems.find(f => f.name === 'Mixed Vegetable');
    const laddu = foodItems.find(f => f.name === 'Laddu');
    const chole = foodItems.find(f => f.name === 'Chole Masala');
    const salad = foodItems.find(f => f.name === 'Salad');

    const makeItem = (fi, qty) => ({
      foodItem: fi._id,
      name: fi.name,
      quantity: qty,
      pricePerUnit: fi.pricePerPlate || 0,
      totalPrice: (fi.pricePerPlate || 0) * qty,
    });

    // Order 1: Completed with full lifecycle (paid)
    const order1 = await Order.create({
      customer: customer._id,
      customerName: 'Test Customer',
      customerEmail: 'customer@test.com',
      customerPhone: '+919999999996',
      eventDate: new Date('2026-04-20'),
      venue: 'ISKCON Temple, Vrindavan',
      numberOfAdults: 100,
      numberOfKids: 30,
      specialInstructions: 'Please prepare extra kheer for children',
      items: [makeItem(rice, 1), makeItem(dalTadka, 1), makeItem(puri, 1), makeItem(aloo, 1), makeItem(kheer, 1), makeItem(raita, 1)],
      extras: [
        { type: 'water_bottle', label: 'Water Bottle (500ml)', size: '500ml', quantity: 100, pricePerUnit: 20, totalPrice: 2000 },
        { type: 'tissue', label: 'Tissue Pack', quantity: 50, pricePerUnit: 5, totalPrice: 250 },
      ],
      pricePerPlate: 150,
      subtotal: 17250,
      extrasTotal: 2250,
      totalAmount: 19500,
      paidAmount: 19500,
      pendingAmount: 0,
      status: 'completed',
      statusHistory: [
        { status: 'placed', changedBy: customer._id, remarks: 'Order placed', timestamp: new Date('2026-04-10T10:00:00') },
        { status: 'under_review', changedBy: admin._id, remarks: 'Reviewing', timestamp: new Date('2026-04-10T14:00:00') },
        { status: 'approved', changedBy: admin._id, remarks: 'Approved', timestamp: new Date('2026-04-11T09:00:00') },
        { status: 'invoiced', changedBy: admin._id, remarks: 'Invoice sent', timestamp: new Date('2026-04-11T10:00:00') },
        { status: 'paid', changedBy: admin._id, remarks: 'Full payment received via UPI', timestamp: new Date('2026-04-12T11:00:00') },
        { status: 'completed', changedBy: admin._id, remarks: 'Event successfully completed', timestamp: new Date('2026-04-20T22:00:00') },
      ],
      approvedBy: admin._id,
      approvedAt: new Date('2026-04-11T09:00:00'),
    });

    // Order 2: Approved & invoiced, partially paid
    const order2 = await Order.create({
      customer: customer._id,
      customerName: 'Radhika Sharma',
      customerEmail: 'radhika.sharma@gmail.com',
      customerPhone: '+919876543210',
      eventDate: new Date('2026-04-25'),
      venue: 'Jagannath Mandir, Puri',
      numberOfAdults: 200,
      numberOfKids: 50,
      specialInstructions: 'Pure sattvic, no onion no garlic',
      items: [makeItem(rice, 1), makeItem(khichdi, 1), makeItem(dalFry, 1), makeItem(paneer, 1), makeItem(puri, 1), makeItem(gulab, 1), makeItem(raita, 1), makeItem(papadF, 1)],
      extras: [
        { type: 'water_bottle', label: 'Water Bottle (1L)', size: '1L', quantity: 200, pricePerUnit: 30, totalPrice: 6000 },
        { type: 'tissue', label: 'Tissue Pack', quantity: 100, pricePerUnit: 5, totalPrice: 500 },
      ],
      pricePerPlate: 180,
      subtotal: 40500,
      extrasTotal: 6500,
      totalAmount: 47000,
      paidAmount: 25000,
      pendingAmount: 22000,
      status: 'partially_paid',
      statusHistory: [
        { status: 'placed', changedBy: customer._id, remarks: 'Order placed', timestamp: new Date('2026-04-12T08:00:00') },
        { status: 'approved', changedBy: admin._id, remarks: 'Approved after call', timestamp: new Date('2026-04-12T16:00:00') },
        { status: 'invoiced', changedBy: admin._id, remarks: 'Invoice generated', timestamp: new Date('2026-04-13T09:00:00') },
        { status: 'partially_paid', changedBy: admin._id, remarks: 'Advance ₹25,000 received', timestamp: new Date('2026-04-14T11:00:00') },
      ],
      approvedBy: admin._id,
      approvedAt: new Date('2026-04-12T16:00:00'),
    });

    // Order 3: Placed, awaiting review
    const order3 = await Order.create({
      customer: customer._id,
      customerName: 'Govind Das',
      customerEmail: 'govind.das@yahoo.com',
      customerPhone: '+919123456789',
      eventDate: new Date('2026-05-01'),
      venue: 'NRJD Community Hall, Bangalore',
      numberOfAdults: 50,
      numberOfKids: 20,
      items: [makeItem(rice, 1), makeItem(dalTadka, 1), makeItem(roti, 1), makeItem(mixed, 1), makeItem(laddu, 1)],
      extras: [
        { type: 'water_bottle', label: 'Water Bottle (500ml)', size: '500ml', quantity: 60, pricePerUnit: 20, totalPrice: 1200 },
      ],
      status: 'placed',
      statusHistory: [
        { status: 'placed', changedBy: customer._id, remarks: 'Order placed', timestamp: new Date('2026-04-17T15:00:00') },
      ],
    });

    // Order 4: Under review
    const order4 = await Order.create({
      customer: customer._id,
      customerName: 'Meera Devi',
      customerEmail: 'meera.devi@outlook.com',
      customerPhone: '+919988776655',
      eventDate: new Date('2026-05-10'),
      venue: 'Radha Krishna Temple, Delhi',
      numberOfAdults: 300,
      numberOfKids: 80,
      specialInstructions: 'Need paneer in every dish. Arrange stage decoration too.',
      items: [makeItem(rice, 1), makeItem(dalFry, 1), makeItem(paneer, 1), makeItem(puri, 1), makeItem(chole, 1), makeItem(gulab, 1), makeItem(salad, 1), makeItem(raita, 1), makeItem(papadF, 1)],
      extras: [
        { type: 'water_bottle', label: 'Water Bottle (1L)', size: '1L', quantity: 300, pricePerUnit: 30, totalPrice: 9000 },
        { type: 'tissue', label: 'Tissue Pack', quantity: 200, pricePerUnit: 5, totalPrice: 1000 },
      ],
      status: 'under_review',
      statusHistory: [
        { status: 'placed', changedBy: customer._id, remarks: 'Order placed', timestamp: new Date('2026-04-16T10:00:00') },
        { status: 'under_review', changedBy: admin._id, remarks: 'Large order - needs verification', timestamp: new Date('2026-04-16T14:00:00') },
      ],
    });

    // Order 5: Approved but not yet invoiced
    const order5 = await Order.create({
      customer: customer._id,
      customerName: 'Hari Prasad',
      customerEmail: 'hari.prasad@gmail.com',
      customerPhone: '+919555444333',
      eventDate: new Date('2026-04-28'),
      venue: 'Govardhan Eco Village, Maharashtra',
      numberOfAdults: 150,
      numberOfKids: 40,
      items: [makeItem(rice, 1), makeItem(khichdi, 1), makeItem(dalTadka, 1), makeItem(aloo, 1), makeItem(puri, 1), makeItem(kheer, 1)],
      extras: [
        { type: 'water_bottle', label: 'Water Bottle (500ml)', size: '500ml', quantity: 150, pricePerUnit: 20, totalPrice: 3000 },
      ],
      pricePerPlate: 160,
      subtotal: 27200,
      extrasTotal: 3000,
      totalAmount: 30200,
      status: 'approved',
      statusHistory: [
        { status: 'placed', changedBy: customer._id, timestamp: new Date('2026-04-14T09:00:00') },
        { status: 'approved', changedBy: admin._id, remarks: 'Confirmed with customer', timestamp: new Date('2026-04-15T10:00:00') },
      ],
      approvedBy: admin._id,
      approvedAt: new Date('2026-04-15T10:00:00'),
    });

    console.log(`✅ Created 5 orders`);

    // ─── INVOICES ─────────────────────────────────────────────
    const invoice1 = await Invoice.create({
      order: order1._id,
      customer: customer._id,
      customerName: 'Test Customer',
      customerEmail: 'customer@test.com',
      customerPhone: '+919999999996',
      items: order1.items.map(i => ({ name: i.name, quantity: i.quantity, unit: 'plates', pricePerUnit: i.pricePerUnit, total: i.totalPrice })),
      extras: order1.extras.map(e => ({ label: e.label, quantity: e.quantity, pricePerUnit: e.pricePerUnit, total: e.totalPrice })),
      numberOfAdults: 100,
      numberOfKids: 30,
      pricePerPlate: 150,
      subtotal: 17250,
      extrasTotal: 2250,
      totalAmount: 19500,
      paidAmount: 19500,
      pendingAmount: 0,
      paymentStatus: 'paid',
      eventDate: order1.eventDate,
      venue: order1.venue,
      generatedBy: admin._id,
    });

    const invoice2 = await Invoice.create({
      order: order2._id,
      customer: customer._id,
      customerName: 'Radhika Sharma',
      customerEmail: 'radhika.sharma@gmail.com',
      customerPhone: '+919876543210',
      items: order2.items.map(i => ({ name: i.name, quantity: i.quantity, unit: 'plates', pricePerUnit: i.pricePerUnit, total: i.totalPrice })),
      extras: order2.extras.map(e => ({ label: e.label, quantity: e.quantity, pricePerUnit: e.pricePerUnit, total: e.totalPrice })),
      numberOfAdults: 200,
      numberOfKids: 50,
      pricePerPlate: 180,
      subtotal: 40500,
      extrasTotal: 6500,
      totalAmount: 47000,
      paidAmount: 25000,
      pendingAmount: 22000,
      paymentStatus: 'partially_paid',
      eventDate: order2.eventDate,
      venue: order2.venue,
      generatedBy: admin._id,
    });

    console.log(`✅ Created 2 invoices`);

    // ─── PAYMENTS ─────────────────────────────────────────────
    await Payment.create({
      order: order1._id,
      invoice: invoice1._id,
      amount: 10000,
      mode: 'upi',
      upiReference: 'UPI-TXN-20260412-AB001',
      upiId: 'customer@paytm',
      paymentDate: new Date('2026-04-12T10:00:00'),
      recordedBy: admin._id,
      remarks: 'Advance payment via UPI',
    });

    await Payment.create({
      order: order1._id,
      invoice: invoice1._id,
      amount: 9500,
      mode: 'cash',
      cashRemarks: 'Cash collected at venue after event',
      collectedBy: admin._id,
      paymentDate: new Date('2026-04-20T20:00:00'),
      recordedBy: admin._id,
      remarks: 'Final payment - cash at venue',
    });

    await Payment.create({
      order: order2._id,
      invoice: invoice2._id,
      amount: 25000,
      mode: 'upi',
      upiReference: 'UPI-TXN-20260414-AB002',
      upiId: 'radhika@gpay',
      paymentDate: new Date('2026-04-14T11:00:00'),
      recordedBy: admin._id,
      remarks: 'Advance payment',
    });

    console.log(`✅ Created 3 payments`);

    // ─── STOCK ENTRIES ────────────────────────────────────────
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const stockEntryItems = rawMaterials.map(m => ({
      rawMaterial: m._id,
      name: m.name,
      unit: m.unit,
      quantity: m.currentStock,
      previousQuantity: m.currentStock + Math.floor(Math.random() * 5),
    }));

    await StockEntry.create({
      date: twoDaysAgo,
      items: stockEntryItems.map(i => ({ ...i, quantity: i.quantity + 3 })),
      submittedBy: stockUser._id,
      isComplete: true,
      notes: 'Regular daily stock count - all items checked',
    });

    await StockEntry.create({
      date: yesterday,
      items: stockEntryItems.map(i => ({ ...i, quantity: i.quantity + 1 })),
      submittedBy: stockUser._id,
      isComplete: true,
      notes: 'Used stock for temple cooking + Govind Das housewarming prep',
    });

    await StockEntry.create({
      date: today,
      items: stockEntryItems,
      submittedBy: stockUser._id,
      isComplete: true,
      notes: 'Today\'s morning stock count',
    });

    console.log(`✅ Created 3 stock entries`);

    // Make some materials low-stock for alerts
    const lowStockIds = rawMaterials.slice(0, 6).map(m => m._id);
    await RawMaterial.updateMany(
      { _id: { $in: lowStockIds } },
      [{ $set: { currentStock: { $multiply: ['$minimumStock', 0.4] } } }]
    );
    console.log(`✅ Set 6 raw materials to low-stock for alerts`);

    // ─── PROCUREMENT ──────────────────────────────────────────
    // Procurement for order 1 (completed)
    const procItems1 = rawMaterials.slice(0, 8).map(m => ({
      rawMaterial: m._id,
      name: m.name,
      requiredQuantity: m.minimumStock * 3,
      currentStock: m.currentStock,
      shortage: Math.max(0, m.minimumStock * 3 - m.currentStock),
      unit: m.unit,
      purchasedQuantity: m.minimumStock * 3,
      costPerUnit: m.costPerUnit,
      totalCost: m.minimumStock * 3 * m.costPerUnit,
      status: 'purchased',
    }));

    await Procurement.create({
      order: order1._id,
      date: new Date('2026-04-12'),
      items: procItems1,
      overallStatus: 'delivered',
      assignedTo: procUser._id,
      createdBy: admin._id,
      notes: 'All materials procured for ISKCON Temple event',
      totalEstimatedCost: procItems1.reduce((s, i) => s + i.totalCost, 0),
      totalActualCost: procItems1.reduce((s, i) => s + i.totalCost, 0),
    });

    // Procurement for order 2 (in progress)
    const procItems2 = rawMaterials.slice(0, 12).map((m, idx) => ({
      rawMaterial: m._id,
      name: m.name,
      requiredQuantity: m.minimumStock * 5,
      currentStock: m.currentStock,
      shortage: Math.max(0, m.minimumStock * 5 - m.currentStock),
      unit: m.unit,
      purchasedQuantity: idx < 6 ? m.minimumStock * 5 : 0,
      costPerUnit: m.costPerUnit,
      totalCost: idx < 6 ? m.minimumStock * 5 * m.costPerUnit : 0,
      status: idx < 6 ? 'purchased' : 'pending',
    }));

    await Procurement.create({
      order: order2._id,
      date: new Date('2026-04-15'),
      items: procItems2,
      overallStatus: 'in_progress',
      assignedTo: procUser._id,
      createdBy: admin._id,
      notes: 'Partially procured for Jagannath Mandir event - 6 of 12 items done',
      totalEstimatedCost: procItems2.reduce((s, i) => s + (i.requiredQuantity * i.costPerUnit), 0),
      totalActualCost: procItems2.filter(i => i.status === 'purchased').reduce((s, i) => s + i.totalCost, 0),
    });

    // Procurement for order 5 (pending)
    const procItems5 = rawMaterials.slice(0, 10).map(m => ({
      rawMaterial: m._id,
      name: m.name,
      requiredQuantity: m.minimumStock * 4,
      currentStock: m.currentStock,
      shortage: Math.max(0, m.minimumStock * 4 - m.currentStock),
      unit: m.unit,
      purchasedQuantity: 0,
      costPerUnit: m.costPerUnit,
      totalCost: 0,
      status: 'pending',
    }));

    await Procurement.create({
      order: order5._id,
      date: new Date('2026-04-18'),
      items: procItems5,
      overallStatus: 'pending',
      assignedTo: procUser._id,
      createdBy: admin._id,
      notes: 'New procurement needed for Govardhan Eco Village event',
      totalEstimatedCost: procItems5.reduce((s, i) => s + (i.requiredQuantity * i.costPerUnit), 0),
    });

    console.log(`✅ Created 3 procurement records`);

    // ─── NOTIFICATIONS ────────────────────────────────────────
    const notifications = [
      // Admin notifications
      { user: admin._id, title: 'New Order Received', message: `Order #${order1.orderNumber} placed by Test Customer for 100 adults on 4/20/2026.`, event: 'order_placed', channel: 'in_app', isRead: true },
      { user: admin._id, title: 'New Order Received', message: `Order #${order2.orderNumber} placed by Radhika Sharma for 200 adults.`, event: 'order_placed', channel: 'in_app', isRead: true },
      { user: admin._id, title: 'New Order Received', message: `Order #${order3.orderNumber} placed by Govind Das for 50 adults at NRJD Community Hall.`, event: 'order_placed', channel: 'in_app', isRead: false },
      { user: admin._id, title: 'New Order Received', message: `Order #${order4.orderNumber} placed by Meera Devi for 300 adults - LARGE ORDER.`, event: 'order_placed', channel: 'in_app', isRead: false },
      { user: admin._id, title: 'New Order Received', message: `Order #${order5.orderNumber} placed by Hari Prasad for 150 adults.`, event: 'order_placed', channel: 'in_app', isRead: false },
      { user: admin._id, title: 'Payment Received', message: `₹10,000 UPI payment received for order #${order1.orderNumber}.`, event: 'payment_recorded', channel: 'in_app', isRead: true },
      { user: admin._id, title: 'Payment Received', message: `₹9,500 cash collected for order #${order1.orderNumber}. Fully paid!`, event: 'payment_recorded', channel: 'in_app', isRead: true },
      { user: admin._id, title: 'Payment Received', message: `₹25,000 UPI advance for order #${order2.orderNumber}. ₹22,000 pending.`, event: 'payment_recorded', channel: 'in_app', isRead: false },
      { user: admin._id, title: 'Procurement Complete', message: `All materials procured for order #${order1.orderNumber}.`, event: 'procurement_completed', channel: 'in_app', isRead: true },
      { user: admin._id, title: 'Low Stock Alert', message: '6 raw materials are below minimum stock levels. Check stock alerts.', event: 'low_stock_alert', channel: 'in_app', isRead: false },

      // Customer notifications
      { user: customer._id, title: 'Order Confirmed', message: `Your order #${order1.orderNumber} has been approved! Invoice has been sent.`, event: 'order_approved', channel: 'in_app', isRead: true },
      { user: customer._id, title: 'Order Confirmed', message: `Your order #${order2.orderNumber} has been approved! Please check your invoice.`, event: 'order_approved', channel: 'in_app', isRead: false },
      { user: customer._id, title: 'Order Placed', message: `Your order #${order3.orderNumber} has been placed. We will review and contact you soon.`, event: 'order_placed', channel: 'in_app', isRead: false },
      { user: customer._id, title: 'Order Under Review', message: `Your order #${order4.orderNumber} is being reviewed by our team.`, event: 'order_updated', channel: 'in_app', isRead: false },
      { user: customer._id, title: 'Order Approved', message: `Your order #${order5.orderNumber} for Govardhan Eco Village has been approved!`, event: 'order_approved', channel: 'in_app', isRead: false },
      { user: customer._id, title: 'Payment Received', message: `We received ₹25,000 for order #${order2.orderNumber}. Balance: ₹22,000.`, event: 'payment_recorded', channel: 'in_app', isRead: false },
      { user: customer._id, title: 'Event Completed', message: `Order #${order1.orderNumber} is now completed. Hare Krishna! Thank you for choosing AnandBazaar.`, event: 'order_updated', channel: 'in_app', isRead: false },

      // Stock team notifications
      { user: stockUser._id, title: 'Daily Stock Reminder', message: 'Good morning! Please complete today\'s stock-taking. 🙏', event: 'stock_reminder', channel: 'in_app', isRead: false },
      { user: stockUser._id, title: 'Low Stock Alert', message: 'Basmati Rice, Regular Rice, Toor Dal are running low. Please inform procurement.', event: 'low_stock_alert', channel: 'in_app', isRead: false },

      // Procurement notifications
      { user: procUser._id, title: 'New Procurement Needed', message: `Materials needed for order #${order5.orderNumber} at Govardhan Eco Village (150 adults). 10 items to procure.`, event: 'procurement_needed', channel: 'in_app', isRead: false },
      { user: procUser._id, title: 'Procurement In Progress', message: `6 of 12 items purchased for order #${order2.orderNumber}. Continue procurement.`, event: 'procurement_needed', channel: 'in_app', isRead: false },
    ];

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // ─── AUDIT LOGS ───────────────────────────────────────────
    const auditLogs = [
      { action: 'order_placed', entity: 'Order', entityId: order1._id, performedBy: customer._id, changes: { status: 'placed' } },
      { action: 'order_approved', entity: 'Order', entityId: order1._id, performedBy: admin._id, changes: { status: 'approved', pricePerPlate: 150 } },
      { action: 'invoice_generated', entity: 'Invoice', entityId: invoice1._id, performedBy: admin._id, changes: { totalAmount: 19500 } },
      { action: 'payment_recorded', entity: 'Payment', entityId: order1._id, performedBy: admin._id, changes: { amount: 10000, mode: 'upi' } },
      { action: 'payment_recorded', entity: 'Payment', entityId: order1._id, performedBy: admin._id, changes: { amount: 9500, mode: 'cash' } },
      { action: 'order_placed', entity: 'Order', entityId: order2._id, performedBy: customer._id, changes: { status: 'placed' } },
      { action: 'order_approved', entity: 'Order', entityId: order2._id, performedBy: admin._id, changes: { status: 'approved', pricePerPlate: 180 } },
      { action: 'invoice_generated', entity: 'Invoice', entityId: invoice2._id, performedBy: admin._id, changes: { totalAmount: 47000 } },
      { action: 'payment_recorded', entity: 'Payment', entityId: order2._id, performedBy: admin._id, changes: { amount: 25000, mode: 'upi' } },
      { action: 'order_placed', entity: 'Order', entityId: order3._id, performedBy: customer._id, changes: { status: 'placed' } },
      { action: 'order_placed', entity: 'Order', entityId: order4._id, performedBy: customer._id, changes: { status: 'placed' } },
      { action: 'order_updated', entity: 'Order', entityId: order4._id, performedBy: admin._id, changes: { status: 'under_review' } },
      { action: 'order_placed', entity: 'Order', entityId: order5._id, performedBy: customer._id, changes: { status: 'placed' } },
      { action: 'order_approved', entity: 'Order', entityId: order5._id, performedBy: admin._id, changes: { status: 'approved' } },
      { action: 'stock_updated', entity: 'StockEntry', entityId: order1._id, performedBy: stockUser._id, changes: { note: 'Daily stock count' } },
      { action: 'procurement_created', entity: 'Procurement', entityId: order1._id, performedBy: admin._id, changes: { items: 8 } },
      { action: 'procurement_completed', entity: 'Procurement', entityId: order1._id, performedBy: procUser._id, changes: { status: 'delivered' } },
    ];

    await AuditLog.insertMany(auditLogs);
    console.log(`✅ Created ${auditLogs.length} audit logs`);

    console.log('\n🎉 All dummy transactional data seeded successfully!\n');
    console.log('Summary:');
    console.log('  📦 5 Orders (completed, partially_paid, placed, under_review, approved)');
    console.log('  🧾 2 Invoices (paid, partially_paid)');
    console.log('  💰 3 Payments (2 UPI, 1 cash)');
    console.log('  📋 3 Stock entries (last 3 days)');
    console.log('  ⚠️  6 Low-stock raw materials');
    console.log('  🛒 3 Procurements (delivered, in_progress, pending)');
    console.log(`  🔔 ${notifications.length} Notifications`);
    console.log(`  📝 ${auditLogs.length} Audit logs`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDummyData();
