"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useAuth } from "@/context/authContext";

export function AddMember() {
  const [memberEmail, setmemberEmail] = useState("");
  const { user, socket } = useAuth();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add a member.");
      return;
    }

    socket?.emit(
      "add-friend",
      { senderId: user._id, receiverEmail: memberEmail },
      (response: { success: boolean; message: string }) => {
        if (response.success) {
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      }
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <Label htmlFor="memberEmail">Member Email</Label>
            <Input
              id="memberEmail"
              value={memberEmail}
              onChange={(e) => setmemberEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Add Member</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
