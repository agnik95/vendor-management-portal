import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'

function OpenWithSuppliers() {
    const toast = useToast()
    const { data, retryQueueItem, editAndRetryQueueItem, retryFailed } = useVendorData()
    const [activeTab, setActiveTab] = useState('unack')
    const [fixModalItem, setFixModalItem] = useState(null)
    const [fixUnit, setFixUnit] = useState('EA')
    const [fixQty, setFixQty] = useState('4,000')

    const unackList = data?.stuck?.unack || []
    const failedList = data?.stuck?.failed || []
    const noasnList = data?.stuck?.noasn || []

    const tabs = [
        { id: 'unack', label: 'No acknowledgement' },
        { id: 'failed', label: 'Failed submissions' },
        { id: 'noasn', label: 'No shipment notice' },
    ]

    const handleChase = (po, sup) => {
        toast.info(
            `Reminder sent for order ${po} to ${sup}. The category buyer is copied after 72 hours.`
        )
    }

    const handleChaseAll = () => {
        toast.info(
            `All ${unackList.length} overdue suppliers chased. Responsiveness is scored on the scorecard.`
        )
    }

    const handleRetry = async (index, item) => {
        const fn = retryQueueItem || retryFailed
        const res = await fn(index)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.success(`Retry succeeded for ${item.ref} under original idempotency key.`)
    }

    const handleFixAndRetry = async () => {
        if (!fixModalItem) return
        if (editAndRetryQueueItem) {
            await editAndRetryQueueItem(fixModalItem.index, { unit: fixUnit, qty: fixQty })
        } else if (retryFailed) {
            await retryFailed(fixModalItem.index, { unit: fixUnit, qty: fixQty })
        }
        toast.success(
            `Corrected ${fixModalItem.what} posted for ${fixModalItem.ref} under a new idempotency key.`
        )
        setFixModalItem(null)
    }

    const unackColumns = [
        {
            key: 'po',
            label: 'Order',
            sortable: true,
            render: (v) => <span className="mono" style={{ fontWeight: 650, color: 'var(--blue)' }}>{v}</span>,
        },
        { key: 'item', label: 'Item', width: '70px' },
        { key: 'sup', label: 'Supplier', sortable: true },
        { key: 'mat', label: 'Material', sortable: true },
        {
            key: 'hrs',
            label: 'Hours Open',
            sortable: true,
            render: (v) => (
                <span style={{ fontWeight: 700, color: v > 48 ? 'var(--danger)' : 'var(--warning)' }}>
                    {v} hrs
                </span>
            ),
        },
        {
            key: 'val',
            label: 'Order Value',
            sortable: true,
            render: (v) => <span className="mono">₹{Number(v).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (_, row) => (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleChase(row.po, row.sup)}
                >
                    Chase
                </Button>
            ),
        },
    ]

    const failedColumns = [
        {
            key: 'ref',
            label: 'Reference',
            sortable: true,
            render: (v) => <span className="mono" style={{ fontWeight: 650 }}>{v}</span>,
        },
        { key: 'sup', label: 'Supplier', sortable: true },
        { key: 'what', label: 'Document Type' },
        { key: 'att', label: 'Attempts', width: '90px', align: 'center' },
        {
            key: 'msg',
            label: 'Why It Failed',
            render: (v) => <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{v}</span>,
        },
        {
            key: 'st',
            label: 'Status',
            render: (v) => (
                <StatusBadge
                    label={v === 'DEAD' ? 'Stopped' : 'Retrying'}
                    tone={v === 'DEAD' ? 'danger' : 'warning'}
                />
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (_, row, idx) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRetry(idx, row)}
                    >
                        Retry
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setFixModalItem({ ...row, index: idx })}
                    >
                        Fix & Retry
                    </Button>
                </div>
            ),
        },
    ]

    const noasnColumns = [
        {
            key: 'po',
            label: 'Order',
            render: (v) => <span className="mono" style={{ fontWeight: 650 }}>{v}</span>,
        },
        { key: 'sup', label: 'Supplier', sortable: true },
        { key: 'mat', label: 'Material' },
        { key: 'due', label: 'Delivery Due' },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (_, row) => (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.info(`Notice reminder sent to ${row.sup}`)}
                >
                    Remind Dock
                </Button>
            ),
        },
    ]

    return (
        <AppLayout activePage="Open with suppliers" portal="Buyer">
            <PageContainer
                kicker="Operations Queue"
                title="Open with suppliers"
                description="What suppliers have not done, or could not do. Track silence and integration errors around S/4HANA orders."
                actions={
                    activeTab === 'unack' && (
                        <Button variant="primary" onClick={handleChaseAll}>
                            Chase all overdue
                        </Button>
                    )
                }
            >
                <div className="metric-grid">
                    <article className="metric-card warning">
                        <div className="metric-top">
                            <span>Unacknowledged &gt; 48h</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{unackList.filter((u) => u.hrs > 48).length}</strong>
                        <p>₹18.9 L exposure at risk</p>
                    </article>

                    <article className="metric-card danger">
                        <div className="metric-top">
                            <span>Failed submissions</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{failedList.length}</strong>
                        <p>Supplier waiting on each</p>
                    </article>

                    <article className="metric-card info">
                        <div className="metric-top">
                            <span>No shipment notice</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{noasnList.length}</strong>
                        <p>Due within 2 days</p>
                    </article>

                    <article className="metric-card success">
                        <div className="metric-top">
                            <span>Portal Acknowledged</span>
                            <span className="metric-status" />
                        </div>
                        <strong>78%</strong>
                        <p>Rolling 30 days compliance</p>
                    </article>
                </div>

                <div className="card">
                    <div style={{ padding: '20px 22px 0' }}>
                        <Tabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>

                    {activeTab === 'unack' && (
                        <DataTable
                            columns={unackColumns}
                            data={unackList}
                            keyField="po"
                        />
                    )}

                    {activeTab === 'failed' && (
                        <DataTable
                            columns={failedColumns}
                            data={failedList}
                            keyField="ref"
                        />
                    )}

                    {activeTab === 'noasn' && (
                        <DataTable
                            columns={noasnColumns}
                            data={noasnList}
                            keyField="po"
                        />
                    )}
                </div>

                <div className="hint">
                    <b>In SAP, use</b> Manage Purchase Orders and Monitor Purchase Order Items for the orders themselves.
                    This screen adds the one thing the ERP cannot know — what the supplier did in response.
                </div>
            </PageContainer>

            {/* Fix & Retry Modal */}
            <Modal
                isOpen={!!fixModalItem}
                onClose={() => setFixModalItem(null)}
                title={`Fix and retry · ${fixModalItem?.ref}`}
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setFixModalItem(null)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleFixAndRetry}>
                            Save & Retry with New Idempotency Key
                        </Button>
                    </>
                }
            >
                {fixModalItem && (
                    <div>
                        <div
                            style={{
                                padding: '12px 14px',
                                background: 'var(--danger-bg)',
                                border: '1px solid rgba(209,75,75,0.3)',
                                borderRadius: '8px',
                                color: 'var(--danger)',
                                fontSize: '12.5px',
                                marginBottom: '16px',
                            }}
                        >
                            <strong>SAP Error: </strong>
                            {fixModalItem.msg}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <FormField label="Unit of Measure" required hint="Match SAP PO UoM">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={fixUnit}
                                    onChange={(e) => setFixUnit(e.target.value)}
                                />
                            </FormField>

                            <FormField label="Corrected Quantity" required>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={fixQty}
                                    onChange={(e) => setFixQty(e.target.value)}
                                />
                            </FormField>
                        </div>

                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '12px' }}>
                            Changing the payload generates a <strong>NEW idempotency key</strong>, preventing duplicate postings in SAP while allowing corrections to succeed.
                        </p>
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}

export default OpenWithSuppliers
