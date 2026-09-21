import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

// Landing Gateway Page
import LandingPage from '../pages/LandingPage'

// Buyer Pages (12 screens)
import BuyerHome from '../pages/buyer/BuyerHome'
import OpenWithSuppliers from '../pages/buyer/OpenWithSuppliers'
import NewSuppliers from '../pages/buyer/NewSuppliers'
import MasterDataChanges from '../pages/buyer/MasterDataChanges'
import Suppliers from '../pages/buyer/Suppliers'
import Certificates from '../pages/buyer/Certificates'
import QualityCases from '../pages/buyer/QualityCases'
import Scorecards from '../pages/buyer/Scorecards'
import Queries from '../pages/buyer/Queries'
import SupplierUsers from '../pages/buyer/SupplierUsers'
import Administration from '../pages/buyer/Administration'
import IntegrationMonitor from '../pages/buyer/IntegrationMonitor'
import SapOrPortal from '../pages/buyer/SapOrPortal'
import BuyerSourcing from '../pages/buyer/BuyerSourcing'

// Supplier Pages (17 screens)
import SignIn from '../pages/supplier/SignIn'
import Registration from '../pages/supplier/Registration'
import SupplierHome from '../pages/supplier/SupplierHome'
import CompanyProfile from '../pages/supplier/CompanyProfile'
import Documents from '../pages/supplier/Documents'
import RFQInbox from '../pages/supplier/RFQInbox'
import QuoteResponse from '../pages/supplier/QuoteResponse'
import PurchaseOrders from '../pages/supplier/PurchaseOrders'
import OrderDetail from '../pages/supplier/OrderDetail'
import DeliverySchedules from '../pages/supplier/DeliverySchedules'
import ShipmentNotice from '../pages/supplier/ShipmentNotice'
import Receipts from '../pages/supplier/Receipts'
import SubmitInvoice from '../pages/supplier/SubmitInvoice'
import InvoicesPayment from '../pages/supplier/InvoicesPayment'
import QualityActions from '../pages/supplier/QualityActions'
import Scorecard from '../pages/supplier/Scorecard'
import Messages from '../pages/supplier/Messages'

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Default Landing Gateway */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/gateway" element={<LandingPage />} />

                {/* ================= BUYER PORTAL (12 SCREENS) ================= */}
                <Route path="/buyer" element={<BuyerHome />} />
                <Route path="/buyer/stuck" element={<OpenWithSuppliers />} />
                <Route path="/buyer/registrations" element={<NewSuppliers />} />
                <Route path="/buyer/changes" element={<MasterDataChanges />} />
                <Route path="/buyer/suppliers" element={<Suppliers />} />
                <Route path="/buyer/certificates" element={<Certificates />} />
                <Route path="/buyer/quality" element={<QualityCases />} />
                <Route path="/buyer/scorecards" element={<Scorecards />} />
                <Route path="/buyer/queries" element={<Queries />} />
                <Route path="/buyer/users" element={<SupplierUsers />} />
                <Route path="/buyer/admin" element={<Administration />} />
                <Route path="/buyer/integration" element={<IntegrationMonitor />} />
                <Route path="/buyer/sourcing" element={<BuyerSourcing />} />
                <Route path="/buyer/scope" element={<SapOrPortal />} />

                {/* ================= SUPPLIER PORTAL (17 SCREENS) ================= */}
                <Route path="/login" element={<SignIn />} />
                <Route path="/supplier/login" element={<SignIn />} />
                <Route path="/register" element={<Registration />} />
                <Route path="/supplier" element={<SupplierHome />} />
                <Route path="/supplier/profile" element={<CompanyProfile />} />
                <Route path="/supplier/documents" element={<Documents />} />
                <Route path="/supplier/rfq" element={<RFQInbox />} />
                <Route path="/supplier/rfq/:id" element={<QuoteResponse />} />
                <Route path="/supplier/orders" element={<PurchaseOrders />} />
                <Route path="/supplier/orders/:id" element={<OrderDetail />} />
                <Route path="/supplier/schedules" element={<DeliverySchedules />} />
                <Route path="/supplier/asn" element={<ShipmentNotice />} />
                <Route path="/supplier/receipts" element={<Receipts />} />
                <Route path="/supplier/submit-invoice" element={<SubmitInvoice />} />
                <Route path="/supplier/invoices" element={<InvoicesPayment />} />
                <Route path="/supplier/quality" element={<QualityActions />} />
                <Route path="/supplier/scorecard" element={<Scorecard />} />
                <Route path="/supplier/messages" element={<Messages />} />

                {/* Catch-all unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes