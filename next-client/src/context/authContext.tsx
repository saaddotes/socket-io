"use client";
import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import io from "socket.io-client";

export type User = {
  name: string;
  email: string;
  password?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  _id: string;
  friends: string[];
  friendRequests: string[];
  socketId?: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  socket: any;
  // setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const storedUser = sessionStorage.getItem("user");
    // const {email} = JSON.parse(sessionStorage.getItem("user"))

    console.log("Token Auth => ", token);
    console.log("User Auth => ", storedUser);
    if (token && storedUser) {
      try {
        const parserUser = JSON.parse(storedUser) as User;
        console.log("parserUser", parserUser);
        setUser(parserUser);

        if (!socket) {
          const socket = io("http://192.168.0.104:4000", {
            query: { userId: parserUser._id },
          });

          socket.on("connect", () => {
            toast("Socket connect successfully : " + socket.id, {
              icon: "👌",
            });
          });

          socket.on("trigger-requests", ({ receiver }) => {
            console.log("updatedUser triggered", receiver);
            setUser(receiver);
          });

          socket.on("disconnect", () => {
            toast("Socket Disconnected", {
              icon: "🙋‍♂️",
            });
          });

          setSocket(socket);
        }
      } catch (error) {
        console.log("Error => ", error);
      }
    }
  }, [socket]);

  const signup = async (name: string, email: string, password: string) => {
    const res = await axios.post("http://192.168.0.104:4000/auth/signup", {
      name,
      email,
      password,
    });
    const data = await res.data;

    sessionStorage.setItem("authToken", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.data));
    setUser(data.data);

    if (!socket) {
      const newSocket = io("http://192.168.0.104:4000");
      newSocket.on("connect", () => {
        newSocket.emit("newUser", { user });
        console.log("Connected to server with socket ID:", newSocket.id);
      });
      setSocket(newSocket);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post("http://192.168.0.104:4000/auth/login", {
        email,
        password,
      });
      const data = await res.data;

      console.log("data", data);

      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.data));
      setUser(data.data);
      const newSocket = io("http://192.168.0.104:4000");
      socket.on("connect", () => {
        socket.emit("newUser", { user });
        console.log("Connected to server with socket ID:", socket.id);
      });
      setSocket(newSocket);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error?.response?.data?.message || "Something went wrong.";
        throw new Error(errorMessage);
      } else {
        throw new Error("Unexpected Error occurred.");
      }
    }
  };

  const logout = async () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    setUser(null);
    toast.success("You have been successfully signed out.");
    socket.disconnect();
  };

  const contextValue = useMemo(
    () => ({ user, login, logout, signup, socket }),
    [user]
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
