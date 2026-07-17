import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { Program } from '../models/Program';
import { Faculty } from '../models/Faculty';
import { Student } from '../models/Student';
import { Team } from '../models/Team';
import { ReviewPanel, VivaPanel } from '../models/Panel';
import { Review } from '../models/Review';
import { Attendance } from '../models/Attendance';
import { MarksEntry, MarksSummary } from '../models/Marks';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { ScheduledSlot } from '../models/ScheduledSlot';
import { AdminConfig } from '../models/AdminConfig';
import { FinalReport } from '../models/FinalReport';
import { InstructionTemplate } from '../models/InstructionTemplate';
import { Signature } from '../models/Signature';
import { DesignationLimit } from '../models/DesignationLimit';
import { hashPassword } from '../utils/password';
import { logger } from '../config/logger';

async function populateFullData() {
  await connectDB();
  logger.info('Wiping all existing collections…');

  await Promise.all([
    Program.deleteMany({}),
    Faculty.deleteMany({}),
    Student.deleteMany({}),
    Team.deleteMany({}),
    ReviewPanel.deleteMany({}),
    VivaPanel.deleteMany({}),
    Review.deleteMany({}),
    Attendance.deleteMany({}),
    MarksEntry.deleteMany({}),
    MarksSummary.deleteMany({}),
    AvailabilitySlot.deleteMany({}),
    ScheduledSlot.deleteMany({}),
    AdminConfig.deleteMany({}),
    FinalReport.deleteMany({}),
    InstructionTemplate.deleteMany({}),
    Signature.deleteMany({}),
    DesignationLimit.deleteMany({}),
  ]);

  logger.info('Seeding Designation Limits…');
  await DesignationLimit.create([
    { designation: 'Professor', ugLimit: 6, pgLimit: 4 },
    { designation: 'Associate Professor', ugLimit: 5, pgLimit: 3 },
    { designation: 'Assistant Professor', ugLimit: 4, pgLimit: 2 },
  ]);

  logger.info('Seeding Programs…');
  const ugCse = await Program.create({ name: 'B.E. Computer Science & Engineering', type: 'UG', code: 'UG-CSE', maxTeamSize: 4 });
  const ugIt = await Program.create({ name: 'B.Tech Information Technology', type: 'UG', code: 'UG-IT', maxTeamSize: 4 });
  const pgBda = await Program.create({ name: 'M.E. Big Data Analytics', type: 'PG', code: 'PG-BDA', maxTeamSize: 4 });
  const pgCse = await Program.create({ name: 'M.E. Computer Science & Engineering', type: 'PG', code: 'PG-CSE', maxTeamSize: 4 });
  const pgSe = await Program.create({ name: 'M.E. Software Engineering', type: 'PG', code: 'PG-SE', maxTeamSize: 4 });

  const commonPasswordHash = await hashPassword('Password@123');
  const adminPasswordHash = await hashPassword('Password@123');

  logger.info('Seeding Faculty & Admin Accounts…');
  // Admin
  const admin = await Faculty.create({
    name: 'System Administrator',
    username: 'admin',
    email: 'admin@prms.edu',
    designation: 'Head of IT & Systems',
    seniority: 1,
    guideLimits: { ug: 6, pg: 4 },
    isAdmin: true,
    passwordHash: adminPasswordHash,
  });

  // Coordinators
  const coordCse = await Faculty.create({
    name: 'Dr. Ramesh Gurunath',
    username: 'coord_cse',
    email: 'ramesh.g@ceg.annauniv.edu',
    designation: 'Professor',
    seniority: 2,
    guideLimits: { ug: 6, pg: 4 },
    passwordHash: commonPasswordHash,
  });

  const coordIt = await Faculty.create({
    name: 'Dr. K. S. Ravichandran',
    username: 'coord_it',
    email: 'ravichandran.ks@ceg.annauniv.edu',
    designation: 'Professor',
    seniority: 3,
    guideLimits: { ug: 6, pg: 4 },
    passwordHash: commonPasswordHash,
  });

  const coordBda = await Faculty.create({
    name: 'Dr. Meena Sundaram',
    username: 'coord_bda',
    email: 'meena.s@ceg.annauniv.edu',
    designation: 'Associate Professor',
    seniority: 4,
    guideLimits: { ug: 5, pg: 3 },
    passwordHash: commonPasswordHash,
  });

  // Guides & Faculty
  const guideSmith = await Faculty.create({
    name: 'Dr. John Smith',
    username: 'guide_smith',
    email: 'john.smith@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 5,
    guideLimits: { ug: 4, pg: 2 },
    passwordHash: commonPasswordHash,
  });

  const guideKumar = await Faculty.create({
    name: 'Dr. Vijay Kumar',
    username: 'guide_kumar',
    email: 'vijay.kumar@ceg.annauniv.edu',
    designation: 'Associate Professor',
    seniority: 6,
    guideLimits: { ug: 5, pg: 3 },
    passwordHash: commonPasswordHash,
  });

  const guideRadha = await Faculty.create({
    name: 'Dr. S. Radha',
    username: 'guide_radha',
    email: 'radha.s@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 7,
    guideLimits: { ug: 4, pg: 2 },
    passwordHash: commonPasswordHash,
  });

  const guidePriya = await Faculty.create({
    name: 'Dr. V. Priya',
    username: 'guide_priya',
    email: 'priya.v@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 8,
    guideLimits: { ug: 4, pg: 2 },
    passwordHash: commonPasswordHash,
  });

  const panelAnita = await Faculty.create({
    name: 'Dr. Anita Roy',
    username: 'panel_anita',
    email: 'anita.roy@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 9,
    guideLimits: { ug: 4, pg: 2 },
    memberType: 'internal',
    passwordHash: commonPasswordHash,
  });

  const panelKarthik = await Faculty.create({
    name: 'Dr. Karthik Raja',
    username: 'panel_karthik',
    email: 'karthik.raja@ceg.annauniv.edu',
    designation: 'Associate Professor',
    seniority: 10,
    guideLimits: { ug: 5, pg: 3 },
    memberType: 'internal',
    passwordHash: commonPasswordHash,
  });

  const panelDeepa = await Faculty.create({
    name: 'Dr. M. Deepa',
    username: 'panel_deepa',
    email: 'deepa.m@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 11,
    guideLimits: { ug: 4, pg: 2 },
    memberType: 'internal',
    passwordHash: commonPasswordHash,
  });

  const assistantModi = await Faculty.create({
    name: 'Mr. Rajesh Modi',
    username: 'assistant_modi',
    email: 'rajesh.modi@ceg.annauniv.edu',
    designation: 'Lab Assistant',
    seniority: 12,
    guideLimits: { ug: 0, pg: 0 },
    isAssistant: true,
    passwordHash: commonPasswordHash,
  });

  logger.info('Seeding Students…');
  const studentDataList = [
    // UG CSE Students
    { name: 'Arun Kumar', rollNo: '2021103001', username: 'stu_arun', email: 'arun@student.ceg.edu', program: ugCse._id },
    { name: 'Bala Chandran', rollNo: '2021103002', username: 'stu_bala', email: 'bala@student.ceg.edu', program: ugCse._id },
    { name: 'Chitra Devi', rollNo: '2021103003', username: 'stu_chitra', email: 'chitra@student.ceg.edu', program: ugCse._id },
    { name: 'Divya Prakash', rollNo: '2021103004', username: 'stu_divya', email: 'divya@student.ceg.edu', program: ugCse._id },
    { name: 'Elena Gilbert', rollNo: '2021103005', username: 'stu_elena', email: 'elena@student.ceg.edu', program: ugCse._id },
    { name: 'Faisal Khan', rollNo: '2021103006', username: 'stu_faisal', email: 'faisal@student.ceg.edu', program: ugCse._id },
    { name: 'Gokul Nath', rollNo: '2021103007', username: 'stu_gokul', email: 'gokul@student.ceg.edu', program: ugCse._id },
    { name: 'Harini Shree', rollNo: '2021103008', username: 'stu_harini', email: 'harini@student.ceg.edu', program: ugCse._id },

    // UG IT Students
    { name: 'Indrajith V', rollNo: '2021104001', username: 'stu_indra', email: 'indra@student.ceg.edu', program: ugIt._id },
    { name: 'Janani Ramesh', rollNo: '2021104002', username: 'stu_janani', email: 'janani@student.ceg.edu', program: ugIt._id },
    { name: 'Karthik Subbaraj', rollNo: '2021104003', username: 'stu_ks', email: 'ks@student.ceg.edu', program: ugIt._id },
    { name: 'Lavanya S', rollNo: '2021104004', username: 'stu_lavanya', email: 'lavanya@student.ceg.edu', program: ugIt._id },

    // PG BDA Students
    { name: 'Gautam Menon', rollNo: '2024204001', username: 'stu_gautam', email: 'gautam@student.ceg.edu', program: pgBda._id },
    { name: 'Hari Prasad', rollNo: '2024204002', username: 'stu_hari', email: 'hari@student.ceg.edu', program: pgBda._id },
    { name: 'Ishwarya R', rollNo: '2024204003', username: 'stu_ishu', email: 'ishu@student.ceg.edu', program: pgBda._id },
    { name: 'Jayanth Kumar', rollNo: '2024204004', username: 'stu_jayanth', email: 'jayanth@student.ceg.edu', program: pgBda._id },

    // PG CSE Students
    { name: 'Kavitha P', rollNo: '2024205001', username: 'stu_kavitha', email: 'kavitha@student.ceg.edu', program: pgCse._id },
    { name: 'Lokesh Sharma', rollNo: '2024205002', username: 'stu_lokesh', email: 'lokesh@student.ceg.edu', program: pgCse._id },
  ];

  const students = await Promise.all(
    studentDataList.map((s) => Student.create({ ...s, passwordHash: commonPasswordHash }))
  );

  logger.info('Seeding Teams…');
  // Team 1: Alpha Systems (UG CSE)
  const teamAlpha = await Team.create({
    name: 'Team Alpha (Autonomous Nav Bot)',
    program: ugCse._id,
    students: [students[0]._id, students[1]._id],
    guideId: guideSmith._id,
    status: 'active',
    lockInitiatedBy: students[0]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 2: Cyber Shield (UG CSE)
  const teamBeta = await Team.create({
    name: 'Team Cyber Shield (Threat Detection)',
    program: ugCse._id,
    students: [students[2]._id, students[3]._id],
    guideId: guideKumar._id,
    status: 'active',
    lockInitiatedBy: students[2]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 3: Neural Vision (UG CSE)
  const teamGamma = await Team.create({
    name: 'Team Neural Vision (Diagnostic AI)',
    program: ugCse._id,
    students: [students[4]._id, students[5]._id],
    guideId: guideRadha._id,
    status: 'active',
    lockInitiatedBy: students[4]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 4: Quantum Net (UG CSE)
  const teamDelta = await Team.create({
    name: 'Team Quantum Net (PQC Protocols)',
    program: ugCse._id,
    students: [students[6]._id, students[7]._id],
    guideId: guidePriya._id,
    status: 'active',
    lockInitiatedBy: students[6]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 5: Smart City (UG IT)
  const teamSmartCity = await Team.create({
    name: 'Team Smart City IoT',
    program: ugIt._id,
    students: [students[8]._id, students[9]._id],
    guideId: guideSmith._id,
    status: 'active',
    lockInitiatedBy: students[8]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 6: BigData Health (PG BDA)
  const teamBigData = await Team.create({
    name: 'Team Predictive Health Analytics',
    program: pgBda._id,
    students: [students[12]._id, students[13]._id],
    guideId: guideRadha._id,
    status: 'active',
    lockInitiatedBy: students[12]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 7: Financial Fraud (PG BDA)
  const teamFraud = await Team.create({
    name: 'Team Fraud Detection Engine',
    program: pgBda._id,
    students: [students[14]._id, students[15]._id],
    guideId: guideKumar._id,
    status: 'active',
    lockInitiatedBy: students[14]._id,
    lockConfirmedAt: new Date(),
  });

  logger.info('Seeding Review Panels & Viva Panels…');
  const reviewPanelUGCSE = await ReviewPanel.create({
    program: ugCse._id,
    coordinatorId: coordCse._id,
    memberIds: [panelAnita._id, panelKarthik._id, panelDeepa._id],
    teamIds: [teamAlpha._id, teamBeta._id, teamGamma._id, teamDelta._id],
  });

  const vivaPanelUGCSE = await VivaPanel.create({
    program: ugCse._id,
    coordinatorId: coordCse._id,
    internalMembers: [panelAnita._id, panelKarthik._id],
    externalMembers: [
      { name: 'Dr. R. Ramanujam', affiliation: 'IIT Madras', email: 'ramanujam@iitm.ac.in' },
    ],
    teamIds: [teamAlpha._id, teamBeta._id, teamGamma._id, teamDelta._id],
  });

  const reviewPanelPGBDA = await ReviewPanel.create({
    program: pgBda._id,
    coordinatorId: coordBda._id,
    memberIds: [panelAnita._id, panelKarthik._id],
    teamIds: [teamBigData._id, teamFraud._id],
  });

  logger.info('Seeding Reviews, Attendance & Rubric Marks…');
  const allTeams = [teamAlpha, teamBeta, teamGamma, teamDelta, teamSmartCity, teamBigData, teamFraud];

  for (const team of allTeams) {
    const reviewsToCreate = [
      { type: 'review0', date: new Date('2025-01-15T09:30:00Z'), closed: true, hasMarks: false },
      { type: 'review1', date: new Date('2025-02-10T10:00:00Z'), closed: true, hasMarks: true },
      { type: 'review2', date: new Date('2025-03-05T11:00:00Z'), closed: false, hasMarks: true },
      { type: 'viva', date: new Date('2025-04-20T09:00:00Z'), closed: false, hasMarks: true },
    ];

    for (const rDef of reviewsToCreate) {
      const review = await Review.create({
        teamId: team._id,
        type: rDef.type,
        scheduledDate: rDef.date,
        scheduledTime: '10:00',
        durationMinutes: 30,
        hasMarks: rDef.hasMarks,
        closed: rDef.closed,
      });

      // Attendance
      await Attendance.create({
        teamId: team._id,
        reviewId: review._id,
        kind: 'review',
        perStudent: team.students.map((sid, idx) => ({ studentId: sid, present: idx % 4 !== 3 })),
        reviewDate: rDef.date,
        recordedBy: coordCse._id,
      });

      // Marks for closed review 1
      if (rDef.type === 'review1') {
        for (const studentId of team.students) {
          await MarksEntry.create({
            teamId: team._id,
            reviewId: review._id,
            studentId,
            enteredBy: guideSmith._id,
            role: 'guide',
            slotType: 'review1',
            mark1: 9,
            mark2: 8,
            mark3: 9,
            mark4: 8,
            confirmed: true,
            submittedAt: new Date(),
          });

          await MarksEntry.create({
            teamId: team._id,
            reviewId: review._id,
            studentId,
            enteredBy: panelAnita._id,
            role: 'panel',
            slotType: 'review1',
            mark1: 8,
            mark2: 9,
            mark3: 8,
            mark4: 8,
            confirmed: true,
            submittedAt: new Date(),
          });
        }

        await MarksSummary.create({
          teamId: team._id,
          reviewId: review._id,
          average: 84.0,
          breakdown: [
            { role: 'guide', studentId: team.students[0].toString(), percentage: 85 },
            { role: 'panel', studentId: team.students[0].toString(), percentage: 83 },
          ],
        });
      }
    }
  }

  logger.info('Seeding Availability & Scheduled Slots…');
  await AvailabilitySlot.create([
    {
      facultyId: guideSmith._id,
      role: 'guide',
      periodLabel: 'Odd Sem 2026',
      startTime: new Date('2026-03-01T09:00:00Z'),
      endTime: new Date('2026-03-01T17:00:00Z'),
    },
    {
      facultyId: panelAnita._id,
      role: 'panel',
      periodLabel: 'Odd Sem 2026',
      startTime: new Date('2026-03-02T09:00:00Z'),
      endTime: new Date('2026-03-02T17:00:00Z'),
    },
  ]);

  await ScheduledSlot.create([
    {
      teamId: teamAlpha._id,
      reviewType: 'review1',
      startTime: new Date('2026-03-01T10:00:00Z'),
      endTime: new Date('2026-03-01T10:30:00Z'),
      facultyIds: [guideSmith._id, panelAnita._id],
      createdBy: coordCse._id,
      periodLabel: 'Odd Sem 2026',
      notified: true,
    },
    {
      teamId: teamBeta._id,
      reviewType: 'review1',
      startTime: new Date('2026-03-01T10:30:00Z'),
      endTime: new Date('2026-03-01T11:00:00Z'),
      facultyIds: [guideKumar._id, panelKarthik._id],
      createdBy: coordCse._id,
      periodLabel: 'Odd Sem 2026',
      notified: true,
    },
    {
      teamId: teamGamma._id,
      reviewType: 'review2',
      startTime: new Date('2026-03-02T11:00:00Z'),
      endTime: new Date('2026-03-02T11:30:00Z'),
      facultyIds: [guideRadha._id, panelDeepa._id],
      createdBy: coordCse._id,
      periodLabel: 'Odd Sem 2026',
      notified: true,
    },
  ]);

  logger.info('Seeding Instruction Templates…');
  await InstructionTemplate.create([
    {
      program: 'UG',
      title: 'Review 1 Evaluation Guidelines & Rubrics',
      instructions: 'Each team must present their problem statement, architecture diagram, literature survey, and preliminary prototype. Maximum 15 minutes presentation + 10 minutes Q&A.',
      fileName: 'UG_Review1_Rubrics_2026.pdf',
      uploadedBy: coordCse._id,
    },
    {
      program: 'PG',
      title: 'PG Thesis Phase-I Review Guidelines',
      instructions: 'PG students are required to submit their IEEE format draft paper, dataset citation, algorithm flowchart, and preliminary performance benchmarks.',
      fileName: 'PG_Phase1_Guidelines.pdf',
      uploadedBy: coordBda._id,
    },
  ]);

  logger.info('Seeding Digital Signatures…');
  const sampleSignatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await Signature.create([
    {
      ownerId: admin._id,
      ownerModel: 'Faculty',
      role: 'HOD',
      label: 'HOD Signature',
      filename: 'hod_sig.png',
      imageBase64: sampleSignatureBase64,
    },
    {
      ownerId: coordCse._id,
      ownerModel: 'Faculty',
      role: 'Coordinator',
      label: 'UG Coordinator Seal',
      filename: 'coord_seal.png',
      imageBase64: sampleSignatureBase64,
    },
  ] as any);

  logger.info('Seeding AdminConfig…');
  await AdminConfig.create({
    guideSelectionOpen: true,
    guideSelectionWindowStart: new Date('2025-01-01'),
    guideSelectionWindowEnd: new Date('2026-12-31'),
    teamFormationOpen: true,
  });

  logger.info('Seeding Final Reports & Rejection Audits…');
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const demoPdfPath = path.join(uploadsDir, 'demo-report.pdf');
  if (!fs.existsSync(demoPdfPath)) {
    fs.writeFileSync(demoPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kinds [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  }

  await FinalReport.create([
    {
      teamId: teamAlpha._id,
      filename: 'Team_Alpha_Final_Report_Approved.pdf',
      filePath: 'uploads/demo-report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048500,
      uploadedBy: students[0]._id,
      status: 'approved',
      approvedBy: guideSmith._id,
      approvedAt: new Date(),
    },
    {
      teamId: teamBeta._id,
      filename: 'Team_Beta_Final_Report_v2.pdf',
      filePath: 'uploads/demo-report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1850400,
      uploadedBy: students[2]._id,
      status: 'rejected',
      remarks: 'Incomplete literature survey section. Update citations to IEEE format and re-upload.',
      rejections: [
        {
          filePath: 'uploads/demo-report.pdf',
          filename: 'Team_Beta_Final_Report_v1.pdf',
          remarks: 'Formatting errors in abstract and table of contents.',
          rejectedAt: new Date('2025-03-01'),
        },
      ],
    },
    {
      teamId: teamBigData._id,
      filename: 'PG_BigData_Final_Thesis_Draft.pdf',
      filePath: 'uploads/demo-report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 3105000,
      uploadedBy: students[12]._id,
      status: 'uploaded',
    },
  ]);

  logger.info('====================================================');
  logger.info('SUCCESSFULLY SEEDED EXTENSIVE PRMS DEMO DATA!');
  logger.info('====================================================');
  logger.info('All accounts use password: Password@123');
  logger.info('System Admin:    admin');
  logger.info('UG Coordinator:  coord_cse / coord_it');
  logger.info('PG Coordinator:  coord_bda');
  logger.info('Guides:          guide_smith / guide_kumar / guide_radha / guide_priya');
  logger.info('Panel Members:   panel_anita / panel_karthik / panel_deepa');
  logger.info('Assistant:       assistant_modi');
  logger.info('Students:        stu_arun / stu_bala / stu_chitra / stu_gautam');
  logger.info('====================================================');

  await disconnectDB();
  process.exit(0);
}

populateFullData().catch((err) => {
  logger.error(`Population failed: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
