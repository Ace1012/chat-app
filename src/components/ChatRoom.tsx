import { useEffect, useRef, useState } from "react";
import useConnect from "../custom-hooks/useConnect";
import { Tab, UserLoginData, UserMessageDetails } from "../types";
import { Client, Message } from "stompjs";
import Compose from "./Compose";

interface LoginProps {
  userData: UserLoginData;
  setUserData: React.Dispatch<React.SetStateAction<UserLoginData>>;
}

const ChatRoom = () => {
  const [userLoginData, setUserLoginData] = useState<UserLoginData>({
    userName: "",
    connected: false,
  });

  const [userMessageData, setUserMessageData] = useState<UserMessageDetails>({
    senderName: "",
    receiverName: "",
    message: "",
    date: "",
  });

  const [publicChats, setPublicChats] = useState<string[]>([]);
  const [privateChats, setPrivateChats] = useState(new Map<string, string[]>());
  const [tab, setTab] = useState<Tab>({
    currentTab: "public-chat",
    isPublicChat: true,
  });

  const [stomp, setStomp] = useState<Client | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const focusOnInput = (keyboardEvent: KeyboardEvent) => {
    const key = keyboardEvent.key;
    if (key !== "i") return;
    else if (keyboardEvent.ctrlKey && key === "i") {
      if (inputRef.current === document.activeElement) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
      handleFocusedElement();
    }
  };

  const handleFocusedElement = () => {
    console.log("Element focus event");
    if (inputRef.current) {
      console.log(inputRef);
      if (inputRef.current === document.activeElement) {
        inputRef.current!.style.backgroundColor = "#242424";
        inputRef.current!.style.color = "white";
        inputRef.current!.style.padding = "2rem";
      } else {
        inputRef.current!.style.backgroundColor = "";
        inputRef.current!.style.color = "";
        inputRef.current!.style.padding = "";
      }
    }
  };

  const onPublicMessageReceived = (payload: Message) => {
    console.log("Public message received!!!");
    console.log(payload);
    let response = JSON.parse(payload.body);
    switch (response.messageType) {
      case "JOIN":
        if (!privateChats.get(response.senderName)) {
          console.log("User not found!", privateChats);
          privateChats.set(response.senderName, []);
          setPrivateChats(
            (prev) =>
              new Map<string, string[]>([...prev, [response.senderName, []]])
          );
          console.log("User added!", privateChats);
        }
        break;
      case "MESSAGE":
        console.log("New message!");
        setPublicChats((prev) => [...prev, response.message]);
        break;
    }
  };

  const onPrivateMessageReceived = (payload: Message) => {
    console.log("Private message received!!!");
    let response = JSON.parse(payload.body);
    if (privateChats.get(response.senderName)) {
      privateChats.get(response.senderName)?.push(response);
      setPrivateChats(privateChats);
    } else {
      privateChats.set(response.senderName, response);
      setPrivateChats(privateChats);
    }
  };

  const sendPubMess = () => {
    console.log("sending PubMess!");
    if (stomp) {
      let message = {
        senderName: userLoginData.userName,
        message: userMessageData.message,
        messageType: "MESSAGE",
      };
      stomp.send(`/app/message`, {}, JSON.stringify(message));
      setUserMessageData({ ...userMessageData, message: "" });
    }
  };

  const handleTabs = (user: string) => {
    if (tab.currentTab !== user) {
      let newTab: Tab = {
        currentTab: user,
        isPublicChat: user === "public-chat" ? true : false,
      };

      user === "public-chat"
        ? setUserMessageData({ ...userMessageData, receiverName: "" })
        : setUserMessageData({ ...userMessageData, receiverName: user });

      setTab(newTab);
    }
  };

  const login = () => {
    if (userLoginData.userName !== "") {
      setStomp(
        useConnect({
          userLoginData,
          setUserLoginData,
          onPublicMessageReceived,
          onPrivateMessageReceived,
        })
      );
    } else {
      alert("Name cannot be blank!");
    }
  };

  useEffect(() => {
    console.log(`UserData changed!`, userLoginData);
    setUserMessageData({
      ...userMessageData,
      senderName: userLoginData.userName,
    });
  }, [userLoginData]);

  useEffect(() => {
    console.log(`MessageData changed!`, userMessageData);
  }, [userMessageData]);

  useEffect(() => {
    console.log("Switched tabs!", tab);
  }, [tab]);

  useEffect(() => {
    console.log("Public chats updated!", publicChats);
  }, [publicChats]);

  useEffect(() => {
    console.log("Private chats updated!", privateChats);
  }, [privateChats]);

  useEffect(() => {
    window.addEventListener("keydown", focusOnInput);
    document.addEventListener("focus", handleFocusedElement, true);
    return () => {
      window.removeEventListener("keydown", focusOnInput);
      document.removeEventListener("focus", handleFocusedElement, true);
    };
  }, []);

  return (
    <div className="chat-app">
      {userLoginData.connected ? (
        <div className="chat-room">
          <ul className="tabs">
            <h2>Tabs:</h2>
            {["public-chat", ...privateChats.keys()].map((tab, index) => (
              <li className="tab" key={index} onClick={() => handleTabs(tab)}>
                {tab}
              </li>
            ))}
          </ul>
          <ul>
            Chat:
            {tab.isPublicChat
              ? publicChats.map((chat, index) => <li key={index}>{chat}</li>)
              : privateChats
                  .get(tab.currentTab)
                  ?.map((chat, index) => <li key={index}>{chat}</li>)}
          </ul>
          <Compose
            sendPubMess={sendPubMess}
            userMessageData={userMessageData}
            setUserMessageData={setUserMessageData}
            tab={tab}
          />
        </div>
      ) : (
        <div className="login">
          <h2>Login</h2>
          <div className="login-content">
            <input
              ref={inputRef}
              type="text"
              style={{
                padding: "0.5rem",
              }}
              placeholder="Enter name"
              onChange={(e) => {
                setUserLoginData({
                  ...userLoginData,
                  userName: e.target.value,
                });
              }}
            />
          </div>
          <button className="login-button" onClick={() => login()}>
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
