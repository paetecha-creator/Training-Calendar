import {
  TrainingEvent,
  AttendeeRow,
  RegistrationPayload,
  TrainingCategory,
  HolidayItem,
  FormSheetName,
} from '../types';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

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

// Initial corporate training seed fallback - preserved 100%
export const INITIAL_COURSES: TrainingEvent[] = [
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

// Initial official holidays list (19 official holidays in 2026) - preserved 100%
export const INITIAL_HOLIDAYS: HolidayItem[] = [
  { id: 'HOL-2026-01-01', date: '2026-01-01', name: 'วันขึ้นปีใหม่', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-03-03', date: '2026-03-03', name: 'วันมาฆบูชา', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-04-06', date: '2026-04-06', name: 'วันจักรี', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-04-13', date: '2026-04-13', name: 'วันสงกรานต์', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-04-14', date: '2026-04-14', name: 'วันสงกรานต์', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-04-15', date: '2026-04-15', name: 'วันสงกรานต์', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-05-01', date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-05-04', date: '2026-05-04', name: 'วันฉัตรมงคล', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-05-31', date: '2026-05-31', name: 'วันวิสาขบูชา', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-06-03', date: '2026-06-03', name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-07-28', date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-07-29', date: '2026-07-29', name: 'วันอาสาฬหบูชา', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-07-30', date: '2026-07-30', name: 'วันเข้าพรรษา', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-08-12', date: '2026-08-12', name: 'วันแม่แห่งชาติ', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-10-13', date: '2026-10-13', name: 'วันนวมินทรมหาราช', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-10-23', date: '2026-10-23', name: 'วันปิยมหาราช', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-12-05', date: '2026-12-05', name: 'วันพ่อแห่งชาติ / วันชาติ', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-12-10', date: '2026-12-10', name: 'วันรัฐธรรมนูญ', category: 'วันหยุดนักขัตฤกษ์' },
  { id: 'HOL-2026-12-31', date: '2026-12-31', name: 'วันสิ้นปี', category: 'วันหยุดนักขัตฤกษ์' },
];

// Initial attendees for Register-1 - preserved 100%
export const INITIAL_REGISTER_1_ATTENDEES: AttendeeRow[] = [
  {
    id: 'ATT-9579',
    code: '9579',
    sex: 'Mr.',
    fname: 'Promrin',
    lname: 'Srisang',
    dept: 'ENG / PTE',
    pos: 'Chief Technician',
    exp: '23456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 5,
  },
  {
    id: 'ATT-12894',
    code: '12894',
    sex: 'Mr.',
    fname: 'Saravut',
    lname: 'Vohra',
    dept: 'ENG / PTE',
    pos: 'Sr.Technician',
    exp: '2345623456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 6,
  },
  {
    id: 'ATT-15110',
    code: '15110',
    sex: 'Mr.',
    fname: 'Wongsathon',
    lname: 'Purisang',
    dept: 'ENG / PTE',
    pos: 'Technician 1',
    exp: '23456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 7,
  },
  {
    id: 'ATT-9544',
    code: '9544',
    sex: 'Ms.',
    fname: 'Jampa',
    lname: 'Kamsri',
    dept: 'PRD/TS1',
    pos: 'Asst. General Manager',
    exp: '-',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 8,
  },
  {
    id: 'ATT-10971',
    code: '10971',
    sex: 'Ms.',
    fname: 'Aree',
    lname: 'Kheawsa-Ad',
    dept: 'PRD/TS1',
    pos: 'Sr.Supervisor',
    exp: '2345623456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 9,
  },
  {
    id: 'ATT-12199',
    code: '12199',
    sex: 'Mrs.',
    fname: 'Jansod',
    lname: 'Kongsompong',
    dept: 'PRD/TS1',
    pos: 'Sr.Leader',
    exp: '23456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 10,
  },
  {
    id: 'ATT-13803',
    code: '13803',
    sex: 'Ms.',
    fname: 'Chatsuda',
    lname: 'Chara',
    dept: 'PRD/TS1',
    pos: 'Leader 2',
    exp: '23456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 11,
  },
  {
    id: 'ATT-15268',
    code: '15268',
    sex: 'Ms.',
    fname: 'Manthana',
    lname: 'Thanataranan',
    dept: 'BM / PGM-E',
    pos: 'PGM1',
    exp: '23456',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 12,
  },
  {
    id: 'ATT-15348',
    code: '15348',
    sex: 'Ms.',
    fname: 'Navarat',
    lname: 'Korad',
    dept: 'BM / PGM-E',
    pos: 'PGMT',
    exp: '-',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 13,
  },
  {
    id: 'ATT-8252',
    code: '8252',
    sex: 'Ms.',
    fname: 'Sontaya',
    lname: 'Karnpakdee',
    dept: 'PRD/INJ',
    pos: 'Sub.Leader 2',
    exp: '-',
    app: 's',
    rem: 's',
    submitterName: 'rediotyrt',
    submitterDept: 'zer5u',
    submitterPhone: 'aeutdoup',
    rowIndex: 14,
  },
];

/* =========================================================================
   Local Storage Offline Cache
   ========================================================================= */

function getLocalEvents(): TrainingEvent[] {
  try {
    const saved = localStorage.getItem('training_events');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading local events', e);
  }
  return INITIAL_COURSES;
}

function saveLocalEvents(events: TrainingEvent[]) {
  try {
    localStorage.setItem('training_events', JSON.stringify(events));
  } catch (e) {
    console.error('Error saving local events', e);
  }
}

function getLocalHolidays(): HolidayItem[] {
  try {
    const saved = localStorage.getItem('training_holidays');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading local holidays', e);
  }
  return INITIAL_HOLIDAYS;
}

function saveLocalHolidays(holidays: HolidayItem[]) {
  try {
    localStorage.setItem('training_holidays', JSON.stringify(holidays));
  } catch (e) {
    console.error('Error saving local holidays', e);
  }
}

function getLocalAttendees(sheetName: string): AttendeeRow[] {
  try {
    const saved = localStorage.getItem(`training_attendees_${sheetName}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading local attendees', e);
  }
  if (sheetName === 'Register-1') return INITIAL_REGISTER_1_ATTENDEES;
  return [];
}

function saveLocalAttendees(sheetName: string, attendees: AttendeeRow[]) {
  try {
    localStorage.setItem(`training_attendees_${sheetName}`, JSON.stringify(attendees));
  } catch (e) {
    console.error('Error saving local attendees', e);
  }
}

/* =========================================================================
   Firebase Cloud Firestore Automatic Seeding & Initialization
   ========================================================================= */

let isSeedingInitiated = false;

export async function ensureInitialDataSeeded(): Promise<void> {
  if (isSeedingInitiated) return;
  isSeedingInitiated = true;

  try {
    // 1. Check & Seed Events
    const eventsSnap = await getDocs(collection(db, 'events'));
    if (eventsSnap.empty) {
      console.log('Seeding initial training courses into Firebase Firestore...');
      for (const ev of INITIAL_COURSES) {
        await setDoc(doc(db, 'events', ev.id), {
          ...ev,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Check & Seed Holidays
    const holidaysSnap = await getDocs(collection(db, 'holidays'));
    if (holidaysSnap.empty) {
      console.log('Seeding initial annual holidays into Firebase Firestore...');
      for (const h of INITIAL_HOLIDAYS) {
        const hId = h.id || `HOL-${h.date}`;
        await setDoc(doc(db, 'holidays', hId), {
          ...h,
          id: hId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Check & Seed Register-1 Attendees
    const reg1Doc = await getDoc(doc(db, 'form_attendees', 'Register-1'));
    if (!reg1Doc.exists()) {
      console.log('Seeding initial Register-1 attendees into Firebase Firestore...');
      await setDoc(doc(db, 'form_attendees', 'Register-1'), {
        attendees: INITIAL_REGISTER_1_ATTENDEES,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Initial Firebase seeding check warning:', err);
  }
}

/* =========================================================================
   Training Events Operations (Firebase)
   ========================================================================= */

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
 * Fetch all courses and annual holidays from Firebase Firestore
 */
export async function getEventsFromSheet(): Promise<{
  events: TrainingEvent[];
  source: string;
  error?: string;
}> {
  await ensureInitialDataSeeded();

  const courseList: TrainingEvent[] = [];
  const holidayEvents: TrainingEvent[] = [];
  let source = 'firebase';
  let fetchError: string | undefined;

  try {
    // 1. Load Courses from Firestore
    const eventSnap = await getDocs(collection(db, 'events'));
    if (!eventSnap.empty) {
      eventSnap.forEach((d) => {
        const data = d.data() as TrainingEvent;
        if (data && data.title) {
          courseList.push({
            ...data,
            id: d.id,
            isEvent: true,
            isHoliday: false,
          });
        }
      });
    } else {
      courseList.push(...INITIAL_COURSES);
    }
  } catch (err: unknown) {
    console.warn('Firebase events load error, using local cache:', err);
    courseList.push(...getLocalEvents());
    source = 'local-cache';
    fetchError = (err as Error).message;
  }

  try {
    // 2. Load Annual Holidays from Firestore
    const holidaySnap = await getDocs(collection(db, 'holidays'));
    if (!holidaySnap.empty) {
      const holidaysList: HolidayItem[] = [];
      holidaySnap.forEach((d) => {
        const h = d.data() as HolidayItem;
        if (h && h.date && h.name) {
          holidaysList.push({ ...h, id: d.id });
          holidayEvents.push({
            id: d.id || `HOL-${h.date}`,
            category: 'Other',
            title: h.name,
            start: h.date,
            end: h.date,
            startTime: '',
            endTime: '',
            location: '',
            description: h.description || `${h.category || 'วันหยุดประจำปี'}`,
            color: 'transparent',
            textColor: '#ef4444',
            status: 'ไม่ต้องลงทะเบียน',
            isEvent: false,
            isHoliday: true,
          });
        }
      });
      saveLocalHolidays(holidaysList);
    } else {
      const fallbackHolidays = getLocalHolidays();
      fallbackHolidays.forEach((h, idx) => {
        holidayEvents.push({
          id: h.id || `HOL-${idx}`,
          category: 'Other',
          title: h.name,
          start: h.date,
          end: h.date,
          startTime: '',
          endTime: '',
          location: '',
          description: h.category || 'วันหยุดนักขัตฤกษ์ / วันหยุดราชการ',
          color: 'transparent',
          textColor: '#ef4444',
          status: 'ไม่ต้องลงทะเบียน',
          isEvent: false,
          isHoliday: true,
        });
      });
    }
  } catch (err: unknown) {
    console.warn('Firebase holidays load error, using fallback:', err);
    const fallbackHolidays = getLocalHolidays();
    fallbackHolidays.forEach((h, idx) => {
      holidayEvents.push({
        id: h.id || `HOL-${idx}`,
        category: 'Other',
        title: h.name,
        start: h.date,
        end: h.date,
        startTime: '',
        endTime: '',
        location: '',
        description: h.category || 'วันหยุดประจำปี',
        color: 'transparent',
        textColor: '#ef4444',
        status: 'ไม่ต้องลงทะเบียน',
        isEvent: false,
        isHoliday: true,
      });
    });
  }

  const combined = [...courseList, ...holidayEvents];
  const finalEvents = checkAndCloseExpiredCourses(combined);
  saveLocalEvents(finalEvents);

  return { events: finalEvents, source, error: fetchError };
}

/**
 * Save (create or update) a training course in Firebase
 */
export async function saveEventToSheet(
  eventPayload: Partial<TrainingEvent> & { title: string; start: string }
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
    isHoliday: false,
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

  // Write directly to Cloud Firestore
  try {
    const eventRef = doc(db, 'events', newEvent.id);
    await setDoc(
      eventRef,
      {
        ...newEvent,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true, event: newEvent };
  } catch (err: unknown) {
    console.error('Firebase save event error:', err);
    return { success: true, event: newEvent, error: (err as Error).message };
  }
}

/**
 * Delete a course from Firebase
 */
export async function deleteEventFromSheet(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const localEvents = getLocalEvents().filter((e) => e.id !== eventId);
  saveLocalEvents(localEvents);

  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
    return { success: true };
  } catch (err: unknown) {
    console.error('Firebase delete event error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/* =========================================================================
   Annual Holiday Operations (Firebase - for Admin Holiday Management)
   ========================================================================= */

/**
 * Get list of all annual holidays from Firebase
 */
export async function getAnnualHolidays(): Promise<HolidayItem[]> {
  await ensureInitialDataSeeded();
  try {
    const snap = await getDocs(collection(db, 'holidays'));
    if (!snap.empty) {
      const list: HolidayItem[] = [];
      snap.forEach((d) => {
        const item = d.data() as HolidayItem;
        list.push({ ...item, id: d.id });
      });
      list.sort((a, b) => a.date.localeCompare(b.date));
      saveLocalHolidays(list);
      return list;
    }
  } catch (err) {
    console.warn('Error fetching annual holidays from Firebase:', err);
  }
  return getLocalHolidays();
}

/**
 * Save (create or update) an annual holiday in Firebase
 */
export async function saveAnnualHoliday(
  holiday: Partial<HolidayItem> & { date: string; name: string }
): Promise<{ success: boolean; holiday: HolidayItem; error?: string }> {
  let id = holiday.id;
  if (!id) {
    id = `HOL-${holiday.date}-${Date.now().toString().slice(-4)}`;
  }

  const cleanHoliday: HolidayItem = {
    id,
    date: holiday.date.trim(),
    name: holiday.name.trim(),
    category: holiday.category || 'วันหยุดนักขัตฤกษ์',
    description: holiday.description || '',
  };

  // Update local cache
  const local = getLocalHolidays();
  const existingIdx = local.findIndex((h) => h.id === id || h.date === cleanHoliday.date);
  if (existingIdx !== -1) {
    local[existingIdx] = cleanHoliday;
  } else {
    local.push(cleanHoliday);
  }
  local.sort((a, b) => a.date.localeCompare(b.date));
  saveLocalHolidays(local);

  // Write to Firebase Firestore
  try {
    await setDoc(doc(db, 'holidays', id), {
      ...cleanHoliday,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, holiday: cleanHoliday };
  } catch (err: unknown) {
    console.error('Firebase save holiday error:', err);
    return { success: false, holiday: cleanHoliday, error: (err as Error).message };
  }
}

/**
 * Delete an annual holiday from Firebase
 */
export async function deleteAnnualHoliday(
  holidayId: string
): Promise<{ success: boolean; error?: string }> {
  const local = getLocalHolidays().filter((h) => h.id !== holidayId);
  saveLocalHolidays(local);

  try {
    await deleteDoc(doc(db, 'holidays', holidayId));
    return { success: true };
  } catch (err: unknown) {
    console.error('Firebase delete holiday error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/* =========================================================================
   Registration & Attendee Operations (Pure Firebase - Collaborative)
   ========================================================================= */

/**
 * Fetch registration attendees for a form sheet / course
 */
export async function getRegistrationAttendees(
  sheetName: string
): Promise<{ attendees: AttendeeRow[]; error?: string }> {
  await ensureInitialDataSeeded();

  try {
    const sheetDoc = await getDoc(doc(db, 'form_attendees', sheetName));
    if (sheetDoc.exists()) {
      const data = sheetDoc.data();
      if (Array.isArray(data?.attendees)) {
        saveLocalAttendees(sheetName, data.attendees);
        return { attendees: data.attendees };
      }
    }
  } catch (err: unknown) {
    console.warn(`Firestore form_attendees [${sheetName}] fetch error:`, err);
  }

  return { attendees: getLocalAttendees(sheetName) };
}

/**
 * Submit registration data to Firebase Firestore (Instant multi-device collaborative sync)
 */
export async function submitRegistrationData(
  payload: RegistrationPayload
): Promise<{ success: boolean; insertedIndices: number[]; error?: string }> {
  const { formSheet, data, submitterName, submitterDept, submitterPhone, isEditMode, rowIndices } =
    payload;

  const currentAttendees = getLocalAttendees(formSheet);
  const newInsertedIndices: number[] = [];
  const timestamp = new Date().toISOString();

  const formattedRows: AttendeeRow[] = data.map((d, index) => {
    const existingIndex =
      rowIndices && rowIndices[index] ? rowIndices[index] : 5 + currentAttendees.length + index;
    newInsertedIndices.push(existingIndex);
    return {
      id: 'ATT-' + Date.now() + '-' + index,
      code: d[0] || '',
      sex: (d[1] as 'Mr.' | 'Ms.' | 'Mrs.') || 'Mr.',
      fname: d[2] || '',
      lname: d[3] || '',
      dept: d[4] || '',
      pos: d[5] || '',
      exp: d[6] || '',
      app: d[7] || '',
      rem: d[8] || '',
      submitterName,
      submitterDept,
      submitterPhone,
      rowIndex: existingIndex,
      createdAt: timestamp,
    };
  });

  let updatedAttendees: AttendeeRow[];
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
    updatedAttendees = updated;
  } else {
    updatedAttendees = [...currentAttendees, ...formattedRows];
  }

  // Save to local cache
  saveLocalAttendees(formSheet, updatedAttendees);

  // Write directly into Cloud Firestore for instant real-time sync across all devices
  try {
    const sheetAttendeesRef = doc(db, 'form_attendees', formSheet);
    await setDoc(
      sheetAttendeesRef,
      {
        formSheet,
        courseId: payload.courseId,
        courseTitle: payload.courseTitle,
        attendees: updatedAttendees,
        totalCount: updatedAttendees.length,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    return { success: true, insertedIndices: newInsertedIndices };
  } catch (err: unknown) {
    console.error('Firebase submit registration error:', err);
    return {
      success: true,
      insertedIndices: newInsertedIndices,
      error: (err as Error).message,
    };
  }
}

/**
 * Delete specific attendees from a registration form sheet in Firebase
 */
export async function deleteRegistrationAttendees(
  sheetName: string,
  attendeesToDelete: AttendeeRow[]
): Promise<{ success: boolean; remainingCount: number; error?: string }> {
  const currentAttendees = getLocalAttendees(sheetName);

  const deleteKeySet = new Set(
    attendeesToDelete.map(
      (a) => `${a.code || ''}|${a.fname || ''}|${a.lname || ''}|${a.rowIndex ?? ''}`
    )
  );

  const remaining = currentAttendees.filter((a) => {
    const key = `${a.code || ''}|${a.fname || ''}|${a.lname || ''}|${a.rowIndex ?? ''}`;
    if (deleteKeySet.has(key)) return false;
    const matched = attendeesToDelete.some(
      (del) =>
        del.code &&
        del.code === a.code &&
        del.fname.trim() === a.fname.trim() &&
        del.lname.trim() === a.lname.trim()
    );
    return !matched;
  });

  const updatedRemaining = remaining.map((row, idx) => ({
    ...row,
    rowIndex: 5 + idx,
  }));

  saveLocalAttendees(sheetName, updatedRemaining);

  // Write to Firebase Firestore
  try {
    const sheetAttendeesRef = doc(db, 'form_attendees', sheetName);
    await setDoc(
      sheetAttendeesRef,
      {
        attendees: updatedRemaining,
        totalCount: updatedRemaining.length,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true, remainingCount: updatedRemaining.length };
  } catch (err: unknown) {
    console.error('Firebase delete attendees error:', err);
    return { success: true, remainingCount: updatedRemaining.length, error: (err as Error).message };
  }
}

/**
 * Clear all registration attendees for a form sheet in Firebase
 */
export async function clearRegistrationSheet(
  sheetName: string
): Promise<{ success: boolean; error?: string }> {
  saveLocalAttendees(sheetName, []);

  try {
    const sheetAttendeesRef = doc(db, 'form_attendees', sheetName);
    await setDoc(sheetAttendeesRef, {
      attendees: [],
      totalCount: 0,
      clearedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err: unknown) {
    console.error('Firebase clear sheet error:', err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Add a single attendee directly (for Admin Dashboard quick-add)
 */
export async function addSingleAttendee(
  sheetName: string,
  attendee: AttendeeRow
): Promise<{ success: boolean; attendees: AttendeeRow[]; error?: string }> {
  const current = getLocalAttendees(sheetName);
  const newRow: AttendeeRow = {
    ...attendee,
    id: attendee.id || 'ATT-' + Date.now(),
    rowIndex: 5 + current.length,
    createdAt: new Date().toISOString(),
  };
  const updated = [...current, newRow];
  saveLocalAttendees(sheetName, updated);

  try {
    await setDoc(
      doc(db, 'form_attendees', sheetName),
      {
        attendees: updated,
        totalCount: updated.length,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true, attendees: updated };
  } catch (err: unknown) {
    return { success: true, attendees: updated, error: (err as Error).message };
  }
}

// Backward compatibility helper
export async function initSheetsConfig(): Promise<string> {
  await ensureInitialDataSeeded();
  return 'firebase-cloud-active';
}

export function getPendingSyncQueue() {
  return [];
}

export async function flushPendingSyncQueue() {
  return { flushedCount: 0 };
}

export const SPREADSHEET_ID = 'firebase-cloud-database';
