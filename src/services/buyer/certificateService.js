/**
 * Buyer Certificate Service
 * Handles Screen 6: Certificate Register, Verification & Expiry Controls
 * 
 * Rules:
 * - Expiry NEVER blocks purchasing automatically (prevents shutting down production at 2 AM)
 * - Verification is always by a person (Uploading does not make a document valid)
 * - Replacement supersedes but never deletes historical versions
 * - Single-source suppliers with expired blocking certificates cannot be blocked directly:
 *   must record deviation with recovery date or qualify an alternate.
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class CertificateService {
    constructor() {
        this.certificates = [...INITIAL_BUYER_FIXTURES.certificates]
    }

    async getCertificates() {
        return apiClient.get('/portal/buyer/certificates', () => this.certificates)
    }

    async acceptCertificate(id) {
        const cert = this.certificates.find((c) => c.id === id || c.ref === id)
        if (!cert) throw new Error(`Certificate ${id} not found`)

        cert.st = 'VALID'
        cert.days = 365

        return apiClient.patch(
            `/portal/buyer/certificates/${id}/accept`,
            { status: 'VALID' },
            () => cert,
            {
                sapMessage: `Certificate ${cert.type} accepted for ${cert.sup}. Scorecard compliance recomputed.`,
            }
        )
    }

    async rejectCertificate(id, reason = 'Illegible or invalid scope') {
        const cert = this.certificates.find((c) => c.id === id || c.ref === id)
        if (!cert) throw new Error(`Certificate ${id} not found`)

        cert.st = 'EXPIRED'
        cert.days = -1
        cert.rejectReason = reason

        return apiClient.patch(
            `/portal/buyer/certificates/${id}/reject`,
            { status: 'EXPIRED', reason },
            () => cert,
            {
                sapMessage: `Certificate ${cert.type} rejected. Supplier notified with reason.`,
            }
        )
    }

    async proposePurchasingBlock(bp, certId, isSingleSource = false) {
        if (isSingleSource) {
            throw new Error('Safety guard: Supplier is Single Source. Direct ERP purchasing block is blocked. Record a deviation with recovery date or qualify an alternate.')
        }

        const proposalId = `BLK-PROP-${Math.floor(100 + Math.random() * 900)}`

        return apiClient.post(
            '/portal/buyer/purchasing-block-proposals',
            { bp, certId, proposalId },
            () => ({
                proposalId,
                bp,
                certId,
                status: 'SUBMITTED_TO_HEAD',
                message: 'Purchasing block proposal logged with open order exposure for Human approval in Fiori.',
            }),
            {
                idempotencyKey: generateIdempotencyKey('BLK_PROP', bp),
                sapMessage: 'Purchasing block proposal raised. Portal never applies purchasing block automatically.',
            }
        )
    }

    async deferBlockWithDeviation(bp, recoveryDate, reason = 'Production continuation deviation') {
        return apiClient.post(
            '/portal/buyer/deviations',
            { bp, recoveryDate, reason },
            () => ({ bp, recoveryDate, reason, status: 'DEVIATION_GRANTED' }),
            {
                sapMessage: `Deviation granted until ${recoveryDate}. Recovery date tracked.`,
            }
        )
    }
}

export const certificateService = new CertificateService()
export default certificateService
