import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'
import apiClient from '../../services/apiClient'

function formatMoney(amount) {
    if (!amount) return '?0'
    return `?${Number(amount).toLocaleString('en-IN')}`
}

function QuoteResponse() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { submitQuote } = useVendorData()
    const toast = useToast()

    const [rfq, setRfq] = useState(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [lines, setLines] = useState([])
    const [loading, setLoading] = useState(true)

    const parseSapDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        const match = dateStr.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//)
        if (match) {
            return new Date(parseInt(match[1], 10)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }
        return dateStr
    }

    useEffect(() => {
        const fetchRfqDetails = async () => {
            setLoading(true)
            try {
                const res = await apiClient.get(`/vendor/get-specific-rfq/${id}`)
                if (res.data?.data) {
                    const rfqData = res.data.data
                    const items = rfqData.to_RequestForQuotationItem?.results || []
                    
                    const parsedRfq = {
                        no: rfqData['Purchasing Document'] || rfqData.RequestForQuotation || id,
                        desc: rfqData['RFQ Description'] || rfqData.RequestForQuotationName || 'Sourcing Event',
                        org: rfqData['Purchasing Organization'] || rfqData.PurchasingOrganization || '1010',
                        closes: parseSapDate(rfqData['Quotation Deadline'] || rfqData.QuotationLatestSubmissionDate),
                        currency: rfqData['Currency'] || rfqData.DocumentCurrency || 'INR',
                        paymentTerms: rfqData['Payment Terms'] || rfqData.PaymentTerms || 'Standard',
                        incoterms: rfqData['Incoterms'] || rfqData.IncotermsClassification || 'FCA',
                        quote: 'NONE' // Could be driven by RFQLifecycleStatus
                    }
                    
                    const parsedLines = items.map((item, idx) => ({
                        it: item['RFQ Item'] || item.RequestForQuotationItem || (idx + 1).toString(),
                        mat: item['Material'] || item.Material || 'Unknown',
                        d: item['Short Text'] || item.RequestForQuotationItemText || 'Description',
                        qty: Number(item['Requested Quantity'] || item.ScheduleLineOrderQuantity || item.TargetQuantity || 1),
                        uom: item['Order Unit'] || item.OrderQuantityUnit || 'EA',
                        price: '0.00',
                        lead: '',
                        moq: ''
                    }))
                    
                    setRfq(parsedRfq)
                    setLines(parsedLines.length > 0 ? parsedLines : [
                        { it: '10', mat: 'RAW-MTL-01', d: 'Steel Rod EN8D', qty: 5000, uom: 'EA', price: '420.00', lead: '21 days', moq: '500' }
                    ])
                }
            } catch (err) {
                console.error("Failed to fetch RFQ details", err)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchRfqDetails()
    }, [id])

    const handleLineChange = (index, field, value) => {
        setLines((prev) =>
            prev.map((l, idx) => (idx === index ? { ...l, [field]: value } : l))
        )
    }

    const totalValue = useMemo(() => {
        return lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (l.qty || 1), 0)
    }, [lines])

    const handleSubmitQuote = async () => {
        const hasZero = lines.some((l) => !l.price || Number(l.price) <= 0)
        if (hasZero) {
            toast.error(
                'All-or-Nothing Rule',
                'Every RFQ line must be priced. Partial bids are rejected to avoid commercial disputes.'
            )
            return
        }

        try {
            await submitQuote(id, lines)
            setIsSubmitted(true)
            toast.success('Binding Quotation Submitted', `Commercial bid for ${id} has been transmitted to S/4HANA via OData interface.`)
        } catch (err) {
            toast.error('Quotation Submission Failed', err.message)
        }
    }

    const tableColumns = [
        { key: 'it', header: 'Item', width: '60px', render: (_, row) => row.it },
        {
            key: 'mat',
            header: 'Material Specification',
            render: (_, row) => (
                <div>
                    <span className="font-mono font-bold">{row.mat}</span>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.d}</div>
                </div>
            ),
        },
        {
            key: 'qty',
            header: 'Requested Qty',
            align: 'right',
            render: (_, row) => `${row.qty.toLocaleString('en-IN')} ${row.uom || 'EA'}`,
        },
        {
            key: 'price',
            header: 'Unit Price (INR)',
            render: (_, row, idx) => {
                if (isSubmitted) {
                    return <span className="font-mono font-bold">?{Number(row.price).toFixed(2)}</span>
                }
                return (
                    <input
                        type="number"
                        className="form-control font-mono"
                        value={row.price}
                        onChange={(e) => handleLineChange(idx, 'price', e.target.value)}
                        style={{ width: '100px', padding: '6px 8px', textAlign: 'right' }}
                        placeholder="0.00"
                    />
                )
            },
        },
        {
            key: 'lead',
            header: 'Lead Time',
            render: (_, row, idx) => {
                if (isSubmitted) return row.lead
                return (
                    <input
                        type="text"
                        className="form-control"
                        value={row.lead}
                        onChange={(e) => handleLineChange(idx, 'lead', e.target.value)}
                        style={{ width: '100px', padding: '6px 8px' }}
                        placeholder="e.g. 14 days"
                    />
                )
            },
        },
        {
            key: 'moq',
            header: 'MOQ (Batch)',
            render: (_, row, idx) => {
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
            render: (_, row) => (
                <span className="font-mono font-bold">
                    {formatMoney((Number(row.price) || 0) * row.qty)}
                </span>
            ),
        },
    ]

    if (loading) {
        return (
            <AppLayout activePage="RFQ inbox" portal="Supplier">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Retrieving RFQ specifications from SAP S/4HANA...</div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout activePage="RFQ inbox" portal="Supplier">
            <PageContainer
                kicker={`SOURCING EVENT · ${rfq?.no || 'RFQ'}`}
                title={`Quote Response — ${rfq?.desc || 'Sourcing Event'}`}
                subtitle="Review technical requirements, input competitive line pricing, and dispatch legally binding commercial quotation."
                actions={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/supplier/rfq')}>
                        ? Back to RFQs
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
                                <div style={{ fontWeight: 600 }}>{rfq?.org || '1010'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Quotation Deadline
                                </span>
                                <div style={{ fontWeight: 600 }}>{rfq?.closes}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Currency
                                </span>
                                <div style={{ fontWeight: 600 }}>{rfq?.currency}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Payment Terms
                                </span>
                                <div style={{ fontWeight: 600 }}>{rfq?.paymentTerms}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Incoterms
                                </span>
                                <div style={{ fontWeight: 600 }}>{rfq?.incoterms}</div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Line Items Table */}
                <Card>
                    <Card.Header
                        kicker="COMMERCIAL BID"
                        title="Line Item Pricing"
                        action={
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Total Quote Value
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)' }}>
                                    {formatMoney(totalValue)}
                                </div>
                            </div>
                        }
                    />
                    <DataTable columns={tableColumns} data={lines} keyField="it" pageSize={0} />
                    {!isSubmitted && (
                        <Card.Footer style={{ justifyContent: 'flex-end', background: 'var(--bg-card-subtle)' }}>
                            <Button variant="primary" onClick={handleSubmitQuote}>
                                Submit Firm Quotation
                            </Button>
                        </Card.Footer>
                    )}
                </Card>
            </PageContainer>
        </AppLayout>
    )
}

export default QuoteResponse
