import { useState, useEffect, useCallback } from 'react'
import { VendorDataContext } from './useVendorData'
import { PROTOTYPE_DATA } from '../services/prototypeData'
import {
    approvalService,
    masterDataService,
    buyerSupplierService,
    certificateService,
    qualityService,
    scorecardService,
    queryService,
    supplierUserService,
    orderService,
    shipmentService,
    invoiceService,
    supplierQualityService,
    supplierScorecardService,
    messageService,
    documentService,
    rfqService,
    procurementService,
    registrationService,
    SAP_MASTER_TABLES,
} from '../services'

const STORAGE_KEY = 'tams_vendor_portal_v5'

function getInitialState() {
    return {
        // Buyer state
        sup: [...PROTOTYPE_DATA.vendors],
        regs: [...PROTOTYPE_DATA.regs],
        changes: [...PROTOTYPE_DATA.changes],
        certs: [...PROTOTYPE_DATA.certs],
        cases: [...PROTOTYPE_DATA.cases],
        msgs: [...PROTOTYPE_DATA.msgs],
        stuck: { ...PROTOTYPE_DATA.stuck },
        users: [...PROTOTYPE_DATA.users],
        scorecards: { published: false },

        // Supplier state
        supplier: { ...PROTOTYPE_DATA.supplier },
        orders: [...PROTOTYPE_DATA.orders],
        receipts: [...PROTOTYPE_DATA.receipts],
        invoices: [...PROTOTYPE_DATA.invoices],
        docs: [...PROTOTYPE_DATA.docs],
        rfqs: [...PROTOTYPE_DATA.rfqs],
        asns: [...PROTOTYPE_DATA.asns],
        ncr: { ...PROTOTYPE_DATA.ncr },
        ncrs: [...PROTOTYPE_DATA.ncrs],
        score: { ...PROTOTYPE_DATA.score },
        sched: [...PROTOTYPE_DATA.sched],
        tickets: [...PROTOTYPE_DATA.tickets],

        // Integration Queues & Counters
        queue: [...PROTOTYPE_DATA.queue],
        ifaces: [...PROTOTYPE_DATA.ifaces],
        counters: { ...PROTOTYPE_DATA.counters },

        // Session audit log
        log: [],
        counter: 25,
    }
}

export function VendorDataProvider({ children }) {
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (!saved) return getInitialState()
            const parsed = JSON.parse(saved)
            return { ...getInitialState(), ...parsed }
        } catch {
            return getInitialState()
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (err) {
            console.error('Failed to save portal state:', err)
        }
    }, [data])

    // --- SUPPLIER ACTIONS ---
    const submitRegistration = useCallback(async (formData) => {
        try {
            const res = await registrationService.submitApplication(formData)
            const newReg = res.data
            setData((prev) => ({
                ...prev,
                regs: [newReg, ...prev.regs],
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Supplier registration submitted: ${newReg.ref}`, r: newReg.ref }, ...prev.log],
            }))
            return { success: true, ref: newReg.ref }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    const submit8DStep = useCallback(async (stepIndex, content, hasEvidence) => {
        try {
            const res = await supplierQualityService.submit8DStep(stepIndex, content, hasEvidence)
            const updatedNcr = res.data
            setData((prev) => ({
                ...prev,
                ncr: updatedNcr,
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `8D Step D${stepIndex + 1} submitted`, r: updatedNcr.no }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // --- BUYER ACTIONS (Delegated to Modular Services) ---

    // 1. Advance Registration Step (Screen 3)
    const advanceReg = useCallback(async (ref, overrideReason = '') => {
        const target = data.regs.find((r) => r.ref === ref)
        if (!target) return { error: 'Registration not found' }

        try {
            await approvalService.advanceStep(ref, target.step, overrideReason)
            setData((prev) => ({
                ...prev,
                regs: prev.regs.map((r) => {
                    if (r.ref !== ref) return r
                    return {
                        ...r,
                        step: r.step + 1,
                        note: overrideReason ? overrideReason.trim() : r.note,
                    }
                }),
                log: [
                    { t: new Date().toLocaleTimeString('en-GB'), w: `Approved step ${target.step + 1}`, r: ref },
                    ...prev.log,
                ],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [data.regs])

    // 2. Final Approval: Create Business Partner (Screen 3)
    const createBP = useCallback(async (ref, overrideReason = '') => {
        const target = data.regs.find((r) => r.ref === ref)
        if (!target) return { error: 'Registration not found' }

        try {
            const res = await approvalService.createBusinessPartner(ref, overrideReason)
            const created = res.data.createdSupplier
            setData((prev) => ({
                ...prev,
                regs: prev.regs.map((r) => (r.ref === ref ? { ...r, st: 'DONE', bp: created.bp, note: overrideReason || r.note } : r)),
                sup: [created, ...prev.sup],
                users: [
                    { bp: created.bp, sup: created.name, name: 'New administrator', role: 'Administrator', last: 'Never', st: 'ACTIVE' },
                    ...prev.users,
                ],
                counter: prev.counter + 1,
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Business Partner ${created.bp} created (deep-insert)`, r: ref }, ...prev.log],
            }))
            return { success: true, bp: created.bp }
        } catch (err) {
            return { error: err.message }
        }
    }, [data.regs])

    // 3. Reject Registration (Screen 3)
    const rejectReg = useCallback(async (ref, reason = '') => {
        try {
            await approvalService.rejectRegistration(ref, reason)
            setData((prev) => ({
                ...prev,
                regs: prev.regs.map((r) => (r.ref === ref ? { ...r, st: 'REJECTED', rejectReason: reason } : r)),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: 'Registration rejected (0 ERP trace)', r: ref }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 4. Master Data Change Approval (Screen 4)
    const approveChange = useCallback(async (id, approverRole = 'Accounts payable') => {
        try {
            const res = await masterDataService.approveStep(id, approverRole)
            const updated = res.data
            setData((prev) => ({
                ...prev,
                changes: prev.changes.map((c) => (c.id === id ? { ...c, ...updated } : c)),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Master data change approved (${approverRole})`, r: id }, ...prev.log],
            }))
            return { success: true, change: updated }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 5. Reject Master Data Change (Screen 4)
    const rejectChange = useCallback(async (id, isFraud = false, reason = '') => {
        try {
            await masterDataService.rejectChange(id, isFraud, reason)
            setData((prev) => ({
                ...prev,
                changes: prev.changes.map((c) => (c.id === id ? { ...c, st: 'REJECTED', isFraudAlert: isFraud } : c)),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: isFraud ? 'Bank change rejected — Fraud alert raised' : 'Change rejected', r: id }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 6. Certificate Verification (Screen 6)
    const acceptCert = useCallback(async (id) => {
        try {
            await certificateService.acceptCertificate(id)
            setData((prev) => ({
                ...prev,
                certs: prev.certs.map((c) => (c.id === id || c.ref === id ? { ...c, st: 'VALID', days: 365 } : c)),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: 'Certificate verified & accepted', r: id }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    const rejectCert = useCallback(async (id, reason = '') => {
        try {
            await certificateService.rejectCertificate(id, reason)
            setData((prev) => ({
                ...prev,
                certs: prev.certs.map((c) => (c.id === id || c.ref === id ? { ...c, st: 'EXPIRED', days: -1, rejectReason: reason } : c)),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: 'Certificate rejected', r: id }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 7. 8D Quality Steps (Screen 7)
    const acceptStep8D = useCallback(async (no, stepIndex) => {
        try {
            await qualityService.acceptStep(no, stepIndex)
            setData((prev) => ({
                ...prev,
                cases: prev.cases.map((c) => {
                    if (c.no !== no) return c
                    const nextSteps = [...c.steps]
                    nextSteps[stepIndex] = 'OK'
                    const allOk = nextSteps.every((s) => s === 'OK')
                    return { ...c, steps: nextSteps, late: allOk ? 0 : c.late }
                }),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `8D Step D${stepIndex + 1} accepted`, r: no }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    const returnStep8D = useCallback(async (no, stepIndex, reason = '') => {
        try {
            await qualityService.returnStep(no, stepIndex, reason)
            setData((prev) => ({
                ...prev,
                cases: prev.cases.map((c) => {
                    if (c.no !== no) return c
                    const nextSteps = c.steps.map((s, j) => (j === stepIndex ? 'RET' : j > stepIndex ? '' : s))
                    return { ...c, steps: nextSteps, returnReason: reason }
                }),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `8D Step D${stepIndex + 1} returned (subsequent locked)`, r: no }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 8. Scorecard Publication (Screen 8)
    const publishScorecards = useCallback(async () => {
        try {
            await scorecardService.publishScorecards()
            setData((prev) => ({
                ...prev,
                scorecards: { ...prev.scorecards, published: true },
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: 'July 2026 scorecards released to suppliers', r: 'Jul 2026' }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 9. Query Reply (Screen 9)
    const replyMsg = useCallback(async (no, replyText) => {
        try {
            await queryService.replyToSupplier(no, replyText)
            setData((prev) => ({
                ...prev,
                msgs: prev.msgs.map((m) => {
                    if (m.no !== no) return m
                    return {
                        ...m,
                        reply: replyText,
                        late: false,
                        thread: [
                            ...m.thread,
                            { w: 'K. Ramesh', o: 'Buyer', t: 'Just now', b: replyText },
                        ],
                    }
                }),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: 'Reply sent on query', r: no }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // --- SUPPLIER ACTIONS (Delegated to Modular Services) ---

    // 10. Order Acknowledgement (Screen 8 & 9)
    const sendOrderAck = useCallback(async (po, item, modeOrObj = 'AS_ORDERED', maybeSplits = [], maybeReason = '') => {
        const mode = typeof modeOrObj === 'object' ? (modeOrObj.mode || 'AS_ORDERED') : modeOrObj
        const splits = typeof modeOrObj === 'object' ? (modeOrObj.splits || []) : maybeSplits
        const reason = typeof modeOrObj === 'object' ? (modeOrObj.reason || '') : maybeReason

        try {
            if (mode === 'WITH_CHANGE') {
                await orderService.acknowledgeWithSplits(po, item, splits, reason)
            } else if (mode === 'REJECT') {
                await orderService.rejectOrder(po, item, reason)
            } else {
                await orderService.acknowledgeAsOrdered(po, item)
            }

            setData((prev) => ({
                ...prev,
                orders: prev.orders.map((o) => {
                    if (o.po !== po || o.item !== item) return o
                    const ackQty = mode === 'REJECT' ? 0 : mode === 'WITH_CHANGE' ? splits.reduce((a, s) => a + (Number(s.q) || 0), 0) : o.qty
                    return {
                        ...o,
                        ack: mode,
                        ackQty,
                        ackDate: mode === 'WITH_CHANGE' ? splits[splits.length - 1]?.d : o.req,
                        splits: mode === 'WITH_CHANGE' ? splits : [],
                        age: 0,
                    }
                }),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Order confirmation posted (${mode})`, r: `${po}/${item}` }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 11. Shipment Notice / ASN (Screen 11)
    const submitASN = useCallback(async (arg1, arg2 = []) => {
        const formData = Array.isArray(arg1) ? (arg2 || {}) : (arg1 || {})
        const selectedLines = Array.isArray(arg1) ? arg1 : (arg2 || [])

        try {
            const res = await shipmentService.submitShipmentNotice(formData, selectedLines)
            setData((prev) => {
                const newReceipts = [...prev.receipts]
                const updatedOrders = prev.orders.map((o) => {
                    const match = selectedLines.find((l) => l.po === o.po && l.item === o.item)
                    if (!match) return o
                    const shipQty = Number(match.shippingQty || match.qty || 0)
                    newReceipts.unshift({
                        doc: `50001129${Math.floor(10 + Math.random() * 89)}`,
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        po: o.po,
                        item: o.item,
                        mat: o.mat,
                        desc: o.desc,
                        recv: shipQty,
                        rej: 0,
                        reason: '',
                        insp: 'Accepted',
                        billed: false,
                    })
                    return { ...o, recv: Math.min(o.qty, o.recv + shipQty) }
                })

                return {
                    ...prev,
                    orders: updatedOrders,
                    receipts: newReceipts,
                    asns: [...res.data.deliveries.map((d) => ({ ref: d.asnRef, del: d.inboundDelivery, sent: d.sentDate, status: 'POSTED' })), ...prev.asns],
                    log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `${res.data.count} Inbound Delivery posted`, r: formData.hu || 'ASN' }, ...prev.log],
                }
            })
            return { success: true, count: res.data.count }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 12. Submit Invoice (Screen 13)
    const submitInvoice = useCallback(async (invoiceData, selectedReceiptDocs = []) => {
        try {
            const res = await invoiceService.submitInvoice(invoiceData, selectedReceiptDocs)
            const newInv = res.data
            setData((prev) => ({
                ...prev,
                receipts: prev.receipts.map((r) => (selectedReceiptDocs.includes(r.doc) ? { ...r, billed: true } : r)),
                invoices: [newInv, ...prev.invoices],
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Invoice ${newInv.no} ${newInv.status} in SAP`, r: newInv.no }, ...prev.log],
            }))
            return { success: true, invoice: newInv }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 13. Retry Queue Dead-letter Item (Screen 2 / Integration)
    const retryQueueItem = useCallback(async (index) => {
        const item = data.stuck?.failed?.[index]
        if (!item) return { error: 'Item not found' }

        if (item.st === 'DEAD' && item.msg?.includes('Unit of measure')) {
            return { error: 'Failed again: The payload itself is wrong (Unit of measure does not match order). Use Edit and retry.' }
        }

        setData((prev) => {
            const nextFailed = [...(prev.stuck?.failed || [])]
            nextFailed.splice(index, 1)
            return {
                ...prev,
                stuck: { ...prev.stuck, failed: nextFailed },
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Retried ${item.what} successfully under same idempotency key`, r: item.ref }, ...prev.log],
            }
        })
        return { success: true }
    }, [data.stuck])

    const editAndRetryQueueItem = useCallback(async (index, _correctedPayload = {}) => {
        void _correctedPayload
        const item = data.stuck?.failed?.[index]
        if (!item) return { error: 'Item not found' }

        setData((prev) => {
            const nextFailed = [...(prev.stuck?.failed || [])]
            nextFailed.splice(index, 1)
            return {
                ...prev,
                stuck: { ...prev.stuck, failed: nextFailed },
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Corrected and posted ${item.what} under NEW idempotency key`, r: item.ref }, ...prev.log],
            }
        })
        return { success: true }
    }, [data.stuck])

    // 14. Sourcing & Quotes
    const createRFQ = useCallback(async (rfqData) => {
        try {
            const res = await procurementService.createRFQ(rfqData)
            const newRFQ = res.data
            setData((prev) => ({
                ...prev,
                rfqs: [
                    { no: newRFQ.rfqNumber, issued: newRFQ.createdDate, closes: newRFQ.deadlineDate, desc: newRFQ.description, quote: 'NONE', items: newRFQ.items.length },
                    ...(prev.rfqs || [])
                ],
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `RFQ ${newRFQ.rfqNumber} published`, r: newRFQ.rfqNumber }, ...prev.log],
            }))
            return { success: true, rfq: newRFQ }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    const submitQuote = useCallback(async (rfqNumber, lines) => {
        try {
            await rfqService.submitQuotation(rfqNumber, lines)
            setData((prev) => ({
                ...prev,
                rfqs: (prev.rfqs || []).map(r => r.no === rfqNumber ? { ...r, quote: 'SUBMITTED' } : r),
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `Quotation submitted for RFQ ${rfqNumber}`, r: rfqNumber }, ...prev.log],
            }))
            return { success: true }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    const awardRFQAndCreatePO = useCallback((rfqNumber, bidderName, quoteNumber, price) => {
        try {
            const poNo = `4500${Math.floor(1000 + Math.random() * 8999)}`
            setData((prev) => ({
                ...prev,
                rfqs: (prev.rfqs || []).map(r => r.no === rfqNumber ? { ...r, quote: 'AWARDED', awardedPo: poNo } : r),
                orders: [
                    { po: poNo, item: '10', type: 'PO', mat: 'A9705GGRAPZZZZZ', desc: 'GRAPHITE', qty: 100, price: Number(price), uom: 'KG', req: '2026-10-15', ack: null, recv: 0, age: 1 },
                    ...(prev.orders || [])
                ],
                log: [{ t: new Date().toLocaleTimeString('en-GB'), w: `RFQ ${rfqNumber} Awarded - PO ${poNo} Created`, r: poNo }, ...prev.log],
            }))
            return { success: true, poNo }
        } catch (err) {
            return { error: err.message }
        }
    }, [])

    // 15. Invoice & Admin
    const payInvoice = useCallback(async (invNo) => {
        setData(prev => ({
            ...prev,
            invoices: (prev.invoices || []).map(i => i.no === invNo ? { ...i, status: 'CLEARED' } : i)
        }))
    }, [])

    const releaseParkedInvoice = useCallback(async (invNo) => {
        setData(prev => ({
            ...prev,
            invoices: (prev.invoices || []).map(i => i.no === invNo ? { ...i, status: 'POSTED' } : i)
        }))
    }, [])

    const updateSupplier = useCallback(async () => {}, [])
    const deleteSupplier = useCallback(async () => {}, [])
    const retryFailed = useCallback(async () => {}, [])
    const resolvePriorityItem = useCallback(async () => {}, [])
    const updateAdminConfig = useCallback(async () => {}, [])

    const priorityQueue = data.stuck?.failed || []

    const value = {
        data,
        masterTables: SAP_MASTER_TABLES,
        suppliers: data.sup,
        purchaseOrders: data.orders,
        priorityQueue,

        // Domain Services
        services: {
            approval: approvalService,
            masterData: masterDataService,
            buyerSupplier: buyerSupplierService,
            certificate: certificateService,
            quality: qualityService,
            scorecard: scorecardService,
            query: queryService,
            supplierUser: supplierUserService,
            order: orderService,
            shipment: shipmentService,
            invoice: invoiceService,
            supplierQuality: supplierQualityService,
            supplierScorecard: supplierScorecardService,
            message: messageService,
            document: documentService,
            rfq: rfqService,
            procurement: procurementService,
        },

        // Buyer Actions
        advanceReg,
        createBP,
        rejectReg,
        approveChange,
        rejectChange,
        acceptCert,
        rejectCert,
        acceptStep8D,
        returnStep8D,
        publishScorecards,
        replyMsg,
        createRFQ,
        awardRFQAndCreatePO,
        updateSupplier,
        deleteSupplier,
        resolvePriorityItem,
        updateAdminConfig,
        payInvoice,
        releaseParkedInvoice,

        // Supplier Actions
        sendOrderAck,
        submitASN,
        submitInvoice,
        submitQuote,

        // Integration / Queue Actions
        retryQueueItem,
        editAndRetryQueueItem,
        retryFailed,
        submitRegistration,
        submit8DStep,
    }

    return (
        <VendorDataContext.Provider value={value}>
            {children}
        </VendorDataContext.Provider>
    )
}

export default VendorDataProvider
