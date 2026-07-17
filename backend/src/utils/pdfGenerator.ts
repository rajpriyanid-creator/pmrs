import PDFDocument from 'pdfkit';

export interface PDFLetterOptions {
  type: string;
  templateTitle: string;
  reviewDate: string;
  teamName: string;
  programName?: string;
  guideName: string;
  coordinatorName: string;
  students?: { name: string; rollNo?: string }[];
  externalName?: string;
  externalAffiliation?: string;
  externalEmail?: string;
  signatureBase64?: string;
}

export function generateLetterPDF(options: PDFLetterOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Decorative Header Bar
      doc.rect(50, 40, 495, 5).fill('#B8863B'); // Brass Seal Accent

      // 2. Institution Header
      doc.fillColor('#1B2430').fontSize(14).font('Helvetica-Bold').text('COLLEGE OF ENGINEERING GUINDY', 50, 55, { align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').text('ANNA UNIVERSITY, CHENNAI - 600 025', 50, 72, { align: 'center' });
      doc.fontSize(9).font('Helvetica').text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', 50, 88, { align: 'center' });

      doc.moveTo(50, 102).lineTo(545, 102).strokeColor('#1B2430').lineWidth(1).stroke();
      doc.moveTo(50, 104).lineTo(545, 104).strokeColor('#B8863B').lineWidth(0.5).stroke();

      // 3. Document Ref & Date
      const refNo = `AU/CSE/PRMS/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      doc.fontSize(9).font('Helvetica').fillColor('#1B2430').text(`Ref: ${refNo}`, 50, 115);
      doc.text(`Date: ${options.reviewDate || new Date().toLocaleDateString('en-IN')}`, 380, 115, { align: 'right' });

      // 4. Letter Title Banner
      doc.rect(50, 135, 495, 26).fill('#F6F7F4').strokeColor('#1B2430').lineWidth(0.5).stroke();
      doc.fillColor('#1B2430').fontSize(11).font('Helvetica-Bold').text(options.templateTitle.toUpperCase(), 55, 142, { align: 'center', width: 485 });

      let currentY = 180;

      // 5. External Examiner Details (if applicable)
      if (options.externalName) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B2430').text('To,', 50, currentY);
        currentY += 14;
        doc.fontSize(10).font('Helvetica-Bold').text(options.externalName, 50, currentY);
        currentY += 14;
        if (options.externalAffiliation) {
          doc.fontSize(9).font('Helvetica').text(options.externalAffiliation, 50, currentY);
          currentY += 13;
        }
        if (options.externalEmail) {
          doc.fontSize(9).font('Helvetica').fillColor('#1F5C57').text(`Email: ${options.externalEmail}`, 50, currentY);
          currentY += 13;
        }
        currentY += 10;
      }

      // 6. Salutation & Body Paragraph
      doc.fontSize(10).font('Helvetica').fillColor('#1B2430');
      if (options.externalName) {
        doc.text('Respected Sir / Madam,', 50, currentY);
        currentY += 18;
      }

      let bodyText = '';
      if (options.type === 'viva_letter') {
        bodyText = `We are pleased to inform you that you have been appointed as an External Examiner for conducting the Project Viva-Voce Examination for the students of ${options.programName || 'Degree Programme'}. You are requested to kindly participate in evaluating the project work on the scheduled date.`;
      } else if (options.type === 'internal_examiner_letter') {
        bodyText = `This is to formally communicate your appointment as an Internal Examiner for evaluating the project work of team "${options.teamName}". You are requested to examine the project report, viva presentation, and assign rubric marks as per institutional norms.`;
      } else if (options.type === 'external_examiner_letter') {
        bodyText = `This is to certify that ${options.externalName || 'the External Examiner'} served as External Examiner for conducting project evaluations for team "${options.teamName}" on ${options.reviewDate}. Remuneration / Honorarium claim for the session is hereby approved as per Anna University regulations.`;
      } else {
        bodyText = `You are hereby nominated as the Panel Chairman for presiding over the Project Review and Viva-Voce examination panel for team "${options.teamName}". You are requested to oversee the conduct of the session and sign the consolidated mark sheets.`;
      }

      doc.text(bodyText, 50, currentY, { align: 'justify', width: 495, lineGap: 4 });
      currentY += 65;

      // 7. Project & Team Details Box
      doc.rect(50, currentY, 495, 100).fill('#F6F7F4').strokeColor('#B8863B').lineWidth(0.5).stroke();
      doc.fillColor('#1B2430').fontSize(10).font('Helvetica-Bold').text('PROJECT EVALUATION DETAILS', 60, currentY + 10);

      doc.fontSize(9).font('Helvetica-Bold').text('Team Name:', 60, currentY + 28);
      doc.fontSize(9).font('Helvetica').text(options.teamName, 140, currentY + 28);

      doc.fontSize(9).font('Helvetica-Bold').text('Guide Name:', 60, currentY + 43);
      doc.fontSize(9).font('Helvetica').text(options.guideName, 140, currentY + 43);

      doc.fontSize(9).font('Helvetica-Bold').text('Coordinator:', 60, currentY + 58);
      doc.fontSize(9).font('Helvetica').text(options.coordinatorName, 140, currentY + 58);

      if (options.students && options.students.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Student Members:', 60, currentY + 73);
        const studentStr = options.students.map((s) => `${s.name} (${s.rollNo || 'N/A'})`).join(', ');
        doc.fontSize(9).font('Helvetica').text(studentStr, 155, currentY + 73, { width: 375 });
      }

      currentY += 120;

      // 8. Closing Remarks
      doc.fontSize(10).font('Helvetica').text('Thanking You,', 50, currentY);
      currentY += 30;

      // 9. Signatures Area
      const sigY = currentY;
      doc.fontSize(10).font('Helvetica-Bold').text('Yours Sincerely,', 380, sigY, { align: 'right' });

      if (options.signatureBase64 && options.signatureBase64.startsWith('data:image')) {
        try {
          const base64Data = options.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, 380, sigY + 15, { fit: [120, 45], align: 'right' });
        } catch {
          // Fallback if image parsing fails
        }
      }

      doc.fontSize(10).font('Helvetica-Bold').text(options.coordinatorName, 380, sigY + 65, { align: 'right' });
      doc.fontSize(9).font('Helvetica').text('Project Coordinator / Head of Department', 380, sigY + 78, { align: 'right' });

      // 10. Footer Line
      doc.rect(50, 780, 495, 1).fill('#1B2430');
      doc.fontSize(8).font('Helvetica').fillColor('#1B2430').text('PRMS Official Generated Document — College of Engineering Guindy, Anna University', 50, 785, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
