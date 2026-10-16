import { AttendeeRow } from '../types';

export interface ReceiptInfo {
  receiptNo: string;
  courseTitle: string;
  courseCategory?: string;
  courseDate: string;
  courseTime?: string;
  courseLocation?: string;
  submissionDate: string;
  submitterName: string;
  submitterDept: string;
  submitterPhone: string;
  attendees: AttendeeRow[];
}

export function generateReceiptNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TS-REG-${y}${m}${d}-${random}`;
}

export function downloadRegistrationReceiptPdf(info: ReceiptInfo, customElement?: HTMLElement | null) {
  // If user passed existing rendered card element, use it directly
  let targetElement: HTMLElement;
  let shouldRemoveAfter = false;

  if (customElement) {
    targetElement = customElement;
  } else {
    // Build clean print element
    shouldRemoveAfter = true;
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-export-temporary-container';
    pdfContainer.style.width = '820px';
    pdfContainer.style.padding = '30px';
    pdfContainer.style.backgroundColor = '#ffffff';
    pdfContainer.style.color = '#0f172a';
    pdfContainer.style.fontFamily = "'Prompt', 'Inter', system-ui, sans-serif";
    pdfContainer.style.boxSizing = 'border-box';
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.top = '0';
    pdfContainer.style.left = '0';
    pdfContainer.style.zIndex = '-999';
    pdfContainer.style.opacity = '1';

    const rowsHtml = info.attendees
      .map(
        (a, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: bold; font-family: monospace; color: #0284c7;">${a.code}</td>
          <td style="padding: 6px 8px; color: #475569;">${a.sex}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${a.fname} ${a.lname}</td>
          <td style="padding: 6px 8px; color: #334155;">${a.dept}</td>
          <td style="padding: 6px 8px; color: #334155;">${a.pos}</td>
          <td style="padding: 6px 8px; color: #475569;">${a.exp}</td>
          <td style="padding: 6px 8px; color: #475569;">${a.app}</td>
        </tr>
      `
      )
      .join('');

    pdfContainer.innerHTML = `
      <div style="width: 100%; box-sizing: border-box; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0A3D78; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 20px; font-weight: 900; color: #0A3D78; letter-spacing: 0.5px; line-height: 1.2;">
              TOHOKU SOLUTIONS
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px;">
              Corporate Training & Development Center
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 14px; border-radius: 14px; font-weight: 800; font-size: 11px; border: 1px solid #bbf7d0;">
              ✓ ยืนยันการลงทะเบียนสำเร็จ (CONFIRMED)
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-family: monospace; font-weight: bold;">
              เลขที่เอกสาร: ${info.receiptNo}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 12px 14px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 11px;">
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">หลักสูตรฝึกอบรม (Course Title):</div>
            <div style="font-size: 13px; font-weight: 800; color: #0A3D78;">${info.courseTitle}</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">วันที่และเวลาอบรม (Date & Time):</div>
            <div style="font-weight: 700; color: #0f172a;">${info.courseDate} ${info.courseTime ? `(${info.courseTime} น.)` : ''}</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">ผู้ประสานงาน / ผู้ส่งข้อมูล (Submitter):</div>
            <div style="font-weight: 700; color: #0f172a;">${info.submitterName} (ฝ่าย/แผนก: ${info.submitterDept})</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">เบอร์โทรศัพท์ติดต่อ & วันที่ทำรายการ:</div>
            <div style="font-weight: 700; color: #0f172a;">${info.submitterPhone} | ${info.submissionDate}</div>
          </div>
        </div>

        <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: baseline;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">
            รายชื่อผู้ลงทะเบียนในรอบนี้ (จำนวน ${info.attendees.length} ท่าน)
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="width: 30px; text-align: center; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">#</th>
              <th style="width: 80px; text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">รหัส</th>
              <th style="width: 45px; text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">เพศ</th>
              <th style="text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">ชื่อ - นามสกุล</th>
              <th style="text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">แผนก/ฝ่าย</th>
              <th style="text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">ตำแหน่ง</th>
              <th style="text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">ความคาดหวัง</th>
              <th style="text-align: left; padding: 6px 4px; font-size: 10px; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1;">การปรับใช้</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px;">
          <div>Tohoku Solutions — ระบบบริหารจัดการแผนงานฝึกอบรมองค์กร (Corporate Training System)</div>
          <div>เอกสารอิเล็กทรอนิกส์ยืนยันสถานะสมบูรณ์ ไม่จำเป็นต้องลงนาม</div>
        </div>
      </div>
    `;

    document.body.appendChild(pdfContainer);
    targetElement = pdfContainer;
  }

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Registration_Receipt_${info.receiptNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  const html2pdfWindow = (window as unknown as { html2pdf: () => { set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } } } }).html2pdf;

  if (typeof html2pdfWindow === 'function') {
    html2pdfWindow()
      .set(opt)
      .from(targetElement)
      .save()
      .then(() => {
        if (shouldRemoveAfter && targetElement.parentNode) {
          targetElement.parentNode.removeChild(targetElement);
        }
      })
      .catch((err: unknown) => {
        console.error('PDF generation error', err);
        window.print();
        if (shouldRemoveAfter && targetElement.parentNode) {
          targetElement.parentNode.removeChild(targetElement);
        }
      });
  } else {
    // Fallback print
    window.print();
    if (shouldRemoveAfter && targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}
