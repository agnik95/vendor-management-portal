/**
 * Master Data & Seed Data for TAMS Vendor Portal
 * 
 * Incorporates:
 * 1. Process Definition - Consumable Procurement Process (Maharashtra Seamless Ltd - MSLU)
 * 2. Buyer Companion Prototype (12 screens)
 * 3. Supplier Companion Prototype (17 screens)
 */

export const SAP_MASTER_TABLES = {
    companyCodes: [
        { code: 'MSLU', description: 'MAHARASHTRA SEAMLESS LTD' },
        { code: '1000', description: 'Bharat Precision Ltd (Corporate)' },
    ],
    plants: [
        { code: 'MSLU', name: 'Narketpally Plant', companyCode: 'MSLU' },
        { code: '1010', name: 'Peenya Works (Machined Parts)', companyCode: '1000' },
        { code: '1020', name: 'Hosur Works (Plastics & Stamping)', companyCode: '1000' },
    ],
    storageLocations: [
        { code: 'MCN1', description: 'Consumable Store' },
        { code: 'MAS1', description: 'Asset Store' },
        { code: 'MFI1', description: 'Finished Goods' },
        { code: 'MRCB', description: 'Raw Cut Billet' },
        { code: 'MRM1', description: 'Raw Material' },
        { code: 'MSF1', description: 'Semifinish Store' },
        { code: 'MTL1', description: 'Tools Store' },
        { code: 'NSTR', description: 'New Stores' },
    ],
    purchasingOrgs: [
        { code: 'MSPO', description: 'MSL Operation Purch.' },
        { code: 'MSPP', description: 'MSL Project Purch. O' },
        { code: '1010', description: 'Domestic Purchasing' },
        { code: '1020', description: 'Domestic South Purchasing' },
    ],
    purchasingGroups: [
        { code: '840', description: 'Consumable Material' },
        { code: '101', description: 'Machined Parts' },
        { code: '120', description: 'PUR-IMP-GURGAON' },
        { code: '130', description: 'PUR-RM-GURGAON' },
        { code: '180', description: 'PUR-DOM-HYDERABAD' },
        { code: '220', description: 'MM-OCTG' },
        { code: '250', description: 'PUR-OCTG' },
        { code: '370', description: 'OU-PUR-GURGAON' },
        { code: '380', description: 'OU-PUR-PLANT' },
        { code: '670', description: 'PUR-LOCAL-PLANT' },
    ],
    departments: [
        { name: 'Stores', description: 'Stores & Warehousing' },
        { name: 'Mechanical', description: 'Mechanical Maintenance' },
        { name: 'Electrical', description: 'Electrical & Power' },
        { name: 'Civil', description: 'Civil Works' },
        { name: 'HR_and_Admin', description: 'HR and Administration' },
        { name: 'IT', description: 'Information Technology' },
        { name: 'MM_Department', description: 'Materials Management' },
        { name: 'Tooling', description: 'Tooling Operations' },
        { name: 'Utility', description: 'Plant Utilities' },
    ],
    taxCodes: [
        { code: 'G0', description: 'Exempted input IGST', rate: 0 },
        { code: 'G1', description: 'Exempted input CGST + SGST', rate: 0 },
        { code: 'G2', description: 'Exempted input CGST + UTGST', rate: 0 },
        { code: 'G3', description: 'IGST 18% - Domestic input GST', rate: 18, type: 'IGST' },
        { code: 'G4', description: 'CGST 9% + SGST 9% - Domestic input GST', rate: 18, type: 'CGST_SGST' },
        { code: 'G5', description: 'CGST 9% + UTGST 9% - Domestic input GST', rate: 18, type: 'CGST_UTGST' },
        { code: 'G6', description: 'IGST 18% + Comp CESS 18%', rate: 36, type: 'IGST_CESS' },
        { code: 'G7', description: 'CGST 9% + SGST 9% + Comp CESS 18%', rate: 36, type: 'CGST_SGST_CESS' },
        { code: 'GA', description: 'Input Tax Credit - CGST 1.5% + SGST 1.5%', rate: 3, type: 'CGST_SGST' },
        { code: 'GB', description: 'Input Tax Credit - IGST 3%', rate: 3, type: 'IGST' },
        { code: 'GD', description: 'Input Tax Credit - IGST 5%', rate: 5, type: 'IGST' },
        { code: 'GH', description: 'Input Tax Credit - IGST 12%', rate: 12, type: 'IGST' },
        { code: 'GJ', description: 'Input Tax Credit - IGST 28%', rate: 28, type: 'IGST' },
    ],
    conditionTypes: [
        { code: 'ZCUS', description: 'MSL Custom' },
        { code: 'ZDIP', description: 'MSL Supp. Discount %', isPercentage: true },
        { code: 'ZDIS', description: 'MSL Supp. Discount' },
        { code: 'ZFRE', description: 'MSL Freight Value' },
        { code: 'ZFRP', description: 'MSL Freight Value %', isPercentage: true },
        { code: 'ZHDC', description: 'MSL Handling' },
        { code: 'ZINC', description: 'MSL Insurance' },
        { code: 'ZPAC', description: 'MSL Packaging' },
        { code: 'ZPAP', description: 'MSL Packaging %', isPercentage: true },
    ],
    prDocTypes: [
        { code: 'ZCON', description: 'Consumable PR' },
        { code: 'ZRAW', description: 'Raw Material PR' },
        { code: 'ZPRJ', description: 'Project PR' },
        { code: 'ZCAP', description: 'Capital PR' },
        { code: 'ZSER', description: 'Service PR' },
        { code: 'ZNB', description: 'Standard PR' },
        { code: 'ZSPR', description: 'Spare and Tool PR' },
        { code: 'ZIMP', description: 'Import PR' },
    ],
    poDocTypes: [
        { code: 'YCON', description: 'Consumable PO' },
        { code: 'YRAW', description: 'Raw Material PO' },
        { code: 'YPRJ', description: 'Project PO' },
        { code: 'YCAP', description: 'Capital PO' },
        { code: 'YSER', description: 'Service PO' },
        { code: 'YNB', description: 'Standard PO' },
        { code: 'YSPR', description: 'Spare and Tool PO' },
        { code: 'YIMP', description: 'Import PO' },
    ],
    bidders: [
        { vendorId: '120000', name: 'Jindal Steels', location: 'Bengaluru, India', rating: 'A' },
        { vendorId: '120001', name: 'Jindal Pipe Limited', location: 'Hyderabad, India', rating: 'A' },
        { vendorId: '120002', name: 'Vibhor Steel Tubes Pvt Ltd', location: 'Ahmedabad, India', rating: 'B+' },
    ],
}

export function getInitialDirectProcurementCycle() {
    return {
        // Step 1: Purchase Requisition (PR)
        requisitions: [
            {
                prNumber: '1300056',
                docType: 'ZCON',
                plant: 'MSLU',
                companyCode: 'MSLU',
                purchasingGroup: '840',
                storageLocation: 'MCN1',
                department: 'Stores',
                creator: 'Kranti Babhulkar',
                createdDate: '10 Apr 2025',
                status: 'APPROVED',
                totalValue: 345000,
                currency: 'INR',
                items: [
                    {
                        item: '00010',
                        materialCode: 'A9705GGRAPZZZZZ',
                        materialDesc: 'GRAPHITE',
                        extendedDesc: 'High-density graphite block for refractory application',
                        quantity: 100,
                        uom: 'KG',
                        estPrice: 450.00,
                        totalValue: 45000.00,
                        deliveryDate: '15 Apr 2025',
                    },
                    {
                        item: '00020',
                        materialCode: 'A9705GBORXZZZZZ',
                        materialDesc: 'BORAX',
                        extendedDesc: 'Technical grade borax pentahydrate powder',
                        quantity: 200,
                        uom: 'KG',
                        estPrice: 1500.00,
                        totalValue: 300000.00,
                        deliveryDate: '15 Apr 2025',
                    },
                ],
                approvalHistory: [
                    { approver: 'Upesh Patel', role: 'Project Owner', action: 'Approved', date: '10 Apr 2025 16:10', note: 'Approved based on Q1 consumable operational requirement.' },
                ],
            },
        ],

        // Step 2: Request for Quotation (RFQ)
        rfqs: [
            {
                rfqNumber: '7000000014',
                refPrNumber: '1300056',
                rfqType: 'RQ',
                description: 'Int. Sourcing Req - Consumables (Graphite & Borax)',
                purchasingOrg: 'MSPO',
                purchasingGroup: '840',
                companyCode: 'MSLU',
                deadlineDate: '09 Apr 2025',
                createdDate: '08 Apr 2025',
                status: 'PUBLISHED',
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', materialDesc: 'GRAPHITE', qty: 100, uom: 'KG' },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', materialDesc: 'BORAX', qty: 200, uom: 'KG' },
                ],
                bidders: [
                    { supplierId: '120000', name: 'Jindal Steels', invited: true, quotationNumber: '8000000030', status: 'SUBMITTED' },
                    { supplierId: '120001', name: 'Jindal Pipe Limited', invited: true, quotationNumber: '8000000031', status: 'SUBMITTED' },
                    { supplierId: '120002', name: 'Vibhor Steel Tubes Pvt Ltd', invited: true, quotationNumber: '8000000032', status: 'SUBMITTED' },
                ],
            },
        ],

        // Step 3: Supplier Quotations
        quotations: [
            {
                quotationNumber: '8000000030',
                rfqNumber: '7000000014',
                supplierId: '120000',
                supplierName: 'Jindal Steels',
                submittedDate: '09 Apr 2025',
                netValue: 300000.00,
                status: 'AWARDED',
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', unitPrice: 1000.00, awardedQty: 100, uom: 'KG' },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', unitPrice: 1000.00, awardedQty: 200, uom: 'KG' },
                ],
                notes: 'Will provide material within given timeline. Quality certificates attached.',
            },
            {
                quotationNumber: '8000000031',
                rfqNumber: '7000000014',
                supplierId: '120001',
                supplierName: 'Jindal Pipe Limited',
                submittedDate: '09 Apr 2025',
                netValue: 330000.00,
                status: 'REJECTED',
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', unitPrice: 1100.00, awardedQty: 0, uom: 'KG' },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', unitPrice: 1100.00, awardedQty: 0, uom: 'KG' },
                ],
            },
            {
                quotationNumber: '8000000032',
                rfqNumber: '7000000014',
                supplierId: '120002',
                supplierName: 'Vibhor Steel Tubes Pvt Ltd',
                submittedDate: '09 Apr 2025',
                netValue: 360000.00,
                status: 'REJECTED',
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', unitPrice: 1200.00, awardedQty: 0, uom: 'KG' },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', unitPrice: 1200.00, awardedQty: 0, uom: 'KG' },
                ],
            },
        ],

        // Step 4: Purchase Order (PO)
        purchaseOrders: [
            {
                poNumber: '44000020',
                refPrNumber: '1300056',
                refRfqNumber: '7000000014',
                supplierId: '120000',
                supplierName: 'Jindal Steels',
                docType: 'YCON',
                purchasingOrg: 'MSPO',
                purchasingGroup: '840',
                companyCode: 'MSLU',
                plant: 'MSLU',
                taxCode: 'G3', // IGST 18%
                confControl: '0004', // Inbound Delivery
                grBsdIV: true,
                incoterms: 'FCA',
                paymentTerms: 'ZN30',
                overdeliveryTol: 5,
                underdeliveryTol: 5,
                status: 'APPROVED',
                totalNetValue: 277200.00,
                conditions: [
                    { type: 'ZDIP', desc: 'MSL Supp. Discount %', value: 6.7, amount: -20100 },
                    { type: 'ZFRE', desc: 'MSL Freight Value', value: 0, amount: 0 },
                    { type: 'ZPAC', desc: 'MSL Packaging', value: 0, amount: 0 },
                ],
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', desc: 'GRAPHITE', qty: 100, uom: 'KG', price: 1000.00, delDate: '15 Apr 2025', deliveredQty: 25 },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', desc: 'BORAX', qty: 200, uom: 'KG', price: 1000.00, delDate: '15 Apr 2025', deliveredQty: 50 },
                ],
                customFields: {
                    modeOfTransport: 'Road',
                    paymentMode: 'Cheque',
                    carrier: 'VRL Logistics',
                    contactPerson: 'M. Sharma',
                },
            },
        ],

        // Step 5: Inbound Delivery
        inboundDeliveries: [
            {
                deliveryNumber: '180000079',
                refPoNumber: '44000020',
                supplierId: '120000',
                supplierName: 'Jindal Steels',
                deliveryDate: '10 Apr 2025',
                status: 'GOODS_RECEIVED',
                items: [
                    { item: '10', materialCode: 'A9705GGRAPZZZZZ', desc: 'GRAPHITE', deliveryQty: 25, putawayQty: 25, batchNumber: '0000000200', uom: 'KG' },
                    { item: '20', materialCode: 'A9705GBORXZZZZZ', desc: 'BORAX', deliveryQty: 50, putawayQty: 50, batchNumber: '0000000201', uom: 'KG' },
                ],
                customFields: {
                    billDate: '20 Mar 2025',
                    vendorInvoiceNo: 'INV/646341',
                    challanNo: '325371',
                    challanDate: '30 Mar 2025',
                    gateEntryNo: 'Gate 2',
                    gateEntryDate: '02 Apr 2025',
                    lrDate: '06 Apr 2025',
                    lrNo: '4364363',
                    transporterName: 'VRL Logistics',
                    vehicleNo: 'KA01AB4471',
                    vehicleType: '101 Truck',
                    supplierInvoiceNetWeight: '75.0 KG',
                    weighbridgeNetWeight: '75.2 KG',
                    egpDate: '10 Apr 2025',
                    egpNo: '65756',
                },
            },
        ],

        // Step 6: Goods Receipt (GRN)
        goodsReceipts: [
            {
                grnNumber: '50000000175',
                refDeliveryNumber: '180000079',
                refPoNumber: '44000020',
                movementType: '101',
                postingDate: '10 Apr 2025',
                collectiveSlip: '3 Collective Slip',
                status: 'POSTED',
                items: [
                    { line: 1, materialCode: 'A9705GGRAPZZZZZ', desc: 'GRAPHITE', grnQty: 25, uom: 'KG', stockType: 'Quality Inspection', sloc: 'MCN1' },
                    { line: 2, materialCode: 'A9705GBORXZZZZZ', desc: 'BORAX', grnQty: 50, uom: 'KG', stockType: 'Quality Inspection', sloc: 'MCN1' },
                ],
            },
        ],

        // Step 7: Supplier Invoice (MIRO)
        supplierInvoices: [
            {
                invoiceNumber: '5105600138',
                supplierInvoiceRef: 'SUPP_INV_NO_120000_01',
                refPoNumber: '44000020',
                refGrnNumber: '50000000175',
                supplierId: '120000',
                supplierName: 'Jindal Steels',
                companyCode: 'MSLU',
                invoiceDate: '10 Apr 2025',
                postingDate: '10 Apr 2025',
                taxCode: 'G3',
                taxRate: 18,
                taxableAmount: 55460.00,
                taxAmount: 9982.80,
                totalGrossAmount: 65442.80,
                balance: 0.00,
                status: 'CLEARED',
                glSimulation: [
                    { account: '21100000', name: 'Jindal Steels / Vendor Payables', amount: -64332.80, type: 'Credit' },
                    { account: '21120000', name: 'Goods Received / Invoice Received', amount: 18680.00, type: 'Debit' },
                    { account: '21120000', name: 'Goods Received / Invoice Received', amount: 36800.00, type: 'Debit' },
                    { account: '12605900', name: 'Input Tax Account IGST', amount: 3358.80, type: 'Debit' },
                    { account: '12605900', name: 'Input Tax Account IGST', amount: 6624.00, type: 'Debit' },
                    { account: '21403000', name: 'Withholding Tax 194Q', amount: -1110.00, type: 'Credit' },
                ],
            },
        ],

        // Step 8: Outgoing Payment
        outgoingPayments: [
            {
                paymentDocNumber: '1500000035',
                fiscalYear: '2025',
                companyCode: 'MSLU',
                postingDate: '10 Apr 2025',
                houseBank: 'YES 1',
                glAccount: '1100104 (YES Bank Main 1)',
                supplierId: '120000',
                supplierName: 'Jindal Steels',
                clearedInvoiceRef: '5105600138',
                clearedAmount: 65442.80,
                currency: 'INR',
                journalEntries: [
                    { line: 1, account: '1100104', desc: 'YES Bank Main 1', amount: -65444.00, type: 'Credit' },
                    { line: 2, account: '120000', desc: 'Jindal Steels (Vendor Cleared)', amount: 65444.00, type: 'Debit' },
                ],
            },
        ],
    }
}
