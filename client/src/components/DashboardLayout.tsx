import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import { Code } from "lucide-react";
import Logo from "./Logo";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-lg font-semibold text-foreground" data-testid="dashboard-title">
              {title}
            </h1>
          </div>

          <UserMenu />
        </div>
      </div>

      <div className="flex">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
export { DashboardLayout };