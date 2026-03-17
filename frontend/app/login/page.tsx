"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { loginLecturer, loginStudent, type Role } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const form = useForm<{ role: Role; email: string; password: string }>({
    defaultValues: { role: "student", email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: { role: Role; email: string; password: string }) => {
      return values.role === "student"
        ? loginStudent(values.email, values.password)
        : loginLecturer(values.email, values.password);
    },
    onSuccess: (res, values) => {
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("role", values.role);
        window.location.href = values.role === "student" ? "/dashboard" : "/lecturer/dashboard";
      }
    },
  });

  const errorMessage =
    (loginMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    (loginMutation.error ? "Login failed" : "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Biometric Attendance System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="role"
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  rules={{ required: "Password is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-[hsl(var(--muted-foreground))] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
