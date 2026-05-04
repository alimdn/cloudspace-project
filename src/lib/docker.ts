import Docker from 'dockerode'

/**
 * Docker Engine client using dockerode.
 * Connects via DOCKER_HOST env var or defaults to /var/run/docker.sock.
 * All functions include proper error handling and JSDoc documentation.
 */

let dockerInstance: Docker | null = null

function initDocker(): Docker | null {
  if (dockerInstance) return dockerInstance

  try {
    const dockerHost = process.env.DOCKER_HOST || '/var/run/docker.sock'

    const opts: Docker.DockerOptions = {
      socketPath: dockerHost.startsWith('/') ? dockerHost : undefined,
      host: dockerHost.startsWith('tcp') || dockerHost.startsWith('http') ? dockerHost : undefined,
      protocol: dockerHost.startsWith('tcp') ? 'http' : undefined,
    }

    dockerInstance = new Docker(opts)

    // Verify connection
    dockerInstance.ping((err) => {
      if (err) {
        console.warn(`[Docker] Cannot connect to Docker daemon at ${dockerHost}:`, err.message)
      } else {
        console.log(`[Docker] Connected successfully at ${dockerHost}`)
      }
    })

    return dockerInstance
  } catch (error) {
    console.error('[Docker] Failed to initialize:', error)
    return null
  }
}

export const docker = initDocker()

/**
 * Check whether the Docker daemon is reachable.
 * @returns true if Docker is available
 */
export async function isDockerAvailable(): Promise<boolean> {
  if (!docker) return false
  return new Promise((resolve) => {
    docker!.ping((err) => resolve(!err))
  })
}

/** Map user-facing OS names to actual Docker image tags */
export const OS_IMAGE_MAP: Record<string, string> = {
  ubuntu: 'ubuntu:22.04',
  debian: 'debian:12',
  alpine: 'alpine:3.19',
  centos: 'centos:7',
  fedora: 'fedora:39',
  general: 'ubuntu:22.04',
}

/**
 * Create a new Docker container with specified resources
 * @param name - Container name (unique identifier)
 * @param os - Operating system image (e.g., 'ubuntu:22.04')
 * @param cpu - Number of CPU cores (as string, e.g., '2')
 * @param ram - RAM in MB (as string, e.g., '2048')
 * @param disk - Disk size in GB (as string, e.g., '20')
 * @returns Container info object or null on failure
 */
export async function createContainer(
  name: string,
  os: string,
  cpu: string = '1',
  ram: string = '1024',
  disk: string = '10'
): Promise<{ id: string; name: string; warnings?: string[] } | null> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return null
  }

  try {
    const cpuPeriod = 100000
    const cpuQuota = parseInt(cpu, 10) * cpuPeriod
    const memoryBytes = parseInt(ram, 10) * 1024 * 1024

    const container = await docker.createContainer({
      Image: os,
      name,
      HostConfig: {
        CpuPeriod: cpuPeriod,
        CpuQuota: cpuQuota,
        Memory: memoryBytes,
        MemorySwap: memoryBytes * 2,
        DiskQuota: undefined,
      },
      Cmd: ['/bin/bash', '-c', 'sleep infinity'],
      Tty: true,
      OpenStdin: true,
    })

    return {
      id: container.id,
      name: container.id.slice(0, 12),
      warnings: [],
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to create container "${name}":`, message)

    if (message.includes('Conflict') || message.includes('already in use')) {
      console.warn(`[Docker] Container name "${name}" already exists`)
    }

    return null
  }
}

/**
 * Start a stopped container
 * @param id - Container ID
 * @returns true if successful
 */
export async function startContainer(id: string): Promise<boolean> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return false
  }

  try {
    const container = docker.getContainer(id)
    await container.start()
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to start container "${id}":`, message)
    return false
  }
}

/**
 * Stop a running container gracefully (10s timeout)
 * @param id - Container ID
 * @returns true if successful
 */
export async function stopContainer(id: string): Promise<boolean> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return false
  }

  try {
    const container = docker.getContainer(id)
    await container.stop({ t: 10 })
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('is not running') || message.includes('No such container')) {
      return true
    }

    console.error(`[Docker] Failed to stop container "${id}":`, message)
    return false
  }
}

/**
 * Restart a container with a configurable delay
 * @param id - Container ID
 * @param timeout - Grace period in seconds before killing (default 5)
 * @returns true if successful
 */
export async function restartContainer(id: string, timeout: number = 5): Promise<boolean> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return false
  }

  try {
    const container = docker.getContainer(id)
    await container.restart({ t: timeout })
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to restart container "${id}":`, message)
    return false
  }
}

/**
 * Remove a container (force removes even if running)
 * @param id - Container ID
 * @returns true if successful
 */
export async function removeContainer(id: string): Promise<boolean> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return false
  }

  try {
    const container = docker.getContainer(id)
    await container.remove({ force: true, v: true })
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('No such container')) {
      return true
    }

    console.error(`[Docker] Failed to remove container "${id}":`, message)
    return false
  }
}

/**
 * Update CPU and memory limits on an existing container.
 * The container must be stopped (or recreated) for these changes to take effect.
 * @param id - Container ID
 * @param cpu - Number of CPU cores
 * @param ram - RAM in MB
 * @returns true if successful
 */
export async function updateContainerLimits(
  id: string,
  cpu: string = '1',
  ram: string = '1024'
): Promise<boolean> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return false
  }

  try {
    const container = docker.getContainer(id)
    const cpuPeriod = 100000
    const cpuQuota = parseInt(cpu, 10) * cpuPeriod
    const memoryBytes = parseInt(ram, 10) * 1024 * 1024

    await container.update({
      CpuPeriod: cpuPeriod,
      CpuQuota: cpuQuota,
      Memory: memoryBytes,
      MemorySwap: memoryBytes * 2,
    })
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to update limits for container "${id}":`, message)
    return false
  }
}

/**
 * Get container resource usage statistics
 * @param id - Container ID
 * @returns Stats object or null on failure
 */
export async function getContainerStats(id: string): Promise<{
  cpu_percent: number
  memory_usage_mb: number
  memory_limit_mb: number
  network_rx_bytes: number
  network_tx_bytes: number
  block_read_mb: number
  block_write_mb: number
} | null> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return null
  }

  try {
    const container = docker.getContainer(id)
    const stream = await container.stats({ stream: false })

    // Calculate CPU percentage
    const cpuDelta = stream.cpu_stats.cpu_usage.total_usage - stream.precpu_stats.cpu_usage.total_usage
    const systemDelta = stream.cpu_stats.system_cpu_usage - stream.precpu_stats.system_cpu_usage
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0

    // Calculate memory usage
    const memoryUsage = stream.memory_stats.usage || 0
    const memoryLimit = stream.memory_stats.limit || 1

    // Calculate network I/O
    const networks = stream.networks || {}
    let networkRx = 0
    let networkTx = 0
    for (const iface of Object.values(networks) as Array<{ rx_bytes: number; tx_bytes: number }>) {
      networkRx += iface.rx_bytes || 0
      networkTx += iface.tx_bytes || 0
    }

    // Calculate block I/O
    const blockStats = stream.blkio_stats?.io_service_bytes_recursive || []
    let blockRead = 0
    let blockWrite = 0
    for (const entry of blockStats as Array<{ op: string; value: number }>) {
      if (entry.op === 'Read') blockRead += entry.value
      if (entry.op === 'Write') blockWrite += entry.value
    }

    return {
      cpu_percent: Math.round(cpuPercent * 100) / 100,
      memory_usage_mb: Math.round((memoryUsage / (1024 * 1024)) * 100) / 100,
      memory_limit_mb: Math.round((memoryLimit / (1024 * 1024)) * 100) / 100,
      network_rx_bytes: networkRx,
      network_tx_bytes: networkTx,
      block_read_mb: Math.round((blockRead / (1024 * 1024)) * 100) / 100,
      block_write_mb: Math.round((blockWrite / (1024 * 1024)) * 100) / 100,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to get stats for container "${id}":`, message)
    return null
  }
}
