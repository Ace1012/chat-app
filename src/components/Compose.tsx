import * as React from "react";
import { UserMessageDetails } from "../types";

interface ComposeProps {
  sendPubMess: () => void;
  userMessageData: UserMessageDetails;
  setUserMessageData: React.Dispatch<React.SetStateAction<UserMessageDetails>>;
}

const Compose = ({
  sendPubMess,
  userMessageData,
  setUserMessageData,
}: ComposeProps) => {

  const handlePubMess = ( e: React.ChangeEvent<HTMLInputElement>) => {
    setUserMessageData({ ...userMessageData, message: e.target.value })

  }

  return (
    <div className="compose">
      <div className="public-messages">
        <input
          type="text"
          placeholder="Enter public message"
          value={userMessageData.message}
          onChange={(e) =>
            handlePubMess(e)
          }
        />
        <button onClick={() => sendPubMess()}>Send</button>
      </div>
      <div className="private-messages">
        <input type="text" placeholder="Enter private message" />
        <button>Send</button>
      </div>
    </div>
  );
};

export default Compose;
