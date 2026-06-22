import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Authentication - CampOS Core",
  description: "Sign in or create an account to access CampOS Core",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative flex-col justify-between p-12 campos-gradient text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        {/* Logo area */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl p-1 backdrop-blur-sm">
              <Image src="/logo.png" alt="CampOS Logo" width={36} height={36} className="object-contain drop-shadow-md" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
              CampOS
            </span>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight font-[family-name:var(--font-space-grotesk)]">
            The University
            <br />
            Operating System
          </h1>
          <p className="text-lg text-white/80 max-w-md leading-relaxed">
            Streamline campus operations, empower students, and connect every
            department with a single unified platform.
          </p>
          
          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 pt-4">
            {["Student Affairs", "Housing", "Academics", "Finance"].map(
              (item) => (
                <div
                  key={item}
                  className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium border border-white/10"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom area */}
        <div className="relative z-10 text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} CampOS. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image src="/logo.png" alt="CampOS Logo" width={40} height={40} className="object-contain drop-shadow-sm" />
          </div>
          <span className="text-2xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            CampOS
          </span>
        </div>

        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
