
function Header({
    activePage = 'Dashboard',
    portal = 'Buyer',
    onToggleMobileMenu,
}) {
    const isBuyer = portal === 'Buyer'
    const userName = isBuyer ? 'K. Ramesh' : 'A. Deshpande'
    const userRole = isBuyer ? 'Procurement' : 'Precision Components'

    const avatarInitials = isBuyer ? 'KR' : 'AD'

    return (
        <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                    type="button"
                    className="icon-button mobile-menu-btn"
                    onClick={onToggleMobileMenu}
                    aria-label="Toggle navigation menu"
                    title="Menu"
                >
                    <svg viewBox="0 0 24 24">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                <div>
                    <div className="eyebrow">{portal} Workspace · Integrated with S/4HANA Cloud</div>
                    <h1>{activePage}</h1>
                </div>
            </div>

            <div className="topbar-actions">
                <div className="user-profile">
                    <div className="avatar" style={{ background: 'var(--ink)' }}>{avatarInitials}</div>

                    <div className="user-details">
                        <strong>{userName}</strong>
                        <span>{userRole}</span>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header