import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import MetricCard from '../../components/common/MetricCard'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

const SCORE_CRITERIA = [
    {
        name: 'On-time delivery',
        weight: '30%',
        source: 'SAP S/4HANA',
        sourceType: 'sap',
        desc: 'Goods receipt posting date measured against schedule line delivery date',
    },
    {
        name: 'Quantity accuracy',
        weight: '10%',
        source: 'SAP S/4HANA',
        sourceType: 'sap',
        desc: 'Received quantity verified strictly against purchase order quantity',
    },
    {
        name: 'Quality PPM',
        weight: '25%',
        source: 'SAP S/4HANA',
        sourceType: 'sap',
        desc: 'Inspection lot rejection quantity divided by total units received',
    },
    {
        name: 'Responsiveness',
        weight: '15%',
        source: 'Vendor Portal',
        sourceType: 'portal',
        desc: 'Hours elapsed from PO release in SAP to supplier portal acknowledgement',
    },
    {
        name: 'Certificates valid',
        weight: '10%',
        source: 'Vendor Portal',
        sourceType: 'portal',
        desc: 'Current valid mandatory certificates divided by required compliance profile',
    },
    {
        name: '8D closed on time',
        weight: '10%',
        source: 'Vendor Portal',
        sourceType: 'portal',
        desc: 'Discipline milestones closed within mandatory quality SLA targets',
    },
]

function Scorecards() {
    const navigate = useNavigate()
    const { data, publishScorecards } = useVendorData()
    const toast = useToast()

    const [publishModalOpen, setPublishModalOpen] = useState(false)
    const [probationModalOpen, setProbationModalOpen] = useState(false)

    const below70Count = data.sup.filter((s) => s.score < 70).length
    const isPublished = Boolean(data.published || data.scorecards?.published)

    const handlePublish = async () => {
        await publishScorecards()
        setPublishModalOpen(false)
        toast.success(
            'Scorecards released to suppliers',
            'Every supplier primary contact has been notified. Score audit trail is locked.'
        )
    }

    const handleAgreePlan = () => {
        setProbationModalOpen(false)
        toast.info(
            'Quality improvement plan agreed',
            'Action item deadlines captured and logged for monthly review.'
        )
    }

    const handleProposeProbation = () => {
        setProbationModalOpen(false)
        toast.warning(
            'Probation proposal submitted',
            'Dossier forwarded to Head of Procurement with complete audit evidence pack.'
        )
    }

    const tableColumns = [
        {
            key: 'name',
            header: 'Supplier',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.name}</div>
                    <div className="font-mono text-xs text-muted">BP: {row.bp}</div>
                </div>
            ),
        },
        {
            key: 'otd',
            header: 'On-time',
            align: 'right',
            render: (row) => `${row.otd}%`,
        },
        {
            key: 'ppm',
            header: 'PPM',
            align: 'right',
            render: (row) => (row?.ppm || 0).toLocaleString('en-IN'),
        },
        {
            key: 'resp',
            header: 'Responsiveness',
            align: 'right',
            render: (row) => `${row.resp} h`,
        },
        {
            key: 'certs',
            header: 'Certificates',
            align: 'right',
            render: (row) => `${row.certs}%`,
        },
        {
            key: 'score',
            header: 'Score',
            align: 'right',
            render: (row) => <span className="font-bold text-base">{row.score}</span>,
        },
        {
            key: 'grade',
            header: 'Grade',
            render: (row) => {
                if (row.score >= 85) return <StatusBadge status="Grade A" tone="success" />
                if (row.score >= 70) return <StatusBadge status="Grade B" tone="warning" />
                return <StatusBadge status="Grade C" tone="danger" />
            },
        },
        {
            key: 'change',
            header: 'Trend',
            align: 'right',
            render: (row) => {
                if (row.score >= 85) return <span style={{ color: 'var(--color-success, #16a34a)', fontWeight: 600 }}>↑ +2</span>
                if (row.score >= 70) return <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>→ 0</span>
                return <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600 }}>↓ -6</span>
            },
        },
    ]

    return (
        <AppLayout activePage="Scorecards" portal="Buyer">
            <PageContainer
                kicker="SUPPLIER PERFORMANCE MANAGEMENT"
                title="Scorecards"
                subtitle="Monthly composite evaluation computed from SAP transaction data and portal compliance governance."
            >
            {/* Top KPI Metrics */}
            <div className="metrics-grid">
                <MetricCard
                    label="Evaluation Period"
                    value="Jul 2026"
                    sub="Computed 02 Aug 02:14 IST"
                    tone="neutral"
                />
                <MetricCard
                    label="Publication Status"
                    value={isPublished ? 'Released' : 'Draft'}
                    sub={isPublished ? 'Visible to suppliers in portal' : 'Pending buyer review & release'}
                    tone={isPublished ? 'success' : 'warning'}
                />
                <MetricCard
                    label="Suppliers Scored"
                    value={data.sup.length}
                    sub="Vendors with < 12 receipts omitted"
                    tone="neutral"
                />
                <MetricCard
                    label="Below 70 (Action Required)"
                    value={below70Count}
                    sub={below70Count > 0 ? 'Mandatory buyer intervention' : 'All suppliers compliant'}
                    tone={below70Count > 0 ? 'danger' : 'success'}
                />
            </div>

            {/* Main Scorecard Table */}
            <Card>
                <Card.Header
                    title="Composite Scorecard · July 2026"
                    action={
                        isPublished ? (
                            <StatusBadge status="Released to suppliers" tone="success" />
                        ) : (
                            <Button variant="primary" onClick={() => setPublishModalOpen(true)}>
                                Review and release
                            </Button>
                        )
                    }
                />
                <Card.Body style={{ padding: 0 }}>
                    <DataTable
                        columns={tableColumns}
                        data={data.sup}
                        emptyMessage="No supplier scores generated."
                    />
                </Card.Body>
            </Card>

            {/* Split Grid: How Score is Built & Needs Decision */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '24px',
                    marginTop: '24px',
                }}
            >
                {/* Weight Breakdown Card */}
                <Card>
                    <Card.Header title="How the score is built" />
                    <Card.Body>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {SCORE_CRITERIA.map((crit) => (
                                <div
                                    key={crit.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 0',
                                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{crit.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {crit.desc}
                                        </div>
                                    </div>
                                    <span className="font-mono" style={{ fontWeight: 700, fontSize: '13.5px' }}>
                                        {crit.weight}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background:
                                                crit.sourceType === 'sap'
                                                    ? 'rgba(30, 58, 138, 0.08)'
                                                    : 'rgba(16, 185, 129, 0.08)',
                                            color:
                                                crit.sourceType === 'sap'
                                                    ? 'var(--color-primary, #1e3a8a)'
                                                    : 'var(--color-success, #059669)',
                                        }}
                                    >
                                        {crit.sourceType === 'sap' ? 'SAP' : 'Portal'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                marginTop: '16px',
                                padding: '12px',
                                borderRadius: '6px',
                                background: 'var(--bg-card-subtle, #f8fafc)',
                                fontSize: '12.5px',
                                lineHeight: 1.5,
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color, #e2e8f0)',
                            }}
                        >
                            <strong>35% of the score originates exclusively in the portal.</strong> Without the vendor portal,
                            an organisation cannot measure order acknowledgement turnaround times, valid certificate ratios, or
                            adherence to 8D resolution SLAs.
                        </div>
                    </Card.Body>
                </Card>

                {/* Needs a Decision Card */}
                <Card>
                    <Card.Header title="Needs a decision" />
                    <Card.Body>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    background: 'rgba(239, 68, 68, 0.04)',
                                }}
                            >
                                <span
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--color-danger, #ef4444)',
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>
                                        Sri Venkatesh Forgings scored 64
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        Third consecutive month below 70 · three open 8D cases · certificates at 58%
                                    </div>
                                </div>
                                <Button size="sm" variant="danger" onClick={() => setProbationModalOpen(true)}>
                                    Decide
                                </Button>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    background: 'rgba(245, 158, 11, 0.04)',
                                }}
                            >
                                <span
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--color-warning, #f59e0b)',
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>
                                        Precision Components at 71% on certificates
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        Expired fire safety NOC accounts for the entire compliance penalty
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => navigate('/buyer/certificates')}
                                >
                                    Open
                                </Button>
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '18px',
                                padding: '12px',
                                borderRadius: '6px',
                                background: 'rgba(59, 130, 246, 0.05)',
                                fontSize: '12.5px',
                                lineHeight: 1.5,
                                color: 'var(--text-secondary)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                        >
                            <strong>Configuration Integrity:</strong> Metric weight changes apply only to subsequent billing
                            periods. A published score is immutable and stamped with its active calculation rule set version.
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Publish Modal */}
            <Modal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                title="Release July 2026 Scorecards"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPublishModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handlePublish}>
                            Release to suppliers
                        </Button>
                    </>
                }
            >
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Publishing releases composite grades, criteria ratings, and granular raw counts to supplier portals:
                    </p>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color, #cbd5e1)', textAlign: 'left' }}>
                                <th style={{ padding: '8px 4px' }}>Supplier</th>
                                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Score</th>
                                <th style={{ padding: '8px 4px' }}>Grade</th>
                                <th style={{ padding: '8px 4px' }}>Transparency Package</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.sup
                                .filter((s) => s.score > 0)
                                .map((s) => (
                                    <tr key={s.bp} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                        <td style={{ padding: '8px 4px', fontWeight: 500 }}>{s.name}</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{s.score}</td>
                                        <td style={{ padding: '8px 4px' }}>
                                            <span style={{ fontWeight: 600 }}>{s.score >= 85 ? 'A' : s.score >= 70 ? 'B' : 'C'}</span>
                                        </td>
                                        <td style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>
                                            Score, grade, rank & raw counts behind each figure
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        fontSize: '12.5px',
                        color: 'var(--color-primary, #1e3a8a)',
                    }}
                >
                    💡 Suppliers receive transparent arithmetic calculations, preventing unilateral disputes.
                </div>
            </Modal>

            {/* Probation Proposal Modal */}
            <Modal
                isOpen={probationModalOpen}
                onClose={() => setProbationModalOpen(false)}
                title="Intervention Proposal · Sri Venkatesh Forgings"
                footer={
                    <>
                        <Button variant="secondary" onClick={handleAgreePlan}>
                            Agree a recovery plan
                        </Button>
                        <Button variant="danger" onClick={handleProposeProbation}>
                            Propose probation
                        </Button>
                    </>
                }
            >
                <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    <p>
                        <strong>Performance Summary:</strong> Score has settled at <strong>64</strong> for a third consecutive
                        month. Vendor currently holds three open 8D non-conformance records, one of which is 23 days overdue.
                        Compliance certificate coverage stands at 58% due to an expired ISO 9001 audit.
                    </p>
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '12px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '12.5px',
                            color: 'var(--color-danger, #991b1b)',
                        }}
                    >
                        <strong>Formal Governance:</strong> Vendor probation is a formal procurement proposal requiring Head of
                        Procurement sign-off and attached audit evidence. The portal does not unilaterally demote approved suppliers
                        without executive governance.
                    </div>
                </div>
            </Modal>
        </PageContainer>
    </AppLayout>
    )
}

export default Scorecards
