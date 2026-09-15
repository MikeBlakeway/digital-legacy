"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  type SVGProps,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { signOut } from "@/app/(app)/actions";
import { Logo } from "@/components/ui/Logo";
import {
  chooseNavigationPersona,
  createPrimaryNavigation,
  isNavigationItemActive,
  type NavigationIcon,
  type NavigationPersona,
  type PrimaryNavigationItem,
} from "@/components/navigation/navigation-model";

type AppShellProps = {
  children: ReactNode;
  personas: NavigationPersona[];
  isAdmin: boolean;
  canCreatePersona: boolean;
};

type DrawerName = "capture" | "more";

type AppIconName =
  | NavigationIcon
  | "journal"
  | "interview"
  | "photos"
  | "videos"
  | "profile"
  | "family"
  | "admin"
  | "add"
  | "logout"
  | "close";

export default function AppShell({
  children,
  personas,
  isAdmin,
  canCreatePersona,
}: AppShellProps) {
  const pathname = usePathname();
  const [openDrawer, setOpenDrawer] = useState<DrawerName | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const activePersona = chooseNavigationPersona(pathname, personas);
  const primaryItems = createPrimaryNavigation(activePersona);

  useEffect(() => {
    if (!openDrawer) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDrawer(null);
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          drawerRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusableElements[0];
        const last = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openDrawer]);

  return (
    <div className="min-h-dvh bg-bg text-fg1 md:grid md:grid-cols-[4.75rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <DesktopSidebar
        pathname={pathname}
        activePersona={activePersona}
        isAdmin={isAdmin}
        onOpenMore={() => setOpenDrawer("more")}
      />

      <div className="min-w-0">
        <MobileHeader activePersona={activePersona} pathname={pathname} />
        <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
      </div>

      <MobileNavigation
        pathname={pathname}
        items={primaryItems}
        openDrawer={openDrawer}
        onAction={setOpenDrawer}
      />

      {openDrawer ? (
        <NavigationDrawer
          drawer={openDrawer}
          persona={activePersona}
          personas={personas}
          isAdmin={isAdmin}
          canCreatePersona={canCreatePersona}
          closeButtonRef={closeButtonRef}
          drawerRef={drawerRef}
          onClose={() => setOpenDrawer(null)}
        />
      ) : null}
    </div>
  );
}

function MobileHeader({
  activePersona,
  pathname,
}: {
  activePersona: NavigationPersona | null;
  pathname: string;
}) {
  const context =
    pathname === "/"
      ? "Your personas"
      : activePersona?.accessMode === "capture"
        ? `${activePersona.name} · Capture`
        : activePersona
          ? activePersona.name
          : "Digital Legacy";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Digital Legacy home">
          <Logo width={48} height={48} />
        </Link>
        <p className="truncate text-xs font-medium text-fg3">{context}</p>
      </div>
    </header>
  );
}

function DesktopSidebar({
  pathname,
  activePersona,
  isAdmin,
  onOpenMore,
}: {
  pathname: string;
  activePersona: NavigationPersona | null;
  isAdmin: boolean;
  onOpenMore: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-20 items-center justify-center border-b border-border px-3 lg:justify-start lg:px-6">
        <Link href="/" className="hidden lg:block" aria-label="Digital Legacy home">
          <Logo width={64} height={64} />
        </Link>
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-mono text-xs font-medium tracking-wider text-primary-fg lg:hidden"
          aria-label="Digital Legacy home"
        >
          DL
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-5 lg:px-4" aria-label="Main navigation">
        <SidebarLink
          href="/"
          label="Home"
          icon="home"
          active={pathname === "/"}
        />

        {activePersona ? (
          <>
            <p className="mb-1 mt-6 hidden px-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg4 lg:block">
              {activePersona.name}
            </p>
            {activePersona.accessMode === "capture" ? (
              <CaptureSidebarLinks persona={activePersona} pathname={pathname} />
            ) : (
              <ConversationSidebarLinks
                persona={activePersona}
                pathname={pathname}
              />
            )}
          </>
        ) : null}

        {isAdmin ? (
          <div className="mt-5 border-t border-border pt-5">
            <SidebarLink
              href="/admin"
              label="Administration"
              icon="admin"
              active={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          </div>
        ) : null}
      </nav>

      <div className="border-t border-border p-2 lg:p-4">
        <button
          type="button"
          onClick={onOpenMore}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-md px-3 text-fg2 transition hover:bg-surface-2 hover:text-fg1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:justify-start"
          aria-label="Open more options"
          title="More"
        >
          <AppIcon name="more" className="h-5 w-5 shrink-0" />
          <span className="hidden text-sm font-medium lg:block">More</span>
        </button>
      </div>
    </aside>
  );
}

function CaptureSidebarLinks({
  persona,
  pathname,
}: {
  persona: NavigationPersona;
  pathname: string;
}) {
  const base = `/capture/${persona.slug}`;
  const links: Array<{ href: string; label: string; icon: AppIconName }> = [
    { href: base, label: "Overview", icon: "persona" },
    { href: `${base}/diary`, label: "Diary", icon: "journal" },
    { href: `${base}/interview`, label: "Interviews", icon: "interview" },
    { href: `${base}/photos`, label: "Photos", icon: "photos" },
    { href: `${base}/videos`, label: "Videos", icon: "videos" },
    { href: `${base}/memories`, label: "Memories", icon: "memories" },
  ];

  return (
    <>
      {links.map((link) => (
        <SidebarLink
          key={link.href}
          {...link}
          active={
            link.href === base
              ? pathname === base
              : pathname === link.href || pathname.startsWith(`${link.href}/`)
          }
        />
      ))}
    </>
  );
}

function ConversationSidebarLinks({
  persona,
  pathname,
}: {
  persona: NavigationPersona;
  pathname: string;
}) {
  const base = `/talk/${persona.slug}`;

  return (
    <>
      <SidebarLink
        href={base}
        label="Persona"
        icon="persona"
        active={pathname === base}
      />
      <SidebarLink
        href={`${base}/new`}
        label="New conversation"
        icon="capture"
        active={pathname === `${base}/new`}
      />
      <SidebarLink
        href={`${base}/history`}
        label="History"
        icon="history"
        active={pathname === `${base}/history`}
      />
    </>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: AppIconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
      className={`flex min-h-11 items-center justify-center gap-3 rounded-md px-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:justify-start ${
        active
          ? "bg-accent-soft text-accent"
          : "text-fg2 hover:bg-surface-2 hover:text-fg1"
      }`}
    >
      <AppIcon name={icon} className="h-5 w-5 shrink-0" />
      <span className="hidden text-sm font-medium lg:block">{label}</span>
    </Link>
  );
}

function MobileNavigation({
  pathname,
  items,
  openDrawer,
  onAction,
}: {
  pathname: string;
  items: PrimaryNavigationItem[];
  openDrawer: DrawerName | null;
  onAction: (drawer: DrawerName) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(30,26,23,0.08)] backdrop-blur md:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex min-h-16 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const active =
            item.action === "more"
              ? openDrawer === "more"
              : isNavigationItemActive(pathname, item);
          const className = `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.65rem] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary ${
            active ? "text-accent" : "text-fg3 hover:text-fg1"
          }`;
          const content = (
            <>
              <span
                className={`flex h-7 min-w-10 items-center justify-center rounded-full px-3 transition ${active ? "bg-accent-soft" : ""}`}
              >
                <AppIcon name={item.icon} className="h-5 w-5" />
              </span>
              <span className="truncate">{item.label}</span>
            </>
          );

          return item.action ? (
            <button
              key={item.label}
              type="button"
              className={className}
              onClick={() => onAction(item.action as DrawerName)}
              aria-expanded={openDrawer === item.action}
            >
              {content}
            </button>
          ) : (
            <Link
              key={item.label}
              href={item.href ?? "/"}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavigationDrawer({
  drawer,
  persona,
  personas,
  isAdmin,
  canCreatePersona,
  closeButtonRef,
  drawerRef,
  onClose,
}: {
  drawer: DrawerName;
  persona: NavigationPersona | null;
  personas: NavigationPersona[];
  isAdmin: boolean;
  canCreatePersona: boolean;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  drawerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close menu"
      />
      <section
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[82dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-lg md:rounded-xl md:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong md:hidden" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg4">
              {persona?.name ?? "Digital Legacy"}
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold text-fg1">
              {drawer === "capture" ? "Add to your legacy" : "More"}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-fg3 transition hover:bg-surface-2 hover:text-fg1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Close menu"
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 divide-y divide-border border-y border-border">
          {drawer === "capture" && persona?.accessMode === "capture" ? (
            <CaptureActions persona={persona} onNavigate={onClose} />
          ) : (
            <MoreActions
              persona={persona}
              personas={personas}
              isAdmin={isAdmin}
              canCreatePersona={canCreatePersona}
              onNavigate={onClose}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function CaptureActions({
  persona,
  onNavigate,
}: {
  persona: NavigationPersona;
  onNavigate: () => void;
}) {
  const base = `/capture/${persona.slug}`;
  return (
    <>
      <DrawerLink
        href={`${base}/diary/new`}
        icon="journal"
        label="Write a diary entry"
        detail="Capture a story in text or audio."
        onNavigate={onNavigate}
      />
      <DrawerLink
        href={`${base}/interview`}
        icon="interview"
        label="Start an interview"
        detail="Explore a guided memory theme."
        onNavigate={onNavigate}
      />
      <DrawerLink
        href={`${base}/photos`}
        icon="photos"
        label="Add photos"
        detail="Upload and describe important images."
        onNavigate={onNavigate}
      />
      <DrawerLink
        href={`${base}/videos`}
        icon="videos"
        label="Record a video"
        detail="Record now or upload from your device."
        onNavigate={onNavigate}
      />
    </>
  );
}

function MoreActions({
  persona,
  personas,
  isAdmin,
  canCreatePersona,
  onNavigate,
}: {
  persona: NavigationPersona | null;
  personas: NavigationPersona[];
  isAdmin: boolean;
  canCreatePersona: boolean;
  onNavigate: () => void;
}) {
  return (
    <>
      {personas.length > 1 ? (
        <div className="py-3">
          <p className="px-3 py-2 font-mono text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg4">
            Switch persona
          </p>
          {personas.map((item) => (
            <DrawerLink
              key={item.id}
              href={personaHref(item)}
              icon="persona"
              label={item.name}
              detail={item.accessMode === "capture" ? "Your persona" : "Shared with you"}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}

      {persona?.accessMode === "capture" ? (
        <>
          <DrawerLink
            href={`/capture/${persona.slug}/profile`}
            icon="profile"
            label="Personality profile"
            onNavigate={onNavigate}
          />
          <DrawerLink
            href={`/capture/${persona.slug}/access`}
            icon="family"
            label="Family access"
            onNavigate={onNavigate}
          />
        </>
      ) : null}

      {canCreatePersona ? (
        <DrawerLink
          href="/capture/new"
          icon="add"
          label="Create another persona"
          onNavigate={onNavigate}
        />
      ) : null}

      {isAdmin ? (
        <DrawerLink
          href="/admin"
          icon="admin"
          label="Administration"
          onNavigate={onNavigate}
        />
      ) : null}

      <form action={signOut}>
        <button
          type="submit"
          className="flex min-h-16 w-full items-center gap-4 px-3 py-3 text-left text-fg2 transition hover:bg-surface-2 hover:text-fg1 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          <AppIcon name="logout" className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </form>
    </>
  );
}

function DrawerLink({
  href,
  icon,
  label,
  detail,
  onNavigate,
}: {
  href: string;
  icon: AppIconName;
  label: string;
  detail?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-16 items-center gap-4 px-3 py-3 text-fg2 transition hover:bg-surface-2 hover:text-fg1 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
    >
      <AppIcon name={icon} className="h-5 w-5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg1">{label}</span>
        {detail ? <span className="mt-0.5 block text-xs text-fg3">{detail}</span> : null}
      </span>
    </Link>
  );
}

function personaHref(persona: NavigationPersona): string {
  return persona.accessMode === "capture"
    ? `/capture/${persona.slug}`
    : `/talk/${persona.slug}`;
}

function AppIcon({
  name,
  ...props
}: { name: AppIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<AppIconName, ReactNode> = {
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  persona: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
  capture: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  memories: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" /><path d="M4 4v4.6h4.6M12 8v4l2.7 1.8" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  journal: <><path d="M6 3.5h11.5A1.5 1.5 0 0 1 19 5v15.5H7.5A2.5 2.5 0 0 1 5 18V5.5a2 2 0 0 1 2-2" /><path d="M8 8h7M8 12h7" /></>,
  interview: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  photos: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m4 17 5-4 3 2 3-3 5 5" /></>,
  videos: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  profile: <><path d="M6 3h12v18H6z" /><circle cx="12" cy="9" r="2.5" /><path d="M8.5 17a3.5 3.5 0 0 1 7 0" /></>,
  family: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 16a4 4 0 0 1 6.5 3.1" /></>,
  admin: <><path d="M12 3 4.5 6v5c0 4.8 3 8.4 7.5 10 4.5-1.6 7.5-5.2 7.5-10V6z" /><path d="m9 12 2 2 4-5" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
};
