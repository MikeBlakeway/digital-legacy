import Image from "next/image";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Digital Legacy wordmark.
 * "auto" renders both and hides/shows via CSS — use when the page background
 * may be light or dark at render time (e.g. a sticky nav).
 */
export function Logo({
  variant = "auto",
  width = 120,
  height = 40,
  className = "",
}: LogoProps) {
  if (variant === "light") {
    return (
      <Image
        src="/logo-light.svg"
        alt="Digital Legacy"
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  }

  if (variant === "dark") {
    return (
      <Image
        src="/logo-dark.svg"
        alt="Digital Legacy"
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  }

  return (
    <>
      <Image
        src="/logo-light.svg"
        alt="Digital Legacy"
        width={width}
        height={height}
        className={`${className} block dark:hidden`}
        priority
      />
      <Image
        src="/logo-dark.svg"
        alt="Digital Legacy"
        width={width}
        height={height}
        className={`${className} hidden dark:block`}
        aria-hidden
        priority
      />
    </>
  );
}
