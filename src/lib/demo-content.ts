/**
 * Safe fictional demonstration data for marketing UI compositions.
 * Not real people or businesses.
 */
export const demoBusiness = {
  name: "Veynor Lane Digital",
  legalName: "Veynor Lane Digital Ltd",
  address: "Studio 4, 22 Snow Hill, Wolverhampton, WV1 4AD",
  email: "accounts@veynor-demo.example",
  vat: "GB 482 9103 42",
} as const;

export const demoClient = {
  name: "Bridgewater Office Solutions Ltd",
  contact: "Simon Tate",
  address: "Unit 12, Millfields Road, Bilston, WV14 0QJ",
  email: "ap@bridgewater-demo.example",
} as const;

export const demoInvoice = {
  number: "INV-000214",
  issueDate: "8 Mar 2026",
  dueDate: "7 Apr 2026",
  reference: "PO-9921",
  currency: "GBP",
  lines: [
    {
      description: "Website support retainer — March",
      qty: "1",
      unit: "month",
      unitPrice: "£1,150.00",
      amount: "£1,150.00",
    },
    {
      description: "E-commerce checkout improvements",
      qty: "12",
      unit: "hours",
      unitPrice: "£85.00",
      amount: "£1,020.00",
    },
    {
      description: "DNS & hosting administration",
      qty: "1",
      unit: "task",
      unitPrice: "£180.00",
      amount: "£180.00",
    },
  ],
  subtotal: "£2,350.00",
  vat: "£470.00",
  total: "£2,820.00",
  status: "due_soon" as const,
} as const;

export const demoQuote = {
  number: "QUO-000063",
  issueDate: "28 Feb 2026",
  validUntil: "28 Mar 2026",
  total: "£3,480.00",
  status: "accepted" as const,
  lines: [
    {
      description: "Brand refresh — logo and colour system",
      amount: "£2,100.00",
    },
    {
      description: "Printed stationery pack (letterhead + comps)",
      amount: "£1,380.00",
    },
  ],
} as const;

export const demoDashboard = {
  invoiced: "£14,260.00",
  paid: "£9,880.00",
  outstanding: "£2,820.00",
  overdue: "£1,560.00",
  chart: [38, 44, 52, 49, 61, 58, 72, 68, 75, 71, 79, 83],
} as const;

/** Sample client names shown in workflow illustrations */
export const demoClientDirectory = [
  "Bridgewater Office Solutions Ltd",
  "Harbour & Co. Accountants",
  "Millfields Property Care",
] as const;
