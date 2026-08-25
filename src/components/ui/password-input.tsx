"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({ className, disabled, ...props }: React.ComponentProps<"input">) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-gray-500 transition-colors hover:text-[#315694] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315694] focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50"
      >
        {isVisible ? (
          <EyeOff className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
