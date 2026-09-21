import AppRoutes from './routes/AppRoutes'
import { VendorDataProvider } from './context/VendorDataContext'
import { ToastProvider } from './components/common/Toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import './App.css'

function App() {
    return (
        <ErrorBoundary>
            <VendorDataProvider>
                <ToastProvider>
                    <AppRoutes />
                </ToastProvider>
            </VendorDataProvider>
        </ErrorBoundary>
    )
}

export default App