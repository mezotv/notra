import type { ReactNode } from "react";
import { Column, Row, Section, Text } from "react-email";

import { EMAIL_THEME } from "../constants/theme";

interface EmailTitleCardProps {
  heading: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function EmailTitleCard({
  heading,
  action,
  children,
}: EmailTitleCardProps) {
  return (
    <Section
      style={{
        backgroundColor: EMAIL_THEME.muted,
        border: `1px solid ${EMAIL_THEME.border}`,
        borderRadius: EMAIL_THEME.radius,
        overflow: "hidden",
      }}
    >
      <Row>
        <Column
          style={{
            backgroundColor: EMAIL_THEME.muted,
            padding: "8px 16px",
          }}
        >
          {action ? (
            <Row>
              <Column
                style={{
                  backgroundColor: EMAIL_THEME.muted,
                  verticalAlign: "middle",
                }}
              >
                <HeadingText>{heading}</HeadingText>
              </Column>
              <Column
                align="right"
                style={{
                  backgroundColor: EMAIL_THEME.muted,
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                }}
              >
                {action}
              </Column>
            </Row>
          ) : (
            <HeadingText>{heading}</HeadingText>
          )}
        </Column>
      </Row>
      <Row>
        <Column
          style={{
            backgroundColor: EMAIL_THEME.background,
            borderRadius: `${EMAIL_THEME.radius} ${EMAIL_THEME.radius} 0 0`,
            borderTop: `1px solid ${EMAIL_THEME.border}`,
            padding: "10px 16px",
          }}
        >
          {children}
        </Column>
      </Row>
    </Section>
  );
}

function HeadingText({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: EMAIL_THEME.foreground,
        fontSize: "16px",
        fontWeight: 500,
        lineHeight: 1.25,
        margin: 0,
      }}
    >
      {children}
    </Text>
  );
}
