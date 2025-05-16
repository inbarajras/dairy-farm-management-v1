import { jsPDF } from 'jspdf';

/**
 * Validates payment data to ensure it contains minimum required fields
 * @param {Object} payment - The payment data object
 * @returns {boolean} - Whether payment data is valid
 */
const validatePaymentData = (payment) => {
  if (!payment) return false;
  
  // Check for minimum required fields
  const requiredFields = ['id', 'gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end'];
  return requiredFields.every(field => payment[field] !== undefined);
};

/**
 * Generates a payslip PDF for an employee.
 * 
 * @param {Object} payment - The payment details
 * @param {Object} employee - The employee details
 * @returns {Promise} - Promise that resolves when the PDF is generated and downloaded
 */
const generatePayslipPDF = async (payment, employee) => {
  try {
    // Input validation
    if (!payment || !employee) {
      console.error('Missing required data for PDF generation');
      throw new Error('Missing required payment or employee data');
    }
    
    // Validate payment data has minimum required fields
    if (!validatePaymentData(payment)) {
      console.error('Payment data is missing required fields');
      throw new Error('Invalid payment data - missing required fields');
    }
    
    // Ensure all required properties exist with defaults
    const safePayment = {
      id: payment.id || 'N/A',
      gross_pay: payment.gross_pay || 0,
      net_pay: payment.net_pay || 0,
      deductions: payment.deductions || 0,
      overtime_pay: payment.overtime_pay || 0,
      bonus: payment.bonus || 0,
      tax_amount: payment.tax_amount || 0,
      other_deductions: payment.other_deductions || 0,
      pay_period_start: payment.pay_period_start || new Date(),
      pay_period_end: payment.pay_period_end || new Date(),
      created_at: payment.created_at || new Date()
    };
    
    const safeEmployee = {
      id: employee.id || 'N/A',
      name: employee.name || 'Employee',
      department: employee.department || 'N/A',
      job_title: employee.job_title || 'N/A'
    };
  // Create new jsPDF instance
  const doc = new jsPDF();
  
  // Define colors and styling - refined color palette
  const primaryColorDark = [34, 89, 68]; // Deep forest green
  const primaryColor = [67, 144, 97]; // Medium green (softer)
  const primaryColorLight = [169, 221, 183]; // Soft pastel green
  const textColor = [70, 70, 70]; // Dark gray for text
  const accentColor = [102, 146, 154]; // Teal blue accent
  
  // Add gradient header for title only
  const headerHeight = 25;
  
  // Create gradient background for header
  for (let i = 0; i < headerHeight; i++) {
    const ratio = i / headerHeight;
    // Use cubic easing for smoother gradient transition
    const easeRatio = ratio < 0.5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
    
    const r = Math.floor(primaryColorDark[0] + (primaryColorLight[0] - primaryColorDark[0]) * easeRatio);
    const g = Math.floor(primaryColorDark[1] + (primaryColorLight[1] - primaryColorDark[1]) * easeRatio);
    const b = Math.floor(primaryColorDark[2] + (primaryColorLight[2] - primaryColorDark[2]) * easeRatio);
    
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 210, headerHeight, 'F');
  }
  
  // Add company header with enhanced styling
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Pranavika Dairy Farms", 105, 16, { align: "center" });
  
  // Add decorative underline for company name
  doc.setDrawColor(255, 255, 255, 0.8);
  doc.setLineWidth(0.5);
  doc.line(65, 19, 145, 19);
  
  // Simple gradient title for PAYSLIP only - no boxes
  const titleY = 32;
  
  // Add simple gradient bar for title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(75, titleY, 60, 10, 'F');
  
  // Add PAYSLIP text in white
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", 105, titleY + 7, { align: "center" });
  
  // Format dates
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'N/A';
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    try {
      if (isNaN(Number(amount))) return 'INR 0.00';
      
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.warn('Error formatting currency:', error);
      return 'INR 0.00';
    }
  };
  
  // Add dates info with simple text, no boxes
  const dateInfoY = 55;
  
  // Add dates info with clear labels
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  
  // Pay period
  doc.text("Pay Period:", 25, dateInfoY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`${formatDate(safePayment.pay_period_start)} to ${formatDate(safePayment.pay_period_end)}`, 55, dateInfoY); // Further reduced from 60
  
  // Payment date
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Issue Date:", 120, dateInfoY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`${formatDate(safePayment.created_at)}`, 150, dateInfoY); // Further reduced from 155
  
  // Payment ID
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Payment ID:", 25, dateInfoY + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`${safePayment.id}`, 55, dateInfoY + 8); // Further reduced from 60
  
  // Clean employee information section with white background and no boxes
  const employeeInfoY = 75;
  
  // Add gradient heading only
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, employeeInfoY, 170, 8, 'F');
  
  // Simple section title
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE INFORMATION", 30, employeeInfoY + 5);
  
  // Employee details in a clean layout with white background - no boxes
  doc.setFontSize(10);
  
  // Left column
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Name:`, 30, employeeInfoY + 18);
  doc.text(`ID:`, 30, employeeInfoY + 26);
  
  // Right column labels - reduced spacing
  doc.text(`Department:`, 110, employeeInfoY + 18);
  doc.text(`Position:`, 110, employeeInfoY + 26);
  
  // Values in black text
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`${safeEmployee.name}`, 45, employeeInfoY + 18); // Further reduced from 50
  
  // Trim employee ID to first 8 characters
  const trimmedId = safeEmployee.id.toString().substring(0, 8);
  doc.text(`${trimmedId}`, 45, employeeInfoY + 26); // Further reduced from 50
  
  doc.text(`${safeEmployee.department}`, 140, employeeInfoY + 18); // Further reduced from 145
  doc.text(`${safeEmployee.job_title}`, 140, employeeInfoY + 26); // Further reduced from 145
  
  // Clean payment details section with white background, no boxes or borders
  const paymentSectionY = employeeInfoY + 45;
  
  // Add gradient heading only
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, paymentSectionY, 170, 8, 'F');
  
  // Section title
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", 30, paymentSectionY + 5);
  
  // Add earnings section with simple text - no tables
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", 30, paymentSectionY + 18);
  
  // Calculate the basic salary amount
  const basicSalary = safePayment.gross_pay - (Number(safePayment.overtime_pay) || 0) - (Number(safePayment.bonus) || 0);
  
  // Add earnings text entries with black text
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Basic Salary", 40, paymentSectionY + 28);
  doc.text(formatCurrency(basicSalary), 165, paymentSectionY + 28, { align: "right" });
  
  let currentY = paymentSectionY + 28;
  
  // Add additional earnings if any
  if (Number(safePayment.overtime_pay) > 0) {
    currentY += 8;
    doc.text("Overtime", 40, currentY);
    doc.text(formatCurrency(safePayment.overtime_pay), 165, currentY, { align: "right" });
  }
  
  if (Number(safePayment.bonus) > 0) {
    currentY += 8;
    doc.text("Bonus", 40, currentY);
    doc.text(formatCurrency(safePayment.bonus), 165, currentY, { align: "right" });
  }
  
  // Add total line for earnings with subtotal
  currentY += 8;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.5);
  doc.setLineWidth(0.1);
  doc.line(40, currentY, 165, currentY);
  
  currentY += 6;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Total Earnings", 40, currentY);
  doc.text(formatCurrency(safePayment.gross_pay), 165, currentY, { align: "right" });
  
  // Add spacing
  const earningsEndY = currentY + 10;
  
  // Deductions section with simple text - no tables
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Deductions", 30, earningsEndY);
  
  // Calculate tax amount
  const taxAmount = safePayment.tax_amount || (safePayment.gross_pay * 0.1);
  const otherDeductions = safePayment.other_deductions || (safePayment.deductions - taxAmount);
  
  // Simple text entries for deductions
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Tax", 40, earningsEndY + 10);
  doc.text(formatCurrency(taxAmount), 165, earningsEndY + 10, { align: "right" });
  
  doc.text("Other Deductions", 40, earningsEndY + 18);
  doc.text(formatCurrency(otherDeductions), 165, earningsEndY + 18, { align: "right" });
  
  // Add total line for deductions
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.5);
  doc.setLineWidth(0.1);
  doc.line(40, earningsEndY + 24, 165, earningsEndY + 24);
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Total Deductions", 40, earningsEndY + 30);
  doc.text(formatCurrency(safePayment.deductions), 165, earningsEndY + 30, { align: "right" });
  
  // Get the final Y position
  const deductionsEndY = earningsEndY + 40;
  
  // Add clean totals section without boxes or borders
  const totalsY = deductionsEndY + 5;
  
  // Add simple divider line before summary
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(50, totalsY, 160, totalsY);
  
  // Add gradient heading for payment summary
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(50, totalsY + 5, 110, 8, 'F');
  
  // Section header text
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT SUMMARY", 105, totalsY + 10, { align: "center" });
  
  // Add simple bottom line to finish the summary
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(50, totalsY + 45, 160, totalsY + 45);
  
  // Add totals text between the two lines
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  // Gross pay
  doc.text("Gross Pay:", 60, totalsY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(safePayment.gross_pay), 145, totalsY + 22, { align: "right" });
  
  // Total deductions
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Total Deductions:", 60, totalsY + 32);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(safePayment.deductions), 145, totalsY + 32, { align: "right" });
  
  // Net pay with emphasis - outside the summary box
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("NET PAY:", 70, totalsY + 58);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(safePayment.net_pay), 145, totalsY + 58, { align: "right" });
  
  // Add a very simple footer
  const footerY = totalsY + 70; // Reduced from 85 to ensure visibility
  
  // Simple straight line in brand color
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.2);
  doc.line(35, footerY, 175, footerY);
  
  // Add a very subtle footer background
  doc.setFillColor(245, 245, 245); // Very light gray background
  doc.rect(25, footerY, 160, 30, 'F');
  
  // Add footer heading
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("CONTACT INFORMATION", 105, footerY + 4, { align: "center" });
  
  // Clean footer with simple text
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  // Farm address
  doc.text("Pranavika Dairy Farms, #123, Rural Development Area, Illupanagaram", 105, footerY + 10, { align: "center" });
  
  // Contact info in one line
  doc.text("Contact: +91 9876543210  |  Email: info@pranavikadf.com  |  Website: www.pranavikadf.com", 105, footerY + 16, { align: "center" });
  
  // Legal text
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated document and does not require a signature.", 105, footerY + 22, { align: "center" });
  
  // Company name in brand color
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Pranavika Dairy Farms", 105, footerY + 28, { align: "center" });
  
  // Remove watermark since heading is already in gradient
  
  // Save the PDF with a meaningful filename
  let fileName;
  try {
    const dateStr = new Date(safePayment.pay_period_end).toISOString().split('T')[0];
    const sanitizedName = safeEmployee.name.replace(/[^a-zA-Z0-9_]/g, '_');
    fileName = `Payslip_${sanitizedName}_${dateStr}.pdf`;
  } catch (error) {
    // Fallback filename if there's an error
    fileName = `Payslip_${Date.now()}.pdf`;
    console.warn('Using fallback filename due to error:', error);
  }
  
  doc.save(fileName);
  
  console.log(`PDF generated successfully: ${fileName}`);
  return fileName;
  
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

// Export the function as default export
export default generatePayslipPDF;