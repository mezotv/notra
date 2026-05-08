import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "notra", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
