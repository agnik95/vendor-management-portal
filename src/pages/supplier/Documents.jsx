import { useState, useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import MetricCard from '../../components/common/MetricCard'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function Documents() {
    const { data } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('all')
    const [docsList, setDocsList] = useState(data.docs || [])
    const [uploadModal, setUploadModal] = useState({ open: false, docType: '', ref: '', validTo: '' })

    // Categories
    const validDocs = useMemo(() => docsList.filter((d) => d.status === 'VERIFIED'), [docsList])
    const expiringOrExpired = useMemo(
        () => docsList.filter((d) => d.status === 'EXPIRED' || (d.days !== null && d.days <= 60)),
        [docsList]
    )
    const missingDocs = useMemo(() => docsList.filter((d) => d.status === 'MISSING'), [docsList])

    const complianceScore = Math.round((validDocs.length / Math.max(1, docsList.length)) * 100)

    const displayDocs = useMemo(() => {
        switch (activeTab) {
            case 'valid':
                return validDocs
            case 'expiring':
                return expiringOrExpired
            case 'missing':
                return missingDocs
            case 'all':
            default:
                return docsList
        }
    }, [activeTab, validDocs, expiringOrExpired, missingDocs, docsList])

    const tabsList = [
        { id: 'all', label: 'All Documents' },
        { id: 'valid', label: 'Valid' },
        { id: 'expiring', label: 'Expiring or Expired' },
        { id: 'missing', label: 'Missing' },
    ]

    const handleOpenUpload = (docType = '') => {
        setUploadModal({
            open: true,
            docType: docType || 'ISO 9001:2015 Quality Certificate',
            ref: '',
            validTo: '31 Dec 2027',
        })
    }

    const handleConfirmUpload = () => {
        if (!uploadModal.docType.trim()) {
            toast.error('Document type required', 'Please select or name the certificate type.')
            return
        }

        setDocsList((prev) => {
            const existingIdx = prev.findIndex((d) => d.type === uploadModal.docType)
            const updated = {
                type: uploadModal.docType,
                ref: uploadModal.ref || 'CERT-2026-X99',
                issued: '10 Aug 2026',
                valid: uploadModal.validTo || '31 Dec 2027',
                by: 'Pending review',
                status: 'PENDING',
                days: 500,
            }
            if (existingIdx >= 0) {
                const next = [...prev]
                next[existingIdx] = updated
                return next
            }
            return [updated, ...prev]
        })

        toast.success(
            'Document uploaded for buyer review',
            'Pre-signed upload complete. Verified SHA-256 stored. Supplier Quality Engineer will audit and approve.'
        )
        setUploadModal({ open: false, docType: '', ref: '', validTo: '' })
    }

    const handleViewDoc = (doc) => {
        toast.info(
            `Viewing ${doc.type}`,
            'Generated temporary AWS S3 / Azure Blob pre-signed URL valid for 5 minutes.'
        )
    }

    const tableColumns = [
        {
            key: 'type',
            header: 'Compliance Document',
            render: (row) => <span style={{ fontWeight: 600 }}>{row.type}</span>,
        },
        {
            key: 'ref',
            header: 'Reference No.',
            render: (row) => (row.ref ? <span className="font-mono text-xs">{row.ref}</span> : <span className="text-muted">—</span>),
        },
        { key: 'issued', header: 'Issued On', render: (row) => row.issued || '—' },
        { key: 'valid', header: 'Valid Until', render: (row) => row.valid || '—' },
        { key: 'by', header: 'Verified By', render: (row) => row.by || 'Pending review' },
        {
            key: 'status',
            header: 'Status',
            render: (row) => {
                if (row.status === 'MISSING') return <StatusBadge status="Not uploaded" tone="neutral" />
                if (row.status === 'EXPIRED') return <StatusBadge status="Expired" tone="danger" />
                if (row.status === 'PENDING') return <StatusBadge status="In review" tone="info" />
                if (row.days !== null && row.days <= 60) {
                    return <StatusBadge status={`Expires in ${row.days} d`} tone="warning" />
                }
                return <StatusBadge status="Valid" tone="success" />
            },
        },
        {
            key: 'actions',
            header: 'Action',
            align: 'right',
            render: (row) => {
                if (row.status === 'MISSING' || row.status === 'EXPIRED') {
                    return (
                        <Button size="sm" variant="primary" onClick={() => handleOpenUpload(row.type)}>
                            Upload
                        </Button>
                    )
                }
                if (row.days !== null && row.days <= 60) {
                    return (
                        <Button size="sm" variant="primary" onClick={() => handleOpenUpload(row.type)}>
                            Replace
                        </Button>
                    )
                }
                return (
                    <Button size="sm" variant="secondary" onClick={() => handleViewDoc(row)}>
                        View
                    </Button>
                )
            },
        },
    ]

    return (
        <AppLayout activePage="Documents" portal="Supplier">
            <PageContainer
                kicker="STATUTORY & QUALITY ASSURANCE COMPLIANCE"
                title="Documents & compliance"
                subtitle="Mandatory regulatory certificates, quality registrations, and insurance coverages required for active purchasing."
                actions={
                    <Button variant="primary" size="sm" onClick={() => handleOpenUpload('')}>
                        + Upload a document
                    </Button>
                }
            >
                {/* 4 Metric Cards */}
                <div className="metrics-grid">
                    <MetricCard
                        label="Mandatory documents"
                        value={`${validDocs.length} of ${docsList.length}`}
                        sub={`${missingDocs.length} certificates missing`}
                        tone={missingDocs.length > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Expiring in 60 days"
                        value={expiringOrExpired.filter((d) => d.status !== 'EXPIRED').length}
                        sub="Upload renewal before deadline"
                        tone={expiringOrExpired.length > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Expired certificates"
                        value={docsList.filter((d) => d.status === 'EXPIRED').length}
                        sub="Immediate purchasing block risk"
                        tone={docsList.filter((d) => d.status === 'EXPIRED').length > 0 ? 'danger' : 'success'}
                    />
                    <MetricCard
                        label="Document compliance score"
                        value={`${complianceScore}%`}
                        sub={complianceScore >= 85 ? 'Meets 85% requirement' : 'Below 85% threshold'}
                        tone={complianceScore >= 85 ? 'success' : 'danger'}
                    />
                </div>

                {/* Main Documents Table */}
                <Card>
                    <Card.Header
                        title="Document Register"
                        action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={tableColumns}
                            data={displayDocs}
                            emptyMessage="No documents found for this filter."
                        />
                    </Card.Body>
                </Card>

                {/* Reminder Schedule & Policy Split */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '24px',
                        marginTop: '24px',
                    }}
                >
                    <Card>
                        <Card.Header title="Automated reminder schedule" kicker="NOTIFICATION POLICY" />
                        <Card.Body style={{ padding: 0 }}>
                            <DataTable
                                columns={[
                                    { key: 'trigger', header: 'Trigger Interval', render: (r) => <span style={{ fontWeight: 600 }}>{r.trigger}</span> },
                                    { key: 'channel', header: 'Channel', render: (r) => r.channel },
                                    { key: 'recipient', header: 'Escalation Target', render: (r) => r.recipient },
                                ]}
                                data={[
                                    { trigger: '90 days before expiry', channel: 'Automated Email', recipient: 'Supplier primary contact' },
                                    { trigger: '30 days before expiry', channel: 'Email + Portal Alert', recipient: 'Supplier + Category Buyer' },
                                    { trigger: 'On expiration date', channel: 'Email + Block Proposal', recipient: 'Supplier + SQA Lead' },
                                    { trigger: '7 days post-expiry', channel: 'Executive Escalation', recipient: 'Head of Procurement' },
                                ]}
                            />
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header title="Compliance Governance Rules" kicker="AUDIT INTEGRITY" />
                        <Card.Body>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <p>
                                    <strong>No Autonomous Production Shutdowns:</strong> When a mandatory document expires, the
                                    portal issues a formal purchasing block proposal with open order exposure analysis. Automated
                                    algorithms never unilaterally freeze ERP supplier orders at 2:00 AM.
                                </p>
                                <p style={{ marginTop: '12px' }}>
                                    <strong>Superseded File Retention:</strong> Uploading a renewal does not delete earlier records.
                                    The prior certificate is archived to maintain historical compliance records for any past shipment.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Upload Modal */}
                <Modal
                    isOpen={uploadModal.open}
                    onClose={() => setUploadModal({ open: false, docType: '', ref: '', validTo: '' })}
                    title={`Upload Compliance Document · ${uploadModal.docType || 'New'}`}
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setUploadModal({ open: false, docType: '', ref: '', validTo: '' })}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirmUpload}>
                                Submit for verification
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormField label="Document / Certificate Type" required>
                            <input
                                type="text"
                                className="form-control"
                                value={uploadModal.docType}
                                onChange={(e) => setUploadModal({ ...uploadModal, docType: e.target.value })}
                            />
                        </FormField>

                        <FormField label="Certificate / License Reference Number" required>
                            <input
                                type="text"
                                className="form-control font-mono"
                                placeholder="e.g. ISO-9001-2026-KA-4412"
                                value={uploadModal.ref}
                                onChange={(e) => setUploadModal({ ...uploadModal, ref: e.target.value })}
                            />
                        </FormField>

                        <FormField label="Expiry Date / Valid Until" required>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. 30 Jun 2027"
                                value={uploadModal.validTo}
                                onChange={(e) => setUploadModal({ ...uploadModal, validTo: e.target.value })}
                            />
                        </FormField>

                        <div
                            style={{
                                border: '2px dashed var(--border-color, #cbd5e1)',
                                borderRadius: '8px',
                                padding: '24px',
                                textAlign: 'center',
                                background: 'var(--bg-card-subtle, #f8fafc)',
                                cursor: 'pointer',
                            }}
                            onClick={() => toast.info('File chosen', 'Selected: renewal-certificate.pdf (1.4 MB)')}
                        >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Click to select PDF or image scan</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Scanned at minimum 300 DPI · Maximum 15 MB · SHA-256 verified
                            </div>
                        </div>
                    </div>
                </Modal>
            </PageContainer>
        </AppLayout>
    )
}

export default Documents
