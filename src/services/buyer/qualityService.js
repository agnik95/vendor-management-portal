/**
 * Buyer Quality Cases Service
 * Handles Screen 7: 8D Non-Conformance Review & Closure Workflow
 * 
 * Rules:
 * - Returning a step reopens it (RET) and resets/locks EVERY step after it
 *   (Prevents a corrective action that contradicts a revised root cause)
 * - Suppliers can never close their own case; closure requires SQE acceptance of D8
 * - Only the final outcome (Closed, Debit Accepted) is written back to SAP QM notifications
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class QualityService {
    constructor() {
        this.cases = [...INITIAL_BUYER_FIXTURES.qualityCases]
    }

    async getCases() {
        return apiClient.get('/portal/buyer/quality-cases', () => this.cases)
    }

    async acceptStep(caseNo, stepIndex) {
        const item = this.cases.find((c) => c.no === caseNo)
        if (!item) throw new Error(`Quality case ${caseNo} not found`)

        item.steps[stepIndex] = 'OK'

        // Check if all 8 steps are complete
        const allDone = item.steps.every((s) => s === 'OK')

        if (allDone) {
            item.late = 0
            // Write back outcome to SAP
            return apiClient.patch(
                `/sap/opu/odata/sap/QualityNotification('${caseNo}')`,
                { Status: 'CLOSED', Outcome: '8D_COMPLETED' },
                () => item,
                {
                    sapMessage: `Quality Case ${caseNo} closed. Final status written to S/4HANA QM. Evidence files retained in portal.`,
                }
            )
        } else {
            // Unlock next discipline for supplier
            const nextIdx = item.steps.findIndex((s) => s !== 'OK')
            if (nextIdx !== -1 && !item.steps[nextIdx]) {
                item.steps[nextIdx] = ''
            }

            return apiClient.patch(
                `/portal/buyer/quality-cases/${caseNo}/accept-step`,
                { stepIndex },
                () => item,
                {
                    sapMessage: `Step D${stepIndex + 1} accepted. Next discipline unlocked for supplier.`,
                }
            )
        }
    }

    async returnStep(caseNo, stepIndex, reason = '') {
        const item = this.cases.find((c) => c.no === caseNo)
        if (!item) throw new Error(`Quality case ${caseNo} not found`)

        // Return current step and lock all subsequent steps
        item.steps = item.steps.map((s, j) => {
            if (j === stepIndex) return 'RET'
            if (j > stepIndex) return '' // Clear subsequent progress
            return s
        })

        item.returnReason = reason

        return apiClient.patch(
            `/portal/buyer/quality-cases/${caseNo}/return-step`,
            { stepIndex, reason },
            () => item,
            {
                sapMessage: `Step D${stepIndex + 1} returned. Subsequent steps locked. Clock resumes on supplier.`,
            }
        )
    }
}

export const qualityService = new QualityService()
export default qualityService
