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