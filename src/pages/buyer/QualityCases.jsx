import { useState, useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import Tabs from '../../components/common/Tabs'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import MetricCard from '../../components/common/MetricCard'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

const D8_STEPS = [
    { code: 'D1', label: 'Team formed' },
    { code: 'D2', label: 'Problem described with data' },
    { code: 'D3', label: 'Containment at both plants' },
    { code: 'D4', label: 'Root cause — five why or fishbone' },
    { code: 'D5', label: 'Corrective action chosen' },
    { code: 'D6', label: 'Implemented and verified' },
    { code: 'D7', label: 'Control plan and FMEA updated' },
    { code: 'D8', label: 'Closed and recognised' },
]

function formatMoney(amount) {
    if (!amount) return '—'
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`
    }
    return `₹${amount.toLocaleString('en-IN')}`
}

function QualityCases() {
    const { data, acceptStep8D, returnStep8D } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('review')
    const [selectedCaseNo, setSelectedCaseNo] = useState(data.cases[0]?.no || '')
    const [sendBackModal, setSendBackModal] = useState({ open: false, caseNo: '', stepIndex: 0, reason: '' })

    // Filtered lists
    const toCheckCases = useMemo(() => data.cases.filter((c) => c.steps.includes('SUB')), [data.cases])
    const overdueCases = useMemo(() => data.cases.filter((c) => c.late > 0 && !c.steps.every((s) => s === 'OK')), [data.cases])
    const openCases = useMemo(() => data.cases.filter((c) => !c.steps.every((s) => s === 'OK')), [data.cases])

    const totalDebit = useMemo(() => {
        return data.cases.reduce((sum, c) => sum + (c.debit || 0), 0)
    }, [data.cases])

    const displayCases = useMemo(() => {
        switch (activeTab) {
            case 'review':
                return toCheckCases
            case 'overdue':
                return overdueCases
            case 'open':
                return openCases
            case 'all':
            default:
                return data.cases
        }
    }, [activeTab, toCheckCases, overdueCases, openCases, data.cases])

    const selectedCase = useMemo(() => {
        return data.cases.find((c) => c.no === selectedCaseNo) || displayCases[0] || data.cases[0]
    }, [data.cases, selectedCaseNo, displayCases])

    const tabsList = [
        { id: 'review', label: 'Your review' },
        { id: 'overdue', label: 'Overdue' },
        { id: 'open', label: 'Open' },
        { id: 'all', label: 'All' },
    ]

    const getCaseStatusBadge = (c) => {
        if (c.steps.every((s) => s === 'OK')) {
            return <StatusBadge status="Closed" tone="success" />
        }
        if (c.late > 0) {
            return <StatusBadge status={`${c.late} days late`} tone="danger" />
        }
        if (c.steps.includes('SUB')) {
            return <StatusBadge status="Your review" tone="warning" />
        }
        return <StatusBadge status="With supplier" tone="info" />
    }

    const tableColumns = [
        {
            key: 'no',
            header: 'Case',
            render: (row) => <span className="font-mono font-bold">{row.no}</span>,
        },
        {
            key: 'sup',
            header: 'Supplier',
            render: (row) => row.sup,
        },
        {
            key: 'part',
            header: 'Part',
            render: (row) => row.part,
        },
        {
            key: 'qty',
            header: 'Quantity',
            align: 'right',
            render: (row) => `~${(row?.qty || 0).toLocaleString('en-IN')}`,
        },
        {
            key: 'sev',
            header: 'Severity',
            render: (row) => (
                <StatusBadge
                    status={row.sev}
                    tone={row.sev === 'Critical' ? 'danger' : row.sev === 'Major' ? 'warning' : 'neutral'}
                />
            ),
        },
        {
            key: 'raised',
            header: 'Raised',
            render: (row) => row.raised,
        },
        {
            key: 'progress',
            header: 'Progress',
            render: (row) => {
                const okCount = row.steps.filter((s) => s === 'OK').length
                return `${okCount} of 8 accepted`
            },
        },
        {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (row) => getCaseStatusBadge(row),
        },
    ]

    const handleAcceptStep = async (caseNo, stepIndex) => {
        const res = await acceptStep8D(caseNo, stepIndex)
        if (res?.error) {
            toast.error('Failed', res.error)
            return
        }
        toast.success(
            `Step ${D8_STEPS[stepIndex].code} accepted`,
            'The supplier can now proceed to the next discipline.'
        )
    }

    const handleOpenSendBack = (caseNo, stepIndex) => {
        setSendBackModal({
            open: true,
            caseNo,
            stepIndex,
            reason:
                'The root cause explains the tool life setting but not why the operator check sheet omitted a burr check at OP-40. Extend the analysis to the control plan.',
        })
    }

    const handleConfirmSendBack = async () => {
        if (!sendBackModal.reason.trim()) {
            toast.error('Reason required', 'Please provide instructions on what needs revision.')
            return
        }
        const res = await returnStep8D(sendBackModal.caseNo, sendBackModal.stepIndex, sendBackModal.reason)
        if (res?.error) {
            toast.error('Failed', res.error)
            return
        }
        toast.warning(
            `Step ${D8_STEPS[sendBackModal.stepIndex].code} returned`,
            'Subsequent steps have been locked. The supplier response clock is running.'
        )
        setSendBackModal({ open: false, caseNo: '', stepIndex: 0, reason: '' })
    }

    return (
        <AppLayout activePage="Quality cases" portal="Buyer">
            <PageContainer
                kicker="QUALITY ASSURANCE & VENDOR DISCIPLINE"
                title="Quality cases"
                subtitle="Supplier 8D corrective action responses, reviewed step by step with strict ERP audit traceability."
            >
            {/* Top Metric Tiles */}
            <div className="metrics-grid">
                <MetricCard
                    label="Waiting for your review"
                    value={toCheckCases.length}
                    sub="Supplier is blocked until you act"
                    tone={toCheckCases.length > 0 ? 'warning' : 'success'}
                />
                <MetricCard
                    label="Overdue 8D responses"
                    value={overdueCases.length}
                    sub={
                        overdueCases.length > 0
                            ? `Oldest is ${Math.max(...overdueCases.map((x) => x.late))} days late`
                            : 'All SLAs on schedule'
                    }
                    tone={overdueCases.length > 0 ? 'danger' : 'success'}
                />
                <MetricCard
                    label="Open quality cases"
                    value={openCases.length}
                    sub={`Across ${new Set(openCases.map((x) => x.sup)).size} distinct suppliers`}
                    tone="neutral"
                />
                <MetricCard
                    label="Debit notes raised"
                    value={formatMoney(totalDebit)}
                    sub="Posted in SAP S/4HANA Finance"
                    tone="warning"
                />
            </div>

            {/* Cases Table with Tabs */}
            <Card>
                <Card.Header
                    title="8D Quality Dossiers"
                    action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                />
                <Card.Body style={{ padding: 0 }}>
                    <DataTable
                        columns={tableColumns}
                        data={displayCases}
                        onRowClick={(row) => setSelectedCaseNo(row.no)}
                        emptyMessage="No quality cases found for this view."
                    />
                </Card.Body>
            </Card>

            {/* Selected Case Detail Card */}
            {selectedCase && (
                <Card style={{ marginTop: '24px' }}>
                    <Card.Header
                        kicker={`BUSINESS PARTNER REF: ${selectedCase.bp || '0017004521'}`}
                        title={`${selectedCase.no} · ${selectedCase.sup}`}
                        action={getCaseStatusBadge(selectedCase)}
                    />
                    <Card.Body>
                        {/* Dossier Meta Fields */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                padding: '16px',
                                background: 'var(--bg-card-subtle, #f8fafc)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                marginBottom: '24px',
                            }}
                        >
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Part Affected
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCase.part}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Quantity Affected
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>~{selectedCase.qty.toLocaleString('en-IN')} pcs</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Severity
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCase.sev}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Response Due
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCase.due}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Days Overdue
                                </span>
                                <div style={{ fontWeight: 600, color: selectedCase.late > 0 ? 'var(--color-danger, #ef4444)' : 'inherit', marginTop: '2px' }}>
                                    {selectedCase.late ? `${selectedCase.late} days` : '—'}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Debit Note
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                                    {selectedCase.debit ? formatMoney(selectedCase.debit) : 'None'}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Linked SAP Notification
                                </span>
                                <div className="font-mono" style={{ fontWeight: 600, marginTop: '2px' }}>
                                    1000{4400 + data.cases.findIndex((x) => x.no === selectedCase.no)}
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Evidence Files
                                </span>
                                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedCase.ev} file(s) attached</div>
                            </div>
                        </div>

                        {/* 8D Steps Timeline */}
                        <div style={{ marginTop: '8px' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>
                                8D Discipline Progress & Review
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {D8_STEPS.map((step, idx) => {
                                    const stepStatus = selectedCase.steps[idx]
                                    return (
                                        <div
                                            key={step.code}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '12px 16px',
                                                borderRadius: '6px',
                                                background:
                                                    stepStatus === 'SUB'
                                                        ? 'rgba(245, 158, 11, 0.06)'
                                                        : 'var(--bg-surface, #fff)',
                                                border:
                                                    stepStatus === 'SUB'
                                                        ? '1px solid rgba(245, 158, 11, 0.3)'
                                                        : '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            <span
                                                className="font-mono font-bold"
                                                style={{
                                                    width: '36px',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                {step.code}
                                            </span>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    fontSize: '14px',
                                                    fontWeight: stepStatus === 'SUB' ? 600 : 500,
                                                }}
                                            >
                                                {step.label}
                                            </span>
                                            <span style={{ width: '140px' }}>
                                                {stepStatus === 'OK' && (
                                                    <StatusBadge status="Accepted" tone="success" />
                                                )}
                                                {stepStatus === 'SUB' && (
                                                    <StatusBadge status="Waiting for you" tone="warning" />
                                                )}
                                                {stepStatus === 'RET' && (
                                                    <StatusBadge status="Sent back" tone="danger" />
                                                )}
                                                {(!stepStatus || stepStatus === '') && (
                                                    <StatusBadge status="Not started" tone="neutral" />
                                                )}
                                            </span>
                                            <span style={{ width: '180px', textAlign: 'right' }}>
                                                {stepStatus === 'SUB' && (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleAcceptStep(selectedCase.no, idx)}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => handleOpenSendBack(selectedCase.no, idx)}
                                                        >
                                                            Send back
                                                        </Button>
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Supplier Response Content */}
                        {(selectedCase.steps.includes('SUB') || selectedCase.steps.includes('RET')) && (
                            <div
                                style={{
                                    marginTop: '20px',
                                    background: 'var(--bg-card-subtle, #f8fafc)',
                                    border: '1px solid var(--border-color, #e2e8f0)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        marginBottom: '6px',
                                    }}
                                >
                                    Supplier Submission Note
                                </div>
                                <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                    {selectedCase.text ||
                                        'Root cause analysis identified tool wear anomaly at OP-40 spindle head. Corrective parameter offsets calibrated.'}
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                    📎 {selectedCase.ev} evidence file{selectedCase.ev === 1 ? '' : 's'} attached
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* Explanatory Policy Callout */}
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
                <strong>ERP Discipline Enforcement:</strong> Sending an 8D step back reopens it and automatically locks every
                subsequent step (D<sub>n+1</sub> to D8). This guarantees a corrective action can never contradict a revised root
                cause. In SAP S/4HANA, use <em>Manage Quality Notifications (QM02/QM03)</em> for defect disposition, return orders, and debit
                note posting.
            </div>

            {/* Send Back Modal */}
            <Modal
                isOpen={sendBackModal.open}
                onClose={() => setSendBackModal({ open: false, caseNo: '', stepIndex: 0, reason: '' })}
                title={`Send ${D8_STEPS[sendBackModal.stepIndex]?.code} back to supplier`}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setSendBackModal({ open: false, caseNo: '', stepIndex: 0, reason: '' })}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleConfirmSendBack}>
                            Confirm & Send Back
                        </Button>
                    </>
                }
            >
                <div style={{ marginBottom: '16px' }}>
                    <FormField
                        label="Reason for rejection / required revisions"
                        required
                        helper="Explain precisely why the evidence or analysis was inadequate."
                    >
                        <textarea
                            className="form-control"
                            rows={4}
                            value={sendBackModal.reason}
                            onChange={(e) =>
                                setSendBackModal((prev) => ({ ...prev, reason: e.target.value }))
                            }
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color, #cbd5e1)',
                                fontFamily: 'inherit',
                                fontSize: '13.5px',
                            }}
                        />
                    </FormField>
                </div>
                <div
                    style={{
                        padding: '12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '12.5px',
                        color: 'var(--color-danger, #b91c1c)',
                    }}
                >
                    <strong>Sequential Gate Notice:</strong> All steps following {D8_STEPS[sendBackModal.stepIndex]?.code} will be
                    wiped and locked until the supplier resubmits an acceptable response.
                </div>
            </Modal>
        </PageContainer>
    </AppLayout>
    )
}

export default QualityCases
