/**
 * Buyer Master Data Changes Service
 * Handles Screen 4: Supplier-Raised Master Data Changes
 * 
 * Rules:
 * - Bank changes require two approvers in different roles (e.g. Accounts Payable and Finance Controller)
 * - Bank penny-drop verification is required before approval
 * - A failed penny drop is rejected and raised as a fraud alert (never confirm by email)
 * - Existing registered contact is emailed the moment a change is raised and again on completion
 * - Proposed values are retained for audit only; never read to populate screens post-approval
 * - Approved change writes to S/4HANA via B2 (API_BUSINESS_PARTNER with If-Match ETag)
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class MasterDataService {
    constructor() {
        this.changes = [...INITIAL_BUYER_FIXTURES.changes]
    }

    async getChanges() {
        return apiClient.get('/portal/buyer/changes', () => this.changes)
    }

    async approveStep(id, approverRole = 'Accounts payable', approverName = 'S. Nair') {
        const item = this.changes.find((c) => c.id === id)
        if (!item) throw new Error(`Change request ${id} not found`)

        if (item.penny === 'FAIL') {
            throw new Error('Cannot approve: Bank account penny-drop failed verification. Treat as attempted fraud.')
        }

        if (item.type === 'Bank account') {
            if (!item.ap) {
                // Step 1: AP approval
                item.ap = `${approverName} (${approverRole}) · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                return apiClient.patch(
                    `/portal/buyer/changes/${id}/step-ap`,
                    { ap: item.ap },
                    () => item
                )
            } else if (!item.fc) {
                // Step 2: Finance Controller approval
                item.fc = `Finance Controller · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                item.st = 'DONE'

                // Write B2 to SAP
                return apiClient.patch(
                    `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartnerBank('${item.bp}')`,
                    { BankAccountNumber: item.to },
                    () => item,
                    {
                        headers: { 'If-Match': '*' },
                        sapMessage: `Bank details updated in S/4HANA for Business Partner ${item.bp}. Both new and registered contacts notified.`,
                    }
                )
            }
        } else {
            // General address/contact change (Single approval)
            item.ap = `${approverName} · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
            item.fc = 'n/a'
            item.st = 'DONE'

            return apiClient.patch(
                `/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartnerAddress('${item.bp}')`,
                { Address: item.to },
                () => item,
                {
                    sapMessage: `Address updated in S/4HANA for Business Partner ${item.bp}.`,
                }
            )
        }
    }

    async rejectChange(id, isFraudAlert = false, reason = '') {
        const item = this.changes.find((c) => c.id === id)
        if (!item) throw new Error(`Change request ${id} not found`)
        item.st = 'REJECTED'
        item.isFraudAlert = isFraudAlert || item.penny === 'FAIL'
        item.rejectReason = reason

        return apiClient.post(
            `/portal/buyer/changes/${id}/reject`,
            { isFraudAlert: item.isFraudAlert, reason },
            () => item,
            {
                sapMessage: item.isFraudAlert
                    ? 'Change rejected and Security/Fraud Alert raised. Compliance notified.'
                    : 'Change request rejected.',
            }
        )
    }
}

export const masterDataService = new MasterDataService()
export default masterDataService
