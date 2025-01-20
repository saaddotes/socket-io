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
import axios from "axios";

export function AddMember() {
  const [memberUid, setMemberUid] = useState("");
  const { user } = useAuth();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberUid.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add a member.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/auth/add-friend", {
        senderEmail: user.email,
        receiverEmail: memberUid,
      });

      const data = await res.data;

      if (data.success) {
        toast.success("Friend request sent successfully!");
        console.log("Friend request response: ", data);
        setMemberUid("");
      } else {
        toast.error(data.message || "Failed to send friend request.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data.message || "Failed to send friend request."
        );
      } else {
        toast.error("Unexpected error occurred. Please try again.");
        console.error("Unexpected error: ", error);
      }
    }
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
            <Label htmlFor="memberUid">Member Email</Label>
            <Input
              id="memberUid"
              value={memberUid}
              onChange={(e) => setMemberUid(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Add Member</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
