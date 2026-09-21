import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'

function Certificates() {
    const toast = useToast()
    const { data, acceptCert, rejectCert } = useVendorData()

    const [activeTab, setActiveTab] = useState('expired')
    const [blockModalTarget, setBlockModalTarget] = useState(null)

    const expiredList = (data?.certs || []).filter((c) => c?.st === 'EXPIRED')
    const reviewList = (data?.certs || []).filter((c) => c?.st === 'REVIEW')
    const soonList = (data?.certs || []).filter((c) => c?.st === 'VALID' && (c?.days !== undefined && c?.days <= 60))
    const missingList = (data?.certs || []).filter((c) => c?.st === 'MISSING')

    const tabs = [
        { id: 'expired', label: 'Expired' },
        { id: 'review', label: 'Waiting for your check' },
        { id: 'soon', label: 'Expiring in 60 days' },
        { id: 'missing', label: 'Never uploaded' },
        { id: 'all', label: 'All certificates' },
    ]

    const currentList =
        activeTab === 'expired'
            ? expiredList
            : activeTab === 'review'
            ? reviewList
            : activeTab === 'soon'
            ? soonList
            : activeTab === 'missing'
            ? missingList
            : data.certs

    const handleAccept = async (c) => {
        const res = await acceptCert(c.id)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.success(`Certificate ${c.type} accepted for ${c.sup}. Scorecard updated.`)
    }

    const handleReject = async (c) => {
        const res = await rejectCert(c.id)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.warning(`Certificate rejected. ${c.sup} notified to re-upload clear copy.`)
    }

    const handleProposeBlock = (c) => {
        const supRecord = data.sup.find((s) => s.bp === c.bp) || {}
        setBlockModalTarget({ ...c, supplierInfo: supRecord })
    }

    const handleApplyBlock = () => {
        if (!blockModalTarget) return
        toast.warning(`Purchasing block proposal approved for ${blockModalTarget.sup} in S/4HANA. Recorded with audit reason.`)
        setBlockModalTarget(null)
    }

    const columns = [
        { key: 'sup', label: 'Supplier', sortable: true },
        { key: 'type', label: 'Certificate Type', sortable: true },
        {
            key: 'ref',
            label: 'Reference',
            render: (v) => <span className="mono">{v || '—'}</span>,
        },
        { key: 'valid', label: 'Valid To' },
        {
            key: 'blocks',
            label: 'Blocks Purchasing',
            render: (v) => (v ? <strong style={{ color: 'var(--danger)' }}>Yes</strong> : 'No'),
        },
        {
            key: 'st',
            label: 'Status',
            render: (v, r) => {
                if (v === 'EXPIRED') return <StatusBadge label={`Expired (${Math.abs(r.days)}d)`} tone="danger" />
                if (v === 'REVIEW') return <StatusBadge label="Pending Verification" tone="warning" />
                if (v === 'MISSING') return <StatusBadge label="Missing" tone="neutral" />
                if (r.days <= 60) return <StatusBadge label={`${r.days}d Left`} tone="warning" />
                return <StatusBadge label="Valid" tone="success" />
            },
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (_, row) => {
                if (row?.st === 'REVIEW') {
                    return (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button variant="primary" size="sm" onClick={() => handleAccept(row)}>
                                Accept
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(row)}>
                                Reject
                            </Button>
                        </div>
                    )
                }
                if (row?.st === 'EXPIRED' && row?.blocks) {
                    return (
                        <Button variant="danger" size="sm" onClick={() => handleProposeBlock(row)}>
                            Propose Block
                        </Button>
                    )
                }
                return (
                    <Button variant="secondary" size="sm" onClick={() => toast.info(`Reminder sent to ${row.sup} for ${row.type}`)}>
                        Remind
                    </Button>
                )
            },
        },
    ]

    return (
        <AppLayout activePage="Certificates" portal="Buyer">
            <PageContainer
                kicker="Compliance Registry"
                title="Certificates"
                description="ISO, IATF, fire NOC, pollution consent, and environmental clearances. Uploading does not make a certificate valid; human verification is required."
            >
                <div className="metric-grid">
                    <article className="metric-card danger">
                        <div className="metric-top">
                            <span>Expired certificates</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{expiredList.length}</strong>
                        <p>{expiredList.filter((c) => c.blocks).length} block purchasing</p>
                    </article>

                    <article className="metric-card warning">
                        <div className="metric-top">
                            <span>Waiting for check</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{reviewList.length}</strong>
                        <p>Requires buyer verification</p>
                    </article>

                    <article className="metric-card info">
                        <div className="metric-top">
                            <span>Expiring in 60 days</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{soonList.length}</strong>
                        <p>Automatic reminders sent</p>
                    </article>

                    <article className="metric-card success">
                        <div className="metric-top">
                            <span>Compliant Vendors</span>
                            <span className="metric-status" />
                        </div>
                        <strong>91.4%</strong>
                        <p>Audited across 5 categories</p>
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

                    <DataTable
                        columns={columns}
                        data={currentList}
                        keyField="id"
                    />
                </div>

                <div className="hint">
                    <b>An expired certificate never blocks purchasing on its own.</b> It raises a proposal, and a person decides with the open orders in front of them.
                    A portal that blocks suppliers by itself will eventually stop a line over a lapsed fire certificate.
                </div>
            </PageContainer>

            {/* Propose Purchasing Block Modal */}
            <Modal
                isOpen={!!blockModalTarget}
                onClose={() => setBlockModalTarget(null)}
                title={`Propose Purchasing Block · ${blockModalTarget?.sup}`}
                size="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                toast.info('Deferred: A 30-day recovery date has been granted to the supplier.')
                                setBlockModalTarget(null)
                            }}
                        >
                            Defer with Recovery Date
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleApplyBlock}
                            disabled={blockModalTarget?.supplierInfo?.single}
                        >
                            Apply Purchasing Block in S/4HANA
                        </Button>
                    </>
                }
            >
                {blockModalTarget && (
                    <div>
                        <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
                            <strong>{blockModalTarget.type}</strong> expired{' '}
                            <strong style={{ color: 'var(--danger)' }}>{Math.abs(blockModalTarget.days)} days ago</strong>.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '14px 0', fontSize: '12px' }}>
                            <div style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Single Source:</span>{' '}
                                <strong>{blockModalTarget.supplierInfo?.single ? 'YES' : 'No'}</strong>
                            </div>
                            <div style={{ padding: '10px 12px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Tooling Owned:</span>{' '}
                                <strong>{blockModalTarget.supplierInfo?.tooling || 'None'}</strong>
                            </div>
                        </div>

                        {blockModalTarget.supplierInfo?.single ? (
                            <div
                                style={{
                                    padding: '12px 14px',
                                    background: 'var(--danger-bg)',
                                    border: '1px solid rgba(209,75,75,0.3)',
                                    borderRadius: '8px',
                                    color: 'var(--danger)',
                                    fontSize: '12px',
                                    lineHeight: 1.5,
                                }}
                            >
                                <strong>CRITICAL: This supplier is SINGLE SOURCE!</strong>
                                <br />
                                Blocking purchasing will halt the assembly line. The realistic actions are to approve a temporary deviation with a recovery milestone, or qualify an alternate source first.
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '12px 14px',
                                    background: 'var(--success-bg)',
                                    border: '1px solid rgba(24,135,95,0.25)',
                                    borderRadius: '8px',
                                    color: 'var(--success)',
                                    fontSize: '12px',
                                }}
                            >
                                <strong>Alternate sources qualified.</strong> Open purchase orders can be run down and orders transferred to alternate suppliers.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AppLayout>
    )
}

export default Certificates
