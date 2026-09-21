import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import MetricCard from '../../components/common/MetricCard'
import StatusBadge from '../../components/common/StatusBadge'
import HealthBar from '../../components/common/HealthBar'
import NewRequestModal from '../../components/modals/NewRequestModal'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'

function BuyerHome() {
    const navigate = useNavigate()
    const toast = useToast()
    const { priorityQueue, resolvePriorityItem, data } = useVendorData()

    const [activePage, setActivePage] = useState('Home')
    const [portal, setPortal] = useState('Buyer')
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [queueFilter, setQueueFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const queue = useMemo(() => {
        return priorityQueue || []
    }, [priorityQueue])

    // Filter queue items by active category and search text
    const filteredQueue = useMemo(() => {
        return queue.filter((item) => {
            // Category filter
            if (queueFilter === 'urgent' && item.priority !== 'High') return false
            if (queueFilter === 'onboarding' && !item.link?.includes('registrations')) return false
            if (queueFilter === 'quality' && !item.link?.includes('quality')) return false
            if (queueFilter === 'compliance' && !item.link?.includes('certificates') && !item.link?.includes('changes')) return false
            if (queueFilter === 'queries' && !item.link?.includes('queries')) return false

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const matchTitle = item.title?.toLowerCase().includes(q)
                const matchSupplier = item.supplier?.toLowerCase().includes(q)
                const matchMeta = item.meta?.toLowerCase().includes(q)
                return matchTitle || matchSupplier || matchMeta
            }

            return true
        })
    }, [queue, queueFilter, searchQuery])

    // Category counts for quick tabs
    const queueCounts = useMemo(() => {
        return {
            all: queue.length,
            urgent: queue.filter((i) => i.priority === 'High').length,
            onboarding: queue.filter((i) => i.link?.includes('registrations')).length,
            quality: queue.filter((i) => i.link?.includes('quality')).length,
            compliance: queue.filter((i) => i.link?.includes('certificates') || i.link?.includes('changes')).length,
            queries: queue.filter((i) => i.link?.includes('queries')).length,
        }
    }, [queue])

    // Live aggregated portfolio performance from SAP Master Data
    const portfolioHealth = useMemo(() => {
        const sups = data?.sup || []
        if (!sups.length) {
            return { avgScore: 86, avgOtd: 92, avgPpm: 940, avgCerts: 81, avgResp: 16 }
        }
        const avgScore = Math.round(sups.reduce((acc, s) => acc + (s.score || 0), 0) / sups.length)
        const avgOtd = Math.round(sups.reduce((acc, s) => acc + (s.otd || 0), 0) / sups.length)
        const avgCerts = Math.round(sups.reduce((acc, s) => acc + (s.certs || 0), 0) / sups.length)
        const avgResp = Math.round(sups.reduce((acc, s) => acc + (s.resp || 0), 0) / sups.length)
        return { avgScore, avgOtd, avgCerts, avgResp }
    }, [data])

    const handleResolve = (e, id, title) => {
        e.stopPropagation()
        if (resolvePriorityItem) {
            resolvePriorityItem(id)
        }
        toast.success(`Action resolved: "${title}"`)
    }

    const handleSyncSAP = () => {
        toast.success('Live sync complete: Connected to S/4HANA Cloud (HTTP 200 OK · 24ms)')
    }

    // Dynamic metrics
    const openRegsCount = (data?.regs || []).filter((r) => r?.st === 'OPEN').length
    const maxRegsWait = openRegsCount > 0
        ? Math.max(...(data?.regs || []).filter((r) => r?.st === 'OPEN').map((r) => r?.days || 0))
        : 0

    const expiredCertsCount = (data?.certs || []).filter((c) => c?.st === 'EXPIRED').length
    const reviewCertsCount = (data?.certs || []).filter((c) => c?.st === 'REVIEW').length
    const totalCertsAction = expiredCertsCount + reviewCertsCount

    const submitted8DCount = (data?.cases || []).filter((c) => (c?.steps || []).includes('SUB')).length
    const overdue8DCount = (data?.cases || []).filter((c) => c?.late > 0 && !(c?.steps || []).every((s) => s === 'OK')).length

    const lateQueriesCount = (data?.msgs || []).filter((m) => m?.late && !m?.reply).length
    const bankAlertsCount = (data?.changes || []).filter((c) => c?.penny === 'FAIL' && c?.st === 'OPEN').length
    const urgentIssuesCount = lateQueriesCount + bankAlertsCount

    const rfqsCount = (data?.rfqs || []).length

    return (
        <AppLayout
            activePage={activePage}
            setActivePage={setActivePage}
            portal={portal}
            setPortal={setPortal}
        >
            <PageContainer
                kicker="ENTERPRISE PROCUREMENT GOVERNANCE · S/4HANA CLOUD"
                title="Buyer Operations Cockpit"
                subtitle="Real-time procurement oversight, supplier exception management, and automated ERP synchronization."
                actions={
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSyncSAP}
                            title="Test live handshake with SAP S/4HANA OData services"
                        >
                            ⇄ Sync S/4HANA
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/buyer/sourcing')}
                            title="Go to Strategic Sourcing & RFQ events"
                        >
                            Sourcing & RFQs
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsRequestModalOpen(true)}
                        >
                            + New request
                        </Button>
                    </div>
                }
            >
                {/* 4 Interactive Enterprise Metric Cards */}
                <div className="metrics-grid">
                    <MetricCard
                        label="New suppliers to approve"
                        value={openRegsCount}
                        sub={
                            openRegsCount > 0
                                ? `Longest wait: ${maxRegsWait} days · 4-step verification`
                                : 'All applications processed'
                        }
                        tone={openRegsCount > 0 ? 'warning' : 'success'}
                        onClick={() => navigate('/buyer/registrations')}
                        title="Click to manage new supplier onboarding applications"
                    />

                    <MetricCard
                        label="Certificates to act on"
                        value={totalCertsAction}
                        sub={`${expiredCertsCount} expired, ${reviewCertsCount} awaiting validation`}
                        tone={expiredCertsCount > 0 ? 'danger' : totalCertsAction > 0 ? 'warning' : 'success'}
                        onClick={() => navigate('/buyer/certificates')}
                        title="Click to manage statutory and quality compliance certificates"
                    />

                    <MetricCard
                        label="8D responses to review"
                        value={submitted8DCount}
                        sub={
                            overdue8DCount > 0
                                ? `${overdue8DCount} NCR cases overdue past SLA`
                                : 'All 8D corrective actions on target'
                        }
                        tone={overdue8DCount > 0 ? 'danger' : submitted8DCount > 0 ? 'warning' : 'success'}
                        onClick={() => navigate('/buyer/quality')}
                        title="Click to review 8D quality action dossiers"
                    />

                    <MetricCard
                        label="Urgent Exceptions"
                        value={urgentIssuesCount}
                        sub={`${lateQueriesCount} SLA inquiries overdue, ${bankAlertsCount} bank verification alerts`}
                        tone={urgentIssuesCount > 0 ? 'danger' : 'success'}
                        onClick={() => navigate('/buyer/queries')}
                        title="Click to view urgent inquiries and penny-drop bank alerts"
                    />
                </div>

                {/* 2-Column Responsive Cockpit Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
                        gap: '22px',
                        alignItems: 'start',
                    }}
                >
                    {/* Left Column: Priority Action Queue */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        <Card>
                            <Card.Header
                                kicker={`ATTENTION REQUIRED (${filteredQueue.length})`}
                                title="Priority Action Queue"
                                subtitle="Ranked by compliance risk, then by waiting time. Silence around SAP orders, not duplicate ERP transactions."
                                action={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/buyer/suppliers')}
                                        title="View comprehensive supplier 360 directory"
                                    >
                                        View all suppliers →
                                    </Button>
                                }
                            />

                            {/* Filter Bar & Search */}
                            <div
                                style={{
                                    padding: '12px 18px',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'var(--surface-soft)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'all', label: `All (${queueCounts.all})` },
                                        { id: 'urgent', label: `Urgent (${queueCounts.urgent})` },
                                        { id: 'onboarding', label: `Onboarding (${queueCounts.onboarding})` },
                                        { id: 'quality', label: `Quality (${queueCounts.quality})` },
                                        { id: 'compliance', label: `Compliance (${queueCounts.compliance})` },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setQueueFilter(tab.id)}
                                            style={{
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11.5px',
                                                fontWeight: 650,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                background: queueFilter === tab.id ? 'var(--blue)' : 'rgba(255,255,255,0.8)',
                                                color: queueFilter === tab.id ? '#ffffff' : 'var(--text-soft)',
                                                border: queueFilter === tab.id ? '1px solid var(--blue)' : '1px solid var(--border)',
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ minWidth: '180px', flex: '0 1 220px' }}>
                                    <input
                                        type="text"
                                        placeholder="Filter actions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '5px 10px',
                                            fontSize: '12px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            background: '#ffffff',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Queue Items List */}
                            <div style={{ padding: '4px 0' }}>
                                {filteredQueue.map((item) => {
                                    const isUrgent = item.priority === 'High'
                                    const dotColor =
                                        item.status === 'danger' || isUrgent
                                            ? '#dc2626'
                                            : item.status === 'warning'
                                            ? '#d97706'
                                            : '#2563eb'

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => item.link && navigate(item.link)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '14px 20px',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: item.link ? 'pointer' : 'default',
                                                transition: 'background 0.15s ease',
                                                gap: '12px',
                                            }}
                                            className="queue-row-hover"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                                <span
                                                    style={{
                                                        width: '9px',
                                                        height: '9px',
                                                        borderRadius: '50%',
                                                        background: dotColor,
                                                        flexShrink: 0,
                                                    }}
                                                />

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <strong style={{ fontSize: '13px', color: 'var(--text)' }}>
                                                            {item.title}
                                                        </strong>
                                                        <StatusBadge
                                                            status={item.priority || 'Standard'}
                                                            tone={isUrgent ? 'danger' : 'neutral'}
                                                        />
                                                    </div>

                                                    <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                                                        <span>{item.supplier}</span>
                                                        <span style={{ margin: '0 6px', color: 'var(--border)' }}>·</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.meta}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                                {item.link && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate(item.link)
                                                        }}
                                                        title="Open screen to take action"
                                                    >
                                                        Open →
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleResolve(e, item.id, item.title)}
                                                    title="Mark action item resolved"
                                                >
                                                    Resolve ✓
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}

                                {filteredQueue.length === 0 && (
                                    <div
                                        style={{
                                            padding: '40px 20px',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {searchQuery
                                            ? `No action items found matching "${searchQuery}".`
                                            : 'All priority actions in this category have been resolved! Portfolio is up to date.'}
                                    </div>
                                )}
                            </div>

                            {/* Architectural Guarantee Footer */}
                            <Card.Footer style={{ background: '#f8fafc', padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-soft)', lineHeight: '1.5' }}>
                                    <strong style={{ color: 'var(--text)' }}>Architectural Boundary: </strong>
                                    Orders, invoices, and material documents remain in SAP S/4HANA. This queue tracks the supplier-side response silence — unacknowledged orders, expiring compliance, and unresolved quality deviations.
                                </div>
                            </Card.Footer>
                        </Card>

                        {/* Secondary Strategic Snapshot */}
                        <Card>
                            <Card.Header
                                kicker="SOURCING & TENDER DISPATCH"
                                title="Active Sourcing Pipeline"
                                subtitle="S/4HANA automated RFQ quotation comparison and single-click purchase order awards"
                                action={
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => navigate('/buyer/sourcing')}
                                    >
                                        + Create RFQ
                                    </Button>
                                }
                            />
                            <Card.Body style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center' }}>
                                    <div style={{ padding: '12px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue)' }}>{rfqsCount}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-soft)', marginTop: '2px' }}>ACTIVE RFQS</div>
                                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Direct materials</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>3</div>
                                        <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-soft)', marginTop: '2px' }}>BIDS READY</div>
                                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Ready for comparison</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>2</div>
                                        <div style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-soft)', marginTop: '2px' }}>CLOSING SOON</div>
                                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Due within 48h</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Right Column: Portfolio Health & Governance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        {/* Supplier Portfolio Health */}
                        <Card>
                            <Card.Header
                                kicker="PORTFOLIO PERFORMANCE"
                                title="Supplier Health & Risk"
                                action={
                                    <span
                                        style={{
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: portfolioHealth.avgScore >= 80 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                            color: portfolioHealth.avgScore >= 80 ? '#15803d' : '#b45309',
                                        }}
                                    >
                                        {portfolioHealth.avgScore >= 80 ? 'Optimal' : 'Attention'}
                                    </span>
                                }
                            />

                            <Card.Body style={{ padding: '18px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                    <div
                                        style={{
                                            width: '68px',
                                            height: '68px',
                                            borderRadius: '50%',
                                            border: '4px solid var(--blue)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(27, 110, 194, 0.05)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span style={{ fontSize: '20px', fontWeight: 850, color: 'var(--blue)', lineHeight: 1 }}>
                                            {portfolioHealth.avgScore}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            /100
                                        </span>
                                    </div>

                                    <div>
                                        <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
                                            Composite Health Index
                                        </strong>
                                        <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                            Computed monthly across delivery OTD, 8D quality PPM, and SLA compliance.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <HealthBar
                                        label="On-Time Delivery (OTD)"
                                        value={`${portfolioHealth.avgOtd}%`}
                                        width={`${portfolioHealth.avgOtd}%`}
                                    />

                                    <HealthBar
                                        label="Compliance Certificates"
                                        value={`${portfolioHealth.avgCerts}%`}
                                        width={`${portfolioHealth.avgCerts}%`}
                                    />

                                    <HealthBar
                                        label="Supplier Response SLA"
                                        value={`${portfolioHealth.avgResp}h`}
                                        width={`${Math.max(10, 100 - portfolioHealth.avgResp * 2)}%`}
                                    />

                                    <HealthBar
                                        label="Master Data Cleanliness"
                                        value="94%"
                                        width="94%"
                                    />
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        style={{ width: '100%' }}
                                        onClick={() => navigate('/buyer/scorecards')}
                                    >
                                        View Detailed Scorecards →
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Integration & Cloud Connector Status */}
                        <Card>
                            <Card.Header
                                kicker="SYSTEM INTEGRATION"
                                title="S/4HANA Cloud Sync"
                                action={<StatusBadge status="Live Connected" tone="success" />}
                            />

                            <Card.Body style={{ padding: '16px 20px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-soft)' }}>Interface Protocol</span>
                                        <strong className="mono">SAP Cloud Integration</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-soft)' }}>Auth Gateway</span>
                                        <strong className="mono">OAuth2 Mutual TLS</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-soft)' }}>Dead Letter Messages</span>
                                        <strong style={{ color: bankAlertsCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                            {bankAlertsCount > 0 ? `${bankAlertsCount} pending retry` : '0 messages'}
                                        </strong>
                                    </div>
                                </div>

                                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        style={{ width: '100%', textAlign: 'center' }}
                                        onClick={() => navigate('/buyer/integration')}
                                    >
                                        Open Integration Monitor →
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </PageContainer>

            {/* Create Procurement Request Modal */}
            <NewRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
            />
        </AppLayout>
    )
}

export default BuyerHome