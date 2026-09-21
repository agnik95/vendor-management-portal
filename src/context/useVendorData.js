import { createContext, useContext } from 'react'

export const VendorDataContext = createContext(null)

export function useVendorData() {
    const context = useContext(VendorDataContext)
    if (!context) {
        throw new Error('useVendorData must be used within a VendorDataProvider')
    }
    return context
}

export default useVendorData
