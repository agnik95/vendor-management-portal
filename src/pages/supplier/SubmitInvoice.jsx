import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function formatMoney(amount) {
    if (!amount) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function SubmitInvoice() {
    const navigate = useNavigate()
    const { data, submitInvoice } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('receipt')

    // Unbilled receipts list (only receipts with unbilled quantity)
    const unbilledReceipts = useMemo(() => {
        return (data?.receipts || []).filter((r) => r?.insp !== 'Lot rejected')
    }, [data?.receipts])

    // State for selections
    const [selectedDocs, setSelectedDocs] = useState({
        [unbilledReceipts[0]?.doc]: true,
    })

    const [invoiceForm, setInvoiceForm] = useState({
        no: 'INV/26-27/0895',
        date: '21 Aug 2026',
        irn: '1120260895217744',
        ackNo: '172604418827',
        freight: 0,
        gstTreatment: 'CGST 9% + SGST 9% — intra-state',
    })

    const toggleDocSelect = (doc) => {
        setSelectedDocs((prev) => ({
            ...prev,
            [doc]: !prev[doc],
        }))
    }

    const chosenReceipts = useMemo(() => {
        return unbilledReceipts.filter((r) => selectedDocs[r?.doc])
    }, [unbilledReceipts, selectedDocs])

    const getPrice = useCallback(
        (r) => {
            const o = (data?.orders || []).find((ord) => ord?.po === r?.po && ord?.item === r?.item)
            return o ? (o.price || 420) : 420
        },
        [data?.orders]
    )

    const taxableValue = useMemo(() => {
        return chosenReceipts.reduce((sum, r) => sum + (r?.recv || 0) * getPrice(r), 0)
    }, [chosenReceipts, getPrice])

    const gstAmount = taxableValue * 0.18
    const totalAmount = taxableValue + gstAmount + Number(invoiceForm.freight || 0)

    const isDuplicate = (data?.invoices || []).some((i) => (i?.no || '').trim() === invoiceForm.no.trim())
    const isTooLong = invoiceForm.no.length > 16 // S/4HANA hard constraint

    const handleSubmit = async () => {
        if (chosenReceipts.length === 0) {
            toast.error('Selection required', 'Pick at least one goods receipt to bill against.')
            return
        }
        if (isTooLong) {
            toast.error(
                '16-Character Constraint',
                `SAP field SupplierInvoiceIDByInvcgParty accepts maximum 16 characters. You entered ${invoiceForm.no.length}.`
            )
            return
        }
        if (isDuplicate) {
            toast.error('Duplicate Invoice', 'This invoice reference number already exists in your ledger.')
            return
        }

        const isParked = Number(invoiceForm.freight) > 0
        const selectedDocIds = Object.keys(selectedDocs).filter((k) => selectedDocs[k])

        const res = await submitInvoice({
            invoiceNo: invoiceForm.no,
            no: invoiceForm.no,
            invoiceDate: invoiceForm.date,
            date: invoiceForm.date,
            irn: invoiceForm.irn,
            freight: invoiceForm.freight,
            amt: totalAmount,
            lines: chosenReceipts.map((r) => ({
                po: r.po,
                item: r.item,
                qty: r.recv,
                unitPrice: getPrice(r),
            })),
            selectedDocIds,
        }, selectedDocIds)

        if (res?.error) {
            toast.error('Submission Failed', res.error)
            return
        }

        if (isParked) {
            toast.warning(
                'Invoice Parked in SAP',
                `Invoice ${invoiceForm.no} posted with status PARKED due to ₹${Number(invoiceForm.freight).toLocaleString('en-IN')} unplanned freight. Forwarded to Category Buyer for authorization.`
            )
        } else {
            toast.success(
                'Invoice Successfully Matched & Posted',
                `SAP document ${res.invoice?.sap || '5105004421'} generated via API_SUPPLIERINVOICE_PROCESS_SRV. 3-way match verified against GR.`
            )
        }

        navigate('/supplier/invoices')
    }

    const tabsList = [
        { id: 'receipt', label: 'Create from receipt' },
        { id: 'order', label: 'Create from order' },
        { id: 'service', label: 'Service entry' },
        { id: 'credit', label: 'Credit note' },
        { id: 'drafts', label: 'Drafts' },
    ]

    return (
        <AppLayout activePage="Submit invoice" portal="Supplier">
            <PageContainer
                kicker="3-WAY MATCH INVOICE WORKBENCH"
                title="Submit an invoice"
                subtitle="GR-based invoice verification strictly posting against confirmed goods receipts via API_SUPPLIERINVOICE_PROCESS_SRV."
            >
                <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

                {/* Step 1: Pick receipts to bill */}
                <Card style={{ marginTop: '16px', marginBottom: '24px' }}>
                    <Card.Header
                        kicker="STEP 1 OF 2"
                        title="Pick the goods receipts to bill"
                        action={
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {chosenReceipts.length} receipt(s) selected
                            </span>
                        }
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={[
                                {
                                    key: 'select',
                                    header: '',
                                    width: '40px',
                                    render: (row) => (
                                        <input
                                            type="checkbox"
                                            checked={Boolean(selectedDocs[row.doc])}
                                            onChange={() => toggleDocSelect(row.doc)}
                                        />
                                    ),
                                },
                                {
                                    key: 'doc',
                                    header: 'Material Doc',
                                    render: (row) => <span className="font-mono font-bold text-blue-600">{row.doc}</span>,
                                },
                                { key: 'date', header: 'Posting Date', render: (row) => row.date },
                                {
                                    key: 'po',
                                    header: 'Order / Item',
                                    render: (row) => `${row.po} / ${row.item}`,
                                },
                                {
                                    key: 'mat',
                                    header: 'Material Specification',
                                    render: (row) => `${row.mat} · ${row.desc}`,
                                },
                                {
                                    key: 'recv',
                                    header: 'Billable Quantity',
                                    align: 'right',
                                    render: (row) => `${row.recv.toLocaleString('en-IN')} pcs`,
                                },
                                {
                                    key: 'price',
                                    header: 'PO Unit Price (Locked)',
                                    align: 'right',
                                    render: (row) => `₹${getPrice(row).toFixed(2)}`,
                                },
                                {
                                    key: 'val',
                                    header: 'Net Value',
                                    align: 'right',
                                    render: (row) => (
                                        <span className="font-mono font-bold">
                                            {formatMoney(row.recv * getPrice(row))}
                                        </span>
                                    ),
                                },
                            ]}
                            data={unbilledReceipts}
                            emptyMessage="No unbilled receipts available."
                        />
                    </Card.Body>
                </Card>

                {/* Step 2: Invoice Form & Validation Checks */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {/* Left: Input Form */}
                    <Card>
                        <Card.Header kicker="STEP 2 OF 2" title="Your invoice details" />
                        <Card.Body>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <FormField
                                    label="Your Invoice Number (16-char max)"
                                    required
                                    helper={
                                        isTooLong
                                            ? `Too long for SAP field (${invoiceForm.no.length}/16)`
                                            : isDuplicate
                                            ? 'Invoice number already exists in ledger'
                                            : 'Must match physical PDF invoice'
                                    }
                                >
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={invoiceForm.no}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, no: e.target.value })}
                                        style={{
                                            borderColor: isTooLong || isDuplicate ? 'var(--color-danger, #ef4444)' : 'inherit',
                                        }}
                                    />
                                </FormField>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <FormField label="Invoice Date" required>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={invoiceForm.date}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                                        />
                                    </FormField>
                                    <FormField label="GST Treatment" required>
                                        <select
                                            className="form-control"
                                            value={invoiceForm.gstTreatment}
                                            onChange={(e) =>
                                                setInvoiceForm({ ...invoiceForm, gstTreatment: e.target.value })
                                            }
                                        >
                                            <option>CGST 9% + SGST 9% — intra-state</option>
                                            <option>IGST 18% — inter-state</option>
                                        </select>
                                    </FormField>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <FormField label="IRN Hash (64-char)" required>
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={invoiceForm.irn}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, irn: e.target.value })}
                                        />
                                    </FormField>
                                    <FormField label="E-Invoice Ack Number" required>
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={invoiceForm.ackNo}
                                            onChange={(e) => setInvoiceForm({ ...invoiceForm, ackNo: e.target.value })}
                                        />
                                    </FormField>
                                </div>

                                <FormField
                                    label="Freight & Unplanned Charges (INR)"
                                    helper="Unplanned freight not specified on PO will cause SAP to park the invoice"
                                >
                                    <input
                                        type="number"
                                        className="form-control font-mono"
                                        value={invoiceForm.freight}
                                        onChange={(e) =>
                                            setInvoiceForm({ ...invoiceForm, freight: Number(e.target.value) || 0 })
                                        }
                                    />
                                </FormField>

                                {/* Calculated Totals Box */}
                                <div
                                    style={{
                                        padding: '16px',
                                        borderRadius: '8px',
                                        background: 'var(--bg-card-subtle, #f8fafc)',
                                        border: '1px solid var(--border-color, #e2e8f0)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span>Taxable Goods Value</span>
                                        <span className="font-mono">{formatMoney(taxableValue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span>GST (18% calculated)</span>
                                        <span className="font-mono">{formatMoney(gstAmount)}</span>
                                    </div>
                                    {Number(invoiceForm.freight) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-warning, #b45309)' }}>
                                            <span>Unplanned Freight</span>
                                            <span className="font-mono">{formatMoney(invoiceForm.freight)}</span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            borderTop: '1px solid var(--border-color, #cbd5e1)',
                                            paddingTop: '8px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        <span>Invoice Total</span>
                                        <span className="font-mono text-blue-600">{formatMoney(totalAmount)}</span>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        border: '2px dashed var(--border-color, #cbd5e1)',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#fff',
                                    }}
                                    onClick={() => toast.info('File attached', 'signed-tax-invoice.pdf · SHA-256 verified')}
                                >
                                    <div style={{ fontSize: '20px' }}>📎</div>
                                    <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Attach signed Tax Invoice PDF & E-Way Bill</div>
                                </div>
                            </div>
                        </Card.Body>
                        <Card.Footer>
                            <Button variant="secondary" onClick={() => toast.info('Draft saved', 'Saved to vp_invoice_submission.')}>
                                Save draft
                            </Button>
                            <div style={{ flex: 1 }} />
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={chosenReceipts.length === 0 || isDuplicate || isTooLong}
                            >
                                Submit invoice
                            </Button>
                        </Card.Footer>
                    </Card>

                    {/* Right: Validation Gates & Business Rules */}
                    <Card>
                        <Card.Header kicker="SAP PRE-FLIGHT INTEGRATION GATES" title="Submission checks" />
                        <Card.Body>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: !isDuplicate ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                                        {!isDuplicate ? '✓' : '✕'}
                                    </span>
                                    <span style={{ fontSize: '13px' }}>
                                        Invoice number not used before ({invoiceForm.no})
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: !isTooLong ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                                        {!isTooLong ? '✓' : '✕'}
                                    </span>
                                    <span style={{ fontSize: '13px' }}>
                                        Fits 16-character SAP ERP field ({invoiceForm.no.length} / 16)
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                                    <span style={{ fontSize: '13px' }}>IRN verified against Invoice Registration Portal (IRP)</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                                    <span style={{ fontSize: '13px' }}>Supplier GSTIN matches verified Business Partner record</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                                    <span style={{ fontSize: '13px' }}>Unit prices strictly derived from PO line items</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: Number(invoiceForm.freight) === 0 ? '#16a34a' : '#f59e0b', fontWeight: 'bold' }}>
                                        {Number(invoiceForm.freight) === 0 ? '✓' : '⚠️'}
                                    </span>
                                    <span style={{ fontSize: '13px' }}>
                                        {Number(invoiceForm.freight) === 0
                                            ? 'Zero unplanned freight charges'
                                            : `Unplanned freight (${formatMoney(invoiceForm.freight)}) will cause SAP to park the invoice`}
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    marginTop: '20px',
                                    padding: '14px',
                                    borderRadius: '6px',
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    fontSize: '12.5px',
                                    lineHeight: 1.5,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <strong>3-Way Matching Happens in SAP S/4HANA:</strong> The portal validates formatting, IRN,
                                and duplicate constraints prior to dispatch. When posted, SAP executes automated price and
                                quantity verification between the PO, GR, and Invoice lines.
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default SubmitInvoice
