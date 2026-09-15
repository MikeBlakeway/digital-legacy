export type NavigationPersona = {
  id: string;
  name: string;
  slug: string;
  accessMode: "capture" | "conversation";
};

export type NavigationIcon =
  | "home"
  | "persona"
  | "capture"
  | "memories"
  | "history"
  | "more";

export type PrimaryNavigationItem = {
  label: string;
  href?: string;
  action?: "capture" | "more";
  icon: NavigationIcon;
  activeMatch: "exact" | "prefix" | "never";
};

export function findActivePersona(
  pathname: string,
  personas: NavigationPersona[],
): NavigationPersona | null {
  return (
    personas.find((persona) => {
      const base =
        persona.accessMode === "capture"
          ? `/capture/${persona.slug}`
          : `/talk/${persona.slug}`;
      return pathname === base || pathname.startsWith(`${base}/`);
    }) ?? null
  );
}

export function chooseNavigationPersona(
  pathname: string,
  personas: NavigationPersona[],
): NavigationPersona | null {
  return (
    findActivePersona(pathname, personas) ??
    personas.find((persona) => persona.accessMode === "capture") ??
    personas[0] ??
    null
  );
}

export function createPrimaryNavigation(
  persona: NavigationPersona | null,
): PrimaryNavigationItem[] {
  const home: PrimaryNavigationItem = {
    label: "Home",
    href: "/",
    icon: "home",
    activeMatch: "exact",
  };
  const more: PrimaryNavigationItem = {
    label: "More",
    action: "more",
    icon: "more",
    activeMatch: "never",
  };

  if (!persona) {
    return [home, more];
  }

  if (persona.accessMode === "capture") {
    const base = `/capture/${persona.slug}`;
    return [
      home,
      {
        label: "Overview",
        href: base,
        icon: "persona",
        activeMatch: "exact",
      },
      {
        label: "Capture",
        action: "capture",
        icon: "capture",
        activeMatch: "never",
      },
      {
        label: "Memories",
        href: `${base}/memories`,
        icon: "memories",
        activeMatch: "prefix",
      },
      more,
    ];
  }

  const base = `/talk/${persona.slug}`;
  return [
    home,
    {
      label: "Persona",
      href: base,
      icon: "persona",
      activeMatch: "exact",
    },
    {
      label: "New chat",
      href: `${base}/new`,
      icon: "capture",
      activeMatch: "exact",
    },
    {
      label: "History",
      href: `${base}/history`,
      icon: "history",
      activeMatch: "prefix",
    },
    more,
  ];
}

export function isNavigationItemActive(
  pathname: string,
  item: PrimaryNavigationItem,
): boolean {
  if (!item.href || item.activeMatch === "never") {
    return false;
  }

  if (item.activeMatch === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
