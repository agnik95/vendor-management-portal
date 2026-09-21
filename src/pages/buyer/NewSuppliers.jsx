import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'

const CHAIN = [
    'Category buyer',
    'Supplier quality',
    'Finance — bank',
    'Procurement head',
]

function NewSuppliers() {
    const toast = useToast()
    const { data, advanceReg, createBP, rejectReg } = useVendorData()

    const [activeTab, setActiveTab] = useState('open')
    const [selectedRef, setSelectedRef] = useState('REG-2026-187')
    const [justificationNote, setJustificationNote] = useState(
        'Predecessor proprietorship, now converted to an LLP. The old Business Partner stays blocked.'
    )

    const openList = (data?.regs || []).filter((r) => r?.st === 'OPEN')
    const approvedList = (data?.regs || []).filter((r) => r?.st === 'DONE')
    const rejectedList = (data?.regs || []).filter((r) => r?.st === 'REJECTED')

    const tabs = [
        { id: 'open', label: 'Waiting for you' },
        { id: 'all', label: 'All applications' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
    ]

    const currentList =
        activeTab === 'open'
            ? openList
            : activeTab === 'approved'
            ? approvedList
            : activeTab === 'rejected'
            ? rejectedList
            : data?.regs || []

    const selectedReg =
        (data?.regs || []).find((r) => r?.ref === selectedRef) || currentList[0]

    const handleAdvance = async (ref) => {
        if (!selectedReg) return
        if (selectedReg.dup && (!justificationNote || justificationNote.trim().length < 15)) {
            toast.danger('A duplicate PAN cannot be waved through. You must provide a valid justification (minimum 15 characters).')
            return
        }
        const res = await advanceReg(ref, justificationNote)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.success(`Approved at step ${selectedReg.step + 1}. Passed to ${CHAIN[selectedReg.step + 1]}.`)
    }

    const handleCreateBP = async (ref) => {
        if (!selectedReg) return
        if (selectedReg.bank === 'PENDING') {
            toast.warning('Bank verification not finished. It blocks final Business Partner creation.')
            return
        }
        if (selectedReg.dup && (!justificationNote || justificationNote.trim().length < 15)) {
            toast.danger('A duplicate PAN cannot be waved through. Justification note is required.')
            return
        }
        const res = await createBP(ref, justificationNote)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.success(`Business Partner ${res.bp} created in S/4HANA. Supplier activated with initial login.`)
    }

    const handleReject = async (ref) => {
        const res = await rejectReg(ref)
        if (res?.error) {
            toast.danger(res.error)
            return
        }
        toast.warning('Application rejected. Nothing was written to SAP; no trace left in ERP.')
    }

    const columns = [
        {
            key: 'name',
            label: 'Company',
            sortable: true,
            render: (v, r) => (
                <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{v}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.ref}</span>
                </div>
            ),
        },
        { key: 'cat', label: 'Category' },
        {
            key: 'days',
            label: 'Days Waiting',
            sortable: true,
            align: 'center',
            render: (v) => <span style={{ fontWeight: 650 }}>{v}d</span>,
        },
        {
            key: 'step',
            label: 'Approval Step',
            render: (v, r) =>
                r?.st === 'OPEN' ? (
                    <div>
                        <span style={{ fontWeight: 700 }}>Step {v + 1} of 4</span>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{CHAIN[v]}</div>
                    </div>
                ) : (
                    '—'
                ),
        },
        {
            key: 'bank',
            label: 'Bank Check',
            render: (v) => (
                <StatusBadge
                    label={v === 'PASS' ? 'Passed' : 'Pending'}
                    tone={v === 'PASS' ? 'success' : 'warning'}
                />
            ),
        },
        { key: 'docs', label: 'Documents' },
        {
            key: 'st',
            label: 'Status',
            render: (v, r) =>
                r?.st === 'DONE' ? (
                    <StatusBadge label={`BP ${r?.bp}`} tone="success" />
                ) : r?.st === 'REJECTED' ? (
                    <StatusBadge label="Rejected" tone="danger" />
                ) : r?.dup ? (
                    <StatusBadge label="Duplicate PAN" tone="danger" />
                ) : (
                    <StatusBadge label="Waiting" tone="warning" />
                ),
        },
    ]

    return (
        <AppLayout activePage="New suppliers" portal="Buyer">
            <PageContainer
                kicker="Supplier Onboarding"
                title="New suppliers"
                description="Four approval steps with segregation-of-duties controls. Once final approval is granted, one deep-insert call creates the SAP Business Partner."
            >
                <div className="metric-grid">
                    <article className="metric-card warning">
                        <div className="metric-top">
                            <span>Waiting for you</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{openList.length}</strong>
                        <p>Longest wait: 9 days</p>
                    </article>

                    <article className="metric-card danger">
                        <div className="metric-top">
                            <span>Duplicate PAN</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{openList.filter((r) => r.dup).length}</strong>
                        <p>Requires written justification</p>
                    </article>

                    <article className="metric-card success">
                        <div className="metric-top">
                            <span>Approved to SAP</span>
                            <span className="metric-status" />
                        </div>
                        <strong>{approvedList.length}</strong>
                        <p>Business Partners created</p>
                    </article>

                    <article className="metric-card info">
                        <div className="metric-top">
                            <span>Average Approval</span>
                            <span className="metric-status" />
                        </div>
                        <strong>9.4 d</strong>
                        <p>Target: under 14 working days</p>
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
                        keyField="ref"
                        onRowClick={(row) => setSelectedRef(row.ref)}
                    />
                </div>

                {/* Selected Application Inspection & Workflow Decision Card */}
                {selectedReg && (
                    <div className="card" style={{ marginTop: '22px' }}>
                        <div className="card-header">
                            <div>
                                <span className="card-kicker">Application Inspection</span>
                                <h3 className="card-title">
                                    {selectedReg.name} · {selectedReg.ref}
                                </h3>
                            </div>

                            {selectedReg?.st === 'DONE' ? (
                                <StatusBadge label={`Business Partner ${selectedReg?.bp} created`} tone="success" />
                            ) : selectedReg?.st === 'REJECTED' ? (
                                <StatusBadge label="Application Rejected" tone="danger" />
                            ) : (
                                <StatusBadge label={`Step ${(selectedReg?.step || 0) + 1} of 4: ${CHAIN[selectedReg?.step || 0]}`} tone="warning" />
                            )}
                        </div>

                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', fontSize: '12.5px' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PAN</div>
                                    <strong className="mono">{selectedReg.pan}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>GSTIN</div>
                                    <strong className="mono">{selectedReg.gstin}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Turnover Declared</div>
                                    <strong>{selectedReg.turnover}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Employees</div>
                                    <strong>{selectedReg.emp} staff</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Certifications</div>
                                    <strong>{selectedReg.certs}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Category</div>
                                    <strong>{selectedReg.cat}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Referred By</div>
                                    <strong>{selectedReg.by}</strong>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Days in Process</div>
                                    <strong>{selectedReg.days} days</strong>
                                </div>
                            </div>

                            {/* Duplicate Warning Box */}
                            {selectedReg?.dup && selectedReg?.st === 'OPEN' && (
                                <div
                                    style={{
                                        marginTop: '20px',
                                        padding: '16px 18px',
                                        background: 'var(--danger-bg)',
                                        border: '1px solid rgba(209,75,75,0.3)',
                                        borderRadius: '10px',
                                    }}
                                >
                                    <strong style={{ color: 'var(--danger)', fontSize: '13px' }}>
                                        Duplicate PAN Warning (SAP S/4HANA Pre-Screening)
                                    </strong>
                                    <p style={{ margin: '6px 0 12px', fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                                        PAN matches blocked Business Partner <strong>0017002991</strong> (Hosur Turned Parts, proprietorship blocked Nov 2023). A duplicate warning cannot simply be ignored; you must record why this is a legitimate new entity.
                                    </p>

                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Justification for override:
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        rows={2}
                                        value={justificationNote}
                                        onChange={(e) => setJustificationNote(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Actions bar */}
                            {selectedReg?.st === 'OPEN' && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleReject(selectedReg.ref)}
                                    >
                                        Reject Application
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onClick={() => toast.info('Applicant notified via email with missing details link.')}
                                    >
                                        Send Back for Information
                                    </Button>

                                    <div style={{ flex: 1 }} />

                                    {selectedReg.step < 3 ? (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleAdvance(selectedReg.ref)}
                                        >
                                            Approve — Pass to {CHAIN[selectedReg.step + 1]} →
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleCreateBP(selectedReg.ref)}
                                        >
                                            Approve — Create S/4HANA Business Partner ⚡
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="hint">
                    <b>Nothing exists in SAP until the last step.</b> A rejected applicant leaves no trace in the ERP.
                    After the Business Partner is created, every later change is a Fiori transaction.
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default NewSuppliers
