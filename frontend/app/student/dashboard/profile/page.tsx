"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Save, Fingerprint } from "lucide-react";
import {
  getStudentProfile,
  getStudentStats,
  updateStudentProfile,
  registerBiometric,
} from "@/lib/api/student";
import { captureFingerprint } from "@/lib/biometric-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type StudentProfile = {
  id: number;
  matric_number: string;
  full_name: string;
  email: string;
};

function ProfileForm({ student }: { student: StudentProfile }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(student.full_name);
  const [email, setEmail] = useState(student.email);

  const updateMutation = useMutation({
    mutationFn: () => updateStudentProfile({ full_name: fullName, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "profile"] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="matric">Matric Number</Label>
        <Input id="matric" value={student.matric_number} disabled />
      </div>
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>
      <Button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending || !fullName || !email}
        className="w-full bg-slate-900 hover:bg-slate-800"
      >
        <Save className="mr-2 h-4 w-4" />
        {updateMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
      {updateMutation.isSuccess && (
        <p className="text-sm text-green-600">Profile updated successfully</p>
      )}
      {updateMutation.isError && (
        <p className="text-sm text-red-600">Failed to update profile</p>
      )}
    </div>
  );
}

export default function StudentProfilePage() {
  const qc = useQueryClient();
  const [biometricStatus, setBiometricStatus] = useState("");

  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: getStudentProfile,
  });

  const statsQuery = useQuery({
    queryKey: ["student", "stats"],
    queryFn: getStudentStats,
  });

  const biometricMutation = useMutation({
    mutationFn: (template: string) => registerBiometric(template),
    onSuccess: () => {
      setBiometricStatus("Fingerprint saved successfully.");
      qc.invalidateQueries({ queryKey: ["student", "stats"] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setBiometricStatus(err?.response?.data?.error ?? "Failed to save fingerprint");
    },
  });

  async function handleAddFingerprint() {
    setBiometricStatus("Place finger on scanner...");
    try {
      const result = await captureFingerprint();
      setBiometricStatus("Saving fingerprint...");
      await biometricMutation.mutateAsync(result.template);
    } catch {
      setBiometricStatus("Scanner error — try again");
    }
  }

  const student = profileQuery.data?.student;
  const hasFingerprint = Boolean(statsQuery.data?.stats?.biometricRegistered);

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-2 text-slate-600">Manage your account and fingerprint</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : student ? (
              <ProfileForm key={student.id} student={student} />
            ) : (
              <p className="text-sm text-red-600">Failed to load profile</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Fingerprint className="h-5 w-5" />
                Fingerprint
              </CardTitle>
              {statsQuery.isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : hasFingerprint ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600">Registered</Badge>
              ) : (
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Not registered</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {hasFingerprint
                ? "Your fingerprint is on file. You can scan again to update it before a live session."
                : "Add your fingerprint so lecturers can mark your attendance when you scan during class."}
            </p>
            <Button
              onClick={handleAddFingerprint}
              disabled={biometricMutation.isPending}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              {biometricMutation.isPending
                ? "Scanning..."
                : hasFingerprint
                  ? "Update Fingerprint"
                  : "Add Fingerprint"}
            </Button>
            {biometricStatus && (
              <p
                className={`text-sm ${
                  biometricStatus.includes("successfully")
                    ? "text-green-600"
                    : biometricStatus.includes("error") || biometricStatus.startsWith("✗")
                      ? "text-red-600"
                      : "text-slate-600"
                }`}
              >
                {biometricStatus}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
