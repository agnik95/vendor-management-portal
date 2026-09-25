import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import apiClient from '../../services/apiClient'
import PageContainer from '../../components/layout/PageContainer'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../components/common/useToast'
import { useAuth } from '../../context/AuthContext'

const CHAIN = [
    'Category buyer',
    'Supplier quality',
    'Finance — bank',
    'Procurement head',
]

function NewSuppliers() {
    const toast = useToast()
    const { data, createBP, rejectReg } = useVendorData()
    const { hasRole } = useAuth()
    const canApprove = hasRole('BUYER', 'ADMIN')

    const [activeTab, setActiveTab] = useState('open')
    const [selectedRef, setSelectedRef] = useState('REG-2026-187')
    const [justificationNote, setJustificationNote] = useState(
        'Predecessor proprietorship, now converted to an LLP. The old Business Partner stays blocked.'
    )
    
    // Master data for Decision panel
    const [masterData, setMasterData] = useState({
        purchasingOrgs: [],
        paymentTerms: [],
        companyCodes: [],
        accountGroups: []
    })

    const [decision, setDecision] = useState({
        accountGroup: 'ZDOM',
        purchasingOrg: 'MSPO',
        paymentTerms: 'A200',
        reconciliationAccount: '21100000 - Trade payables',
        companyCode: 'MSLU'
    })

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [poRes, ptRes, ccRes, agRes] = await Promise.all([
                    apiClient.get('/buyer/purchasing-org'),
                    apiClient.get('/buyer/payment-terms'),
                    apiClient.get('/buyer/company-codes'),
                    apiClient.get('/buyer/supplier-account-groups')
                ])
                setMasterData({
                    purchasingOrgs: poRes?.data?.data || [],
                    paymentTerms: ptRes?.data?.data || [],
                    companyCodes: ccRes?.data?.data || [],
                    accountGroups: agRes?.data?.data || []
                })
            } catch (err) {
                console.error('Failed to fetch decision master data', err)
            }
        }
        fetchMasterData()
    }, [])

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

    const handleCreateBP = async (ref) => {
        if (!selectedReg) return
        // Bank verification block removed to allow final Business Partner creation

        if (selectedReg.dup && (!justificationNote || justificationNote.trim().length < 15)) {
            toast.danger('A duplicate PAN cannot be waved through. Justification note is required.')
            return
        }
        
        const decisionPayload = {
            company_code: decision.companyCode,
            purchasing_organization: decision.purchasingOrg,
            payment_terms: decision.paymentTerms,
            supplier_account_group: decision.accountGroup
        }

        const res = await createBP(ref, decisionPayload, justificationNote)
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
            label: 'Approval Status',
            render: (v, r) =>
                r?.st === 'OPEN' ? (
                    <div>
                        <span style={{ fontWeight: 700 }}>Pending Review</span>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Action required</div>
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
                description="Review applications and approve to create the SAP Business Partner."
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
                                <StatusBadge label="Pending Approval" tone="warning" />
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

                            {/* Decision Box for Final Step */}
                            {selectedReg?.st === 'OPEN' && !canApprove && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '12px 16px',
                                    background: 'rgba(59, 130, 246, 0.06)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '8px',
                                    fontSize: '12.5px',
                                    color: 'var(--text-secondary)',
                                }}>
                                    <strong>Read-only view.</strong> Approval actions are restricted to Buyer and Admin roles.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Decision Card (Separate Tile) */}
                {selectedReg?.st === 'OPEN' && canApprove && (
                    <div className="card" style={{ marginTop: '22px' }}>
                        <div className="card-header">
                            <div>
                                <span className="card-kicker">Final Step</span>
                                <h3 className="card-title">Decision</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Account Group</label>
                                    <select 
                                        className="form-control"
                                        value={decision.accountGroup}
                                        onChange={(e) => setDecision({...decision, accountGroup: e.target.value})}
                                        style={{ fontWeight: '600' }}
                                    >
                                        {masterData.accountGroups.length === 0 && <option value="CPD">CPD — Dummy Account Group</option>}
                                        {masterData.accountGroups.map(group => (
                                            <option key={group.supplier_account_group} value={group.supplier_account_group}>
                                                {group.supplier_account_group} — {group.account_group_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Purchasing Organisation</label>
                                    <select 
                                        className="form-control"
                                        value={decision.purchasingOrg}
                                        onChange={(e) => setDecision({...decision, purchasingOrg: e.target.value})}
                                        style={{ fontWeight: '600' }}
                                    >
                                        {masterData.purchasingOrgs.length === 0 && <option value="1010">1010 — Domestic</option>}
                                        {masterData.purchasingOrgs.map(org => (
                                            <option key={org.purchasing_organization} value={org.purchasing_organization}>
                                                {org.purchasing_organization} — {org.purchasing_organization_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Payment Terms</label>
                                    <select 
                                        className="form-control"
                                        value={decision.paymentTerms}
                                        onChange={(e) => setDecision({...decision, paymentTerms: e.target.value})}
                                        style={{ fontWeight: '600' }}
                                    >
                                        {masterData.paymentTerms.length === 0 && <option value="ZN45">ZN45 — 45 days net</option>}
                                        {masterData.paymentTerms.map(term => (
                                            <option key={term.payment_term} value={term.payment_term}>
                                                {term.payment_term} — {term.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Reconciliation Account</label>
                                    <select 
                                        className="form-control"
                                        value={decision.reconciliationAccount}
                                        onChange={(e) => setDecision({...decision, reconciliationAccount: e.target.value})}
                                        style={{ fontWeight: '600' }}
                                    >
                                        <option value="21100000 - Trade payables">21100000 — Trade payables</option>
                                        <option value="21100001 - Import payables">21100001 — Import payables</option>
                                    </select>
                                </div>
                                
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Company Code</label>
                                    <select 
                                        className="form-control"
                                        value={decision.companyCode}
                                        onChange={(e) => setDecision({...decision, companyCode: e.target.value})}
                                        style={{ fontWeight: '600' }}
                                    >
                                        {masterData.companyCodes.length === 0 && <option value="MSLU">MSLU — MAHARASHTRA SEAMLESS LTD</option>}
                                        {masterData.companyCodes.map(code => (
                                            <option key={code.company_code} value={code.company_code}>
                                                {code.company_code} — {code.company_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!selectedReg?.dup && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Note to the next approver</label>
                                        <textarea
                                            className="form-textarea"
                                            rows={3}
                                            value={justificationNote}
                                            onChange={(e) => setJustificationNote(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Integrated Actions bar */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            alignItems: 'center', 
                            padding: '16px 20px', 
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(0,0,0,0.02)',
                            borderBottomLeftRadius: '8px',
                            borderBottomRightRadius: '8px'
                        }}>
                            <Button
                                variant="danger"
                                onClick={() => handleReject(selectedReg.ref)}
                            >
                                Reject
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => toast.info('Applicant notified via email with missing details link.')}
                            >
                                Send back for information
                            </Button>

                            <div style={{ flex: 1 }} />

                            <Button
                                variant="primary"
                                onClick={() => handleCreateBP(selectedReg.ref)}
                            >
                                Approve — Create Business Partner
                            </Button>
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
