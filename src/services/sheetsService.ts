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

// Google Apps Script Web App URL for 100% free anonymous updates
export function getSheetsWebAppUrl(): string {
  try {
    return (
      localStorage.getItem('training_sheets_webapp_url') ||
      (import.meta.env.VITE_SHEETS_WEBAPP_URL as string) ||
      ''
    );
  } catch {
    return '';
  }
}

export function setSheetsWebAppUrl(url: string): void {
  try {
    localStorage.setItem('training_sheets_webapp_url', url.trim());
  } catch (e) {
    console.error(e);
  }
}

export interface PendingSyncItem {
  id: string;
  type: 'save_event' | 'delete_event' | 'registration';
  payload: any;
  timestamp: number;
}

export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem('training_pending_sync_queue');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function addPendingSyncItem(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): void {
  try {
    const list = getPendingSyncQueue();
    list.push({
      ...item,
      id: 'PEND-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    });
    localStorage.setItem('training_pending_sync_queue', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export function clearPendingSyncQueue(): void {
  try {
    localStorage.removeItem('training_pending_sync_queue');
  } catch (e) {
    console.error(e);
  }
}

export async function sendToSheetsWebApp(action: string, payload: any): Promise<boolean> {
  const url = getSheetsWebAppUrl();
  if (!url) return false;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...payload,
        spreadsheetId: SPREADSHEET_ID,
        timestamp: new Date().toISOString(),
      }),
    });
    return true;
  } catch (err) {
    console.warn('Error sending to WebApp endpoint:', err);
    return false;
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
 * Dynamic JSONP / Fetch loader for public Google Sheets GViz endpoint.
 * Allows ALL visitors to read real-time data from spreadsheet 1gqp55Bp-HyDihtbHQGpyeVglHAXCQwXTxnefK8xVozs
 * without needing Google login or OAuth credentials.
 */
export async function fetchSheetGvizData(sheetName: string): Promise<any> {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const callbackName = 'gviz_cb_' + Math.random().toString(36).substring(2, 9);
      let resolved = false;

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout fetching ${sheetName} from Google Sheets`));
      }, 12000);

      function cleanup() {
        clearTimeout(timer);
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any)[callbackName];
      }

      (window as any)[callbackName] = (data: any) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${encodeURIComponent(
        sheetName
      )}&t=${Date.now()}`;
      script.onerror = (err) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        reject(err);
      };

      document.head.appendChild(script);
    });
  }

  // Node.js fallback
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      sheetName
    )}&t=${Date.now()}`
  );
  const text = await res.text();
  const jsonText = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
  return JSON.parse(jsonText);
}

export function parseGvizDate(cell: any): string {
  if (!cell) return '';
  if (cell.f && /^\d{4}-\d{2}-\d{2}$/.test(cell.f)) {
    return cell.f;
  }
  if (typeof cell.v === 'string') {
    const match = cell.v.match(/Date\((\d+),(\d+),(\d+)/);
    if (match) {
      const year = match[1];
      const month = String(Number(match[2]) + 1).padStart(2, '0');
      const day = String(Number(match[3])).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cell.v)) {
      return cell.v;
    }
  }
  return parseIsoDateToBangkok(cell.f || cell.v);
}

export function parseGvizTime(cell: any): string {
  if (!cell) return '';
  const raw = cell.f || (typeof cell.v === 'string' ? cell.v : '');
  if (raw) {
    const match = raw.match(/Date\(\d+,\d+,\d+,(\d+),(\d+)/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
    }
    const parts = raw.trim().split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return parseIsoTimeToBangkok(cell.f || cell.v);
}

/**
 * 1. Fetch Events from Google Sheets (Real-time public GViz + OAuth API v4 fallback)
 */
export async function getEventsFromSheet(accessToken?: string | null): Promise<{
  events: TrainingEvent[];
  source: 'google-sheets' | 'local-cache';
  error?: string;
}> {
  let masterEvents: TrainingEvent[] = [];
  let holidayEvents: TrainingEvent[] = [];
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
      }
    } catch (e: unknown) {
      console.warn('Sheets API v4 error, falling back to public GViz:', e);
    }
  }

  // B. Public Google Sheets GViz endpoint: Always connect and fetch live data for all visitors
  if (masterEvents.length === 0) {
    try {
      const gvizData = await fetchSheetGvizData('Master');
      if (gvizData?.table?.rows) {
        for (const row of gvizData.table.rows) {
          const c = row.c || [];
          const eventId = c[0]?.v ? String(c[0].v).trim() : '';
          const title = c[2]?.v ? String(c[2].v).trim() : '';
          if (!eventId || !title) continue;

          const category = (c[1]?.v ? String(c[1].v).trim() : '') || 'Other';
          const startDate = parseGvizDate(c[3]);
          const endDate = parseGvizDate(c[4]) || startDate;
          const startTime = parseGvizTime(c[5]);
          const endTime = parseGvizTime(c[6]);
          const location = c[7]?.v ? String(c[7].v).trim() : '';
          const description = c[8]?.v ? String(c[8].v).trim() : '';
          const bgColor =
            (c[9]?.v ? String(c[9].v).trim() : '') ||
            CATEGORY_COLORS[category as TrainingCategory] ||
            '#EAEAEA';
          const status = (c[10]?.v ? String(c[10].v).trim() : '') || 'ไม่ต้องลงทะเบียน';
          const openDate = parseGvizDate(c[11]);
          const closeDate = parseGvizDate(c[12]);
          const formSheet = c[13]?.v ? String(c[13].v).trim() : '';

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
      }
    } catch (err: unknown) {
      console.warn('Public Google Sheets GViz fetch error:', err);
      fetchError = (err as Error).message;
    }
  }

  // C. Fetch real holidays from the Holiday sheet in Google Sheets!
  try {
    const holidayData = await fetchSheetGvizData('Holiday');
    if (holidayData?.table?.rows) {
      holidayData.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const hDate = parseGvizDate(c[0]);
        const hTitle = c[1]?.v ? String(c[1].v).trim() : '';
        if (hDate && hTitle) {
          holidayEvents.push({
            id: `HOL-${idx}`,
            category: 'Other',
            title: hTitle,
            start: hDate,
            end: hDate,
            startTime: '',
            endTime: '',
            location: '',
            description: 'วันหยุดบริษัท / วันหยุดนักขัตฤกษ์',
            color: 'transparent',
            textColor: '#ef4444',
            status: 'ไม่ต้องลงทะเบียน',
            isEvent: false,
            isHoliday: true,
          });
        }
      });
    }
  } catch (err) {
    console.warn('Could not fetch Holiday sheet, using fallback list', err);
  }

  // Fallback to default official holidays list if Holiday sheet returned nothing
  if (holidayEvents.length === 0) {
    holidayEvents = OFFICIAL_HOLIDAYS.map((h, idx) => ({
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
  }

  // D. Fallback to local cache only if Google Sheets was completely unreachable
  if (masterEvents.length === 0) {
    masterEvents = getLocalEvents().filter((e) => e.isEvent);
    source = 'local-cache';
  } else {
    source = 'google-sheets';
  }

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

  // 1. Try sending to Google Apps Script Web App if configured (zero-login public sync)
  sendToSheetsWebApp('save_event', { event: newEvent });

  if (!accessToken) {
    // Queue pending change so it automatically pushes to Google Sheets when Admin connects
    addPendingSyncItem({ type: 'save_event', payload: newEvent });
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
    addPendingSyncItem({ type: 'save_event', payload: newEvent });
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

  // Send to Google Apps Script Web App if configured
  sendToSheetsWebApp('delete_event', { eventId });

  if (!accessToken) {
    addPendingSyncItem({ type: 'delete_event', payload: { eventId } });
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
    addPendingSyncItem({ type: 'delete_event', payload: { eventId } });
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

  // Send to Web App endpoint if configured
  sendToSheetsWebApp('registration', {
    formSheet,
    data,
    submitterName,
    submitterDept,
    submitterPhone,
    isEditMode,
    rowIndices,
  });

  if (!accessToken) {
    // Queue pending change so it automatically pushes to Google Sheets when Admin connects
    addPendingSyncItem({ type: 'registration', payload });
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
    addPendingSyncItem({ type: 'registration', payload });
    return { success: true, insertedIndices: newInsertedIndices, error: (err as Error).message };
  }
}

/**
 * Intelligent Attendee Row Parser based on Register-1 gold standard:
 * Col 1: Code (e.g. 9579)
 * Col 2: Sex ('Mr.', 'Ms.', 'Mrs.')
 * Col 3: First Name ('Promrin')
 * Col 4: Last Name ('Srisang')
 * Col 5: Dept ('ENG / PTE')
 * Col 6: Position ('Chief Technician')
 * Col 7: Expectation ('23456')
 * Col 8: Apply ('s')
 * Col 9: Remark ('s')
 * Col 10: Submitter Name ('rediotyrt')
 * Col 11: Submitter Dept ('zer5u')
 * Col 12: Submitter Phone ('aeutdoup')
 *
 * Automatically detects shifted sheets (like Register-3 with duplicate Sex/Title columns)
 * and skips headers & descriptive banner rows.
 */
export function parseAttendeeFromCells(c: any[], rowIndex: number): AttendeeRow | null {
  if (!c || c.length === 0) return null;

  const rawVals = c.map((cell) => {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'object' && cell !== null) {
      return String(cell.f || cell.v || '').trim();
    }
    return String(cell).trim();
  });

  // 1. Skip table headers and descriptive rows
  const isHeader = rawVals.some((val) =>
    /^(Training Registration|Course Name|Training Date|Title \/ Sex|First Name|Last-name|Dept\. \/ In-charge|Position|Expectation for Training)$/i.test(
      val
    )
  );
  if (isHeader) return null;

  // 2. Code is in col 1 or col 0
  const codeCandidate = rawVals[1] || rawVals[0] || '';
  if (!codeCandidate || /^(code|no\.|#|รหัส|คำนำหน้า)$/i.test(codeCandidate)) {
    return null;
  }

  // 3. Detect column shift:
  // In Register-3: Col 2='Mr.', Col 3='Mr.', Col 4='First Name', Col 5='Last Name', etc.
  const sexRegex = /^(mr\.|ms\.|mrs\.|นาย|นาง|นางสาว|miss|master)$/i;
  const isCol3Sex = sexRegex.test(rawVals[3]);

  if (isCol3Sex && rawVals[4] && !sexRegex.test(rawVals[4])) {
    // Shifted layout (as in Register-3)
    return {
      code: rawVals[1],
      sex: (rawVals[2] || rawVals[3] || 'Mr.') as 'Mr.' | 'Ms.' | 'Mrs.',
      fname: rawVals[4],
      lname: rawVals[5] || '',
      dept: rawVals[6] || '',
      pos: rawVals[7] || '',
      exp: rawVals[8] || '',
      app: rawVals[9] || '',
      rem: rawVals[10] && rawVals.length > 13 ? rawVals[10] : '',
      submitterName: rawVals[10] || '',
      submitterDept: rawVals[11] || '',
      submitterPhone: rawVals[12] || '',
      rowIndex,
    };
  }

  // Standard Register-1 layout
  const fname = rawVals[3] || '';
  if (!fname && !rawVals[4]) return null;

  return {
    code: rawVals[1] || rawVals[0],
    sex: (rawVals[2] as 'Mr.' | 'Ms.' | 'Mrs.') || 'Mr.',
    fname: rawVals[3] || '',
    lname: rawVals[4] || '',
    dept: rawVals[5] || '',
    pos: rawVals[6] || '',
    exp: rawVals[7] || '',
    app: rawVals[8] || '',
    rem: rawVals[9] || '',
    submitterName: rawVals[10] || '',
    submitterDept: rawVals[11] || '',
    submitterPhone: rawVals[12] || '',
    rowIndex,
  };
}

// 5. Fetch Registration Attendees for a sheet
export async function getRegistrationAttendees(
  sheetName: string,
  accessToken?: string | null
): Promise<{ attendees: AttendeeRow[]; error?: string }> {
  // If accessToken is available, try Sheets API v4 first
  if (accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A5:M100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        const rows = data.values || [];
        const attendees: AttendeeRow[] = [];

        for (let i = 0; i < rows.length; i++) {
          const parsed = parseAttendeeFromCells(rows[i], 5 + i);
          if (parsed) {
            attendees.push(parsed);
          }
        }

        if (attendees.length > 0) {
          saveLocalAttendees(sheetName, attendees);
          return { attendees };
        }
      }
    } catch (err: unknown) {
      console.warn('Sheets API v4 error for attendees, falling back to public GViz:', err);
    }
  }

  // Public Google Sheets GViz fetch so all users see real-time attendees from the same sheet
  try {
    const gvizData = await fetchSheetGvizData(sheetName);
    if (gvizData?.table?.rows) {
      const attendees: AttendeeRow[] = [];
      gvizData.table.rows.forEach((r: any, i: number) => {
        const c = r.c || [];
        const parsed = parseAttendeeFromCells(c, 5 + i);
        if (parsed) {
          attendees.push(parsed);
        }
      });

      if (attendees.length > 0) {
        saveLocalAttendees(sheetName, attendees);
        return { attendees };
      }
    }
  } catch (err: unknown) {
    console.warn('Public GViz fetch error for attendees:', err);
  }

  return { attendees: getLocalAttendees(sheetName) };
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

  sendToSheetsWebApp('clear_sheet', { formSheet: sheetName });

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

// 7. Auto-Flush Pending Sync Queue when Admin is authenticated
export async function flushPendingSyncQueue(
  accessToken: string
): Promise<{ flushedCount: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return { flushedCount: 0 };

  let count = 0;
  const remaining: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'save_event') {
        await saveEventToSheet(item.payload, accessToken);
        count++;
      } else if (item.type === 'registration') {
        await submitRegistrationData(item.payload, accessToken);
        count++;
      } else if (item.type === 'delete_event') {
        await deleteEventFromSheet(item.payload.eventId, accessToken);
        count++;
      }
    } catch (e) {
      console.error('Failed to flush item:', item, e);
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem('training_pending_sync_queue', JSON.stringify(remaining));
  } else {
    clearPendingSyncQueue();
  }

  return { flushedCount: count };
}

