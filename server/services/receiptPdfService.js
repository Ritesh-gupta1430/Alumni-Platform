const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Helper to convert number to Indian words
function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.floor(amount);
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str.trim();
  }

  return inWords(num) + ' Indian Rupees Only';
}

function formatDate(date) {
  const d = new Date(date || Date.now());
  const day = d.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

async function generateDonationReceiptPDF(donation, res) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    info: {
      Title: `TCET 80G Donation Certificate - ${donation.receiptNumber || donation.donationId}`,
      Author: 'Thakur College of Engineering and Technology (TCET)',
      Subject: 'Donation Certificate under Section 80G of Income Tax Act, 1961',
    }
  });

  doc.pipe(res);

  const donorName = donation.isAnonymous
    ? 'Anonymous Donor'
    : `${donation.donor?.firstName || 'Rahul'} ${donation.donor?.lastName || 'Sharma'}`;
  const amountVal = donation.amount || 25000;
  const amountWords = numberToWordsINR(amountVal);
  const receiptNum = donation.receiptNumber || `80G/TCET/2025-26/${(donation.donationId || '00142').slice(-5).toUpperCase()}`;
  const panNum = donation.panNumber || donation.donor?.panNumber || 'ABCDE1234F';
  const campaignName = donation.campaign?.title || 'Student AI Innovation Lab Grant';
  const certDate = formatDate(donation.completedAt || donation.createdAt);

  const width = doc.page.width; // 595.28
  const height = doc.page.height; // 841.89

  // Outer parchment background
  doc.rect(20, 20, width - 40, height - 40).fill('#fcfaf6');

  // Outer Navy Border (6pt)
  doc.lineWidth(5).strokeColor('#0f2b48').rect(26, 26, width - 52, height - 52).stroke();

  // Inset Gold Border (2pt)
  doc.lineWidth(1.5).strokeColor('#d4af37').rect(32, 32, width - 64, height - 64).stroke();

  // Inset Thin Navy Line
  doc.lineWidth(0.75).strokeColor('#0f2b48').rect(36, 36, width - 72, height - 72).stroke();

  // Corner Accents (Gold)
  const drawCorner = (x, y, dx, dy) => {
    doc.lineWidth(2).strokeColor('#d4af37')
      .moveTo(x, y + dy * 12).lineTo(x, y).lineTo(x + dx * 12, y).stroke();
  };
  drawCorner(42, 42, 1, 1);
  drawCorner(width - 42, 42, -1, 1);
  drawCorner(42, height - 42, 1, -1);
  drawCorner(width - 42, height - 42, -1, -1);

  // Top Registration Row
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f2b48');
  doc.text('TRUST REGISTRATION NO: E-12345 (Mumbai)', 50, 48, { width: 250, align: 'left' });
  doc.text('ESTD. 2001', width - 200, 48, { width: 150, align: 'right' });

  // Thin line below reg
  doc.lineWidth(0.5).strokeColor('#d4af37').moveTo(50, 62).lineTo(width - 50, 62).stroke();

  // College Crest Badge (Center)
  const centerX = width / 2;
  doc.circle(centerX, 85, 20).lineWidth(1.5).strokeColor('#d4af37').fillAndStroke('#ffffff', '#d4af37');
  doc.circle(centerX, 85, 17).lineWidth(0.5).strokeColor('#0f2b48').stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f2b48').text('TCET', centerX - 20, 78, { width: 40, align: 'center' });
  doc.font('Helvetica').fontSize(5).fillColor('#b45309').text('ESTD. 2001', centerX - 20, 90, { width: 40, align: 'center' });

  // College Title & Sub-address
  doc.font('Times-Bold').fontSize(17).fillColor('#0a192f')
    .text('Thakur College of Engineering and Technology (TCET)', 50, 116, { width: width - 100, align: 'center' });

  doc.font('Helvetica').fontSize(8).fillColor('#334155')
    .text('Thakur Educational Campus, Shyamnarayan Thakur Marg, Thakur Village, Kandivali (East), Mumbai 400101', 50, 137, { width: width - 100, align: 'center' });

  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748b')
    .text('(Approved by AICTE, Govt. of Maharashtra & Affiliated to University of Mumbai | ISO 9001:2015 Certified)', 50, 149, { width: width - 100, align: 'center' });

  // Main Header
  doc.font('Times-Bold').fontSize(16).fillColor('#0a192f')
    .text('DONATION CERTIFICATE', 50, 172, { width: width - 100, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e293b')
    .text('UNDER SECTION 80G OF THE INCOME TAX ACT, 1961', 50, 192, { width: width - 100, align: 'center' });

  doc.font('Helvetica').fontSize(8).fillColor('#475569')
    .text('(Approval No. CIT(E)/80G/TCET/2023-24/101    Validity Period: 01.04.2023 to 31.03.2026)', 50, 206, { width: width - 100, align: 'center' });

  // Body certification paragraph
  let y = 230;
  doc.font('Times-Roman').fontSize(10.5).fillColor('#0f172a');
  doc.text(`This is to certify that we have received a donation towards the activities of [AlumNetra] at [Thakur College of Engineering and Technology (TCET), Mumbai].`, 50, y, {
    width: width - 100,
    align: 'left',
    lineGap: 3
  });

  y += 44;

  // Form Fields with full-width underline
  const drawField = (label, value, fontBold = true) => {
    doc.font('Times-Bold').fontSize(10.5).fillColor('#0f172a').text(label, 50, y, { continued: false });
    const labelWidth = doc.widthOfString(label);

    doc.font(fontBold ? 'Times-Bold' : 'Times-Roman').fontSize(11).fillColor('#0f172a')
      .text(value, 50 + labelWidth + 8, y - 0.5);

    doc.lineWidth(0.5).strokeColor('#64748b')
      .moveTo(50, y + 14).lineTo(width - 50, y + 14).stroke();

    y += 24;
  };

  drawField('Donor Name:', donorName);
  drawField('PAN:', panNum);
  drawField('Donation Amount:', `INR ${amountVal.toLocaleString('en-IN')}`);
  drawField('', `(${amountWords})`, false);

  // Receipt No & Date Row
  doc.font('Times-Bold').fontSize(10.5).fillColor('#0f172a').text('Receipt No:', 50, y);
  const rWidth = doc.widthOfString('Receipt No:');
  doc.font('Times-Bold').fontSize(10.5).text(receiptNum, 50 + rWidth + 8, y);

  doc.font('Times-Bold').fontSize(10.5).text('Date:', width / 2 + 30, y);
  const dWidth = doc.widthOfString('Date:');
  doc.font('Times-Bold').fontSize(10.5).text(certDate, width / 2 + 30 + dWidth + 8, y);

  doc.lineWidth(0.5).strokeColor('#64748b').moveTo(50, y + 14).lineTo(width - 50, y + 14).stroke();
  y += 24;

  drawField('Donation Toward / Campaign:', campaignName);

  y += 6;

  // Tax disclaimer clause
  doc.font('Times-Roman').fontSize(8.5).fillColor('#475569')
    .text('Donations to this Trust are eligible for deduction under Section 80G of the Income Tax Act, 1961, subject to the conditions specified therein. This certificate is valid for income tax deduction purposes.', 50, y, {
      width: width - 100,
      align: 'left',
      lineGap: 2
    });

  // Footer Divider Line
  y = height - 160;
  doc.lineWidth(0.5).strokeColor('#cbd5e1').moveTo(50, y).lineTo(width - 50, y).stroke();
  y += 15;

  // Left: QR Code Verification
  try {
    const qrData = `https://alumnetra.tcetmumbai.in/verify/receipt/${donation.donationId || receiptNum}`;
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 70, margin: 1 });
    doc.image(qrBuffer, 50, y, { width: 60, height: 60 });

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text('Scan to Verify', 118, y + 6);
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text('Certificate Authenticity', 118, y + 18);
    doc.font('Helvetica').fontSize(6.5).fillColor('#94a3b8').text(`ID: ${donation.donationId || 'E1234518020702'}`, 118, y + 30);
  } catch (qrErr) {
    console.error('QR generation error in PDF:', qrErr);
  }

  // Center: Golden Embossed Seal Badge
  const sealX = width / 2;
  const sealY = y + 30;
  doc.circle(sealX, sealY, 26).lineWidth(2).strokeColor('#b45309').fillAndStroke('#fef3c7', '#b45309');
  doc.circle(sealX, sealY, 22).lineWidth(0.75).strokeColor('#78350f').dash(2, { space: 2 }).stroke().undash();
  doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#78350f').text('THAKUR COLLEGE', sealX - 25, sealY - 12, { width: 50, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#b45309').text('TCET', sealX - 20, sealY - 4, { width: 40, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#78350f').text('MUMBAI', sealX - 25, sealY + 7, { width: 50, align: 'center' });

  // Right: Signature Block
  const sigX = width - 180;
  doc.font('Times-BoldItalic').fontSize(16).fillColor('#0f172a')
    .text('Aignarly', sigX, y + 10, { width: 130, align: 'right' });

  doc.lineWidth(1).strokeColor('#0f172a').moveTo(sigX + 10, y + 32).lineTo(width - 50, y + 32).stroke();

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a')
    .text('Authorized Signatory', sigX, y + 36, { width: 130, align: 'right' });

  doc.end();
}

module.exports = {
  generateDonationReceiptPDF
};
