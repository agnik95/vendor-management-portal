/**
 * Supplier RFQ & Quotation Service
 * Handles Screen 6: RFQ Inbox & Screen 7: Quotation Response
 * 
 * Rules:
 * - All-lines-or-nothing: Partial quotations are refused (every line must be priced, or decline whole RFQ)
 * - Single atomic transaction: Header and all line items post in one call to S/4HANA
 * - Once submitted, prices are read back from SAP Supplier Quotation object
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class RFQService {
    constructor() {
        this.rfqs = [...INITIAL_SUPPLIER_FIXTURES.rfqs]
    }

    async getRFQs() {
        return apiClient.get('/sap/opu/odata/sap/A_RequestForQuotation', () => this.rfqs)
    }

    async getRFQByNo(no) {
        const rfq = this.rfqs.find((r) => r.no === no)
        if (!rfq) throw new Error(`RFQ ${no} not found`)
        return apiClient.get(`/sap/opu/odata/sap/A_RequestForQuotation('${no}')`, () => rfq)
    }

    async submitQuotation(rfqNo, linePrices = []) {
        const rfq = this.rfqs.find((r) => r.no === rfqNo)
        if (!rfq) throw new Error(`RFQ ${rfqNo} not found`)

        // Enforce all-or-nothing pricing
        const unpriced = linePrices.filter((l) => !Number(l.price) || Number(l.price) <= 0)
        if (unpriced.length > 0) {
            throw new Error(`All lines must be priced. Line ${unpriced[0].it} has no price. Partial quotations are refused.`)
        }

        const sapQuoteNo = `7000001${Math.floor(200 + Math.random() * 500)}`
        rfq.quote = 'SUBMITTED'
        rfq.sapQuote = sapQuoteNo
        rfq.lines = linePrices

        return apiClient.post(
            '/sap/opu/odata/sap/A_SupplierQuotation',
            { rfqNo, quotationNumber: sapQuoteNo, items: linePrices },
            () => ({ rfq, quotationNumber: sapQuoteNo }),
            {
                idempotencyKey: generateIdempotencyKey('QUOTE_SUBMIT', rfqNo),
                sapMessage: `Supplier Quotation ${sapQuoteNo} posted in S/4HANA Cloud in one atomic transaction.`,
            }
        )
    }

    async declineRFQ(rfqNo, reason = 'Commercial terms not viable') {
        const rfq = this.rfqs.find((r) => r.no === rfqNo)
        if (!rfq) throw new Error(`RFQ ${rfqNo} not found`)

        rfq.quote = 'DECLINED'
        rfq.declineReason = reason

        return apiClient.post(
            `/portal/supplier/rfq/${rfqNo}/decline`,
            { rfqNo, reason },
            () => rfq,
            {
                sapMessage: `RFQ ${rfqNo} decline recorded. Buyer notified to invite alternates.`,
            }
        )
    }
}

export const rfqService = new RFQService()
export default rfqService
