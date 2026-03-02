"use client";

import { useSidebar } from "@notra/ui/components/ui/sidebar";
import BackgroundControl from "./BackgroundControl";
import DarkModeControl from "./DarkModeControl";
import LanguageControl from "./LanguageControl";
import LineNumberControl from "./LineNumberControl";
import PaddingControl from "./PaddingControl";
import ThemeControl from "./ThemeControl";

const Controls = () => {
  const { state: sidebarState } = useSidebar();

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-20 flex justify-center pb-4 ${sidebarState === "collapsed" ? "md:left-14" : "md:left-64"}`}
    >
      <div className="flex items-center gap-8 overflow-x-auto rounded-2xl border border-border bg-card px-6 py-4 shadow-lg">
        <ThemeControl />
        <BackgroundControl />
        <DarkModeControl />
        <LineNumberControl />
        <PaddingControl />
        <LanguageControl />
      </div>
    </div>
  );
};

export default Controls;
