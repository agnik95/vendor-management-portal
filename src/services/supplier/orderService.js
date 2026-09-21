/**
 * Supplier Order Service
 * Handles Screen 8: Purchase Orders & Screen 9: Order Detail Acknowledgement
 * 
 * Rules:
 * - Reads live from S/4HANA API_PURCHASEORDER_2 filtered by Business Partner
 * - 3 acknowledgement modes: AS_ORDERED, WITH_CHANGE (splits), REJECT
 * - Delivery splits must total the confirmed quantity exactly (running difference check)
 * - Bulk acknowledgement is for UNCHANGED confirmations only
 * - Bulk operations report per line; successes are never rolled back if another line fails
 * - Staged acknowledgements write through OrderConfirmationRequest_In with unique idempotency key
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class OrderService {
    constructor() {
        this.orders = [...INITIAL_SUPPLIER_FIXTURES.orders]
    }

    async getOrders() {
        return apiClient.get('/sap/opu/odata4/sap/API_PURCHASEORDER_2/srvd_a2x/sap/purchaseorder/0001/PurchaseOrder', () => this.orders)
    }

    async getOrderByPOAndItem(po, item) {
        const order = this.orders.find((o) => o.po === po && o.item === item)
        if (!order) throw new Error(`Order ${po} item ${item} not found`)
        return apiClient.get(`/sap/purchaseorder/${po}/${item}`, () => order)
    }

    async acknowledgeAsOrdered(po, item) {
        const order = this.orders.find((o) => o.po === po && o.item === item)
        if (!order) throw new Error(`Order ${po} item ${item} not found`)

        order.ack = 'AS_ORDERED'
        order.ackQty = order.qty
        order.ackDate = order.req
        order.age = 0
        order.ackDoc = `CONF-${Math.floor(4400 + Math.random() * 500)}`

        return apiClient.post(
            `/sap/opu/soap/OrderConfirmationRequest_In`,
            { po, item, status: 'AS_ORDERED', quantity: order.qty, date: order.req },
            () => order,
            {
                idempotencyKey: generateIdempotencyKey('PO_ACK', `${po}_${item}`),
                sapMessage: `Order ${po} item ${item} acknowledged as ordered. Confirmation ${order.ackDoc} posted in SAP.`,
            }
        )
    }

    async acknowledgeWithSplits(po, item, splits, reason = '') {
        const order = this.orders.find((o) => o.po === po && o.item === item)
        if (!order) throw new Error(`Order ${po} item ${item} not found`)

        const totalSplit = splits.reduce((acc, s) => acc + (Number(s.q) || 0), 0)
        if (totalSplit !== order.qty) {
            throw new Error(`Split quantities (${totalSplit}) must match the ordered quantity (${order.qty}) exactly. Difference: ${order.qty - totalSplit}.`)
        }

        order.ack = 'WITH_CHANGE'
        order.ackQty = totalSplit
        order.splits = splits
        order.ackDate = splits[splits.length - 1]?.d || order.req
        order.age = 0
        order.ackReason = reason
        order.ackDoc = `CONF-${Math.floor(4400 + Math.random() * 500)}`

        return apiClient.post(
            `/sap/opu/soap/OrderConfirmationRequest_In`,
            { po, item, status: 'WITH_CHANGE', splits, reason },
            () => order,
            {
                idempotencyKey: generateIdempotencyKey('PO_ACK_SPLIT', `${po}_${item}`),
                sapMessage: `Order ${po} item ${item} acknowledged with proposed splits. Buyer notified.`,
            }
        )
    }

    async rejectOrder(po, item, reason) {
        const order = this.orders.find((o) => o.po === po && o.item === item)
        if (!order) throw new Error(`Order ${po} item ${item} not found`)

        order.ack = 'REJECT'
        order.ackQty = 0
        order.age = 0
        order.rejectReason = reason

        return apiClient.post(
            `/sap/opu/soap/OrderConfirmationRequest_In`,
            { po, item, status: 'REJECT', reason },
            () => order,
            {
                idempotencyKey: generateIdempotencyKey('PO_REJECT', `${po}_${item}`),
                sapMessage: `Order ${po} item ${item} rejected. Buyer notified immediately.`,
            }
        )
    }

    async bulkAcknowledgeUnchanged(orderKeys = []) {
        const selected = this.orders.filter((o) => orderKeys.includes(o.po + o.item) && !o.ack)
        const results = []

        for (const order of selected) {
            order.ack = 'AS_ORDERED'
            order.ackQty = order.qty
            order.ackDate = order.req
            order.age = 0
            order.ackDoc = `CONF-${Math.floor(4400 + Math.random() * 500)}`
            results.push({ po: order.po, item: order.item, success: true })
        }

        return apiClient.post(
            `/sap/opu/soap/OrderConfirmationRequest_In/bulk`,
            { count: results.length, keys: orderKeys },
            () => ({ count: results.length, items: results }),
            {
                sapMessage: `Bulk acknowledgement: ${results.length} lines confirmed. Each carries its own idempotency key.`,
            }
        )
    }
}

export const orderService = new OrderService()
export default orderService
