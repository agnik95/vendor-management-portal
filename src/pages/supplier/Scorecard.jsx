import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import MetricCard from '../../components/common/MetricCard'
import Modal from '../../components/common/Modal'
import { useVendorData } from '../../context/useVendorData'

const SCORE_BREAKDOWN = [
    {
        crit: 'On-time delivery',
        weight: '30%',
        source: 'Goods receipt date vs schedule line date (SAP Material Doc)',
        period: '92.0%',
        score: '27.6',
        trend: '↑ +3.2 pts',
        trendTone: 'success',
    },
    {
        crit: 'Quantity accuracy',
        weight: '10%',
        source: 'Received vs ordered quantity (SAP Material Doc)',
        period: '99.2%',
        score: '9.9',
        trend: '→ 0.0 pts',
        trendTone: 'neutral',
    },
    {
        crit: 'Quality PPM',
        weight: '25%',
        source: 'Rejected quantity ÷ received quantity (SAP Material Doc)',
        period: '640 ppm',
        score: '21.5',
        trend: '↓ -90 ppm',
        trendTone: 'success',
    },
    {
        crit: 'Responsiveness',
        weight: '15%',
        source: 'Hours from PO issue to portal acknowledgement (vp_po_ack)',
        period: '11.0 h',
        score: '13.5',
        trend: '↑ +1.2 pts',
        trendTone: 'success',
    },
    {
        crit: 'Document compliance',
        weight: '10%',
        source: 'Valid mandatory documents ÷ required (vp_document)',
        period: '91.0%',
        score: '9.1',
        trend: '→ 0.0 pts',
        trendTone: 'neutral',
    },
    {
        crit: '8D resolution SLA',
        weight: '10%',
        source: '8D milestones closed on or before target date (vp_8d_step)',
        period: '88.0%',
        score: '8.8',
        trend: '→ 0.0 pts',
        trendTone: 'neutral',
    },
    {
        crit: 'Composite Total',
        weight: '100%',
        source: 'Computed configuration v2.4 (Published 02 Aug 2026)',
        period: 'Grade A',
        score: '86.0',
        trend: 'Rank #2',
        trendTone: 'success',
    },
]

const MONTH_TREND = [
    { m: 'Aug 25', v: 82 },
    { m: 'Sep 25', v: 84 },
    { m: 'Oct 25', v: 81 },
    { m: 'Nov 25', v: 85 },
    { m: 'Dec 25', v: 86 },
    { m: 'Jan 26', v: 83 },
    { m: 'Feb 26', v: 84 },
    { m: 'Mar 26', v: 87 },
    { m: 'Apr 26', v: 85 },
    { m: 'May 26', v: 84 },
    { m: 'Jun 26', v: 85 },
    { m: 'Jul 26', v: 86 },
]

function Scorecard() {
    const { data } = useVendorData()
    const [countsModalOpen, setCountsModalOpen] = useState(false)

    return (
        <AppLayout activePage="Scorecard" portal="Supplier">
            <PageContainer
                kicker="SUPPLIER PERFORMANCE & RATINGS"
                title="Performance scorecard"
                subtitle="Transparent composite performance evaluation computed monthly from core ERP transactions and portal compliance SLAs."
                actions={
                    <Button variant="secondary" size="sm" onClick={() => setCountsModalOpen(true)}>
                        Show raw counts behind numbers
                    </Button>
                }
            >
                {/* 4 KPI Metrics */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Overall composite score"
                        value={data?.score?.total || 86}
                        sub={`Grade ${data?.score?.grade || 'A'} · Rank ${data?.score?.rank || 2} of ${data?.score?.of || 14} vendors`}
                        tone="success"
                    />
                    <MetricCard
                        label="On-time delivery (OTD)"
                        value={`${data?.score?.otd || 92}%`}
                        sub="Buyer target: 95%"
                        tone="warning"
                    />
                    <MetricCard
                        label="Quality PPM"
                        value={data?.score?.ppm || 640}
                        sub="Target: < 500 PPM"
                        tone="warning"
                    />
                    <MetricCard
                        label="Document compliance"
                        value="91%"
                        sub="Target: > 85% compliant"
                        tone="success"
                    />
                </div>

                {/* Score Breakdown Table */}
                <Card>
                    <Card.Header
                        title="How the score is built"
                        kicker="EVALUATION PERIOD · JULY 2026"
                        action={
                            <Button size="sm" variant="secondary" onClick={() => setCountsModalOpen(true)}>
                                Show calculation inputs
                            </Button>
                        }
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={[
                                {
                                    key: 'crit',
                                    header: 'Criterion',
                                    render: (r) => (
                                        <span style={{ fontWeight: r.crit.includes('Total') ? 700 : 600 }}>{r.crit}</span>
                                    ),
                                },
                                { key: 'weight', header: 'Weight', render: (r) => <span className="font-mono">{r.weight}</span> },
                                {
                                    key: 'source',
                                    header: 'Raw Data Source',
                                    render: (r) => <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{r.source}</span>,
                                },
                                {
                                    key: 'period',
                                    header: 'Period Metric',
                                    align: 'right',
                                    render: (r) => <span className="font-mono font-bold">{r.period}</span>,
                                },
                                {
                                    key: 'score',
                                    header: 'Weighted Score',
                                    align: 'right',
                                    render: (r) => <span className="font-mono font-bold text-blue-600">{r.score}</span>,
                                },
                                {
                                    key: 'trend',
                                    header: 'Trend',
                                    align: 'right',
                                    render: (r) => (
                                        <StatusBadge
                                            status={r.trend}
                                            tone={r.trendTone || 'neutral'}
                                        />
                                    ),
                                },
                            ]}
                            data={SCORE_BREAKDOWN}
                        />
                    </Card.Body>
                </Card>

                {/* 12-Month Trend & Architectural Note */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                        marginTop: '24px',
                    }}
                >
                    <Card>
                        <Card.Header title="Twelve-month rating progression" kicker="HISTORICAL TREND" />
                        <Card.Body>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {MONTH_TREND.map((item) => (
                                    <div key={item.m} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className="font-mono text-xs text-muted" style={{ width: '56px' }}>
                                            {item.m}
                                        </span>
                                        <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${item.v}%`,
                                                    height: '100%',
                                                    background: item.v >= 85 ? '#16a34a' : '#f59e0b',
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-xs" style={{ width: '28px', textAlign: 'right' }}>
                                            {item.v}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header title="Aggregation & Transparency Design" kicker="AUDIT TRUTH" />
                        <Card.Body>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <p>
                                    <strong>Why Derived Aggregates are Persisted:</strong> Recomputing 12 months of goods movements,
                                    inspection lots, and acknowledgement timestamps across tens of thousands of rows on every page
                                    load creates unacceptable ERP overhead.
                                </p>
                                <p style={{ marginTop: '12px' }}>
                                    The portal runs a scheduled month-end evaluation, computing the score once and locking the
                                    inputs alongside the formula configuration version. Every number can be independently
                                    reproduced by hand from SAP transaction docs.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Calculation Inputs Modal */}
                <Modal
                    isOpen={countsModalOpen}
                    onClose={() => setCountsModalOpen(false)}
                    title="Calculation Inputs · July 2026 Scorecard"
                    footer={
                        <Button variant="secondary" onClick={() => setCountsModalOpen(false)}>
                            Close
                        </Button>
                    }
                >
                    <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                        <p style={{ marginBottom: '14px', color: 'var(--text-secondary)' }}>
                            Raw transactional counts used to evaluate your composite July 2026 score:
                        </p>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Total Purchase Order Lines Issued</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>124 lines</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Goods Receipts Posted On-Time</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>114 lines (92.0%)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Total Units Inspected by Quality</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>48,400 pcs</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Total Defective / Rejected Units</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>31 pcs (640 PPM)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Average Order Acknowledgement Elapsed Time</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>11.0 hours (Target &lt; 48h)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Valid Mandatory Certificates</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>6 of 7 (Fire NOC pending)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default Scorecard
