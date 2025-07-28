import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

// Helper function to format duration
const formatDuration = (duration: number) => {
  if (!duration) return '';
  return `${duration} minutes`;
};

// Helper function to format date in DD/MM/YYYY format
const formatDateDDMMYYYY = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Export Sessions data in ICF Client Coaching Log format
export const exportSessionsToICFLog = (sessionsData: any[], filename: string = 'ICF-Client-Coaching-Log') => {
  try {
    console.log('Exporting Sessions to ICF Log format:', sessionsData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet data with ICF format
    const worksheetData = [
      // Title row with ICF branding
      ['ICF Client Coaching Log', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      
      // Column headers (bright yellow background, black text, bold)
      ['Client Name', 'Contact Information', 'Individual/Group', 'Number in Group', 'Start Date', 'End Date', 'Paid hours', 'Pro-bono hours'],
      
      // Data rows (white background, black text)
      ...sessionsData.map(item => [
        item.clientName || item.client_name || '',
        item.clientEmail || item.client_email || '',
        item.sessionType === 'group' ? 'Group' : 'Individual',
        item.numberInGroup || item.number_in_group || 1,
        formatDateDDMMYYYY(item.date),
        formatDateDDMMYYYY(item.finishDate || item.finish_date),
        item.paymentType === 'paid' ? (item.duration / 60) : 0, // Convert minutes to hours
        item.paymentType === 'pro-bono' ? (item.duration / 60) : 0 // Convert minutes to hours
      ])
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Client Name
      { width: 25 }, // Contact Information
      { width: 15 }, // Individual/Group
      { width: 15 }, // Number in Group
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 12 }, // Paid hours
      { width: 12 }  // Pro-bono hours
    ];
    
    // Apply styling
    // Title row styling (light blue background)
    for (let col = 0; col < 8; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "E6F3FF" } }, // Light blue
        font: { bold: true, sz: 14 }
      };
    }
    
    // Header row styling (bright yellow background, black text, bold)
    for (let col = 0; col < 8; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: col });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "FFFF00" } }, // Bright yellow
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center" }
      };
    }
    
    // Data rows styling (white background)
    for (let row = 3; row < worksheetData.length; row++) {
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "FFFFFF" } }, // White background
          font: { color: { rgb: "000000" } }
        };
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ICF Client Coaching Log');
    
    // Write to file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `${filename}.xlsx`);
    console.log('ICF Log format export successful');
  } catch (error) {
    console.error('ICF Log format export failed:', error);
  }
};

// Test export function to debug issues
export const testExport = () => {
  try {
    console.log('Testing export functionality...');
    const testData = [
      { name: 'Test Client', date: '2024-01-25', duration: 60 }
    ];
    
    const csvContent = 'Name,Date,Duration\nTest Client,2024-01-25,60 minutes';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'test-export.csv');
    console.log('Test export successful');
  } catch (error) {
    console.error('Test export failed:', error);
  }
};

// Export CPD data to CSV
export const exportCPDToCSV = (cpdData: any[], filename: string = 'cpd-data') => {
  try {
    console.log('Exporting CPD to CSV:', cpdData);
    const headers = [
      'Title',
      'Date',
      'Hours',
      'Type',
      'Description',
      'Certificate Link',
      'Created At'
    ];

    const csvData = cpdData.map(item => [
      item.title || '',
      formatDate(item.date),
      item.hours || '',
      item.cpdType || item.type || '',
      item.description || '',
      item.certificate_link || '',
      formatDate(item.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    console.log('CPD CSV export successful');
  } catch (error) {
    console.error('CPD CSV export failed:', error);
  }
};

// Export CPD data to XLSX
export const exportCPDToXLSX = (cpdData: any[], filename: string = 'cpd-data') => {
  try {
    console.log('Exporting CPD to XLSX:', cpdData);
    const worksheet = XLSX.utils.json_to_sheet(
      cpdData.map(item => ({
        'Title': item.title || '',
        'Date': formatDate(item.date),
        'Hours': item.hours || '',
        'Type': item.cpdType || item.type || '',
        'Description': item.description || '',
        'Certificate Link': item.certificate_link || '',
        'Created At': formatDate(item.created_at)
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CPD Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    console.log('CPD XLSX export successful');
  } catch (error) {
    console.error('CPD XLSX export failed:', error);
  }
};

// Export Sessions data to CSV
export const exportSessionsToCSV = (sessionsData: any[], filename: string = 'sessions-data') => {
  try {
    console.log('Exporting Sessions to CSV:', sessionsData);
    const headers = [
      'Client Name',
      'Start Date',
      'End Date',
      'Duration',
      'Session Type',
      'Number in Group',
      'Payment Type',
      'Payment Amount',
      'Focus Area',
      'Key Outcomes',
      'Client Progress',
      'Coaching Tools',
      'ICF Competencies',
      'Notes',
      'Additional Notes',
      'Created At'
    ];

    const csvData = sessionsData.map(item => [
      item.clientName || item.client_name || '',
      formatDate(item.date),
      formatDate(item.finishDate || item.finish_date),
      formatDuration(item.duration),
      Array.isArray(item.types) ? item.types.join(', ') : item.types || '',
      item.numberInGroup || item.number_in_group || 1,
      item.paymentType || item.payment_type || '',
      item.paymentAmount || item.payment_amount || '',
      item.focusArea || item.focus_area || '',
      item.keyOutcomes || item.key_outcomes || '',
      item.clientProgress || item.client_progress || '',
      Array.isArray(item.coachingTools) ? item.coachingTools.join(', ') : item.coaching_tools ? item.coaching_tools.join(', ') : '',
      Array.isArray(item.icfCompetencies) ? item.icfCompetencies.join(', ') : item.icf_competencies ? item.icf_competencies.join(', ') : '',
      item.notes || '',
      item.additionalNotes || item.additional_notes || '',
      formatDate(item.created_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    console.log('Sessions CSV export successful');
  } catch (error) {
    console.error('Sessions CSV export failed:', error);
  }
};

// Export Sessions data to XLSX
export const exportSessionsToXLSX = (sessionsData: any[], filename: string = 'sessions-data') => {
  try {
    console.log('Exporting Sessions to XLSX:', sessionsData);
    const worksheet = XLSX.utils.json_to_sheet(
      sessionsData.map(item => ({
        'Client Name': item.clientName || item.client_name || '',
        'Start Date': formatDate(item.date),
        'End Date': formatDate(item.finishDate || item.finish_date),
        'Duration': formatDuration(item.duration),
        'Session Type': Array.isArray(item.types) ? item.types.join(', ') : item.types || '',
        'Number in Group': item.numberInGroup || item.number_in_group || 1,
        'Payment Type': item.paymentType || item.payment_type || '',
        'Payment Amount': item.paymentAmount || item.payment_amount || '',
        'Focus Area': item.focusArea || item.focus_area || '',
        'Key Outcomes': item.keyOutcomes || item.key_outcomes || '',
        'Client Progress': item.clientProgress || item.client_progress || '',
        'Coaching Tools': Array.isArray(item.coachingTools) ? item.coachingTools.join(', ') : item.coaching_tools ? item.coaching_tools.join(', ') : '',
        'ICF Competencies': Array.isArray(item.icfCompetencies) ? item.icfCompetencies.join(', ') : item.icf_competencies ? item.icf_competencies.join(', ') : '',
        'Notes': item.notes || '',
        'Additional Notes': item.additionalNotes || item.additional_notes || '',
        'Created At': formatDate(item.created_at)
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    console.log('Sessions XLSX export successful');
  } catch (error) {
    console.error('Sessions XLSX export failed:', error);
  }
}; 