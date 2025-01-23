"use client";

import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

export type User = {
  name: string;
  email: string;
  password?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  _id: string;
  friends: Friend[];
  friendRequests: Friend[];
  socketId?: string;
};

export type Friend = {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize the socket connection
  const initializeSocket = useCallback((userId: string) => {
    if (!socketRef.current) {
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        query: { userId },
      });

      socket.on("connect", () => {
        toast.success(`Socket connected: ${socket.id}`);
      });

      socket.on("trigger-requests", ({ data }) => {
        setUser(data);
      });

      socket.on("disconnect", () => {
        toast.error("Socket disconnected.");
      });

      socketRef.current = socket;
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const storedUser = sessionStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        initializeSocket(parsedUser._id);
      } catch (error) {
        console.error("Failed to parse user data from sessionStorage:", error);
      }
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [initializeSocket]);

  console.log("user", user);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`,
          { name, email, password }
        );
        const data = res.data;

        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);
        initializeSocket(data.data._id);
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error?.response?.data?.message || "Signup failed."
          : "Unexpected error occurred.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [initializeSocket]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
          { email, password }
        );
        const data = res.data;

        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);
        initializeSocket(data.data._id);
      } catch (error) {
        console.log(error);
        const errorMessage = axios.isAxiosError(error)
          ? error?.response?.data?.message || "Login failed."
          : "Unexpected error occurred.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [initializeSocket]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    setUser(null);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    toast.success("You have been successfully logged out.");
  }, []);

  const contextValue = useMemo(
    () => ({ user, login, logout, signup, socket: socketRef.current }),
    [user, login, logout, signup]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
