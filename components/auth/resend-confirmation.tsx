"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
})

type FormValues = z.infer<typeof formSchema>

// Rate limiting: Store last resend time in localStorage
const RATE_LIMIT_KEY = "resend_confirmation_last_sent"
const RATE_LIMIT_DURATION = 60000 // 60 seconds

export function ResendConfirmation() {
  const { resendConfirmationEmail } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get("email") || "",
    },
  })

  // Check rate limit on mount and set up timer
  useEffect(() => {
    const checkRateLimit = () => {
      const lastSentStr = localStorage.getItem(RATE_LIMIT_KEY)
      if (lastSentStr) {
        const lastSent = parseInt(lastSentStr, 10)
        const now = Date.now()
        const timeSinceLastSend = now - lastSent
        
        if (timeSinceLastSend < RATE_LIMIT_DURATION) {
          const remaining = Math.ceil((RATE_LIMIT_DURATION - timeSinceLastSend) / 1000)
          setRemainingTime(remaining)
        } else {
          setRemainingTime(0)
        }
      }
    }

    checkRateLimit()

    // Update remaining time every second
    const interval = setInterval(() => {
      checkRateLimit()
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const onSubmit = async (values: FormValues) => {
    // Check rate limit
    const lastSentStr = localStorage.getItem(RATE_LIMIT_KEY)
    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10)
      const now = Date.now()
      const timeSinceLastSend = now - lastSent
      
      if (timeSinceLastSend < RATE_LIMIT_DURATION) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_DURATION - timeSinceLastSend) / 1000)
        toast({
          title: "Please wait",
          description: `You can resend the confirmation email in ${remainingSeconds} seconds.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      const result = await resendConfirmationEmail(values.email)

      if (result.error) {
        toast({
          title: "Failed to resend email",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Store the current time for rate limiting
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString())
      setRemainingTime(60)

      setSuccess(true)
      toast({
        title: "Email sent!",
        description: "Check your inbox for the confirmation link.",
      })
    } catch (error) {
      console.error("Resend confirmation failed", error)
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a new confirmation link to <strong>{form.getValues("email")}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-2">📧 <strong>What to do next:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check your email inbox</li>
                <li>Click the confirmation link</li>
                <li>You'll be redirected to your dashboard</li>
              </ol>
            </div>

            {remainingTime > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                You can resend the email again in <strong>{remainingTime}s</strong>
              </p>
            )}

            <div className="flex flex-col gap-2">
              {remainingTime === 0 && (
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="w-full"
                >
                  Resend again
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Resend confirmation email</CardTitle>
          <CardDescription>
            Didn't receive the confirmation email? Enter your email address and we'll send you a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {remainingTime > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                  ⏱️ Please wait <strong>{remainingTime} seconds</strong> before resending
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || remainingTime > 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send confirmation email"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}