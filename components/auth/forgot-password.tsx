"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { QrCode, Mail, Loader2, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Enter a valid email address" })
    .min(1, { message: "Email is required" }),
})

type FormValues = z.infer<typeof formSchema>

export function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  const handleSubmit = form.handleSubmit(async ({ email }) => {
    setRequestError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const result = await resetPassword(email)
      if (result.error) {
        setRequestError(result.error)
        toast({
          title: "Request failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setSuccessMessage("Password reset email sent! Check your inbox for instructions.")
      toast({
        title: "Email sent",
        description: "Check your email for password reset instructions",
        duration: 8000,
      })
      form.reset()
    } catch (error) {
      console.error("Password reset failed", error)
      setRequestError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">guestPass</h1>
          </div>
          <p className="text-muted-foreground text-balance">
            Reset your password
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
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

                {requestError && (
                  <p className="text-destructive text-sm" role="alert">
                    {requestError}
                  </p>
                )}

                {successMessage && (
                  <div className="space-y-2 rounded-lg border border-primary/50 bg-primary/10 p-4 text-sm text-primary">
                    <p>{successMessage}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}