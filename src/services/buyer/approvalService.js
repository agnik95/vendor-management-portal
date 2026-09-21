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

    async advanceStep(ref, currentStep, overrideReason = '', approverName = 'K. Ramesh') {
        const reg = this.registrations.find((r) => r.ref === ref)
        if (!reg) throw new Error(`Registration ${ref} not found`)

        // Enforce non-silent duplicate override
        if (reg.dup && !reg.note) {
            if (!overrideReason || overrideReason.trim().length < 15) {
                throw new Error('A duplicate warning cannot be dismissed silently. Please record why this is not a duplicate (min 15 chars).')
            }
            reg.note = overrideReason.trim()
        }

        // Prevent self-referral approval
        if (reg.by && reg.by.includes(approverName) && currentStep === 0) {
            throw new Error('Segregation of duties: An approver cannot approve their own referral. Routes to alternate.')
        }

        // Advance step
        reg.step = currentStep + 1

        return apiClient.patch(
            `/portal/buyer/registrations/${ref}/advance`,
            { step: reg.step, note: reg.note },
            () => reg
        )
    }

    async createBusinessPartner(ref, overrideReason = '') {
        const reg = this.registrations.find((r) => r.ref === ref)
        if (!reg) throw new Error(`Registration ${ref} not found`)

        // Enforce penny drop for final step
        if (reg.bank === 'PENDING') {
            throw new Error('Bank verification (penny drop) has not completed. It blocks the final approval step.')
        }

        if (reg.dup && !reg.note) {
            if (!overrideReason || overrideReason.trim().length < 15) {
                throw new Error('A duplicate warning cannot be dismissed silently. Record why this is not a duplicate before creating the Business Partner.')
            }
            reg.note = overrideReason.trim()
        }

        const newBP = `001700${Math.floor(4700 + Math.random() * 299)}`
        reg.st = 'DONE'
        reg.bp = newBP

        const deepInsertPayload = {
            BusinessPartnerCategory: '2',
            BusinessPartnerFullName: reg.name,
            to_BusinessPartnerRole: [
                { BusinessPartnerRole: 'FLVN00' },
                { BusinessPartnerRole: 'FLVN01' },
            ],
            to_BusinessPartnerTaxNumber: [
                { BPTaxType: 'IN3', BPTaxNumber: reg.pan },
                { BPTaxType: 'IN1', BPTaxNumber: reg.gstin },
            ],
            to_Supplier: {
                SupplierAccountGroup: 'ZVEN',
                to_SupplierCompany: [
                    { CompanyCode: '1000', ReconciliationAccount: '21100000', PaymentTerms: 'ZN45' },
                ],
                to_SupplierPurchasingOrg: [
                    {
                        PurchasingOrganization: '1010',
                        PurchaseOrderCurrency: 'INR',
                        IncotermsClassification: 'FCA',
                        PaymentTerms: 'ZN45',
                        SupplierConfirmationControlKey: '0004', // Mandatory for supplier order confirmation
                    },
                ],
            },
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner',
            deepInsertPayload,
            () => ({
                registration: reg,
                businessPartner: newBP,
                createdSupplier: {
                    bp: newBP,
                    name: reg.name,
                    cat: reg.cat,
                    score: 0,
                    otd: 0,
                    ppm: 0,
                    resp: 0,
                    certs: 100,
                    spend: 0,
                    single: false,
                    asl: 'APPROVED',
                    tooling: 'None',
                    flag: 'PREF',
                },
            }),
            {
                idempotencyKey: generateIdempotencyKey('BP_CREATE', newBP),
                sapMessage: `Business Partner ${newBP} created in S/4HANA Cloud in single deep insert transaction`,
            }
        )
    }

    async rejectRegistration(ref, reason = '') {
        const reg = this.registrations.find((r) => r.ref === ref)
        if (!reg) throw new Error(`Registration ${ref} not found`)
        reg.st = 'REJECTED'
        reg.rejectReason = reason

        return apiClient.post(
            `/portal/buyer/registrations/${ref}/reject`,
            { reason },
            () => reg,
            {
                sapMessage: `Application ${ref} rejected. Nothing written to ERP.`,
            }
        )
    }
}

export const approvalService = new ApprovalService()
export default approvalService
