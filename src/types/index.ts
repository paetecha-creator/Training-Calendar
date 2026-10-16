export type TrainingCategory =
  | 'Soft Skill Training'
  | 'Technical Skills Training'
  | 'HSE and ISO Training'
  | 'Orientation'
  | 'Other';

export type RegistrationStatus = 'ไม่ต้องลงทะเบียน' | 'ปิด' | 'เปิด';

export type FormSheetName = 'Register-1' | 'Register-2' | 'Register-3' | 'Register-4' | 'Register-5';

export interface TrainingEvent {
  id: string;
  category: TrainingCategory | string;
  title: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location: string;
  description: string;
  color: string;
  textColor?: string;
  status: RegistrationStatus | string;
  openDate?: string;
  closeDate?: string;
  formSheet?: FormSheetName | string;
  isEvent: boolean;
  isHoliday?: boolean;
}

export interface HolidayItem {
  date: string;
  name: string;
}

export interface AttendeeRow {
  code: string;
  sex: 'Mr.' | 'Ms.' | 'Mrs.';
  fname: string;
  lname: string;
  dept: string;
  pos: string;
  exp: string;
  app: string;
  rem?: string;
  submitterName?: string;
  submitterDept?: string;
  submitterPhone?: string;
  rowIndex?: number;
}

export interface RegistrationPayload {
  isEditMode: boolean;
  courseId: string;
  courseTitle: string;
  formSheet: string;
  rowIndices?: number[];
  data: Array<[string, string, string, string, string, string, string, string, string]>;
  submitterName: string;
  submitterDept: string;
  submitterPhone: string;
}

export interface SessionRegistrationData {
  isEditMode: boolean;
  courseId: string;
  courseTitle: string;
  formSheet: string;
  rowIndices: number[];
  rowData: AttendeeRow[];
  openDate?: string;
  closeDate?: string;
  subName: string;
  subDept: string;
  subPhone: string;
  submissionDate?: string;
}
