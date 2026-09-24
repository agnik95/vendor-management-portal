import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom'

// Landing Gateway Page
import LandingPage from '../pages/LandingPage'

// Route Protection
import ProtectedRoute from '../components/common/ProtectedRoute'

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
                {/* ============ PUBLIC ROUTES (No login required) ============ */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/gateway" element={<LandingPage />} />
                <Route path="/login" element={<SignIn />} />
                <Route path="/supplier/login" element={<SignIn />} />
                <Route path="/buyer/login" element={<SignIn />} />
                <Route path="/register" element={<Registration />} />

                {/* ================= BUYER PORTAL (Requires BUYER or ADMIN role) ================= */}
                <Route path="/buyer" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><BuyerHome /></ProtectedRoute>} />
                <Route path="/buyer/stuck" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><OpenWithSuppliers /></ProtectedRoute>} />
                <Route path="/buyer/registrations" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><NewSuppliers /></ProtectedRoute>} />
                <Route path="/buyer/changes" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><MasterDataChanges /></ProtectedRoute>} />
                <Route path="/buyer/suppliers" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><Suppliers /></ProtectedRoute>} />
                <Route path="/buyer/certificates" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><Certificates /></ProtectedRoute>} />
                <Route path="/buyer/quality" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><QualityCases /></ProtectedRoute>} />
                <Route path="/buyer/scorecards" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><Scorecards /></ProtectedRoute>} />
                <Route path="/buyer/queries" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><Queries /></ProtectedRoute>} />
                <Route path="/buyer/users" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><SupplierUsers /></ProtectedRoute>} />
                <Route path="/buyer/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><Administration /></ProtectedRoute>} />
                <Route path="/buyer/integration" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><IntegrationMonitor /></ProtectedRoute>} />
                <Route path="/buyer/sourcing" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><BuyerSourcing /></ProtectedRoute>} />
                <Route path="/buyer/scope" element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}><SapOrPortal /></ProtectedRoute>} />

                {/* ================= SUPPLIER PORTAL (Requires VENDOR role) ================= */}
                <Route path="/supplier" element={<ProtectedRoute allowedRoles={['VENDOR']}><SupplierHome /></ProtectedRoute>} />
                <Route path="/supplier/profile" element={<ProtectedRoute allowedRoles={['VENDOR']}><CompanyProfile /></ProtectedRoute>} />
                <Route path="/supplier/documents" element={<ProtectedRoute allowedRoles={['VENDOR']}><Documents /></ProtectedRoute>} />
                <Route path="/supplier/rfq" element={<ProtectedRoute allowedRoles={['VENDOR']}><RFQInbox /></ProtectedRoute>} />
                <Route path="/supplier/rfq/:id" element={<ProtectedRoute allowedRoles={['VENDOR']}><QuoteResponse /></ProtectedRoute>} />
                <Route path="/supplier/orders" element={<ProtectedRoute allowedRoles={['VENDOR']}><PurchaseOrders /></ProtectedRoute>} />
                <Route path="/supplier/orders/:id" element={<ProtectedRoute allowedRoles={['VENDOR']}><OrderDetail /></ProtectedRoute>} />
                <Route path="/supplier/schedules" element={<ProtectedRoute allowedRoles={['VENDOR']}><DeliverySchedules /></ProtectedRoute>} />
                <Route path="/supplier/asn" element={<ProtectedRoute allowedRoles={['VENDOR']}><ShipmentNotice /></ProtectedRoute>} />
                <Route path="/supplier/receipts" element={<ProtectedRoute allowedRoles={['VENDOR']}><Receipts /></ProtectedRoute>} />
                <Route path="/supplier/submit-invoice" element={<ProtectedRoute allowedRoles={['VENDOR']}><SubmitInvoice /></ProtectedRoute>} />
                <Route path="/supplier/invoices" element={<ProtectedRoute allowedRoles={['VENDOR']}><InvoicesPayment /></ProtectedRoute>} />
                <Route path="/supplier/quality" element={<ProtectedRoute allowedRoles={['VENDOR']}><QualityActions /></ProtectedRoute>} />
                <Route path="/supplier/scorecard" element={<ProtectedRoute allowedRoles={['VENDOR']}><Scorecard /></ProtectedRoute>} />
                <Route path="/supplier/messages" element={<ProtectedRoute allowedRoles={['VENDOR']}><Messages /></ProtectedRoute>} />

                {/* Catch-all unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes