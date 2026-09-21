/**
 * Supplier Quality Actions Service
 * Handles Screen 15: 8D Non-Conformance Problem Solving
 * 
 * Rules:
 * - 8D disciplines are sequential: D_{i+1} cannot be worked on until D_i is accepted
 * - Minimum 50 characters of technical content is required (prevents "will check")
 * - Supporting evidence is mandatory for containment (D3), root cause (D4), verification (D6), and prevention (D7)
 * - Supplier can never close case autonomously; closure requires SQA acceptance of D8
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class SupplierQualityService {
    constructor() {
        this.ncr = { ...INITIAL_SUPPLIER_FIXTURES.ncr }
    }

    async getActiveNCR() {
        return apiClient.get('/portal/supplier/ncr/active', () => this.ncr)
    }

    async submit8DStep(stepIndex, content, hasEvidence = false) {
        const step = this.ncr.steps[stepIndex]
        if (!step) throw new Error(`Step D${stepIndex + 1} not found`)

        // 1. Min 50 characters check
        if (!content || content.trim().length < 50) {
            throw new Error(`Technical content requires at least 50 characters (${content?.trim().length || 0} entered). Please detail root cause and measurements.`)
        }

        // 2. Evidence requirement for D3, D4, D6, D7
        const requiresEvidence = ['D3', 'D4', 'D6', 'D7'].includes(step.c)
        if (requiresEvidence && !hasEvidence && !step.ev) {
            throw new Error(`Discipline ${step.c} requires supporting technical evidence files (five-why, fishbone, or study).`)
        }

        step.text = content.trim()
        step.st = 'ACCEPTED'
        step.ev = Math.max(step.ev || 0, hasEvidence ? 1 : 0)

        // Unlock next discipline
        const nextStep = this.ncr.steps[stepIndex + 1]
        if (nextStep && nextStep.st === 'NOT_STARTED') {
            nextStep.st = 'IN_PROGRESS'
        }

        return apiClient.post(
            `/portal/supplier/ncr/${this.ncr.no}/step/${stepIndex}`,
            { step: step.c, content, hasEvidence },
            () => this.ncr,
            {
                idempotencyKey: generateIdempotencyKey('D8_SUBMIT', `${this.ncr.no}_${step.c}`),
                sapMessage: `Discipline ${step.c} logged and submitted for Buyer/SQA review.`,
            }
        )
    }
}

export const supplierQualityService = new SupplierQualityService()
export default supplierQualityService
