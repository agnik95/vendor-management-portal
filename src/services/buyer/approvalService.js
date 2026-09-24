/**
 * Buyer Approval Service
 * Handles Screen 3: New Supplier Registration Approval Workflow
 * 
 * Rules:
 * - 4 configurable approval steps: Category buyer -> SQE -> Finance (bank) -> Procurement head
 * - A duplicate warning cannot be dismissed silently (min 15 chars override rationale required)
 * - Pending penny drop blocks final step only (Category and quality review proceed in parallel)
 * - Approver cannot approve their own referral
 * - Final approval triggers B1: 1 call, 1 transaction deep-insert to S/4HANA API_BUSINESS_PARTNER
 * - On technical failure, human approval stands and creation is retried
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class ApprovalService {
    constructor() {
        this.registrations = [...INITIAL_BUYER_FIXTURES.registrations]
    }

    async getRegistrations() {
        return apiClient.get('/portal/buyer/registrations', () => this.registrations)
    }

    async advanceStep(target, currentStep, overrideReason = '', approverName = 'K. Ramesh') {
        const ref = target.ref

        // Enforce non-silent duplicate override
        if (target.dup && !target.note) {
            if (!overrideReason || overrideReason.trim().length < 15) {
                throw new Error('A duplicate warning cannot be dismissed silently. Please record why this is not a duplicate (min 15 chars).')
            }
            target.note = overrideReason.trim()
        }

        // Prevent self-referral approval
        if (target.by && target.by.includes(approverName) && currentStep === 0) {
            throw new Error('Segregation of duties: An approver cannot approve their own referral. Routes to alternate.')
        }

        return apiClient.patch(
            `/portal/buyer/registrations/${ref}/advance`,
            { step: currentStep + 1, note: target.note },
            () => target,
            { forceMock: true }
        )
    }

    async createBusinessPartner(ref, decision, overrideReason = '') {
        // We rely on the backend for validation now.
        const newBP = `001700${Math.floor(4700 + Math.random() * 299)}`

        return apiClient.post(
            `/buyer/vendors/${ref}/approve`,
            { decision },
            () => ({
                status: "Approved",
                registration_number: ref,
                sap_bp_id: newBP,
                message: "Vendor approved and created in SAP S/4HANA successfully.",
            }),
            {
                idempotencyKey: generateIdempotencyKey('BP_CREATE', newBP),
                sapMessage: `Business Partner creation triggered via backend`,
            }
        )
    }

    async rejectRegistration(ref, reason = '') {
        return apiClient.post(
            `/portal/buyer/registrations/${ref}/reject`,
            { reason },
            () => ({ ref, st: 'REJECTED', rejectReason: reason }),
            {
                sapMessage: `Application ${ref} rejected. Nothing written to ERP.`,
                forceMock: true
            }
        )
    }
}

export const approvalService = new ApprovalService()
export default approvalService
