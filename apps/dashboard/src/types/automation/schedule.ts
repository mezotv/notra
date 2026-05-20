import type {
  LookbackWindow,
  ScheduleOutputType,
} from "@/schemas/integrations";
import type { Trigger } from "@/types/triggers/triggers";

export interface ScheduleCron {
  frequency: "daily" | "weekly" | "monthly";
  hour: number;
  minute: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface ScheduleFormValues {
  name: string;
  outputType: ScheduleOutputType;
  schedule: ScheduleCron;
  repositoryIds: string[];
  lookbackWindow: LookbackWindow;
  brandVoiceId: string;
  autoPublish: boolean;
}

export interface CreateScheduleDialogProps {
  organizationId: string;
  onSuccess?: (trigger: Trigger) => void;
  trigger?: React.ReactElement;
  editTrigger?: Trigger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ScheduleFrequencyTabsProps {
  value: ScheduleCron["frequency"];
  onChange: (next: ScheduleCron["frequency"]) => void;
}

export interface ScheduleDayPickerProps {
  frequency: ScheduleCron["frequency"];
  dayOfWeek?: number;
  dayOfMonth?: number;
  onDayOfWeekChange: (day: number) => void;
  onDayOfMonthChange: (day: number) => void;
}

export interface ScheduleSummaryCardProps {
  schedule: ScheduleCron;
}

export interface ScheduleIntegrationOption {
  value: string;
  label: string;
  type: "github" | "linear";
}
