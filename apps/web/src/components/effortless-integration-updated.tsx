import { Framer } from "@notra/ui/components/ui/svgs/framer";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Marble } from "@notra/ui/components/ui/svgs/marble";
import { Slack } from "@notra/ui/components/ui/svgs/slack";
import { Webflow } from "@notra/ui/components/ui/svgs/webflow";
import type React from "react";
import type { SVGProps } from "react";
import { NotraMark } from "./notra-mark";

interface EffortlessIntegrationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

interface IntegrationOrbit {
  name: string;
  radius: number;
  angle: number;
  duration: number;
  direction?: "normal" | "reverse";
  background: string;
  iconClassName: string;
  Icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
}

const centerX = 250;
const centerY = 179;

const integrations: IntegrationOrbit[] = [
  {
    name: "GitHub",
    radius: 80,
    angle: Math.PI,
    duration: 18,
    background: "#ffffff",
    iconClassName: "h-[18px] w-[18px]",
    Icon: Github,
  },
  {
    name: "Linear",
    radius: 80,
    angle: 0,
    duration: 18,
    background: "#ffffff",
    iconClassName: "h-[18px] w-[18px]",
    Icon: Linear,
  },
  {
    name: "Slack",
    radius: 120,
    angle: -Math.PI / 4,
    duration: 24,
    direction: "reverse",
    background: "#ffffff",
    iconClassName: "h-[18px] w-[18px]",
    Icon: Slack,
  },
  {
    name: "Marble",
    radius: 120,
    angle: (3 * Math.PI) / 4,
    duration: 24,
    direction: "reverse",
    background: "#ffffff",
    iconClassName: "h-[16px] w-[16px] rounded-[4px]",
    Icon: Marble,
  },
  {
    name: "Webflow",
    radius: 160,
    angle: Math.PI,
    duration: 30,
    background: "#ffffff",
    iconClassName: "h-[16px] w-[16px]",
    Icon: Webflow,
  },
  {
    name: "Framer",
    radius: 160,
    angle: 0,
    duration: 30,
    direction: "reverse",
    background: "#ffffff",
    iconClassName: "h-[16px] w-[16px]",
    Icon: Framer,
  },
];

const EffortlessIntegration: React.FC<EffortlessIntegrationProps> = ({
  width = 482,
  height = 300,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.1) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.2)",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "240px",
          height: "240px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.25)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.3)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          width: "500px",
          height: "358px",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          position: "absolute",
        }}
      >
        {integrations.map((integration) => {
          const baseAngle = (integration.angle * 180) / Math.PI;
          const orbitDelay =
            -((integration.angle + Math.PI) / (2 * Math.PI)) *
            integration.duration;

          return (
            <div
              key={integration.name}
              style={{
                position: "absolute",
                left: `${centerX}px`,
                top: `${centerY}px`,
                width: `${integration.radius * 2}px`,
                height: `${integration.radius * 2}px`,
                transform: "translate(-50%, -50%)",
                transformOrigin: "50% 50%",
                animationName: "orbitSpin",
                animationDuration: `${integration.duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDirection: integration.direction ?? "normal",
                animationDelay: `${orbitDelay}s`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotate(${baseAngle}deg)`,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    position: "absolute",
                    right: "-16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: integration.background,
                    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animationName: "iconSpin",
                      animationDuration: `${integration.duration}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                      animationDirection:
                        integration.direction === "reverse"
                          ? "normal"
                          : "reverse",
                    }}
                  >
                    <integration.Icon className={integration.iconClassName} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div
          style={{
            width: "72px",
            height: "72px",
            left: `${centerX - 36}px`,
            top: `${centerY - 36}px`,
            position: "absolute",
            background: "#37322f",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "99px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8E51FF",
            zIndex: 2,
          }}
        >
          <NotraMark className="h-8 w-8 shrink-0" strokeWidth={42} />
        </div>
      </div>
    </div>
  );
};

export default EffortlessIntegration;
