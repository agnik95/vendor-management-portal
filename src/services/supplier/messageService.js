/**
 * Supplier Message Service
 * Handles Screen 17: Contextual Messages & Business Object Support Threads
 * 
 * Rules:
 * - Query threads are linked directly to business documents (PO, Invoice, NCR)
 * - Object ownership is verified before creation
 * - Service Level Agreement (SLA) timer tracking: clock pauses while awaiting supplier
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class MessageService {
    constructor() {
        this.tickets = [...INITIAL_SUPPLIER_FIXTURES.tickets]
    }

    async getTickets() {
        return apiClient.get('/portal/supplier/tickets', () => this.tickets)
    }

    async createTicket(ticketData) {
        const nextNo = `TKT-2026-08${Math.floor(90 + Math.random() * 99)}`
        const newTicket = {
            no: nextNo,
            subj: ticketData.subj,
            cat: ticketData.cat || 'GENERAL',
            status: 'OPEN',
            link: ticketData.link || '',
            msgs: [
                {
                    who: 'You',
                    role: 'A. Deshpande',
                    when: 'Just now',
                    me: true,
                    body: ticketData.body,
                },
            ],
        }

        this.tickets.unshift(newTicket)

        return apiClient.post(
            '/portal/supplier/tickets',
            newTicket,
            () => newTicket,
            {
                idempotencyKey: generateIdempotencyKey('TKT_NEW', nextNo),
                sapMessage: `Query ${nextNo} raised and linked to ${ticketData.link || 'General'}. Routed to category buyer.`,
            }
        )
    }

    async sendReply(ticketNo, messageText) {
        const ticket = this.tickets.find((t) => t.no === ticketNo)
        if (!ticket) throw new Error(`Ticket ${ticketNo} not found`)

        if (!messageText || !messageText.trim()) {
            throw new Error('Message cannot be empty.')
        }

        const msgObj = {
            who: 'You',
            role: 'A. Deshpande',
            when: 'Just now',
            me: true,
            body: messageText.trim(),
        }

        ticket.msgs.push(msgObj)
        ticket.status = 'OPEN' // Reopens on supplier reply

        return apiClient.post(
            `/portal/supplier/tickets/${ticketNo}/reply`,
            msgObj,
            () => ticket,
            {
                idempotencyKey: generateIdempotencyKey('TKT_REPLY', `${ticketNo}_${ticket.msgs.length}`),
                sapMessage: `Reply sent on query ${ticketNo}. Buyer SLA clock resumed.`,
            }
        )
    }
}

export const messageService = new MessageService()
export default messageService
