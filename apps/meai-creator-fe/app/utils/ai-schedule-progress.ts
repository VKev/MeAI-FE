import type { AiSchedule, ProgressLogStep } from '@/models/ai-schedule.model';

export type ProgressStepStatus = 'Running' | 'Completed' | 'Failed' | 'Skipped';

export interface ExecutionContext {
  currentStep?: string;
  currentStepStatus?: ProgressStepStatus;
  currentStepMessage?: string;
  steps?: ProgressLogStep[];
  runtimePostBuilderId?: string;
  runtimePostIds?: string[];
}

type ScheduleProgressPayloadOptions = {
  notificationType?: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const values = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());

  return values.length > 0 ? values : undefined;
}

const STEP_STATUS_BY_KEY: Record<string, ProgressStepStatus> = {
  running: 'Running',
  processing: 'Running',
  in_progress: 'Running',
  started: 'Running',
  executing: 'Running',
  publishing: 'Running',
  pending: 'Running',
  completed: 'Completed',
  complete: 'Completed',
  done: 'Completed',
  success: 'Completed',
  succeeded: 'Completed',
  published: 'Completed',
  failed: 'Failed',
  failure: 'Failed',
  error: 'Failed',
  skipped: 'Skipped',
  skip: 'Skipped'
};

function normalizeProgressStepStatus(value: unknown) {
  const key = readString(value)
    ?.toLowerCase()
    .replace(/[\s-]+/g, '_');
  return key ? STEP_STATUS_BY_KEY[key] : undefined;
}

function getNotificationTerminalStepStatus(notificationType?: string): ProgressStepStatus | undefined {
  const normalizedType = notificationType?.toLowerCase();
  if (!normalizedType) return undefined;

  if (normalizedType.endsWith('.completed')) return 'Completed';
  if (normalizedType.endsWith('.failed')) return 'Failed';

  return undefined;
}

function getNotificationScheduleStatus(notificationType?: string): AiSchedule['status'] | undefined {
  const terminalStepStatus = getNotificationTerminalStepStatus(notificationType);
  if (terminalStepStatus === 'Completed') return 'Completed';
  if (terminalStepStatus === 'Failed') return 'Failed';

  return undefined;
}

function readStepCode(source: Record<string, unknown>) {
  return (
    readString(source.step) ||
    readString(source.stepId) ||
    readString(source.stepCode) ||
    readString(source.currentStep) ||
    readString(source.action) ||
    readString(source.name) ||
    readString(source.title) ||
    readString(source.phase)
  );
}

function readCurrentStep(source: Record<string, unknown>) {
  return (
    readString(source.currentStep) ||
    readString(source.step) ||
    readString(source.stepId) ||
    readString(source.stepCode) ||
    readString(source.action) ||
    readString(source.phase)
  );
}

function readTimestamp(source: Record<string, unknown>) {
  return (
    readString(source.timestampUtc) ||
    readString(source.timestamp) ||
    readString(source.createdAt) ||
    readString(source.updatedAt)
  );
}

function normalizeProgressStep(
  rawStep: unknown,
  fallback?: {
    step?: string;
    status?: ProgressStepStatus;
    message?: string;
    timestampUtc?: string;
  }
): ProgressLogStep | null {
  if (!isRecord(rawStep)) return null;

  const step = readStepCode(rawStep) || fallback?.step;
  const message = readString(rawStep.message) || readString(rawStep.currentStepMessage) || fallback?.message || '';

  if (!step && !message) return null;

  return {
    step: step || '',
    stepId: readString(rawStep.stepId),
    stepCode: readString(rawStep.stepCode),
    currentStep: readString(rawStep.currentStep),
    action: readString(rawStep.action),
    name: readString(rawStep.name),
    title: readString(rawStep.title),
    status:
      normalizeProgressStepStatus(rawStep.status) ||
      normalizeProgressStepStatus(rawStep.currentStepStatus) ||
      fallback?.status ||
      'Running',
    message,
    timestampUtc: readTimestamp(rawStep) || fallback?.timestampUtc || new Date().toISOString(),
    timestamp: readString(rawStep.timestamp),
    createdAt: readString(rawStep.createdAt)
  };
}

function isSameStep(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function mergeProgressSteps(
  previousSteps: ProgressLogStep[],
  incomingSteps: ProgressLogStep[],
  currentStep?: string,
  terminalStepStatus?: ProgressStepStatus
) {
  let merged = previousSteps
    .map((step) => normalizeProgressStep(step))
    .filter((step): step is ProgressLogStep => step != null);

  for (const nextStep of incomingSteps) {
    const existingIndex = nextStep.step ? merged.findIndex((step) => isSameStep(step.step, nextStep.step)) : -1;

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...nextStep,
        step: nextStep.step || merged[existingIndex].step,
        status: nextStep.status || merged[existingIndex].status,
        message: nextStep.message || merged[existingIndex].message,
        timestampUtc: nextStep.timestampUtc || merged[existingIndex].timestampUtc
      };
    } else {
      merged.push(nextStep);
    }
  }

  if (terminalStepStatus === 'Completed') {
    return merged.map((step) => (step.status === 'Running' ? { ...step, status: 'Completed' as const } : step));
  }

  if (terminalStepStatus === 'Failed') {
    let failedStepIndex = currentStep ? merged.findIndex((step) => isSameStep(step.step, currentStep)) : -1;

    if (failedStepIndex < 0) {
      for (let index = merged.length - 1; index >= 0; index -= 1) {
        if (merged[index].status === 'Running') {
          failedStepIndex = index;
          break;
        }
      }
    }

    return merged.map((step, index) => {
      if (index === failedStepIndex) return { ...step, status: 'Failed' as const };
      if (step.status === 'Running') return { ...step, status: 'Completed' as const };
      return step;
    });
  }

  if (currentStep) {
    merged = merged.map((step) =>
      step.step && !isSameStep(step.step, currentStep) && step.status === 'Running'
        ? { ...step, status: 'Completed' as const }
        : step
    );
  }

  return merged;
}

export function parseExecutionContextJson(value: string | null | undefined): ExecutionContext | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? (parsed as ExecutionContext) : null;
  } catch {
    return null;
  }
}

function buildExecutionContextFromPayload(
  payload: Record<string, unknown>,
  previousContext: ExecutionContext | null,
  options: ScheduleProgressPayloadOptions = {}
): ExecutionContext {
  const notificationTerminalStepStatus = getNotificationTerminalStepStatus(options.notificationType);
  const payloadCurrentStep = readCurrentStep(payload);
  const currentStep = payloadCurrentStep || previousContext?.currentStep;
  const canReusePreviousCurrentStep =
    !payloadCurrentStep || isSameStep(payloadCurrentStep, previousContext?.currentStep);
  const currentStepStatus =
    notificationTerminalStepStatus ||
    normalizeProgressStepStatus(payload.currentStepStatus) ||
    normalizeProgressStepStatus(payload.stepStatus) ||
    normalizeProgressStepStatus(payload.phaseStatus) ||
    normalizeProgressStepStatus(payload.status) ||
    (canReusePreviousCurrentStep ? previousContext?.currentStepStatus : undefined);
  const currentStepMessage =
    readString(payload.currentStepMessage) ||
    readString(payload.message) ||
    (canReusePreviousCurrentStep ? previousContext?.currentStepMessage : undefined);
  const currentTimestamp = readTimestamp(payload) || new Date().toISOString();

  const fallbackStep = {
    step: currentStep,
    status: currentStepStatus || 'Running',
    message: currentStepMessage || '',
    timestampUtc: currentTimestamp
  };
  const rawSteps = Array.isArray(payload.steps) ? payload.steps : [];
  const incomingSteps = rawSteps
    .map((step, index) => normalizeProgressStep(step, index === rawSteps.length - 1 ? fallbackStep : undefined))
    .filter((step): step is ProgressLogStep => step != null);
  const currentStepIndex = currentStep ? incomingSteps.findIndex((step) => isSameStep(step.step, currentStep)) : -1;

  if (currentStep) {
    const currentStepLog: ProgressLogStep = {
      step: currentStep,
      status: currentStepStatus || 'Running',
      message: currentStepMessage || '',
      timestampUtc: currentTimestamp
    };

    if (currentStepIndex >= 0) {
      incomingSteps[currentStepIndex] = {
        ...incomingSteps[currentStepIndex],
        status: currentStepStatus || incomingSteps[currentStepIndex].status,
        message: currentStepMessage || incomingSteps[currentStepIndex].message,
        timestampUtc: incomingSteps[currentStepIndex].timestampUtc || currentTimestamp
      };
    } else {
      incomingSteps.push(currentStepLog);
    }
  }

  return {
    currentStep,
    currentStepStatus,
    currentStepMessage,
    steps: mergeProgressSteps(
      Array.isArray(previousContext?.steps) ? previousContext.steps : [],
      incomingSteps,
      currentStep,
      notificationTerminalStepStatus
    ),
    runtimePostBuilderId: readString(payload.runtimePostBuilderId) || previousContext?.runtimePostBuilderId,
    runtimePostIds: readStringArray(payload.runtimePostIds) || previousContext?.runtimePostIds
  };
}

export function applyScheduleProgressPayload(
  schedule: AiSchedule,
  payload: Record<string, unknown>,
  options: ScheduleProgressPayloadOptions = {}
): AiSchedule {
  const executionContext = buildExecutionContextFromPayload(
    payload,
    parseExecutionContextJson(schedule.executionContextJson),
    options
  );
  const runtimePostBuilderId = readString(payload.runtimePostBuilderId);
  const runtimePostIds = readStringArray(payload.runtimePostIds);
  const notificationScheduleStatus = getNotificationScheduleStatus(options.notificationType);

  return {
    ...schedule,
    status: (notificationScheduleStatus || readString(payload.status) || schedule.status) as AiSchedule['status'],
    executionContextJson: JSON.stringify(executionContext),
    runtimePostBuilderId: runtimePostBuilderId || schedule.runtimePostBuilderId,
    runtimePostIds: runtimePostIds || schedule.runtimePostIds
  };
}
