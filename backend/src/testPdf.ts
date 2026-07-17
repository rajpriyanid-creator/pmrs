import { generateLetterPDF } from './utils/pdfGenerator';
import fs from 'fs';

async function test() {
  console.log('Testing PDF letter generation...');
  const buf = await generateLetterPDF({
    type: 'viva_letter',
    templateTitle: 'Viva Examination Invitation Letter',
    reviewDate: '17/07/2026',
    teamName: 'Team Alpha',
    programName: 'B.E. Computer Science & Engineering',
    guideName: 'Dr. John Smith',
    coordinatorName: 'Dr. Ramesh Gurunath',
    students: [{ name: 'Arun Kumar', rollNo: '2021103001' }],
    externalName: 'Dr. R. Ramanujam',
    externalAffiliation: 'IIT Madras',
    externalEmail: 'ramanujam@iitm.ac.in',
  });
  console.log('Generated PDF Buffer Size:', buf.length, 'bytes');
  fs.writeFileSync('test_output.pdf', buf);
  console.log('Saved to test_output.pdf successfully!');
}

test().catch(console.error);
