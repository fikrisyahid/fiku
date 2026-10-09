import Image from "next/image";

interface FikuLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

export function FikuLogo({ size = "md", className = "", showText = true }: FikuLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-base",
    lg: "w-11 h-11 text-lg",
    xl: "w-14 h-14 text-2xl",
  };

  const pxSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:scale-105 transition-transform`}
      >
        <Image
          src="/brand/fiku-icon-512.png"
          alt="Fiku Logo"
          width={pxSizes[size]}
          height={pxSizes[size]}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${textSizes[size]}`}>
          Fiku
        </span>
      )}
    </div>
  );
}
