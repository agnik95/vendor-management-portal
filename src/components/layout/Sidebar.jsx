import { useNavigate } from 'react-router-dom'

const BUYER_NAV = [
    {
        section: 'Daily Operations',
        items: [
            { id: 'home', label: 'Home', path: '/buyer' },
            { id: 'stuck', label: 'Open with suppliers', path: '/buyer/stuck' },
        ],
    },
    {
        section: 'Onboarding',
        items: [
            { id: 'regs', label: 'New suppliers', path: '/buyer/registrations' },
            { id: 'changes', label: 'Master data changes', path: '/buyer/changes' },
        ],
    },
    {
        section: 'Procurement Management',
        items: [
            { id: 'sourcing', label: 'Sourcing & RFQs', path: '/buyer/sourcing' },
            { id: 'sups', label: 'Suppliers', path: '/buyer/suppliers' },
            { id: 'certs', label: 'Certificates', path: '/buyer/certificates' },
            { id: 'quality', label: 'Quality cases', path: '/buyer/quality' },
            { id: 'score', label: 'Scorecards', path: '/buyer/scorecards' },
            { id: 'msgs', label: 'Queries', path: '/buyer/queries' },
        ],
    },
    {
        section: 'Governance & Admin',
        items: [
            { id: 'users', label: 'Supplier users', path: '/buyer/users' },
            { id: 'admin', label: 'Administration', path: '/buyer/admin' },
            { id: 'integ', label: 'Integration monitor', path: '/buyer/integration' },
            { id: 'scope', label: 'SAP or portal', path: '/buyer/scope' },
        ],
    },
]

const SUPPLIER_NAV = [
    {
        section: 'Vendor Dashboard',
        items: [
            { id: 'dash', label: 'Home', path: '/supplier' },
            { id: 'profile', label: 'Company profile', path: '/supplier/profile' },
            { id: 'docs', label: 'Documents', path: '/supplier/documents' },
        ],
    },
    {
        section: 'Orders & Sourcing',
        items: [
            { id: 'rfq', label: 'RFQ inbox', path: '/supplier/rfq' },
            { id: 'po', label: 'Purchase orders', path: '/supplier/orders' },
            { id: 'sched', label: 'Delivery schedules', path: '/supplier/schedules' },
        ],
    },
    {
        section: 'Logistics & Dispatch',
        items: [
            { id: 'asn', label: 'Shipment notice', path: '/supplier/asn' },
            { id: 'gr', label: 'Receipts & rejections', path: '/supplier/receipts' },
        ],
    },
    {
        section: 'Billing & Finance',
        items: [
            { id: 'inv', label: 'Submit invoice', path: '/supplier/submit-invoice' },
            { id: 'pay', label: 'Invoices & payments', path: '/supplier/invoices' },
        ],
    },
    {
        section: 'Quality & Support',
        items: [
            { id: 'squality', label: 'Quality actions (8D)', path: '/supplier/quality' },
            { id: 'score', label: 'Scorecard', path: '/supplier/scorecard' },
            { id: 'msg', label: 'Messages', path: '/supplier/messages' },
        ],
    },

]

function Sidebar({
    activePage,
    portal,
    isMobileOpen = false,
    onCloseMobile,
}) {
    const navigate = useNavigate()
    const isBuyer = portal === 'Buyer'
    const navGroups = isBuyer ? BUYER_NAV : SUPPLIER_NAV

    const handleNavigate = (path) => {
        onCloseMobile?.()
        navigate(path)
    }

    return (
        <>
            {isMobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={onCloseMobile}
                    aria-hidden="true"
                />
            )}

            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Brand Header */}
                <div
                    className="brand"
                    onClick={() => navigate(isBuyer ? '/buyer' : '/supplier')}
                    style={{ cursor: 'pointer' }}
                    title={isBuyer ? 'Enterprise Buyer Portal' : 'Supplier Self-Service Portal'}
                >
                    <div className="brand-mark">{isBuyer ? 'B' : 'S'}</div>

                    <div style={{ flex: 1 }}>
                        <div className="brand-name">
                            {isBuyer ? 'BUYER PORTAL' : 'SUPPLIER PORTAL'}
                        </div>
                        <div className="brand-subtitle">
                            {isBuyer ? 'INTERNAL ENTERPRISE' : 'VENDOR SELF-SERVICE'}
                        </div>
                    </div>

                    {isMobileOpen && (
                        <button
                            type="button"
                            className="sidebar-close-btn"
                            onClick={onCloseMobile}
                            aria-label="Close sidebar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Workspace Dedicated Status Indicator (NO SWITCHER) */}
                <div className={`workspace-indicator-badge ${isBuyer ? 'buyer' : 'supplier'}`}>
                    <span className={`indicator-dot ${isBuyer ? 'blue' : 'green'}`} />
                    <span className="indicator-text">
                        {isBuyer ? 'ENTERPRISE BUYER WORKSPACE' : 'SUPPLIER SELF-SERVICE'}
                    </span>
                </div>

                {/* Navigation Groups */}
                <nav className="navigation">
                    {navGroups.map((group) => (
                        <div className="nav-group" key={group.section}>
                            <div className="nav-label">{group.section}</div>

                            {group.items.map((item) => {
                                const isActive = activePage === item.label || activePage === item.id

                                return (
                                    <button
                                        type="button"
                                        key={item.id}
                                        className={
                                            isActive
                                                ? 'nav-item active'
                                                : 'nav-item'
                                        }
                                        onClick={() => handleNavigate(item.path)}
                                    >
                                        <span className="nav-icon">
                                            {getIcon(item.id)}
                                        </span>

                                        <span style={{ flex: 1, textAlign: 'left' }}>
                                            {item.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Data Origin Legend */}
                    <div className="sidebar-legend">
                        <b>Data origin</b>
                        <div><i className="dot sap" />Read from S/4HANA — not stored</div>
                        <div><i className="dot prt" />Owned by the portal database</div>
                    </div>

                    <div className="environment">
                        <span className="status-dot" />
                        <span>Connected</span>
                        <span className="environment-label">S/4HANA</span>
                    </div>

                    <div className="sidebar-version">
                        {isBuyer ? 'Buyer Governance · v2.4' : 'Supplier Portal · v2.4'}
                    </div>

                    <button
                        type="button"
                        className="sidebar-exit-btn"
                        onClick={() => navigate('/')}
                        title="Return to Workspace Gateway"
                    >
                        <span>← Exit to Gateway</span>
                    </button>
                </div>
            </aside>
        </>
    )
}

function getIcon(id) {
    const icons = {
        home: '⌂',
        dash: '⌂',
        stuck: '⚠',
        regs: '👤',
        reg: '📝',
        changes: '⇄',
        sups: '◉',
        certs: '◇',
        docs: '◇',
        quality: '◎',
        squality: '◎',
        score: '◫',
        msgs: '✉',
        msg: '✉',
        users: '👥',
        admin: '⚙',
        integ: '⚡',
        scope: '⚙',
        profile: '🏢',
        rfq: '📄',
        po: '▤',
        sched: '📅',
        asn: '🚚',
        gr: '📦',
        inv: '₹',
        pay: '💳',
    }
    return icons[id] || '•'
}

export default Sidebar