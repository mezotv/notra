import type { ScheduleCron } from "@/schemas/automation/schedule-form";
import type { Trigger } from "@/types/triggers/triggers";

export type {
  ScheduleCron,
  ScheduleFormValues,
} from "@/schemas/automation/schedule-form";

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
