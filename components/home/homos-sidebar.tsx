"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody } from "@/components/ui/animated-sidebar";
import {
  IconPlus,
  IconSearch,
  IconLogout,
  IconLogin,
  IconCoins,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface HomosSidebarProps {
  className?: string;
}

export function HomosSidebar({ className }: HomosSidebarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { signOut } = useClerk();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const trpc = useTRPC();
  
  const { data: projects, isLoading } = useQuery(
    trpc.projects.getMany.queryOptions()
  );

  const { data: usageStatus } = useQuery(
    trpc.usage.status.queryOptions()
  );

  // Calculate remaining credits
  const remainingCredits = usageStatus 
    ? usageStatus.remainingPoints 
    : null;

  // Filter projects based on search
  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group projects by date
  const groupedProjects = filteredProjects?.reduce((acc, project) => {
    const timeAgo = formatDistanceToNow(project.updatedAt, { addSuffix: true });
    let group = "Older";
    
    if (timeAgo.includes("minute") || timeAgo.includes("hour")) {
      group = "Today";
    } else if (timeAgo.includes("1 day") || timeAgo.includes("yesterday")) {
      group = "Yesterday";
    } else if (timeAgo.includes("day") && parseInt(timeAgo) <= 7) {
      group = "This Week";
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group]!.push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  return (
    <div
      className={cn(
        "absolute left-0 top-0 z-40 h-full",
        className
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo */}
            <Logo open={open} />
            
            {/* Credits/Tokens */}
            {isSignedIn && remainingCredits !== null && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800">
                <IconCoins className="h-4 w-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="truncate text-neutral-700 dark:text-neutral-300"
                >
                  {remainingCredits} credits left
                </motion.span>
              </div>
            )}

            {/* Start New Project Button */}
            <motion.div
              animate={{
                display: open ? "block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="mt-4"
            >
              <Button
                onClick={() => router.push("/")}
                className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20"
                variant="ghost"
              >
                <IconPlus className="h-5 w-5" />
                Start new project
              </Button>
            </motion.div>

            {/* Search */}
            <motion.div
              animate={{
                display: open ? "block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="mt-4"
            >
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            {/* Projects List */}
            <motion.div
              animate={{
                display: open ? "block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto"
            >
              <h3 className="px-2 text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Your Projects
              </h3>
              
              {isLoading ? (
                <div className="flex flex-col gap-2 px-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-neutral-500">
                  No projects yet
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(groupedProjects || {}).map(([group, groupProjects]) => (
                    <div key={group} className="flex flex-col gap-1">
                      <div className="px-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {group}
                      </div>
                      {groupProjects?.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="group flex items-start rounded-lg px-2 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          onClick={() => setOpen(false)}
                        >
                          <span className="line-clamp-2 truncate">{project.name}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* User Section at Bottom */}
          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            {isSignedIn ? (
              <>
                {user && (
                  <div className="flex items-center gap-2 px-2">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        className="h-8 w-8 shrink-0 rounded-full"
                        width={32}
                        height={32}
                        alt="Avatar"
                      />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    )}
                    <motion.div
                      animate={{
                        display: open ? "flex" : "none",
                        opacity: open ? 1 : 0,
                      }}
                      className="flex flex-1 flex-col overflow-hidden"
                    >
                      <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        {user.fullName || user.username || "User"}
                      </span>
                      <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {user.primaryEmailAddress?.emailAddress}
                      </span>
                    </motion.div>
                  </div>
                )}
                <button
                  onClick={() => signOut(() => router.push("/"))}
                  className="group/sidebar flex items-center justify-start gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <IconLogout className="h-5 w-5 shrink-0" />
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                  >
                    Logout
                  </motion.span>
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/sign-in")}
                className="group/sidebar flex items-center justify-start gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <IconLogin className="h-5 w-5 shrink-0" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                >
                  Sign In
                </motion.span>
              </button>
            )}
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center gap-2 py-1"
    >
      <Image
        src="/logo.png"
        alt="HOMOS.AI"
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-md"
      />
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="whitespace-nowrap text-lg font-bold text-neutral-800 dark:text-white"
      >
        HOMOS<span className="text-primary">.AI</span>
      </motion.span>
    </Link>
  );
};
