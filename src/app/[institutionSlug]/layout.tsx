import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "campos-jwt-secret-change-in-production"
);

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: { institutionSlug: string };
}

async function validateWorkspace(institutionSlug: string, token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 15 });
    const userId = payload.userId as string;
    const roles = (payload.role as string[]) || [];
    const isSuperAdmin = roles.includes("super_admin");

    // Verify institution exists
    const institution = await prisma.institution.findUnique({
      where: { slug: institutionSlug },
      select: { id: true, name: true, slug: true, logoUrl: true, timezone: true, isActive: true },
    });

    if (!institution) {
      return { valid: false, reason: "institution_not_found" };
    }

    if (!institution.isActive) {
      return { valid: false, reason: "institution_inactive" };
    }

    // Super admins can access any workspace
    if (isSuperAdmin) {
      return { valid: true, institution };
    }

    // Non-super-admin: must match their institution
    const userInstitutionSlug = payload.institutionSlug as string | undefined;
    if (userInstitutionSlug !== institutionSlug) {
      return { valid: false, reason: "workspace_mismatch", correctSlug: userInstitutionSlug };
    }

    return { valid: true, institution };
  } catch {
    return { valid: false, reason: "invalid_token" };
  }
}

async function fetchUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: true } } } },
      institution: true,
      studentProfile: {
        include: { faculty: true, department: true },
      },
    },
  });

  if (!user) return null;

  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
  );

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    roles,
    permissions,
  };
}

async function fetchModules(institutionId: string | null, userRoles: string[]) {
  const where: any = { isActive: true };

  if (institutionId) {
    where.OR = [
      { institutionId },
      { isGlobal: true, institutionId: null },
    ];
  } else {
    where.isGlobal = true;
  }

  const modules = await prisma.moduleRegistration.findMany({
    where,
    orderBy: { displayName: "asc" },
  });

  return modules
    .filter((m) => m.requiredRoles.length === 0 || m.requiredRoles.some((r) => userRoles.includes(r)))
    .map((m) => ({
      id: m.id,
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      icon: m.icon,
      url: m.baseUrl || `/${m.name}`,
      isGlobal: m.isGlobal,
    }));
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { institutionSlug } = params;

  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  const result = await validateWorkspace(institutionSlug, token);

  if (!result.valid) {
    if (result.reason === "workspace_mismatch" && "correctSlug" in result && result.correctSlug) {
      redirect(`/${result.correctSlug}/student`);
    }
    notFound();
  }

  if (!result.institution) {
    notFound();
  }

  // Fetch user data from token payload
  const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 15 });
  const userId = payload.userId as string;
  const userRoles = (payload.role as string[]) || [];

  const [userData, modulesData] = await Promise.all([
    fetchUserData(userId),
    fetchModules(result.institution.id, userRoles),
  ]);

  return (
    <WorkspaceProvider
      user={userData}
      institution={result.institution}
      modules={modulesData}
    >
      {children}
    </WorkspaceProvider>
  );
}

export async function generateMetadata({ params }: { params: { institutionSlug: string } }) {
  const institution = await prisma.institution.findUnique({
    where: { slug: params.institutionSlug },
    select: { name: true },
  });

  return {
    title: institution ? `${institution.name} - CampOS` : "CampOS Workspace",
  };
}
