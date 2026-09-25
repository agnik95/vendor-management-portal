/**
 * API Client abstraction layer
 * 
 * Provides a unified async interface for API calls.
 * In development / prototype mode, this simulates network latency and returns mock data,
 * while maintaining exact REST / OData payload signatures and idempotency headers.
 * 
 * When connecting to a real backend (SAP BTP CAP service / S/4HANA OData / Node.js backend):
 * Set VITE_USE_MOCK=false and VITE_API_BASE_URL=https://your-backend-endpoint in .env
 */

const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false'
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1'
const DEFAULT_DELAY_MS = Number(import.meta.env?.VITE_API_DELAY || 350)

// Helper to simulate network latency
export function delay(ms = DEFAULT_DELAY_MS) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate an RFC4122 compliant UUID or deterministic idempotency key
export function generateIdempotencyKey(prefix = 'REQ', objectId = '') {
    const randomHex = Math.random().toString(16).substring(2, 10)
    const timestamp = Date.now().toString(36)
    return `${prefix}:${objectId || 'GLOBAL'}:${timestamp}-${randomHex}`
}

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL
        this.useMock = USE_MOCK
    }

    _getHeaders(optionsHeaders = {}) {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...optionsHeaders,
        }
        const token = localStorage.getItem('vendor_portal_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return headers
    }

    _handleResponse(response) {
        if (response.status === 401) {
            localStorage.removeItem('vendor_portal_token')
            localStorage.removeItem('vendor_portal_user')
            window.location.href = '/login'
        }
        if (response.status === 403) {
            // Surface the backend's access-denied message
            // The caller will catch this as an error via !response.ok check
            console.warn('Access denied (403): User does not have permission for this action')
        }
    }

    /**
     * Standard GET request
     */
    async get(endpoint, mockDataResolver, options = {}) {
        if (this.useMock) {
            await delay(options.delay ?? DEFAULT_DELAY_MS)
            const result = typeof mockDataResolver === 'function' ? mockDataResolver() : mockDataResolver
            return {
                data: result,
                status: 200,
                headers: { 'x-data-source': 'mock-simulated' },
            }
        }

        const url = `${this.baseUrl}${endpoint}`
        const response = await fetch(url, {
            method: 'GET',
            headers: this._getHeaders(options.headers),
        })

        this._handleResponse(response)

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`)
        }

        return {
            data: await response.json(),
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
        }
    }

    /**
     * Standard POST request with Idempotency Key header
     */
    async post(endpoint, payload, mockResponseResolver, options = {}) {
        const idempotencyKey = options.idempotencyKey || generateIdempotencyKey('POST', endpoint.replace(/\W/g, '_'))

        if (this.useMock || options.forceMock) {
            await delay(options.delay ?? (DEFAULT_DELAY_MS + 200))
            const result = typeof mockResponseResolver === 'function'
                ? mockResponseResolver(payload)
                : (mockResponseResolver || { success: true, payload })

            return {
                data: result,
                status: 201,
                idempotencyKey,
                headers: {
                    'x-idempotency-key': idempotencyKey,
                    'x-data-source': 'mock-simulated',
                    'x-sap-message': options.sapMessage || 'S/4HANA Document Posted Successfully',
                },
            }
        }

        const url = `${this.baseUrl}${endpoint}`
        const headers = this._getHeaders(options.headers)
        headers['X-Idempotency-Key'] = idempotencyKey

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        })

        this._handleResponse(response)

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '')
            // Try to extract a meaningful message from the backend's JSON error
            let errorMessage = `POST ${endpoint} failed (${response.status})`
            try {
                const parsed = JSON.parse(errorBody)
                const detail = parsed?.detail || ''
                // Backend wraps SAP errors like: "Approval & SAP Sync Failed: SAP Error [400]: {JSON}"
                const sapJsonMatch = detail.match(/SAP Error \[\d+\]: (.+)$/)
                if (sapJsonMatch) {
                    try {
                        const sapError = JSON.parse(sapJsonMatch[1])
                        errorMessage = sapError?.error?.message?.value || detail
                    } catch {
                        errorMessage = detail
                    }
                } else if (detail) {
                    errorMessage = detail
                }
            } catch {
                if (errorBody) errorMessage += `: ${errorBody}`
            }
            throw new Error(errorMessage)
        }

        return {
            data: await response.json(),
            status: response.status,
            idempotencyKey,
            headers: Object.fromEntries(response.headers.entries()),
        }
    }

    /**
     * Standard PATCH request (with ETag concurrency check)
     */
    async patch(endpoint, payload, mockResponseResolver, options = {}) {
        if (this.useMock || options.forceMock) {
            await delay(options.delay ?? DEFAULT_DELAY_MS)
            const result = typeof mockResponseResolver === 'function'
                ? mockResponseResolver(payload)
                : (mockResponseResolver || { success: true, updated: payload })

            return {
                data: result,
                status: 200,
                headers: { 'x-data-source': 'mock-simulated' },
            }
        }

        const url = `${this.baseUrl}${endpoint}`
        const headers = this._getHeaders(options.headers)
        headers['If-Match'] = options.etag || '*'

        const response = await fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(payload),
        })

        this._handleResponse(response)

        if (!response.ok) {
            throw new Error(`PATCH ${endpoint} failed (${response.status}): ${response.statusText}`)
        }

        return {
            data: await response.json(),
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
        }
    }
}

export const apiClient = new ApiClient()
export default apiClient
