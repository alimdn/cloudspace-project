/**
 * Plan-based resource limits for CloudSpace.
 *
 * Each plan defines:
 * - maxWorkspaces: Maximum number of workspaces per user
 * - maxCpu: Maximum CPU cores per single workspace
 * - maxRam: Maximum RAM (MB) per single workspace
 * - maxDisk: Maximum disk (GB) per single workspace
 * - totalMaxCpu: Total CPU cores across all workspaces for this user
 * - totalMaxRam: Total RAM (MB) across all workspaces for this user
 * - totalMaxDisk: Total disk (GB) across all workspaces for this user
 * - maxPids: Maximum processes per container (fork bomb protection)
 */

export interface PlanResourceLimit {
  maxWorkspaces: number
  maxCpu: number
  maxRam: number // MB
  maxDisk: number // GB
  totalMaxCpu: number
  totalMaxRam: number // MB
  totalMaxDisk: number // GB
  maxPids: number
}

export const PLAN_RESOURCE_LIMITS: Record<string, PlanResourceLimit> = {
  free: {
    maxWorkspaces: 2,
    maxCpu: 1,
    maxRam: 1024,    // 1 GB
    maxDisk: 10,     // 10 GB
    totalMaxCpu: 1.5,
    totalMaxRam: 1536,  // 1.5 GB (allow 1 workspace at full + room)
    totalMaxDisk: 15,   // 15 GB
    maxPids: 100,
  },
  basic: {
    maxWorkspaces: 5,
    maxCpu: 2,
    maxRam: 4096,    // 4 GB
    maxDisk: 50,     // 50 GB
    totalMaxCpu: 4,
    totalMaxRam: 8192,  // 8 GB
    totalMaxDisk: 100,  // 100 GB
    maxPids: 256,
  },
  pro: {
    maxWorkspaces: 10,
    maxCpu: 4,
    maxRam: 16384,   // 16 GB
    maxDisk: 200,    // 200 GB
    totalMaxCpu: 8,
    totalMaxRam: 32768, // 32 GB
    totalMaxDisk: 500,  // 500 GB
    maxPids: 512,
  },
  business: {
    maxWorkspaces: 25,
    maxCpu: 8,
    maxRam: 32768,   // 32 GB
    maxDisk: 500,    // 500 GB
    totalMaxCpu: 16,
    totalMaxRam: 65536, // 64 GB
    totalMaxDisk: 1000, // 1 TB
    maxPids: 1024,
  },
  enterprise: {
    maxWorkspaces: 100,
    maxCpu: 16,
    maxRam: 65536,   // 64 GB
    maxDisk: 1000,   // 1 TB
    totalMaxCpu: 64,
    totalMaxRam: 262144, // 256 GB
    totalMaxDisk: 5000,  // 5 TB
    maxPids: 4096,
  },
}

/**
 * Get resource limits for a given plan.
 * Falls back to free tier if plan is not recognized.
 */
export function getPlanLimits(plan: string): PlanResourceLimit {
  return PLAN_RESOURCE_LIMITS[plan] || PLAN_RESOURCE_LIMITS.free
}

/**
 * Validate that requested resources are within plan limits for a single workspace.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateSingleWorkspaceResources(
  plan: string,
  cpu: number,
  ram: number,
  disk: number
): string | null {
  const limits = getPlanLimits(plan)

  if (cpu > limits.maxCpu) {
    return `CPU limit exceeded for your plan. Maximum is ${limits.maxCpu} vCPU per workspace.`
  }

  if (cpu < 0.25) {
    return 'CPU must be at least 0.25 vCPU.'
  }

  if (ram > limits.maxRam) {
    return `RAM limit exceeded for your plan. Maximum is ${limits.maxRam} MB per workspace.`
  }

  if (ram < 128) {
    return 'RAM must be at least 128 MB.'
  }

  if (disk > limits.maxDisk) {
    return `Disk limit exceeded for your plan. Maximum is ${limits.maxDisk} GB per workspace.`
  }

  if (disk < 1) {
    return 'Disk must be at least 1 GB.'
  }

  return null
}

/**
 * Validate that adding a workspace with given resources won't exceed
 * the user's total aggregate resource pool for their plan.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateAggregateResources(
  plan: string,
  existingTotalCpu: number,
  existingTotalRam: number,
  existingTotalDisk: number,
  newCpu: number,
  newRam: number,
  newDisk: number
): string | null {
  const limits = getPlanLimits(plan)

  const newTotalCpu = existingTotalCpu + newCpu
  const newTotalRam = existingTotalRam + newRam
  const newTotalDisk = existingTotalDisk + newDisk

  if (newTotalCpu > limits.totalMaxCpu) {
    return `Total CPU limit exceeded for your plan. You can use up to ${limits.totalMaxCpu} vCPUs across all workspaces. Currently using ${existingTotalCpu} vCPU(s).`
  }

  if (newTotalRam > limits.totalMaxRam) {
    return `Total RAM limit exceeded for your plan. You can use up to ${limits.totalMaxRam} MB across all workspaces. Currently using ${existingTotalRam} MB.`
  }

  if (newTotalDisk > limits.totalMaxDisk) {
    return `Total disk limit exceeded for your plan. You can use up to ${limits.totalMaxDisk} GB across all workspaces. Currently using ${existingTotalDisk} GB.`
  }

  return null
}
