"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Save } from "lucide-react";
import { getLecturerProfile, updateLecturerProfile } from "@/lib/api/lecturer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function LecturerProfilePage() {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const profileQuery = useQuery({
    queryKey: ["lecturer", "profile"],
    queryFn: getLecturerProfile,
  });

  useEffect(() => {
    const lecturer = profileQuery.data?.lecturer;
    if (lecturer) {
      setFullName(lecturer.full_name);
      setEmail(lecturer.email);
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => updateLecturerProfile({ full_name: fullName, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecturer", "profile"] });
    },
  });

  const lecturer = profileQuery.data?.lecturer;

  return (
    <div className="space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-2">Manage your profile information</p>
      </div>

      <div className="max-w-2xl">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
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
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staff">Staff ID</Label>
                  <Input id="staff" value={lecturer?.staff_id || ""} disabled />
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
