import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'
import MetricCard from '../../components/common/MetricCard'

function IntegrationMonitor() {
    const { data, retryQueueItem, editAndRetryQueueItem } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('ifaces')
    const [editModalItem, setEditModalItem] = useState(null)
    const [editUom, setEditUom] = useState('EA')
    const [editQty, setEditQty] = useState('4,000')

    const ifaces = data?.ifaces || []
    const queue = data?.queue || []
    const log = data?.log || []
    const deadCount = queue.filter((q) => q?.status === 'DEAD').length

    const tabs = [
        { id: 'ifaces', label: 'Interface Inventory (12)' },
        {
            id: 'dead',
            label: `Dead Letter Queue (${deadCount})`,
        },
        { id: 'log', label: 'Outbound Audit Log' },
    ]

    const handleRetryDead = async (index, item) => {
        const res = await retryQueueItem(index)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.success(`Message retry dispatched for ${item.ref}`)
    }

    const handleOpenEdit = (idx, item) => {
        setEditModalItem({ index: idx, item })
        setEditUom('EA')
        setEditQty('4,000')
    }

    const handleEditAndRetry = async () => {
        if (!editModalItem) return
        await editAndRetryQueueItem(editModalItem.index, {
            unit: editUom,
            qty: editQty,
        })
        toast.success(
            `Corrected payload dispatched with new idempotency key for ${editModalItem.item.ref}`
        )
        setEditModalItem(null)
    }

    return (
        <AppLayout activePage="Integration monitor" portal="Buyer">
            <PageContainer
                kicker="OPERATIONS & MESSAGE LOGISTICS"
                title="Integration monitor"
                subtitle="Live SAP S/4HANA Cloud interface inventory, dead-letter message processing, and idempotent retry controls."
            >
                {/* 4 KPI Cards */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Calls today"
                        value="48,112"
                        sub="Peak 214 per minute · 99.98% SLA"
                        tone="info"
                    />
                    <MetricCard
                        label="Posted this session"
                        value={log.length}
                        sub="Outbound S/4HANA writes"
                        tone="success"
                    />
                    <MetricCard
                        label="Dead letter queue"
                        value={deadCount}
                        sub={deadCount > 0 ? 'Requires payload investigation' : 'Zero trapped payloads'}
                        tone={deadCount > 0 ? 'danger' : 'success'}
                    />
                    <MetricCard
                        label="Median read latency"
                        value="340 ms"
                        sub="Order list (50 rows query)"
                        tone="neutral"
                    />
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: '20px' }}>
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                {/* Tab 0: Interface Inventory */}
                {activeTab === 'ifaces' && (
                    <Card
                        title="Active Interface Inventory"
                        subtitle="All traffic passes through SAP Integration Suite — the portal holds no SAP credentials"
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Interface',
                                    render: (r) => <strong>{r.name}</strong>,
                                },
                                { key: 'dir', header: 'Direction' },
                                {
                                    key: 'svc',
                                    header: 'SAP Service / Artifact',
                                    render: (r) => <span className="tag mono">{r.svc}</span>,
                                },
                                { key: 'pattern', header: 'Pattern' },
                                {
                                    key: 'vol',
                                    header: 'Volume / Day',
                                    align: 'right',
                                    render: (r) => (
                                        <span className="mono">~{Number(r.vol).toLocaleString('en-IN')}</span>
                                    ),
                                },
                                {
                                    key: 'st',
                                    header: 'Status',
                                    render: (r) => (
                                        <span className={`pill ${r.st === 'OK' ? 'good' : 'pend'}`}>
                                            {r.st === 'OK' ? 'Healthy' : 'Degraded'}
                                        </span>
                                    ),
                                },
                            ]}
                            data={ifaces}
                        />
                    </Card>
                )}

                {/* Tab 1: Failures */}
                {activeTab === 'failures' && (
                    <Card
                        title="Failures Needing Attention"
                        subtitle="Dead-letter queue items requiring engineer investigation or payload correction"
                    >
                        {queue.length === 0 ? (
                            <div className="empty">
                                <b>No failures outstanding</b>
                                Every queued write has succeeded.
                            </div>
                        ) : (
                            <DataTable
                                columns={[
                                    { key: 'when', header: 'When', width: '90px' },
                                    { key: 'iface', header: 'Interface' },
                                    {
                                        key: 'ref',
                                        header: 'Reference',
                                        render: (r) => <span className="mono" style={{ fontWeight: 650 }}>{r.ref}</span>,
                                    },
                                    { key: 'sup', header: 'Supplier' },
                                    {
                                        key: 'att',
                                        header: 'Attempts',
                                        align: 'center',
                                        render: (r) => <span className="mono">{r.att}</span>,
                                    },
                                    {
                                        key: 'msg',
                                        header: 'Reason',
                                        render: (r) => (
                                            <span style={{ color: 'var(--risk)', fontWeight: 500 }}>
                                                {r.msg}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'status',
                                        header: 'Status',
                                        render: (r) => (
                                            <span className={`pill ${r.status === 'DEAD' ? 'risk' : 'pend'}`}>
                                                {r.status === 'DEAD' ? 'Dead letter' : 'Retrying'}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'actions',
                                        header: 'Action',
                                        align: 'right',
                                        render: (_, r, idx) => (
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleRetryDead(idx, r)}
                                                >
                                                    Retry
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(idx, r)}
                                                >
                                                    Edit & retry
                                                </Button>
                                            </div>
                                        ),
                                    },
                                ]}
                                data={queue}
                            />
                        )}
                    </Card>
                )}

                {/* Tab 2: This Session */}
                {activeTab === 'session' && (
                    <Card
                        title="Posted During Current Session"
                        subtitle="Every outbound write carries an idempotency key generated prior to dispatch"
                    >
                        {log.length === 0 ? (
                            <div className="empty">
                                <b>Nothing posted yet</b>
                                Acknowledge an order, create a shipment notice, or submit an invoice to inspect session logs.
                            </div>
                        ) : (
                            <DataTable
                                columns={[
                                    {
                                        key: 't',
                                        header: 'Time',
                                        width: '100px',
                                        render: (r) => <span className="mono">{r.t}</span>,
                                    },
                                    { key: 'iface', header: 'Interface' },
                                    {
                                        key: 'ref',
                                        header: 'Reference',
                                        render: (r) => <span className="mono" style={{ fontWeight: 650 }}>{r.ref}</span>,
                                    },
                                    { key: 'msg', header: 'Result' },
                                ]}
                                data={log}
                            />
                        )}
                    </Card>
                )}

                {/* Architectural Note */}
                <div className="hint">
                    <b>Every outbound call is idempotent.</b> The portal generates a key from the business content
                    and stores it in <span className="tag">vp_outbound_queue.idempotency_key</span> before the call.
                    A timeout followed by a retry cannot create a second document. Retrying with the original payload
                    keeps the original key; <i>editing</i> the payload generates a new one, because the business content
                    has changed.
                    <div style={{ marginTop: '8px' }}>
                        <b>Reads are never queued.</b> They either succeed against SAP or the screen shows the failure,
                        rather than rendering stale data as live.
                    </div>
                </div>
            </PageContainer>

            {/* Modal: Edit and Retry */}
            <Modal
                isOpen={Boolean(editModalItem)}
                onClose={() => setEditModalItem(null)}
                title={`Edit and Retry · ${editModalItem?.item?.ref || ''}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditModalItem(null)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleEditAndRetry}>
                            Save and retry
                        </Button>
                    </>
                }
            >
                <div>
                    <div className="warnbox">
                        <b>{editModalItem?.item?.msg}</b>
                        <div>Payload correction required to satisfy S/4HANA inbound validation.</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <FormField label="Unit of measure">
                            <input
                                className="input"
                                value={editUom}
                                onChange={(e) => setEditUom(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Quantity">
                            <input
                                className="input mono"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                            />
                        </FormField>
                    </div>

                    <div className="hint" style={{ marginTop: '16px' }}>
                        <b>Changing the payload creates a new idempotency key</b>, because the business content
                        has changed. Retrying unchanged keeps the original key. Getting this the wrong way round
                        either duplicates documents or blocks legitimate corrections.
                    </div>
                </div>
            </Modal>
        </AppLayout>
    )
}

export default IntegrationMonitor
