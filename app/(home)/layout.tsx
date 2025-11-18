"use client";
import { HomosSidebar } from "@/components/home/homos-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <main className="relative flex h-screen w-full overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Sidebar - hoverable and overlays content */}
      <HomosSidebar />
      
      {/* Main content - takes full width */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pt-20 md:pt-4 w-full">
        {children}
      </div>
    </main>
  )
}

export default Layout