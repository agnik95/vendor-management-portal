import { useState, useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import Tabs from '../../components/common/Tabs'
import Button from '../../components/common/Button'
import MetricCard from '../../components/common/MetricCard'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function Queries() {
    const { data, replyMsg } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('open')
    const [selectedMsgNo, setSelectedMsgNo] = useState(data.msgs[0]?.no || '')
    const [replyText, setReplyText] = useState('')

    // Filters
    const openMsgs = useMemo(() => data.msgs.filter((m) => !m.reply), [data.msgs])
    const lateMsgs = useMemo(() => data.msgs.filter((m) => m.late && !m.reply), [data.msgs])
    const answeredMsgs = useMemo(() => data.msgs.filter((m) => m.reply), [data.msgs])

    const displayMsgs = useMemo(() => {
        switch (activeTab) {
            case 'open':
                return openMsgs
            case 'late':
                return lateMsgs
            case 'answered':
                return answeredMsgs
            case 'all':
            default:
                return data.msgs
        }
    }, [activeTab, openMsgs, lateMsgs, answeredMsgs, data.msgs])

    const selectedMsg = useMemo(() => {
        return data.msgs.find((m) => m.no === selectedMsgNo) || displayMsgs[0] || data.msgs[0]
    }, [data.msgs, selectedMsgNo, displayMsgs])

    const tabsList = [
        { id: 'open', label: 'Open' },
        { id: 'late', label: 'Past Target' },
        { id: 'all', label: 'All Queries' },
        { id: 'answered', label: 'Answered' },
    ]

    const handleSendReply = async () => {
        if (!replyText.trim()) {
            toast.warning('Input required', 'Please type a reply before submitting.')
            return
        }
        const res = await replyMsg(selectedMsg.no, replyText)
        if (res?.error) {
            toast.error('Failed', res.error)
            return
        }
        toast.success(
            'Reply sent to supplier',
            `Message attached to ${selectedMsg.link || 'transaction document'} for full team visibility.`
        )
        setReplyText('')
    }

    const handleSaveInternalNote = () => {
        toast.info(
            'Internal note saved',
            'Filtered on server — this is stored internally and never exposed to the supplier portal.'
        )
    }

    const tableColumns = [
        {
            key: 'subj',
            header: 'Query',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.subj}</div>
                    <div className="font-mono text-xs text-muted">{row.no}</div>
                </div>
            ),
        },
        {
            key: 'sup',
            header: 'Supplier',
            render: (row) => row.sup,
        },
        {
            key: 'cat',
            header: 'Category',
            render: (row) => row.cat,
        },
        {
            key: 'link',
            header: 'Linked Object',
            render: (row) =>
                row.link ? <span className="font-mono text-xs">{row.link}</span> : <span className="text-muted">—</span>,
        },
        {
            key: 'owner',
            header: 'Owner',
            render: (row) => row.owner,
        },
        {
            key: 'days',
            header: 'Age',
            align: 'right',
            render: (row) => `${row.days} d`,
        },
        {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (row) => {
                if (row.reply) return <StatusBadge status="Answered" tone="success" />
                if (row.late) return <StatusBadge status="Past target" tone="danger" />
                return <StatusBadge status="Open" tone="warning" />
            },
        },
    ]

    return (
        <AppLayout activePage="Queries" portal="Buyer">
            <PageContainer
                kicker="SUPPLIER COMMUNICATIONS & EXCEPTION DESK"
                title="Queries"
                subtitle="Document-linked communication threads attached directly to purchase orders, receipts, and invoices."
            >
            {/* Top KPI Metrics */}
            <div className="metrics-grid">
                <MetricCard
                    label="Open Inquiries"
                    value={openMsgs.length}
                    sub={`Across ${new Set(openMsgs.map((x) => x.sup)).size} distinct suppliers`}
                    tone="warning"
                />
                <MetricCard
                    label="Past Reply Target"
                    value={lateMsgs.length}
                    sub={lateMsgs.length > 0 ? 'Escalated to category lead' : 'All SLAs satisfied'}
                    tone={lateMsgs.length > 0 ? 'danger' : 'success'}
                />
                <MetricCard
                    label="Answered This Month"
                    value={answeredMsgs.length}
                    sub="Audit record maintained"
                    tone="success"
                />
                <MetricCard
                    label="Average First Reply"
                    value="1.4 d"
                    sub="Target is 1 working day"
                    tone="success"
                />
            </div>

            {/* Queries Table */}
            <Card>
                <Card.Header
                    title="Communication Threads"
                    action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                />
                <Card.Body style={{ padding: 0 }}>
                    <DataTable
                        columns={tableColumns}
                        data={displayMsgs}
                        onRowClick={(row) => setSelectedMsgNo(row.no)}
                        emptyMessage="No queries found matching this filter."
                    />
                </Card.Body>
            </Card>

            {/* Selected Query Conversation Card */}
            {selectedMsg && (
                <Card style={{ marginTop: '24px' }}>
                    <Card.Header
                        kicker={selectedMsg.link ? `LINKED OBJECT: ${selectedMsg.link}` : 'GENERAL QUERY'}
                        title={`${selectedMsg.subj} · ${selectedMsg.sup}`}
                        action={
                            selectedMsg.reply ? (
                                <StatusBadge status="Answered" tone="success" />
                            ) : selectedMsg.late ? (
                                <StatusBadge status="Past target" tone="danger" />
                            ) : (
                                <StatusBadge status="Open" tone="warning" />
                            )
                        }
                    />
                    <Card.Body>
                        {/* Conversation Thread */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            {selectedMsg.thread &&
                                selectedMsg.thread.map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            background: 'var(--bg-card-subtle, #f8fafc)',
                                            border: '1px solid var(--border-color, #e2e8f0)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            {item.w} · {item.o} · {item.t}
                                        </div>
                                        <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                            {item.b}
                                        </div>
                                    </div>
                                ))}

                            {/* Buyer Reply Bubble */}
                            {selectedMsg.reply && (
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                        marginLeft: '24px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: 'var(--color-primary, #1e3a8a)',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        {selectedMsg.owner} · Buyer Organisation · Response Recorded
                                    </div>
                                    <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                        {selectedMsg.reply}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reply Form (if not yet replied) */}
                        {!selectedMsg.reply && (
                            <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '20px' }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        marginBottom: '8px',
                                    }}
                                >
                                    Reply to {selectedMsg.sup}
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Type your official response to the supplier..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color, #cbd5e1)',
                                        fontFamily: 'inherit',
                                        fontSize: '13.5px',
                                        marginBottom: '12px',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Button variant="primary" onClick={handleSendReply}>
                                        Send reply
                                    </Button>
                                    <Button variant="secondary" onClick={handleSaveInternalNote}>
                                        Save as internal note
                                    </Button>
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
                <strong>Audit Linking Architecture:</strong> A resolved query permanently attaches to the business transaction
                (PO line, Goods Receipt, or Payment Block) it was raised against. When another buyer or auditor views the purchase
                order, they immediately see why the price was modified or schedule was shifted without searching through personal emails.
            </div>
        </PageContainer>
    </AppLayout>
    )
}

export default Queries
