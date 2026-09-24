import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { VendorDataProvider } from './context/VendorDataContext'
import { ToastProvider } from './components/common/Toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import './App.css'

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <VendorDataProvider>
                    <ToastProvider>
                        <AppRoutes />
                    </ToastProvider>
                </VendorDataProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App