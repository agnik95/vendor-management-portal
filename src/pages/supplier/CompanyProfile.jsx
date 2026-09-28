import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useToast } from '../../context/useToast'
import { useVendorData } from '../../context/useVendorData'

function CompanyProfile() {
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('general')
    const [changeModalOpen, setChangeModalOpen] = useState(false)
    const [isBankChange, setIsBankChange] = useState(false)

    // Form modal state
    const [changeType, setChangeType] = useState('Registered Address')
    const [changeReason, setChangeReason] = useState('')
    const [newDetail, setNewDetail] = useState('')

    const { data } = useVendorData()
    const supplier = data?.supplier || {}
    const isRealData = !!supplier.company_info

    // Mock company data fallback
    const generalData = isRealData ? {
        bp: supplier.sap_bp_id || 'Pending',
        name: supplier.company_info.company_name,
        group: supplier.sap_defaults?.bp_grouping || 'SUPP — Domestic Standard Vendors',
        country: supplier.company_info.country,
        pan: supplier.tax_info?.pan,
        gstin: supplier.tax_info?.gstin,
        msme: supplier.tax_info?.msme_classification || 'Not Provided',
        blocked: supplier.status !== 'ACTIVE' && supplier.status !== 'SUBMITTED',
        status: supplier.approval_status || 'Submitted',
    } : {
        bp: '0017004521',
        name: 'Precision Components Pvt Ltd',
        group: 'SUPP — Domestic Standard Vendors',
        country: 'India · Karnataka',
        pan: 'AAFCP8812K',
        gstin: '29AAFCP8812K1ZT',
        msme: 'Medium Enterprise · UDYAM-KR-03-0019284',
        blocked: false,
        status: 'Active since 12 Mar 2021',
    }

    const addresses = isRealData ? [
        {
            type: 'Registered office',
            address: supplier.company_info.country || 'India',
            purpose: 'Statutory correspondence & legal notices',
        }
    ] : [
        {
            type: 'Registered office',
            address: '#118, SIDCO Industrial Estate, Hosur Road, Bengaluru 560068',
            purpose: 'Statutory correspondence & legal notices',
        },
        {
            type: 'Works / Factory',
            address: 'Plot 44, Peenya Phase II, Industrial Area, Bengaluru 560058',
            purpose: 'Manufacturing plant & dispatch dock',
        },
        {
            type: 'Remit-to',
            address: 'Same as registered corporate office',
            purpose: 'Payment remittances & bank reconciliations',
        },
    ]

    const contacts = isRealData ? (supplier.contacts || []).map(c => ({
        name: c.contact_name,
        title: c.designation,
        email: c.email,
        scope: c.function || 'General',
    })) : [
        {
            name: 'A. Deshpande',
            title: 'Managing Director & CEO',
            email: 'a.deshpande@precisioncomp.in',
            scope: 'Executive & Sourcing Agreements',
        },
        {
            name: 'R. K. Sharma',
            title: 'Head of Quality Assurance (QA)',
            email: 'sharma.rk@precisioncomp.in',
            scope: '8D NCRs & IATF 16949 Audits',
        },
        {
            name: 'V. S. Murthy',
            title: 'Finance & Accounts Controller',
            email: 'accounts@precisioncomp.in',
            scope: 'Invoicing, GST Returns & Banking',
        },
    ]

    const bankingData = isRealData ? {
        bank: supplier.bank_info?.bank_country || 'Not Provided',
        account: supplier.bank_info?.account_number ? '••••' + supplier.bank_info.account_number.slice(-4) : 'Not Provided',
        ifsc: supplier.bank_info?.ifsc_code || 'Not Provided',
    } : {
        bank: 'HDFC Bank, Peenya Branch',
        account: '••••••4471',
        ifsc: 'ICIC0000021',
    }

    const [changeRequests, setChangeRequests] = useState([
        {
            type: 'Bank account update',
            when: '14 May 2026',
            status: 'POSTED',
            detail: 'Changed IFSC to ICIC0000021 · Dual approved & penny-drop verified',
        },
        {
            type: 'Dispatch address addition',
            when: '02 Feb 2026',
            status: 'POSTED',
            detail: 'Added Peenya Plant 2 dock as valid shipping origin',
        },
    ])

    const handleOpenModal = (isBank = false) => {
        setIsBankChange(isBank)
        setChangeType(isBank ? 'Bank Account Details' : 'Corporate Address')
        setNewDetail('')
        setChangeReason('')
        setChangeModalOpen(true)
    }

    const handleSubmitChange = () => {
        if (!newDetail.trim() || !changeReason.trim()) {
            toast.error('Fields required', 'Please provide proposed details and justification.')
            return
        }

        const newReq = {
            type: changeType,
            when: 'Today',
            status: 'PENDING',
            detail: `${newDetail} · Reason: ${changeReason}`,
        }

        setChangeRequests([newReq, ...changeRequests])
        setChangeModalOpen(false)

        if (isBankChange) {
            toast.warning(
                'Hardened Bank Change Workflow Initiated',
                'Requires dual sign-off from AP & Financial Controller plus ₹1 automated penny-drop validation.'
            )
        } else {
            toast.success(
                'Change request logged',
                'Your request has been forwarded to the Category Buyer for ERP master data update.'
            )
        }
    }

    const tabsList = [
        { id: 'general', label: 'General' },
        { id: 'addresses', label: 'Addresses' },
        { id: 'contacts', label: 'Contacts' },
        { id: 'banking', label: 'Banking' },
        { id: 'purchasing', label: 'Purchasing terms' },
        { id: 'changes', label: 'Change requests' },
    ]

    return (
        <AppLayout activePage="Company profile" portal="Supplier">
            <PageContainer
                kicker="MASTER DATA MANAGEMENT"
                title="Company Profile"
                subtitle="Authoritative supplier master record mirrored live from the buyer's SAP S/4HANA ERP instance."
                actions={
                    <Button variant="primary" size="sm" onClick={() => handleOpenModal(false)}>
                        Request a change
                    </Button>
                }
            >
                {/* Profile Tabs */}
                <Card>
                    <Card.Header
                        title="Master Data Dossier"
                        action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                    />
                    <Card.Body>
                        {/* TAB 0: GENERAL */}
                        {activeTab === 'general' && (
                            <div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '20px',
                                        padding: '16px',
                                        background: 'var(--bg-card-subtle, #f8fafc)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #e2e8f0)',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Business Partner (BP)
                                        </span>
                                        <div className="font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary, #1e3a8a)' }}>
                                            {generalData.bp}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Legal Entity Name
                                        </span>
                                        <div style={{ fontWeight: 600 }}>{generalData.name}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Account Group
                                        </span>
                                        <div style={{ fontWeight: 600 }}>{generalData.group}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Jurisdiction
                                        </span>
                                        <div style={{ fontWeight: 600 }}>{generalData.country}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Corporate PAN
                                        </span>
                                        <div className="font-mono" style={{ fontWeight: 600 }}>
                                            {generalData.pan}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Principal GSTIN
                                        </span>
                                        <div className="font-mono" style={{ fontWeight: 600 }}>
                                            {generalData.gstin}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            MSME Category
                                        </span>
                                        <div style={{ fontWeight: 600 }}>{generalData.msme}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Purchasing Block
                                        </span>
                                        <div>
                                            <StatusBadge
                                                status={generalData.blocked ? 'Blocked' : 'Unrestricted'}
                                                tone={generalData.blocked ? 'danger' : 'success'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 1: ADDRESSES */}
                        {activeTab === 'addresses' && (
                            <DataTable
                                columns={[
                                    {
                                        key: 'type',
                                        header: 'Address Type',
                                        render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
                                    },
                                    { key: 'address', header: 'Physical Address', render: (row) => row.address },
                                    { key: 'purpose', header: 'ERP Function', render: (row) => row.purpose },
                                ]}
                                data={addresses}
                            />
                        )}

                        {/* TAB 2: CONTACTS */}
                        {activeTab === 'contacts' && (
                            <DataTable
                                columns={[
                                    {
                                        key: 'name',
                                        header: 'Contact Person',
                                        render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
                                    },
                                    { key: 'title', header: 'Designation', render: (row) => row.title },
                                    { key: 'email', header: 'Email Address', render: (row) => row.email },
                                    { key: 'scope', header: 'Portal Responsibilities', render: (row) => row.scope },
                                ]}
                                data={contacts}
                            />
                        )}

                        {/* TAB 3: BANKING */}
                        {activeTab === 'banking' && (
                            <div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '20px',
                                        padding: '16px',
                                        background: 'var(--bg-card-subtle, #f8fafc)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color, #e2e8f0)',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Banking Institution
                                        </span>
                                        <div style={{ fontWeight: 600, marginTop: '2px' }}>{bankingData.bank}</div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Disbursement Account Number
                                        </span>
                                        <div className="font-mono" style={{ fontWeight: 600, marginTop: '2px' }}>
                                            {bankingData.account}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            IFSC Routing Code
                                        </span>
                                        <div className="font-mono" style={{ fontWeight: 600, marginTop: '2px' }}>
                                            {bankingData.ifsc}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            NPCI Penny-Drop Verification
                                        </span>
                                        <div style={{ marginTop: '2px' }}>
                                            <StatusBadge status="Verified · Name Matched" tone="success" />
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        padding: '16px 20px',
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        lineHeight: 1.6,
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                    }}
                                >
                                    <div>
                                        <strong>Hardened Banking Security Protocol:</strong> Bank changes require independent
                                        dual sign-off from Accounts Payable and Financial Controller, an automated ₹1 penny-drop
                                        confirmation, and instant security notification to your existing registered contact.
                                    </div>
                                    <Button variant="danger" size="sm" onClick={() => handleOpenModal(true)}>
                                        Request Bank Change
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: PURCHASING TERMS */}
                        {activeTab === 'purchasing' && (
                            <DataTable
                                columns={[
                                    {
                                        key: 'org',
                                        header: 'Purchasing Org',
                                        render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
                                    },
                                    { key: 'curr', header: 'Currency', render: (row) => row.curr },
                                    { key: 'inco', header: 'Incoterms', render: (row) => row.inco },
                                    { key: 'pay', header: 'Payment Terms', render: (row) => row.pay },
                                    { key: 'ctrl', header: 'Confirmation Control', render: (row) => row.ctrl },
                                    { key: 'iv', header: 'GR-Based IV', render: (row) => row.iv },
                                ]}
                                data={[
                                    {
                                        org: '1010 — Domestic Operations',
                                        curr: 'INR',
                                        inco: 'FCA Bengaluru',
                                        pay: 'ZN45 — 45 Days Net',
                                        ctrl: '0004 — Inbound Delivery Required',
                                        iv: 'Yes (Active)',
                                    },
                                    {
                                        org: '1020 — Domestic South Division',
                                        curr: 'INR',
                                        inco: 'FCA Bengaluru',
                                        pay: 'ZN60 — 60 Days Net',
                                        ctrl: '0004 — Inbound Delivery Required',
                                        iv: 'Yes (Active)',
                                    },
                                ]}
                            />
                        )}

                        {/* TAB 5: CHANGE REQUESTS */}
                        {activeTab === 'changes' && (
                            <DataTable
                                columns={[
                                    {
                                        key: 'type',
                                        header: 'Change Type',
                                        render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
                                    },
                                    { key: 'when', header: 'Date Submitted', render: (row) => row.when },
                                    {
                                        key: 'status',
                                        header: 'ERP Status',
                                        render: (row) => (
                                            <StatusBadge
                                                status={row.status === 'POSTED' ? 'Posted to S/4HANA' : 'Awaiting Approval'}
                                                tone={row.status === 'POSTED' ? 'success' : 'warning'}
                                            />
                                        ),
                                    },
                                    { key: 'detail', header: 'Audit Detail', render: (row) => row.detail },
                                ]}
                                data={changeRequests}
                                emptyMessage="No open change requests."
                            />
                        )}
                    </Card.Body>
                </Card>

                {/* Architecture Policy Alert */}
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
                    <strong>Architectural Mandate:</strong> The vendor portal never acts as a permanent secondary repository for
                    supplier master data. It reads Business Partner attributes on demand from SAP S/4HANA via{' '}
                    <code>API_BUSINESS_PARTNER</code> with a 15-minute operational cache. Any requested modifications undergo
                    structured dual workflow before directly patching the ERP core.
                </div>

                {/* Change Request Modal */}
                <Modal
                    isOpen={changeModalOpen}
                    onClose={() => setChangeModalOpen(false)}
                    title={isBankChange ? 'Request Bank Master Change' : 'Submit Master Data Change Request'}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setChangeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSubmitChange}>
                                Submit for approval
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField label="Type of Change" required>
                            <input type="text" className="form-control" value={changeType} readOnly disabled />
                        </FormField>

                        <FormField
                            label={isBankChange ? 'New Bank Name, IFSC & Account Number' : 'Proposed Master Data Details'}
                            required
                        >
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder={
                                    isBankChange
                                        ? 'e.g. Axis Bank, Peenya | IFSC: UTIB0000412 | Account: 924020014881023'
                                        : 'Describe the new corporate address, contact details, or tax registration.'
                                }
                                value={newDetail}
                                onChange={(e) => setNewDetail(e.target.value)}
                            />
                        </FormField>

                        <FormField label="Business Justification" required>
                            <textarea
                                className="form-control"
                                rows={2}
                                placeholder="Explain why this change is required (e.g. branch relocation, board resolution)."
                                value={changeReason}
                                onChange={(e) => setChangeReason(e.target.value)}
                            />
                        </FormField>

                        {isBankChange && (
                            <div
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    fontSize: '12px',
                                    color: 'var(--color-danger, #991b1b)',
                                }}
                            >
                                ⚠️ Bank changes cannot be approved by a single individual. An automated fraud notification will be
                                emailed to your primary registered email address.
                            </div>
                        )}
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default CompanyProfile
