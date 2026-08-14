import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Canvas padrão do produto: 1440px. */
export const appFrame =
  "mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8"
