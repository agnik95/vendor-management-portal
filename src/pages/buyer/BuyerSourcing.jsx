import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import ProvenanceBadge from '../../components/common/ProvenanceBadge'
import Modal from '../../components/common/Modal'
import MetricCard from '../../components/common/MetricCard'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function BuyerSourcing() {
    const navigate = useNavigate()
    const toast = useToast()
    const { data, awardRFQAndCreatePO, createRFQ } = useVendorData()

    const [activeTab, setActiveTab] = useState('all')
    const [compareModal, setCompareModal] = useState({ open: false, rfq: null })
    const [newRfqModal, setNewRfqModal] = useState(false)
    const [newRfqForm, setNewRfqForm] = useState({
        desc: 'Direct Procurement - Consumable Refractory Materials',
        prNo: '1300056',
        purchOrg: 'MSPO',
        purchGroup: '840',
        deadline: '2026-10-15',
    })

    const rfqs = useMemo(() => data?.rfqs || [], [data?.rfqs])

    const openRfqs = useMemo(() => rfqs.filter((r) => r.quote === 'NONE' || r.quote === 'DRAFT'), [rfqs])
    const submittedRfqs = useMemo(() => rfqs.filter((r) => r.quote === 'SUBMITTED'), [rfqs])
    const awardedRfqs = useMemo(() => rfqs.filter((r) => r.quote === 'AWARDED'), [rfqs])

    const tabsList = [
        { id: 'all', label: 'All RFQs' },
        { id: 'submitted', label: 'Bids Received' },
        { id: 'open', label: 'Awaiting Bids' },
        { id: 'awarded', label: 'Awarded & PO Created' },
    ]

    const displayedRfqs = useMemo(() => {
        if (activeTab === 'submitted') return submittedRfqs
        if (activeTab === 'open') return openRfqs
        if (activeTab === 'awarded') return awardedRfqs
        return rfqs
    }, [activeTab, submittedRfqs, openRfqs, awardedRfqs, rfqs])

    const handleOpenCompare = (rfq) => {
        setCompareModal({ open: true, rfq })
    }

    const handleAward = (rfq, bidderName, quoteNo, price) => {
        const res = awardRFQAndCreatePO(rfq.no, bidderName, quoteNo, price)
        toast.success(
            `Quotation Awarded to ${bidderName}`,
            `Purchase Order ${res.poNo} automatically generated in S/4HANA. Supplier can now acknowledge in their portal.`
        )
        setCompareModal({ open: false, rfq: null })
        navigate('/buyer/stuck')
    }

    const handleCreateRFQ = () => {
        createRFQ({
            refPrNumber: newRfqForm.prNo,
            description: newRfqForm.desc,
            purchasingOrg: newRfqForm.purchOrg,
            purchasingGroup: newRfqForm.purchGroup,
            deadlineDate: newRfqForm.deadline,
        })
        toast.success(
            'Request for Quotation Published',
            'RFQ created adopting PR 1300056 and dispatched to invited vendors.'
        )
        setNewRfqModal(false)
    }

    const columns = [
        {
            key: 'no',
            header: 'RFQ Document',
            render: (row) => (
                <div>
                    <span className="font-mono font-bold text-blue-600">{row.no}</span>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.desc}</div>
                </div>
            ),
        },
        { key: 'issued', header: 'Issue Date', render: (row) => row.issued },
        {
            key: 'closes',
            header: 'Deadline',
            render: (row) => (
                <span className={row.urgent ? 'text-danger font-bold' : ''}>
                    {row.closes}
                    {row.urgent && ' (Urgent)'}
                </span>
            ),
        },
        { key: 'items', header: 'Items', align: 'right', render: (row) => `${row.items || (row.lines || []).length} Lines` },
        {
            key: 'status',
            header: 'Sourcing Status',
            render: (row) => {
                if (row.quote === 'AWARDED') return <StatusBadge status={`Awarded · PO ${row.awardedPo || ''}`} tone="success" />
                if (row.quote === 'SUBMITTED') return <StatusBadge status="Bids Received (Ready to Award)" tone="info" />
                if (row.quote === 'DRAFT') return <StatusBadge status="Vendor Drafting" tone="warning" />
                return <StatusBadge status="Awaiting Vendor Quotation" tone="neutral" />
            },
        },
        {
            key: 'action',
            header: 'Action',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenCompare(row)}
                        style={{ fontSize: '11px', padding: '5px 9px' }}
                    >
                        {row.quote === 'SUBMITTED' ? 'Compare & Award →' : 'View Bidders'}
                    </button>
                </div>
            ),
        },
    ]

    return (
        <AppLayout activePage="Sourcing & RFQs" portal="Buyer">
            <PageContainer
                kicker="STRATEGIC SOURCING & COMMERCIAL TENDERS"
                title="Requests for Quotation (RFQs)"
                subtitle="SAP S/4HANA Process Definition: Requisition Sourcing, Multi-Bidder Comparison & Automatic PO Creation."
                actions={
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="primary" size="sm" onClick={() => setNewRfqModal(true)}>
                            + Create New RFQ
                        </Button>
                    </div>
                }
            >
                {/* Metric Summary */}
                <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                    <MetricCard
                        label="Active RFQs"
                        value={rfqs.length}
                        sub="Consumable & Direct Materials"
                        tone="info"
                    />
                    <MetricCard
                        label="Bids Received"
                        value={submittedRfqs.length}
                        sub="Ready for Comparative Evaluation"
                        tone="info"
                    />
                    <MetricCard
                        label="Awaiting Supplier Quotes"
                        value={openRfqs.length}
                        sub="Tenders Open with Suppliers"
                        tone={openRfqs.length > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Awarded & Contracted"
                        value={awardedRfqs.length}
                        sub="S/4HANA Purchase Orders Created"
                        tone="success"
                    />
                </div>

                <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

                <Card style={{ marginTop: '16px' }}>
                    <Card.Header
                        title="Tenders & Sourcing Requests"
                        action={<ProvenanceBadge source="sap" label="API_RFQ_PROCESS_SRV" />}
                    />
                    <Card.Body flush>
                        <DataTable
                            columns={columns}
                            data={displayedRfqs}
                            keyField="no"
                            emptyTitle="No RFQs in this category"
                            emptyMessage="Create a new RFQ from an approved Purchase Requisition to begin sourcing."
                        />
                    </Card.Body>
                </Card>

                {/* Compare & Award Modal */}
                {compareModal.open && compareModal.rfq && (
                    <Modal
                        isOpen={compareModal.open}
                        onClose={() => setCompareModal({ open: false, rfq: null })}
                        title={`Compare Supplier Quotations · RFQ ${compareModal.rfq.no}`}
                        size="lg"
                        footer={
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '10px' }}>
                                <Button variant="secondary" size="sm" onClick={() => setCompareModal({ open: false, rfq: null })}>
                                    Close
                                </Button>
                            </div>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    background: '#F0F4F8',
                                    borderRadius: '6px',
                                    border: '1px solid #D2DFEB',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                }}
                            >
                                <strong style={{ color: '#1B6EC2', display: 'block', marginBottom: '2px' }}>
                                    App: Compare Supplier Quotations (S/4HANA Process 1.1.6)
                                </strong>
                                Evaluate supplier bids side-by-side. Awarding quantity automatically releases the comparative statement and writes the Purchase Order.
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                {/* Bidder 1: Precision Components / Jindal Steels (L1) */}
                                <div
                                    style={{
                                        border: '2px solid #17724A',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        background: '#F2F8F5',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '14px', color: '#14202B' }}>
                                                Precision Components
                                            </strong>
                                            <StatusBadge status="L1 Lowest" tone="success" />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#5A6B7B', marginBottom: '10px' }}>
                                            Quotation 8000000030 · ISO 9001:2015
                                        </div>

                                        <div style={{ borderTop: '1px solid #D6E8DE', paddingTop: '10px', fontSize: '12.5px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span>Graphite Block (100 KG):</span>
                                                <strong className="font-mono">₹412.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span>Borax Powder (200 KG):</span>
                                                <strong className="font-mono">₹412.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#17724A', fontWeight: 700, borderTop: '1px solid #D6E8DE', paddingTop: '6px' }}>
                                                <span>Total Commercial Bid:</span>
                                                <span className="font-mono">₹1,23,600.00</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#5A6B7B', marginTop: '6px' }}>
                                                Lead time: 14 days · Delivery terms: FCA
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        size="sm"
                                        style={{ marginTop: '16px' }}
                                        onClick={() => handleAward(compareModal.rfq, 'Precision Components', '8000000030', 412.00)}
                                    >
                                        Award 100% & Create PO →
                                    </Button>
                                </div>

                                {/* Bidder 2: Jindal Pipe Limited (L2) */}
                                <div
                                    style={{
                                        border: '1px solid #DEE3E8',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        background: '#FFFFFF',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '14px', color: '#14202B' }}>
                                                Jindal Pipe Limited
                                            </strong>
                                            <StatusBadge status="L2 Bidder" tone="neutral" />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#5A6B7B', marginBottom: '10px' }}>
                                            Quotation 8000000031 · IATF 16949
                                        </div>

                                        <div style={{ borderTop: '1px solid #EDF1F3', paddingTop: '10px', fontSize: '12.5px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span>Graphite Block (100 KG):</span>
                                                <strong className="font-mono">₹445.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span>Borax Powder (200 KG):</span>
                                                <strong className="font-mono">₹445.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #EDF1F3', paddingTop: '6px' }}>
                                                <span>Total Commercial Bid:</span>
                                                <span className="font-mono">₹1,33,500.00</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#5A6B7B', marginTop: '6px' }}>
                                                Lead time: 21 days · Delivery terms: FCA
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        style={{ marginTop: '16px' }}
                                        onClick={() => handleAward(compareModal.rfq, 'Jindal Pipe Limited', '8000000031', 445.00)}
                                    >
                                        Award & Create PO
                                    </Button>
                                </div>

                                {/* Bidder 3: Vibhor Steel Tubes (L3) */}
                                <div
                                    style={{
                                        border: '1px solid #DEE3E8',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        background: '#FFFFFF',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '14px', color: '#14202B' }}>
                                                Vibhor Steel Tubes
                                            </strong>
                                            <StatusBadge status="L3 Bidder" tone="neutral" />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#5A6B7B', marginBottom: '10px' }}>
                                            Quotation 8000000032 · Standard
                                        </div>

                                        <div style={{ borderTop: '1px solid #EDF1F3', paddingTop: '10px', fontSize: '12.5px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span>Graphite Block (100 KG):</span>
                                                <strong className="font-mono">₹480.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span>Borax Powder (200 KG):</span>
                                                <strong className="font-mono">₹480.00/KG</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #EDF1F3', paddingTop: '6px' }}>
                                                <span>Total Commercial Bid:</span>
                                                <span className="font-mono">₹1,44,000.00</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#5A6B7B', marginTop: '6px' }}>
                                                Lead time: 28 days · Delivery terms: Ex-Works
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        style={{ marginTop: '16px' }}
                                        onClick={() => handleAward(compareModal.rfq, 'Vibhor Steel Tubes', '8000000032', 480.00)}
                                    >
                                        Award & Create PO
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Create RFQ Modal */}
                {newRfqModal && (
                    <Modal
                        isOpen={newRfqModal}
                        onClose={() => setNewRfqModal(false)}
                        title="Create Request for Quotation (Process 1.1.3)"
                        size="md"
                        footer={
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                <Button variant="secondary" size="sm" onClick={() => setNewRfqModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleCreateRFQ}>
                                    Publish RFQ to S/4HANA →
                                </Button>
                            </div>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group">
                                <label className="form-label">Adopt from Purchase Requisition (PR)</label>
                                <input
                                    type="text"
                                    className="form-control font-mono"
                                    value={newRfqForm.prNo}
                                    onChange={(e) => setNewRfqForm({ ...newRfqForm, prNo: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tender Description</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newRfqForm.desc}
                                    onChange={(e) => setNewRfqForm({ ...newRfqForm, desc: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Purchasing Org</label>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={newRfqForm.purchOrg}
                                        onChange={(e) => setNewRfqForm({ ...newRfqForm, purchOrg: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Purchasing Group</label>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={newRfqForm.purchGroup}
                                        onChange={(e) => setNewRfqForm({ ...newRfqForm, purchGroup: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quotation Deadline Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={newRfqForm.deadline}
                                    onChange={(e) => setNewRfqForm({ ...newRfqForm, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </Modal>
                )}
            </PageContainer>
        </AppLayout>
    )
}

export default BuyerSourcing
