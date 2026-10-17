import { TrainingEvent, AttendeeRow, RegistrationPayload, TrainingCategory } from '../types';

export const SPREADSHEET_ID = '1gqp55Bp-HyDihtbHQGpyeVglHAXCQwXTxnefK8xVozs';
export const MASTER_SHEET = 'Master';
export const HOLIDAY_SHEET = 'Holiday';

export function getContrastColor(hexcolor: string): string {
  if (!hexcolor) return '#1e293b';
  let cleanHex = hexcolor.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#1e293b' : '#ffffff';
}

export const CATEGORY_COLORS: Record<TrainingCategory, string> = {
  'Soft Skill Training': '#FFF2CC',
  'Technical Skills Training': '#DDEBF7',
  'HSE and ISO Training': '#F8CBAD',
  Orientation: '#E2EFDA',
  Other: '#EAEAEA',
};

// Thai official holidays list
const OFFICIAL_HOLIDAYS = [
  { date: '2026-01-01', title: 'วันขึ้นปีใหม่' },
  { date: '2026-03-03', title: 'วันมาฆบูชา' },
  { date: '2026-04-06', title: 'วันจักรี' },
  { date: '2026-04-13', title: 'วันสงกรานต์' },
  { date: '2026-04-14', title: 'วันสงกรานต์' },
  { date: '2026-04-15', title: 'วันสงกรานต์' },
  { date: '2026-05-01', title: 'วันแรงงานแห่งชาติ' },
  { date: '2026-05-04', title: 'วันฉัตรมงคล' },
  { date: '2026-05-31', title: 'วันวิสาขบูชา' },
  { date: '2026-06-03', title: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { date: '2026-07-28', title: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว' },
  { date: '2026-07-29', title: 'วันอาสาฬหบูชา' },
  { date: '2026-07-30', title: 'วันเข้าพรรษา' },
  { date: '2026-08-12', title: 'วันแม่แห่งชาติ' },
  { date: '2026-10-13', title: 'วันนวมินทรมหาราช' },
  { date: '2026-10-23', title: 'วันปิยมหาราช' },
  { date: '2026-12-05', title: 'วันพ่อแห่งชาติ / วันชาติ' },
  { date: '2026-12-10', title: 'วันรัฐธรรมนูญ' },
  { date: '2026-12-31', title: 'วันสิ้นปี' },
];

/**
 * Format ISO or sheet date string to YYYY-MM-DD in Asia/Bangkok timezone
 */
export function parseIsoDateToBangkok(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return str;
}

/**
 * Format ISO or sheet time string to HH:mm in Asia/Bangkok timezone
 */
export function parseIsoTimeToBangkok(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str.length === 4 ? '0' + str : str;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return str;
}

// Initial corporate training seed fallback
const INITIAL_DEMO_EVENTS: TrainingEvent[] = [
  {
    id: 'EVT-1001',
    category: 'Soft Skill Training',
    title: 'Effective Leadership & Emotional Intelligence',
    start: '2026-10-06',
    end: '2026-10-06',
    startTime: '09:00',
    endTime: '16:00',
    location: 'Meeting Room A & Online Zoom',
    description: 'หลักสูตรพัฒนาทักษะความเป็นผู้นำและการบริหารความฉลาดทางอารมณ์สำหรับระดับหัวหน้างานและผู้จัดการ',
    color: '#FFF2CC',
    textColor: '#1e293b',
    status: 'ปิด',
    openDate: '2026-09-15',
    closeDate: '2026-10-01',
    formSheet: 'Register-1',
    isEvent: true,
  },
  {
    id: 'EVT-1002',
    category: 'Technical Skills Training',
    title: 'Advanced Data Analytics & Power BI Dashboard',
    start: '2026-10-16',
    end: '2026-10-17',
    startTime: '09:00',
    endTime: '16:30',
    location: 'Computer Training Center 3',
    description: 'การวิเคราะห์ข้อมูลเชิงลึกและการสร้างแดชบอร์ดสรุปผลการปฏิบัติงานด้วย Power BI สำหรับสายงานปฏิบัติการและวางแผน',
    color: '#DDEBF7',
    textColor: '#1e293b',
    status: 'เปิด',
    openDate: '2026-10-01',
    closeDate: '2026-10-25',
    formSheet: 'Register-2',
    isEvent: true,
  },
  {
    id: 'EVT-1003',
    category: 'HSE and ISO Training',
    title: 'ISO 14001:2015 & Occupational Safety Management',
    start: '2026-10-22',
    end: '2026-10-22',
    startTime: '08:30',
    endTime: '12:00',
    location: 'Main Auditorium & Factory Floor',
    description: 'อบรมระบบการจัดการสิ่งแวดล้อมและความปลอดภัยในการทำงานตามมาตรฐานสากล ISO 14001 พร้อมการฝึกซ้อมสถานการณ์ฉุกเฉิน',
    color: '#F8CBAD',
    textColor: '#1e293b',
    status: 'เปิด',
    openDate: '2026-10-05',
    closeDate: '2026-10-20',
    formSheet: 'Register-3',
    isEvent: true,
  },
  {
    id: 'EVT-1004',
    category: 'Orientation',
    title: 'New Employee Orientation - Q4/2026',
    start: '2026-10-27',
    end: '2026-10-28',
    startTime: '09:00',
    endTime: '17:00',
    location: 'HR Training Room (Building 2)',
    description: 'ปฐมนิเทศพนักงานใหม่ แนะนำวัฒนธรรมองค์กร กฎระเบียบ สวัสดิการ และแนวทางการเติบโตในสายอาชีพ',
    color: '#E2EFDA',
    textColor: '#1e293b',
    status: 'ไม่ต้องลงทะเบียน',
    openDate: '',
    closeDate: '',
    formSheet: '',
    isEvent: true,
  },
  {
    id: 'EVT-1005',
    category: 'Technical Skills Training',
    title: 'Cybersecurity Awareness & Data Privacy (PDPA)',
    start: '2026-11-04',
    end: '2026-11-04',
    startTime: '13:00',
    endTime: '16:00',
    location: 'Virtual Classroom (MS Teams)',
    description: 'การสร้างความตระหนักรู้ด้านความมั่นคงปลอดภัยทางไซเบอร์ และข้อปฏิบัติที่ถูกต้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
    color: '#DDEBF7',
    textColor: '#1e293b',
    status: 'เปิด',
    openDate: '2026-10-15',
    closeDate: '2026-11-01',
    formSheet: 'Register-4',
    isEvent: true,
  },
];

// Demo attendees data for register sheets
const INITIAL_DEMO_ATTENDEES: Record<string, AttendeeRow[]> = {
  'Register-2': [
    {
      code: 'EMP-0142',
      sex: 'Mr.',
      fname: 'สมชาย',
      lname: 'ใจดี',
      dept: 'ฝ่ายการผลิต (Production)',
      pos: 'Supervisor',
      exp: 'ต้องการนำทักษะการวิเคราะห์ข้อมูลมาพัฒนาแดชบอร์ดติดตาม KPI สายการผลิต',
      app: 'สร้าง Real-time Performance Tracking ให้ทีมงาน',
      rem: 'สะดวกเข้าร่วมตลอดหลักสูตร',
      submitterName: 'สุรชัย มั่นคง',
      submitterDept: 'ฝ่ายบุคคล',
      submitterPhone: '081-234-5678',
      rowIndex: 5,
    },
    {
      code: 'EMP-0288',
      sex: 'Ms.',
      fname: 'วิภาดา',
      lname: 'สุขเจริญ',
      dept: 'ฝ่ายวางแผนและโลจิสติกส์',
      pos: 'Data Analyst',
      exp: 'เพิ่มความเชี่ยวชาญการเขียน DAX และเชื่อมต่อข้อมูลจากหลายแหล่ง',
      app: 'ปรับปรุงรายงาน Inventory Optimization ประจำสัปดาห์',
      rem: '-',
      submitterName: 'สุรชัย มั่นคง',
      submitterDept: 'ฝ่ายบุคคล',
      submitterPhone: '081-234-5678',
      rowIndex: 6,
    },
  ],
};

function getLocalEvents(): TrainingEvent[] {
  try {
    const saved = localStorage.getItem('training_events');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading local events', e);
  }
  return INITIAL_DEMO_EVENTS;
}

function saveLocalEvents(events: TrainingEvent[]) {
  try {
    localStorage.setItem('training_events', JSON.stringify(events));
  } catch (e) {
    console.error('Error saving local events', e);
  }
}

function getLocalAttendees(sheetName: string): AttendeeRow[] {
  try {
    const saved = localStorage.getItem(`training_attendees_${sheetName}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading local attendees', e);
  }
  return INITIAL_DEMO_ATTENDEES[sheetName] || [];
}

function saveLocalAttendees(sheetName: string, attendees: AttendeeRow[]) {
  try {
    localStorage.setItem(`training_attendees_${sheetName}`, JSON.stringify(attendees));
  } catch (e) {
    console.error('Error saving local attendees', e);
  }
}

// Check and close courses past close registration date
export function checkAndCloseExpiredCourses(events: TrainingEvent[]): TrainingEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events.map((ev) => {
    if (ev.status === 'เปิด' && ev.closeDate) {
      const close = new Date(ev.closeDate);
      close.setHours(0, 0, 0, 0);
      if (today > close) {
        return { ...ev, status: 'ปิด' };
      }
    }
    return ev;
  });
}

/**
 * 1. Fetch Events from Google Sheets API v4 (if authenticated) or Local Cache
 */
export async function getEventsFromSheet(accessToken?: string | null): Promise<{
  events: TrainingEvent[];
  source: 'google-sheets' | 'local-cache';
  error?: string;
}> {
  let masterEvents: TrainingEvent[] = [];
  let source: 'google-sheets' | 'local-cache' = 'local-cache';
  let fetchError: string | undefined;

  // A. Fetch from Google Sheets API v4 if accessToken is available
  if (accessToken) {
    try {
      const masterUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A2:N100`;
      const resMaster = await fetch(masterUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (resMaster.ok) {
        const masterData = await resMaster.json();
        const rows = masterData.values || [];

        for (const row of rows) {
          const eventId = row[0];
          const title = row[2];
          if (!eventId || !title) continue;

          const category = row[1] || 'Other';
          const startDate = parseIsoDateToBangkok(row[3]);
          const endDate = parseIsoDateToBangkok(row[4]) || startDate;
          const startTime = parseIsoTimeToBangkok(row[5]);
          const endTime = parseIsoTimeToBangkok(row[6]);
          const location = row[7] || '';
          const description = row[8] || '';
          const bgColor = row[9] || CATEGORY_COLORS[category as TrainingCategory] || '#EAEAEA';
          const status = row[10] || 'ไม่ต้องลงทะเบียน';
          const openDate = parseIsoDateToBangkok(row[11]);
          const closeDate = parseIsoDateToBangkok(row[12]);
          const formSheet = row[13] || '';

          masterEvents.push({
            id: eventId,
            category,
            title,
            start: startDate,
            end: endDate,
            startTime,
            endTime,
            location,
            description,
            color: bgColor,
            textColor: getContrastColor(bgColor),
            status,
            openDate,
            closeDate,
            formSheet,
            isEvent: true,
          });
        }

        if (masterEvents.length > 0) {
          source = 'google-sheets';
        }
      } else {
        fetchError = `Sheets API error: ${resMaster.status}`;
      }
    } catch (e: unknown) {
      console.warn('Sheets API v4 error:', e);
      fetchError = (e as Error).message;
    }
  }

  // B. Fallback to local cache if no accessToken or remote fetch returned no events
  if (masterEvents.length === 0) {
    masterEvents = getLocalEvents().filter((e) => e.isEvent);
    source = 'local-cache';
  }

  // D. Build official holiday list
  const holidayEvents: TrainingEvent[] = OFFICIAL_HOLIDAYS.map((h, idx) => ({
    id: `HOL-${idx}`,
    category: 'Other',
    title: h.title,
    start: h.date,
    end: h.date,
    startTime: '',
    endTime: '',
    location: '',
    description: 'วันหยุดนักขัตฤกษ์ / วันหยุดราชการ',
    color: 'transparent',
    textColor: '#ef4444',
    status: 'ไม่ต้องลงทะเบียน',
    isEvent: false,
    isHoliday: true,
  }));

  const combined = [...masterEvents, ...holidayEvents];
  const finalEvents = checkAndCloseExpiredCourses(combined);

  // Cache locally
  saveLocalEvents(finalEvents);

  return { events: finalEvents, source, error: fetchError };
}

// 2. Save Event (Add or Update)
export async function saveEventToSheet(
  eventPayload: Partial<TrainingEvent> & { title: string; start: string },
  accessToken?: string | null
): Promise<{ success: boolean; event: TrainingEvent; error?: string }> {
  const localEvents = getLocalEvents();
  let rowId = eventPayload.id;
  const isNew = !rowId;
  if (!rowId) {
    rowId = 'EVT-' + Date.now();
  }

  const category = (eventPayload.category || 'Soft Skill Training') as TrainingCategory;
  const color = eventPayload.color || CATEGORY_COLORS[category] || '#EAEAEA';
  const textColor = getContrastColor(color);

  const newEvent: TrainingEvent = {
    id: rowId,
    category,
    title: eventPayload.title,
    start: eventPayload.start,
    end: eventPayload.end || eventPayload.start,
    startTime: eventPayload.startTime || '',
    endTime: eventPayload.endTime || '',
    location: eventPayload.location || '',
    description: eventPayload.description || '',
    color,
    textColor,
    status: eventPayload.status || 'ไม่ต้องลงทะเบียน',
    openDate: eventPayload.openDate || '',
    closeDate: eventPayload.closeDate || '',
    formSheet: eventPayload.formSheet || '',
    isEvent: true,
  };

  // Update local cache
  if (isNew) {
    localEvents.push(newEvent);
  } else {
    const idx = localEvents.findIndex((e) => e.id === rowId);
    if (idx !== -1) {
      localEvents[idx] = newEvent;
    } else {
      localEvents.push(newEvent);
    }
  }
  saveLocalEvents(localEvents);

  if (!accessToken) {
    return { success: true, event: newEvent };
  }

  // Sync to Google Sheets if access token available
  try {
    const rowValues = [
      newEvent.id,
      newEvent.category,
      newEvent.title,
      newEvent.start,
      newEvent.end,
      newEvent.startTime,
      newEvent.endTime,
      newEvent.location,
      newEvent.description,
      newEvent.color,
      newEvent.status,
      newEvent.openDate,
      newEvent.closeDate,
      newEvent.formSheet,
    ];

    const masterUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A:A`;
    const checkRes = await fetch(masterUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let targetRowIndex = -1;
    if (checkRes.ok) {
      const data = await checkRes.json();
      const colA = data.values || [];
      for (let i = 1; i < colA.length; i++) {
        if (colA[i][0] === rowId) {
          targetRowIndex = i + 1; // 1-indexed
          break;
        }
      }
    }

    if (targetRowIndex > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A${targetRowIndex}:N${targetRowIndex}?valueInputOption=USER_ENTERED`;
      await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowValues] }),
      });
    } else {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A:N:append?valueInputOption=USER_ENTERED`;
      await fetch(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowValues] }),
      });
    }

    return { success: true, event: newEvent };
  } catch (err: unknown) {
    console.error('Save to sheet error:', err);
    return { success: true, event: newEvent, error: (err as Error).message };
  }
}

// 3. Delete Event
export async function deleteEventFromSheet(
  eventId: string,
  accessToken?: string | null
): Promise<{ success: boolean; error?: string }> {
  const localEvents = getLocalEvents().filter((e) => e.id !== eventId);
  saveLocalEvents(localEvents);

  if (!accessToken) {
    return { success: true };
  }

  try {
    const masterUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A:A`;
    const checkRes = await fetch(masterUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (checkRes.ok) {
      const data = await checkRes.json();
      const colA = data.values || [];
      for (let i = 1; i < colA.length; i++) {
        if (colA[i][0] === eventId) {
          const rowNumber = i + 1;
          const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Master!A${rowNumber}:N${rowNumber}:clear`;
          await fetch(clearUrl, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          break;
        }
      }
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Delete from sheet error:', err);
    return { success: false, error: (err as Error).message };
  }
}

// 4. Submit Registration
export async function submitRegistrationData(
  payload: RegistrationPayload,
  accessToken?: string | null
): Promise<{ success: boolean; insertedIndices: number[]; error?: string }> {
  const { formSheet, data, submitterName, submitterDept, submitterPhone, isEditMode, rowIndices } = payload;

  const currentAttendees = getLocalAttendees(formSheet);
  const newInsertedIndices: number[] = [];

  const formattedRows: AttendeeRow[] = data.map((d, index) => {
    const existingIndex = rowIndices && rowIndices[index] ? rowIndices[index] : 5 + currentAttendees.length + index;
    newInsertedIndices.push(existingIndex);
    return {
      code: d[0],
      sex: (d[1] as 'Mr.' | 'Ms.' | 'Mrs.') || 'Mr.',
      fname: d[2],
      lname: d[3],
      dept: d[4],
      pos: d[5],
      exp: d[6],
      app: d[7],
      rem: d[8] || '',
      submitterName,
      submitterDept,
      submitterPhone,
      rowIndex: existingIndex,
    };
  });

  if (isEditMode && rowIndices && rowIndices.length > 0) {
    const updated = [...currentAttendees];
    formattedRows.forEach((newRow) => {
      const foundIdx = updated.findIndex((r) => r.rowIndex === newRow.rowIndex);
      if (foundIdx !== -1) {
        updated[foundIdx] = newRow;
      } else {
        updated.push(newRow);
      }
    });
    saveLocalAttendees(formSheet, updated);
  } else {
    saveLocalAttendees(formSheet, [...currentAttendees, ...formattedRows]);
  }

  if (!accessToken) {
    return { success: true, insertedIndices: newInsertedIndices };
  }

  // Write to Google Sheets (Column B to M, from row 5 onward)
  try {
    const sheetRows = data.map((d) => [
      d[0], // Code
      d[1], // Sex
      d[2], // Name
      d[3], // LastName
      d[4], // Dept
      d[5], // Pos
      d[6], // Exp
      d[7], // App
      d[8] || '', // Rem
      submitterName,
      submitterDept,
      submitterPhone,
    ]);

    if (isEditMode && rowIndices && rowIndices.length > 0) {
      for (let i = 0; i < sheetRows.length; i++) {
        const targetRow = rowIndices[i] || 5;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${formSheet}!B${targetRow}:M${targetRow}?valueInputOption=USER_ENTERED`;
        await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [sheetRows[i]] }),
        });
      }
    } else {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${formSheet}!B5:M:append?valueInputOption=USER_ENTERED`;
      await fetch(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: sheetRows }),
      });
    }

    return { success: true, insertedIndices: newInsertedIndices };
  } catch (err: unknown) {
    console.error('Submit registration error:', err);
    return { success: true, insertedIndices: newInsertedIndices, error: (err as Error).message };
  }
}

// 5. Fetch Registration Attendees for a sheet
export async function getRegistrationAttendees(
  sheetName: string,
  accessToken?: string | null
): Promise<{ attendees: AttendeeRow[]; error?: string }> {
  if (!accessToken) {
    return { attendees: getLocalAttendees(sheetName) };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A5:M100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return { attendees: getLocalAttendees(sheetName) };
    }

    const data = await res.json();
    const rows = data.values || [];
    const attendees: AttendeeRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i];
      const code = cols[1] || cols[0];
      const fname = cols[3] || cols[2];
      if (!code && !fname) continue;

      attendees.push({
        code: cols[1] || '',
        sex: (cols[2] as 'Mr.' | 'Ms.' | 'Mrs.') || 'Mr.',
        fname: cols[3] || '',
        lname: cols[4] || '',
        dept: cols[5] || '',
        pos: cols[6] || '',
        exp: cols[7] || '',
        app: cols[8] || '',
        rem: cols[9] || '',
        submitterName: cols[10] || '',
        submitterDept: cols[11] || '',
        submitterPhone: cols[12] || '',
        rowIndex: 5 + i,
      });
    }

    saveLocalAttendees(sheetName, attendees);
    return { attendees };
  } catch (err: unknown) {
    console.error('Error fetching attendees:', err);
    return { attendees: getLocalAttendees(sheetName), error: (err as Error).message };
  }
}

// 6. Clear Registration Data
export async function clearRegistrationSheet(
  sheetName: string,
  accessToken?: string | null
): Promise<{ success: boolean; error?: string }> {
  saveLocalAttendees(sheetName, []);

  const localEvents = getLocalEvents().map((e) => {
    if (e.formSheet === sheetName) {
      return { ...e, formSheet: '' };
    }
    return e;
  });
  saveLocalEvents(localEvents);

  if (!accessToken) {
    return { success: true };
  }

  try {
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!B5:M100:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('Error clearing registration sheet:', err);
    return { success: false, error: (err as Error).message };
  }
}
