/**
 * Buyer Supplier User Management Service
 * Handles Screen 10: External Supplier Logins & Access Governance
 * 
 * Rules:
 * - No supplier ever receives an SAP user or license (all calls run under technical communication user)
 * - Disabling the only administrator triggers an explicit warning guard
 * - MFA resets trigger re-enrolment email (portal never stores passwords)
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class SupplierUserService {
    constructor() {
        this.users = [...INITIAL_BUYER_FIXTURES.users]
    }

    async getUsers() {
        return apiClient.get('/portal/buyer/supplier-users', () => this.users)
    }

    async disableUser(name) {
        const user = this.users.find((u) => u.name === name)
        if (!user) throw new Error(`User ${name} not found`)

        // Check if this is the only administrator for the supplier
        const adminCount = this.users.filter((u) => u.bp === user.bp && u.role === 'Administrator' && u.st === 'ACTIVE').length
        const isSoleAdmin = user.role === 'Administrator' && adminCount <= 1

        user.st = 'DISABLED'

        return apiClient.patch(
            `/portal/buyer/supplier-users/${encodeURIComponent(name)}/disable`,
            { status: 'DISABLED' },
            () => ({ user, isSoleAdmin }),
            {
                sapMessage: isSoleAdmin
                    ? `Warning: Disabled sole administrator for ${user.sup}. Supplier cannot manage users.`
                    : `User ${name} disabled. Sessions terminated within 60 seconds.`,
            }
        )
    }

    async resetMFA(name) {
        return apiClient.post(
            `/portal/buyer/supplier-users/${encodeURIComponent(name)}/reset-mfa`,
            {},
            () => ({ name, status: 'RESET_LINK_SENT' }),
            {
                sapMessage: `MFA reset for ${name}. Re-enrolment link emailed. Portal never sees passwords.`,
            }
        )
    }
}

export const supplierUserService = new SupplierUserService()
export default supplierUserService
