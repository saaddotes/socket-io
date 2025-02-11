"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { AddMember } from "./AddMember";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserSettings } from "../settings/UserSettings";
import { useAuth } from "@/context/authContext";
import FriendRequests from "./FriendsReqs";

export function ChatSidebar({
  onSelectChat,
}: {
  onSelectChat: (id: string) => void;
}) {
  const { user } = useAuth();

  return (
    <div className="w-full md:w-64 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4">
        <div className="flex flex-col space-y-2 mb-2">
          <FriendRequests />
          <AddMember />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {user && user.friends.length > 0 ? (
          user.friends.map((friend, index) => (
            <motion.div
              key={friend._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="px-2 mb-2"
            >
              <Button
                variant="secondary"
                className="w-full justify-between h-16 rounded-lg"
                onClick={() => onSelectChat(friend._id)}
              >
                <div className="text-left">{friend.name}</div>
              </Button>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500">No chats found.</div>
        )}
      </ScrollArea>
      <div className="px-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mb-5">
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>User Settings</DialogTitle>
            </DialogHeader>
            <UserSettings />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
