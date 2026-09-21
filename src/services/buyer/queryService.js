/**
 * Buyer Query Service
 * Handles Screen 9: Contextual Query Correspondence
 * 
 * Rules:
 * - Queries are attached to an SAP business object (PO, Invoice, NCR)
 * - Object ownership is validated server-side before attaching
 * - Internal notes are strictly filtered server-side (never exposed to supplier UI)
 * - SLA clock pauses while awaiting supplier response and resumes on reply
 */

import apiClient from '../apiClient'
import { INITIAL_BUYER_FIXTURES } from '../../fixtures/buyerFixtures'

class QueryService {
    constructor() {
        this.queries = [...INITIAL_BUYER_FIXTURES.queries]
    }

    async getQueries() {
        return apiClient.get('/portal/buyer/queries', () => this.queries)
    }

    async replyToSupplier(no, replyText, buyerName = 'K. Ramesh') {
        const query = this.queries.find((q) => q.no === no)
        if (!query) throw new Error(`Query ${no} not found`)

        if (!replyText || !replyText.trim()) {
            throw new Error('Reply message cannot be empty.')
        }

        query.reply = replyText.trim()
        query.late = false
        query.thread.push({
            w: buyerName,
            o: 'Buyer',
            t: `Today ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
            b: replyText.trim(),
        })

        return apiClient.post(
            `/portal/buyer/queries/${no}/reply`,
            { reply: replyText, buyerName },
            () => query,
            {
                sapMessage: `Reply sent for ${no}. Also appended to ${query.link || 'linked business document'}.`,
            }
        )
    }

    async saveInternalNote(no, noteText, author = 'K. Ramesh') {
        const query = this.queries.find((q) => q.no === no)
        if (!query) throw new Error(`Query ${no} not found`)

        if (!noteText || !noteText.trim()) {
            throw new Error('Internal note cannot be empty.')
        }

        query.internalNotes = query.internalNotes || []
        query.internalNotes.push({
            author,
            timestamp: new Date().toISOString(),
            content: noteText.trim(),
        })

        return apiClient.post(
            `/portal/buyer/queries/${no}/internal-note`,
            { note: noteText, author },
            () => ({ no, status: 'SAVED', isInternal: true }),
            {
                sapMessage: 'Internal note saved. Filtered on server — never visible to supplier.',
            }
        )
    }
}

export const queryService = new QueryService()
export default queryService
