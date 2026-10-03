const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const path = require("path");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 17;
const RIGHT = 578;

const logo1Path = path.join(__dirname, "../public/transparentlogo1.png");
const logo2Path = path.join(__dirname, "../public/transparentlogo2.png");
const signaturePath = path.join(__dirname, "../public/sign.png");
const phonePath = path.join(__dirname, "../public/phone.png");
const mailPath = path.join(__dirname, "../public/mail.png");
const webPath = path.join(__dirname, "../public/web.png");
const locationPath = path.join(__dirname, "../public/address.png");

// ======================================================
// HELPERS
// ======================================================

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function numberToWords(num) {
    num = Number(num || 0);

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
        "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
        "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
        "Nineteen"
    ];

    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const numToWords = n => {
        if (n === 0) return "Zero";
        if (n < 20) return a[n];
        if (n < 100)
            return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000)
            return a[Math.floor(n / 100)] + " Hundred" +
                (n % 100 ? " and " + numToWords(n % 100) : "");
        if (n < 100000)
            return numToWords(Math.floor(n / 1000)) + " Thousand" +
                (n % 1000 ? " " + numToWords(n % 1000) : "");
        if (n < 10000000)
            return numToWords(Math.floor(n / 100000)) + " Lakh" +
                (n % 100000 ? " " + numToWords(n % 100000) : "");
        return numToWords(Math.floor(n / 10000000)) + " Crore" +
            (n % 10000000 ? " " + numToWords(n % 10000000) : "");
    };

    const [whole, decimal] = num.toFixed(2).split(".");
    const rupees = numToWords(parseInt(whole));
    const paise = parseInt(decimal)
        ? ` and ${numToWords(parseInt(decimal))} Paise`
        : "";

    return `${rupees} Rupees${paise} Only`;
}

function money(value) {
    return Number(value || 0).toFixed(2);
}

function drawCell(doc, x, y, width, height, text = "", options = {}) {
    doc.rect(x, y, width, height).stroke();

    doc
        .font(options.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(options.fontSize || 6.5)
        .fillColor("black")
        .text(String(text ?? ""), x + (options.paddingX ?? 2), y + (options.paddingY ?? 4), {
            width: width - (options.paddingX ?? 2) * 2,
            height: height - 3,
            align: options.align || "center",
            lineBreak: false,
            ellipsis: false
        });
}

function drawInfo(doc, label, value, x, y, width = 235) {
    const labelWidth = 40;
    const fontSize = 7.5;

    doc.font("Helvetica-Bold").fontSize(fontSize).text(`${label}:`, x, y, {
        lineBreak: false
    });

    doc.font("Helvetica").fontSize(fontSize).text(
        value || "",
        x + labelWidth,
        y,
        {
            width: width - labelWidth,
            lineGap: 1
        }
    );

    const textHeight = doc.heightOfString(value || "", {
        width: width - labelWidth,
        lineGap: 1
    });

    return Math.max(10, textHeight);
}

// ======================================================
// TAX CALCULATION
// ======================================================

function calculateTaxes(items) {
    let totalCgst = 0;
    let totalSgst = 0;
    const taxMap = {};

    items.forEach(item => {
        const finalPrice = Number(item.finalPrice || 0);
        const quantity = Number(item.selectedQuantity || 0);
        const gstValue = Number(item.gstValue || 0);

        const totalInclusive = finalPrice * quantity;
        const taxableValue = totalInclusive / (1 + gstValue * 0.01);
        const totalTax = totalInclusive - taxableValue;
        const cgst = totalTax / 2;
        const sgst = totalTax / 2;
        const hsn = item.HSN || "";

        totalCgst += cgst;
        totalSgst += sgst;

        if (!taxMap[hsn]) {
            taxMap[hsn] = {
                taxableValue: 0,
                cgst: 0,
                sgst: 0,
                gstValue
            };
        }

        taxMap[hsn].taxableValue += taxableValue;
        taxMap[hsn].cgst += cgst;
        taxMap[hsn].sgst += sgst;
    });

    const taxRows = Object.entries(taxMap).map(([hsn, v]) => ({
        hsn,
        gstValue: v.gstValue,
        taxableValue: v.taxableValue,
        cgst: v.cgst,
        sgst: v.sgst,
        totalTax: v.cgst + v.sgst
    }));

    return { totalCgst, totalSgst, taxRows };
}

// ======================================================
// MAIN PDF GENERATOR
// ======================================================

async function generateInvoicePDF(res, bill, data) {
    console.log("Generating invoice PDF:", bill.billId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${bill.billId}.pdf"`
    );

    const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: true
    });

    doc.pipe(res);

    const items = data.tableData || [];

    const totalQuantity = items.reduce(
        (sum, item) => sum + Number(item.selectedQuantity || 0),
        0
    );

    const totalPrice = Number(data.totalPrice || 0);
    const freight = Number(data.freightCharge_packaging || 0);

    const { totalCgst, totalSgst, taxRows } = calculateTaxes(items);

    const subtotal = totalPrice - totalCgst - totalSgst;
    const grandTotal = totalPrice;

    const upiUrl =
        `upi://pay?pa=7048897540@upi` +
        `&pn=SunriseInteriorHub` +
        `&am=${grandTotal.toFixed(2)}` +
        `&cu=INR`;

    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 300,
        margin: 0,
        errorCorrectionLevel: "H"
    });

    renderInvoicePage(
        doc, bill, data, items, totalQuantity, totalPrice,
        freight, subtotal, totalCgst, totalSgst, grandTotal,
        taxRows, qrDataUrl, "        Original for Buyer"
    );

    doc.addPage();

    renderInvoicePage(
        doc, bill, data, items, totalQuantity, totalPrice,
        freight, subtotal, totalCgst, totalSgst, grandTotal,
        taxRows, qrDataUrl, "Duplicate for Supplier"
    );

    doc.end();
}

// ======================================================
// RENDER ONE COMPLETE PAGE
// ======================================================

function renderInvoicePage(
    doc,
    bill,
    data,
    items,
    totalQuantity,
    totalPrice,
    freight,
    subtotal,
    totalCgst,
    totalSgst,
    grandTotal,
    taxRows,
    qrDataUrl,
    copyLabel
) {
    const headerStart = -10;

    // ==================================================
    // PAGE BORDER
    // ==================================================

    doc.lineWidth(0.5).rect(
        14,
        14,
        PAGE_WIDTH - 28,
        PAGE_HEIGHT - 28
    ).stroke();

    // ==================================================
    // HEADER
    // ==================================================

    doc.image(logo1Path, 50, headerStart + 34, { width: 70 });
    doc.image(logo2Path, 28, headerStart + 82, { width: 120 });

    doc.font("Helvetica-Bold").fontSize(12).text(
        "786/110/72/21",
        150,
        headerStart + 35,
        {
            width: 290,
            align: "center",
            lineBreak: false
        }
    );

    doc.image(locationPath, 172, headerStart + 53, { width: 8 });

    doc.font("Helvetica").fontSize(8).text(
        " E-39,, Rd No. 2, Sardar Estate, Ajwa Rd., Vadodara, Gujarat, India",
        148,
        headerStart + 55,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    doc.image(phonePath, 255, headerStart + 65, { width: 8 });

    doc.fontSize(8).text(
        "+91 9408758155",
        145,
        headerStart + 67,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    doc.image(mailPath, 228, headerStart + 76, { width: 8 });

    doc.fontSize(8).text(
        "sunrise.interior.hub@gmail.com",
        145,
        headerStart + 77,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    doc.image(webPath, 220, headerStart + 86, { width: 8 });

    doc.fontSize(8).text(
        "www.sunriseinteriorhubrewards.com",
        145,
        headerStart + 87,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    doc.fontSize(8).text(
        "GSTIN: 24ABZPB6331R1Z0",
        145,
        headerStart + 97,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    doc.fontSize(8).text(
        "UDYAM-GJ-24-0140870",
        145,
        headerStart + 107,
        {
            width: 300,
            align: "center",
            lineBreak: false
        }
    );

    // ==================================================
    // ORIGINAL / DUPLICATE
    // ==================================================

    doc.font("Helvetica-Bold").fontSize(7).text(
        copyLabel.toUpperCase(),
        472,
        7,
        {
            width: 120,
            align: "center",
            lineBreak: false
        }
    );

    const referQr = 440;

    doc.image(qrDataUrl, referQr + 55, headerStart + 30, {
        width: 60,
        height: 60
    });

    doc.font("Helvetica").fontSize(8).text(
        "Scan to pay",
        referQr + 55,
        headerStart + 92,
        {
            width: 60,
            align: "center",
            lineBreak: false
        }
    );

    doc.font("Helvetica-Bold").fontSize(8).text(
        "PAYMENT MODE",
        referQr + 45,
        headerStart + 105,
        {
            width: 80,
            align: "center",
            lineBreak: false
        }
    );

    const paymentText =
        data.paymentMode === "DIGITAL"
            ? "DIGITAL"
            : (data.paymentMode || "CASH");

    doc.font("Helvetica").fontSize(8).text(
        paymentText,
        referQr + 45,
        headerStart + 115,
        {
            width: 80,
            align: "center",
            lineBreak: false
        }
    );

    doc.moveTo(17, 120).lineTo(578, 120).stroke();

    // ==================================================
    // BILLING / SHIPPING
    // ==================================================

    const infoY = 125;

    doc.font("Helvetica-Bold").fontSize(8).text(
        "Bill Date:",
        20,
        infoY,
        { lineBreak: false }
    );

    doc.font("Helvetica").fontSize(8).text(
        formatDate(data.billDate),
        57,
        infoY,
        { lineBreak: false }
    );

    doc.font("Helvetica-Bold").fontSize(8).text(
        "Billing To:",
        20,
        infoY + 17,
        { lineBreak: false }
    );

    let currentY = infoY + 30;

    currentY += drawInfo(doc, "Name", data.custName, 20, currentY) + 3;
    currentY += drawInfo(doc, "Phone", data.phoneno, 20, currentY) + 3;
    currentY += drawInfo(doc, "Address", data.custAdd, 20, currentY) + 3;
    currentY += drawInfo(doc, "State", data.custState, 20, currentY) + 3;
    currentY += drawInfo(doc, "GSTIN", data.custGSTIN, 20, currentY) + 3;

    const currentMaxY = currentY;

    // RIGHT

    doc.font("Helvetica-Bold").fontSize(8).text(
        "Bill Id:",
        305,
        infoY,
        { lineBreak: false }
    );

    doc.font("Helvetica").fontSize(8).text(
        data.billId,
        338,
        infoY,
        { lineBreak: false }
    );

    doc.font("Helvetica-Bold").fontSize(8).text(
        "Shipping To:",
        305,
        infoY + 17,
        { lineBreak: false }
    );

    currentY = infoY + 30;

    currentY += drawInfo(doc, "Name", data.shipcustName, 305, currentY) + 3;
    currentY += drawInfo(doc, "Phone", data.shipcustPhone, 305, currentY) + 3;
    currentY += drawInfo(doc, "Address", data.shipAdd, 305, currentY) + 3;
    currentY += drawInfo(doc, "State", data.shipbillState, 305, currentY) + 3;
    currentY += drawInfo(doc, "GSTIN", data.shipcustGST, 305, currentY) + 3;

    // ==================================================
    // ITEM TABLE
    // ==================================================

    const tableX = 17;
    const tableY = 238;

    const columns = [
        { name: "Sr No.", width: 43 },
        { name: "Description of Goods", width: 170 },
        { name: "HSN/SAC", width: 62 },
        { name: "Quantity", width: 53 },
        { name: "Rate(Inc. tax)", width: 67 },
        { name: "GST %", width: 45 },
        { name: "Rate", width: 55 },
        { name: "Amount", width: 67 }
    ];

    // HEADER
    let x = tableX;

    columns.forEach(col => {
        drawCell(doc, x, tableY, col.width, 15, col.name, {
            bold: true,
            fontSize: 8
        });
        x += col.width;
    });

    // ==================================================
    // ITEM ROWS
    // ==================================================

    const MIN_ROWS = 15;
    const rowHeight = 15;

    const rows = Array.from(
        { length: MIN_ROWS },
        (_, i) => items[i] || null
    );

    rows.forEach((item, index) => {
        const y = tableY + 15 + index * rowHeight;

        // EMPTY ROW — VERTICAL LINES ONLY
        if (!item) {
            let x = tableX;

            columns.forEach(col => {
                doc.moveTo(x, y)
                    .lineTo(x, y + rowHeight)
                    .stroke();

                x += col.width;
            });

            doc.moveTo(x, y)
                .lineTo(x, y + rowHeight)
                .stroke();

            return;
        }

        const taxableRate =
            Number(item.finalPrice || 0) /
            (1 + Number(item.gstValue || 0) * 0.01);

        const values = [
            index + 1,
            item.itemName || "",
            item.HSN || "",
            item.selectedQuantity || "",
            money(item.finalPrice),
            `${item.gstValue || 0}`,
            money(taxableRate),
            money(
                taxableRate *
                Number(item.selectedQuantity || 0)
            )
        ];

        let x = tableX;

        values.forEach((value, i) => {
            drawCell(
                doc,
                x,
                y,
                columns[i].width,
                rowHeight,
                value,
                {
                    fontSize: 7,
                    align: "center",
                    paddingY: 4
                }
            );

            x += columns[i].width;
        });
    });

    // ==================================================
    // TOTALS
    // ==================================================

    const totalsY =
        tableY +
        15 +
        MIN_ROWS * rowHeight;

    const mergedWidth =
        columns[0].width +
        columns[1].width +
        columns[2].width;

    const totalRowHeight = 15;

    const totalRows = [
        ["Sub total", subtotal],
        ["SGST", totalSgst],
        ["CGST", totalCgst],
        ["Freight Charge/ Packaging Charge", freight],
        ["Total", grandTotal]
    ];

    const totalTableWidth =
        columns.reduce((sum, col) => sum + col.width, 0);

    totalRows.forEach(([label, amount], index) => {

        const y = totalsY + index * totalRowHeight;
        const isTotal = index === totalRows.length - 1;

        // LABEL
        doc.font(isTotal ? "Helvetica-Bold" : "Helvetica")
            .fontSize(isTotal ? 8 : 7)
            .text(label, tableX + 2, y + 4, {
                width: mergedWidth - 4,
                align: "right",
                lineBreak: false
            });

        // LEFTMOST BORDER
        doc.moveTo(tableX, y)
            .lineTo(tableX, y + totalRowHeight)
            .stroke();

        // LABEL → QUANTITY
        let x = tableX + mergedWidth;

        doc.moveTo(x, y)
            .lineTo(x, y + totalRowHeight)
            .stroke();

        // REMAINING VERTICAL BORDERS
        for (let i = 3; i < columns.length; i++) {
            x += columns[i].width;

            doc.moveTo(x, y)
                .lineTo(x, y + totalRowHeight)
                .stroke();
        }

        // TOTAL QUANTITY
        if (isTotal) {
            doc.font("Helvetica-Bold")
                .fontSize(8)
                .text(
                    totalQuantity,
                    tableX + mergedWidth,
                    y + 4,
                    {
                        width: columns[3].width,
                        align: "center",
                        lineBreak: false
                    }
                );
        }

        // AMOUNT
        doc.font("Helvetica-Bold")
            .fontSize(8)
            .text(
                money(amount),
                tableX + totalTableWidth - columns[7].width,
                y + 4,
                {
                    width: columns[7].width,
                    align: "center",
                    lineBreak: false
                }
            );
    });

    // LINE ABOVE SUBTOTAL
    doc.moveTo(tableX, totalsY)
        .lineTo(tableX + totalTableWidth, totalsY)
        .stroke();

    // LINE ABOVE TOTAL
    const totalY =
        totalsY +
        (totalRows.length - 1) * totalRowHeight;

    doc.moveTo(tableX, totalY)
        .lineTo(tableX + totalTableWidth, totalY)
        .stroke();

    // BOTTOM LINE
    doc.moveTo(tableX, totalY + totalRowHeight)
        .lineTo(tableX + totalTableWidth, totalY + totalRowHeight)
        .stroke();

    // ==================================================
    // AMOUNT IN WORDS
    // ==================================================

    const amountWordsY =
        totalsY +
        totalRows.length * totalRowHeight;

    drawCell(
        doc,
        tableX,
        amountWordsY,
        562,
        15,
        `Amount in Words: ${numberToWords(grandTotal)}`,
        {
            fontSize: 7,
            align: "left",
            paddingY: 5
        }
    );

    // ==================================================
    // GST SUMMARY
    // ==================================================

    const gstTableY = amountWordsY + 20;

    const gstColumns = [
        { name: "HSN/SAC", width: 122 },
        { name: "Taxable Value", width: 105 },
        { name: "CGST %", width: 55 },
        { name: "CGST Amt", width: 75 },
        { name: "SGST %", width: 55 },
        { name: "SGST Amt", width: 75 },
        { name: "Total Tax", width: 75 }
    ];

    const gstHeaderHeight = 15;
    const gstBodyHeight = 120;

    // GST HEADER
    let gx = tableX;

    gstColumns.forEach(col => {
        drawCell(
            doc,
            gx,
            gstTableY,
            col.width,
            gstHeaderHeight,
            col.name,
            {
                bold: true,
                fontSize: 8
            }
        );

        gx += col.width;
    });

    // GST BODY
    let bodyX = tableX;

    gstColumns.forEach(col => {
        drawCell(
            doc,
            bodyX,
            gstTableY + gstHeaderHeight,
            col.width,
            gstBodyHeight,
            "",
            {
                fontSize: 7
            }
        );

        bodyX += col.width;
    });

    // GST ROWS — MAX 7
    const gstRowHeight = 15;

    taxRows.slice(0, 8).forEach((row, index) => {

        const y =
            gstTableY +
            gstHeaderHeight +
            index * gstRowHeight;

        const values = [
            row.hsn,
            money(row.taxableValue),
            `${row.gstValue / 2}%`,
            money(row.cgst),
            `${row.gstValue / 2}%`,
            money(row.sgst),
            money(row.totalTax)
        ];

        let x = tableX;

        values.forEach((value, i) => {
            drawCell(
                doc,
                x,
                y,
                gstColumns[i].width,
                gstRowHeight,
                value,
                {
                    fontSize: 7
                }
            );

            x += gstColumns[i].width;
        });
    });

    // ==================================================
    // SECOND AMOUNT IN WORDS
    // ==================================================

    const gstWordsY =
        gstTableY +
        gstHeaderHeight +
        gstBodyHeight;

    drawCell(
        doc,
        tableX,
        gstWordsY,
        562,
        15,
        `Amount in Words: ${numberToWords(
            totalCgst + totalSgst
        )}`,
        {
            fontSize: 7,
            align: "left",
            paddingY: 5
        }
    );

    // ==================================================
    // FOOTER
    // ==================================================

    const footerY = 730;

    // TERMS
    doc.font("Helvetica-Bold")
        .fontSize(8)
        .text(
            "Terms and Conditions:",
            20,
            footerY + 8,
            { lineBreak: false }
        );

    doc.font("Helvetica")
        .fontSize(7)
        .text(
            "1. Goods once sold will not be taken back.\n" +
            "2. Our responsibility ceases after goods leave premises.\n" +
            "3. Subject to Vadodara jurisdiction only.\n" +
            "4. We are not responsible for transport damage.",
            20,
            footerY + 22,
            {
                width: 165,
                lineGap: 1.5
            }
        );

    // BANK DETAILS
    doc.font("Helvetica-Bold")
        .fontSize(8)
        .text(
            "Sunrise Interior Hub's bank details",
            205,
            footerY + 8,
            {
                width: 190,
                lineBreak: false
            }
        );

    doc.font("Helvetica")
        .fontSize(7)
        .text(
            "Bank Name: Bank of Baroda",
            205,
            footerY + 22,
            { lineBreak: false }
        );

    doc.text(
        "A/c No.: 58270200000304",
        205,
        footerY + 33,
        { lineBreak: false }
    );

    doc.text(
        "Branch & IFS Code: KHODIYARNAGAR / BARBOKHOBAR",
        205,
        footerY + 44,
        {
            width: 190,
            lineBreak: false
        }
    );

    doc.text(
        "PAN: 24ABZPB6331R1Z0",
        205,
        footerY + 57,
        { lineBreak: false }
    );

    // SIGNATURE
    doc.font("Helvetica-Bold")
        .fontSize(8)
        .text(
            "For Sunrise Interior Hub",
            410,
            footerY + 8,
            {
                width: 150,
                align: "center",
                lineBreak: false
            }
        );

    doc.image(
        signaturePath,
        425,
        footerY + 25,
        {
            width: 120
        }
    );

    doc.font("Helvetica")
        .fontSize(8)
        .text(
            "Authorized Signature",
            410,
            footerY + 80,
            {
                width: 150,
                align: "center",
                lineBreak: false
            }
        );
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    generateInvoicePDF
};