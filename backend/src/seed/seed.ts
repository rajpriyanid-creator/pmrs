import { connectDB, disconnectDB } from '../config/db';
import { Program } from '../models/Program';
import { Faculty } from '../models/Faculty';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function seed() {
  await connectDB();

  const programDefs = [
    { name: 'B.E. Computer Science', type: 'UG' as const, code: 'UG-CSE' },
    { name: 'M.E. Big Data Analytics', type: 'PG' as const, code: 'PG-BDA' },
    { name: 'M.E. Computer Science', type: 'PG' as const, code: 'PG-CSE' },
    { name: 'M.E. Software Engineering', type: 'PG' as const, code: 'PG-SE' },
  ];

  for (const def of programDefs) {
    await Program.findOneAndUpdate({ code: def.code }, def, { upsert: true });
  }
  logger.info(`Seeded ${programDefs.length} programs`);

  const adminExists = await Faculty.findOne({ username: env.ADMIN_SEED_USERNAME });
  if (!adminExists) {
    const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);
    await Faculty.create({
      name: 'System Administrator',
      username: env.ADMIN_SEED_USERNAME,
      email: `${env.ADMIN_SEED_USERNAME}@prms.local`,
      designation: 'Administrator',
      seniority: 1,
      guideLimits: { ug: 0, pg: 0 },
      isAdmin: true,
      passwordHash,
    });
    logger.info(`Seeded admin account: ${env.ADMIN_SEED_USERNAME} / ${env.ADMIN_SEED_PASSWORD}`);
    logger.warn('CHANGE THE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN.');
  } else {
    logger.info('Admin account already exists, skipping');
  }

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
