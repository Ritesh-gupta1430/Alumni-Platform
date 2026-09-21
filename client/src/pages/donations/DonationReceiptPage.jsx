import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Download,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { donationsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';

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

export default function DonationReceiptPage() {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const certRef = useRef(null);

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await donationsAPI.getReceipt(donationId);
      const data = res.data.data;
      if (data.status && data.status !== 'success') {
        setErrorMessage('This donation is not settled. 80G Tax Exemption Certificates are strictly generated only for successful donations.');
      } else {
        setReceipt(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load donation receipt. Only successful donations are eligible for receipts.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [donationId, toast]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  // Isolated Native Print to strictly avoid dark theme & ensure 100% vector sharpness
  const handlePrint = () => {
    if (!certRef.current) {
      window.print();
      return;
    }

    const certHtml = certRef.current.outerHTML;
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donation_Receipt_${(receipt?.receiptNumber || '80G-TCET').replace(/[/\\?%*:|"<>]/g, '_')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Times New Roman', Times, serif;
              width: 100%;
              height: 100%;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .receipt-outer-frame {
              box-shadow: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              background: #fcfaf6 !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${certHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 400);
  };

  // Direct Native Vector PDF Download via Backend API & Client Fallback
  const handleDownloadPDF = async () => {
    setDownloading(true);
    const filename = `TCET_80G_Donation_Certificate_${(receipt?.receiptNumber || receipt?.donationId || '00142').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

    try {
      // Primary: Request pristine vector PDF from server
      const res = await donationsAPI.downloadReceiptPDF(donationId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Donation certificate PDF downloaded successfully!');
      setDownloading(false);
      return;
    } catch (apiErr) {
      console.warn('Backend PDF endpoint fallback to client generator:', apiErr);
    }

    // Secondary Fallback: Client canvas generation
    try {
      if (!certRef.current) throw new Error('Certificate element not ready');
      const element = certRef.current;
      
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.background = '#ffffff';
      container.style.color = '#0f172a';
      
      const clone = element.cloneNode(true);
      clone.style.maxWidth = '100%';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0';
      container.appendChild(clone);
      document.body.appendChild(container);

      const canvas = await html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#fcfaf6',
        logging: false,
        width: 794,
        windowWidth: 794
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      const printableWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, Math.min(imgHeight, pageHeight - (margin * 2)));
      pdf.save(filename);
      toast.success('Donation certificate PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to download PDF. Please use the Print / Save as PDF option.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMessage || !receipt) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-12 space-y-4">
        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Certificate Unavailable
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {errorMessage || 'Official Section 80G tax exemption certificates are issued exclusively for confirmed and successful transactions.'}
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate('/contributions')} variant="primary">
            Return to Giving Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Ensure only successful donation can render the certificate
  if (receipt.status && receipt.status !== 'success') {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-12 space-y-4">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Payment Not Successful
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Donation status is currently <span className="font-semibold capitalize text-rose-400">"{receipt.status}"</span>. Receipts are not generated for failed or pending transactions.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate('/contributions')} variant="primary">
            Return to Giving Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const donorName = receipt.isAnonymous
    ? 'Anonymous Donor'
    : `${receipt.donor?.firstName || 'Rahul'} ${receipt.donor?.lastName || 'Sharma'}`;
  const amountVal = receipt.amount || 25000;
  const amountWords = numberToWordsINR(amountVal);
  const receiptNum = receipt.receiptNumber || `80G/TCET/2025-26/${(receipt.donationId || '00142').slice(-5).toUpperCase()}`;
  const panNum = receipt.panNumber || receipt.donor?.panNumber || 'ABCDE1234F';
  const campaignName = receipt.campaign?.title || 'Student AI Innovation Lab Grant';
  const certDate = formatDate(receipt.completedAt || receipt.createdAt || new Date(), 'dd MMMM yyyy');

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Action Bar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print px-2">
        <button
          onClick={() => navigate('/contributions')}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} /> Back to Giving Dashboard
        </button>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="primary"
            size="sm"
            className="flex items-center gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating PDF...' : 'Download Official PDF'}
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXACT 1:1 INSTITUTIONAL 80G DONATION CERTIFICATE LAYOUT   */}
      {/* ======================================================== */}
      <div
        ref={certRef}
        id="donation-receipt-print"
        className="receipt-outer-frame relative bg-[#fdfbf7] text-[#0f172a] shadow-2xl p-4 sm:p-6 print:p-0 print:shadow-none print:m-0 mx-auto"
        style={{
          fontFamily: "'Times New Roman', 'Georgia', serif",
          color: '#0f172a',
          background: '#fcfaf6',
          maxWidth: '820px'
        }}
      >
        {/* Ornate Navy & Gold Outer Frame */}
        <div
          className="relative bg-[#fdfbf7] p-5 sm:p-7"
          style={{
            border: '6px solid #0f2b48',
            boxShadow: 'inset 0 0 0 2px #d4af37, inset 0 0 0 5px #0f2b48, inset 0 0 0 7px #d4af37'
          }}
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]" />

          {/* Inner Content Container */}
          <div className="border border-[#0f2b48]/30 p-4 sm:p-6 relative">

            {/* Top Registration Row */}
            <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold tracking-wider text-[#0f2b48] border-b border-[#0f2b48]/20 pb-2 mb-3">
              <span>TRUST REGISTRATION NO: E-12345 (Mumbai)</span>
              <span>ESTD. 2001</span>
            </div>

            {/* Center College Crest (SVG) */}
            <div className="flex flex-col items-center justify-center mb-2">
              <svg width="68" height="68" viewBox="0 0 100 100" className="drop-shadow-sm">
                <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#b45309" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="41" fill="#fefcf6" stroke="#0f2b48" strokeWidth="1" strokeDasharray="2,2" />
                <path d="M50 18 L68 28 L68 55 C68 70 50 82 50 82 C50 82 32 70 32 55 L32 28 Z" fill="#0f2b48" stroke="#d4af37" strokeWidth="1.5" />
                <path d="M50 25 L62 33 L62 53 C62 64 50 73 50 73 C50 73 38 64 38 53 L38 33 Z" fill="#1e3a8a" />
                {/* Torch / Flame & Book Icon in Center */}
                <polygon points="50,30 54,40 50,46 46,40" fill="#f59e0b" />
                <path d="M42 54 Q50 50 58 54 Q50 58 42 54" fill="#ffffff" />
                <rect x="44" y="60" width="12" height="2" fill="#d4af37" />
                {/* Estd Ribbon */}
                <rect x="25" y="80" width="50" height="12" rx="2" fill="#b45309" stroke="#ffffff" strokeWidth="0.5" />
                <text x="50" y="89" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8" fontFamily="Arial, sans-serif">ESTD. 2001</text>
              </svg>
            </div>

            {/* College Name & Sub-details */}
            <div className="text-center space-y-0.5 mb-3.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight" style={{ fontFamily: "'Times New Roman', serif" }}>
                Thakur College of Engineering and Technology (TCET)
              </h1>
              <p className="text-[11px] text-slate-700 font-medium leading-tight">
                Thakur Educational Campus, Shyamnarayan Thakur Marg, Thakur Village, Kandivali (East), Mumbai 400101
              </p>
              <p className="text-[10px] text-slate-500 italic leading-tight">
                (Approved by AICTE, Govt. of Maharashtra & Affiliated to University of Mumbai | ISO 9001:2015 Certified)
              </p>
            </div>

            {/* Certificate Title Header */}
            <div className="text-center space-y-0.5 my-3">
              <h2 className="text-lg sm:text-[21px] font-black text-[#0a192f] tracking-widest uppercase">
                DONATION CERTIFICATE
              </h2>
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-wider uppercase">
                UNDER SECTION 80G OF THE INCOME TAX ACT, 1961
              </h3>
              <p className="text-[10px] text-slate-600">
                (Approval No. <span className="font-semibold text-slate-900">CIT(E)/80G/TCET/2023-24/101</span> &nbsp; Validity Period: <span className="font-semibold text-slate-900">01.04.2023 to 31.03.2026</span>)
              </p>
            </div>

            {/* Certificate Statement Body */}
            <div className="text-xs sm:text-[13px] leading-relaxed text-slate-900 my-3 space-y-2">
              <p>
                This is to certify that we have received a donation towards the activities of{' '}
                <strong>[AlumNetra]</strong> at{' '}
                <strong>[Thakur College of Engineering and Technology (TCET), Mumbai]</strong>.
              </p>

              {/* Form-Fill Style Underlined Fields with Full Width Line */}
              <div className="space-y-2 pt-1 text-xs sm:text-[13px]">
                <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                  <span className="font-bold whitespace-nowrap text-slate-900 mr-2">Donor Name:</span>
                  <span className="font-bold text-slate-900 text-sm flex-1">
                    {donorName}
                  </span>
                </div>

                <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                  <span className="font-bold whitespace-nowrap text-slate-900 mr-2">PAN:</span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider flex-1">
                    {panNum}
                  </span>
                </div>

                <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                  <span className="font-bold whitespace-nowrap text-slate-900 mr-2">Donation Amount:</span>
                  <span className="font-bold text-slate-900 flex-1">
                    INR {amountVal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                  <span className="text-slate-800 italic flex-1 font-medium">
                    ({amountWords})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                    <span className="font-bold whitespace-nowrap text-slate-900 mr-2">Receipt No:</span>
                    <span className="font-mono font-bold text-slate-900 flex-1">
                      {receiptNum}
                    </span>
                  </div>
                  <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                    <span className="font-bold whitespace-nowrap text-slate-900 mr-2">Date:</span>
                    <span className="font-bold text-slate-900 flex-1">
                      {certDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-end border-b border-slate-700/80 pb-0.5">
                  <span className="font-bold whitespace-nowrap text-slate-900 mr-2">Donation Toward / Campaign:</span>
                  <span className="font-bold text-slate-900 flex-1">
                    {campaignName}
                  </span>
                </div>
              </div>

              {/* Tax Exemption Clause */}
              <p className="text-[10.5px] text-slate-700 pt-1 leading-tight">
                Donations to this Trust are eligible for deduction under Section 80G of the Income Tax Act, 1961, subject to the conditions specified therein. This certificate is valid for income tax deduction purposes.
              </p>
            </div>

            {/* Bottom Row: QR Code, Gold Scalloped Seal, Signature */}
            <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-slate-300/80 mt-3">
              
              {/* Left: QR Code Verification */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white border border-slate-400 rounded">
                  <QrCode size={40} className="text-slate-900" />
                </div>
                <div className="text-[10px] text-slate-700 space-y-0.5">
                  <strong className="block text-slate-900 font-bold uppercase tracking-wider text-[9px]">Scan to Verify</strong>
                  <p className="leading-tight text-[10px]">Certificate Authenticity</p>
                  <p className="font-mono text-[8px] text-slate-500">Unique certificate ID: E1234518020702</p>
                </div>
              </div>

              {/* Center: Golden Embossed Scalloped Seal (SVG) */}
              <div className="flex flex-col items-center">
                <svg width="68" height="68" viewBox="0 0 120 120" className="drop-shadow-md">
                  <defs>
                    <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                      <stop offset="0%" stopColor="#fffbeb" />
                      <stop offset="40%" stopColor="#fde68a" />
                      <stop offset="80%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#92400e" />
                    </radialGradient>
                  </defs>
                  {/* Sunburst Teeth / Scallop */}
                  <g fill="url(#goldGrad)" stroke="#b45309" strokeWidth="0.75">
                    {[...Array(24)].map((_, i) => (
                      <polygon
                        key={i}
                        points="60,6 64,18 56,18"
                        transform={`rotate(${i * 15} 60 60)`}
                      />
                    ))}
                    <circle cx="60" cy="60" r="48" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.5" />
                  </g>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#78350f" strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx="60" cy="60" r="32" fill="#fffbeb" stroke="#b45309" strokeWidth="1" />
                  {/* Seal Center Icon & Text */}
                  <path d="M60 38 L68 44 L68 56 C68 64 60 70 60 70 C60 70 52 64 52 56 L52 44 Z" fill="#b45309" />
                  <polygon points="60,42 63,48 60,52 57,48" fill="#fef3c7" />
                  <text x="60" y="78" fill="#78350f" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5" fontFamily="Arial, sans-serif">MUMBAI</text>
                  <text x="60" y="27" fill="#78350f" fontSize="5.5" fontWeight="800" textAnchor="middle" letterSpacing="0.4" fontFamily="Arial, sans-serif">THAKUR COLLEGE</text>
                </svg>
              </div>

              {/* Right: Signature Block */}
              <div className="text-right space-y-0.5">
                <div className="font-serif italic text-2xl font-bold text-slate-900 tracking-wider pr-1" style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive, serif" }}>
                  Aignarly
                </div>
                <div className="w-36 h-[1.5px] bg-slate-800 ml-auto" />
                <span className="text-[11px] font-bold text-slate-900 block tracking-wider">
                  Authorized Signatory
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Dedicated Print Stylesheet strictly isolating certificate from app theme */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          /* Completely strip dark backgrounds from root & all ancestors */
          html, body, #root, main, div, section, article {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all surrounding app chrome, nav, sidebar, action buttons */
          .no-print, nav, aside, header, footer, .sidebar, button {
            display: none !important;
            visibility: hidden !important;
          }
          #donation-receipt-print {
            display: block !important;
            visibility: visible !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            background: #fdfbf7 !important;
          }
          .receipt-outer-frame {
            border: none !important;
            background: #fdfbf7 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
