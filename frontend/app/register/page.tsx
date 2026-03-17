"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { registerLecturer, registerStudent, type Role } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterPage() {
  const form = useForm<{
    role: Role;
    matric_number?: string;
    staff_id?: string;
    full_name: string;
    email: string;
    password: string;
  }>({
    defaultValues: {
      role: "student",
      matric_number: "",
      staff_id: "",
      full_name: "",
      email: "",
      password: "",
    },
  });

  const role = form.watch("role");

  const registerMutation = useMutation({
    mutationFn: async (values: {
      role: Role;
      matric_number?: string;
      staff_id?: string;
      full_name: string;
      email: string;
      password: string;
    }) => {
      return values.role === "student"
        ? registerStudent({
            matric_number: values.matric_number || "",
            full_name: values.full_name,
            email: values.email,
            password: values.password,
          })
        : registerLecturer({
            staff_id: values.staff_id || "",
            full_name: values.full_name,
            email: values.email,
            password: values.password,
          });
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
    (registerMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    (registerMutation.error ? "Registration failed" : "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create account</CardTitle>
            <CardDescription>Biometric Attendance System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Registration failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
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

                {role === "student" ? (
                  <FormField
                    control={form.control}
                    name="matric_number"
                    rules={{ required: "Matric number is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matric number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 20/ABC/001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="staff_id"
                    rules={{ required: "Staff ID is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. LEC001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="full_name"
                  rules={{ required: "Full name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" placeholder="John Doe" {...field} />
                      </FormControl>
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
                  rules={{
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
                Sign in
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
