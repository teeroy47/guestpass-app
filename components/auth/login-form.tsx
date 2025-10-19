"use client"

import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { QrCode, Users, Shield, Loader2, Mail, Lock, User } from "lucide-react"

const formSchema = z
  .object({
    email: z
      .string()
      .email({ message: "Enter a valid email address" })
      .min(1, { message: "Email is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(64, { message: "Password must be 64 characters or fewer" }),
    confirmPassword: z.string().optional(),
    displayName: z.string().optional(),
  })

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const { signInWithPassword, signUpWithPassword, refreshUser, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "signup">("login")

  const schema = useMemo(
    () =>
      formSchema.superRefine((data, ctx) => {
        if (mode === "signup") {
          // Validate display name
          if (!data.displayName || data.displayName.trim().length === 0) {
            ctx.addIssue({
              path: ["displayName"],
              code: z.ZodIssueCode.custom,
              message: "Please enter your name",
            })
          } else if (data.displayName.trim().length < 2) {
            ctx.addIssue({
              path: ["displayName"],
              code: z.ZodIssueCode.custom,
              message: "Name must be at least 2 characters",
            })
          } else if (data.displayName.trim().length > 100) {
            ctx.addIssue({
              path: ["displayName"],
              code: z.ZodIssueCode.custom,
              message: "Name must be 100 characters or fewer",
            })
          }
          
          // Validate password confirmation
          if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
            ctx.addIssue({
              path: ["confirmPassword"],
              code: z.ZodIssueCode.custom,
              message: "Confirm your password",
            })
          } else if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              path: ["confirmPassword"],
              code: z.ZodIssueCode.custom,
              message: "Passwords do not match",
            })
          }
        }
      }),
    [mode],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "", displayName: "" },
  })

  const toggleMode = useCallback(() => {
    setRequestError(null)
    setSuccessMessage(null)
    setMode((prev) => (prev === "login" ? "signup" : "login"))
    form.reset({
      email: form.getValues("email"),
      password: "",
      confirmPassword: "",
      displayName: "",
    })
  }, [form])

  const handleSubmit = useMemo(
    () =>
      form.handleSubmit(async ({ email, password, displayName }) => {
        setRequestError(null)
        setSuccessMessage(null)
        setIsSubmitting(true)

        try {
          if (mode === "login") {
            const result = await signInWithPassword(email, password)
            if (result.error) {
              setRequestError(result.error)
              toast({
                title: "Sign-in failed",
                description: result.error,
                variant: "destructive",
              })
              return
            }
            setSuccessMessage("Signed in successfully. Redirecting...")
            toast({
              title: "Welcome back",
              description: "Redirecting you to your dashboard",
            })
            await refreshUser()
            form.reset({ email: "", password: "", confirmPassword: "", displayName: "" })
            
            // Redirect to dashboard after successful login
            setTimeout(() => {
              navigate("/dashboard")
            }, 500)
            return
          }

          const result = await signUpWithPassword(email, password, displayName)
          if (result.error) {
            setRequestError(result.error)
            toast({
              title: "Sign-up failed",
              description: result.error,
              variant: "destructive",
            })
            return
          }

          setSuccessMessage("Account created! Please check your email to confirm your account. After confirmation, you'll be redirected to your dashboard.")
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link. Click it to activate your account.",
            duration: 8000,
          })
          form.reset({
            email,
            password: "",
            confirmPassword: "",
            displayName: "",
          })
        } catch (error) {
          console.error("Password auth failed", error)
          setRequestError("Something went wrong. Please try again.")
        } finally {
          setIsSubmitting(false)
        }
      }),
    [form, mode, signInWithPassword, signUpWithPassword, refreshUser, navigate, toast],
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">guestPass</h1>
          </div>
          <p className="text-muted-foreground text-balance">
            Professional event guest check-in system with QR code scanning
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">
              {mode === "login" ? "Sign in to continue" : "Create your GuestPass account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Use your email and password to access your GuestPass account securely."
                : "Create a new GuestPass account to start managing your events."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="pl-9"
                            autoComplete="email"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === "signup" && (
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="text"
                              placeholder="John Doe"
                              className="pl-9"
                              autoComplete="name"
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder={mode === "signup" ? "Create a strong password" : "Your password"}
                            className="pl-9"
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            disabled={isSubmitting}
                            minLength={8}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === "signup" ? (
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="Re-enter your password"
                              className="pl-9"
                              autoComplete="new-password"
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {requestError && (
                  <p className="text-destructive text-sm" role="alert">
                    {requestError}
                  </p>
                )}

                {successMessage ? (
                  <div className="space-y-3 rounded-lg border border-primary/50 bg-primary/10 p-4 text-sm text-primary">
                    <p>{successMessage}</p>
                    {mode === "signup" && (
                      <div className="pt-2 border-t border-primary/20">
                        <p className="text-xs text-primary/80 mb-2">Didn't receive the email?</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/resend-confirmation?email=${encodeURIComponent(form.getValues("email"))}`)}
                          className="text-xs font-medium text-primary hover:underline focus:outline-none"
                        >
                          Resend confirmation email
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>

                {mode === "login" && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                <div className="flex flex-col space-y-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    {mode === "login"
                      ? "Don't have an account yet?"
                      : "Already joined GuestPass?"}
                  </p>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {mode === "login" ? "Create your GuestPass account" : "Sign in with existing credentials"}
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center space-y-2">
            <Users className="h-5 w-5" />
            <span>Admin & Usher Roles</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Shield className="h-5 w-5" />
            <span>Secure Check-ins</span>
          </div>
        </div>
      </div>
    </div>
  )
}
