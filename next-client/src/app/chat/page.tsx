"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { UserSettings } from "@/components/settings/UserSettings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/authContext";

export default function ChatPage() {
  // const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const router = useRouter();

  // const [receiverId, setReceiverId] = useState("");
  const { user, socket } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [router, user, socket]);

  if (!user) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* <input
        type="text"
        placeholder="receiverId "
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
      />
      <button
        onClick={() => {
          socket.emit("message-send", {
            senderId: "12345",
            receiverId: receiverId,
            message: "Hello World",
            status: "sent",
          });
        }}
      >
        Send
      </button> */}
      <div className={`${selectedChat ? "hidden md:block" : "w-full md:w-64"}`}>
        <ChatSidebar onSelectChat={setSelectedChat} />
      </div>
      <div
        className={`flex-1 flex flex-col ${
          !selectedChat ? "hidden md:block" : ""
        }`}
      >
        {selectedChat ? (
          <ChatWindow
            receiverId={selectedChat}
            setSelectedChat={setSelectedChat}
          />
        ) : (
          <>
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">Simple Chat </h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Settings</Button>
                </DialogTrigger>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                  </DialogHeader>
                  <UserSettings />
                </DialogContent>
              </Dialog>
            </header>
            <div className="flex-1 h-[60vh] flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          </>
        )}
      </div>
    </div>
  );
}
