import { useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function formatMoney(amount) {
    if (!amount) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function OrderDetail() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const itemParam = searchParams.get('item') || '10'
    const navigate = useNavigate()
    const { data, sendOrderAck } = useVendorData()
    const toast = useToast()

    const order = useMemo(() => {
        const orders = data?.orders || []
        return (
            orders.find((o) => o?.po === id && String(o?.item) === String(itemParam)) ||
            orders.find((o) => o?.po === id) ||
            orders[0] || {}
        )
    }, [data?.orders, id, itemParam])

    // Acknowledgement state
    const [ackMode, setAckMode] = useState('AS_ORDERED') // 'AS_ORDERED', 'WITH_CHANGE', 'REJECT'
    const [changeReason, setChangeReason] = useState('Capacity constraint — partial split')
    const [soRef, setSoRef] = useState('SO-26-4471')
    const [splits, setSplits] = useState([
        { q: Math.floor(order?.qty / 2) || 2000, d: order?.req || '24 Aug 2026' },
        { q: Math.ceil(order?.qty / 2) || 2000, d: '31 Aug 2026' },
    ])
    const [rejectReason, setRejectReason] = useState('Cannot supply — capacity')

    const splitTotal = useMemo(() => {
        return splits.reduce((sum, s) => sum + (Number(s.q) || 0), 0)
    }, [splits])

    const isSplitBalanced = splitTotal === order?.qty

    const handleAddSplit = () => {
        setSplits([...splits, { q: 0, d: '07 Sep 2026' }])
    }

    const handleRemoveSplit = (idx) => {
        setSplits(splits.filter((_, i) => i !== idx))
    }

    const handleEditSplit = (idx, field, val) => {
        setSplits(
            splits.map((s, i) => (i === idx ? { ...s, [field]: field === 'q' ? Number(val) || 0 : val } : s))
        )
    }

    const handleSendAck = () => {
        if (ackMode === 'WITH_CHANGE' && !isSplitBalanced) {
            toast.error(
                'Split Quantity Mismatch',
                `Delivery splits total ${splitTotal.toLocaleString('en-IN')}, but ordered quantity is ${order.qty.toLocaleString('en-IN')}. Must balance exactly.`
            )
            return
        }

        sendOrderAck(order.po, order.item, {
            mode: ackMode,
            qty: ackMode === 'WITH_CHANGE' ? splitTotal : order.qty,
            date: order.req,
            reason: ackMode === 'WITH_CHANGE' ? changeReason : ackMode === 'REJECT' ? rejectReason : '',
            soRef,
            splits: ackMode === 'WITH_CHANGE' ? splits : [],
        })

        if (ackMode === 'REJECT') {
            toast.warning(
                'Item Rejection Dispatched',
                `Order ${order.po} item ${order.item} rejected. Category Buyer notified immediately.`
            )
        } else {
            toast.success(
                'Purchase Order Acknowledged',
                `Confirmation posted into SAP S/4HANA. Document confirmation number 488019 generated.`
            )
        }
    }

    return (
        <AppLayout activePage="Purchase orders" portal="Supplier">
            <PageContainer
                kicker={`PURCHASE ORDER · ${order?.po}`}
                title={`Order ${order?.po} · Item ${order?.item}`}
                subtitle="Detailed order confirmation workspace with split schedule line proposals and live S/4HANA writeback."
                actions={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/supplier/orders')}>
                        ← Back to purchase orders
                    </Button>
                }
            >
                {/* Header Meta Card */}
                <Card style={{ marginBottom: '24px' }}>
                    <Card.Header
                        kicker="S/4HANA HEADER SPECIFICATIONS"
                        title={`Purchase order ${order?.po}`}
                        action={
                            <StatusBadge
                                status={order?.ack ? 'Acknowledged' : 'Awaiting acknowledgement'}
                                tone={order?.ack ? 'success' : 'warning'}
                            />
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
                                    Company Code
                                </span>
                                <div style={{ fontWeight: 600 }}>1000 — Bharat Precision Ltd</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Purchasing Group
                                </span>
                                <div style={{ fontWeight: 600 }}>101 — Machined parts</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Order Type
                                </span>
                                <div style={{ fontWeight: 600 }}>NB — Standard PO</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Currency
                                </span>
                                <div style={{ fontWeight: 600 }}>INR (₹)</div>
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
                                    Delivery Plant
                                </span>
                                <div style={{ fontWeight: 600 }}>Plant {order?.plant}, Peenya Ind. Area</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Order Value
                                </span>
                                <div className="font-mono font-bold" style={{ color: 'var(--color-primary, #1e3a8a)' }}>
                                    {formatMoney(order?.qty * order?.price)}
                                </div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Line Item Card */}
                <Card style={{ marginBottom: '24px' }}>
                    <Card.Header kicker="LINE ITEM FULFILLMENT POSITION" title="Ordered Item" />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={[
                                { key: 'item', header: 'Item', width: '60px', render: (r) => r.item },
                                {
                                    key: 'mat',
                                    header: 'Material',
                                    render: (r) => (
                                        <div>
                                            <span className="font-mono font-bold">{r.mat}</span> · {r.desc}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'qty',
                                    header: 'Ordered',
                                    align: 'right',
                                    render: (r) => `${r.qty.toLocaleString('en-IN')} ${r.uom}`,
                                },
                                {
                                    key: 'recv',
                                    header: 'Delivered',
                                    align: 'right',
                                    render: (r) => `${r.recv.toLocaleString('en-IN')}`,
                                },
                                {
                                    key: 'open',
                                    header: 'Open Balance',
                                    align: 'right',
                                    render: (r) => (
                                        <span className="font-mono font-bold">
                                            {(r.qty - r.recv).toLocaleString('en-IN')}
                                        </span>
                                    ),
                                },
                                { key: 'req', header: 'Requested Date', render: (r) => r.req },
                                {
                                    key: 'ack',
                                    header: 'Confirmed Delivery',
                                    render: (r) =>
                                        r.ack ? (
                                            <span className="font-mono font-bold text-green-600">
                                                {(r.ackQty || r.qty).toLocaleString('en-IN')} on {r.ackDate || r.req}
                                            </span>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        ),
                                },
                            ]}
                            data={[order]}
                        />
                    </Card.Body>
                </Card>

                {/* 2-Column Split: Action Workspace VS History */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {/* Action Card */}
                    {order?.ack ? (
                        <Card>
                            <Card.Header
                                kicker="PERSISTED IN SAP"
                                title="Acknowledgement Confirmed"
                                action={<StatusBadge status="Posted to S/4HANA" tone="success" />}
                            />
                            <Card.Body>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</span>
                                        <div style={{ fontWeight: 600 }}>Confirmed as ordered</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Confirmed Quantity</span>
                                        <div className="font-mono font-bold">{order.qty.toLocaleString('en-IN')} EA</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Confirmed Date</span>
                                        <div style={{ fontWeight: 600 }}>{order.req}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SAP Confirmation ID</span>
                                        <div className="font-mono font-bold">488019</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                    Confirmed line has moved to open schedule lines. You can now generate an ASN against this
                                    order.
                                </div>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Card>
                            <Card.Header
                                kicker="CONFIRMATION WORKBENCH"
                                title="Acknowledge or propose a change"
                            />
                            <Card.Body>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                    <Button
                                        variant={ackMode === 'AS_ORDERED' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAckMode('AS_ORDERED')}
                                    >
                                        Confirm as ordered
                                    </Button>
                                    <Button
                                        variant={ackMode === 'WITH_CHANGE' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAckMode('WITH_CHANGE')}
                                    >
                                        Confirm with changes
                                    </Button>
                                    <Button
                                        variant={ackMode === 'REJECT' ? 'danger' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAckMode('REJECT')}
                                    >
                                        Reject item
                                    </Button>
                                </div>

                                {ackMode === 'AS_ORDERED' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <FormField label="Confirmed quantity">
                                            <input
                                                type="text"
                                                className="form-control font-mono"
                                                value={`${order.qty} ${order.uom}`}
                                                readOnly
                                                disabled
                                            />
                                        </FormField>
                                        <FormField label="Confirmed delivery date">
                                            <input type="text" className="form-control" value={order.req} readOnly disabled />
                                        </FormField>
                                    </div>
                                )}

                                {ackMode === 'WITH_CHANGE' && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                            <FormField label="Reason for change proposal" required>
                                                <select
                                                    className="form-control"
                                                    value={changeReason}
                                                    onChange={(e) => setChangeReason(e.target.value)}
                                                >
                                                    <option>Capacity constraint — partial split</option>
                                                    <option>Raw material shortage</option>
                                                    <option>Tooling maintenance</option>
                                                    <option>Transport constraint</option>
                                                </select>
                                            </FormField>
                                            <FormField label="Your sales order reference">
                                                <input
                                                    type="text"
                                                    className="form-control font-mono"
                                                    value={soRef}
                                                    onChange={(e) => setSoRef(e.target.value)}
                                                />
                                            </FormField>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '14px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                                                Proposed Delivery Splits
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {splits.map((s, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-control font-mono"
                                                            value={s.q}
                                                            onChange={(e) => handleEditSplit(idx, 'q', e.target.value)}
                                                            style={{ width: '120px', textAlign: 'right' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={s.d}
                                                            onChange={(e) => handleEditSplit(idx, 'd', e.target.value)}
                                                            style={{ width: '140px' }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleRemoveSplit(idx)}
                                                            disabled={splits.length <= 1}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                                <Button size="sm" variant="secondary" onClick={handleAddSplit}>
                                                    + Add a split line
                                                </Button>
                                                <span style={{ fontSize: '12.5px' }}>
                                                    Total:{' '}
                                                    <strong className="font-mono">{splitTotal.toLocaleString('en-IN')}</strong> of{' '}
                                                    <strong className="font-mono">{order.qty.toLocaleString('en-IN')}</strong>{' '}
                                                    ordered
                                                </span>
                                                <StatusBadge
                                                    status={isSplitBalanced ? 'Balanced' : `Difference: ${Math.abs(order.qty - splitTotal)}`}
                                                    tone={isSplitBalanced ? 'success' : 'danger'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {ackMode === 'REJECT' && (
                                    <div>
                                        <FormField label="Reason for rejection" required>
                                            <select
                                                className="form-control"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            >
                                                <option>Cannot supply — capacity exhaustion</option>
                                                <option>Cannot supply — material obsolete</option>
                                                <option>Commercial terms not agreed</option>
                                            </select>
                                        </FormField>
                                        <div
                                            style={{
                                                marginTop: '12px',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                background: 'rgba(239, 68, 68, 0.08)',
                                                fontSize: '12.5px',
                                                color: 'var(--color-danger, #b91c1c)',
                                            }}
                                        >
                                            ⚠️ Rejecting an item immediately notifies the buyer and registers against your supplier
                                            responsiveness scorecard metric.
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                            <Card.Footer>
                                <Button variant="secondary" onClick={() => navigate('/supplier/orders')}>
                                    Cancel
                                </Button>
                                <div style={{ flex: 1 }} />
                                <Button
                                    variant={ackMode === 'REJECT' ? 'danger' : 'primary'}
                                    onClick={handleSendAck}
                                    disabled={ackMode === 'WITH_CHANGE' && !isSplitBalanced}
                                >
                                    {ackMode === 'REJECT' ? 'Confirm Rejection' : 'Send acknowledgement'}
                                </Button>
                            </Card.Footer>
                        </Card>
                    )}

                    {/* Order History Timeline */}
                    <Card>
                        <Card.Header title="Order lifecycle audit" kicker="S/4HANA CHANGE LOG" />
                        <Card.Body>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ borderLeft: '3px solid #1e3a8a', paddingLeft: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Order Created in S/4HANA</div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                        16 Aug 2026 09:14 · Issued by K. Ramesh
                                    </div>
                                </div>
                                <div style={{ borderLeft: '3px solid #1e3a8a', paddingLeft: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Order Output Dispatched</div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                        16 Aug 2026 09:16 · EDI 850 & Portal Notification
                                    </div>
                                </div>
                                <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Viewed on Portal</div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                        16 Aug 2026 14:02 · A. Deshpande
                                    </div>
                                </div>
                                <div style={{ borderLeft: `3px solid ${order?.ack ? '#10b981' : '#f59e0b'}`, paddingLeft: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                        {order?.ack ? 'Acknowledgement Recorded' : 'Acknowledgement Pending'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                        {order?.ack ? 'Confirmed to buyer' : 'SLA clock running (48-hour limit)'}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default OrderDetail
