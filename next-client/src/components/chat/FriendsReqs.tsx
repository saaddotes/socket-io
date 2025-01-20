import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // Assuming you have a custom Button component
import { User } from "@/context/authContext";
import toast from "react-hot-toast";

const FriendRequests = ({ user }: { user: User | null }) => {
  const [loading, setLoading] = useState(false);

  const handleAcceptFriend = async (requestId: string) => {
    setLoading(true);
    if (!user) return;
    try {
      // Make an API call to accept the friend request
      const response = await axios.post(
        "http://localhost:4000/auth/accept-friend",
        {
          senderEmail: user?.email,
          receiverEmail: requestId,
        }
      );

      if (response.data.success) {
        // Optionally show a success toast here
        toast.success("Friend request accepted!");

        // Update the local state (assuming you are using state management to handle friend requests)
        // Remove the accepted request from the list of friend requests
        const updatedRequests = user?.friendRequests.filter(
          (request) => request !== requestId
        );
        user.friendRequests = updatedRequests; // Update user state (handle appropriately)

        // Add friend to the friends list (if needed)
        user.friends.push(requestId); // This should be reflected in the backend as well
      } else {
        toast.error(
          response.data.message || "Failed to accept friend request."
        );
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 mb-2">
      {user?.friendRequests.map((request, index) => (
        <motion.div
          key={request}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="px-2 mb-2"
        >
          <Button
            variant="secondary"
            className="w-full justify-between h-16 rounded-lg"
          >
            <div className="text-left">{request}</div>
            <Button
              variant="link"
              onClick={() => handleAcceptFriend(request)}
              className="ml-2 h-12 rounded-lg"
              disabled={loading}
            >
              {loading ? "Accepting..." : "Accept"}
            </Button>
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default FriendRequests;
