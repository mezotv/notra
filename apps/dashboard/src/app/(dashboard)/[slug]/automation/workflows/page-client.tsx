"use client";

import {
  AiNetworkIcon,
  AlertCircleIcon,
  BloggerIcon,
  Calendar03Icon,
  DocumentCodeIcon,
  InspectCodeIcon,
  NoteIcon,
  RedoIcon,
  RefreshIcon,
  SentIcon,
  TagsIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Github } from "@notra/ui/components/ui/svgs/github";
import {
  addEdge,
  Background,
  BaseEdge,
  Controls,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  type OnConnect,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type DragEvent, memo, useCallback } from "react";

type NodeVariant =
  | "trigger"
  | "process"
  | "aiReview"
  | "humanReview"
  | "publish"
  | "error";

type WorkflowNodeData = {
  label: string;
  description?: string;
  icon?: IconSvgElement;
  githubIcon?: boolean;
  variant: NodeVariant;
};

type WorkflowNode = Node<WorkflowNodeData, "workflow">;

type WorkflowEdgeData = {
  label?: string;
  variant?: "default" | "success" | "error" | "warning";
};

type WorkflowEdge = Edge<WorkflowEdgeData>;

const accentColors: Record<
  NodeVariant,
  { bar: string; iconBg: string; minimap: string }
> = {
  trigger: {
    bar: "bg-foreground/60",
    iconBg: "bg-foreground/8",
    minimap: "#71717a",
  },
  process: {
    bar: "bg-blue-500",
    iconBg: "bg-blue-500/10",
    minimap: "#3b82f6",
  },
  aiReview: {
    bar: "bg-violet-500",
    iconBg: "bg-violet-500/10",
    minimap: "#8b5cf6",
  },
  humanReview: {
    bar: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    minimap: "#f59e0b",
  },
  publish: {
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-500/10",
    minimap: "#10b981",
  },
  error: {
    bar: "bg-red-500",
    iconBg: "bg-red-500/10",
    minimap: "#ef4444",
  },
};

const handleColor: Record<string, string> = {
  out: "!bg-muted-foreground/60",
  in: "!bg-muted-foreground/60",
  success: "!bg-emerald-500",
  fail: "!bg-red-500",
  pass: "!bg-emerald-500",
  flag: "!bg-amber-500",
  approve: "!bg-emerald-500",
  reject: "!bg-red-500",
};

const HANDLE_BASE = "!h-2.5 !w-2.5 !border-2 !border-card !rounded-full";

function Handles({ variant }: { variant: NodeVariant }) {
  switch (variant) {
    case "trigger":
      return (
        <Handle
          className={`${HANDLE_BASE} ${handleColor.out}`}
          id="out"
          position={Position.Bottom}
          type="source"
        />
      );
    case "process":
      return (
        <>
          <Handle
            className={`${HANDLE_BASE} ${handleColor.in}`}
            id="in"
            position={Position.Top}
            type="target"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.success}`}
            id="success"
            position={Position.Bottom}
            type="source"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.fail}`}
            id="fail"
            position={Position.Right}
            type="source"
          />
        </>
      );
    case "aiReview":
      return (
        <>
          <Handle
            className={`${HANDLE_BASE} ${handleColor.in}`}
            id="in"
            position={Position.Top}
            type="target"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.pass}`}
            id="pass"
            position={Position.Bottom}
            type="source"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.flag}`}
            id="flag"
            position={Position.Right}
            type="source"
          />
        </>
      );
    case "humanReview":
      return (
        <>
          <Handle
            className={`${HANDLE_BASE} ${handleColor.in}`}
            id="in"
            position={Position.Top}
            type="target"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.approve}`}
            id="approve"
            position={Position.Bottom}
            type="source"
          />
          <Handle
            className={`${HANDLE_BASE} ${handleColor.reject}`}
            id="reject"
            position={Position.Right}
            type="source"
          />
        </>
      );
    case "publish":
      return (
        <Handle
          className={`${HANDLE_BASE} ${handleColor.in}`}
          id="in"
          position={Position.Top}
          type="target"
        />
      );
    case "error":
      return (
        <Handle
          className={`${HANDLE_BASE} ${handleColor.in}`}
          id="in"
          position={Position.Left}
          type="target"
        />
      );
  }
}

const WorkflowNodeComponent = memo(function WorkflowNodeComponent({
  data,
  selected,
}: NodeProps<WorkflowNode>) {
  const colors = accentColors[data.variant];
  const isError = data.variant === "error";

  return (
    <div
      className={`group relative min-w-[11.5rem] rounded-xl bg-card transition-shadow duration-150 ease-out ${
        isError
          ? "border border-red-500/25 border-dashed shadow-none"
          : "shadow-[0_0_0_1px_var(--border),0_1px_3px_-1px_rgba(0,0,0,0.04),0_2px_6px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_0_0_1px_var(--border),0_3px_12px_-2px_rgba(0,0,0,0.08)]"
      }
        ${selected ? "!shadow-[0_0_0_2px_var(--primary),0_0_0_4px_var(--primary-foreground)]" : ""}
      `}
    >
      {!isError && (
        <div
          className={`absolute top-3 bottom-3 left-0 w-[0.1875rem] rounded-full ${colors.bar}`}
        />
      )}

      <div className="flex items-center gap-2.5 py-2.5 pr-3.5 pl-4">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}
        >
          {data.githubIcon ? (
            <Github className="size-4" />
          ) : data.icon ? (
            <HugeiconsIcon className="size-4" icon={data.icon} />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-[0.8125rem] leading-tight">
            {data.label}
          </span>
          {data.description && (
            <span className="truncate text-[0.6875rem] text-muted-foreground">
              {data.description}
            </span>
          )}
        </div>
      </div>

      <Handles variant={data.variant} />
    </div>
  );
});

const edgeStrokeColor: Record<string, string> = {
  default: "var(--border)",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
};

const edgeLabelStyle: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/15",
  error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/15",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/15",
};

function WorkflowEdgeComponent(props: EdgeProps<WorkflowEdge>) {
  const variant = props.data?.variant ?? "default";
  const isDashed = variant === "error" || variant === "warning";

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 10,
  });

  return (
    <>
      <BaseEdge
        id={props.id}
        path={edgePath}
        style={{
          stroke: edgeStrokeColor[variant],
          strokeWidth: 1.5,
          strokeDasharray: isDashed ? "6 4" : undefined,
        }}
      />
      {props.data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span
              className={`inline-block rounded-full border px-1.5 py-px font-medium text-[0.5625rem] leading-normal ${edgeLabelStyle[variant]}`}
            >
              {props.data.label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { workflow: WorkflowNodeComponent };
const edgeTypes = { workflow: WorkflowEdgeComponent };

const initialNodes: WorkflowNode[] = [
  {
    id: "release",
    type: "workflow",
    position: { x: 340, y: 0 },
    data: {
      label: "GitHub Release",
      description: "v2.4.0 published",
      githubIcon: true,
      variant: "trigger",
    },
  },

  {
    id: "gen-blog",
    type: "workflow",
    position: { x: 0, y: 180 },
    data: {
      label: "Blog Post",
      description: "Long-form article",
      icon: BloggerIcon,
      variant: "process",
    },
  },
  {
    id: "gen-changelog",
    type: "workflow",
    position: { x: 240, y: 180 },
    data: {
      label: "Changelog",
      description: "Release notes",
      icon: NoteIcon,
      variant: "process",
    },
  },
  {
    id: "gen-social",
    type: "workflow",
    position: { x: 480, y: 180 },
    data: {
      label: "Social Post",
      description: "Twitter / X thread",
      icon: TagsIcon,
      variant: "process",
    },
  },
  {
    id: "gen-docs",
    type: "workflow",
    position: { x: 720, y: 180 },
    data: {
      label: "Documentation",
      description: "API reference update",
      icon: DocumentCodeIcon,
      variant: "process",
    },
  },

  {
    id: "retry",
    type: "workflow",
    position: { x: 1000, y: 180 },
    data: {
      label: "Retry Queue",
      description: "Auto-retry failed jobs",
      icon: RefreshIcon,
      variant: "error",
    },
  },

  {
    id: "ai-review",
    type: "workflow",
    position: { x: 340, y: 380 },
    data: {
      label: "AI Review",
      description: "Quality & accuracy check",
      icon: AiNetworkIcon,
      variant: "aiReview",
    },
  },

  {
    id: "flag",
    type: "workflow",
    position: { x: 720, y: 380 },
    data: {
      label: "Manual Edit",
      description: "Flagged for correction",
      icon: AlertCircleIcon,
      variant: "error",
    },
  },

  {
    id: "human-review",
    type: "workflow",
    position: { x: 340, y: 560 },
    data: {
      label: "Human Review",
      description: "Final approval step",
      icon: InspectCodeIcon,
      variant: "humanReview",
    },
  },

  {
    id: "revise",
    type: "workflow",
    position: { x: 720, y: 560 },
    data: {
      label: "Revision",
      description: "Send back for changes",
      icon: RedoIcon,
      variant: "error",
    },
  },

  {
    id: "pub-blog",
    type: "workflow",
    position: { x: 0, y: 760 },
    data: {
      label: "Publish Blog",
      description: "blog.acme.com",
      icon: SentIcon,
      variant: "publish",
    },
  },
  {
    id: "pub-changelog",
    type: "workflow",
    position: { x: 240, y: 760 },
    data: {
      label: "Publish Changelog",
      description: "changelog.acme.com",
      icon: SentIcon,
      variant: "publish",
    },
  },
  {
    id: "pub-social",
    type: "workflow",
    position: { x: 480, y: 760 },
    data: {
      label: "Publish Social",
      description: "x.com/acme",
      icon: SentIcon,
      variant: "publish",
    },
  },
  {
    id: "pub-docs",
    type: "workflow",
    position: { x: 720, y: 760 },
    data: {
      label: "Publish Docs",
      description: "docs.acme.com",
      icon: SentIcon,
      variant: "publish",
    },
  },
];

const initialEdges: WorkflowEdge[] = [
  {
    id: "e-release-blog",
    source: "release",
    sourceHandle: "out",
    target: "gen-blog",
    targetHandle: "in",
    type: "workflow",
    animated: true,
  },
  {
    id: "e-release-changelog",
    source: "release",
    sourceHandle: "out",
    target: "gen-changelog",
    targetHandle: "in",
    type: "workflow",
    animated: true,
  },
  {
    id: "e-release-social",
    source: "release",
    sourceHandle: "out",
    target: "gen-social",
    targetHandle: "in",
    type: "workflow",
    animated: true,
  },
  {
    id: "e-release-docs",
    source: "release",
    sourceHandle: "out",
    target: "gen-docs",
    targetHandle: "in",
    type: "workflow",
    animated: true,
  },

  {
    id: "e-blog-ai",
    source: "gen-blog",
    sourceHandle: "success",
    target: "ai-review",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "success" },
  },
  {
    id: "e-changelog-ai",
    source: "gen-changelog",
    sourceHandle: "success",
    target: "ai-review",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "success" },
  },
  {
    id: "e-social-ai",
    source: "gen-social",
    sourceHandle: "success",
    target: "ai-review",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "success" },
  },
  {
    id: "e-docs-ai",
    source: "gen-docs",
    sourceHandle: "success",
    target: "ai-review",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "success" },
  },

  {
    id: "e-blog-retry",
    source: "gen-blog",
    sourceHandle: "fail",
    target: "retry",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "error", label: "Failed" },
  },
  {
    id: "e-changelog-retry",
    source: "gen-changelog",
    sourceHandle: "fail",
    target: "retry",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "error", label: "Failed" },
  },
  {
    id: "e-social-retry",
    source: "gen-social",
    sourceHandle: "fail",
    target: "retry",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "error", label: "Failed" },
  },
  {
    id: "e-docs-retry",
    source: "gen-docs",
    sourceHandle: "fail",
    target: "retry",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "error", label: "Failed" },
  },

  {
    id: "e-ai-human",
    source: "ai-review",
    sourceHandle: "pass",
    target: "human-review",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "success", label: "Passed" },
  },
  {
    id: "e-ai-flag",
    source: "ai-review",
    sourceHandle: "flag",
    target: "flag",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "warning", label: "Flagged" },
  },

  {
    id: "e-human-pub-blog",
    source: "human-review",
    sourceHandle: "approve",
    target: "pub-blog",
    targetHandle: "in",
    type: "workflow",
    animated: true,
    data: { variant: "success" },
  },
  {
    id: "e-human-pub-changelog",
    source: "human-review",
    sourceHandle: "approve",
    target: "pub-changelog",
    targetHandle: "in",
    type: "workflow",
    animated: true,
    data: { variant: "success" },
  },
  {
    id: "e-human-pub-social",
    source: "human-review",
    sourceHandle: "approve",
    target: "pub-social",
    targetHandle: "in",
    type: "workflow",
    animated: true,
    data: { variant: "success" },
  },
  {
    id: "e-human-pub-docs",
    source: "human-review",
    sourceHandle: "approve",
    target: "pub-docs",
    targetHandle: "in",
    type: "workflow",
    animated: true,
    data: { variant: "success" },
  },

  {
    id: "e-human-revise",
    source: "human-review",
    sourceHandle: "reject",
    target: "revise",
    targetHandle: "in",
    type: "workflow",
    data: { variant: "error", label: "Rejected" },
  },
];

interface PaletteItem {
  variant: NodeVariant;
  label: string;
  icon?: IconSvgElement;
  githubIcon?: boolean;
  description?: string;
}

const paletteCategories: { label: string; items: PaletteItem[] }[] = [
  {
    label: "Triggers",
    items: [
      { variant: "trigger", label: "GitHub Release", githubIcon: true },
      {
        variant: "trigger",
        label: "Scheduled",
        icon: Calendar03Icon,
        description: "Cron-based trigger",
      },
    ],
  },
  {
    label: "Generators",
    items: [
      {
        variant: "process",
        label: "Blog Post",
        icon: BloggerIcon,
        description: "Long-form article",
      },
      {
        variant: "process",
        label: "Changelog",
        icon: NoteIcon,
        description: "Release notes",
      },
      {
        variant: "process",
        label: "Social Post",
        icon: TagsIcon,
        description: "Twitter / X thread",
      },
      {
        variant: "process",
        label: "Documentation",
        icon: DocumentCodeIcon,
        description: "API reference update",
      },
    ],
  },
  {
    label: "Reviews",
    items: [
      {
        variant: "aiReview",
        label: "AI Review",
        icon: AiNetworkIcon,
        description: "Quality check",
      },
      {
        variant: "humanReview",
        label: "Human Review",
        icon: InspectCodeIcon,
        description: "Manual approval",
      },
    ],
  },
  {
    label: "Outputs",
    items: [
      {
        variant: "publish",
        label: "Publish",
        icon: SentIcon,
        description: "Deploy content",
      },
      {
        variant: "error",
        label: "Retry",
        icon: RefreshIcon,
        description: "Auto-retry failures",
      },
      {
        variant: "error",
        label: "Revision",
        icon: RedoIcon,
        description: "Send back for edits",
      },
    ],
  },
];

const paletteItemLookup = new Map<string, PaletteItem>();
for (const category of paletteCategories) {
  for (const item of category.items) {
    paletteItemLookup.set(`${item.variant}:${item.label}`, item);
  }
}

function handlePaletteDragStart(event: DragEvent, item: PaletteItem) {
  event.dataTransfer.setData("application/reactflow/variant", item.variant);
  event.dataTransfer.setData("application/reactflow/label", item.label);
  event.dataTransfer.effectAllowed = "move";
}

function NodePalette() {
  return (
    <aside className="flex w-[15rem] shrink-0 flex-col border-r bg-card/50">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-sm">Workflow Builder</h2>
        <p className="text-[0.6875rem] text-muted-foreground">
          Drag nodes onto the canvas
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {paletteCategories.map((category) => (
          <div key={category.label}>
            <span className="mb-1.5 block px-1 font-medium text-[0.625rem] text-muted-foreground uppercase tracking-widest">
              {category.label}
            </span>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const colors = accentColors[item.variant];
                return (
                  <div
                    className="flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-colors duration-100 ease-out hover:border-border hover:bg-accent/50 active:cursor-grabbing"
                    draggable
                    key={`${item.variant}-${item.label}`}
                    onDragStart={(e) => handlePaletteDragStart(e, item)}
                  >
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md ${colors.iconBg}`}
                    >
                      {item.githubIcon ? (
                        <Github className="size-3" />
                      ) : item.icon ? (
                        <HugeiconsIcon className="size-3" icon={item.icon} />
                      ) : null}
                    </div>
                    <span className="text-[0.8125rem]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function minimapNodeColor(node: Node): string {
  const variant = (node.data as WorkflowNodeData)?.variant;
  return accentColors[variant]?.minimap ?? "#71717a";
}

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) => addEdge({ ...connection, type: "workflow" }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const variant = event.dataTransfer.getData(
        "application/reactflow/variant"
      ) as NodeVariant;
      const label = event.dataTransfer.getData("application/reactflow/label");
      if (!variant || !label) return;

      const item = paletteItemLookup.get(`${variant}:${label}`);
      if (!item) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: `${variant}-${Date.now()}`,
        type: "workflow",
        position,
        data: {
          label: item.label,
          description: item.description,
          icon: item.icon,
          githubIcon: item.githubIcon,
          variant: item.variant,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="min-h-0 flex-1">
      <ReactFlow
        connectionLineStyle={{ stroke: "var(--border)", strokeWidth: 1.5 }}
        defaultEdgeOptions={{ type: "workflow" }}
        edges={edges}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap nodeColor={minimapNodeColor} pannable zoomable />
      </ReactFlow>
    </div>
  );
}

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient(_props: PageClientProps) {
  return (
    <div className="flex min-h-0 flex-1">
      <ReactFlowProvider>
        <NodePalette />
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
