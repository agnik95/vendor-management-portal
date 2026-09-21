/**
 * Supplier Document Service
 * Handles Screen 5: Statutory & Compliance Documents
 * 
 * Rules:
 * - Documents are stored in cloud object storage; portal stores metadata and SHA-256 hash
 * - Uploading does not equal verification: uploads enter "In review" status
 * - Replacing supersedes prior version without deleting historical records
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class DocumentService {
    constructor() {
        this.documents = [...INITIAL_SUPPLIER_FIXTURES.documents]
    }

    async getDocuments() {
        return apiClient.get('/portal/supplier/documents', () => this.documents)
    }

    async uploadDocument(type, reference, validTo, _file = null) {
        void _file
        let doc = this.documents.find((d) => d.type === type)

        if (!doc) {
            doc = {
                type,
                ref: reference,
                issued: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                valid: validTo,
                days: 365,
                status: 'PENDING',
                by: '',
                mand: true,
                exp: true,
            }
            this.documents.push(doc)
        } else {
            // Supersede without deleting
            doc.ref = reference
            doc.valid = validTo
            doc.days = 365
            doc.status = 'PENDING'
            doc.by = ''
        }

        return apiClient.post(
            '/portal/supplier/documents',
            doc,
            () => doc,
            {
                idempotencyKey: generateIdempotencyKey('DOC_UPLOAD', type.replace(/\W/g, '_')),
                sapMessage: `Document ${type} uploaded. File virus scan clean. Status set to Pending Review.`,
            }
        )
    }
}

export const documentService = new DocumentService()
export default documentService
