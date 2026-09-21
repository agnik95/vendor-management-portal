import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function formatMoney(amount) {
    if (!amount) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function QuoteResponse() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data, submitQuote } = useVendorData()
    const toast = useToast()

    const rfq = useMemo(() => {
        const rfqs = data?.rfqs || []
        return rfqs.find((r) => r?.no === id) || rfqs[0]
    }, [data?.rfqs, id])

    const [isSubmitted, setIsSubmitted] = useState(rfq?.quote === 'SUBMITTED')

    const [lines, setLines] = useState(
        rfq?.lines?.map((l) => ({
            ...l,
            price: l.price || '420.00',
            lead: l.lead || '21 days',
            moq: l.moq || '500',
        })) || []
    )

    const handleLineChange = (index, field, value) => {
        setLines((prev) =>
            prev.map((l, idx) => (idx === index ? { ...l, [field]: value } : l))
        )
    }

    const totalValue = useMemo(() => {
        return lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (l.qty || 1), 0)
    }, [lines])

    const handleSubmitQuote = async () => {
        // Validation: All lines must have a valid price > 0
        const hasZero = lines.some((l) => !l.price || Number(l.price) <= 0)
        if (hasZero) {
            toast.error(
                'All-or-Nothing Rule',
                'Every RFQ line must be priced. Partial bids are rejected to avoid commercial disputes.'
            )
            return
        }

        try {
            await submitQuote(rfq?.no || '6000004412', lines)
            setIsSubmitted(true)
            toast.success(
                `Supplier Quotation Submitted for RFQ ${rfq?.no}`,
                'Header and line pricing posted in a single atomic transaction.'
            )
            navigate('/supplier/rfq')
        } catch (err) {
            toast.error('Quotation Submission Failed', err.message)
        }
    }

    const tableColumns = [
        { key: 'it', header: 'Item', width: '60px', render: (row) => row.it },
        {
            key: 'mat',
            header: 'Material Specification',
            render: (row) => (
                <div>
                    <span className="font-mono font-bold">{row.mat}</span>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.d}</div>
                </div>
            ),
        },
        {
            key: 'qty',
            header: 'Annual Demand',
            align: 'right',
            render: (row) => `${row.qty.toLocaleString('en-IN')} EA`,
        },
        {
            key: 'price',
            header: 'Unit Price (INR)',
            render: (row, _, idx) => {
                if (isSubmitted) {
                    return <span className="font-mono font-bold">₹{Number(row.price).toFixed(2)}</span>
                }
                return (
                    <input
                        type="number"
                        className="form-control font-mono"
                        value={row.price}
                        onChange={(e) => handleLineChange(idx, 'price', e.target.value)}
                        style={{ width: '110px', textAlign: 'right', padding: '6px 8px' }}
                    />
                )
            },
        },
        {
            key: 'lead',
            header: 'Lead Time',
            render: (row, _, idx) => {
                if (isSubmitted) return row.lead
                return (
                    <input
                        type="text"
                        className="form-control"
                        value={row.lead}
                        onChange={(e) => handleLineChange(idx, 'lead', e.target.value)}
                        style={{ width: '100px', padding: '6px 8px' }}
                    />
                )
            },
        },
        {
            key: 'moq',
            header: 'MOQ (Batch)',
            render: (row, _, idx) => {
                if (isSubmitted) return `${row.moq} pcs`
                return (
                    <input
                        type="text"
                        className="form-control font-mono"
                        value={row.moq}
                        onChange={(e) => handleLineChange(idx, 'moq', e.target.value)}
                        style={{ width: '80px', padding: '6px 8px' }}
                    />
                )
            },
        },
        {
            key: 'val',
            header: 'Annual Value',
            align: 'right',
            render: (row) => (
                <span className="font-mono font-bold">
                    {formatMoney((Number(row.price) || 0) * row.qty)}
                </span>
            ),
        },
    ]

    return (
        <AppLayout activePage="RFQ inbox" portal="Supplier">
            <PageContainer
                kicker={`SOURCING EVENT · ${rfq?.no || 'RFQ 6000004412'}`}
                title={`Quote Response — ${rfq?.desc || 'Precision Shafts'}`}
                subtitle="Review technical requirements, input competitive line pricing, and dispatch legally binding commercial quotation."
                actions={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/supplier/rfq')}>
                        ← Back to RFQs
                    </Button>
                }
            >
                {/* RFQ Header Parameters */}
                <Card style={{ marginBottom: '24px' }}>
                    <Card.Header
                        kicker="COMMERCIAL TERMS & TIMELINES"
                        title={`RFQ ${rfq?.no} Parameters`}
                        action={
                            isSubmitted ? (
                                <StatusBadge status="Submitted" tone="success" />
                            ) : (
                                <StatusBadge status={`Closes ${rfq?.closes}`} tone="warning" />
                            )
                        }
                    />
                    <Card.Body>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                padding: '14px',
                                background: 'var(--bg-card-subtle, #f8fafc)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                            }}
                        >
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Purchasing Org
                                </span>
                                <div style={{ fontWeight: 600 }}>1010 — Domestic</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Quotation Deadline
                                </span>
                                <div style={{ fontWeight: 600 }}>{rfq?.closes}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Bid Validity
                                </span>
                                <div style={{ fontWeight: 600 }}>12 months fixed</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Incoterms
                                </span>
                                <div style={{ fontWeight: 600 }}>FCA Bengaluru</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Payment Terms
                                </span>
                                <div style={{ fontWeight: 600 }}>ZN45 — 45 days net</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Attachments
                                </span>
                                <div style={{ fontWeight: 600 }}>📎 3 drawings, 1 spec</div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Line Pricing Table */}
                <Card>
                    <Card.Header
                        kicker="LINE ITEM COMMERCIAL BIDDING"
                        title="Your Quotation Prices"
                        action={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Annual Projected Bid:{' '}
                                    <strong className="font-mono text-base">{formatMoney(totalValue)}</strong>
                                </span>
                            </div>
                        }
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable columns={tableColumns} data={lines} />
                    </Card.Body>
                    <Card.Footer>
                        {!isSubmitted ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => toast.info('Draft saved', 'Bid inputs preserved in temporary state.')}
                                >
                                    Save draft
                                </Button>
                                <div style={{ flex: 1 }} />
                                <Button variant="primary" onClick={handleSubmitQuote}>
                                    Submit quotation to SAP
                                </Button>
                            </>
                        ) : (
                            <span className="font-mono text-xs text-muted">
                                Registered as SAP Supplier Quotation <strong>7000004412</strong>. Prices are authoritative and
                                locked.
                            </span>
                        )}
                    </Card.Footer>
                </Card>

                {/* All or Nothing Rule Callout */}
                <div
                    style={{
                        marginTop: '20px',
                        padding: '14px 18px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                    }}
                >
                    <strong>All-or-Nothing Commercial Rule:</strong> Partial item submissions are strictly disallowed. Every
                    line must be priced with its specific lead time and minimum order quantity, or the entire RFQ must be
                    declined. When submitted, the header and items post in a single atomic transaction into SAP S/4HANA.
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default QuoteResponse
