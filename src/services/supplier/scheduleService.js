/**
 * Supplier Schedule Service
 * Handles Screen 10: Delivery Schedules & Capacity Issue Flagging
 * 
 * Rules:
 * - Reads cumulative received vs required directly from S/4HANA (A_SchAgrmtSchLine)
 * - Three planning zones: Firm (committed), Trade-off (material procured), Forecast (planning)
 * - Flagging capacity issues early notifies production planner with 4-week window
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class ScheduleService {
    constructor() {
        this.schedules = [...INITIAL_SUPPLIER_FIXTURES.sched]
    }

    async getSchedules() {
        return apiClient.get('/sap/opu/odata/sap/API_SCHEDULING_AGREEMENT', () => ({
            agreementNumber: '5500000412',
            material: 'SH-9012 — Shaft assembly',
            retrievedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            lines: this.schedules,
        }))
    }

    async flagCapacityIssue(payload) {
        const ticketId = `CAP-${Math.floor(100 + Math.random() * 900)}`

        return apiClient.post(
            '/portal/supplier/capacity-issue',
            { ticketId, ...payload },
            () => ({ ticketId, status: 'NOTIFIED_PLANNER', ...payload }),
            {
                idempotencyKey: generateIdempotencyKey('CAP_FLAG', ticketId),
                sapMessage: `Capacity alert ${ticketId} sent to production planner. SLA response target: 3 working days.`,
            }
        )
    }
}

export const scheduleService = new ScheduleService()
export default scheduleService
