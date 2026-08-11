import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Policy } from "./types";
import { daysUntil, displayDate, fmtWhen } from "./utils";

export type CustomerExportRow = {
  Title: string;
  "Customer Name": string;
  Email: string;
  Mobile: string;
  NIC: string;
  "Address Line 1": string;
  "Address Line 2": string;
  "Address Line 3": string;
  "Vehicle Type": string;
  "Vehicle Number": string;
  "Beneficiary Name": string;
  "Beneficiary NIC": string;
  "Beneficiary Relationship": string;
  "Issue Date": string;
  "Expiry Date": string;
  "Days Until Expiry": string;
  Status: string;
  Draft: string;
  "Created At": string;
  "Updated At": string;
  "Renewed At": string;
};

function labelEnum(value: string | null | undefined): string {
  return String(value || "")
    .replace(/_/g, " ")
    .trim();
}

function daysLabel(policy: Policy): string {
  const d = daysUntil(policy.expiryDate);
  if (d == null) return "";
  return String(d);
}

/** Flatten a policy into a spreadsheet-friendly row with all customer fields. */
export function toExportRow(policy: Policy): CustomerExportRow {
  return {
    Title: labelEnum(policy.title),
    "Customer Name": policy.customerName || "",
    Email: policy.customerEmail || "",
    Mobile: policy.customerMobile || "",
    NIC: policy.customerNic || "",
    "Address Line 1": policy.addressLine1 || "",
    "Address Line 2": policy.addressLine2 || "",
    "Address Line 3": policy.addressLine3 || "",
    "Vehicle Type": labelEnum(policy.vehicleType),
    "Vehicle Number": policy.vehicleNumber || "",
    "Beneficiary Name": policy.beneficiaryName || "",
    "Beneficiary NIC": policy.beneficiaryNic || "",
    "Beneficiary Relationship": labelEnum(policy.beneficiaryRelationship),
    "Issue Date": displayDate(policy.issueDate),
    "Expiry Date": displayDate(policy.expiryDate),
    "Days Until Expiry": daysLabel(policy),
    Status: labelEnum(policy.status),
    Draft: policy.isDraft ? "Yes" : "No",
    "Created At": policy.createdAt ? fmtWhen(policy.createdAt) : "",
    "Updated At": policy.updatedAt ? fmtWhen(policy.updatedAt) : "",
    "Renewed At": policy.renewedAt ? fmtWhen(policy.renewedAt) : "",
  };
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFilePart(name: string): string {
  return (name || "customer")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
}

/** Export one or many customers to an .xlsx workbook. */
export function exportCustomersExcel(
  policies: Policy[],
  filenameBase = "RenewGuard-customers"
): void {
  if (!policies.length) {
    throw new Error("No customers to export");
  }
  const rows = policies.map(toExportRow);
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = Object.keys(rows[0]!).map((key) => ({
    wch: Math.min(
      36,
      Math.max(
        key.length + 2,
        ...rows.map((r) => String((r as Record<string, string>)[key] || "").length + 1)
      )
    ),
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Customers");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filenameBase}-${stamp()}.xlsx`
  );
}

/** Compact multi-customer PDF table (landscape). */
export function exportCustomersPdf(
  policies: Policy[],
  filenameBase = "RenewGuard-customers"
): void {
  if (!policies.length) {
    throw new Error("No customers to export");
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text("RenewGuard — Customer export", 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    `${policies.length} record${policies.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleString()}`,
    14,
    20
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 24,
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [14, 124, 114], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [238, 243, 247] },
    head: [
      [
        "Name",
        "Mobile",
        "Email",
        "NIC",
        "Vehicle",
        "Type",
        "Issue",
        "Expiry",
        "Days",
        "Status",
        "Address",
        "Beneficiary",
      ],
    ],
    body: policies.map((p) => {
      const address = [p.addressLine1, p.addressLine2, p.addressLine3]
        .filter(Boolean)
        .join(", ");
      const beneficiary = [p.beneficiaryName, labelEnum(p.beneficiaryRelationship)]
        .filter(Boolean)
        .join(" / ");
      return [
        `${labelEnum(p.title)} ${p.customerName || ""}`.trim(),
        p.customerMobile || "",
        p.customerEmail || "",
        p.customerNic || "",
        p.vehicleNumber || "",
        labelEnum(p.vehicleType),
        displayDate(p.issueDate),
        displayDate(p.expiryDate),
        daysLabel(p),
        labelEnum(p.status),
        address,
        beneficiary,
      ];
    }),
  });

  doc.save(`${filenameBase}-${stamp()}.pdf`);
}

/** Detailed single-customer PDF with every field. */
export function exportCustomerDetailPdf(policy: Policy): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const name = `${labelEnum(policy.title)} ${policy.customerName || "Customer"}`.trim();

  doc.setFontSize(16);
  doc.text("RenewGuard — Customer details", 14, 16);
  doc.setFontSize(11);
  doc.setTextColor(14, 124, 114);
  doc.text(name, 14, 24);
  doc.setTextColor(90);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 30);
  doc.setTextColor(0);

  const address = [policy.addressLine1, policy.addressLine2, policy.addressLine3]
    .filter(Boolean)
    .join(", ") || "—";

  const rows: [string, string][] = [
    ["Title", labelEnum(policy.title) || "—"],
    ["Full name", policy.customerName || "—"],
    ["Email", policy.customerEmail || "—"],
    ["Mobile", policy.customerMobile || "—"],
    ["NIC", policy.customerNic || "—"],
    ["Address", address],
    ["Vehicle type", labelEnum(policy.vehicleType) || "—"],
    ["Vehicle number", policy.vehicleNumber || "—"],
    ["Beneficiary name", policy.beneficiaryName || "—"],
    ["Beneficiary NIC", policy.beneficiaryNic || "—"],
    ["Beneficiary relationship", labelEnum(policy.beneficiaryRelationship) || "—"],
    ["Issue date", displayDate(policy.issueDate)],
    ["Expiry date", displayDate(policy.expiryDate)],
    ["Days until expiry", daysLabel(policy) || "—"],
    ["Status", labelEnum(policy.status) || "—"],
    ["Draft", policy.isDraft ? "Yes" : "No"],
    ["Created", policy.createdAt ? fmtWhen(policy.createdAt) : "—"],
    ["Updated", policy.updatedAt ? fmtWhen(policy.updatedAt) : "—"],
    ["Renewed", policy.renewedAt ? fmtWhen(policy.renewedAt) : "—"],
  ];

  autoTable(doc, {
    startY: 36,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold", fillColor: [238, 243, 247] },
      1: { cellWidth: 125 },
    },
    body: rows,
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        data.cell.styles.textColor = [91, 111, 126];
      }
    },
  });

  const file = `RenewGuard-${safeFilePart(policy.customerName || policy.vehicleNumber)}-${stamp()}.pdf`;
  doc.save(file);
}

/** Single-customer Excel (one-row workbook with all columns). */
export function exportCustomerDetailExcel(policy: Policy): void {
  const base = `RenewGuard-${safeFilePart(policy.customerName || policy.vehicleNumber)}`;
  exportCustomersExcel([policy], base);
}
