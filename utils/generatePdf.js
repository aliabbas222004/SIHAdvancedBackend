const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const cloudinary = require('./cloudinary');

const generatePDF = (bill, qrData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const tempPath = path.join(__dirname, `../temp-bill-${bill._id}.pdf`);
    const stream = fs.createWriteStream(tempPath);

    doc.pipe(stream);

    doc.fontSize(20).text('Sunrise Interior Hub', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Customer: ${bill.customerName}`);
    doc.text(`Phone: ${bill.customerPhone}`);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`);
    doc.moveDown();

    doc.text('Items:');
    bill.items.forEach(item => {
      doc.text(`${item.name} - ₹${item.givenPrice} x ${item.quantity}`);
    });

    doc.moveDown();
    doc.text(`Total: ₹${bill.totalAmount}`, { bold: true });

    doc.image(qrData, { fit: [100, 100], align: 'center' });

    doc.end();

    stream.on('finish', async () => {
      try {
        // Upload after file is fully written and closed
        const result = await cloudinary.uploader.upload(tempPath, {
          resource_type: 'auto',
          folder: 'bills'
        });

        fs.unlinkSync(tempPath); // Delete local file after upload

        resolve(result.secure_url); // Return the Cloudinary URL
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', err => reject(err));
  });
};

module.exports = generatePDF;
