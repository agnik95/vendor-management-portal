/**
 * Procurement Service
 * 
 * Implements the complete End-to-End Direct & Consumable Procurement workflow
 * as defined in the Maharashtra Seamless Ltd (MSLU) SAP S/4HANA Process Specification.
 * 
 * All methods return standardized Promises and interact via apiClient, ensuring
 * seamless migration when real backend OData/REST services become available.
 */

import apiClient, { generateIdempotencyKey } from './apiClient'
import { getInitialDirectProcurementCycle, SAP_MASTER_TABLES } from './mockData'

class ProcurementService {
    constructor() {
        this.cycleState = getInitialDirectProcurementCycle()
    }

    /**
     * Get all Master Reference Tables
     */
    getMasterTables() {
        return SAP_MASTER_TABLES
    }

    /**
     * Get full procurement cycle snapshot
     */
    async getProcurementCycleState() {
        return apiClient.get('/procurement/cycle-state', () => this.cycleState)
    }

    /**
     * Step 1.1.1: Create Purchase Requisition (PR)
     */
    async createPurchaseRequisition(prData) {
        const nextPrNumber = `13000${Math.floor(60 + Math.random() * 40)}`
        const newPR = {
            prNumber: nextPrNumber,
            docType: prData.docType || 'ZCON',
            plant: prData.plant || 'MSLU',
            companyCode: prData.companyCode || 'MSLU',
            purchasingGroup: prData.purchasingGroup || '840',
            storageLocation: prData.storageLocation || 'MCN1',
            department: prData.department || 'Stores',
            creator: prData.creator || 'Kranti Babhulkar',
            createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'IN_APPROVAL',
            totalValue: prData.items?.reduce((acc, it) => acc + (it.quantity * it.estPrice), 0) || 345000,
            currency: 'INR',
            items: prData.items || [
                {
                    item: '00010',
                    materialCode: 'A9705GGRAPZZZZZ',
                    materialDesc: 'GRAPHITE',
                    extendedDesc: 'High-density graphite block',
                    quantity: 100,
                    uom: 'KG',
                    estPrice: 450.00,
                    totalValue: 45000.00,
                    deliveryDate: '15 Apr 2025',
                },
            ],
            approvalHistory: [],
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_PURCHASEREQUISITION_2/A_PurchaseRequisitionHeader',
            newPR,
            () => {
                this.cycleState.requisitions.unshift(newPR)
                return newPR
            },
            {
                idempotencyKey: generateIdempotencyKey('PR', nextPrNumber),
                sapMessage: `Purchase Requisition ${nextPrNumber} created in SAP S/4HANA`,
            }
        )
    }

    /**
     * Step 1.1.2: Approve Purchase Requisition (My Inbox)
     */
    async approvePurchaseRequisition(prNumber, note = 'Approved for procurement') {
        return apiClient.post(
            `/sap/opu/odata/sap/API_PURCHASEREQUISITION_2/ApprovePR`,
            { prNumber, note },
            () => {
                const pr = this.cycleState.requisitions.find((r) => r.prNumber === prNumber)
                if (pr) {
                    pr.status = 'APPROVED'
                    pr.approvalHistory.push({
                        approver: 'Upesh Patel',
                        role: 'Project Owner',
                        action: 'Approved',
                        date: new Date().toLocaleString(),
                        note,
                    })
                }
                return { success: true, prNumber, status: 'APPROVED' }
            },
            {
                idempotencyKey: generateIdempotencyKey('PR_APP', prNumber),
                sapMessage: `Purchase Requisition ${prNumber} approved in My Inbox`,
            }
        )
    }

    /**
     * Step 1.1.3: Create Request for Quotation (RFQ)
     */
    async createRFQ(rfqData) {
        const nextRfq = `70000000${Math.floor(15 + Math.random() * 85)}`
        const newRFQ = {
            rfqNumber: nextRfq,
            refPrNumber: rfqData.refPrNumber || '1300056',
            rfqType: rfqData.rfqType || 'RQ',
            description: rfqData.description || 'Int. Sourcing Req - Consumables',
            purchasingOrg: rfqData.purchasingOrg || 'MSPO',
            purchasingGroup: rfqData.purchasingGroup || '840',
            companyCode: rfqData.companyCode || 'MSLU',
            deadlineDate: rfqData.deadlineDate || '25 Apr 2025',
            createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'PUBLISHED',
            items: rfqData.items || [
                { item: '10', materialCode: 'A9705GGRAPZZZZZ', materialDesc: 'GRAPHITE', qty: 100, uom: 'KG' },
                { item: '20', materialCode: 'A9705GBORXZZZZZ', materialDesc: 'BORAX', qty: 200, uom: 'KG' },
            ],
            bidders: rfqData.bidders || [
                { supplierId: '120000', name: 'Jindal Steels', invited: true, status: 'INVITED' },
                { supplierId: '120001', name: 'Jindal Pipe Limited', invited: true, status: 'INVITED' },
                { supplierId: '120002', name: 'Vibhor Steel Tubes Pvt Ltd', invited: true, status: 'INVITED' },
            ],
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_RFQ_PROCESS_SRV/A_RequestForQuotation',
            newRFQ,
            () => {
                this.cycleState.rfqs.unshift(newRFQ)
                return newRFQ
            },
            {
                idempotencyKey: generateIdempotencyKey('RFQ', nextRfq),
                sapMessage: `RFQ ${nextRfq} published to bidders`,
            }
        )
    }

    /**
     * Step 1.1.5: Submit Supplier Quotation
     */
    async submitSupplierQuotation(quoteData) {
        const nextQuoteNo = `80000000${Math.floor(35 + Math.random() * 65)}`
        const newQuote = {
            quotationNumber: nextQuoteNo,
            rfqNumber: quoteData.rfqNumber || '7000000014',
            supplierId: quoteData.supplierId || '120000',
            supplierName: quoteData.supplierName || 'Jindal Steels',
            submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            netValue: quoteData.netValue || 300000.00,
            status: 'SUBMITTED',
            items: quoteData.items || [],
            notes: quoteData.notes || 'Submitted per specifications',
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_SUPPLIERQUOTATION_PROCESS_SRV/A_SupplierQuotation',
            newQuote,
            () => {
                this.cycleState.quotations.unshift(newQuote)
                // update bidder status in RFQ
                const rfq = this.cycleState.rfqs.find((r) => r.rfqNumber === quoteData.rfqNumber)
                if (rfq) {
                    const b = rfq.bidders.find((x) => x.supplierId === quoteData.supplierId)
                    if (b) {
                        b.status = 'SUBMITTED'
                        b.quotationNumber = nextQuoteNo
                    }
                }
                return newQuote
            },
            {
                idempotencyKey: generateIdempotencyKey('QUOTE', nextQuoteNo),
                sapMessage: `Supplier Quotation ${nextQuoteNo} recorded in S/4HANA`,
            }
        )
    }

    /**
     * Step 1.1.6: Compare Supplier Quotations & Maintain Award
     */
    async awardQuotations(rfqNumber, winningQuoteNumber, awardedItems) {
        return apiClient.post(
            `/sap/opu/odata/sap/API_SUPPLIERQUOTATION_PROCESS_SRV/AwardQuotation`,
            { rfqNumber, winningQuoteNumber, awardedItems },
            () => {
                this.cycleState.quotations.forEach((q) => {
                    if (q.rfqNumber === rfqNumber) {
                        if (q.quotationNumber === winningQuoteNumber) {
                            q.status = 'AWARDED'
                            if (awardedItems) {
                                q.items = awardedItems
                            }
                        } else {
                            q.status = 'REJECTED'
                        }
                    }
                })
                const rfq = this.cycleState.rfqs.find((r) => r.rfqNumber === rfqNumber)
                if (rfq) {
                    rfq.status = 'AWARDED'
                }
                return { success: true, winningQuoteNumber }
            },
            {
                idempotencyKey: generateIdempotencyKey('AWARD', winningQuoteNumber),
                sapMessage: `Quotation ${winningQuoteNumber} successfully awarded`,
            }
        )
    }

    /**
     * Step 1.1.7: Create Purchase Order (PO)
     */
    async createPurchaseOrder(poData) {
        const nextPoNumber = `440000${Math.floor(25 + Math.random() * 75)}`
        const newPO = {
            poNumber: nextPoNumber,
            refPrNumber: poData.refPrNumber || '1300056',
            refRfqNumber: poData.refRfqNumber || '7000000014',
            supplierId: poData.supplierId || '120000',
            supplierName: poData.supplierName || 'Jindal Steels',
            docType: poData.docType || 'YCON',
            purchasingOrg: poData.purchasingOrg || 'MSPO',
            purchasingGroup: poData.purchasingGroup || '840',
            companyCode: poData.companyCode || 'MSLU',
            plant: poData.plant || 'MSLU',
            taxCode: poData.taxCode || 'G3',
            confControl: '0004',
            grBsdIV: true,
            incoterms: poData.incoterms || 'FCA',
            paymentTerms: poData.paymentTerms || 'ZN30',
            overdeliveryTol: 5,
            underdeliveryTol: 5,
            status: 'IN_APPROVAL',
            totalNetValue: poData.totalNetValue || 277200.00,
            conditions: poData.conditions || [
                { type: 'ZDIP', desc: 'MSL Supp. Discount %', value: 6.7, amount: -20100 },
                { type: 'ZFRE', desc: 'MSL Freight Value', value: 0, amount: 0 },
                { type: 'ZPAC', desc: 'MSL Packaging', value: 0, amount: 0 },
            ],
            items: poData.items || [
                { item: '10', materialCode: 'A9705GGRAPZZZZZ', desc: 'GRAPHITE', qty: 100, uom: 'KG', price: 1000.00, delDate: '15 Apr 2025', deliveredQty: 0 },
                { item: '20', materialCode: 'A9705GBORXZZZZZ', desc: 'BORAX', qty: 200, uom: 'KG', price: 1000.00, delDate: '15 Apr 2025', deliveredQty: 0 },
            ],
            customFields: {
                modeOfTransport: poData.modeOfTransport || 'Road',
                paymentMode: poData.paymentMode || 'Cheque',
                carrier: poData.carrier || 'VRL Logistics',
                contactPerson: poData.contactPerson || 'M. Sharma',
            },
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_PURCHASEORDER_2/A_PurchaseOrder',
            newPO,
            () => {
                this.cycleState.purchaseOrders.unshift(newPO)
                return newPO
            },
            {
                idempotencyKey: generateIdempotencyKey('PO', nextPoNumber),
                sapMessage: `Consumable PO ${nextPoNumber} created under S/4HANA`,
            }
        )
    }

    /**
     * Step 1.1.8: Approve Purchase Order (My Inbox)
     */
    async approvePurchaseOrder(poNumber, note = 'PO Approved per operational requirements') {
        return apiClient.post(
            `/sap/opu/odata/sap/API_PURCHASEORDER_2/ApprovePO`,
            { poNumber, note },
            () => {
                const po = this.cycleState.purchaseOrders.find((p) => p.poNumber === poNumber)
                if (po) {
                    po.status = 'APPROVED'
                }
                return { success: true, poNumber, status: 'APPROVED' }
            },
            {
                idempotencyKey: generateIdempotencyKey('PO_APP', poNumber),
                sapMessage: `Purchase Order ${poNumber} approved in My Inbox`,
            }
        )
    }

    /**
     * Step 1.1.10: Create Inbound Delivery (ASN)
     */
    async createInboundDelivery(deliveryData) {
        const nextDelNumber = `1800000${Math.floor(80 + Math.random() * 20)}`
        const newDelivery = {
            deliveryNumber: nextDelNumber,
            refPoNumber: deliveryData.refPoNumber || '44000020',
            supplierId: deliveryData.supplierId || '120000',
            supplierName: deliveryData.supplierName || 'Jindal Steels',
            deliveryDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'GOODS_IN_TRANSIT',
            items: (deliveryData.items || []).map((it, idx) => ({
                ...it,
                batchNumber: it.batchNumber || `0000000${200 + idx}`,
            })),
            customFields: {
                billDate: deliveryData.billDate || '20 Mar 2025',
                vendorInvoiceNo: deliveryData.vendorInvoiceNo || `INV/${Math.floor(100000 + Math.random() * 900000)}`,
                challanNo: deliveryData.challanNo || `${Math.floor(100000 + Math.random() * 900000)}`,
                challanDate: deliveryData.challanDate || '30 Mar 2025',
                gateEntryNo: deliveryData.gateEntryNo || 'Gate 2',
                gateEntryDate: deliveryData.gateEntryDate || '02 Apr 2025',
                lrDate: deliveryData.lrDate || '06 Apr 2025',
                lrNo: deliveryData.lrNo || '4364363',
                transporterName: deliveryData.transporterName || 'VRL Logistics',
                vehicleNo: deliveryData.vehicleNo || 'KA01AB4471',
                vehicleType: deliveryData.vehicleType || '101 Truck',
                supplierInvoiceNetWeight: deliveryData.netWeight || '75.0 KG',
                weighbridgeNetWeight: deliveryData.weighbridgeWeight || '75.2 KG',
                egpDate: deliveryData.egpDate || '10 Apr 2025',
                egpNo: deliveryData.egpNo || '65756',
            },
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV_0002/A_InbDeliveryHeader',
            newDelivery,
            () => {
                this.cycleState.inboundDeliveries.unshift(newDelivery)
                return newDelivery
            },
            {
                idempotencyKey: generateIdempotencyKey('DELIV', nextDelNumber),
                sapMessage: `Inbound Delivery ${nextDelNumber} created with batch assignments`,
            }
        )
    }

    /**
     * Step 1.1.11: Post Goods Receipt (GRN - Movement 101)
     */
    async postGoodsReceipt(deliveryNumber, items) {
        const nextGrnNumber = `50000000${Math.floor(176 + Math.random() * 24)}`
        const deliv = this.cycleState.inboundDeliveries.find((d) => d.deliveryNumber === deliveryNumber)
        const refPo = deliv?.refPoNumber || '44000020'

        const newGRN = {
            grnNumber: nextGrnNumber,
            refDeliveryNumber: deliveryNumber,
            refPoNumber: refPo,
            movementType: '101',
            postingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            collectiveSlip: '3 Collective Slip',
            status: 'POSTED',
            items: (items || deliv?.items || []).map((it, idx) => ({
                line: idx + 1,
                materialCode: it.materialCode,
                desc: it.desc,
                grnQty: it.deliveryQty || it.grnQty || 25,
                uom: it.uom || 'KG',
                stockType: 'Quality Inspection',
                sloc: 'MCN1',
            })),
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader',
            newGRN,
            () => {
                this.cycleState.goodsReceipts.unshift(newGRN)
                if (deliv) {
                    deliv.status = 'GOODS_RECEIVED'
                }
                // Update delivered qty on PO
                const po = this.cycleState.purchaseOrders.find((p) => p.poNumber === refPo)
                if (po) {
                    newGRN.items.forEach((gi) => {
                        const pi = po.items.find((x) => x.materialCode === gi.materialCode)
                        if (pi) {
                            pi.deliveredQty = (pi.deliveredQty || 0) + gi.grnQty
                        }
                    })
                }
                return newGRN
            },
            {
                idempotencyKey: generateIdempotencyKey('GRN', nextGrnNumber),
                sapMessage: `Material Document ${nextGrnNumber} posted (Movement 101)`,
            }
        )
    }

    /**
     * Step 1.1.12: Create Supplier Invoice (MIRO Verification & G/L Simulation)
     */
    async createSupplierInvoice(invoiceData) {
        const nextInvNumber = `5105600${Math.floor(140 + Math.random() * 60)}`
        const taxable = invoiceData.taxableAmount || 55460.00
        const taxRate = invoiceData.taxRate || 18
        const taxAmount = (taxable * taxRate) / 100
        const grossTotal = taxable + taxAmount

        const newInvoice = {
            invoiceNumber: nextInvNumber,
            supplierInvoiceRef: invoiceData.supplierInvoiceRef || `SUPP_INV_${Math.floor(1000 + Math.random() * 9000)}`,
            refPoNumber: invoiceData.refPoNumber || '44000020',
            refGrnNumber: invoiceData.refGrnNumber || '50000000175',
            supplierId: invoiceData.supplierId || '120000',
            supplierName: invoiceData.supplierName || 'Jindal Steels',
            companyCode: 'MSLU',
            invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            postingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            taxCode: invoiceData.taxCode || 'G3',
            taxRate,
            taxableAmount: taxable,
            taxAmount,
            totalGrossAmount: grossTotal,
            balance: 0.00,
            status: 'POSTED',
            glSimulation: [
                { account: '21100000', name: 'Jindal Steels / Vendor Payables', amount: -Number((grossTotal - 1110).toFixed(2)), type: 'Credit' },
                { account: '21120000', name: 'Goods Received / Invoice Received', amount: Number(taxable.toFixed(2)), type: 'Debit' },
                { account: '12605900', name: 'Input Tax Account IGST', amount: Number(taxAmount.toFixed(2)), type: 'Debit' },
                { account: '21403000', name: 'Withholding Tax 194Q', amount: -1110.00, type: 'Credit' },
            ],
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice',
            newInvoice,
            () => {
                this.cycleState.supplierInvoices.unshift(newInvoice)
                return newInvoice
            },
            {
                idempotencyKey: generateIdempotencyKey('INVOICE', nextInvNumber),
                sapMessage: `Supplier Invoice verification document ${nextInvNumber} created`,
            }
        )
    }

    /**
     * Step 1.1.13: Post Outgoing Payment & Clear Journal Entry
     */
    async postOutgoingPayment(invoiceNumber, amount) {
        const nextPaymentDoc = `15000000${Math.floor(36 + Math.random() * 64)}`
        const inv = this.cycleState.supplierInvoices.find((i) => i.invoiceNumber === invoiceNumber)
        const payAmount = amount || inv?.totalGrossAmount || 65442.80

        const newPayment = {
            paymentDocNumber: nextPaymentDoc,
            fiscalYear: new Date().getFullYear().toString(),
            companyCode: 'MSLU',
            postingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            houseBank: 'YES 1',
            glAccount: '1100104 (YES Bank Main 1)',
            supplierId: inv?.supplierId || '120000',
            supplierName: inv?.supplierName || 'Jindal Steels',
            clearedInvoiceRef: invoiceNumber,
            clearedAmount: payAmount,
            currency: 'INR',
            journalEntries: [
                { line: 1, account: '1100104', desc: 'YES Bank Main 1', amount: -Number(payAmount.toFixed(2)), type: 'Credit' },
                { line: 2, account: '120000', desc: `${inv?.supplierName || 'Jindal Steels'} (Vendor Cleared)`, amount: Number(payAmount.toFixed(2)), type: 'Debit' },
            ],
        }

        return apiClient.post(
            '/sap/opu/odata/sap/API_OPLACCTGDOCITEMCUBE_SRV/PostOutgoingPayment',
            newPayment,
            () => {
                this.cycleState.outgoingPayments.unshift(newPayment)
                if (inv) {
                    inv.status = 'CLEARED'
                }
                return newPayment
            },
            {
                idempotencyKey: generateIdempotencyKey('PAYMENT', nextPaymentDoc),
                sapMessage: `Payment Journal Entry ${nextPaymentDoc} posted and cleared`,
            }
        )
    }
}

export const procurementService = new ProcurementService()
export default procurementService
