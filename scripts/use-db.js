const fs = require('fs');
const path = require('path');

const target = process.argv[2];

if (target !== 'postgres' && target !== 'sqlite') {
  console.log('Usage: node scripts/use-db.js [postgres|sqlite]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgres') {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  console.log('Switched prisma/schema.prisma to PostgreSQL (Supabase).');
  console.log('Run `pnpm db:generate` and `pnpm db:push` to apply to your PostgreSQL database.');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  console.log('Switched prisma/schema.prisma to SQLite (Local Development).');
  console.log('Run `pnpm db:generate` and `pnpm db:push` to apply.');
}

fs.writeFileSync(schemaPath, schema);
