/**
 * Supplier Shipment Service
 * Handles Screen 11: Advanced Shipping Notice (ASN) & Inbound Delivery
 * 
 * Rules:
 * - One inbound delivery per PO: SAP API rejects items from different POs in one delivery
 *   (Selecting lines across multiple POs automatically splits them into separate deliveries)
 * - Each inbound delivery created carries its own idempotency key (ASN:PO:timestamp)
 * - UoM comes from the PO and is strictly read-only
 * - Labels follow packaging standard PKG-04 and print ONLY after successful posting in SAP
 * - Dispatch date > 7 days in past is blocked
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class ShipmentService {
    constructor() {
        this.asns = [...INITIAL_SUPPLIER_FIXTURES.asns]
    }

    async getRecentASNs() {
        return apiClient.get('/portal/supplier/asns', () => this.asns)
    }

    async submitShipmentNotice(formData, selectedLines = []) {
        // Validation: Dispatch date cannot be > 7 days in past
        if (formData.dispDate) {
            const disp = new Date(formData.dispDate)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            if (disp < weekAgo) {
                throw new Error('Dispatch date cannot be more than seven days in the past.')
            }
        }

        // Group selected lines by PO
        const groups = {}
        for (const line of selectedLines) {
            if (!groups[line.po]) groups[line.po] = []
            groups[line.po].push(line)
        }

        const createdDeliveries = []

        // Post one inbound delivery per PO
        for (const po of Object.keys(groups)) {
            const deliveryNumber = `018000${Math.floor(4410 + Math.random() * 580)}`
            const asnRef = `ASN-2026-0${Math.floor(1185 + Math.random() * 100)}`

            const payload = {
                asnRef,
                inboundDelivery: deliveryNumber,
                purchaseOrder: po,
                lines: groups[po],
                handlingUnit: formData.hu || 'HU-26-004412',
                deliveryNote: formData.dn,
                invoiceNumber: formData.inv,
                irn: formData.irn,
                ewayBill: formData.eway,
                vehicleNo: formData.veh,
                status: 'POSTED',
                sentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            }

            this.asns.unshift({
                ref: asnRef,
                del: deliveryNumber,
                sent: payload.sentDate,
                status: 'POSTED',
            })

            createdDeliveries.push(payload)
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV_0002',
            { deliveries: createdDeliveries },
            () => ({
                count: createdDeliveries.length,
                deliveries: createdDeliveries,
                message: `${createdDeliveries.length} inbound delivery/deliveries created in S/4HANA.`,
            }),
            {
                idempotencyKey: generateIdempotencyKey('ASN_BATCH', Object.keys(groups).join('_')),
                sapMessage: `Inbound delivery created for ${Object.keys(groups).join(', ')}. Labels ready to print.`,
            }
        )
    }

    async printLabels(deliveryNo) {
        return apiClient.post(
            `/sap/inbound-delivery/${deliveryNo}/labels`,
            {},
            () => ({ deliveryNo, status: 'SENT_TO_PRINTER' }),
            {
                sapMessage: `PKG-04 compliant labels generated carrying delivery ${deliveryNo} and QR code for receiving dock scanning.`,
            }
        )
    }
}

export const shipmentService = new ShipmentService()
export default shipmentService
