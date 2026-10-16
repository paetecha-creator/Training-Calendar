import * as XLSX from 'xlsx';
import { AttendeeRow } from '../types';

export function generateAndDownloadTemplate() {
  const headers = [
    'Code (รหัสพนักงาน)',
    'Sex (เพศ: Mr./Ms./Mrs.)',
    'Name (ชื่อ)',
    'Last Name (นามสกุล)',
    'Dept./In-charge (แผนก)',
    'Position (ตำแหน่ง)',
    'Expectation (ความคาดหวัง)',
    'Application (การนำไปปรับใช้)',
    'Remark (หมายเหตุ)',
  ];

  const sampleRows = [
    [
      'EMP-0101',
      'Mr.',
      'กิตติพงษ์',
      'เจริญผล',
      'ฝ่ายผลิต (Production)',
      'Technician',
      'เรียนรู้แนวทางปฏิบัติเพื่อลดความผิดพลาดในการทำงาน',
      'นำไปปรับใช้ในการควบคุมเครื่องจักรตามมาตรฐาน SOP',
      '-',
    ],
    [
      'EMP-0102',
      'Ms.',
      'พัชรา',
      'สิริกุล',
      'ฝ่ายควบคุมคุณภาพ (QA)',
      'QC Inspector',
      'เพิ่มความเข้าใจในกระบวนการตรวจสอบและลดของเสีย',
      'ประยุกต์ใช้ในการสุ่มตรวจสินค้าสำเร็จรูป',
      '-',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registration_Template');
  XLSX.writeFile(wb, 'Training_Registration_Template.xlsx');
}

export async function parseExcelUpload(file: File): Promise<Array<Partial<AttendeeRow>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: Array<Array<string | number>> = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        const attendees: Array<Partial<AttendeeRow>> = [];

        // Start from row 1 (index 1) to skip header
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          const isEmpty = row.every((val) => String(val).trim() === '');
          if (isEmpty) continue;

          let sexVal = String(row[1] || 'Mr.').trim();
          if (!['Mr.', 'Ms.', 'Mrs.'].includes(sexVal)) {
            if (sexVal.includes('นางสาว') || sexVal.toLowerCase() === 'ms' || sexVal.toLowerCase() === 'ms.') sexVal = 'Ms.';
            else if (sexVal.includes('นาง') || sexVal.toLowerCase() === 'mrs' || sexVal.toLowerCase() === 'mrs.') sexVal = 'Mrs.';
            else sexVal = 'Mr.';
          }

          attendees.push({
            code: String(row[0] || '').trim(),
            sex: sexVal as 'Mr.' | 'Ms.' | 'Mrs.',
            fname: String(row[2] || '').trim(),
            lname: String(row[3] || '').trim(),
            dept: String(row[4] || '').trim(),
            pos: String(row[5] || '').trim(),
            exp: String(row[6] || '').trim(),
            app: String(row[7] || '').trim(),
            rem: String(row[8] || '').trim(),
          });
        }

        resolve(attendees);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function exportAttendeesToExcel(attendees: AttendeeRow[], courseTitle: string, sheetName: string) {
  const headers = [
    '#',
    'Employee Code',
    'Title / Sex',
    'First Name',
    'Last Name',
    'Department',
    'Position',
    'Expectation',
    'Application',
    'Remark',
    'Submitter Name',
    'Submitter Dept',
    'Submitter Phone',
  ];

  const rows = attendees.map((a, idx) => [
    idx + 1,
    a.code,
    a.sex,
    a.fname,
    a.lname,
    a.dept,
    a.pos,
    a.exp,
    a.app,
    a.rem || '-',
    a.submitterName || '-',
    a.submitterDept || '-',
    a.submitterPhone || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([[ `รายงานผู้ลงทะเบียน: ${courseTitle} (${sheetName})` ], [], headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${sheetName}_Attendees_Export.xlsx`);
}

export function exportAttendeesToCsv(attendees: AttendeeRow[], sheetName: string) {
  const headers = [
    'Code',
    'Sex',
    'Name',
    'LastName',
    'Department',
    'Position',
    'Expectation',
    'Application',
    'Remark',
    'SubmitterName',
    'SubmitterDept',
    'SubmitterPhone',
  ];

  const rows = attendees.map((a) => [
    `"${a.code.replace(/"/g, '""')}"`,
    `"${a.sex.replace(/"/g, '""')}"`,
    `"${a.fname.replace(/"/g, '""')}"`,
    `"${a.lname.replace(/"/g, '""')}"`,
    `"${a.dept.replace(/"/g, '""')}"`,
    `"${a.pos.replace(/"/g, '""')}"`,
    `"${a.exp.replace(/"/g, '""')}"`,
    `"${a.app.replace(/"/g, '""')}"`,
    `"${(a.rem || '').replace(/"/g, '""')}"`,
    `"${(a.submitterName || '').replace(/"/g, '""')}"`,
    `"${(a.submitterDept || '').replace(/"/g, '""')}"`,
    `"${(a.submitterPhone || '').replace(/"/g, '""')}"`,
  ]);

  let csvContent = headers.join(',') + '\r\n';
  rows.forEach((r) => {
    csvContent += r.join(',') + '\r\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${sheetName}_ExportData.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
