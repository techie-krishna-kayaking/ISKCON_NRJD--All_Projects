module.exports = {
  roles: ['customer', 'stock_team', 'procurement', 'admin'],

  orderStatuses: [
    'draft', 'placed', 'under_review', 'customer_contacted',
    'updated', 'approved', 'rejected', 'invoiced',
    'partially_paid', 'paid', 'scheduled', 'completed', 'cancelled',
  ],

  procurementStatuses: [
    'pending', 'required', 'in_progress', 'purchased', 'delivered', 'closed',
  ],

  paymentModes: ['upi', 'cash'],

  paymentStatuses: ['unpaid', 'partially_paid', 'paid'],

  unitTypes: ['kg', 'g', 'liter', 'ml', 'count', 'pack', 'bunch', 'dozen'],

  notificationChannels: ['in_app', 'email', 'whatsapp', 'sms'],

  notificationEvents: [
    'order_placed', 'order_updated', 'order_approved', 'order_rejected',
    'invoice_generated', 'payment_recorded', 'stock_reminder',
    'low_stock_alert', 'procurement_needed', 'procurement_completed',
    'admin_action',
  ],
};
