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

function SupplierUsers() {
    const { data } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('all')
    const [usersList, setUsersList] = useState(data?.users || [])

    // Classifications
    const activeUsers = useMemo(() => usersList.filter((u) => u?.st === 'ACTIVE'), [usersList])
    const dormantUsers = useMemo(() => usersList.filter((u) => u?.st === 'DORMANT'), [usersList])

    const singleUserSuppliersCount = useMemo(() => {
        return (data?.sup || []).filter((s) => usersList.filter((u) => u?.bp === s?.bp).length < 2).length
    }, [data?.sup, usersList])

    const displayUsers = useMemo(() => {
        switch (activeTab) {
            case 'active':
                return activeUsers
            case 'dormant':
                return dormantUsers
            case 'all':
            default:
                return usersList
        }
    }, [activeTab, activeUsers, dormantUsers, usersList])

    const tabsList = [
        { id: 'all', label: 'All Users' },
        { id: 'active', label: 'Active' },
        { id: 'dormant', label: 'Dormant (>60d)' },
    ]

    const handleResetMFA = (userName) => {
        toast.info(
            `MFA reset for ${userName}`,
            'A cryptographic re-enrolment challenge has been sent to their verified email. Passwords are never stored on this portal.'
        )
    }

    const handleDisableUser = (userName) => {
        const target = usersList.find((u) => u.name === userName)
        if (target) {
            const adminCount = usersList.filter((u) => u.bp === target.bp && u.role === 'Administrator' && u.st === 'ACTIVE').length
            if (target.role === 'Administrator' && adminCount <= 1) {
                if (!window.confirm(`WARNING: ${userName} is the ONLY active Administrator for ${target.sup}. Disabling them will leave the supplier unable to manage their own users. Do you wish to proceed?`)) {
                    return
                }
            }
        }
        setUsersList((prev) =>
            prev.map((u) => (u.name === userName ? { ...u, st: 'DISABLED' } : u))
        )
        toast.warning(
            `Account disabled: ${userName}`,
            'Active web sessions terminate within 60 seconds.'
        )
    }

    const tableColumns = [
        {
            key: 'name',
            header: 'User',
            render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
        },
        {
            key: 'sup',
            header: 'Supplier Organisation',
            render: (row) => (
                <div>
                    <div>{row.sup}</div>
                    <div className="font-mono text-xs text-muted">BP: {row.bp}</div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Portal Role',
            render: (row) => (
                <span
                    style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background:
                            row.role === 'Administrator'
                                ? 'rgba(124, 58, 237, 0.08)'
                                : 'var(--bg-card-subtle, #f1f5f9)',
                        color:
                            row.role === 'Administrator'
                                ? '#7c3aed'
                                : 'var(--text-secondary)',
                    }}
                >
                    {row.role}
                </span>
            ),
        },
        {
            key: 'last',
            header: 'Last Seen',
            render: (row) => row.last,
        },
        {
            key: 'st',
            header: 'Status',
            render: (row) => {
                if (row?.st === 'ACTIVE') return <StatusBadge status="Active" tone="success" />
                if (row?.st === 'DORMANT') return <StatusBadge status="Dormant" tone="warning" />
                return <StatusBadge status="Disabled" tone="neutral" />
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button size="sm" variant="secondary" onClick={() => handleResetMFA(row?.name)}>
                        Reset MFA
                    </Button>
                    {row?.st !== 'DISABLED' && (
                        <Button size="sm" variant="danger" onClick={() => handleDisableUser(row?.name)}>
                            Disable
                        </Button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <AppLayout activePage="Supplier users" portal="Buyer">
            <PageContainer
                kicker="ACCESS GOVERNANCE & IDENTITY MANAGEMENT"
                title="Supplier users"
                subtitle="External vendor identity directory operating securely without consuming SAP S/4HANA enterprise user licences."
            >
            {/* Top Metric Cards */}
            <div className="metrics-grid">
                <MetricCard
                    label="Registered External Logins"
                    value={usersList.length}
                    sub={`Across ${new Set(usersList.map((u) => u.bp)).size} active supplier accounts`}
                    tone="neutral"
                />
                <MetricCard
                    label="Dormant (>60 days inactive)"
                    value={dormantUsers.length}
                    sub={dormantUsers.length > 0 ? 'Review and revoke access' : 'Clean credential roster'}
                    tone={dormantUsers.length > 0 ? 'warning' : 'success'}
                />
                <MetricCard
                    label="Single-User Suppliers"
                    value={singleUserSuppliersCount}
                    sub="Single point of operational failure"
                    tone="warning"
                />
                <MetricCard
                    label="SAP Named Licences Used"
                    value="0"
                    sub="Zero ERP seat costs consumed"
                    tone="success"
                />
            </div>

            {/* Users Directory Table */}
            <Card>
                <Card.Header
                    title="External User Credentials"
                    action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                />
                <Card.Body style={{ padding: 0 }}>
                    <DataTable
                        columns={tableColumns}
                        data={displayUsers}
                        emptyMessage="No supplier users found for this filter."
                    />
                </Card.Body>
            </Card>

            {/* Security Architecture Callout */}
            <div
                style={{
                    marginTop: '24px',
                    padding: '16px 20px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                }}
            >
                <strong style={{ color: 'var(--color-success, #059669)' }}>Zero Direct SAP ERP Exposure:</strong> No
                supplier contact ever receives a direct SAP S/4HANA dialog login or ERP licence. Every outbound and inbound
                portal API transaction operates under one technical communication principal. Dynamic data tenant isolation is
                strictly enforced server-side from JWT claims matching the authenticated Business Partner ID.
            </div>
        </PageContainer>
    </AppLayout>
    )
}

export default SupplierUsers
