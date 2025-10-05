const PUBLIC_SUPABASE_URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"] as const
const SERVER_SUPABASE_URL_KEYS = ["SUPABASE_URL", ...PUBLIC_SUPABASE_URL_KEYS] as const
const PUBLIC_SUPABASE_ANON_KEYS = ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"] as const
const SERVICE_ROLE_KEYS = ["SUPABASE_SERVICE_ROLE_KEY"] as const

type EnvValue = string | undefined

type ResolveOptions = {
  required?: boolean
  errorMessage?: string
  fallback?: string
}

function isValuePresent(value: EnvValue): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function readFromProcessEnv(key: string): EnvValue {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return undefined
  }

  return process.env[key]
}

function readFromImportMetaEnv(key: string): EnvValue {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    return env?.[key]
  } catch {
    return undefined
  }
}

export function readEnvironmentVariable(key: string): EnvValue {
  const fromProcess = readFromProcessEnv(key)
  if (isValuePresent(fromProcess)) {
    return fromProcess
  }

  const fromImportMeta = readFromImportMetaEnv(key)
  if (isValuePresent(fromImportMeta)) {
    return fromImportMeta
  }

  return undefined
}

export function resolveEnvironmentVariable(keys: readonly string[], options: ResolveOptions = {}): string | undefined {
  for (const key of keys) {
    const value = readEnvironmentVariable(key)
    if (isValuePresent(value)) {
      return value
    }
  }

  if (options.fallback !== undefined) {
    return options.fallback
  }

  if (options.required) {
    throw new Error(options.errorMessage ?? `Missing environment variable: ${keys.join(" or ")}`)
  }

  return undefined
}

export function getSupabaseBrowserConfig() {
  const supabaseUrl = resolveEnvironmentVariable(PUBLIC_SUPABASE_URL_KEYS, {
    required: true,
    errorMessage: "Missing NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL environment variable",
  })

  const supabaseAnonKey = resolveEnvironmentVariable(PUBLIC_SUPABASE_ANON_KEYS, {
    required: true,
    errorMessage: "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY environment variable",
  })

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseServerUrl() {
  return resolveEnvironmentVariable(SERVER_SUPABASE_URL_KEYS, {
    required: true,
    errorMessage: "Missing SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or VITE_SUPABASE_URL environment variable",
  })
}

export function getSupabaseAnonKey() {
  return resolveEnvironmentVariable(PUBLIC_SUPABASE_ANON_KEYS, {
    required: true,
    errorMessage: "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY environment variable",
  })
}

export function getSupabaseServiceRoleKey() {
  return resolveEnvironmentVariable(SERVICE_ROLE_KEYS, {
    required: true,
    errorMessage: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable",
  })
}