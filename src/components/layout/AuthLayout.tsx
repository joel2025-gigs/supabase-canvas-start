import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import nawapLogo from "@/assets/nawap-logo.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <img src={nawapLogo} alt={APP_NAME} className="h-12 w-12" />
          <span className="text-2xl font-bold text-white">{APP_NAME}</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Asset Financing<br />Made Simple
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            {APP_TAGLINE}. Get motorcycles and tricycles on affordable loan terms with flexible daily or weekly payments.
          </p>
          <div className="flex gap-8 text-white/90">
            <div>
              <div className="text-3xl font-bold">30%</div>
              <div className="text-sm text-white/70">Fixed Interest</div>
            </div>
            <div>
              <div className="text-3xl font-bold">Daily</div>
              <div className="text-sm text-white/70">or Weekly</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-white/70">Ownership</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <img src={nawapLogo} alt={APP_NAME} className="h-10 w-10" />
              <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
