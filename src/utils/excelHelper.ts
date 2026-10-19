import * as XLSX from 'xlsx';
import { AttendeeRow, TrainingEvent, TrainingCategory } from '../types';
import { CATEGORY_COLORS, getContrastColor } from '../services/firebaseService';

// ==================== ATTENDEES EXCEL TEMPLATE & PARSER ====================

/**
 * Generate and download registration template matching user's image.png exactly
 */
export function generateAndDownloadTemplate() {
  const headers = [
    'Code (รหัสพนักงาน)',
    'Sex (เพศ: Mr./Ms./Mrs.)',
    'Name (ชื่อ)',
    'Last Name (นามสกุล)',
    'Dept./In-charge (แผนก)',
    'Position (ตำแหน่ง)',
    'Expectation (ความคาดหวัง)',
    'Application (การปรับใช้)',
    'Remark (เพิ่มเติม)',
  ];

  const sampleRows = [
    [
      '9579',
      'Mr.',
      'Promrin',
      'Srisang',
      'ENG / PTE',
      'Chief Technician',
      'เรียนรู้แนวทางการบริหารทีมและความฉลาดทางอารมณ์',
      'นำไปปรับใช้ในการวางแผนงานและประสานงานระหว่างแผนก',
      '-',
    ],
    [
      '12894',
      'Mr.',
      'Saravut',
      'Vohra',
      'ENG / PTE',
      'Sr.Technician',
      'เพิ่มทักษะการตัดสินใจและการสื่อสารในสถานการณ์กดดัน',
      'ประยุกต์ใช้ในการแก้ปัญหาหน้างานจริง',
      '-',
    ],
    [
      '9544',
      'Ms.',
      'Jampa',
      'Kamsri',
      'PRD/TS1',
      'Asst. General Manager',
      'พัฒนาภาวะผู้นำเชิงกลยุทธ์',
      'นำไปใช้โค้ชชิ่งและพัฒนาผู้ใต้บังคับบัญชา',
      '-',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 38 },
    { wch: 38 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registration_Template');
  XLSX.writeFile(wb, 'Training_Registration_Template.xlsx');
}

/**
 * Parse uploaded attendees Excel file
 */
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

          const expectation = String(row[6] || '').trim();
          const application = String(row[7] || '').trim();
          const remark = String(row[8] || '').trim();

          attendees.push({
            code: String(row[0] || '').trim(),
            sex: sexVal as 'Mr.' | 'Ms.' | 'Mrs.',
            fname: String(row[2] || '').trim(),
            lname: String(row[3] || '').trim(),
            dept: String(row[4] || '').trim(),
            pos: String(row[5] || '').trim(),
            expectation: expectation,
            application: application,
            remark: remark,
            // backward-compatibility aliases
            exp: expectation,
            app: application,
            rem: remark,
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

/**
 * Export attendees to Excel with all fields
 */
export function exportAttendeesToExcel(attendees: AttendeeRow[], courseTitle: string, dateOrSheet: string) {
  const headers = [
    '# (ลำดับ)',
    'Code (รหัสพนักงาน)',
    'Sex (เพศ)',
    'Name (ชื่อ)',
    'Last Name (นามสกุล)',
    'Dept./In-charge (แผนก)',
    'Position (ตำแหน่ง)',
    'Expectation (ความคาดหวัง)',
    'Application (การปรับใช้)',
    'Remark (เพิ่มเติม)',
    'Submitter Name (ผู้ส่งข้อมูล)',
    'Submitter Dept (แผนกผู้ส่ง)',
    'Submitter Phone (เบอร์ติดต่อ)',
  ];

  const rows = attendees.map((a, idx) => [
    idx + 1,
    a.code || '-',
    a.sex || 'Mr.',
    a.fname || '',
    a.lname || '',
    a.dept || '-',
    a.pos || '-',
    a.expectation || a.exp || '-',
    a.application || a.app || '-',
    a.remark || a.rem || '-',
    a.submitterName || '-',
    a.submitterDept || '-',
    a.submitterPhone || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`รายงานผู้ลงทะเบียนหลักสูตร: ${courseTitle}`],
    [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH')}`],
    [],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 35 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  const safeTitle = courseTitle.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 25);
  XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
  XLSX.writeFile(wb, `${safeTitle}_Attendees.xlsx`);
}

// ==================== BATCH COURSES TEMPLATE & PARSER ====================

/**
 * Download Excel template for batch creating/updating courses
 */
export function generateAndDownloadCourseTemplate() {
  const headers = [
    'Course ID (รหัสหลักสูตร เช่น EVT-1001 หรือเว้นว่างเพื่อสร้างใหม่)',
    'Category (หมวดหมู่)',
    'Title * (ชื่อหลักสูตร)',
    'Start Date * (วันที่เริ่ม YYYY-MM-DD)',
    'End Date (วันที่สิ้นสุด YYYY-MM-DD)',
    'Start Time (เวลาเริ่ม เช่น 09:00)',
    'End Time (เวลาสิ้นสุด เช่น 16:00)',
    'Location (สถานที่อบรม)',
    'Description (รายละเอียดหลักสูตร)',
    'Status (สถานะ: เปิด / ปิด / ไม่ต้องลงทะเบียน)',
    'Form Sheet (รหัสฟอร์ม เช่น Register-1)',
    'Open Date (วันเปิดรับ YYYY-MM-DD)',
    'Close Date (วันปิดรับ YYYY-MM-DD)',
  ];

  const sampleRows = [
    [
      'EVT-1006',
      'Soft Skill Training',
      'Problem Solving & Critical Thinking in Manufacturing',
      '2026-11-12',
      '2026-11-12',
      '09:00',
      '16:30',
      'Training Room 1 & Virtual MS Teams',
      'การคิดวิเคราะห์เชิงวิพากษ์และการแก้ปัญหาหน้างานอย่างเป็นระบบด้วยเทคนิค 5-Why และ Fishbone Diagram',
      'เปิด',
      'Register-5',
      '2026-10-25',
      '2026-11-08',
    ],
    [
      '',
      'Technical Skills Training',
      'Total Productive Maintenance (TPM) Principles',
      '2026-11-18',
      '2026-11-19',
      '08:30',
      '16:00',
      'Engineering Workshop & Floor',
      'หลักการบำรุงรักษาทวีผลที่ทุกคนมีส่วนร่วม เพื่อเพิ่มประสิทธิภาพ OEE และลดการหยุดชะงักของเครื่องจักร',
      'เปิด',
      'Register-6',
      '2026-11-01',
      '2026-11-15',
    ],
    [
      '',
      'HSE and ISO Training',
      'Chemical Safety & Emergency Spill Response',
      '2026-11-26',
      '2026-11-26',
      '13:00',
      '16:00',
      'Auditorium Building A',
      'การจัดการสารเคมีอันตรายอย่างปลอดภัยตามมาตรฐานความปลอดภัย พร้อมการฝึกซ้อมระงับเหตุฉุกเฉิน',
      'เปิด',
      'Register-7',
      '2026-11-05',
      '2026-11-22',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 38 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 45 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Courses_Template');
  XLSX.writeFile(wb, 'Training_Courses_Batch_Template.xlsx');
}

/**
 * Parse uploaded courses Excel file into TrainingEvent objects
 */
export async function parseCourseExcelUpload(file: File): Promise<TrainingEvent[]> {
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

        const courses: TrainingEvent[] = [];

        // Skip header at index 0
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          const isEmpty = row.every((val) => String(val).trim() === '');
          if (isEmpty) continue;

          const title = String(row[2] || '').trim();
          const start = String(row[3] || '').trim();
          if (!title || !start) continue;

          let category = String(row[1] || 'Other').trim() as TrainingCategory;
          const validCategories: TrainingCategory[] = [
            'Soft Skill Training',
            'Technical Skills Training',
            'HSE and ISO Training',
            'Orientation',
            'Other',
          ];
          if (!validCategories.includes(category)) {
            category = 'Other';
          }

          let status = String(row[9] || 'เปิด').trim();
          if (!['เปิด', 'ปิด', 'ไม่ต้องลงทะเบียน'].includes(status)) {
            status = 'เปิด';
          }

          const rawId = String(row[0] || '').trim();
          const courseId = rawId || `EVT-${Date.now()}-${i}`;
          const color = CATEGORY_COLORS[category] || '#FFF2CC';

          courses.push({
            id: courseId,
            category,
            title,
            start,
            end: String(row[4] || start).trim(),
            startTime: String(row[5] || '09:00').trim(),
            endTime: String(row[6] || '16:00').trim(),
            location: String(row[7] || '').trim(),
            description: String(row[8] || '').trim(),
            color,
            textColor: getContrastColor(color),
            status,
            formSheet: String(row[10] || '').trim(),
            openDate: String(row[11] || '').trim(),
            closeDate: String(row[12] || '').trim(),
            isEvent: true,
            isHoliday: false,
          });
        }

        resolve(courses);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
