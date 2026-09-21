/**
 * Supplier Invoice Service
 * Handles Screen 13: Submit Invoice & Screen 14: Invoices & Payment Ledger
 * 
 * Rules:
 * - Invoices created from unbilled goods receipts (GR-based IV)
 * - Supplier DOES NOT type price manually; prices come strictly from the PO
 * - Invoice number strictly capped at 16 characters (SAP field limitation)
 * - Duplicate invoice number blocked
 * - Unplanned freight warns that SAP will park the invoice for buyer approval
 * - Payment dates show contractual due date and payment-run calendar (NEVER a predicted date)
 * - Three-way match runs in SAP (API_SUPPLIERINVOICE_PROCESS_SRV)
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'
import { INITIAL_SUPPLIER_FIXTURES } from '../../fixtures/supplierFixtures'

class InvoiceService {
    constructor() {
        this.receipts = [...INITIAL_SUPPLIER_FIXTURES.receipts]
        this.invoices = [...INITIAL_SUPPLIER_FIXTURES.invoices]
    }

    async getUnbilledReceipts() {
        return apiClient.get('/portal/supplier/unbilled-receipts', () => this.receipts.filter((r) => !r.billed && r.recv > 0))
    }

    async getInvoices() {
        return apiClient.get('/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV', () => this.invoices)
    }

    async submitInvoice(invoiceData, selectedReceiptDocs = []) {
        const { invoiceNo, invoiceDate, irn, freight = 0, lines = [] } = invoiceData

        // 1. Length validation (Max 16 chars for SAP field)
        if (!invoiceNo || invoiceNo.trim().length > 16) {
            throw new Error(`Invoice number exceeds SAP field limit of 16 characters (${invoiceNo?.length || 0} entered).`)
        }

        // 2. Duplicate validation
        const exists = this.invoices.some((i) => i.no.toLowerCase() === invoiceNo.trim().toLowerCase())
        if (exists) {
            throw new Error(`Invoice number "${invoiceNo}" has already been submitted. Duplicate numbers are prohibited.`)
        }

        // 3. Mark receipts as billed
        for (const r of this.receipts) {
            if (selectedReceiptDocs.includes(r.doc)) {
                r.billed = true
            }
        }

        // 4. Calculate totals with locked PO prices
        const taxable = lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0)
        const total = Math.round(taxable * 1.18 + Number(freight || 0))
        const hasUnplannedFreight = Number(freight) > 0

        const sapDoc = `510500${Math.floor(4420 + Math.random() * 570)}`
        const newInvoice = {
            no: invoiceNo.trim(),
            sap: sapDoc,
            date: invoiceDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            amt: total,
            status: hasUnplannedFreight ? 'PARKED' : 'POSTED',
            due: '05 Oct 2026',
            block: hasUnplannedFreight ? `Unplanned freight of ₹${Number(freight).toLocaleString('en-IN')} is not on order — parked for buyer approval` : '',
            paid: '',
            irn: irn || '1120260895217744',
        }

        this.invoices.unshift(newInvoice)

        return apiClient.post(
            '/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice',
            newInvoice,
            () => newInvoice,
            {
                idempotencyKey: generateIdempotencyKey('INV', invoiceNo.trim()),
                sapMessage: hasUnplannedFreight
                    ? `Invoice ${invoiceNo} parked in S/4HANA (3-way match OK on lines, freight pending approval).`
                    : `Invoice ${invoiceNo} posted in S/4HANA (3-way match succeeded). Approved for payment on due date.`,
            }
        )
    }
}

export const invoiceService = new InvoiceService()
export default invoiceService
