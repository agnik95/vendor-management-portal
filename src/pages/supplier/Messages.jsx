import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useToast } from '../../context/useToast'

function Messages() {
    const toast = useToast()

    const [tickets, setTickets] = useState([
        {
            no: 'TKT-2026-0412',
            subj: 'Inspection lot rejection clarification on batch B26-0881',
            link: 'Receipt 5000041288 · PO 4500008812',
            status: 'OPEN',
            msgs: [
                {
                    who: 'R. K. Sharma',
                    role: 'QA Head · Precision Components',
                    when: '14 Aug 11:20',
                    me: true,
                    body: 'We have dispatched containment team to audit the OP-40 spindle. Has the 640-piece rejected lot been segregated at dock 2?',
                },
                {
                    who: 'S. Kulkarni',
                    role: 'Supplier Quality Lead · Bharat Precision',
                    when: '14 Aug 14:15',
                    me: false,
                    body: 'Yes, the lot is segregated under yellow quarantine tags at Warehouse B. Debit note 5105004412 will follow.',
                },
            ],
        },
        {
            no: 'TKT-2026-0398',
            subj: 'Payment clearance remittance for July invoices',
            link: 'Invoice INV/26-27/0866',
            status: 'RESOLVED',
            msgs: [
                {
                    who: 'V. S. Murthy',
                    role: 'Finance · Precision Components',
                    when: '18 Aug 09:30',
                    me: true,
                    body: 'Please confirm UTR number for payment run covering invoice INV/26-27/0866.',
                },
                {
                    who: 'K. Ramesh',
                    role: 'Accounts Payable Lead · Bharat Precision',
                    when: '18 Aug 15:45',
                    me: false,
                    body: 'Disbursement cleared under UTR HDFC26081844712. Full remittance breakdown is available on your portal Payments tab.',
                },
            ],
        },
    ])

    const [selectedTicketNo, setSelectedTicketNo] = useState(tickets[0].no)
    const [replyText, setReplyText] = useState('')
    const [newTicketModal, setNewTicketModal] = useState(false)
    const [newSubject, setNewSubject] = useState('')
    const [newLinkedObject, setNewLinkedObject] = useState('PO 4500008812')
    const [newFirstMessage, setNewFirstMessage] = useState('')

    const activeTicket = tickets.find((t) => t.no === selectedTicketNo) || tickets[0]

    const handleSendReply = () => {
        if (!replyText.trim()) {
            toast.warning('Input required', 'Please type a reply before sending.')
            return
        }

        const newMsg = {
            who: 'You',
            role: 'Precision Components Pvt Ltd',
            when: 'Just now',
            me: true,
            body: replyText,
        }

        setTickets((prev) =>
            prev.map((t) => (t.no === activeTicket.no ? { ...t, msgs: [...t.msgs, newMsg] } : t))
        )

        toast.success(
            'Reply sent to buyer',
            `Message linked to ${activeTicket.link || 'procurement transaction'}.`
        )
        setReplyText('')
    }

    const handleCreateTicket = () => {
        if (!newSubject.trim() || !newFirstMessage.trim()) {
            toast.error('Fields required', 'Please provide a subject and message.')
            return
        }

        const newTkt = {
            no: `TKT-2026-0${420 + Math.floor(Math.random() * 80)}`,
            subj: newSubject,
            link: newLinkedObject,
            status: 'OPEN',
            msgs: [
                {
                    who: 'You',
                    role: 'Precision Components Pvt Ltd',
                    when: 'Just now',
                    me: true,
                    body: newFirstMessage,
                },
            ],
        }

        setTickets([newTkt, ...tickets])
        setSelectedTicketNo(newTkt.no)
        setNewTicketModal(false)
        setNewSubject('')
        setNewFirstMessage('')

        toast.success(
            'New inquiry ticket created',
            `Ticket ${newTkt.no} attached to ${newLinkedObject} and forwarded to buyer.`
        )
    }

    return (
        <AppLayout activePage="Messages" portal="Supplier">
            <PageContainer
                kicker="TRANSACTION-LINKED COLLABORATION DESK"
                title="Messages & support"
                subtitle="Contextual inquiries and dispute resolution threads attached directly to purchase orders, receipts, and invoices."
                actions={
                    <Button variant="primary" size="sm" onClick={() => setNewTicketModal(true)}>
                        + New inquiry ticket
                    </Button>
                }
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {/* Left Column: Tickets Queue */}
                    <Card>
                        <Card.Header
                            title="Your Inquiries"
                            kicker="SUPPORT & CLARIFICATIONS"
                            action={
                                <Button size="sm" variant="primary" onClick={() => setNewTicketModal(true)}>
                                    + New
                                </Button>
                            }
                        />
                        <Card.Body style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tickets.map((t) => {
                                    const isSelected = t.no === selectedTicketNo
                                    return (
                                        <div
                                            key={t.no}
                                            onClick={() => setSelectedTicketNo(t.no)}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(30, 58, 138, 0.08)' : 'transparent',
                                                border: isSelected
                                                    ? '1px solid rgba(30, 58, 138, 0.25)'
                                                    : '1px solid var(--border-color, #e2e8f0)',
                                                transition: 'background 0.15s ease',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{t.subj}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {t.no} · {t.msgs.length} message(s) · {t.link}
                                            </div>
                                            <div style={{ marginTop: '8px' }}>
                                                <StatusBadge
                                                    status={t.status === 'RESOLVED' ? 'Resolved' : 'Open'}
                                                    tone={t.status === 'RESOLVED' ? 'success' : 'warning'}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Right Column: Active Conversation */}
                    <Card>
                        <Card.Header
                            kicker={activeTicket.link ? `LINKED OBJECT: ${activeTicket.link}` : 'GENERAL INQUIRY'}
                            title={`${activeTicket.no} — ${activeTicket.subj}`}
                            action={
                                <StatusBadge
                                    status={activeTicket.status === 'RESOLVED' ? 'Resolved' : 'Open with Buyer'}
                                    tone={activeTicket.status === 'RESOLVED' ? 'success' : 'warning'}
                                />
                            }
                        />
                        <Card.Body>
                            {/* Messages History */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    paddingRight: '6px',
                                    marginBottom: '20px',
                                }}
                            >
                                {activeTicket.msgs.map((m, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            background: m.me ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card-subtle, #f8fafc)',
                                            border: m.me
                                                ? '1px solid rgba(59, 130, 246, 0.25)'
                                                : '1px solid var(--border-color, #e2e8f0)',
                                            marginLeft: m.me ? '32px' : '0',
                                            marginRight: m.me ? '0' : '32px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '11.5px',
                                                fontWeight: 600,
                                                color: m.me ? 'var(--color-primary, #1e3a8a)' : 'var(--text-secondary)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {m.who} · {m.role} · {m.when}
                                        </div>
                                        <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                            {m.body}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '16px' }}>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Write your response or clarification..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color, #cbd5e1)',
                                        fontSize: '13.5px',
                                        marginBottom: '10px',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => toast.info('File Attached', 'evidence-attachment.pdf attached to thread.')}
                                    >
                                        📎 Attach file
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleSendReply}>
                                        Send reply
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* New Ticket Modal */}
                <Modal
                    isOpen={newTicketModal}
                    onClose={() => setNewTicketModal(false)}
                    title="Open New Inquiry Ticket"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setNewTicketModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleCreateTicket}>
                                Open Ticket
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField label="Inquiry Subject" required>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Schedule line advancement request on PO 4500008812"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                            />
                        </FormField>

                        <FormField label="Linked Transaction Document" required helper="Attaches message to ERP audit history">
                            <select
                                className="form-control"
                                value={newLinkedObject}
                                onChange={(e) => setNewLinkedObject(e.target.value)}
                            >
                                <option>PO 4500008812 (Machined Shafts)</option>
                                <option>Receipt 5000041288 (Inspection Lot)</option>
                                <option>Invoice INV/26-27/0866 (Remittance)</option>
                                <option>General Master Data / Compliance</option>
                            </select>
                        </FormField>

                        <FormField label="Message Details" required>
                            <textarea
                                className="form-control"
                                rows={4}
                                placeholder="Describe your question, proposed amendment, or clarification..."
                                value={newFirstMessage}
                                onChange={(e) => setNewFirstMessage(e.target.value)}
                            />
                        </FormField>
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default Messages
