"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Shield, ShieldCheck, Loader2, Users, AlertCircle } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

interface User {
  id: string
  email: string
  full_name: string
  display_name: string | null
  role: "admin" | "usher"
  created_at: string
}

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    userId: string
    userEmail: string
    newRole: "admin" | "usher"
  }>({
    open: false,
    userId: "",
    userEmail: "",
    newRole: "usher"
  })

  const supabase = createBrowserSupabaseClient()
  const isSuperAdmin = currentUser?.email?.toLowerCase() === "chiunyet@africau.edu"

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, display_name, role, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading users:", error)
        toast({
          title: "Error loading users",
          description: error.message,
          variant: "destructive"
        })
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Unexpected error loading users:", error)
      toast({
        title: "Error loading users",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: "admin" | "usher") => {
    try {
      setUpdatingUserId(userId)

      // Call API to update role (Express server on port 4000)
      const response = await fetch("http://localhost:4000/api/admin/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          userId, 
          role: newRole,
          requestingUserEmail: currentUser?.email 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user role")
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      )

      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole}`,
      })
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setUpdatingUserId(null)
      setConfirmDialog({ open: false, userId: "", userEmail: "", newRole: "usher" })
    }
  }

  const openConfirmDialog = (userId: string, userEmail: string, newRole: "admin" | "usher") => {
    setConfirmDialog({
      open: true,
      userId,
      userEmail,
      newRole
    })
  }

  if (!isSuperAdmin) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Only the super administrator (chiunyet@africau.edu) can manage user roles.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground">
          Manage user roles and permissions. Only you can promote users to admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
          <CardDescription>
            View and manage user roles. Admins have full access, ushers can only scan QR codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.id === currentUser?.id
                    const isSuperAdminUser = user.email.toLowerCase() === "chiunyet@africau.edu"
                    const isUpdating = updatingUserId === user.id

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.display_name || user.full_name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? (
                              <>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Usher
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSuperAdminUser ? (
                            <span className="text-xs text-muted-foreground">
                              Super Admin
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant={user.role === "admin" ? "outline" : "default"}
                              disabled={isUpdating}
                              onClick={() => {
                                const newRole = user.role === "admin" ? "usher" : "admin"
                                openConfirmDialog(user.id, user.email, newRole)
                              }}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Updating...
                                </>
                              ) : user.role === "admin" ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Demote to Usher
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Promote to Admin
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Role Permissions</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Admin:</strong> Full access - create/edit events, upload guests, view analytics, manage users</p>
                <p><strong>Usher:</strong> Limited access - view events, scan QR codes, check in guests</p>
                <p className="pt-2 text-xs">
                  <strong>Note:</strong> Only you (chiunyet@africau.edu) can manage user roles. This ensures security and proper access control.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the role of <strong>{confirmDialog.userEmail}</strong> to{" "}
              <strong>{confirmDialog.newRole}</strong>?
              <br /><br />
              {confirmDialog.newRole === "admin" ? (
                <span className="text-foreground">
                  This user will gain full administrative access including the ability to create/edit events, 
                  upload guest lists, and view analytics.
                </span>
              ) : (
                <span className="text-foreground">
                  This user will lose administrative privileges and will only be able to scan QR codes 
                  and check in guests.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRoleChange(confirmDialog.userId, confirmDialog.newRole)}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}