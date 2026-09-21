import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import MetricCard from '../../components/common/MetricCard'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function formatMoney(amount) {
    if (!amount) return '₹0'
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function Receipts() {
    const navigate = useNavigate()
    const { data } = useVendorData()
    const toast = useToast()

    const receipts = useMemo(() => data?.receipts || [], [data])

    const totalRejected = useMemo(() => {
        return receipts.reduce((sum, r) => sum + (r?.rej || 0), 0)
    }, [receipts])

    const tableColumns = [
        {
            key: 'doc',
            header: 'Material Document',
            render: (row) => <span className="font-mono font-bold text-blue-600">{row.doc}</span>,
        },
        { key: 'date', header: 'Posting Date', render: (row) => row.date },
        {
            key: 'po',
            header: 'Order Ref',
            render: (row) => <span className="font-mono">{row.po}</span>,
        },
        {
            key: 'mat',
            header: 'Material Specification',
            render: (row) => `${row.mat} · ${row.desc}`,
        },
        {
            key: 'recv',
            header: 'Received Qty',
            align: 'right',
            render: (row) => `${row.recv.toLocaleString('en-IN')} pcs`,
        },
        {
            key: 'rej',
            header: 'Rejected Qty',
            align: 'right',
            render: (row) =>
                row.rej > 0 ? (
                    <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600 }}>
                        {row.rej.toLocaleString('en-IN')}
                    </span>
                ) : (
                    '0'
                ),
        },
        { key: 'reason', header: 'Rejection Reason', render: (row) => row.reason || '—' },
        {
            key: 'insp',
            header: 'Inspection Lot',
            render: (row) => {
                if (row.insp === 'Lot rejected') return <StatusBadge status="Lot Rejected" tone="danger" />
                if (row.insp?.includes('deviation')) return <StatusBadge status="Deviation" tone="warning" />
                return <StatusBadge status="Cleared (OK)" tone="success" />
            },
        },
    ]

    return (
        <AppLayout activePage="Receipts & rejections" portal="Supplier">
            <PageContainer
                kicker="DOCK RECEIPT & QUALITY CLEARANCE FEED"
                title="Receipts & rejections"
                subtitle="Read-only material documents and inspection lot dispositions mirrored directly from the buyer's ERP."
                actions={
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                            toast.info('Export prepared', 'Material movement history downloaded in formatted Excel.')
                        }
                    >
                        Download Movement History
                    </Button>
                }
            >
                {/* 4 Metric Cards */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Received this month"
                        value="₹1.92 Cr"
                        sub={`${receipts.length} material document postings`}
                        tone="neutral"
                    />
                    <MetricCard
                        label="Rejected quantity"
                        value={`${totalRejected.toLocaleString('en-IN')} pcs`}
                        sub="0.9% of total units received"
                        tone={totalRejected > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Awaiting inspection"
                        value="3 lots"
                        sub="Oldest lot is 2 days in QA"
                        tone="neutral"
                    />
                    <MetricCard
                        label="Open debit notes"
                        value={formatMoney(data.ncr?.debitAmt || 180000)}
                        sub="1 financial document posted"
                        tone="danger"
                    />
                </div>

                {/* Goods Receipts Table */}
                <Card>
                    <Card.Header
                        title="Goods Receipts Ledger"
                        kicker="S/4HANA MATERIAL DOCUMENTS"
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={tableColumns}
                            data={receipts}
                            emptyMessage="No goods receipts found."
                        />
                    </Card.Body>
                </Card>

                {/* Quality NCR Links & Policy Grid */}
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
                            title="Linked Quality Notifications"
                            kicker="NCR 8D DISCIPLINE CASES"
                            action={
                                <Button size="sm" variant="primary" onClick={() => navigate('/supplier/quality')}>
                                    Respond to 8D →
                                </Button>
                            }
                        />
                        <Card.Body>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        background: 'rgba(239, 68, 68, 0.04)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'var(--color-danger, #ef4444)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>
                                            {data?.ncr?.no || 'NCR-2026-0881'} — {data?.ncr?.mat || 'SH-9012 shaft assembly'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            Raised {data?.ncr?.raised || '14 Aug 2026'} · 8D corrective response overdue
                                        </div>
                                    </div>
                                    <StatusBadge status="Overdue" tone="danger" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header title="ERP Return & Debit Architecture" kicker="FINANCIAL CONTROLS" />
                        <Card.Body>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <p>
                                    <strong>Authoritative Accounting Postings:</strong> When an inspection lot is rejected by
                                    buyer quality, a formal Return Delivery (122 movement) and financial Debit Memo are posted
                                    directly within SAP S/4HANA.
                                </p>
                                <p style={{ marginTop: '10px' }}>
                                    The vendor portal displays these documents as read-only audit references. Any formal dispute is
                                    registered in the portal queries table, while the accounting ledger remains strictly in SAP.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default Receipts
