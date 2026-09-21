import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'

const SAP_RESPONSIBILITIES = [
    'Purchase orders and requisitions',
    'Requests for quotation and quotations',
    'Scheduling agreements and schedule lines',
    'Goods receipts and inbound deliveries',
    'Supplier invoices, invoice matching & 3-way blocks',
    'Payment runs and remittance advice generation',
    'Business Partner master data and corporate bank accounts',
    'Quality notifications, defect types & inspection lots',
    'Returns to vendor, credit memos & debit notes',
    'Spend analysis, price variance & contract analytics',
    'Purchasing info records & source lists',
    'Internal buyer roles and authorization profiles',
]

const PORTAL_RESPONSIBILITIES = [
    'Supplier self-registration before any SAP BP exists',
    'GSTIN checksum, MSME Udyam & penny-drop verification on prospects',
    'Automated duplicate PAN/GSTIN screening across active registrations',
    'Multi-tier onboarding approval chain (Category Buyer → SQE → Finance → Head)',
    'Supplier-initiated bank and address changes with dual sign-off',
    'Mandatory certificate register with automated expiry escalation',
    'Purchasing block proposals with exposure analysis (single-source check)',
    'Structured 8D non-conformance workflow with sequential gate locks',
    'Responsiveness and compliance metric scoring (35% of scorecard)',
    'Contextual communication threads attached directly to PO/GR/Invoice lines',
    'External supplier user administration with 0 SAP named user licences',
    'Audit mirror showing exactly what the supplier transmitted',
]

const OVERLAP_MATRIX = [
    {
        area: 'Supplier Request & Onboarding',
        sap: 'Internal user can submit a Business Partner request workflow',
        portal: 'External vendor self-service, mandatory tax verification & compliance audit before ERP creation',
        decision: 'Build on Portal',
        decisionTone: 'info',
    },
    {
        area: 'Supplier Evaluation',
        sap: 'Standard questionnaire evaluation and quality PPM scoring',
        portal: 'Captures acknowledgement speed, certificate currency, and 8D SLAs — forming 35% of score',
        decision: 'Extend in Portal',
        decisionTone: 'purple',
    },
    {
        area: 'Order Confirmation',
        sap: 'Maintains confirmation category and schedule line changes on PO items',
        portal: 'Vendor-facing interface for instant line acknowledgement, splits, and delivery date proposals',
        decision: 'Entry Point Only',
        decisionTone: 'neutral',
    },
    {
        area: 'Quality Notification (8D)',
        sap: 'Captures defect code, material disposition, return PO, and financial debit note',
        portal: 'Manages collaborative 8D investigation, root-cause validation, and evidence exchange',
        decision: 'Build on Portal',
        decisionTone: 'info',
    },
    {
        area: 'Integration Message Monitoring',
        sap: 'SAP Integration Suite logs raw technical payload errors and XML payloads',
        portal: 'Translates technical errors to plain English with business references and Fix & Retry queues',
        decision: 'Extend in Portal',
        decisionTone: 'purple',
    },
    {
        area: 'Document Attachments',
        sap: 'Generic Object Services (GOS) attaches unstructured files to BP master',
        portal: 'Configures mandatory document types, validity tracking, automated expiry warnings & review status',
        decision: 'Build on Portal',
        decisionTone: 'info',
    },
]

function SapOrPortal() {
    const tableColumns = [
        {
            key: 'area',
            header: 'Business Process Area',
            render: (row) => <span style={{ fontWeight: 600 }}>{row.area}</span>,
        },
        {
            key: 'sap',
            header: 'What SAP S/4HANA Already Delivers',
            render: (row) => row.sap,
        },
        {
            key: 'portal',
            header: 'What the Portal Uniquely Contributes',
            render: (row) => row.portal,
        },
        {
            key: 'decision',
            header: 'Architectural Mandate',
            render: (row) => <StatusBadge status={row.decision} tone={row.decisionTone} />,
        },
    ]

    return (
        <AppLayout activePage="SAP or portal" portal="Buyer">
            <PageContainer
                kicker="ENTERPRISE ARCHITECTURE & BOUNDARY DEFINITIONS"
                title="SAP or portal"
                subtitle="Architectural demarcation between authoritative SAP S/4HANA ERP records and cloud vendor portal responsibilities."
            >
            {/* Two Column Architectural Split */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '24px',
                    marginBottom: '28px',
                }}
            >
                {/* SAP Side */}
                <Card>
                    <Card.Header
                        kicker="SYSTEM OF RECORD"
                        title="Authoritative in SAP Fiori & Core ERP"
                        action={
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    background: 'rgba(30, 58, 138, 0.1)',
                                    color: 'var(--color-primary, #1e3a8a)',
                                }}
                            >
                                SAP S/4HANA
                            </span>
                        }
                    />
                    <Card.Body>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            {SAP_RESPONSIBILITIES.map((item) => (
                                <li
                                    key={item}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        fontSize: '13.5px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span style={{ color: 'var(--color-primary, #1e3a8a)', fontWeight: 'bold' }}>✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Card>

                {/* Portal Side */}
                <Card>
                    <Card.Header
                        kicker="SYSTEM OF ENGAGEMENT"
                        title="Exclusive to Cloud Vendor Portal"
                        action={
                            <span
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--color-success, #059669)',
                                }}
                            >
                                VENDOR PORTAL
                            </span>
                        }
                    />
                    <Card.Body>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            {PORTAL_RESPONSIBILITIES.map((item) => (
                                <li
                                    key={item}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        fontSize: '13.5px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span style={{ color: 'var(--color-success, #059669)', fontWeight: 'bold' }}>✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Card>
            </div>

            {/* Overlap Matrix Card */}
            <Card>
                <Card.Header
                    title="Where the two layers interface"
                    kicker="INTEGRATION DESIGN PRINCIPLES"
                />
                <Card.Body style={{ padding: 0 }}>
                    <DataTable
                        columns={tableColumns}
                        data={OVERLAP_MATRIX}
                        emptyMessage="No boundary items documented."
                    />
                </Card.Body>
            </Card>

            {/* Implementation Guardrail Alert */}
            <div
                style={{
                    marginTop: '24px',
                    padding: '16px 20px',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                }}
            >
                <strong>Architecture Guardrail:</strong> Never duplicate SAP pricing engines, tax calculation schemes, or invoice
                3-way matching in the portal layer. SAP S/4HANA is the single source of truth for all accounting documents. The
                portal serves as an authoritative validation gate and collaboration workspace.
            </div>
        </PageContainer>
    </AppLayout>
    )
}

export default SapOrPortal
