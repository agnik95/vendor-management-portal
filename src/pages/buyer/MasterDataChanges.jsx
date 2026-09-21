import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'

function MasterDataChanges() {
    const toast = useToast()
    const { data, approveChange, rejectChange } = useVendorData()
    const [activeTab, setActiveTab] = useState('open')

    const openList = (data?.changes || []).filter((c) => c?.st === 'OPEN')
    const doneList = (data?.changes || []).filter((c) => c?.st === 'DONE')
    const badBankList = (data?.changes || []).filter((c) => c?.penny === 'FAIL' && c?.st === 'OPEN')

    const tabs = [
        { id: 'open', label: 'Waiting for approval' },
        { id: 'all', label: 'All changes' },
        { id: 'done', label: 'Posted to SAP' },
    ]

    const currentList =
        activeTab === 'open'
            ? openList
            : activeTab === 'done'
            ? doneList
            : data?.changes || []

    const handleApprove = async (id, sup) => {
        const res = await approveChange(id)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        if (res?.change?.st === 'DONE') {
            toast.success(`Dual approval complete for ${sup}. Updated in S/4HANA Business Partner.`)
        } else {
            toast.info(`First approval recorded (AP). Pending second approval by Finance Controller.`)
        }
    }

    const handleReject = async (c) => {
        const isFraud = c.penny === 'FAIL'
        const res = await rejectChange(c.id, isFraud)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        if (isFraud) {
            toast.danger(`Fraud alert raised for ${c.sup}! Compliance team notified. Review supplier portal access for account takeover.`)
        } else {
            toast.warning(`Master data change ${c.id} rejected.`)
        }
    }

    return (
        <AppLayout activePage="Master data changes" portal="Buyer">
            <PageContainer
                kicker="Data Governance"
                title="Master data changes"
                description="Supplier-requested changes with penny-drop verification and dual-approval segregation of duties before updating SAP S/4HANA."
            >
                <div className="metric-grid">
                    <article className="metric-card warning">
                        <div className="metric-top">
                            <span>Waiting for approval</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{openList.length}</strong>
                        <p>Bank changes need dual roles</p>
                    </article>

                    <article className="metric-card danger">
                        <div className="metric-top">
                            <span>Failed bank verification</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{badBankList.length}</strong>
                        <p>Treat as attempted fraud</p>
                    </article>

                    <article className="metric-card success">
                        <div className="metric-top">
                            <span>Posted to S/4HANA</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{doneList.length}</strong>
                        <p>Audit trail intact</p>
                    </article>

                    <article className="metric-card info">
                        <div className="metric-top">
                            <span>Median Approval</span>
                            <span className="metric-status" />
                        </div>
                        <strong>3.1 d</strong>
                        <p>Target: 5 working days</p>
                    </article>
                </div>

                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ padding: '20px 22px 0' }}>
                        <Tabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {currentList.map((c) => (
                        <div key={c.id} className="card">
                            <div className="card-header">
                                <div>
                                    <span className="card-kicker">
                                        {c.type} Change · BP {c.bp}
                                    </span>
                                    <h3 className="card-title">
                                        {c.sup} ({c.id})
                                    </h3>
                                </div>

                                {c?.st === 'DONE' ? (
                                    <StatusBadge label="Posted to S/4HANA" tone="success" />
                                ) : c?.st === 'REJECTED' ? (
                                    <StatusBadge label="Rejected / Fraud Alert" tone="danger" />
                                ) : (
                                    <StatusBadge label="Waiting for Approval" tone="warning" />
                                )}
                            </div>

                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '12.5px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Change Type</span>
                                        <div><strong>{c.type}</strong></div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Raised On</span>
                                        <div><strong>{c.raised}</strong></div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Current Value</span>
                                        <div><strong>{c.from}</strong></div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Proposed Value</span>
                                        <div><strong style={{ color: 'var(--blue)' }}>{c.to}</strong></div>
                                    </div>
                                </div>

                                {/* Penny Drop Verification Box */}
                                {c.penny && (
                                    <div style={{ marginTop: '16px' }}>
                                        {c.penny === 'PASS' ? (
                                            <div
                                                style={{
                                                    padding: '12px 16px',
                                                    background: 'var(--success-bg)',
                                                    border: '1px solid rgba(24,135,95,0.25)',
                                                    borderRadius: '8px',
                                                    color: 'var(--success)',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                <strong>Penny drop passed: </strong>
                                                The bank returned "{c.pennyName}", which matches the registered supplier entity on record.
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    padding: '14px 16px',
                                                    background: 'var(--danger-bg)',
                                                    border: '1px solid rgba(209,75,75,0.3)',
                                                    borderRadius: '8px',
                                                    color: 'var(--danger)',
                                                    fontSize: '12.5px',
                                                }}
                                            >
                                                <strong>FRAUD ALERT: Penny drop failed! </strong>
                                                The bank returned "<strong>{c.pennyName}</strong>", which does NOT match {c.sup}. Reject and raise a fraud alert. Do not ask the supplier to confirm by email — if their email is compromised, that confirmation goes to the attacker.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dual Approval Progress */}
                                {c.type === 'Bank account' && (
                                    <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <span className="card-kicker">Dual Sign-off Progress</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px', fontSize: '12px' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Step 1 (Accounts Payable): </span>
                                                <strong>{c.ap || 'Pending sign-off'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Step 2 (Finance Controller): </span>
                                                <strong>{c.fc || (c.ap ? 'Ready for sign-off' : 'Waiting on Step 1')}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions Bar */}
                                {c?.st === 'OPEN' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleReject(c)}
                                        >
                                            {c.penny === 'FAIL' ? 'Reject & Raise Fraud Alert 🚨' : 'Reject Change'}
                                        </Button>

                                        <Button
                                            variant="primary"
                                            onClick={() => handleApprove(c.id, c.sup)}
                                            disabled={c.penny === 'FAIL'}
                                        >
                                            {c.ap ? 'Final Approval (FC) — Post to S/4HANA ⚡' : 'Approve Step 1 (AP Lead)'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {currentList.length === 0 && (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No master data changes in this view.
                        </div>
                    )}
                </div>

                <div className="hint">
                    <b>In SAP, use</b> Manage Business Partner Master Data for changes your own team raises.
                    This screen exists because the request came from outside the company.
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default MasterDataChanges
