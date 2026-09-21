import { useState, useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import MetricCard from '../../components/common/MetricCard'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import Tabs from '../../components/common/Tabs'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import NewSupplierModal from '../../components/modals/NewSupplierModal'
import { useToast } from '../../components/common/useToast'
import { useVendorData } from '../../context/useVendorData'

function Suppliers() {
    const toast = useToast()
    const { suppliers, updateSupplier, deleteSupplier } = useVendorData()

    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [selectedSupplierId, setSelectedSupplierId] = useState(null)
    const [isExporting, setIsExporting] = useState(false)
    const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)

    // Find the currently selected supplier from live state
    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId)

    // Calculate tab counts dynamically from live suppliers state
    const tabCounts = useMemo(() => {
        return {
            all: suppliers.length,
            active: suppliers.filter((s) => s.status === 'Active').length,
            review: suppliers.filter((s) => s.status === 'Review required').length,
            onboarding: suppliers.filter((s) => s.status === 'Onboarding').length,
        }
    }, [suppliers])

    const tabs = [
        { id: 'all', label: 'All Suppliers' },
        { id: 'active', label: 'Active Partners' },
        { id: 'review', label: 'Review Required' },
        { id: 'onboarding', label: 'Onboarding' },
    ]

    // Filter suppliers by tab and search query
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.id.includes(searchQuery) ||
                supplier.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.state.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesSearch) return false

            if (activeTab === 'active') return supplier.status === 'Active'
            if (activeTab === 'review') return supplier.status === 'Review required'
            if (activeTab === 'onboarding') return supplier.status === 'Onboarding'
            return true
        })
    }, [suppliers, searchQuery, activeTab])

    const handleExport = () => {
        setIsExporting(true)
        setTimeout(() => {
            setIsExporting(false)
            toast.success(`Exported ${filteredSuppliers.length} supplier records to CSV`)
        }, 600)
    }

    // Interactive Action: Trigger Penny Drop Bank Verification
    const handleVerifyBank = () => {
        if (!selectedSupplier) return
        updateSupplier(selectedSupplier.id, {
            bankDetails: {
                ...selectedSupplier.bankDetails,
                pennyDropStatus: 'Verified',
                dualApproved: true,
            },
        })
        toast.success(`Penny-Drop verified & dual sign-off approved for ${selectedSupplier.name}`)
    }

    // Interactive Action: Toggle Supplier Status
    const handleToggleStatus = () => {
        if (!selectedSupplier) return
        const nextStatus = selectedSupplier.status === 'Active' ? 'Review required' : 'Active'
        const nextTone = nextStatus === 'Active' ? 'success' : 'warning'
        updateSupplier(selectedSupplier.id, {
            status: nextStatus,
            tone: nextTone,
        })
        toast.info(`Status updated to "${nextStatus}" for ${selectedSupplier.name}`)
    }

    // Interactive Action: Delete / Archive Supplier
    const handleDeleteSupplier = () => {
        if (!selectedSupplier) return
        const name = selectedSupplier.name
        deleteSupplier(selectedSupplier.id)
        setSelectedSupplierId(null)
        toast.warning(`Supplier ${name} removed from directory`)
    }

    // Column definitions for DataTable
    const columns = [
        {
            key: 'id',
            label: 'BP Code',
            sortable: true,
            width: '120px',
            render: (value) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 650, color: 'var(--blue)' }}>
                    {value}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Supplier Name',
            sortable: true,
            render: (value, row) => (
                <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text)' }}>
                        {value}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {row.tradeName} · {row.city}, {row.state}
                    </span>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            sortable: true,
            width: '190px',
            render: (value) => (
                <span style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>
                    {value}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            width: '150px',
            render: (value, row) => (
                <StatusBadge label={value} tone={row.tone} />
            ),
        },
        {
            key: 'qualityScore',
            label: 'Quality',
            sortable: true,
            width: '110px',
            align: 'center',
            render: (value) => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span
                        style={{
                            fontWeight: 750,
                            color: value >= 90 ? 'var(--success)' : value >= 80 ? 'var(--warning)' : 'var(--danger)',
                        }}
                    >
                        {value}%
                    </span>
                </div>
            ),
        },
        {
            key: 'openPOs',
            label: 'Active POs',
            sortable: true,
            width: '100px',
            align: 'center',
            render: (value) => (
                <span style={{ fontWeight: 650, color: value > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                    {value}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            width: '110px',
            align: 'right',
            render: (_, row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSupplierId(row.id)
                    }}
                >
                    View 360 →
                </Button>
            ),
        },
    ]

    return (
        <AppLayout activePage="Suppliers" portal="Buyer">
            <PageContainer
                kicker="Supplier Management"
                title="Suppliers"
                description="Supplier 360: View, evaluate, and manage your active vendor portfolio backed by SAP S/4HANA."
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            isLoading={isExporting}
                        >
                            Export CSV
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setIsNewSupplierModalOpen(true)}
                        >
                            + New Supplier
                        </Button>
                    </>
                }
            >
                {/* Dynamically bound Metric Summary Cards */}
                <div className="metric-grid">
                    <MetricCard
                        label="Total suppliers"
                        value={String(tabCounts.all).padStart(2, '0')}
                        detail="Registered in SAP Business Partner"
                        tone="info"
                    />
                    <MetricCard
                        label="Active & compliant"
                        value={String(tabCounts.active).padStart(2, '0')}
                        detail="Approved for purchase orders"
                        tone="success"
                    />
                    <MetricCard
                        label="Review required"
                        value={String(tabCounts.review).padStart(2, '0')}
                        detail="Audits & certificates pending"
                        tone="warning"
                    />
                    <MetricCard
                        label="Onboarding"
                        value={String(tabCounts.onboarding).padStart(2, '0')}
                        detail="Stage 1 verification"
                        tone="danger"
                    />
                </div>

                {/* Main Card with Tabs, Search, and DataTable */}
                <div className="card">
                    <div style={{ padding: '20px 22px 0' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '14px',
                            }}
                        >
                            <Tabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onChange={setActiveTab}
                            />

                            <div style={{ marginBottom: '20px', minWidth: '260px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by name, BP code, city..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredSuppliers}
                        keyField="id"
                        onRowClick={(row) => setSelectedSupplierId(row.id)}
                        pageSize={8}
                        emptyState="No suppliers match the current search or tab criteria."
                    />
                </div>
            </PageContainer>

            {/* Interactive Supplier 360 Modal */}
            <Modal
                isOpen={!!selectedSupplier}
                onClose={() => setSelectedSupplierId(null)}
                title={selectedSupplier ? `Supplier 360 · ${selectedSupplier.name}` : ''}
                size="lg"
                footer={
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDeleteSupplier}
                        >
                            Archive / Delete
                        </Button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleToggleStatus}
                            >
                                Toggle: {selectedSupplier?.status === 'Active' ? 'Mark Review Required' : 'Mark Active'}
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedSupplierId(null)}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                }
            >
                {selectedSupplier && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Overview Banner */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                padding: '16px 18px',
                                background: 'var(--surface-soft)',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div>
                                <span className="card-kicker">SAP Business Partner</span>
                                <h4 style={{ margin: '2px 0 6px', fontSize: '18px', color: 'var(--text)' }}>
                                    {selectedSupplier.name}
                                </h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-soft)' }}>
                                    Trade: <strong>{selectedSupplier.tradeName}</strong> · BP Code:{' '}
                                    <strong style={{ fontFamily: 'monospace', color: 'var(--blue)' }}>
                                        {selectedSupplier.id}
                                    </strong>
                                </p>
                            </div>

                            <StatusBadge
                                label={selectedSupplier.status}
                                tone={selectedSupplier.tone}
                            />
                        </div>

                        {/* Grid: Tax & Contact + Bank Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="card" style={{ padding: '16px' }}>
                                <span className="card-kicker">Tax & Identity</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>GSTIN: </span>
                                        <strong style={{ fontFamily: 'monospace' }}>{selectedSupplier.gstin || 'Not Provided'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>PAN: </span>
                                        <strong style={{ fontFamily: 'monospace' }}>{selectedSupplier.pan || 'Not Provided'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                                        <strong>{selectedSupplier.city}, {selectedSupplier.state}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Primary Contact: </span>
                                        <strong>{selectedSupplier.contactPerson}</strong> ({selectedSupplier.email})
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="card-kicker">Banking & Dual Approval</span>
                                    {selectedSupplier.bankDetails?.pennyDropStatus !== 'Verified' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleVerifyBank}
                                        >
                                            Trigger Penny Drop ⚡
                                        </Button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Bank Name: </span>
                                        <strong>{selectedSupplier.bankDetails?.bankName}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Account No: </span>
                                        <strong style={{ fontFamily: 'monospace' }}>{selectedSupplier.bankDetails?.accountMasked}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Penny Drop: </span>
                                        <StatusBadge
                                            label={selectedSupplier.bankDetails?.pennyDropStatus || 'Pending'}
                                            tone={selectedSupplier.bankDetails?.pennyDropStatus === 'Verified' ? 'success' : 'warning'}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Dual Sign-off: </span>
                                        <strong style={{ color: selectedSupplier.bankDetails?.dualApproved ? 'var(--success)' : 'var(--warning)' }}>
                                            {selectedSupplier.bankDetails?.dualApproved ? 'Dual Approved (Finance + Procurement)' : 'Pending Dual Sign-off'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance & Quality Metrics */}
                        <div className="card" style={{ padding: '16px' }}>
                            <span className="card-kicker">Performance & Quality Telemetry</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px', textAlign: 'center' }}>
                                <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Quality Score</span>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                                        {selectedSupplier.qualityScore}%
                                    </div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Delivery SLA</span>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue)', marginTop: '4px' }}>
                                        {selectedSupplier.deliveryScore}%
                                    </div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>YTD Spend</span>
                                    <div style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text)', marginTop: '4px' }}>
                                        {selectedSupplier.spendYTD}
                                    </div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Open 8D Cases</span>
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: selectedSupplier.open8DCases > 0 ? 'var(--danger)' : 'var(--success)',
                                            marginTop: '4px',
                                        }}
                                    >
                                        {selectedSupplier.open8DCases}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certificates & Verification */}
                        <div className="card" style={{ padding: '16px' }}>
                            <span className="card-kicker">Registered Certificates</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {selectedSupplier.certificates?.map((cert) => (
                                    <div
                                        key={cert.type}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: 'var(--surface-soft)',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <div>
                                            <strong>{cert.type}</strong>
                                            <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                                Issuer: {cert.issuer} · Expires: {cert.expiry}
                                            </span>
                                        </div>
                                        <StatusBadge
                                            label={cert.status}
                                            tone={cert.status === 'Valid' ? 'success' : 'warning'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Onboard New Supplier Modal Form */}
            <NewSupplierModal
                isOpen={isNewSupplierModalOpen}
                onClose={() => setIsNewSupplierModalOpen(false)}
            />
        </AppLayout>
    )
}

export default Suppliers