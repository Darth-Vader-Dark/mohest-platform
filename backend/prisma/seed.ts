import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Enterprise / RBAC seed data (the ONLY seed data — no demo content)
// ---------------------------------------------------------------------------

const DEPARTMENTS = [
  { code: 'ICT',   name: 'Information & Communications Technology' },
  { code: 'HR',    name: 'Human Resources' },
  { code: 'HES',   name: 'Higher Education Standards' },
  { code: 'ST',    name: 'Science & Technology' },
  { code: 'PLAN',  name: 'Planning & Statistics' },
  { code: 'FIN',   name: 'Administration & Finance' },
  { code: 'SCH',   name: 'Scholarships & International Cooperation' },
  { code: 'LEGAL', name: 'Legal Affairs' },
  { code: 'PR',    name: 'Public Relations & Media' },
];

const PERMISSIONS = [
  { key: 'users.read',         module: 'ICT',         description: 'View staff accounts' },
  { key: 'users.create',       module: 'ICT',         description: 'Create staff accounts' },
  { key: 'roles.manage',       module: 'ICT',         description: 'Create/edit roles and permission assignments' },
  { key: 'departments.read',   module: 'ICT',         description: 'View departments' },
  { key: 'departments.create', module: 'ICT',         description: 'Create departments' },
  { key: 'audit_logs.read',    module: 'ICT',         description: 'View audit logs' },
  { key: 'employees.read',     module: 'HR',          description: 'View employee directory' },
  { key: 'employees.create',   module: 'HR',          description: 'Enrol new employees' },
  { key: 'employees.transfer', module: 'HR',          description: 'Record department transfers' },
  { key: 'employees.promote',  module: 'HR',          description: 'Record promotions' },
  { key: 'id_cards.issue',     module: 'HR_ID_CARDS', description: 'Issue employee ID cards' },
  { key: 'id_cards.reissue',   module: 'HR_ID_CARDS', description: 'Reissue employee ID cards' },
  { key: 'documents.generate', module: 'HR_DOCS',     description: 'Generate HR letters and contracts' },
];

// ---------------------------------------------------------------------------
// HR roles that appear in the "Add User" form inside the ICT dashboard
// ---------------------------------------------------------------------------

const HR_ROLES = [
  { name: 'HR Manager',         description: 'Head of Human Resources department' },
  { name: 'HR Officer',         description: 'HR operations and employee management' },
  { name: 'Recruitment Officer', description: 'Handles recruitment and onboarding' },
  { name: 'Payroll Officer',    description: 'Manages employee payroll and benefits' },
  { name: 'Training Officer',   description: 'Coordinates staff training and development' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // --- Departments ---
  console.log('Seeding departments...');
  const departments = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
    departments.set(d.code, dept.id);
  }

  // --- Permissions ---
  console.log('Seeding permissions...');
  const permissionIds: string[] = [];
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
    permissionIds.push(perm.id);
  }

  // --- ICT Administrator role (full-access system role) ---
  console.log('Seeding ICT Administrator role...');
  const ictAdminRole = await prisma.role.upsert({
    where: { name: 'ICT Administrator' },
    update: {
      description: 'Full system administration access. Seeded role — cannot be deleted.',
      isSystem: true,
    },
    create: {
      name: 'ICT Administrator',
      description: 'Full system administration access. Seeded role — cannot be deleted.',
      isSystem: true,
    },
  });

  // Always ensure ICT Administrator has ALL permissions (idempotent upsert per permission)
  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ictAdminRole.id, permissionId } },
      update: {},
      create: { roleId: ictAdminRole.id, permissionId },
    });
  }

  // --- HR roles (include departments.read so HR staff can load department dropdowns) ---
  console.log('Seeding HR roles...');
  const hrPermissionIds = (
    await prisma.permission.findMany({
      where: {
        OR: [
          { module: { in: ['HR', 'HR_ID_CARDS', 'HR_DOCS'] } },
          { key: 'departments.read' },
        ],
      },
    })
  ).map((p) => p.id);

  for (const r of HR_ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: r.name } });
    if (!existing) {
      await prisma.role.create({
        data: {
          ...r,
          isSystem: false,
          permissions: {
            create: hrPermissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
    } else {
      // Ensure existing HR roles have departments.read
      const deptRead = await prisma.permission.findUnique({ where: { key: 'departments.read' } });
      if (deptRead) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: existing.id, permissionId: deptRead.id } },
          update: {},
          create: { roleId: existing.id, permissionId: deptRead.id },
        });
      }
    }
  }

  // --- Initial admin account ---
  const adminEmail = 'admin@mohest.gov.ss';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log('Creating MoHEST-Admin account...');
    // Pre-computed argon2id hash of "Admin12345"
    const passwordHash =
      '$argon2id$v=19$m=19456,t=2,p=1$pepwr1LBzqYN9GjeN0l+lA$KMExnKjuQYM0VLvEALy8vrwFSpC0wHG+LNaG3UdAzGg';
    await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'MoHEST',
        lastName: 'Admin',
        passwordHash,
        mustResetPassword: false,
        departmentId: departments.get('ICT'),
        roles: { create: [{ roleId: ictAdminRole.id }] },
      },
    });
    console.log(`Initial admin created: ${adminEmail} / Admin12345`);
  }

  // NOTE: Public site content (institutions, scholarships, news, leaders) is
  // NOT seeded. All public-facing content is managed via the ICT dashboard.

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
