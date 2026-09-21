import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import MetricCard from '../../components/common/MetricCard'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function formatMoney(amount) {
    if (!amount) return '₹0'
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function InvoicesPayment() {
    const navigate = useNavigate()
    const { data, payInvoice, releaseParkedInvoice } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('all')
    const [disputeModal, setDisputeModal] = useState({ open: false, invoiceNo: '', reason: '' })

    const invoices = useMemo(() => data?.invoices || [], [data?.invoices])

    const unpaidInvoices = useMemo(
        () => invoices.filter((i) => i?.status === 'POSTED' || i?.status === 'PARKED'),
        [invoices]
    )
    const exceptionInvoices = useMemo(
        () => invoices.filter((i) => ['REJECTED', 'BLOCKED', 'PARKED'].includes(i?.status)),
        [invoices]
    )
    const paidInvoices = useMemo(
        () => invoices.filter((i) => i?.status === 'PAID'),
        [invoices]
    )

    const totalSubmitted = useMemo(
        () => invoices.reduce((sum, i) => sum + (i?.amt || 0), 0),
        [invoices]
    )

    const totalUnpaid = useMemo(
        () => unpaidInvoices.reduce((sum, i) => sum + (i?.amt || 0), 0),
        [unpaidInvoices]
    )

    const totalExceptions = useMemo(
        () => exceptionInvoices.reduce((sum, i) => sum + (i?.amt || 0), 0),
        [exceptionInvoices]
    )

    const displayInvoices = useMemo(() => {
        switch (activeTab) {
            case 'unpaid':
                return unpaidInvoices
            case 'exception':
                return exceptionInvoices
            case 'paid':
                return paidInvoices
            case 'all':
            default:
                return invoices
        }
    }, [activeTab, unpaidInvoices, exceptionInvoices, paidInvoices, invoices])

    const tabsList = [
        { id: 'all', label: 'All' },
        { id: 'unpaid', label: 'Posted & unpaid' },
        { id: 'exception', label: 'In exception' },
        { id: 'paid', label: 'Paid' },
    ]

    const handleConfirmDispute = () => {
        if (!disputeModal.reason.trim()) {
            toast.warning('Input required', 'Please describe the payment or billing exception.')
            return
        }
        toast.success(
            `Clarification ticket opened for ${disputeModal.invoiceNo}`,
            'Routed directly to Accounts Payable team. View progress in Support & Messages.'
        )
        setDisputeModal({ open: false, invoiceNo: '', reason: '' })
    }

    const tableColumns = [
        {
            key: 'no',
            header: 'Your Invoice',
            render: (row) => <span className="font-mono font-bold">{row.no}</span>,
        },
        {
            key: 'sap',
            header: 'SAP Accounting Doc',
            render: (row) =>
                row.sap ? <span className="font-mono text-blue-600">{row.sap}</span> : <span className="text-muted">—</span>,
        },
        { key: 'date', header: 'Submitted', render: (row) => row.date },
        {
            key: 'amt',
            header: 'Invoice Amount',
            align: 'right',
            render: (row) => <span className="font-mono font-bold">{formatMoney(row.amt)}</span>,
        },
        {
            key: 'status',
            header: 'ERP Status',
            render: (row) => {
                if (row.status === 'PAID') return <StatusBadge status={`Paid ${row.paid || ''}`} tone="success" />
                if (row.status === 'POSTED') return <StatusBadge status="Approved for payment" tone="success" />
                if (row.status === 'PARKED') return <StatusBadge status="Parked (Buyer Review)" tone="warning" />
                if (row.status === 'BLOCKED') return <StatusBadge status="Payment Block" tone="danger" />
                return <StatusBadge status="Rejected" tone="danger" />
            },
        },
        { key: 'due', header: 'Due Date', render: (row) => row.due || '—' },
        {
            key: 'block',
            header: 'Exception / Settlement Reason',
            render: (row) =>
                row.block ? (
                    <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: '12.5px' }}>{row.block}</span>
                ) : (
                    <span className="text-muted">—</span>
                ),
        },
        {
            key: 'action',
            header: 'Action',
            render: (row) => (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {row.status === 'POSTED' && (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                const res = payInvoice(row.no)
                                toast.success(
                                    `Payment Run Cleared for ${row.no}`,
                                    `S/4HANA Accounting Journal Entry committed. ${res.utr} recorded.`
                                )
                            }}
                            title="Execute simulated SAP S/4HANA payment clearing run"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                            Pay / Clear →
                        </button>
                    )}
                    {row.status === 'PARKED' && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                releaseParkedInvoice(row.no)
                                toast.success(
                                    `Parked Invoice ${row.no} Released`,
                                    'Category buyer authorized unplanned freight. Status moved to Approved for payment.'
                                )
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                            Authorize
                        </button>
                    )}
                    {row.status === 'PAID' && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                toast.info(
                                    `Remittance Advice PDF · ${row.no}`,
                                    `Payment reference: ${row.utr || 'HDFC26081844712'}. Re-generated from live accounting document at time of request.`
                                )
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                            Remittance PDF
                        </button>
                    )}
                    {['REJECTED', 'BLOCKED'].includes(row.status) && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDisputeModal({ open: true, invoiceNo: row.no, reason: '' })}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                            Dispute
                        </button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <AppLayout activePage="Invoices & payments" portal="Supplier">
            <PageContainer
                kicker="FINANCE & ACCOUNTING LEDGER"
                title="Invoices & payments"
                subtitle="Live status read from SAP S/4HANA open accounting items, payment clearing runs, and remittance advices."
                actions={
                    <Button variant="primary" size="sm" onClick={() => navigate('/supplier/submit-invoice')}>
                        + Submit new invoice
                    </Button>
                }
            >
                {/* 4 KPI Metrics */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Submitted this month"
                        value={formatMoney(totalSubmitted)}
                        sub={`${invoices.length} invoices processed`}
                        tone="neutral"
                    />
                    <MetricCard
                        label="Approved & unpaid"
                        value={formatMoney(totalUnpaid)}
                        sub="Next payment run 25 Aug 2026"
                        tone="neutral"
                    />
                    <MetricCard
                        label="In exception / parked"
                        value={formatMoney(totalExceptions)}
                        sub={`${exceptionInvoices.length} invoices require resolution`}
                        tone={exceptionInvoices.length > 0 ? 'danger' : 'success'}
                    />
                    <MetricCard
                        label="Average days to pay"
                        value="41 days"
                        sub="Corporate terms: 45 days net"
                        tone="success"
                    />
                </div>

                {/* Main Invoices Table */}
                <Card>
                    <Card.Header
                        title="Invoice Ledger"
                        action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={tableColumns}
                            data={displayInvoices}
                            emptyMessage="No invoices found matching this filter."
                        />
                    </Card.Body>
                    <Card.Footer>
                        <div style={{ flex: 1 }} />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                setDisputeModal({
                                    open: true,
                                    invoiceNo: invoices[0]?.no || 'INV/26-27/0894',
                                    reason: '',
                                })
                            }
                        >
                            Dispute an invoice
                        </Button>
                    </Card.Footer>
                </Card>

                {/* Remittance Advice & Anti-Prediction Note */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                        marginTop: '24px',
                    }}
                >
                    <Card>
                        <Card.Header
                            title="Remittance advice · 18 Aug 2026"
                            kicker="SAP PAYMENT RUN CLEARED"
                            action={
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                        toast.info(
                                            'Remittance Advice PDF',
                                            'Generated from live SAP payment clearing data at moment of download.'
                                        )
                                    }
                                >
                                    Download PDF
                                </Button>
                            }
                        />
                        <Card.Body style={{ padding: 0 }}>
                            <DataTable
                                columns={[
                                    {
                                        key: 'doc',
                                        header: 'Accounting Doc',
                                        render: (r) => <span className="font-mono font-bold text-blue-600">{r.doc}</span>,
                                    },
                                    { key: 'ref', header: 'Invoice Ref', render: (r) => r.ref },
                                    { key: 'gross', header: 'Gross Amount', align: 'right', render: (r) => r.gross },
                                    { key: 'tds', header: 'TDS (Sec 194Q)', align: 'right', render: (r) => r.tds },
                                    {
                                        key: 'net',
                                        header: 'Net Settled',
                                        align: 'right',
                                        render: (r) => <span className="font-mono font-bold">{r.net}</span>,
                                    },
                                ]}
                                data={[
                                    { doc: '5105004344', ref: 'INV/26-27/0866', gross: '₹8,84,000', tds: '₹884', net: '₹8,83,116' },
                                    { doc: '5105004301', ref: 'INV/26-27/0851', gross: '₹3,12,000', tds: '₹312', net: '₹3,11,688' },
                                    { doc: 'TOTAL', ref: 'UTR: HDFC26081844712', gross: '₹11,96,000', tds: '₹1,196', net: '₹11,94,804' },
                                ]}
                            />
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header title="Payment Transparency Principles" kicker="ERP TRUTH" />
                        <Card.Body>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <p>
                                    <strong>No Speculative Forecast Dates:</strong> The portal never displays speculative
                                    estimated payment dates. It displays the contractual due date and the buyer&apos;s configured
                                    disbursement calendar.
                                </p>
                                <p style={{ marginTop: '12px' }}>
                                    <strong>Real-Time Open-Item Queries:</strong> There are no local staging tables for payments.
                                    All payment settlements, ageing analyses, and tax deductions are queried dynamically from
                                    SAP core financial tables.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Dispute Modal */}
                <Modal
                    isOpen={disputeModal.open}
                    onClose={() => setDisputeModal({ open: false, invoiceNo: '', reason: '' })}
                    title={`Dispute Invoice · ${disputeModal.invoiceNo}`}
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setDisputeModal({ open: false, invoiceNo: '', reason: '' })}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirmDispute}>
                                Submit dispute to AP
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField label="Invoice Reference" required>
                            <select
                                className="form-control font-mono"
                                value={disputeModal.invoiceNo}
                                onChange={(e) => setDisputeModal({ ...disputeModal, invoiceNo: e.target.value })}
                            >
                                {invoices.map((i) => (
                                    <option key={i?.no} value={i?.no}>
                                        {i?.no} ({formatMoney(i?.amt)}) — {i?.status}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Reason for dispute / discrepancy" required>
                            <textarea
                                className="form-control"
                                rows={4}
                                placeholder="Explain why the payment block, price deduction, or tax withholding is contested..."
                                value={disputeModal.reason}
                                onChange={(e) => setDisputeModal({ ...disputeModal, reason: e.target.value })}
                            />
                        </FormField>
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default InvoicesPayment
