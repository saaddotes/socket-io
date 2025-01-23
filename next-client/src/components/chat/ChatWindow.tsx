"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
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
import toast from "react-hot-toast";

type MessageType = {
  _id: string;
  chatRoomId: string;
  senderId: string;
  message: string;
  status: ["sent", "delivered", "read"];
  time: Date;
};

export function ChatWindow({
  receiverId,
  setSelectedChat,
}: {
  receiverId: string | null;
  setSelectedChat: (id: string | null) => void;
}) {
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user || !socket) {
      toast.error("User or Socket Id nor found");
      return;
    }

    socket?.emit(
      "start-chat",
      { senderId: user._id, receiverId },
      (response: {
        success: boolean;
        message: string;
        chatRoom: string;
        prevMessages: MessageType[];
      }) => {
        if (response.success) {
          toast.success(response.message);
          setMessages(response.prevMessages);
          console.log("Prev => ", response.prevMessages);
        } else {
          toast.error(response.message);
          console.log(response);
        }
      }
    );

    socket?.on("new-message", (data: { message: MessageType }) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });

    socket?.on("update-status", ({ prevMessages }) => {
      setMessages([...prevMessages]);
      console.log("Updated Data => ", prevMessages);
    });

    return () => {
      socket?.off("new-message");
    };
  }, [user, receiverId, socket]);

  useEffect(() => {
    console.log(
      "Scroll",
      scrollAreaRef.current,
      messages,
      scrollAreaRef?.current?.scrollHeight
    );
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?._id) return;

    if (!receiverId) {
      console.error("Chat ID is null");
      return;
    }

    socket?.emit(
      "send-message",
      { senderId: user._id, receiverId, messageText: newMessage },
      (response: {
        success: boolean;
        message: string;
        newMessage: MessageType;
      }) => {
        if (response.success) {
          toast.success(response.message);
          const tempArr = [...messages];
          tempArr.push(response.newMessage);
          setMessages([...tempArr]);
        } else {
          toast.error(response.message);
        }
      }
    );

    setNewMessage("");
  };

  if (!receiverId) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <Button variant={"outline"} onClick={() => setSelectedChat(null)}>
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m15 19-7-7 7-7"
              />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold">Chat</h2>
        </div>
        <div className="flex items-center gap-3">
          <AddMember />
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
        </div>
      </div>
      <div ref={scrollAreaRef} className="h-full p-4 overflow-auto max-h-full">
        <AnimatePresence>
          {messages?.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.senderId === user?._id ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`flex ${
                  message.senderId === user?._id
                    ? "flex-row-reverse"
                    : "flex-row"
                } items-end`}
              >
                <div
                  className={`mx-2 p-3 rounded-lg relative ${
                    message.senderId === user?._id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {message.message}
                  {message.senderId === user?._id && (
                    <span
                      className={`absolute rounded-full bg-slate-500 text-white bottom-[-5px] px-1 right-[-5px] text-[8px]`}
                    >
                      {message.status}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 mr-2"
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
