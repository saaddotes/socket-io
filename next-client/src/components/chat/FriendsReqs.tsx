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
  };

  // console.log(user?.friendRequests, user);

  return (
    <div className="flex flex-col space-y-2 mb-2">
      <p>Friends Requests</p>
      {user?.friendRequests.map((friend, index) => (
        <div
          key={friend._id + index}
          className="bg-slate-400 rounded-lg my-10 p-2 flex items-center justify-between gap-2"
        >
          <span className="text-xs flex-1 overflow-hidden">
            {friend?.name || friend?._id}
          </span>
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
