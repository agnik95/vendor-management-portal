import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function AppLayout({
    children,
    activePage,
    setActivePage,
    portal,
    setPortal,
}) {
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Infer current portal from route if not explicitly passed
    const currentPortal =
        portal ||
        (location.pathname.startsWith('/supplier') ? 'Supplier' : 'Buyer')

    // Infer activePage from current URL path
    const getPageFromRoute = (pathname) => {
        // Buyer screens
        if (pathname === '/buyer/stuck') return 'Open with suppliers'
        if (pathname === '/buyer/registrations') return 'New suppliers'
        if (pathname === '/buyer/changes') return 'Master data changes'
        if (pathname.includes('/suppliers')) return 'Suppliers'
        if (pathname === '/buyer/certificates') return 'Certificates'
        if (pathname === '/buyer/quality') return 'Quality cases'
        if (pathname === '/buyer/scorecards') return 'Scorecards'
        if (pathname === '/buyer/queries') return 'Queries'
        if (pathname === '/buyer/users') return 'Supplier users'
        if (pathname === '/buyer/admin') return 'Administration'
        if (pathname === '/buyer/integration') return 'Integration monitor'
        if (pathname === '/buyer/sourcing') return 'Sourcing & RFQs'
        if (pathname === '/buyer/scope') return 'SAP or portal'
        if (pathname === '/buyer') return 'Home'

        // Supplier screens
        if (pathname === '/supplier/profile') return 'Company profile'
        if (pathname === '/supplier/documents') return 'Documents'
        if (pathname === '/supplier/rfq') return 'RFQ inbox'
        if (pathname === '/supplier/orders') return 'Purchase orders'
        if (pathname === '/supplier/schedules') return 'Delivery schedules'
        if (pathname === '/supplier/asn') return 'Shipment notice'
        if (pathname === '/supplier/receipts') return 'Receipts & rejections'
        if (pathname === '/supplier/submit-invoice') return 'Submit invoice'
        if (pathname === '/supplier/invoices') return 'Invoices & payments'
        if (pathname === '/supplier/quality') return 'Quality actions (8D)'
        if (pathname === '/supplier/scorecard') return 'Scorecard'
        if (pathname === '/supplier/messages') return 'Messages'
        if (pathname === '/register') return 'Registration wizard'
        if (pathname === '/supplier') return 'Home'

        return 'Home'
    }

    const currentActivePage =
        activePage || getPageFromRoute(location.pathname)

    return (
        <div className="app-shell">
            <Sidebar
                activePage={currentActivePage}
                setActivePage={setActivePage}
                portal={currentPortal}
                setPortal={setPortal}
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
            />

            <main className="main-area">
                <Header
                    activePage={currentActivePage}
                    portal={currentPortal}
                    onToggleMobileMenu={() =>
                        setIsMobileOpen((prev) => !prev)
                    }
                />

                {children}
            </main>
        </div>
    )
}

export default AppLayout