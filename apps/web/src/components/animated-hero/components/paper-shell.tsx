import type { ReactNode } from "react";
import { interFamily } from "../lib/fonts";
import { PAPER_COLORS, PAPER_UI } from "../lib/paper";
import { steadyTransform } from "../lib/steady";
import type { PaperLayer, PaperSidebarProps } from "../types/paper";
import { PaperLogo } from "./logos";

function Glyph({
  children,
  size = 15,
  viewBox = "0 0 16 16",
}: {
  children: ReactNode;
  size?: number;
  viewBox?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.3}
      viewBox={viewBox}
      width={size}
    >
      {children}
    </svg>
  );
}

function ImageGlyph() {
  return (
    <Glyph>
      <rect height={11} rx={1.5} width={13} x={1.5} y={2.5} />
      <circle cx={5.5} cy={6} r={1.1} />
      <path d="M2.5 12.5 6 9l2.5 2.5 3-3 2 2" />
    </Glyph>
  );
}

function RectGlyph() {
  return (
    <Glyph>
      <rect height={11} rx={1} width={11} x={2.5} y={2.5} />
    </Glyph>
  );
}

function FrameGlyph() {
  return (
    <Glyph>
      <path d="M4.5 1.5v13M11.5 1.5v13M1.5 4.5h13M1.5 11.5h13" />
    </Glyph>
  );
}

function PageGlyph() {
  return (
    <Glyph>
      <path d="M4 1.5h5l3 3V14.5H4z" />
      <path d="M9 1.5v3h3" />
    </Glyph>
  );
}

function LockGlyph() {
  return (
    <Glyph>
      <rect height={6.5} rx={1.5} width={8} x={4} y={7} />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </Glyph>
  );
}

function CheckGlyph() {
  return (
    <Glyph>
      <path d="m3.5 8.5 3 3 6-6.5" />
    </Glyph>
  );
}

function ChevronGlyph() {
  return (
    <Glyph size={11}>
      <path d="m4 6 4 4 4-4" />
    </Glyph>
  );
}

function PlusGlyph() {
  return (
    <Glyph size={13}>
      <path d="M8 3v10M3 8h10" />
    </Glyph>
  );
}

function PanelGlyph() {
  return (
    <Glyph size={16}>
      <rect height={11} rx={2} width={13} x={1.5} y={2.5} />
      <path d="M6 2.5v11" />
    </Glyph>
  );
}

function TextGlyph({ fontSize = 12 }: { fontSize?: number }) {
  return (
    <span
      style={{
        fontFamily: interFamily,
        fontSize,
        fontWeight: 500,
        lineHeight: 1,
        color: "currentcolor",
      }}
    >
      Aa
    </span>
  );
}

function LayerGlyph({ kind }: { kind: PaperLayer["kind"] }) {
  if (kind === "text") {
    return <TextGlyph />;
  }
  if (kind === "image") {
    return <ImageGlyph />;
  }
  if (kind === "rect") {
    return <RectGlyph />;
  }
  return <FrameGlyph />;
}

function LayerRow({
  layer,
  progress = 1,
  selected = false,
}: {
  layer: PaperLayer;
  progress?: number;
  selected?: boolean;
}) {
  return (
    <div
      style={{
        height: PAPER_UI.rowHeight * progress,
        opacity: progress,
        ...steadyTransform(`translateX(${(1 - progress) * -48}px)`),
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 14 + (layer.depth ?? 0) * 18,
        paddingRight: 14,
        background: selected ? PAPER_COLORS.selectedRow : "transparent",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          color: PAPER_COLORS.icon,
          display: "flex",
          width: 16,
          justifyContent: "center",
        }}
      >
        <LayerGlyph kind={layer.kind} />
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: layer.kind === "frame" ? PAPER_COLORS.text : "#c6c6c6",
          fontWeight: layer.kind === "frame" ? 500 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {layer.name}
      </span>
      {layer.locked ? (
        <span style={{ color: PAPER_COLORS.icon, display: "flex" }}>
          <LockGlyph />
        </span>
      ) : null}
    </div>
  );
}

function PageRow({ name, active }: { name: string; active?: boolean }) {
  return (
    <div
      style={{
        height: 30,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px 0 26px",
      }}
    >
      <span style={{ color: PAPER_COLORS.icon, display: "flex" }}>
        <PageGlyph />
      </span>
      <span style={{ flex: 1, fontSize: 13.5, color: PAPER_COLORS.text }}>
        {name}
      </span>
      {active ? (
        <span style={{ color: PAPER_COLORS.text, display: "flex" }}>
          <CheckGlyph />
        </span>
      ) : null}
    </div>
  );
}

function PaperSidebar({ pasted = [], selectedId }: PaperSidebarProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: PAPER_UI.sidebarWidth,
        background: PAPER_COLORS.panel,
        fontFamily: interFamily,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 14px 12px",
        }}
      >
        <PaperLogo color="#d4d4d4" size={16} />
        <span
          style={{
            flex: 1,
            fontSize: 14.5,
            fontWeight: 600,
            color: PAPER_COLORS.text,
          }}
        >
          Welcome to Paper
        </span>
        <span style={{ color: PAPER_COLORS.icon, display: "flex" }}>
          <PanelGlyph />
        </span>
      </div>
      <div style={{ paddingBottom: 8 }}>
        <div
          style={{
            height: 28,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 14px 0 10px",
          }}
        >
          <span style={{ color: PAPER_COLORS.icon, display: "flex" }}>
            <ChevronGlyph />
          </span>
          <span
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              color: PAPER_COLORS.text,
            }}
          >
            Pages
          </span>
          <span style={{ color: PAPER_COLORS.icon, display: "flex" }}>
            <PlusGlyph />
          </span>
        </div>
        <PageRow active name="Page 1" />
      </div>
      <div
        style={{
          height: 1,
          background: PAPER_COLORS.panelBorder,
          margin: "0 0 6px",
        }}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        {pasted.map(({ layer, progress }) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            progress={progress}
            selected={layer.id === selectedId}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          fontSize: 12.5,
          color: PAPER_COLORS.mutedText,
        }}
      >
        <span>What's new</span>
        <span style={{ fontSize: 9 }}>•</span>
        <span>Feedback</span>
      </div>
    </div>
  );
}

function ToolGlyph24({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      width={18}
    >
      {children}
    </svg>
  );
}

function CursorTool() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={17}
      viewBox="0 0 24 24"
      width={17}
    >
      <path d="M5 3l14 11.5-6.4.8L9.5 21z" />
    </svg>
  );
}

function HandTool() {
  return (
    <ToolGlyph24>
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </ToolGlyph24>
  );
}

function ScanTool() {
  return (
    <ToolGlyph24>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </ToolGlyph24>
  );
}

function SquareTool() {
  return (
    <ToolGlyph24>
      <rect height={16} rx={1.5} width={16} x={4} y={4} />
    </ToolGlyph24>
  );
}

function PenTool() {
  return (
    <ToolGlyph24>
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="m2 2 7.586 7.586" />
      <circle cx={11} cy={11} r={2} />
    </ToolGlyph24>
  );
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 3.2}l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z`}
      fill="currentColor"
      stroke="none"
    />
  );
}

function ImageGenTool() {
  return (
    <ToolGlyph24>
      <rect height={15} rx={2} width={15} x={3} y={6} />
      <path d="M4 18.5 9 13.5l3.5 3.5 3-3 2.5 2.5" />
      <Sparkle x={19.5} y={4.5} />
    </ToolGlyph24>
  );
}

function FrameGenTool() {
  return (
    <ToolGlyph24>
      <path d="M3 10V8a2 2 0 0 1 2-2h2" />
      <path d="M3 17v2a2 2 0 0 0 2 2h2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M13 6h2" />
      <Sparkle x={19.5} y={4.5} />
    </ToolGlyph24>
  );
}

function DiamondTool() {
  return (
    <ToolGlyph24>
      <rect height={16} rx={2} width={16} x={4} y={4} />
      <path d="M12 8.5 15.5 12 12 15.5 8.5 12z" />
    </ToolGlyph24>
  );
}

const TOOLS = [
  { id: "select", active: true, icon: <CursorTool /> },
  { id: "hand", icon: <HandTool /> },
  { id: "scan", icon: <ScanTool /> },
  { id: "square", icon: <SquareTool /> },
  { id: "pen", icon: <PenTool /> },
  { id: "text", icon: <TextGlyph fontSize={15} /> },
];

const GEN_TOOLS = [
  { id: "image-gen", icon: <ImageGenTool /> },
  { id: "frame-gen", icon: <FrameGenTool /> },
  { id: "diamond", icon: <DiamondTool /> },
];

function ToolButton({ active, icon }: { active?: boolean; icon: ReactNode }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? PAPER_COLORS.activeTool : "transparent",
        color: active ? "#f2f2f2" : PAPER_COLORS.toolIcon,
      }}
    >
      {icon}
    </div>
  );
}

function PaperToolbar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: PAPER_UI.sidebarWidth,
        width: PAPER_UI.toolbarWidth,
        background: PAPER_COLORS.panel,
        borderLeft: `1px solid ${PAPER_COLORS.panelBorder}`,
        boxShadow: "6px 0 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 10,
        gap: 5,
      }}
    >
      {TOOLS.map((tool) => (
        <ToolButton active={tool.active} icon={tool.icon} key={tool.id} />
      ))}
      <div
        style={{
          width: 26,
          height: 1,
          background: PAPER_COLORS.panelBorder,
          margin: "5px 0",
        }}
      />
      {GEN_TOOLS.map((tool) => (
        <ToolButton icon={tool.icon} key={tool.id} />
      ))}
    </div>
  );
}

export function PaperChrome(props: PaperSidebarProps) {
  return (
    <>
      <PaperSidebar {...props} />
      <PaperToolbar />
    </>
  );
}
