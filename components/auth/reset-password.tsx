"use client"

import { useState, useEffect } from "react"
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
import { QrCode, Lock, Loader2 } from "lucide-react"

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(64, { message: "Password must be 64 characters or fewer" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

export function ResetPassword() {
  const { updatePassword, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')

    if (type === 'recovery' && accessToken) {
      setIsValidToken(true)
    } else if (!user) {
      // No valid token and no user session
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset link",
        variant: "destructive",
      })
      setTimeout(() => navigate("/forgot-password"), 2000)
    } else {
      // User is already logged in, allow password change
      setIsValidToken(true)
    }
  }, [user, navigate, toast])

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    setRequestError(null)
    setIsSubmitting(true)

    try {
      const result = await updatePassword(password)
      if (result.error) {
        setRequestError(result.error)
        toast({
          title: "Password update failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      })
      
      // Redirect to dashboard after successful password reset
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Password update failed", error)
      setRequestError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">guestPass</h1>
          </div>
          <p className="text-muted-foreground text-balance">
            Create a new password
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's at least 8 characters long.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Create a strong password"
                            className="pl-9"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            minLength={8}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
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

                {requestError && (
                  <p className="text-destructive text-sm" role="alert">
                    {requestError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}