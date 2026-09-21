import { useState, useMemo } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function Administration() {
    const { data, updateAdminConfig } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('roles')
    const [editWeightsOpen, setEditWeightsOpen] = useState(false)

    const adminConfig = data?.adminConfig || {}
    const roles = adminConfig.roles || []
    const docTypes = adminConfig.docTypes || []
    const workflows = adminConfig.workflows || []
    const scorecardRules = adminConfig.scorecardRules || []
    const notifications = adminConfig.notifications || []
    const branding = adminConfig.branding || {
        portalName: 'Vendor Portal',
        supportEmail: 'vendor.support@bharatprecision.in',
        locale: 'English (India)',
        timezone: 'Asia/Kolkata',
    }

    const [localBranding, setLocalBranding] = useState(branding)
    const [localRules, setLocalRules] = useState(scorecardRules)

    const tabs = [
        { id: 'roles', label: 'Users & roles' },
        { id: 'docs', label: 'Document types' },
        { id: 'workflows', label: 'Workflows' },
        { id: 'scorecard', label: 'Scorecard rules' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'branding', label: 'Branding' },
    ]

    const totalWeight = useMemo(() => {
        return localRules.reduce((sum, r) => sum + (Number(r.weight) || 0), 0)
    }, [localRules])

    const handleSaveWeights = () => {
        if (totalWeight !== 100) {
            toast.error(
                'Weights must total 100%',
                `Current total is ${totalWeight}%. Please balance weights before saving.`
            )
            return
        }
        updateAdminConfig('scorecardRules', localRules)
        setEditWeightsOpen(false)
        toast.success(
            'Scorecard weights updated',
            'New weightings will take effect on the next monthly evaluation cycle.'
        )
    }

    const handleSaveBranding = (e) => {
        e.preventDefault()
        updateAdminConfig('branding', localBranding)
        toast.success('Branding preferences saved', 'Updated portal settings.')
    }

    return (
        <AppLayout activePage="Administration" portal="Buyer">
            <PageContainer
                kicker="SYSTEM CONFIGURATION & ACCESS CONTROL"
                title="Administration"
                subtitle="Manage portal security roles, document compliance rules, registration workflow chains, and evaluation scorecard configuration."
            >
                {/* Tabs bar */}
                <div style={{ marginBottom: '20px' }}>
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                {/* Tab 0: Roles & Permissions */}
                {activeTab === 'roles' && (
                    <Card
                        title="Portal Security Roles"
                        subtitle="Role-based access control isolating external supplier interactions from internal procurement authorisations"
                        actions={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                    toast.info(
                                        'New role creator',
                                        'Role templates inherit predefined technical user boundary controls.'
                                    )
                                }
                            >
                                + New role
                            </Button>
                        }
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'role',
                                    header: 'Role',
                                    render: (r) => <strong>{r.role}</strong>,
                                },
                                {
                                    key: 'audience',
                                    header: 'Who uses it',
                                    render: (r) => (
                                        <span
                                            className={`pill ${r.audience === 'Supplier' ? 'prt' : 'info'}`}
                                        >
                                            {r.audience}
                                        </span>
                                    ),
                                },
                                { key: 'perms', header: 'Key permissions' },
                                {
                                    key: 'users',
                                    header: 'Users',
                                    align: 'right',
                                    render: (r) => (
                                        <span className="mono" style={{ fontWeight: 600 }}>
                                            {r.users}
                                        </span>
                                    ),
                                },
                            ]}
                            data={roles}
                        />
                    </Card>
                )}

                {/* Tab 1: Document Types */}
                {activeTab === 'docs' && (
                    <Card
                        title="Document Types Configuration"
                        subtitle="Mandatory and conditional statutory certificates required across vendor categories"
                        actions={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                    toast.info(
                                        'New document type',
                                        'Document types are versioned so historical audits remain reconstructable.'
                                    )
                                }
                            >
                                + New type
                            </Button>
                        }
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'type',
                                    header: 'Document Type',
                                    render: (r) => <strong>{r.type}</strong>,
                                },
                                {
                                    key: 'mand',
                                    header: 'Mandatory',
                                    render: (r) => (
                                        <span
                                            className={`pill ${r.mand === 'Yes' ? 'risk' : 'grey'}`}
                                        >
                                            {r.mand}
                                        </span>
                                    ),
                                },
                                { key: 'exp', header: 'Has Expiry' },
                                { key: 'scope', header: 'Applicable Categories' },
                                {
                                    key: 'blocks',
                                    header: 'Blocks Purchasing',
                                    render: (r) => (
                                        <span
                                            className={`pill ${r.blocks ? 'risk' : 'good'}`}
                                        >
                                            {r.blocks ? 'Yes (Propose)' : 'No'}
                                        </span>
                                    ),
                                },
                            ]}
                            data={docTypes}
                        />
                    </Card>
                )}

                {/* Tab 2: Workflows */}
                {activeTab === 'workflows' && (
                    <Card
                        title="Supplier Registration Approval Chain"
                        subtitle="Four-tier verification workflow required prior to S/4HANA Business Partner creation"
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'step',
                                    header: 'Step',
                                    align: 'center',
                                    render: (r) => (
                                        <span
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                background: 'var(--sap)',
                                                color: '#fff',
                                                display: 'inline-grid',
                                                placeItems: 'center',
                                                fontFamily: 'monospace',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {r.step}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'approver',
                                    header: 'Approver Role',
                                    render: (r) => <strong>{r.approver}</strong>,
                                },
                                { key: 'condition', header: 'Condition' },
                                {
                                    key: 'sla',
                                    header: 'Service Target',
                                    render: (r) => (
                                        <span className="pill info">{r.sla}</span>
                                    ),
                                },
                            ]}
                            data={workflows}
                        />
                    </Card>
                )}

                {/* Tab 3: Scorecard Rules */}
                {activeTab === 'scorecard' && (
                    <Card
                        title="Monthly Evaluation Criteria & Weights"
                        subtitle="Weights must strictly balance to 100%. Changes take effect on the next period run."
                        actions={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setEditWeightsOpen(true)}
                            >
                                Edit weights
                            </Button>
                        }
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'criterion',
                                    header: 'Criterion',
                                    render: (r) => <strong>{r.criterion}</strong>,
                                },
                                {
                                    key: 'weight',
                                    header: 'Weight',
                                    align: 'right',
                                    render: (r) => (
                                        <span className="mono" style={{ fontWeight: 700 }}>
                                            {r.weight}%
                                        </span>
                                    ),
                                },
                                { key: 'target', header: 'Target' },
                                { key: 'lower', header: 'Lower Bound' },
                                { key: 'upper', header: 'Upper Bound' },
                            ]}
                            data={localRules}
                        />

                        <div
                            style={{
                                padding: '14px 18px',
                                borderTop: '1px solid var(--line2)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: '#FAFBFC',
                                fontWeight: 700,
                                fontSize: '13px',
                            }}
                        >
                            <span>Total Configured Weight</span>
                            <span
                                className="mono"
                                style={{
                                    color: totalWeight === 100 ? 'var(--good)' : 'var(--risk)',
                                }}
                            >
                                {totalWeight}% {totalWeight === 100 ? '✓ Balanced' : '⚠ Must equal 100%'}
                            </span>
                        </div>
                    </Card>
                )}

                {/* Tab 4: Notifications */}
                {activeTab === 'notifications' && (
                    <Card
                        title="Automated Event Triggers & Notification Templates"
                        subtitle="Real-time multi-channel notifications keeping internal and external teams synchronized"
                    >
                        <DataTable
                            columns={[
                                {
                                    key: 'event',
                                    header: 'Event',
                                    render: (r) => <strong>{r.event}</strong>,
                                },
                                {
                                    key: 'channel',
                                    header: 'Channel',
                                    render: (r) => (
                                        <span className="pill info">{r.channel}</span>
                                    ),
                                },
                                { key: 'recipient', header: 'Recipient' },
                                { key: 'timing', header: 'Timing' },
                            ]}
                            data={notifications}
                        />
                    </Card>
                )}

                {/* Tab 5: Branding */}
                {activeTab === 'branding' && (
                    <Card
                        title="Portal Branding & Localization"
                        subtitle="Tenant visual branding and regional preferences"
                    >
                        <form onSubmit={handleSaveBranding}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                                <FormField label="Portal Name">
                                    <input
                                        className="input"
                                        value={localBranding.portalName}
                                        onChange={(e) =>
                                            setLocalBranding({ ...localBranding, portalName: e.target.value })
                                        }
                                    />
                                </FormField>
                                <FormField label="Support Email">
                                    <input
                                        className="input"
                                        value={localBranding.supportEmail}
                                        onChange={(e) =>
                                            setLocalBranding({ ...localBranding, supportEmail: e.target.value })
                                        }
                                    />
                                </FormField>
                                <FormField label="Locale">
                                    <select
                                        className="input"
                                        value={localBranding.locale}
                                        onChange={(e) =>
                                            setLocalBranding({ ...localBranding, locale: e.target.value })
                                        }
                                    >
                                        <option>English (India)</option>
                                        <option>Hindi</option>
                                        <option>Kannada</option>
                                    </select>
                                </FormField>
                                <FormField label="Timezone">
                                    <select
                                        className="input"
                                        value={localBranding.timezone}
                                        onChange={(e) =>
                                            setLocalBranding({ ...localBranding, timezone: e.target.value })
                                        }
                                    >
                                        <option>Asia/Kolkata (IST +5:30)</option>
                                    </select>
                                </FormField>
                            </div>

                            <Button variant="primary" type="submit">
                                Save Branding
                            </Button>
                        </form>
                    </Card>
                )}

                {/* Architectural Boundary Note */}
                <div className="hint">
                    <b>Roles are portal-side only.</b> The portal never holds SAP authorisation objects.
                    Every call to S/4HANA runs under a technical communication user with a narrowly scoped
                    communication arrangement, and the portal adds a mandatory supplier filter to every read
                    so a supplier can only ever see rows carrying its own Business Partner number.
                </div>
            </PageContainer>

            {/* Modal: Edit Scorecard Weights */}
            <Modal
                isOpen={editWeightsOpen}
                onClose={() => setEditWeightsOpen(false)}
                title="Edit Scorecard Criteria Weights"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditWeightsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSaveWeights}
                            disabled={totalWeight !== 100}
                        >
                            Save Weights
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {localRules.map((rule, idx) => (
                        <div
                            key={rule.criterion}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                paddingBottom: '10px',
                                borderBottom: '1px solid var(--line2)',
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>
                                {rule.criterion}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                    type="number"
                                    className="input mono"
                                    style={{ width: '80px', textAlign: 'right' }}
                                    value={rule.weight}
                                    onChange={(e) => {
                                        const val = Number(e.target.value) || 0
                                        setLocalRules(
                                            localRules.map((r, i) =>
                                                i === idx ? { ...r, weight: val } : r
                                            )
                                        )
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--mute)' }}>%</span>
                            </div>
                        </div>
                    ))}

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            fontWeight: 700,
                        }}
                    >
                        <span>Total (must equal 100%)</span>
                        <span
                            className="mono"
                            style={{
                                color: totalWeight === 100 ? 'var(--good)' : 'var(--risk)',
                                fontSize: '15px',
                            }}
                        >
                            {totalWeight}%
                        </span>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    )
}

export default Administration
