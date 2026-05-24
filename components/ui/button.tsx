import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive" | "accent";

const variants: Record<Variant, string> = {
  default:
    "gradient-bg text-white shadow-md shadow-indigo-500/25 hover:opacity-95 active:scale-[0.98]",
  accent: "bg-cyan-500 text-white hover:bg-cyan-600 shadow-md shadow-cyan-500/20",
  outline:
    "border-2 border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50",
      variants[variant],
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";
