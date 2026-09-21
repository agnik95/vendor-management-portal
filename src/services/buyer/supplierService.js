/**
 * Buyer Supplier Service
 * Handles Screen 5: Suppliers Directory & Supplier 360 View
 * 
 * Rules:
 * - Reads live facts from SAP S/4HANA (Spend, OTD, PPM, Payment terms, Confirmation control)
 * - Adds portal-only attributes that SAP has no field for (ASL status, Single-source flag, Tooling we own, Review date)
 * - Editing portal attributes updates portal database only (never writes to SAP Business Partner)
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class BuyerSupplierService {
    constructor() {
        this.suppliers = [...INITIAL_BUYER_FIXTURES.suppliers]
    }

    async getSuppliers() {
        return apiClient.get('/portal/buyer/suppliers', () => this.suppliers)
    }

    async getSupplierByBP(bp) {
        const supplier = this.suppliers.find((s) => s.bp === bp)
        if (!supplier) throw new Error(`Supplier with BP ${bp} not found`)
        return apiClient.get(`/portal/buyer/suppliers/${bp}`, () => supplier)
    }

    async updatePortalAttributes(bp, attrs) {
        const supplier = this.suppliers.find((s) => s.bp === bp)
        if (!supplier) throw new Error(`Supplier with BP ${bp} not found`)

        if (attrs.asl !== undefined) supplier.asl = attrs.asl
        if (attrs.single !== undefined) supplier.single = attrs.single
        if (attrs.tooling !== undefined) supplier.tooling = attrs.tooling
        if (attrs.reviewDate !== undefined) supplier.reviewDate = attrs.reviewDate

        return apiClient.patch(
            `/portal/buyer/suppliers/${bp}/attributes`,
            attrs,
            () => supplier,
            {
                sapMessage: 'Portal attributes saved in portal database. S/4HANA Business Partner untouched.',
            }
        )
    }
}

export const buyerSupplierService = new BuyerSupplierService()
export default buyerSupplierService
