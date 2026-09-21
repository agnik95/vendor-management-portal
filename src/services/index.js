/**
 * Master Services Barrel Export
 * Exposes API-ready domain services across Buyer and Supplier modules.
 */

export { default as apiClient, delay, generateIdempotencyKey } from './apiClient'

// Buyer Domain Services
export { default as approvalService } from './buyer/approvalService'
export { default as masterDataService } from './buyer/masterDataService'
export { default as buyerSupplierService } from './buyer/supplierService'
export { default as certificateService } from './buyer/certificateService'
export { default as qualityService } from './buyer/qualityService'
export { default as scorecardService } from './buyer/scorecardService'
export { default as queryService } from './buyer/queryService'
export { default as supplierUserService } from './buyer/supplierUserService'

// Supplier Domain Services
export { default as registrationService, validateGSTINChecksum, validatePANMatchesGSTIN } from './supplier/registrationService'
export { default as orderService } from './supplier/orderService'
export { default as scheduleService } from './supplier/scheduleService'
export { default as shipmentService } from './supplier/shipmentService'
export { default as invoiceService } from './supplier/invoiceService'
export { default as supplierQualityService } from './supplier/qualityService'
export { default as supplierScorecardService } from './supplier/scorecardService'
export { default as messageService } from './supplier/messageService'
export { default as documentService } from './supplier/documentService'
export { default as rfqService } from './supplier/rfqService'

// ERP Process Runner (For testing direct procurement lifecycle)
export { default as procurementService } from './procurementService'
export { SAP_MASTER_TABLES, getInitialDirectProcurementCycle } from './mockData'
