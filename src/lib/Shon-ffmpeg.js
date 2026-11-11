import { cpus } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const CONCURRENCY = Math.min(4, Math.max(1, cpus().length - 1))
const TIMEOUT = 60_000
const MAX_QUEUE = 100

let queue = []
let running = 0

function validateArguments(args) {
  if (!Array.isArray(args) || args.length === 0 || args.length > 128) {
    throw new TypeError('FFmpeg memerlukan daftar argumen yang valid.')
  }
  if (args.some((arg) => typeof arg !== 'string' || arg.length > 4096 || arg.includes('\u0000'))) {
    throw new TypeError('Argumen FFmpeg harus berupa string yang aman.')
  }
  return args
}

function runNext() {
  while (running < CONCURRENCY && queue.length > 0) {
    const task = queue.shift()
    running++
    task.execute()
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        running--
        runNext()
      })
  }
}

function queueFFmpeg(args, { binary = 'ffmpeg', timeout = TIMEOUT } = {}) {
  let safeArgs
  try {
    safeArgs = validateArguments(args)
    if (typeof binary !== 'string' || !binary || binary.includes('\u0000')) throw new TypeError('Executable FFmpeg tidak valid.')
    if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 10 * 60_000) throw new RangeError('Batas waktu FFmpeg tidak valid.')
  } catch (error) {
    return Promise.reject(error)
  }

  if (queue.length >= MAX_QUEUE) return Promise.reject(new Error('Antrean FFmpeg penuh. Coba lagi nanti.'))

  return new Promise((resolve, reject) => {
    const execute = () => execFileAsync(binary, safeArgs, {
      timeout,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
      killSignal: 'SIGKILL',
    })
    queue.push({ execute, resolve, reject })
    runNext()
  })
}

function getQueueStats() {
  return { running, queued: queue.length, concurrency: CONCURRENCY }
}

export { queueFFmpeg, getQueueStats, CONCURRENCY, validateArguments }
