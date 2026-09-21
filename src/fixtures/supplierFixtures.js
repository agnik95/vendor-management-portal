/**
 * Supplier Portal Representative Fixtures
 * Derived from Vendor_Portal_Supplier.md and Vendor_Portal_Supplier_Demo.html.
 * Minimal representative dataset for transactions, self-service, and ERP interfaces.
 */

export const INITIAL_SUPPLIER_FIXTURES = {
    // Current Authenticated Supplier Profile (Read-only mirror of SAP BP)
    supplier: {
        bp: '0017004521',
        name: 'Precision Components Pvt Ltd',
        pan: 'AABCT1332L',
        gstin: '29AABCT1332L1ZA',
        group: 'ZVEN — Domestic manufacturing',
        msme: 'Small — Udyam KR-03-0041987',
        blocked: false,
        since: '14 Mar 2024',
    },

    // Purchase Orders (Screen 8 & 9)
    orders: [
        { po: '4500018831', item: '10', plant: '1010', mat: 'SH-9012', desc: 'Shaft assembly', qty: 800, uom: 'EA', price: 398.50, req: '02 Sep 2026', recv: 0, ack: null, age: 52, ctrl: true, changed: false, note: 'Drawing SH-9012 rev C · EN8D' },
        { po: '4500018844', item: '10', plant: '1020', mat: 'CP-2210', desc: 'Cover plate', qty: 5000, uom: 'EA', price: 86.20, req: '05 Sep 2026', recv: 0, ack: null, age: 31, ctrl: true, changed: false },
        { po: '4500018844', item: '20', plant: '1020', mat: 'CP-2214', desc: 'Cover plate, LH', qty: 2500, uom: 'EA', price: 91.40, req: '05 Sep 2026', recv: 0, ack: null, age: 31, ctrl: true, changed: false },
        { po: '4500018851', item: '10', plant: '1010', mat: 'MB-4471', desc: 'Housing bracket', qty: 1200, uom: 'EA', price: 214.75, req: '12 Sep 2026', recv: 0, ack: null, age: 19, ctrl: true, changed: false },
        { po: '4500018855', item: '10', plant: '1010', mat: 'BU-1180', desc: 'Bush', qty: 12000, uom: 'EA', price: 18.90, req: '15 Sep 2026', recv: 0, ack: null, age: 14, ctrl: true, changed: false },
        { po: '4500018860', item: '10', plant: '1010', mat: 'SH-9014', desc: 'Shaft, long', qty: 600, uom: 'EA', price: 571.00, req: '18 Sep 2026', recv: 0, ack: null, age: 8, ctrl: true, changed: false },
        { po: '4500018788', item: '10', plant: '1010', mat: 'MB-4471', desc: 'Housing bracket', qty: 2400, uom: 'EA', price: 412.00, req: '20 Aug 2026', recv: 2388, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: true, note: 'Price amended to ₹412.00 on 14 Aug' },
        { po: '4500018802', item: '10', plant: '1010', mat: 'BU-1180', desc: 'Bush', qty: 12000, uom: 'EA', price: 18.90, req: '21 Aug 2026', recv: 8000, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: false },
        { po: '4500018827', item: '10', plant: '1010', mat: 'MB-4471', desc: 'Housing bracket', qty: 2400, uom: 'EA', price: 214.75, req: '28 Aug 2026', recv: 0, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: false },
        { po: '4500018771', item: '10', plant: '1010', mat: 'SH-9012', desc: 'Shaft assembly', qty: 1800, uom: 'EA', price: 398.50, req: '11 Aug 2026', recv: 1800, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: false },
        { po: '4500018745', item: '10', plant: '1020', mat: 'CP-2210', desc: 'Cover plate', qty: 5000, uom: 'EA', price: 86.20, req: '06 Aug 2026', recv: 5000, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: false, done: true },
        { po: '4500018712', item: '10', plant: '1010', mat: 'BU-1180', desc: 'Bush', qty: 9000, uom: 'EA', price: 18.90, req: '28 Jul 2026', recv: 9000, ack: 'AS_ORDERED', age: 0, ctrl: true, changed: false, done: true },
    ],

    // Goods Receipts (Screen 12)
    receipts: [
        { doc: '5000112884', date: '18 Aug 2026', po: '4500018802', item: '10', mat: 'BU-1180', desc: 'Bush', recv: 4000, rej: 0, reason: '', insp: 'Accepted', billed: false },
        { doc: '5000112871', date: '15 Aug 2026', po: '4500018788', item: '10', mat: 'MB-4471', desc: 'Housing bracket', recv: 2388, rej: 12, reason: 'Dimensional — bore oversize', insp: 'Accepted with deviation', billed: false },
        { doc: '5000112862', date: '13 Aug 2026', po: '4500018802', item: '10', mat: 'BU-1180', desc: 'Bush', recv: 4000, rej: 0, reason: '', insp: 'Accepted', billed: true },
        { doc: '5000112844', date: '11 Aug 2026', po: '4500018771', item: '10', mat: 'SH-9012', desc: 'Shaft assembly', recv: 600, rej: 1200, reason: 'Burr on flange face', insp: 'Lot rejected', billed: true },
        { doc: '5000112801', date: '06 Aug 2026', po: '4500018745', item: '10', mat: 'CP-2210', desc: 'Cover plate', recv: 5000, rej: 0, reason: '', insp: 'Accepted', billed: false },
    ],

    // Invoices and Payments (Screen 13 & 14)
    invoices: [
        { no: 'INV/26-27/0894', sap: '5105004412', date: '19 Aug 2026', amt: 694339, status: 'POSTED', due: '03 Oct 2026', block: '', paid: '' },
        { no: 'INV/26-27/0888', sap: '5105004398', date: '15 Aug 2026', amt: 412880, status: 'POSTED', due: '29 Sep 2026', block: '', paid: '' },
        { no: 'INV/26-27/0881', sap: '', date: '12 Aug 2026', amt: 288120, status: 'REJECTED', due: '', block: 'Unit price ₹412.00 does not match order price ₹398.50', paid: '' },
        { no: 'INV/26-27/0874', sap: '5105004371', date: '08 Aug 2026', amt: 602410, status: 'BLOCKED', due: '22 Sep 2026', block: 'Quantity billed exceeds quantity received by 140 EA', paid: '' },
        { no: 'INV/26-27/0866', sap: '5105004344', date: '02 Aug 2026', amt: 884000, status: 'PAID', due: '16 Sep 2026', block: '', paid: '18 Aug 2026' },
        { no: 'INV/26-27/0851', sap: '5105004301', date: '25 Jul 2026', amt: 312000, status: 'PAID', due: '08 Sep 2026', block: '', paid: '18 Aug 2026' },
    ],

    // Compliance Documents (Screen 5)
    documents: [
        { type: 'ISO 9001:2015 certificate', ref: 'IN-QMS-88210', issued: '01 Nov 2023', valid: '31 Oct 2026', days: 41, status: 'VERIFIED', by: 'R. Iyer · 04 Nov 2023', mand: true, exp: true },
        { type: 'IATF 16949 certificate', ref: 'IATF-0294411', issued: '12 Feb 2024', valid: '11 Feb 2027', days: 170, status: 'VERIFIED', by: 'R. Iyer · 15 Feb 2024', mand: true, exp: true },
        { type: 'GST registration certificate', ref: '29AABCT1332L1ZA', issued: '08 Jul 2017', valid: '', days: null, status: 'VERIFIED', by: 'System · verified via GSTN', mand: true, exp: false },
        { type: 'Udyam registration', ref: 'UDYAM-KR-03-0041987', issued: '19 Jan 2021', valid: '', days: null, status: 'VERIFIED', by: 'S. Nair · 22 Jan 2021', mand: true, exp: false },
        { type: 'Fire safety NOC', ref: 'KSFES/2023/1187', issued: '11 Jul 2023', valid: '11 Jul 2026', days: -45, status: 'EXPIRED', by: 'S. Nair · 14 Jul 2023', mand: true, exp: true },
        { type: 'Factory licence', ref: 'KA/FAC/29/9921', issued: '01 Apr 2026', valid: '31 Mar 2027', days: 222, status: 'PENDING', by: '', mand: true, exp: true },
        { type: 'Non-disclosure agreement', ref: '', issued: '', valid: '', days: null, status: 'MISSING', by: '', mand: true, exp: false },
        { type: 'Anti-bribery declaration', ref: '', issued: '', valid: '', days: null, status: 'MISSING', by: '', mand: true, exp: true },
    ],

    // RFQs and Sourcing (Screen 6 & 7)
    rfqs: [
        {
            no: '6000004412',
            desc: 'CNC turned shaft — annual rate contract',
            items: 3,
            issued: '12 Aug 2026',
            closes: '22 Aug 2026',
            urgent: true,
            quote: 'NONE',
            lines: [
                { it: '10', mat: 'SH-9012', d: 'Shaft assembly', qty: 48000, price: '', lead: '', moq: '' },
                { it: '20', mat: 'SH-9014', d: 'Shaft, long', qty: 12000, price: '', lead: '', moq: '' },
                { it: '30', mat: 'SH-9021', d: 'Shaft, splined', qty: 6500, price: '', lead: '', moq: '' },
            ],
        },
        {
            no: '6000004398',
            desc: 'Sheet metal enclosure — new part development',
            items: 7,
            issued: '05 Aug 2026',
            closes: '25 Aug 2026',
            urgent: false,
            quote: 'DRAFT',
            lines: [],
        },
        {
            no: '6000004377',
            desc: 'Forged flange — capacity expansion',
            items: 2,
            issued: '28 Jul 2026',
            closes: '29 Aug 2026',
            urgent: false,
            quote: 'DRAFT',
            lines: [],
        },
        {
            no: '6000004355',
            desc: 'Powder coating — job work',
            items: 1,
            issued: '21 Jul 2026',
            closes: '31 Aug 2026',
            urgent: false,
            quote: 'NONE',
            lines: [],
        },
    ],

    // Shipment Notices (Screen 11)
    asns: [
        { ref: 'ASN-2026-01180', del: '0180004412', sent: '18 Aug 2026', status: 'RECEIVED' },
        { ref: 'ASN-2026-01176', del: '0180004398', sent: '15 Aug 2026', status: 'RECEIVED' },
        { ref: 'ASN-2026-01171', del: '', sent: '13 Aug 2026', status: 'FAILED' },
    ],

    // Active 8D Quality Action (Screen 15)
    ncr: {
        no: 'NCR/2026/0412',
        mat: 'SH-9012',
        qty: 1200,
        plant: '1010',
        sev: 'Major — line stoppage risk',
        raised: '11 Aug 2026',
        due: '18 Aug 2026',
        disp: 'Return to supplier',
        debit: '5105004388',
        debitAmt: 48200,
        doc: '5000112844',
        po: '4500018771',
        steps: [
            { c: 'D1', t: 'Team formed', owner: 'A. Deshpande', due: '12 Aug', st: 'ACCEPTED', ev: 1 },
            { c: 'D2', t: 'Problem described with data', owner: 'A. Deshpande', due: '12 Aug', st: 'ACCEPTED', ev: 1 },
            { c: 'D3', t: 'Containment — sorting at both plants', owner: 'P. Menon', due: '13 Aug', st: 'ACCEPTED', ev: 2 },
            {
                c: 'D4',
                t: 'Root cause with five-why or fishbone',
                owner: 'P. Menon',
                due: '16 Aug',
                st: 'IN_PROGRESS',
                ev: 0,
                text: 'Deburring brush on machine OP-40 had worn past its replacement limit. The tool life counter was set to 8,000 parts against a validated life of 6,000. The operator check sheet did not include a visual burr check at OP-40.',
            },
            { c: 'D5', t: 'Corrective action chosen', owner: 'P. Menon', due: '18 Aug', st: 'NOT_STARTED', ev: 0 },
            { c: 'D6', t: 'Action implemented and verified', owner: 'P. Menon', due: '25 Aug', st: 'NOT_STARTED', ev: 0 },
            { c: 'D7', t: 'Prevent recurrence — control plan and FMEA', owner: 'Quality head', due: '01 Sep', st: 'NOT_STARTED', ev: 0 },
            { c: 'D8', t: 'Team recognised and case closed', owner: 'Quality head', due: '05 Sep', st: 'NOT_STARTED', ev: 0 },
        ],
    },

    ncrs: [
        { no: 'NCR/2026/0412', mat: 'SH-9012', raised: '11 Aug', status: 'OVERDUE' },
        { no: 'NCR/2026/0407', mat: 'MB-4471', raised: '06 Aug', status: 'WITH_SQA' },
        { no: 'NCR/2026/0391', mat: 'BU-1180', raised: '24 Jul', status: 'CLOSED' },
    ],

    // Scorecard (Screen 16)
    score: {
        total: 86,
        grade: 'A',
        rank: 4,
        of: 61,
        otd: 92.4,
        qty: 99.1,
        ppm: 640,
        resp: 11.2,
        docs: 71,
        closure: 82,
        trend: [
            ['Aug 25', 79], ['Sep 25', 81], ['Oct 25', 78], ['Nov 25', 83],
            ['Dec 25', 84], ['Jan 26', 82], ['Feb 26', 85], ['Mar 26', 87],
            ['Apr 26', 84], ['May 26', 88], ['Jun 26', 85], ['Jul 26', 86],
        ],
    },

    // Delivery Schedules (Screen 10)
    sched: [
        { wk: 'W35', date: '25 Aug 2026', req: 1200, cumR: 48200, cumD: 47000, zone: 'Firm' },
        { wk: 'W36', date: '01 Sep 2026', req: 1200, cumR: 49400, cumD: 47000, zone: 'Firm' },
        { wk: 'W37', date: '08 Sep 2026', req: 1000, cumR: 50400, cumD: 47000, zone: 'Firm' },
        { wk: 'W38', date: '15 Sep 2026', req: 1000, cumR: 51400, cumD: 47000, zone: 'Firm' },
        { wk: 'W39', date: '22 Sep 2026', req: 1400, cumR: 52800, cumD: 47000, zone: 'Trade-off' },
        { wk: 'W40', date: '29 Sep 2026', req: 1400, cumR: 54200, cumD: 47000, zone: 'Trade-off' },
        { wk: 'W41', date: '06 Oct 2026', req: 1200, cumR: 55400, cumD: 47000, zone: 'Forecast' },
        { wk: 'W42', date: '13 Oct 2026', req: 1200, cumR: 56600, cumD: 47000, zone: 'Forecast' },
    ],

    // Messages & Support Tickets (Screen 17)
    tickets: [
        {
            no: 'TKT-2026-0884',
            subj: 'Price mismatch on order 4500018788',
            cat: 'PRICE',
            status: 'OPEN',
            link: 'PO 4500018788',
            msgs: [
                { who: 'You', role: 'A. Deshpande', when: '12 Aug 16:20', me: true, body: 'Invoice INV/26-27/0881 was rejected on price. The revision to ₹412.00 was agreed on 22 Jul. The order still shows ₹398.50. Please amend the order.' },
                { who: 'K. Ramesh', role: 'Buyer, Peenya', when: '13 Aug 11:05', me: false, body: 'Confirmed with category management. The revision applies from 01 Aug, so it covers this delivery. Raising an order amendment today.' },
                { who: 'K. Ramesh', role: 'Buyer, Peenya', when: '14 Aug 09:40', me: false, body: 'Order 4500018788 amended to ₹412.00 with effect from 01 Aug. Please resubmit the invoice.' },
            ],
        },
        {
            no: 'TKT-2026-0879',
            subj: 'Bank account change verification',
            cat: 'ACCESS',
            status: 'AWAITING_SUPPLIER',
            link: '',
            msgs: [
                { who: 'S. Rao', role: 'Accounts', when: '09 Aug 10:00', me: true, body: 'We have changed our bank to HDFC. Cancelled cheque attached.' },
                { who: 'Finance', role: 'AP team', when: '10 Aug 15:12', me: false, body: 'A penny drop has been initiated. Please confirm the ₹1 credit reference when it appears.' },
            ],
        },
        {
            no: 'TKT-2026-0861',
            subj: 'Portal login for a second user',
            cat: 'ACCESS',
            status: 'RESOLVED',
            link: '',
            msgs: [
                { who: 'You', role: 'A. Deshpande', when: '01 Aug 09:20', me: true, body: 'Please add V. Kumar from dispatch as a logistics user.' },
                { who: 'Portal admin', role: 'TAMS', when: '01 Aug 14:02', me: false, body: 'User created. An activation email has been sent.' },
            ],
        },
    ],
}
