import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Cursor } from "../components/cursor";
import { DashboardWindow } from "../components/dashboard-window";
import { FigmaLogo, PaperLogo, WonderLogo } from "../components/logos";
import { RealImage } from "../components/real-image";
import { TitleCard } from "../components/title-card";
import {
  ChevronDownIcon,
  DownloadIcon,
  DropdownItem,
  DropdownMenuCard,
  OutlineButton,
  Toast,
} from "../components/ui";
import { COPY } from "../lib/copy";
import { COLORS } from "../lib/theme";

const ZOOM = 1.6;
const WINDOW_TOP = 120;
const WINDOW_RIGHT = 80;

const CHEVRON_HOVER = 24;
const CHEVRON_CLICK = 30;
const MENU_OPEN_END = CHEVRON_CLICK + 8;
const PAPER_HOVER = 52;
const PAPER_CLICK = 60;
const MENU_CLOSED = PAPER_CLICK + 6;
const COPY_HOVER = 68;
const COPY_CLICK = 75;
const TOAST_AT = COPY_CLICK + 4;

export function ExportMenu() {
  const frame = useCurrentFrame();

  const menuOpen = interpolate(
    frame,
    [CHEVRON_CLICK + 2, MENU_OPEN_END],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const menuClose = interpolate(frame, [PAPER_CLICK + 2, MENU_CLOSED], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const menuProgress = menuOpen * (1 - menuClose);
  const paperSelected = frame >= PAPER_CLICK;
  const paperHovered = frame >= PAPER_HOVER && frame < PAPER_CLICK;

  const toast = interpolate(frame, [TOAST_AT, TOAST_AT + 14], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: WINDOW_TOP,
          right: WINDOW_RIGHT,
          transform: `scale(${ZOOM})`,
          transformOrigin: "top right",
        }}
      >
        <div style={{ position: "relative" }}>
          <DashboardWindow
            actions={
              <>
                <OutlineButton>
                  <DownloadIcon size={16} />
                  Download image
                </OutlineButton>
                <div style={{ display: "flex" }}>
                  <OutlineButton
                    groupPosition="left"
                    hovered={frame >= COPY_HOVER && frame < COPY_CLICK}
                    pressed={frame >= COPY_CLICK && frame < COPY_CLICK + 6}
                  >
                    {paperSelected ? (
                      <PaperLogo size={16} />
                    ) : (
                      <FigmaLogo size={16} />
                    )}
                    Copy for {paperSelected ? "Paper" : "Figma"}
                  </OutlineButton>
                  <OutlineButton
                    groupPosition="right"
                    hovered={frame >= CHEVRON_HOVER && frame < CHEVRON_CLICK}
                    pressed={frame >= CHEVRON_CLICK && frame < PAPER_CLICK}
                  >
                    <ChevronDownIcon size={16} />
                  </OutlineButton>
                </div>
              </>
            }
            title={COPY.windowTitle}
          >
            <TitleCard heading={COPY.contentTitle} height={700}>
              <div
                style={{
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(30,30,30,0.08)",
                }}
              >
                <RealImage width={1000} />
              </div>
            </TitleCard>
          </DashboardWindow>
          {menuProgress > 0 ? (
            <div style={{ position: "absolute", top: 112, right: 24 }}>
              <DropdownMenuCard progress={menuProgress}>
                <DropdownItem
                  highlighted={paperHovered || paperSelected}
                  icon={<PaperLogo size={16} />}
                  label="Copy for Paper"
                  selected={paperSelected}
                />
                <DropdownItem
                  icon={<FigmaLogo size={16} />}
                  label="Copy for Figma"
                  selected={!paperSelected}
                />
                <DropdownItem
                  disabled
                  icon={<WonderLogo color={COLORS.foreground} size={16} />}
                  label="Copy for Wonder"
                  sublabel="Coming soon"
                />
              </DropdownMenuCard>
            </div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 64,
          bottom: 64,
          transform: "scale(1.3)",
          transformOrigin: "bottom right",
        }}
      >
        {toast > 0 ? (
          <Toast
            body={COPY.toastBody}
            progress={toast}
            title={COPY.toastTitle}
          />
        ) : null}
      </div>
      <Cursor
        clickFrames={[CHEVRON_CLICK, PAPER_CLICK, COPY_CLICK]}
        keyframes={[
          { frame: 0, x: 1100, y: 760 },
          { frame: 18, x: 1766, y: 250 },
          { frame: 38, x: 1766, y: 250 },
          { frame: 48, x: 1616, y: 338 },
          { frame: 62, x: 1616, y: 338 },
          { frame: 70, x: 1650, y: 250 },
          { frame: 84, x: 1650, y: 250 },
          { frame: 110, x: 1500, y: 560 },
        ]}
        size={52}
        variantKeyframes={[
          { frame: CHEVRON_HOVER - 4, variant: "handpointing" },
          { frame: COPY_CLICK + 10, variant: "default" },
        ]}
      />
    </AbsoluteFill>
  );
}
