import { AttendeeRow } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export async function downloadRegistrationReceiptPdf(
  info: ReceiptInfo,
  customElement?: HTMLElement | null
): Promise<void> {
  let targetElement: HTMLElement;
  let tempWrapper: HTMLElement | null = null;

  if (customElement) {
    // If an on-screen element was provided, clone it into an isolated visible container to guarantee exact styling & dimensions
    const clone = customElement.cloneNode(true) as HTMLElement;
    clone.style.width = '1000px';
    clone.style.margin = '0 auto';
    clone.style.backgroundColor = '#ffffff';

    tempWrapper = document.createElement('div');
    tempWrapper.id = 'pdf-render-wrapper';
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.top = '0';
    tempWrapper.style.left = '-10000px';
    tempWrapper.style.width = '1050px';
    tempWrapper.style.zIndex = '99999';
    tempWrapper.style.backgroundColor = '#ffffff';
    tempWrapper.style.padding = '20px';
    tempWrapper.appendChild(clone);
    document.body.appendChild(tempWrapper);
    targetElement = clone;
  } else {
    // Build clean print element
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-export-temporary-container';
    pdfContainer.style.width = '1000px';
    pdfContainer.style.padding = '28px 32px';
    pdfContainer.style.backgroundColor = '#ffffff';
    pdfContainer.style.color = '#0f172a';
    pdfContainer.style.fontFamily = "'Prompt', 'Inter', system-ui, sans-serif";
    pdfContainer.style.boxSizing = 'border-box';

    const rowsHtml = info.attendees
      .map(
        (a, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: bold; font-family: monospace; color: #1e3a8a;">${a.code || '-'}</td>
          <td style="padding: 7px 8px; color: #475569;">${a.sex || '-'}</td>
          <td style="padding: 7px 8px; font-weight: bold; color: #0f172a;">${a.fname || ''} ${a.lname || ''}</td>
          <td style="padding: 7px 8px; color: #334155;">${a.dept || '-'}</td>
          <td style="padding: 7px 8px; color: #334155;">${a.pos || '-'}</td>
          <td style="padding: 7px 8px; color: #475569; font-size: 10px;">${a.exp || '-'}</td>
          <td style="padding: 7px 8px; color: #475569; font-size: 10px;">${a.app || '-'}</td>
        </tr>
      `
      )
      .join('');

    pdfContainer.innerHTML = `
      <div style="width: 100%; box-sizing: border-box; background: #ffffff;">
        <!-- Header Bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div>
              <img src="/TS_logo.png" alt="TOHOKU SOLUTIONS" style="height: 36px; width: auto; object-fit: contain; display: block;" />
              <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px;">
                Corporate Training & Development Center
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 14px; border-radius: 12px; font-weight: 800; font-size: 11px; border: 1.5px solid #a7f3d0;">
              ✓ ยืนยันการลงทะเบียนสำเร็จ (CONFIRMED)
            </div>
            <div style="font-size: 11px; color: #1e3a8a; margin-top: 5px; font-family: monospace; font-weight: 800;">
              เลขที่เอกสาร: ${info.receiptNo}
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 14px 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0; font-size: 11px;">
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">หลักสูตรฝึกอบรม (Course Title):</div>
            <div style="font-size: 13px; font-weight: 800; color: #1e3a8a;">${info.courseTitle}</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">วันที่และเวลาอบรม (Date & Time):</div>
            <div style="font-weight: 700; color: #0f172a;">${info.courseDate} ${info.courseTime ? `(${info.courseTime} น.)` : ''}</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">ผู้ประสานงาน / ผู้ส่งข้อมูล (Submitter):</div>
            <div style="font-weight: 700; color: #0f172a;">${info.submitterName || '-'} (ฝ่าย/แผนก: ${info.submitterDept || '-'})</div>
          </div>
          <div>
            <div style="color: #64748b; font-weight: 600; margin-bottom: 2px;">เบอร์โทรศัพท์ติดต่อ & วันที่ทำรายการ:</div>
            <div style="font-weight: 700; color: #0f172a;">${info.submitterPhone || '-'} | ${info.submissionDate}</div>
          </div>
        </div>

        <!-- Attendees Section -->
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">
            รายชื่อผู้ลงทะเบียนในรอบนี้ (จำนวน ${info.attendees.length} ท่าน)
          </div>
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">
            ระบบบันทึกสถานะเรียบร้อย
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="width: 32px; text-align: center; padding: 7px 5px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">#</th>
              <th style="width: 85px; text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">รหัสพนักงาน</th>
              <th style="width: 48px; text-align: left; padding: 7px 5px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">เพศ/คำนำ</th>
              <th style="width: 140px; text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">ชื่อ - นามสกุล</th>
              <th style="width: 110px; text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">แผนก/ฝ่าย</th>
              <th style="width: 100px; text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">ตำแหน่ง</th>
              <th style="text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">ความคาดหวัง</th>
              <th style="text-align: left; padding: 7px 6px; font-size: 10px; font-weight: 800; color: #334155; border-bottom: 2px solid #cbd5e1;">การปรับใช้</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #64748b; font-size: 10px;">
          <div>ระบบบริหารจัดการแผนงานฝึกอบรมองค์กร (Corporate Training System)</div>
          <div>เอกสารอิเล็กทรอนิกส์ยืนยันสถานะสมบูรณ์ ไม่จำเป็นต้องลงนาม</div>
        </div>
      </div>
    `;

    tempWrapper = document.createElement('div');
    tempWrapper.id = 'pdf-render-wrapper';
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.top = '0';
    tempWrapper.style.left = '-10000px';
    tempWrapper.style.width = '1050px';
    tempWrapper.style.zIndex = '99999';
    tempWrapper.style.backgroundColor = '#ffffff';
    tempWrapper.style.padding = '20px';
    tempWrapper.appendChild(pdfContainer);
    document.body.appendChild(tempWrapper);
    targetElement = pdfContainer;
  }

  try {
    // Wait briefly for all fonts and layout to calculate cleanly
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      logging: false,
      windowWidth: 1050,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;
    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2;

    const imgW = availW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= availH) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
    } else {
      // Scale proportionally to fit page cleanly
      const scaleFactor = availH / imgH;
      const finalW = imgW * scaleFactor;
      const finalH = availH;
      const offsetX = margin + (availW - finalW) / 2;
      pdf.addImage(imgData, 'PNG', offsetX, margin, finalW, finalH);
    }

    pdf.save(`Registration_Receipt_${info.receiptNo}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    throw err;
  } finally {
    if (tempWrapper && tempWrapper.parentNode) {
      tempWrapper.parentNode.removeChild(tempWrapper);
    }
  }
}
