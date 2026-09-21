/**
 * Supplier Scorecard Service
 * Handles Screen 16: Supplier Performance Scorecard & Dispute Aggregates
 * 
 * Rules:
 * - Suppliers see the raw input counts behind every percentage calculation
 *   (e.g. 57 on-time / 62 receipts counted = 91.9%)
 * - Shows 12-month historical performance trend
 * - Scores are reproducible by hand without re-reading closed ERP periods
 */

import apiClient from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class SupplierScorecardService {
    constructor() {
        this.scorecard = { ...INITIAL_SUPPLIER_FIXTURES.score }
    }

    async getScorecard() {
        return apiClient.get('/portal/supplier/scorecard', () => ({
            ...this.scorecard,
            criteria: [
                { name: 'On-time delivery', weight: '30%', raw: 'Goods receipt date vs schedule line date', value: `${this.scorecard.otd}%`, score: 27.7, trend: '↑ 3 pts', origin: 'sap' },
                { name: 'Quantity accuracy', weight: '10%', raw: 'Received vs ordered quantity', value: `${this.scorecard.qty}%`, score: 9.9, trend: '→', origin: 'sap' },
                { name: 'Quality — PPM', weight: '25%', raw: 'Rejected qty ÷ received qty', value: `${this.scorecard.ppm} ppm`, score: 17.5, trend: '↓ 90 ppm', origin: 'sap' },
                { name: 'Responsiveness', weight: '15%', raw: 'Hours from order issue to acknowledgement', value: `${this.scorecard.resp} h`, score: 13.5, trend: '↑', origin: 'prt' },
                { name: 'Document compliance', weight: '10%', raw: 'Valid mandatory documents ÷ required', value: `${this.scorecard.docs}%`, score: 7.1, trend: '↓', origin: 'prt' },
                { name: 'Issue closure', weight: '10%', raw: '8D steps closed by due date', value: `${this.scorecard.closure}%`, score: 8.2, trend: '→', origin: 'prt' },
            ],
            rawCounts: [
                { criterion: 'On-time delivery', inputs: '62 receipts, 57 within window', formula: '57 ÷ 62 = 91.9%' },
                { criterion: 'Quantity accuracy', inputs: 'Ordered 61,400 · received 60,850', formula: '60,850 ÷ 61,400 = 99.1%' },
                { criterion: 'Quality — PPM', inputs: 'Received 60,850 · rejected 39', formula: '39 ÷ 60,850 × 10⁶ = 640 ppm' },
                { criterion: 'Responsiveness', inputs: '24 orders · 269 hours total', formula: '269 ÷ 24 = 11.2 hours' },
                { criterion: 'Document compliance', inputs: '5 valid of 7 required', formula: '5 ÷ 7 = 71.4%' },
                { criterion: 'Issue closure', inputs: '11 steps due · 9 closed on time', formula: '9 ÷ 11 = 81.8%' },
            ],
        }))
    }
}

export const supplierScorecardService = new SupplierScorecardService()
export default supplierScorecardService
