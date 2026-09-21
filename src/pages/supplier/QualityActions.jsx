import { useState, useMemo, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function QualityActions() {
    const { data, submit8DStep } = useVendorData()
    const toast = useToast()

    const ncr = data.ncr || {
        no: 'NCR-2026-0881',
        mat: 'SH-9012 shaft assembly',
        qty: 640,
        plant: 1,
        doc: '5000041288',
        po: '4500008812',
        raised: '14 Aug 2026',
        sev: 'Major',
        disp: 'Return to vendor',
        debit: '5105004412',
        debitAmt: 180000,
        due: '21 Aug 2026',
        steps: [
            { c: 'D1', t: 'Champion and team formed', owner: 'A. Deshpande', due: '15 Aug', st: 'ACCEPTED' },
            { c: 'D2', t: 'Problem defined with data', owner: 'R. K. Sharma', due: '16 Aug', st: 'ACCEPTED' },
            { c: 'D3', t: 'Containment at plant and warehouse', owner: 'R. K. Sharma', due: '17 Aug', st: 'ACCEPTED' },
            { c: 'D4', t: 'Root cause analysis (5-Why / Fishbone)', owner: 'R. K. Sharma', due: '19 Aug', st: 'RETURNED' },
            { c: 'D5', t: 'Permanent corrective actions chosen', owner: 'R. K. Sharma', due: '21 Aug', st: 'NOT_STARTED' },
            { c: 'D6', t: 'Corrective action implemented', owner: 'R. K. Sharma', due: '24 Aug', st: 'NOT_STARTED' },
            { c: 'D7', t: 'Prevent recurrence & control plan updated', owner: 'R. K. Sharma', due: '26 Aug', st: 'NOT_STARTED' },
            { c: 'D8', t: 'Congratulate team & case closed', owner: 'S. Kulkarni (SQA)', due: '28 Aug', st: 'NOT_STARTED' },
        ],
    }

    const [steps, setSteps] = useState(ncr?.steps || [])

    useEffect(() => {
        if (data.ncr?.steps) {
            setSteps(data.ncr.steps)
        }
    }, [data.ncr])
    const [actionModal, setActionModal] = useState({
        open: false,
        stepIndex: -1,
        stepCode: '',
        stepTitle: '',
        response: '',
        evidenceAttached: false,
        viewOnly: false,
    })

    const isClosed = useMemo(() => (steps || []).every((s) => s?.st === 'ACCEPTED'), [steps])

    const handleOpenStep = (idx, viewOnly = false) => {
        const s = steps[idx]
        setActionModal({
            open: true,
            stepIndex: idx,
            stepCode: s?.c,
            stepTitle: s?.t,
            response:
                s?.st === 'ACCEPTED'
                    ? 'Root cause identified: Spindle bearing runout at OP-40 caused tool vibration and burr formation. Bearing replaced and calibrated to 0.005mm tolerance.'
                    : '',
            evidenceAttached: s?.st === 'ACCEPTED',
            viewOnly,
        })
    }

    const handleSaveStep = async () => {
        if (!actionModal.viewOnly) {
            const res = await submit8DStep(actionModal.stepIndex, actionModal.response, actionModal.evidenceAttached)
            
            if (res.error) {
                toast.error('Submission failed', res.error)
                return
            }

            toast.success(
                `Discipline ${actionModal.stepCode} submitted for SQA review`,
                'Root cause and corrective action forwarded to S. Kulkarni (SQA).'
            )
        }
        setActionModal({ open: false, stepIndex: -1, stepCode: '', stepTitle: '', response: '', evidenceAttached: false, viewOnly: false })
    }

    const tableColumns = [
        {
            key: 'c',
            header: 'Discipline',
            render: (row) => <span className="font-mono font-bold">{row.c}</span>,
        },
        { key: 't', header: 'Requirement Scope', render: (row) => row.t },
        { key: 'owner', header: 'Owner', render: (row) => row.owner },
        { key: 'due', header: 'Due Date', render: (row) => row.due },
        {
            key: 'st',
            header: 'Progress Status',
            render: (row) => {
                if (row?.st === 'ACCEPTED') return <StatusBadge status="Accepted (Complete)" tone="success" />
                if (row?.st === 'IN_PROGRESS') return <StatusBadge status="In Progress" tone="warning" />
                if (row?.st === 'RETURNED') return <StatusBadge status="Returned by SQA" tone="danger" />
                return <StatusBadge status="Not Started" tone="neutral" />
            },
        },
        {
            key: 'actions',
            header: 'Action',
            align: 'right',
            render: (_, row, idx) => {
                const prevOk = idx === 0 || steps[idx - 1]?.st === 'ACCEPTED'
                if (row?.st === 'ACCEPTED') {
                    return (
                        <Button size="sm" variant="secondary" onClick={() => handleOpenStep(idx, true)}>
                            View
                        </Button>
                    )
                }
                if (prevOk) {
                    return (
                        <Button size="sm" variant="primary" onClick={() => handleOpenStep(idx, false)}>
                            Complete {row.c}
                        </Button>
                    )
                }
                return (
                    <Button size="sm" variant="secondary" disabled title="Prior discipline step must be accepted first">
                        Locked
                    </Button>
                )
            },
        },
    ]

    return (
        <AppLayout activePage="Quality actions (8D)" portal="Supplier">
            <PageContainer
                kicker="NON-CONFORMANCE RESOLUTION (8D WORKBENCH)"
                title="Quality actions"
                subtitle="Structured 8D root-cause investigation with sequential milestone gate enforcement and audit evidence attachments."
            >
                {/* Header Meta Card */}
                <Card style={{ marginBottom: '24px' }}>
                    <Card.Header
                        kicker={`CASE REFERENCE: ${ncr.no}`}
                        title={`${ncr.no} — Burr on flange face`}
                        action={
                            isClosed ? (
                                <StatusBadge status="Case Closed" tone="success" />
                            ) : (
                                <StatusBadge status="8D Response Action Overdue" tone="danger" />
                            )
                        }
                    />
                    <Card.Body>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                padding: '14px',
                                background: 'var(--bg-card-subtle, #f8fafc)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                            }}
                        >
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Material Document
                                </span>
                                <div className="font-mono" style={{ fontWeight: 600 }}>{ncr.doc}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Linked Purchase Order
                                </span>
                                <div className="font-mono" style={{ fontWeight: 600 }}>{ncr.po}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Audited Material
                                </span>
                                <div style={{ fontWeight: 600 }}>{ncr.mat}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Quantity Non-Conforming
                                </span>
                                <div className="font-mono font-bold" style={{ color: 'var(--color-danger, #ef4444)' }}>
                                    {ncr.qty.toLocaleString('en-IN')} pcs
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Raised By
                                </span>
                                <div style={{ fontWeight: 600 }}>S. Kulkarni · Plant {ncr.plant} SQA</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Material Disposition
                                </span>
                                <div style={{ fontWeight: 600 }}>{ncr.disp}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Financial Debit Memo
                                </span>
                                <div className="font-mono font-bold">Doc {ncr.debit}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Resolution Due Date
                                </span>
                                <div style={{ fontWeight: 600 }}>{ncr.due}</div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* 8D Steps Table */}
                <Card>
                    <Card.Header
                        title="8D Problem Solving Methodology"
                        kicker="SEQUENTIAL GATED DISCIPLINES"
                        action={
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {(steps || []).filter((s) => s?.st === 'ACCEPTED').length} of 8 disciplines completed
                            </span>
                        }
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable columns={tableColumns} data={steps} />
                    </Card.Body>
                </Card>

                {/* Architectural Policy Note */}
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
                    <strong>Why 8D Workflow Lives in the Portal:</strong> Standard SAP S/4HANA Quality Notifications hold the
                    defect code and return material document, but have no standard mechanism for collaborative 8D root-cause
                    iterations or evidence exchange. The portal coordinates the investigation and writes back final case closure
                    status directly into SAP.
                </div>

                {/* 8D Step Action Modal */}
                <Modal
                    isOpen={actionModal.open}
                    onClose={() => setActionModal({ open: false, stepIndex: -1, stepCode: '', stepTitle: '', response: '', evidenceAttached: false, viewOnly: false })}
                    title={`${actionModal.stepCode} — ${actionModal.stepTitle}`}
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setActionModal({ open: false, stepIndex: -1, stepCode: '', stepTitle: '', response: '', evidenceAttached: false, viewOnly: false })}
                            >
                                {actionModal.viewOnly ? 'Close' : 'Cancel'}
                            </Button>
                            {!actionModal.viewOnly && (
                                <Button variant="primary" onClick={handleSaveStep}>
                                    Submit {actionModal.stepCode} for SQA Review
                                </Button>
                            )}
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField
                            label="Technical Investigation & Action Plan"
                            required={!actionModal.viewOnly}
                            helper={!actionModal.viewOnly ? 'Minimum 50 characters required (VAL-004)' : ''}
                        >
                            <textarea
                                className="form-control"
                                rows={5}
                                placeholder="Describe the physical failure mechanism, 5-why root cause analysis, or verification findings..."
                                value={actionModal.response}
                                readOnly={actionModal.viewOnly}
                                onChange={(e) => setActionModal({ ...actionModal, response: e.target.value })}
                            />
                        </FormField>

                        {!actionModal.viewOnly && (
                            <div
                                style={{
                                    border: '2px dashed var(--border-color, #cbd5e1)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: actionModal.evidenceAttached ? 'rgba(16, 185, 129, 0.05)' : '#fff',
                                }}
                                onClick={() => {
                                    setActionModal({ ...actionModal, evidenceAttached: true })
                                    toast.info('Evidence Attached', 'spindle-vibration-analysis.pdf (2.1 MB) uploaded.')
                                }}
                            >
                                <div style={{ fontSize: '20px' }}>{actionModal.evidenceAttached ? '✓' : '📎'}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                                    {actionModal.evidenceAttached
                                        ? 'Evidence Attached: spindle-vibration-analysis.pdf'
                                        : 'Attach Calibration Report / Photographic Evidence (Mandatory for D3/D4/D6/D7)'}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default QualityActions
