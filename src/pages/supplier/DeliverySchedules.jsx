import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import MetricCard from '../../components/common/MetricCard'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function DeliverySchedules() {
    const { data } = useVendorData()
    const toast = useToast()

    const [capacityModalOpen, setCapacityModalOpen] = useState(false)
    const [flaggedWeek, setFlaggedWeek] = useState('W36')
    const [capacityDetail, setCapacityDetail] = useState('')

    const handleFlagCapacity = () => {
        if (!capacityDetail.trim()) {
            toast.warning('Input required', 'Please explain the capacity constraint.')
            return
        }
        toast.info(
            `Capacity constraint flagged for ${flaggedWeek}`,
            'Production planning (PP/MRP) team alerted. Alternative scheduling adjustment proposed.'
        )
        setCapacityModalOpen(false)
        setCapacityDetail('')
    }

    const tableColumns = [
        {
            key: 'wk',
            header: 'MRP Week',
            render: (row) => <span className="font-mono font-bold">{row.wk}</span>,
        },
        { key: 'date', header: 'Schedule Date', render: (row) => row.date },
        {
            key: 'req',
            header: 'Required Quantity',
            align: 'right',
            render: (row) => `${row.req.toLocaleString('en-IN')} EA`,
        },
        {
            key: 'cumR',
            header: 'Cumulative Required',
            align: 'right',
            render: (row) => `${row.cumR.toLocaleString('en-IN')}`,
        },
        {
            key: 'cumD',
            header: 'Cumulative Delivered',
            align: 'right',
            render: (row) => `${row.cumD.toLocaleString('en-IN')}`,
        },
        {
            key: 'bal',
            header: 'Net Balance',
            align: 'right',
            render: (row) => (
                <span className="font-mono font-bold">
                    {(row.cumR - row.cumD).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'zone',
            header: 'Commitment Zone',
            render: (row) => {
                if (row.zone === 'Firm') return <StatusBadge status="Firm Zone" tone="danger" />
                if (row.zone === 'Trade-off') return <StatusBadge status="Trade-off" tone="warning" />
                return <StatusBadge status="Forecast" tone="neutral" />
            },
        },
    ]

    return (
        <AppLayout activePage="Delivery schedules" portal="Supplier">
            <PageContainer
                kicker="JUST-IN-TIME (JIT) RECONCILIATION"
                title="Delivery schedules"
                subtitle="Long-term scheduling agreements with Firm, Trade-off, and Forecast commitment horizons."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toast.info('Export prepared', 'Live schedule lines downloaded in formatted XLSX.')}
                        >
                            Download XLSX
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setCapacityModalOpen(true)}>
                            Flag capacity issue
                        </Button>
                    </div>
                }
            >
                {/* 4 KPI Metrics */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Firm commitment zone"
                        value="4 wks"
                        sub="Legally committed — zero changes permitted"
                        tone="danger"
                    />
                    <MetricCard
                        label="Trade-off zone"
                        value="2 wks"
                        sub="Raw material procurement authorized"
                        tone="warning"
                    />
                    <MetricCard
                        label="Forecast horizon"
                        value="26 wks"
                        sub="Long-range capacity planning only"
                        tone="neutral"
                    />
                    <MetricCard
                        label="Open call-off balance"
                        value="₹2.84 Cr"
                        sub="Across 6 active scheduling agreements"
                        tone="success"
                    />
                </div>

                {/* Scheduling Agreement Schedule Lines */}
                <Card>
                    <Card.Header
                        kicker="SCHEDULING AGREEMENT 5500000412"
                        title="SH-9012 Shaft Assembly · Peenya Plant 1"
                        action={
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Retrieved at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST
                            </span>
                        }
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={tableColumns}
                            data={data?.sched || []}
                            emptyMessage="No schedule lines found for agreement."
                        />
                    </Card.Body>
                </Card>

                {/* Cumulative Trap Architectural Note */}
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
                    <strong>Cumulative Quantity Reconciliation Integrity:</strong> Automotive and engineering suppliers
                    reconcile strictly on <em>Cumulative Received Quantity</em>. Any locally cached copies drift whenever goods
                    receipt reversals or returns are posted in SAP. The portal queries <code>A_SchAgrmtSchLine</code> and goods
                    movement history dynamically on every view, displaying authoritative retrieval timestamps.
                </div>

                {/* Flag Capacity Modal */}
                <Modal
                    isOpen={capacityModalOpen}
                    onClose={() => setCapacityModalOpen(false)}
                    title="Flag Capacity Bottleneck · Agreement 5500000412"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setCapacityModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleFlagCapacity}>
                                Submit alert to MRP Planner
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField label="Constrained MRP Schedule Week" required>
                            <select
                                className="form-control"
                                value={flaggedWeek}
                                onChange={(e) => setFlaggedWeek(e.target.value)}
                            >
                                <option value="W36">W36 (07 Sep 2026) — 4,000 EA</option>
                                <option value="W37">W37 (14 Sep 2026) — 4,000 EA</option>
                                <option value="W38">W38 (21 Sep 2026) — 4,000 EA</option>
                            </select>
                        </FormField>

                        <FormField label="Capacity Constraint Description" required>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Explain tooling maintenance, machine downtime, or raw material bottleneck..."
                                value={capacityDetail}
                                onChange={(e) => setCapacityDetail(e.target.value)}
                            />
                        </FormField>

                        <div
                            style={{
                                padding: '10px 12px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                fontSize: '12px',
                                color: 'var(--color-warning, #b45309)',
                            }}
                        >
                            💡 Alerting MRP planners early allows line levelling and prevents single-source production outages.
                        </div>
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default DeliverySchedules
