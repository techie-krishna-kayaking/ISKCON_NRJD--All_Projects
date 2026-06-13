const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const logAudit = async ({ action, entity, entityId, performedBy, changes, previousValues, req }) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      performedBy,
      changes,
      previousValues,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (error) {
    logger.error(`Audit log failed: ${error.message}`);
  }
};

module.exports = { logAudit };
