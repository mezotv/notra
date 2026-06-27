import type { CSSProperties, ReactNode } from "react";
import { interFamily } from "../lib/fonts";
import { COLORS } from "../lib/theme";
import { Img, staticFile } from "../remotion";
import { EmdashLogo } from "./logos";
import { BackArrowIcon } from "./ui";

const WINDOW_WIDTH = 1600;
const WINDOW_HEIGHT = 920;
const SIDEBAR_WIDTH = 248;

const UI = {
  bg: "#fafafa",
  border: "#e8e8e8",
  searchBg: "#f1f1f1",
  activeRow: "#ededed",
  text: "#171717",
  rowText: "#404040",
  muted: "#8f8f8f",
  icon: "#525252",
  basicBg: "#dde8f9",
  basicText: "#2563eb",
  betaBg: "#ececec",
  betaText: "#737373",
  keycapBg: "#e9e9e9",
} as const;

interface DashboardWindowProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

interface NavItem {
  id: string;
  label: string;
  active?: boolean;
  badge?: string;
}

interface NavSection {
  id: string;
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    items: [
      { id: "home", label: "Home" },
      { id: "chat", label: "Chat", badge: "Beta" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "content", label: "Content", active: true },
      { id: "identity", label: "Identity & References" },
      { id: "skills", label: "Skills" },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    items: [
      { id: "schedules", label: "Schedules" },
      { id: "events", label: "Events" },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    items: [
      { id: "api-keys", label: "API Keys" },
      { id: "integrations", label: "Integrations" },
      { id: "logs", label: "Logs" },
    ],
  },
];

function NavGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
      width={17}
    >
      {children}
    </svg>
  );
}

const NAV_ICONS: Record<string, ReactNode> = {
  home: (
    <NavGlyph>
      <path d="M4 11.5 12 4l8 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    </NavGlyph>
  ),
  chat: (
    <NavGlyph>
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.6A8.5 8.5 0 1 1 21 12z" />
      <path d="M9 11h.01M12.5 11h.01" />
    </NavGlyph>
  ),
  content: (
    <NavGlyph>
      <path d="M5 4.5h11A1.5 1.5 0 0 1 17.5 6v13.5h-11A1.5 1.5 0 0 1 5 18z" />
      <path d="M17.5 19.5H19a1.5 1.5 0 0 0 1.5-1.5V8" />
      <path d="M8.5 9h5.5M8.5 12.5h5.5" />
    </NavGlyph>
  ),
  identity: (
    <NavGlyph>
      <rect height={15} rx={1.5} width={8} x={3.5} y={5} />
      <path d="M11.5 9h7A1.5 1.5 0 0 1 20 10.5V20h-8.5" />
      <path d="M6.5 9h2M6.5 12.5h2M6.5 16h2M15 13h2M15 16.5h2" />
    </NavGlyph>
  ),
  skills: (
    <NavGlyph>
      <path d="m5 19 9.5-9.5 2 2L7 21l-2.5.5z" />
      <path d="M16 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7zM20.5 11l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
    </NavGlyph>
  ),
  schedules: (
    <NavGlyph>
      <rect height={15} rx={2} width={17} x={3.5} y={5} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 16.5h.01M12 16.5h.01" />
    </NavGlyph>
  ),
  events: (
    <NavGlyph>
      <path d="M18 16H6l1.5-2.5V9.5a4.5 4.5 0 0 1 9 0V13.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </NavGlyph>
  ),
  "api-keys": (
    <NavGlyph>
      <circle cx={8} cy={15} r={4} />
      <path d="m10.8 12.2 8.7-8.7M16 7l2.5 2.5M13.5 9.5l2 2" />
    </NavGlyph>
  ),
  integrations: (
    <NavGlyph>
      <path d="M9 4v5M15 4v5M7 9h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5z" />
      <path d="M12 17v3.5" />
    </NavGlyph>
  ),
  logs: (
    <NavGlyph>
      <rect height={15} rx={2} width={17} x={3.5} y={4.5} />
      <path d="M7.5 14.5 10 11l2.5 2.5 4-4.5" />
    </NavGlyph>
  ),
  settings: (
    <NavGlyph>
      <circle cx={12} cy={12} r={3} />
      <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.7-1.6L13.5 2h-3l-.3 2.9a7 7 0 0 0-2.7 1.6l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 3.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.7 1.6l.3 2.9h3l.3-2.9a7 7 0 0 0 2.7-1.6l2.3 1 2-3.4-2-1.5c.13-.52.2-1.05.2-1.6z" />
    </NavGlyph>
  ),
};

function SearchGlyph() {
  return (
    <NavGlyph>
      <circle cx={11} cy={11} r={6.5} />
      <path d="m16 16 4.5 4.5" />
    </NavGlyph>
  );
}

function ChevronDownGlyph() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={14}
      stroke={UI.muted}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={14}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DotsGlyph() {
  return (
    <svg
      aria-hidden="true"
      fill={UI.muted}
      height={15}
      viewBox="0 0 24 24"
      width={15}
    >
      <circle cx={12} cy={5} r={1.7} />
      <circle cx={12} cy={12} r={1.7} />
      <circle cx={12} cy={19} r={1.7} />
    </svg>
  );
}

function Keycap({ label }: { label: string }) {
  return (
    <span
      style={{
        minWidth: 20,
        height: 20,
        padding: "0 4px",
        borderRadius: 5,
        background: UI.keycapBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11.5,
        color: UI.muted,
      }}
    >
      {label}
    </span>
  );
}

function Pill({
  background,
  color,
  children,
}: {
  background: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        padding: "3px 9px",
        borderRadius: 999,
        background,
        color,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 0.4,
      }}
    >
      {children}
    </span>
  );
}

function NavRow({ item }: { item: NavItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        height: 36,
        padding: "0 11px",
        borderRadius: 9,
        background: item.active ? UI.activeRow : "transparent",
      }}
    >
      <span style={{ color: UI.icon, display: "flex" }}>
        {NAV_ICONS[item.id]}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: item.active ? 500 : 400,
          color: item.active ? UI.text : UI.rowText,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.label}
      </span>
      {item.badge ? (
        <Pill background={UI.betaBg} color={UI.betaText}>
          {item.badge}
        </Pill>
      ) : null}
    </div>
  );
}

function Sidebar() {
  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        background: UI.bg,
        padding: "16px 12px 14px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        fontFamily: interFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 4px",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#171717",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <EmdashLogo color="#fafafa" size={24} />
        </span>
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            color: UI.text,
            flex: 1,
          }}
        >
          Emdash
        </span>
        <Pill background={UI.basicBg} color={UI.basicText}>
          BASIC
        </Pill>
        <ChevronDownGlyph />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 36,
          padding: "0 10px",
          borderRadius: 9,
          background: UI.searchBg,
          border: `1px solid ${UI.border}`,
          marginBottom: 14,
        }}
      >
        <span style={{ color: UI.muted, display: "flex" }}>
          <SearchGlyph />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, color: UI.muted }}>Search</span>
        <Keycap label="⌘" />
        <Keycap label="K" />
      </div>
      {NAV_SECTIONS.map((section) => (
        <div key={section.id} style={{ marginBottom: 10 }}>
          {section.label ? (
            <div
              style={{
                fontSize: 12,
                color: UI.muted,
                padding: "8px 11px 6px",
              }}
            >
              {section.label}
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {section.items.map((item) => (
              <NavRow item={item} key={item.id} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <NavRow item={{ id: "settings", label: "Settings" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 4px 0",
        }}
      >
        <Img
          src={staticFile("avatar-raban.png")}
          style={{ width: 32, height: 32, borderRadius: 8 }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: UI.text }}>
            Raban von Spiegel
          </span>
          <span style={{ fontSize: 12, color: UI.muted }}>
            raban@emdash.com
          </span>
        </div>
        <DotsGlyph />
      </div>
    </div>
  );
}

function TrafficLights() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
        <div
          key={color}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

export function DashboardWindow({
  title,
  actions,
  children,
  style,
}: DashboardWindowProps) {
  return (
    <div
      style={{
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        borderRadius: 16,
        background: UI.bg,
        border: `1px solid ${UI.border}`,
        boxShadow:
          "0 30px 80px -20px rgba(30,30,30,0.25), 0 10px 30px -15px rgba(30,30,30,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 46,
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <TrafficLights />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "5px 18px",
              borderRadius: 8,
              background: UI.searchBg,
              fontFamily: interFamily,
              fontSize: 12.5,
              color: UI.muted,
            }}
          >
            app.usenotra.com
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            margin: "0 10px 10px 0",
            borderRadius: 12,
            background: COLORS.background,
            border: `1px solid ${UI.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 24px",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <BackArrowIcon size={18} />
              <span
                style={{
                  fontFamily: interFamily,
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.foreground,
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              {actions}
            </div>
          </div>
          <div style={{ flex: 1, padding: 24, minHeight: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
