import { UserLoginData } from "../types";
import SockJS from "sockjs-client/dist/sockjs";
import { Client, Frame, Message, over } from "stompjs";

interface UseConnectprops {
  userLoginData: UserLoginData;
  setUserLoginData: (userLoginData:UserLoginData ) => void;
  onPublicMessageReceived: (payload: Message) => void;
  onPrivateMessageReceived: (payload: Message) => void;
}

let stompClient: Client | null = null;

const useConnect = ({
  userLoginData: userData,
  setUserLoginData,
  onPublicMessageReceived,
  onPrivateMessageReceived,
}: UseConnectprops) => {

  const registerUser = () => {
    let sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(sock);
    stompClient.connect({}, onConnected, onError);
  };

  const userJoin=()=>{
    console.log("sending...");
    var message = {
      senderName: userData.userName,
      messageType:"JOIN"
    };
    stompClient?.send("/app/public-message", {}, JSON.stringify(message));
}

  const onConnected = () => {
    setUserLoginData({...userData, connected:true})
    stompClient?.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient?.subscribe(
      "/user/" + userData.userName + "/private",
      onPrivateMessageReceived
    );
    userJoin();
  };

  const onError = (err:string | Frame) => {
    console.log(err );
  };

  registerUser();

  return stompClient;
};

export default useConnect;
