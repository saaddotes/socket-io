import { useAuth } from "@/context/authContext";
import toast from "react-hot-toast";

const FriendRequests = () => {
  const { user, socket } = useAuth();

  const handleAcceptFriend = async (requestId: string) => {
    socket?.emit(
      "accept-request",
      { requestId, senderId: user?._id },
      (response: { success: boolean; message: string }) => {
        if (response.success) {
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      }
    );
    // setLoading(true);
    // if (!user) return;
    // try {
    //   // Make an API call to accept the friend request
    //   const response = await axios.post(
    //     "http://192.168.0.112:4000/auth/accept-friend",
    //     {
    //       senderEmail: user?.email,
    //       receiverEmail: requestId,
    //     }
    //   );

    //   if (response.data.success) {
    //     // Optionally show a success toast here
    //     toast.success("Friend request accepted!");

    //     // Update the local state (assuming you are using state management to handle friend requests)
    //     // Remove the accepted request from the list of friend requests
    //     const updatedRequests = user?.friendRequests.filter(
    //       (request) => request !== requestId
    //     );
    //     user.friendRequests = updatedRequests; // Update user state (handle appropriately)

    //     // Add friend to the friends list (if needed)
    //     user.friends.push(requestId); // This should be reflected in the backend as well
    //   } else {
    //     toast.error(
    //       response.data.message || "Failed to accept friend request."
    //     );
    //   }
    // } catch (error) {
    //   console.error("Error accepting friend request:", error);
    //   toast.error("An error occurred. Please try again.");
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="flex flex-col space-y-2 mb-2">
      <p>Friends Requests</p>
      {user?.friendRequests.map((friend, index) => (
        <div
          key={friend._id}
          className="bg-slate-400 rounded-lg my-10 p-2 flex items-center justify-between gap-2"
        >
          <span className="text-xs flex-1 overflow-hidden">{friend.name}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleAcceptFriend(friend._id)}
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendRequests;
