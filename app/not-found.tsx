"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-background">
      <div className="max-w-2xl w-full mx-auto p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-24 h-24 relative rounded-2xl bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Homos.ai Logo"
            width={48}
            height={48}
            className="opacity-75"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Page Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => router.push('/')}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
