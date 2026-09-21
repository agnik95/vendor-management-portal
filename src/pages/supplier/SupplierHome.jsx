import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import MetricCard from '../../components/common/MetricCard'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import { useVendorData } from '../../context/useVendorData'

function formatMoney(amount) {
    if (!amount) return '₹0'
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`
    }
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function SupplierHome() {
    const navigate = useNavigate()
    const { data } = useVendorData()

    // Data derived
    const ordersList = useMemo(() => data?.orders || [], [data])
    const invoicesList = useMemo(() => data?.invoices || [], [data])
    const docsList = useMemo(() => data?.docs || [], [data])
    const rfqsList = useMemo(() => data?.rfqs || [], [data])

    const ordersToAck = useMemo(() => ordersList.filter((o) => !o?.ack), [ordersList])
    const openOrdersList = useMemo(() => ordersList.filter((o) => (o?.recv || 0) < (o?.qty || 0)), [ordersList])

    const openOrderValue = useMemo(() => {
        return openOrdersList.reduce((sum, o) => sum + ((o?.qty || 0) - (o?.recv || 0)) * (o?.price || 0), 0)
    }, [openOrdersList])

    const invoiceExceptions = useMemo(() => {
        return invoicesList.filter((i) => ['REJECTED', 'BLOCKED', 'PARKED'].includes(i?.status))
    }, [invoicesList])

    const unpaidValue = useMemo(() => {
        return invoicesList
            .filter((i) => i?.status === 'POSTED')
            .reduce((sum, i) => sum + (i?.amt || 0), 0)
    }, [invoicesList])

    // Action items queue
    const actionItems = useMemo(() => {
        const list = []
        // 1. 8D quality overdue
        if (data?.ncr && (data.ncr.steps || []).some((s) => s?.st === 'RETURNED' || s?.st === 'IN_PROGRESS')) {
            list.push({
                id: 'ncr-1',
                tone: 'danger',
                title: `8D response action required — ${data.ncr.no || 'NCR-2026-0881'}`,
                sub: `Plant ${data.ncr.plant || 1} quality · Due ${data.ncr.due || '21 Aug'}`,
                badge: 'Action Overdue',
                actionPath: '/supplier/quality',
            })
        }
        // 2. Expired documents
        docsList
            .filter((d) => d?.status === 'EXPIRED')
            .forEach((d) => {
                list.push({
                    id: `doc-${d?.type || 'cert'}`,
                    tone: 'danger',
                    title: `${d?.type || 'Certificate'} has expired`,
                    sub: 'Upload a certified renewal to remain on the approved supplier list',
                    badge: 'Expired',
                    actionPath: '/supplier/documents',
                })
            })
        // 3. Expiring documents
        docsList
            .filter((d) => d?.days !== null && d?.days !== undefined && d?.days <= 60 && d?.status !== 'EXPIRED')
            .forEach((d) => {
                list.push({
                    id: `doc-${d?.type || 'cert'}`,
                    tone: 'warning',
                    title: `${d?.type || 'Certificate'} expires in ${d?.days} days`,
                    sub: 'Renew before expiration date to avoid automated purchasing block',
                    badge: 'Expiring Soon',
                    actionPath: '/supplier/documents',
                })
            })
        // 4. Orders to acknowledge
        if (ordersToAck.length > 0) {
            list.push({
                id: 'ack-orders',
                tone: 'warning',
                title: `${ordersToAck.length} purchase order line(s) awaiting acknowledgement`,
                sub: 'Confirm scheduled delivery dates or propose splits within 48h SLA',
                badge: `${ordersToAck.length} Lines`,
                actionPath: '/supplier/orders',
            })
        }
        // 5. Urgent RFQ
        rfqsList
            .filter((r) => r?.urgent && r?.quote === 'NONE')
            .forEach((r) => {
                list.push({
                    id: `rfq-${r?.no || 'rfq'}`,
                    tone: 'info',
                    title: `RFQ ${r?.no} closes in 2 days — ${r?.desc || 'Tender'}`,
                    sub: 'No quotation submitted yet · S/4HANA Sourcing event',
                    badge: 'RFQ Open',
                    actionPath: '/supplier/rfq',
                })
            })
        // 6. Invoice exceptions
        invoiceExceptions.forEach((inv) => {
            list.push({
                id: `inv-${inv?.no || 'inv'}`,
                tone: 'danger',
                title: `Invoice ${inv?.no} ${(inv?.status || '').toLowerCase()} — ${inv?.block || 'Verification exception'}`,
                sub: 'Correct pricing/freight discrepancies or file clarification query',
                badge: inv?.status || 'EXCEPTION',
                actionPath: '/supplier/invoices',
            })
        })

        return list
    }, [data, docsList, ordersToAck, rfqsList, invoiceExceptions])

    const recentOrders = useMemo(() => ordersList.slice(0, 5), [ordersList])

    return (
        <AppLayout activePage="Home" portal="Supplier">
            <PageContainer
                kicker="PRECISION COMPONENTS PVT LTD · BP 0017004521"
                title="Supplier Operations Cockpit"
                subtitle="Live supplier dashboard synchronized with SAP S/4HANA purchasing, logistics, and financial clearing."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/supplier/asn')}>
                            + Create ASN
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate('/supplier/submit-invoice')}>
                            + Submit invoice
                        </Button>
                    </div>
                }
            >
                {/* 4 Core KPI Tiles */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Orders to acknowledge"
                        value={ordersToAck.length}
                        sub={
                            ordersToAck.length > 0
                                ? `Oldest is ${Math.max(...ordersToAck.map((o) => o.age || 24))} hours old`
                                : 'Queue is up to date'
                        }
                        tone={ordersToAck.length > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Open order value"
                        value={formatMoney(openOrderValue)}
                        sub={`${openOrdersList.length} active schedule lines`}
                        tone="neutral"
                    />
                    <MetricCard
                        label="Invoices in exception"
                        value={invoiceExceptions.length}
                        sub={invoiceExceptions.length > 0 ? '3-way price/quantity mismatch' : 'Zero payment blocks'}
                        tone={invoiceExceptions.length > 0 ? 'danger' : 'success'}
                    />
                    <MetricCard
                        label="Approved payments due"
                        value={formatMoney(unpaidValue)}
                        sub="Next payment run 25 Aug 2026"
                        tone="success"
                    />
                </div>

                {/* 2-Column Split: Actions + Recent Orders VS Scorecard + Announcements */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                        marginTop: '24px',
                    }}
                >
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Needs Your Action Card */}
                        <Card>
                            <Card.Header
                                kicker="OPERATIONAL ACTION ITEMS"
                                title="Needs your action"
                                action={
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {actionItems.length} items requiring response
                                    </span>
                                }
                            />
                            <Card.Body style={{ padding: '8px 16px' }}>
                                {actionItems.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No pending items require your attention.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {actionItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => navigate(item.actionPath)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color, #e2e8f0)',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s ease',
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background = 'var(--bg-card-subtle, #f8fafc)')
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background = 'transparent')
                                                }
                                            >
                                                <span
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background:
                                                            item.tone === 'danger'
                                                                ? 'var(--color-danger, #ef4444)'
                                                                : item.tone === 'warning'
                                                                ? 'var(--color-warning, #f59e0b)'
                                                                : 'var(--color-primary, #3b82f6)',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{item.title}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {item.sub}
                                                    </div>
                                                </div>
                                                <StatusBadge status={item.badge} tone={item.tone} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Recent Orders Card */}
                        <Card>
                            <Card.Header
                                kicker="SAP S/4HANA SYNCHRONIZED"
                                title="Recent purchase orders"
                                action={
                                    <Button size="sm" variant="secondary" onClick={() => navigate('/supplier/orders')}>
                                        View all orders →
                                    </Button>
                                }
                            />
                            <Card.Body style={{ padding: 0 }}>
                                <DataTable
                                    columns={[
                                        {
                                            key: 'po',
                                            header: 'Order',
                                            render: (_, row) => <span className="font-mono font-bold">{row?.po}</span>,
                                        },
                                        { key: 'plant', header: 'Plant', render: (_, row) => `Plant ${row?.plant || ''}` },
                                        { key: 'mat', header: 'Material', render: (_, row) => `${row?.mat || ''} · ${row?.desc || ''}` },
                                        {
                                            key: 'qty',
                                            header: 'Quantity',
                                            align: 'right',
                                            render: (_, row) => `${(row?.qty || 0).toLocaleString('en-IN')} ${row?.uom || 'EA'}`,
                                        },
                                        { key: 'req', header: 'Delivery Date', render: (_, row) => row?.req || '' },
                                        {
                                            key: 'status',
                                            header: 'Status',
                                            align: 'right',
                                            render: (_, row) => (
                                                <StatusBadge
                                                    status={row?.ack ? 'Acknowledged' : 'To acknowledge'}
                                                    tone={row?.ack ? 'success' : 'warning'}
                                                />
                                            ),
                                        },
                                    ]}
                                    data={recentOrders}
                                    onRowClick={() => navigate(`/supplier/orders`)}
                                />
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Right Column: Scorecard summary + Announcements */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Scorecard Summary Card */}
                        <Card>
                            <Card.Header
                                kicker="PERFORMANCE RATING"
                                title="Your scorecard"
                                action={
                                    <Button size="sm" variant="secondary" onClick={() => navigate('/supplier/scorecard')}>
                                        Detail breakdown
                                    </Button>
                                }
                            />
                            <Card.Body>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '38px', fontWeight: 800, fontFamily: 'Archivo, sans-serif' }}>
                                        {data?.score?.total || 86}
                                    </span>
                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        / 100 · Grade {data?.score?.grade || 'A'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                                    Jul 2026 · Ranked {data?.score?.rank || 2} of {data?.score?.of || 14} in Machined Parts
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                                            <span>On-time delivery (OTD)</span>
                                            <span className="font-mono font-bold">{data?.score?.otd || 92}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${data?.score?.otd || 92}%`, height: '100%', background: '#16a34a' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                                            <span>Quality rating (PPM {data?.score?.ppm || 640})</span>
                                            <span className="font-mono font-bold">78%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: '78%', height: '100%', background: '#f59e0b' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                                            <span>Responsiveness (PO Ack Speed)</span>
                                            <span className="font-mono font-bold">88%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: '88%', height: '100%', background: '#16a34a' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                                            <span>Document compliance</span>
                                            <span className="font-mono font-bold">91%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: '91%', height: '100%', background: '#16a34a' }} />
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Announcements Card */}
                        <Card>
                            <Card.Header
                                kicker="BUYER BULLETINS"
                                title="Plant announcements"
                            />
                            <Card.Body>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ borderLeft: '3px solid var(--color-primary, #1e3a8a)', paddingLeft: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Plant shutdown 12–16 Oct</div>
                                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            No inward receipts at Peenya plant during annual maintenance. Reschedule delivery dates.
                                        </div>
                                    </div>

                                    <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>New packaging standard PKG-04</div>
                                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            Mandatory barcoded handling unit labels effective 01 Oct 2026.
                                        </div>
                                    </div>

                                    <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>E-invoicing IRN mandatory</div>
                                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            All B2B tax invoices must carry 64-character IRN hash generated by IRP portal.
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default SupplierHome