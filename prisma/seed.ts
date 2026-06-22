import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth/jwt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CampOS Core...");

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "super_admin" },
      update: {},
      create: { name: "super_admin", description: "Super Administrator with full access" },
    }),
    prisma.role.upsert({
      where: { name: "institution_admin" },
      update: {},
      create: { name: "institution_admin", description: "Institution Administrator" },
    }),
    prisma.role.upsert({
      where: { name: "faculty_admin" },
      update: {},
      create: { name: "faculty_admin", description: "Faculty Administrator" },
    }),
    prisma.role.upsert({
      where: { name: "lecturer" },
      update: {},
      create: { name: "lecturer", description: "Lecturer/Teaching Staff" },
    }),
    prisma.role.upsert({
      where: { name: "student" },
      update: {},
      create: { name: "student", description: "Student" },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({ where: { resource_action: { resource: "user", action: "manage" } }, update: {}, create: { resource: "user", action: "manage", description: "Manage users" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "student", action: "manage" } }, update: {}, create: { resource: "student", action: "manage", description: "Manage students" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "institution", action: "manage" } }, update: {}, create: { resource: "institution", action: "manage", description: "Manage institutions" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "attendance", action: "read" } }, update: {}, create: { resource: "attendance", action: "read", description: "Read attendance" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "attendance", action: "write" } }, update: {}, create: { resource: "attendance", action: "write", description: "Write attendance" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "analytics", action: "read" } }, update: {}, create: { resource: "analytics", action: "read", description: "Read analytics" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "audit", action: "read" } }, update: {}, create: { resource: "audit", action: "read", description: "Read audit logs" } }),
    prisma.permission.upsert({ where: { resource_action: { resource: "notification", action: "manage" } }, update: {}, create: { resource: "notification", action: "manage", description: "Manage notifications" } }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // Link roles to permissions
  const superAdminRole = roles.find((r) => r.name === "super_admin")!;
  await prisma.role.update({
    where: { id: superAdminRole.id },
    data: { permissions: { connect: permissions.map((p) => ({ id: p.id })) } },
  });

  const studentRole = roles.find((r) => r.name === "student")!;
  await prisma.role.update({
    where: { id: studentRole.id },
    data: { permissions: { connect: [{ id: permissions.find((p) => p.resource === "attendance" && p.action === "read")!.id }] } },
  });

  console.log("✅ Linked permissions to roles");

  // Create institution
  const institution = await prisma.institution.upsert({
    where: { slug: "demo-university" },
    update: {},
    create: {
      name: "Demo University",
      slug: "demo-university",
      code: "DEMO",
      description: "A demo institution for CampOS Core",
      country: "Nigeria",
      city: "Lagos",
      timezone: "Africa/Lagos",
      isActive: true,
    },
  });

  console.log(`✅ Created institution: ${institution.name}`);

  // Create faculties
  const faculties = await Promise.all([
    prisma.faculty.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "SCI" } },
      update: {},
      create: { name: "Science", code: "SCI", institutionId: institution.id },
    }),
    prisma.faculty.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "ENG" } },
      update: {},
      create: { name: "Engineering", code: "ENG", institutionId: institution.id },
    }),
    prisma.faculty.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "ART" } },
      update: {},
      create: { name: "Arts", code: "ART", institutionId: institution.id },
    }),
    prisma.faculty.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "BUS" } },
      update: {},
      create: { name: "Business", code: "BUS", institutionId: institution.id },
    }),
  ]);

  console.log(`✅ Created ${faculties.length} faculties`);

  // Create departments
  const scienceFaculty = faculties.find((f) => f.code === "SCI")!;
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { facultyId_code: { facultyId: scienceFaculty.id, code: "CSC" } },
      update: {},
      create: { name: "Computer Science", code: "CSC", facultyId: scienceFaculty.id, institutionId: institution.id },
    }),
    prisma.department.upsert({
      where: { facultyId_code: { facultyId: scienceFaculty.id, code: "MTH" } },
      update: {},
      create: { name: "Mathematics", code: "MTH", facultyId: scienceFaculty.id, institutionId: institution.id },
    }),
    prisma.department.upsert({
      where: { facultyId_code: { facultyId: scienceFaculty.id, code: "PHY" } },
      update: {},
      create: { name: "Physics", code: "PHY", facultyId: scienceFaculty.id, institutionId: institution.id },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Create programs
  const cscDept = departments.find((d) => d.code === "CSC")!;
  const program = await prisma.program.upsert({
    where: { departmentId_code: { departmentId: cscDept.id, code: "BSC-CSC" } },
    update: {},
    create: { name: "B.Sc Computer Science", code: "BSC-CSC", durationYears: 4, departmentId: cscDept.id, institutionId: institution.id },
  });

  console.log(`✅ Created program: ${program.name}`);

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@campos.io" },
    update: {},
    create: {
      email: "admin@campos.io",
      password: adminPassword,
      firstName: "Super",
      lastName: "Admin",
      isEmailVerified: true,
      institutionId: institution.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  });

  console.log(`✅ Created admin user: ${adminUser.email} / admin123`);

  // Create demo student
  const studentPassword = await hashPassword("student123");
  const studentUser = await prisma.user.upsert({
    where: { email: "student@campos.io" },
    update: {},
    create: {
      email: "student@campos.io",
      password: studentPassword,
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
      institutionId: institution.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: studentUser.id, roleId: studentRole.id } },
    update: {},
    create: { userId: studentUser.id, roleId: studentRole.id },
  });

  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      camposId: "CP-2024-001",
      userId: studentUser.id,
      institutionId: institution.id,
      facultyId: scienceFaculty.id,
      departmentId: cscDept.id,
      programId: program.id,
      level: "400",
      enrollmentStatus: "active",
      verificationStatus: "verified",
      matricNumber: "UNI/2020/001",
      phoneNumber: "+234 123 456 7890",
    },
  });

  await prisma.notificationPreference.create({
    data: { userId: studentUser.id },
  });

  console.log(`✅ Created demo student: ${studentUser.email} / student123`);

  // Create modules
  const modules_data = await Promise.all([
    prisma.moduleRegistration.upsert({
      where: { name: "scanmark" },
      update: {},
      create: {
        name: "scanmark",
        displayName: "ScanMark",
        description: "Attendance & Presence Verification",
        icon: "QrCode",
        baseUrl: "/dashboard/student/scanmark",
        requiredRoles: [],
      },
    }),
    prisma.moduleRegistration.upsert({
      where: { name: "unireg" },
      update: {},
      create: {
        name: "unireg",
        displayName: "UniReg",
        description: "Student Registration & Academic Administration",
        icon: "BookOpen",
        baseUrl: "/dashboard/student/unireg",
        requiredRoles: [],
      },
    }),
    prisma.moduleRegistration.upsert({
      where: { name: "funaabnb" },
      update: {},
      create: {
        name: "funaabnb",
        displayName: "FunaaBnB",
        description: "Student Accommodation & Housing Management",
        icon: "Hotel",
        baseUrl: "/dashboard/student/funaabnb",
        requiredRoles: [],
      },
    }),
    prisma.moduleRegistration.upsert({
      where: { name: "nada" },
      update: {},
      create: {
        name: "nada",
        displayName: "NADA",
        description: "Anonymous Student Social Network",
        icon: "MessageCircle",
        baseUrl: "/dashboard/student/nada",
        requiredRoles: ["student"],
      },
    }),
  ]);

  console.log(`✅ Created ${modules_data.length} modules`);

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      { userId: studentUser.id, type: "success", title: "Welcome to CampOS", message: "Your account has been verified successfully.", source: "core" },
      { userId: studentUser.id, type: "info", title: "Course Registration Open", message: "Registration for 2024/2025 session is now open.", source: "unireg" },
      { userId: studentUser.id, type: "warning", title: "Housing Payment Due", message: "Your hostel fee payment is due in 3 days.", source: "funaabnb" },
    ],
  });

  console.log("✅ Created sample notifications");

  // Create sample audit logs
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, institutionId: institution.id, action: "LOGIN", resource: "user", resourceId: adminUser.id, status: "success", ipAddress: "192.168.1.1" },
      { userId: studentUser.id, institutionId: institution.id, action: "CREATE", resource: "student", resourceId: studentUser.id, status: "success", ipAddress: "192.168.1.100" },
      { userId: adminUser.id, institutionId: institution.id, action: "UPDATE", resource: "institution", resourceId: institution.id, status: "success", ipAddress: "192.168.1.1" },
    ],
  });

  console.log("✅ Created sample audit logs");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin:    admin@campos.io / admin123");
  console.log("  Student:  student@campos.io / student123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
