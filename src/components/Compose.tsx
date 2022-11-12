import { Tab, UserMessageDetails } from "../types";

interface ComposeProps {
  sendPubMess: () => void;
  sendPrivMess: () => void;
  userMessageData: UserMessageDetails;
  setUserMessageData: React.Dispatch<React.SetStateAction<UserMessageDetails>>;
  tab: Tab;
}

const Compose = ({
  sendPubMess,
  sendPrivMess,
  userMessageData,
  setUserMessageData,
  tab
}: ComposeProps) => {
  const handleMess = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserMessageData({ ...userMessageData, message: e.target.value });
  };

  return (
    <div className="compose">
      {tab.isPublicChat ? (
        <div className="public-messages">
          <input
            type="text"
            placeholder="Enter public message"
            value={userMessageData.message}
            onChange={(e) => handleMess(e)}
            onKeyDown={(e) => e.key === "Enter" ? sendPubMess() : null}
          />
          <button onClick={() => sendPubMess()}>Send</button>
        </div>
      ) : (
        <div className="private-messages">
          <input
            type="text"
            placeholder="Enter private message"
            value={userMessageData.message}
            onChange={(e) => handleMess(e)}
            onKeyDown={(e) => e.key === "Enter" ? sendPrivMess() : null}
          />
          <button onClick={() => sendPrivMess()}>Send</button>
        </div>
      )}
    </div>
  );
};

export default Compose;
