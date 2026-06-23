"use client";

import { createContext, useContext, ReactNode } from "react";

export interface WorkspaceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface WorkspaceInstitution {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  timezone: string;
}

export interface WorkspaceModule {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string;
  url: string;
  isGlobal: boolean;
}

interface WorkspaceContextValue {
  user: WorkspaceUser | null;
  institution: WorkspaceInstitution | null;
  modules: WorkspaceModule[];
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  user: null,
  institution: null,
  modules: [],
  isLoading: true,
});

export function WorkspaceProvider({
  children,
  user,
  institution,
  modules,
}: {
  children: ReactNode;
  user: WorkspaceUser | null;
  institution: WorkspaceInstitution | null;
  modules: WorkspaceModule[];
}) {
  return (
    <WorkspaceContext.Provider
      value={{ user, institution, modules, isLoading: false }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
