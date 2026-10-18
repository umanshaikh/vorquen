import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/db/prisma';

async function main() {
  console.log('\n========================================================');
  console.log('   VORQUEN PRIVATE OWNER ACCOUNT SETUP & AUTHORIZATION   ');
  console.log('========================================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let email = '';
  let password = '';
  let fullName = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1].trim().toLowerCase();
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      fullName = args[i + 1];
      i++;
    }
  }

  if (!email) {
    console.error('ERROR: Missing required email address.\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/setup-owner.ts --email owner@vorquen.com [--password MySecurePassword123] [--name "VORQUEN Owner"]\n');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`ERROR: "${email}" is not a valid email address.`);
    process.exit(1);
  }

  console.log(`[INFO] Checking database for existing account: ${email}...`);
  const existingProfile = await prisma.profile.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (existingProfile) {
    console.log(`[FOUND] Existing account located for "${existingProfile.fullName}" (${existingProfile.id})`);

    // Update password if specified
    const updateData: any = {
      isOwner: true,
    };

    if (password) {
      if (password.length < 8) {
        console.error('ERROR: New password must be at least 8 characters long.');
        process.exit(1);
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
      console.log('[SECURITY] Password updated to provided secure password.');
    }

    if (fullName) {
      updateData.fullName = fullName;
    }

    await prisma.profile.update({
      where: { id: existingProfile.id },
      data: updateData,
    });

    // Ensure 'admin' role is assigned
    const hasAdminRole = existingProfile.roles.some((r) => r.role === 'admin');
    if (!hasAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: existingProfile.id,
          role: 'admin',
        },
      });
      console.log('[RBAC] Granted "admin" role in database.');
    }

    // Ensure 'owner' role is assigned
    const hasOwnerRole = existingProfile.roles.some((r) => r.role === 'owner');
    if (!hasOwnerRole) {
      await prisma.userRole.create({
        data: {
          userId: existingProfile.id,
          role: 'owner',
        },
      });
      console.log('[RBAC] Granted "owner" role in database.');
    }

    // Log security audit event
    await prisma.auditLog.create({
      data: {
        actorUserId: existingProfile.id,
        action: 'OWNER_PRIVILEGES_ASSIGNED',
        entityType: 'profile',
        entityId: existingProfile.id,
        safeMetadata: JSON.stringify({ email, method: 'cli_setup_script', timestamp: new Date().toISOString() }),
      },
    });

    console.log(`\n[SUCCESS] Account "${email}" has been successfully assigned Owner & Administrator privileges!`);
  } else {
    // Account does not exist yet: create new owner account
    if (!password) {
      password = 'VorquenOwner@2026';
      console.log(`[NOTICE] No --password provided. Using default setup password: ${password}`);
      console.log('[IMPORTANT] Please change your password after logging in.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ownerName = fullName || 'VORQUEN Store Owner';

    const newOwner = await prisma.profile.create({
      data: {
        email,
        passwordHash,
        fullName: ownerName,
        isOwner: true,
        roles: {
          create: [
            { role: 'admin' },
            { role: 'owner' },
            { role: 'inventory_manager' },
          ],
        },
      },
    });

    // Log security audit event
    await prisma.auditLog.create({
      data: {
        actorUserId: newOwner.id,
        action: 'OWNER_ACCOUNT_CREATED',
        entityType: 'profile',
        entityId: newOwner.id,
        safeMetadata: JSON.stringify({ email, method: 'cli_setup_script', timestamp: new Date().toISOString() }),
      },
    });

    console.log(`\n[SUCCESS] New Owner account successfully created for "${email}"!`);
  }

  // Update .env file to persist VORQUEN_OWNER_EMAIL
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('VORQUEN_OWNER_EMAIL=')) {
        envContent = envContent.replace(
          /VORQUEN_OWNER_EMAIL=.*$/m,
          `VORQUEN_OWNER_EMAIL="${email}"`
        );
      } else {
        envContent += `\nVORQUEN_OWNER_EMAIL="${email}"\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`[CONFIG] Updated .env file with VORQUEN_OWNER_EMAIL="${email}"`);
    }
  } catch (err: any) {
    console.warn('[CONFIG WARNING] Could not automatically update .env file. Please set manually:');
    console.warn(`  VORQUEN_OWNER_EMAIL="${email}"`);
  }

  console.log('\n--------------------------------------------------------');
  console.log('Admin Portal URL:    http://localhost:3000/admin/login');
  console.log(`Owner Email:         ${email}`);
  console.log('Server Enforcement:  Active (Only this owner email is authorized)');
  console.log('--------------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
