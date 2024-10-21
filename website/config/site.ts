export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Forge",
  description: "Make a model get a 3d printer",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "Gallery",
      href: "/gallery",
    },
    {
      label: "Editor",
      href: "/editor",
    },
    {
      label: "Tutorials",
      href: "/tutorials",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/MyGallery",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
  ],
  links: {
    github: "https://github.com/hackclub/forge",
    twitter: "https://hackclub.com",
    docs: "https://forge.hackclub.com",
    discord: "https://hackclub.com/slack/",
    sponsor: "https://hcb.hackclub.com/forge",
  },
};
