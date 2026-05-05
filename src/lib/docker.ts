import Docker from 'dockerode'

/**
 * Docker Engine client using dockerode.
 * Connects via DOCKER_HOST env var or defaults to /var/run/docker.sock.
 * Includes resource limits (CPU, RAM, Disk, PIDs), OOM detection,
 * and real disk usage monitoring.
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
 * Create a new Docker container with specified resource limits.
 * Includes CPU, Memory, Disk quota (via StorageOpt), and PidsLimit.
 *
 * @param name - Container name (unique identifier)
 * @param os - Operating system image (e.g., 'ubuntu:22.04')
 * @param cpu - Number of CPU cores (as string, e.g., '2')
 * @param ram - RAM in MB (as string, e.g., '2048')
 * @param disk - Disk size in GB (as string, e.g., '20')
 * @param maxPids - Maximum number of processes (fork bomb protection, default 100)
 * @returns Container info object or null on failure
 */
export async function createContainer(
  name: string,
  os: string,
  cpu: string = '1',
  ram: string = '1024',
  disk: string = '10',
  maxPids: number = 100
): Promise<{ id: string; name: string; warnings?: string[] } | null> {
  if (!docker) {
    console.error('[Docker] Docker client not initialized')
    return null
  }

  try {
    const cpuPeriod = 100000
    const cpuQuota = parseInt(cpu, 10) * cpuPeriod
    const memoryBytes = parseInt(ram, 10) * 1024 * 1024
    const diskBytes = parseInt(disk, 10) * 1024 * 1024 * 1024

    const hostConfig: Docker.ContainerCreateOptions['HostConfig'] = {
      CpuPeriod: cpuPeriod,
      CpuQuota: cpuQuota,
      Memory: memoryBytes,
      MemorySwap: memoryBytes * 2,
      PidsLimit: maxPids,
      // Disk quota via storage-opt (requires overlay2 or similar driver)
      StorageOpt: {
        'size': String(diskBytes),
      },
      // Prevent privilege escalation
      SecurityOpt: ['no-new-privileges'],
      // Read-only root filesystem with tmpfs for writable areas
      ReadonlyRootfs: false,
      // Network bandwidth rate limiting (100 Mbps = 12500000 bytes/sec)
      // Uncomment to enable:
      // BlkioWeight: 300,
    }

    const container = await docker.createContainer({
      Image: os,
      name,
      HostConfig: hostConfig,
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

    // If storage-opt is not supported, retry without it
    if (message.includes('StorageOpt') || message.includes('storage-opt')) {
      console.warn(`[Docker] StorageOpt not supported, retrying without disk quota`)
      return createContainerNoQuota(name, os, cpu, ram, maxPids)
    }

    return null
  }
}

/**
 * Fallback: Create container without disk quota (for unsupported storage drivers).
 */
async function createContainerNoQuota(
  name: string,
  os: string,
  cpu: string = '1',
  ram: string = '1024',
  maxPids: number = 100
): Promise<{ id: string; name: string; warnings?: string[] } | null> {
  if (!docker) return null

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
        PidsLimit: maxPids,
        SecurityOpt: ['no-new-privileges'],
      },
      Cmd: ['/bin/bash', '-c', 'sleep infinity'],
      Tty: true,
      OpenStdin: true,
    })

    return {
      id: container.id,
      name: container.id.slice(0, 12),
      warnings: ['Disk quota not supported on this storage driver. Disk limits will not be enforced.'],
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Docker] Failed to create container (no-quota) "${name}":`, message)
    return null
  }
}

/**
 * Start a stopped container
 */
export async function startContainer(id: string): Promise<boolean> {
  if (!docker) return false

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
 */
export async function stopContainer(id: string): Promise<boolean> {
  if (!docker) return false

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
 */
export async function restartContainer(id: string, timeout: number = 5): Promise<boolean> {
  if (!docker) return false

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
 */
export async function removeContainer(id: string): Promise<boolean> {
  if (!docker) return false

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
 */
export async function updateContainerLimits(
  id: string,
  cpu: string = '1',
  ram: string = '1024'
): Promise<boolean> {
  if (!docker) return false

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
 * Get container resource usage statistics.
 * Returns CPU%, memory usage, network I/O, and block I/O.
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
  if (!docker) return null

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

/**
 * Get actual disk usage of a container by executing `df` inside it.
 * Returns used MB and total MB, or null if unavailable.
 */
export async function getContainerDiskUsage(id: string): Promise<{
  used_mb: number
  total_mb: number
  percent: number
} | null> {
  if (!docker) return null

  try {
    const container = docker.getContainer(id)

    // Execute df -h / to get real filesystem usage
    const exec = await container.exec({
      Cmd: ['/bin/sh', '-c', "df -k / | tail -1 | awk '{print $3, $2, $5}'"],
      AttachStdout: true,
      AttachStderr: true,
    })

    const stream = await exec.start({ hijack: true, stdin: false })

    return new Promise((resolve) => {
      let output = ''
      const chunks: Buffer[] = []

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      stream.on('end', () => {
        output = Buffer.concat(chunks).toString('utf8').trim()

        // Parse: "used_kb total_kb use_percent%"
        const parts = output.split(/\s+/)
        if (parts.length >= 3) {
          const usedKb = parseInt(parts[0], 10) || 0
          const totalKb = parseInt(parts[1], 10) || 1
          const percentStr = parts[2].replace('%', '')
          const percent = parseInt(percentStr, 10) || 0

          resolve({
            used_mb: Math.round((usedKb / 1024) * 100) / 100,
            total_mb: Math.round((totalKb / 1024) * 100) / 100,
            percent,
          })
        } else {
          resolve(null)
        }
      })

      stream.on('error', () => {
        resolve(null)
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(null)
      }, 5000)
    })
  } catch (error: unknown) {
    // Container might be stopped — that's fine
    return null
  }
}

/**
 * Check if a container was killed by OOM (Out of Memory).
 * Returns true if OOMKilled flag is set.
 */
export async function isContainerOOMKilled(id: string): Promise<boolean> {
  if (!docker) return false

  try {
    const container = docker.getContainer(id)
    const inspect = await container.inspect()
    return inspect.State?.OOMKilled === true
  } catch {
    return false
  }
}

/**
 * Get container state information including OOM status.
 */
export async function getContainerState(id: string): Promise<{
  status: string
  running: boolean
  oomKilled: boolean
  exitCode: number
  startedAt: string | null
  finishedAt: string | null
} | null> {
  if (!docker) return null

  try {
    const container = docker.getContainer(id)
    const inspect = await container.inspect()

    return {
      status: inspect.State?.Status || 'unknown',
      running: inspect.State?.Running || false,
      oomKilled: inspect.State?.OOMKilled || false,
      exitCode: inspect.State?.ExitCode || 0,
      startedAt: inspect.State?.StartedAt || null,
      finishedAt: inspect.State?.FinishedAt || null,
    }
  } catch {
    return null
  }
}
