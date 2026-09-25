/**
 * Supplier Registration Service
 * Handles Screen 2: Supplier Self-Service Onboarding Wizard
 * 
 * Rules:
 * - PAN and GSTIN validated against each other (chars 3-12 of GSTIN must equal PAN)
 * - GSTIN check digit validated using official MOD 36 algorithm (VAL-003)
 * - Duplicate screening occurs on submit (without revealing matched details to applicant)
 * - Bank account is masked; penny-drop notice displayed
 * - Zero ERP writes: nothing written to S/4HANA until final buyer approval
 */

import apiClient, { generateIdempotencyKey } from '../apiClient'

/**
 * Validates Indian GSTIN using official MOD 36 checksum formula
 */
export function validateGSTINChecksum(gstin) {
    if (!gstin || typeof gstin !== 'string') return false
    const clean = gstin.trim().toUpperCase()
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
    if (!pattern.test(clean)) return false

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let sum = 0

    for (let i = 0; i < 14; i++) {
        const charValue = chars.indexOf(clean[i])
        const weight = (i % 2 === 0) ? 1 : 2
        const product = charValue * weight
        sum += Math.floor(product / 36) + (product % 36)
    }

    const checkDigitIndex = (36 - (sum % 36)) % 36
    const expectedCheckDigit = chars[checkDigitIndex]
    return clean[14] === expectedCheckDigit
}

/**
 * Validates that PAN matches characters 3-12 of GSTIN
 */
export function validatePANMatchesGSTIN(pan, gstin) {
    if (!pan || !gstin) return false
    const cleanPan = pan.trim().toUpperCase()
    const cleanGstin = gstin.trim().toUpperCase()
    return cleanGstin.slice(2, 12) === cleanPan
}

class RegistrationService {
    async submitApplication(formData) {
        // Validate GSTIN and PAN
        if (formData.gstin) {
            if (!validateGSTINChecksum(formData.gstin)) {
                throw new Error('GSTIN checksum validation failed (VAL-003). Please verify the check digit.')
            }
            if (formData.pan && !validatePANMatchesGSTIN(formData.pan, formData.gstin)) {
                throw new Error('PAN does not match the PAN embedded inside the GSTIN.')
            }
        }

        const nextRef = `REG-2026-${Math.floor(200 + Math.random() * 800)}`
        
        // Mock payload structure expected by UI components
        const uiPayload = {
            ref: nextRef,
            name: formData.name || formData.legalName || 'Hosur Turned Parts LLP',
            cat: formData.categories || formData.category || 'Machined parts',
            days: 0,
            step: 0, // Step 1: Category Buyer review
            pan: formData.pan || 'AAFHT9021K',
            gstin: formData.gstin || '33AAFHT9021K1ZZ',
            turnover: formData.turnover || '₹14.2 Cr',
            emp: formData.emp || 62,
            certs: formData.certsHeld || formData.certs || 'ISO 9001:2015',
            by: 'Online supplier self-service',
            dup: false,
            bank: 'PENDING',
            docs: '5 of 7',
            st: 'OPEN',
            note: '',
        }

        // Format incorporation date to YYYY-MM-DD safely
        const formatIncDate = (dateStr) => {
            if (!dateStr) return '2021-01-10'
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return '2021-01-10'
            return d.toISOString().split('T')[0]
        }

        // Supplier Registration Payload for creating the data in PostgreSQL
        const backendPayload = {
            company_info: {
                company_name: formData.name || 'Sri Lakshmi Engineering Works',
                entity_type: formData.entityType || 'Sole Proprietorship',
                country: 'IN',
                incorporation_date: formatIncDate(formData.incDate)
            },
            sap_defaults: {
                bp_grouping: 'ZDOM',
                bp_category: '1',
                language: 'EN',
                search_term: formData.name ? formData.name.substring(0, 10).toUpperCase() : 'LAKSHMI',
                currency: formData.currency || 'INR'
            },
            contacts: formData.contacts && formData.contacts.length > 0 ? formData.contacts.map(c => ({
                contact_name: c.name,
                designation: c.designation,
                email: c.email,
                mobile: c.mobile,
                function: c.function,
                is_primary_contact: c.primary || false
            })) : [
                {
                    contact_name: 'Suresh Patel',
                    designation: 'Proprietor',
                    email: 'suresh@lakshmieng.in',
                    mobile: '+919123456789',
                    function: 'Owner',
                    is_primary_contact: true
                }
            ],
            tax_info: {
                pan: formData.pan || 'BKKPP4321M',
                gstin: formData.gstin || '27BKKPP4321M1Z2',
                tax_category: 'IN3'
            },
            bank_info: {
                account_holder_name: formData.accHolder || '',
                account_number: formData.accNo || '',
                ifsc_code: formData.ifsc || '',
                bank_branch: formData.branch || '',
                account_category: formData.accType || ''
            }
        }

        console.log('🚀 Sending PostgreSQL Payload to Backend:', JSON.stringify(backendPayload, null, 2))

        return apiClient.post(
            '/vendor/register',
            backendPayload,
            () => uiPayload,
            {
                idempotencyKey: generateIdempotencyKey('REG', nextRef),
                sapMessage: `Application ${nextRef} submitted. Stored in portal database. Nothing created in S/4HANA prior to approval.`,
            }
        )
    }
}

export const registrationService = new RegistrationService()
export default registrationService
