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
  ]);

  logger.info('Seeding Programs…');
  const ugCse = await Program.create({ name: 'B.E. Computer Science & Engineering', type: 'UG', code: 'UG-CSE' });
  const pgBda = await Program.create({ name: 'M.E. Big Data Analytics', type: 'PG', code: 'PG-BDA' });
  const pgCse = await Program.create({ name: 'M.E. Computer Science & Engineering', type: 'PG', code: 'PG-CSE' });

  const commonPasswordHash = await hashPassword('Pass123!');
  const adminPasswordHash = await hashPassword('ChangeMe123!');

  logger.info('Seeding Faculty & Admin Accounts…');
  // 1. Admin
  const admin = await Faculty.create({
    name: 'System Administrator',
    username: 'admin',
    email: 'admin@prms.edu',
    designation: 'Head of IT & Systems',
    seniority: 1,
    guideLimits: { ug: 4, pg: 2 },
    isAdmin: true,
    passwordHash: adminPasswordHash,
  });

  // 2. Coordinators
  const coordCse = await Faculty.create({
    name: 'Dr. Ramesh Gurunath',
    username: 'coord_cse',
    email: 'ramesh.g@ceg.annauniv.edu',
    designation: 'Professor & UG Coordinator',
    seniority: 2,
    guideLimits: { ug: 5, pg: 3 },
    passwordHash: commonPasswordHash,
  });

  const coordBda = await Faculty.create({
    name: 'Dr. Meena Sundaram',
    username: 'coord_bda',
    email: 'meena.s@ceg.annauniv.edu',
    designation: 'Associate Professor & PG Coordinator',
    seniority: 3,
    guideLimits: { ug: 2, pg: 6 },
    passwordHash: commonPasswordHash,
  });

  // 3. Guides
  const guideSmith = await Faculty.create({
    name: 'Dr. John Smith',
    username: 'guide_smith',
    email: 'john.smith@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 4,
    guideLimits: { ug: 4, pg: 2 },
    passwordHash: commonPasswordHash,
  });

  const guideKumar = await Faculty.create({
    name: 'Dr. Vijay Kumar',
    username: 'guide_kumar',
    email: 'vijay.kumar@ceg.annauniv.edu',
    designation: 'Associate Professor',
    seniority: 5,
    guideLimits: { ug: 3, pg: 3 },
    passwordHash: commonPasswordHash,
  });

  const guideRadha = await Faculty.create({
    name: 'Dr. S. Radha',
    username: 'guide_radha',
    email: 'radha.s@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 6,
    guideLimits: { ug: 5, pg: 2 },
    passwordHash: commonPasswordHash,
  });

  // 4. Panel Members
  const panelAnita = await Faculty.create({
    name: 'Dr. Anita Roy',
    username: 'panel_anita',
    email: 'anita.roy@ceg.annauniv.edu',
    designation: 'Assistant Professor',
    seniority: 7,
    guideLimits: { ug: 3, pg: 2 },
    memberType: 'internal',
    passwordHash: commonPasswordHash,
  });

  const panelKarthik = await Faculty.create({
    name: 'Dr. Karthik Raja',
    username: 'panel_karthik',
    email: 'karthik.raja@ceg.annauniv.edu',
    designation: 'Senior Faculty',
    seniority: 8,
    guideLimits: { ug: 4, pg: 4 },
    memberType: 'internal',
    passwordHash: commonPasswordHash,
  });

  // 5. Assistant
  const assistantModi = await Faculty.create({
    name: 'Mr. Rajesh Modi',
    username: 'assistant_modi',
    email: 'rajesh.modi@ceg.annauniv.edu',
    designation: 'Lab Assistant / Data Entry',
    seniority: 10,
    guideLimits: { ug: 0, pg: 0 },
    isAssistant: true,
    passwordHash: commonPasswordHash,
  });

  logger.info('Seeding Students…');
  const studentDefs = [
    { name: 'Arun Kumar', rollNo: '2021103001', username: 'stu_arun', email: 'arun@student.ceg.edu', program: ugCse._id },
    { name: 'Bala Chandran', rollNo: '2021103002', username: 'stu_bala', email: 'bala@student.ceg.edu', program: ugCse._id },
    { name: 'Chitra Devi', rollNo: '2021103003', username: 'stu_chitra', email: 'chitra@student.ceg.edu', program: ugCse._id },
    { name: 'Divya Prakash', rollNo: '2021103004', username: 'stu_divya', email: 'divya@student.ceg.edu', program: ugCse._id },
    { name: 'Elena Gilbert', rollNo: '2021103005', username: 'stu_elena', email: 'elena@student.ceg.edu', program: ugCse._id },
    { name: 'Faisal Khan', rollNo: '2021103006', username: 'stu_faisal', email: 'faisal@student.ceg.edu', program: ugCse._id },
    { name: 'Gautam Menon', rollNo: '2024204001', username: 'stu_gautam', email: 'gautam@student.ceg.edu', program: pgBda._id },
    { name: 'Hari Prasad', rollNo: '2024204002', username: 'stu_hari', email: 'hari@student.ceg.edu', program: pgBda._id },
  ];

  const students = await Promise.all(
    studentDefs.map((s) => Student.create({ ...s, passwordHash: commonPasswordHash }))
  );

  logger.info('Seeding Teams…');
  // Team 1: Alpha Systems (UG CSE - 2 members)
  const teamAlpha = await Team.create({
    name: 'Team Alpha (Autonomous Nav Bot)',
    program: ugCse._id,
    students: [students[0]._id, students[1]._id],
    guideId: guideSmith._id,
    status: 'active',
    lockInitiatedBy: students[0]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 2: Cyber Shield (UG CSE - 2 members)
  const teamBeta = await Team.create({
    name: 'Team Cyber Shield (Threat Detection)',
    program: ugCse._id,
    students: [students[2]._id, students[3]._id],
    guideId: guideKumar._id,
    status: 'active',
    lockInitiatedBy: students[2]._id,
    lockConfirmedAt: new Date(),
  });

  // Team 3: BDA Analytics (PG BDA - Solo team)
  const teamGamma = await Team.create({
    name: 'Team BigData (Predictive Health)',
    program: pgBda._id,
    students: [students[6]._id],
    guideId: guideRadha._id,
    status: 'active',
    lockInitiatedBy: students[6]._id,
    lockConfirmedAt: new Date(),
  });

  logger.info('Seeding Review Panels & Viva Panels…');
  const reviewPanelUG = await ReviewPanel.create({
    program: ugCse._id,
    coordinatorId: coordCse._id,
    memberIds: [panelAnita._id, panelKarthik._id],
    teamIds: [teamAlpha._id, teamBeta._id],
  });

  const vivaPanelUG = await VivaPanel.create({
    program: ugCse._id,
    coordinatorId: coordCse._id,
    internalMembers: [panelAnita._id, panelKarthik._id],
    externalMembers: [
      { name: 'Dr. R. Ramanujam', affiliation: 'IIT Madras', email: 'ramanujam@iitm.ac.in' },
    ],
    teamIds: [teamAlpha._id, teamBeta._id],
  });

  logger.info('Seeding Reviews, Attendance & Rubric Marks…');
  const reviewTypes = ['review0', 'review1', 'review2', 'review3', 'viva'] as const;

  for (const team of [teamAlpha, teamBeta, teamGamma]) {
    for (const rType of reviewTypes) {
      const isReview0 = rType === 'review0';
      const isReview1 = rType === 'review1';
      const isClosed = isReview0 || isReview1; // Review 0 & Review 1 closed

      const review = await Review.create({
        teamId: team._id,
        type: rType,
        scheduledDate: new Date('2025-02-10T10:00:00Z'),
        scheduledTime: '10:00',
        durationMinutes: 30,
        hasMarks: !isReview0,
        closed: isClosed,
      });

      // Attendance
      await Attendance.create({
        teamId: team._id,
        reviewId: review._id,
        kind: 'review',
        perStudent: team.students.map((sid) => ({ studentId: sid, present: true })),
        reviewDate: new Date('2025-02-10'),
        recordedBy: coordCse._id,
      });

      // Rubric Marks for Review 1 (Guide + Panel)
      if (isReview1) {
        for (const studentId of team.students) {
          // Guide marks entry
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
            mark4: 8, // total 34/40 = 85%
            confirmed: true,
            submittedAt: new Date(),
          });

          // Panel marks entry
          await MarksEntry.create({
            teamId: team._id,
            reviewId: review._id,
            studentId,
            enteredBy: panelAnita._id,
            role: 'panel',
            slotType: 'review1',
            mark1: 8,
            mark2: 8,
            mark3: 9,
            mark4: 7, // total 32/40 = 80%
            confirmed: true,
            submittedAt: new Date(),
          });
        }

        // Marks Summary
        await MarksSummary.create({
          teamId: team._id,
          reviewId: review._id,
          average: 82.5,
          breakdown: [
            { role: 'guide', studentId: team.students[0].toString(), percentage: 85 },
            { role: 'panel', studentId: team.students[0].toString(), percentage: 80 },
          ],
        });
      }
    }
  }

  logger.info('Seeding Availability & Scheduled Slots…');
  await AvailabilitySlot.create({
    facultyId: guideSmith._id,
    role: 'guide',
    periodLabel: 'Review 2 Period — March 2025',
    startTime: new Date('2025-03-01T09:00:00Z'),
    endTime: new Date('2025-03-01T17:00:00Z'),
  });

  await ScheduledSlot.create({
    teamId: teamAlpha._id,
    reviewType: 'review2',
    startTime: new Date('2025-03-01T10:00:00Z'),
    endTime: new Date('2025-03-01T10:30:00Z'),
    facultyIds: [guideSmith._id, panelAnita._id],
    createdBy: coordCse._id,
    periodLabel: 'Review 2 Period — March 2025',
  });

  logger.info('Seeding AdminConfig…');
  await AdminConfig.create({
    guideSelectionOpen: true,
    guideSelectionWindowStart: new Date('2025-01-01'),
    guideSelectionWindowEnd: new Date('2025-12-31'),
    teamFormationOpen: true,
  });

  logger.info('Seeding Final Report Upload for Team Alpha…');
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const demoPdfPath = path.join(uploadsDir, 'demo-report.pdf');
  if (!fs.existsSync(demoPdfPath)) {
    fs.writeFileSync(demoPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kinds [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  }

  await FinalReport.create({
    teamId: teamAlpha._id,
    filename: 'Team_Alpha_Final_Report_v1.pdf',
    filePath: 'uploads/demo-report.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048500,
    uploadedBy: students[0]._id,
    status: 'approved',
    approvedBy: guideSmith._id,
    approvedAt: new Date(),
  });

  logger.info('====================================================');
  logger.info('SUCCESSFULLY CLEARED DB AND POPULATED DEMO DATA!');
  logger.info('====================================================');
  logger.info('System Admin:    admin / ChangeMe123!');
  logger.info('Coordinator:     coord_cse / Pass123!');
  logger.info('Guide:           guide_smith / Pass123!');
  logger.info('Panel Member:    panel_anita / Pass123!');
  logger.info('Assistant:       assistant_modi / Pass123!');
  logger.info('Student:         stu_arun / Pass123!');
  logger.info('====================================================');

  await disconnectDB();
  process.exit(0);
}

populateFullData().catch((err) => {
  logger.error(`Population failed: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
