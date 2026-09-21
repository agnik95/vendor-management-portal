/**
 * Buyer Scorecard Service
 * Handles Screen 8: Scorecard Computation, Configuration & Release
 * 
 * Rules:
 * - Weights must total exactly 100 before configuration can be activated
 * - 35% of total score is portal-derived (Responsiveness, Certs, 8D)
 * - Configuration changes apply to NEXT period only; published scores carry version and are never rewritten
 * - Suppliers see counts behind each percentage (settle disputes without re-reading closed period)
 * - Fewer than 12 transactions in period = no score
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class ScorecardService {
    constructor() {
        this.scorecardState = { ...INITIAL_BUYER_FIXTURES.scorecards }
        this.suppliers = [...INITIAL_BUYER_FIXTURES.suppliers]
    }

    async getScorecards() {
        return apiClient.get('/portal/buyer/scorecards', () => ({
            period: this.scorecardState.period,
            computedDate: this.scorecardState.computedDate,
            published: this.scorecardState.published,
            rules: this.scorecardState.rules,
            scores: this.suppliers.map((s) => ({
                bp: s.bp,
                name: s.name,
                otd: s.otd,
                ppm: s.ppm,
                resp: s.resp,
                certs: s.certs,
                score: s.score,
                grade: s.score >= 85 ? 'A' : s.score >= 70 ? 'B' : 'C',
                trend: s.score >= 85 ? '↑ 2' : s.score >= 70 ? '→' : '↓ 6',
                aggregates: {
                    receiptsCounted: 62,
                    onTimeCount: 57,
                    rejectedQty: 39,
                    baseQty: 60850,
                    ordersAck: 24,
                    totalAckHours: 269,
                    validCerts: Math.round((s.certs / 100) * 8),
                    totalCertsRequired: 8,
                    d8ClosedOnTime: 9,
                    d8TotalDue: 11,
                },
            })),
        }))
    }

    async updateWeights(newRules) {
        const sum = newRules.reduce((acc, r) => acc + (Number(r.weight) || 0), 0)
        if (sum !== 100) {
            throw new Error(`Weights must total exactly 100%. Current total: ${sum}%.`)
        }

        this.scorecardState.rules = newRules
        return apiClient.patch(
            '/portal/buyer/scorecard-config',
            { rules: newRules, effectivePeriod: 'Next period (Aug 2026)' },
            () => ({ rules: newRules, effectivePeriod: 'Next period (Aug 2026)' }),
            {
                sapMessage: 'Configuration saved. Version incremented. Applies from next period only.',
            }
        )
    }

    async publishScorecards() {
        this.scorecardState.published = true
        return apiClient.post(
            '/portal/buyer/scorecards/publish',
            { period: this.scorecardState.period },
            () => ({ published: true, period: this.scorecardState.period }),
            {
                sapMessage: 'Scorecards released to suppliers. Raw input counts made visible.',
            }
        )
    }
}

export const scorecardService = new ScorecardService()
export default scorecardService
