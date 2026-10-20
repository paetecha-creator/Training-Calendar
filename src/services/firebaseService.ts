import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  TrainingEvent,
  HolidayItem,
  AttendeeRow,
  TrainingCategory,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Contrast color calculation
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

// 1. Initial corporate training seed fallback - preserved 100%
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

// 2. Initial official holidays list (19 official holidays in 2026) - preserved 100%
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

// 3. Initial registered attendees for Register-1 (EVT-1001) - preserved 100%
export const INITIAL_REGISTER_1_ATTENDEES: (AttendeeRow & { courseId: string; courseTitle: string; formSheet: string })[] = [
  {
    id: 'ATT-9579',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'ENG / PTE',
    submitterPhone: '081-234-5678',
    rowIndex: 5,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'ATT-12894',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'ENG / PTE',
    submitterPhone: '081-234-5678',
    rowIndex: 6,
    createdAt: '2026-10-01T09:05:00.000Z',
  },
  {
    id: 'ATT-15110',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'ENG / PTE',
    submitterPhone: '081-234-5678',
    rowIndex: 7,
    createdAt: '2026-10-01T09:10:00.000Z',
  },
  {
    id: 'ATT-9544',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'PRD/TS1',
    submitterPhone: '081-234-5678',
    rowIndex: 8,
    createdAt: '2026-10-01T09:15:00.000Z',
  },
  {
    id: 'ATT-10971',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'PRD/TS1',
    submitterPhone: '081-234-5678',
    rowIndex: 9,
    createdAt: '2026-10-01T09:20:00.000Z',
  },
  {
    id: 'ATT-12199',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'PRD/TS1',
    submitterPhone: '081-234-5678',
    rowIndex: 10,
    createdAt: '2026-10-01T09:25:00.000Z',
  },
  {
    id: 'ATT-13803',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'PRD/TS1',
    submitterPhone: '081-234-5678',
    rowIndex: 11,
    createdAt: '2026-10-01T09:30:00.000Z',
  },
  {
    id: 'ATT-15268',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'BM / PGM-E',
    submitterPhone: '081-234-5678',
    rowIndex: 12,
    createdAt: '2026-10-01T09:35:00.000Z',
  },
  {
    id: 'ATT-15348',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'BM / PGM-E',
    submitterPhone: '081-234-5678',
    rowIndex: 13,
    createdAt: '2026-10-01T09:40:00.000Z',
  },
  {
    id: 'ATT-8252',
    courseId: 'EVT-1001',
    courseTitle: 'Effective Leadership & Emotional Intelligence',
    formSheet: 'Register-1',
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
    submitterDept: 'PRD/INJ',
    submitterPhone: '081-234-5678',
    rowIndex: 14,
    createdAt: '2026-10-01T09:45:00.000Z',
  },
];

// Helper to check if initial seeding has already been performed
let isSeedingDone = false;

export async function ensureFirestoreSeeded(): Promise<void> {
  if (isSeedingDone) return;
  try {
    // 1. Seed Courses
    const eventsSnap = await getDocs(collection(db, 'events'));
    if (eventsSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_COURSES.forEach((c) => {
        const ref = doc(db, 'events', c.id);
        batch.set(ref, {
          ...c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log('Successfully seeded initial courses into Firebase Firestore');
    }

    // 2. Seed Holidays
    const holidaysSnap = await getDocs(collection(db, 'holidays'));
    if (holidaysSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_HOLIDAYS.forEach((h) => {
        const ref = doc(db, 'holidays', h.id || `HOL-${h.date}`);
        batch.set(ref, {
          ...h,
          id: h.id || `HOL-${h.date}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log('Successfully seeded initial annual holidays into Firebase Firestore');
    }

    // 3. Seed Attendees
    const attendeesSnap = await getDocs(collection(db, 'attendees'));
    if (attendeesSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_REGISTER_1_ATTENDEES.forEach((a) => {
        const ref = doc(db, 'attendees', a.id || `ATT-${a.code}`);
        batch.set(ref, {
          ...a,
          id: a.id || `ATT-${a.code}`,
          createdAt: a.createdAt || new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log('Successfully seeded initial attendees into Firebase Firestore');
    }

    isSeedingDone = true;
  } catch (err) {
    console.warn('Seeding check warning:', err);
  }
}

// ==================== EVENTS (COURSES) ====================

/**
 * Subscribe to real-time events updates from Firestore
 */
export function subscribeEvents(
  callback: (events: TrainingEvent[]) => void
): () => void {
  ensureFirestoreSeeded();

  const path = 'events';
  const q = query(collection(db, path), orderBy('start', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: TrainingEvent[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as TrainingEvent;
        list.push({ ...data, id: d.id, isEvent: true });
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save or update a course in Firestore
 */
export async function saveEventToFirestore(
  eventData: Partial<TrainingEvent> & { title: string; start: string }
): Promise<TrainingEvent> {
  const path = 'events';
  try {
    const eventId = eventData.id || `EVT-${Date.now()}`;
    const cleanEvent: TrainingEvent = {
      id: eventId,
      category: eventData.category || 'Soft Skill Training',
      title: eventData.title.trim(),
      start: eventData.start,
      end: eventData.end || eventData.start,
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '16:00',
      location: eventData.location || '',
      description: eventData.description || '',
      color: eventData.color || CATEGORY_COLORS[eventData.category as TrainingCategory] || '#FFF2CC',
      textColor: getContrastColor(eventData.color || '#FFF2CC'),
      status: eventData.status || 'ไม่ต้องลงทะเบียน',
      openDate: eventData.openDate || '',
      closeDate: eventData.closeDate || '',
      formSheet: eventData.formSheet || '',
      isEvent: true,
      isHoliday: false,
    };

    const docRef = doc(db, path, eventId);
    await setDoc(docRef, {
      ...cleanEvent,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return cleanEvent;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Delete a course from Firestore
 */
export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  const path = 'events';
  try {
    await deleteDoc(doc(db, path, eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ==================== ANNUAL HOLIDAYS ====================

/**
 * Subscribe to real-time annual holidays from Firestore
 */
export function subscribeHolidays(
  callback: (holidays: HolidayItem[]) => void
): () => void {
  ensureFirestoreSeeded();

  const path = 'holidays';
  const q = query(collection(db, path), orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: HolidayItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as HolidayItem;
        list.push({ ...data, id: d.id });
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save or update an annual holiday in Firestore
 */
export async function saveHolidayToFirestore(
  holidayData: Partial<HolidayItem> & { date: string; name: string }
): Promise<HolidayItem> {
  const path = 'holidays';
  try {
    const id = holidayData.id || `HOL-${holidayData.date}`;
    const cleanHoliday: HolidayItem = {
      id,
      date: holidayData.date,
      name: holidayData.name.trim(),
      category: holidayData.category || 'วันหยุดนักขัตฤกษ์',
      description: holidayData.description || '',
    };

    const docRef = doc(db, path, id);
    await setDoc(docRef, {
      ...cleanHoliday,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return cleanHoliday;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Delete an annual holiday from Firestore
 */
export async function deleteHolidayFromFirestore(holidayId: string): Promise<void> {
  const path = 'holidays';
  try {
    await deleteDoc(doc(db, path, holidayId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Batch save and replace annual holidays in Firestore from Excel upload
 * Replaces existing holidays to prevent duplicates as requested
 */
export async function saveBatchHolidaysToFirestore(
  holidays: HolidayItem[]
): Promise<{ count: number }> {
  const path = 'holidays';
  try {
    // 1. Fetch and delete existing holidays to replace completely and prevent duplicates
    const existingSnap = await getDocs(collection(db, path));
    const deleteRefs = existingSnap.docs.map((d) => d.ref);

    for (let i = 0; i < deleteRefs.length; i += 400) {
      const chunk = deleteRefs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // 2. Insert all new holidays from uploaded Excel
    for (let i = 0; i < holidays.length; i += 400) {
      const chunk = holidays.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((h) => {
        const id = h.id || `HOL-${h.date}`;
        const docRef = doc(db, path, id);
        batch.set(docRef, {
          id,
          date: h.date,
          name: h.name.trim(),
          category: h.category || 'วันหยุดนักขัตฤกษ์',
          description: h.description || '',
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    return { count: holidays.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ==================== ATTENDEES & REGISTRATIONS ====================

export interface AttendeeWithMeta extends AttendeeRow {
  courseId: string;
  courseTitle?: string;
  formSheet?: string;
  receiptNo?: string;
}

/**
 * Subscribe to real-time attendees list (all courses or specific course)
 */
export function subscribeAttendees(
  callback: (attendees: AttendeeWithMeta[]) => void,
  courseIdFilter?: string
): () => void {
  ensureFirestoreSeeded();

  const path = 'attendees';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AttendeeWithMeta[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as AttendeeWithMeta;
        if (!courseIdFilter || item.courseId === courseIdFilter || (item.formSheet && item.formSheet === courseIdFilter)) {
          list.push({ ...item, id: d.id });
        }
      });
      // Sort by rowIndex or createdAt
      list.sort((a, b) => {
        if (a.rowIndex !== undefined && b.rowIndex !== undefined) {
          return a.rowIndex - b.rowIndex;
        }
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Batch save and replace courses in Firestore from Excel upload
 * Replaces existing courses to prevent duplicates as requested
 */
export async function saveBatchCoursesToFirestore(
  courses: TrainingEvent[]
): Promise<{ count: number }> {
  const path = 'events';
  try {
    // 1. Fetch existing course documents and delete to replace completely
    const existingSnap = await getDocs(collection(db, path));
    const deleteRefs = existingSnap.docs
      .filter((d) => {
        const data = d.data();
        return data.isHoliday !== true;
      })
      .map((d) => d.ref);

    for (let i = 0; i < deleteRefs.length; i += 400) {
      const chunk = deleteRefs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // 2. Insert all new courses from uploaded Excel
    for (let i = 0; i < courses.length; i += 400) {
      const chunk = courses.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((c) => {
        const docRef = doc(db, path, c.id);
        batch.set(docRef, {
          ...c,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    return { count: courses.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Add or update attendees in Firestore in batch
 */
export async function addAttendeesToFirestore(
  course: TrainingEvent,
  attendees: AttendeeRow[],
  submitterInfo: { name: string; dept: string; phone: string },
  receiptNo?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const path = 'attendees';
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    attendees.forEach((att, idx) => {
      const attId = att.id || `ATT-${att.code || Date.now()}-${idx}`;
      const docRef = doc(db, path, attId);
      const expectation = (att.expectation || att.exp || '').trim();
      const application = (att.application || att.app || '').trim();
      const remark = (att.remark || att.rem || '').trim();

      const dataToSave: AttendeeWithMeta = {
        id: attId,
        courseId: course.id,
        courseTitle: course.title,
        formSheet: course.formSheet || '',
        code: (att.code || '').trim(),
        sex: att.sex || 'Mr.',
        fname: (att.fname || '').trim(),
        lname: (att.lname || '').trim(),
        dept: (att.dept || '').trim(),
        pos: (att.pos || '').trim(),
        expectation: expectation,
        application: application,
        remark: remark,
        // backward-compatibility aliases
        exp: expectation,
        app: application,
        rem: remark,
        submitterName: (submitterInfo.name || att.submitterName || '').trim(),
        submitterDept: (submitterInfo.dept || att.submitterDept || '').trim(),
        submitterPhone: (submitterInfo.phone || att.submitterPhone || '').trim(),
        receiptNo: receiptNo || '',
        rowIndex: att.rowIndex || Date.now() + idx,
        createdAt: att.createdAt || now,
      };
      batch.set(docRef, dataToSave, { merge: true });
    });

    await batch.commit();
    return { success: true, count: attendees.length };
  } catch (error) {
    console.error('Error adding attendees to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, count: 0, error: String(error) };
  }
}

/**
 * Update a single attendee in Firestore
 */
export async function updateAttendeeInFirestore(
  attendeeId: string,
  data: Partial<AttendeeWithMeta>
): Promise<void> {
  const path = 'attendees';
  try {
    const docRef = doc(db, path, attendeeId);
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Delete one or more attendees by ID
 */
export async function deleteAttendeesFromFirestore(
  attendeeIds: string[]
): Promise<{ success: boolean; count: number }> {
  const path = 'attendees';
  try {
    const batch = writeBatch(db);
    attendeeIds.forEach((id) => {
      const docRef = doc(db, path, id);
      batch.delete(docRef);
    });
    await batch.commit();
    return { success: true, count: attendeeIds.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Clear all attendees for a given course
 */
export async function clearCourseAttendeesFromFirestore(
  courseId: string
): Promise<{ success: boolean; count: number }> {
  const path = 'attendees';
  try {
    const snap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((d) => {
      const data = d.data() as AttendeeWithMeta;
      if (data.courseId === courseId || data.formSheet === courseId) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
    return { success: true, count };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
