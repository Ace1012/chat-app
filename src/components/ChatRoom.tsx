import { useEffect, useRef, useState } from "react";
import { Tab, UserLoginData, UserMessageDetails } from "../types";
import { Client, Message } from "stompjs";
import Compose from "./Compose";
import useConnect from "../custom-hooks/useConnect";

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
  // const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const privateChatsRef = useRef(privateChats)

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
    // console.log("Element focus event");
    if (inputRef.current) {
      // console.log(inputRef);
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
    let response = JSON.parse(payload.body);
    // if (publicChats.length === 0) {
    //   setOnlineUsers([...response.users]);
    // }
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
    console.log("Private chats before are", privateChats);
    if (privateChats.has(response.senderName)) {
      setPrivateChats(prev => new Map<string, string[]>([...prev, [response.senderName, [...prev.get(response.senderName)!, response.message]]]));
    } else {
      console.log("SIKO");
      privateChats.set(response.senderName, [response.message]);
      setPrivateChats(privateChats);
    }
  };

  const sendPubMess = () => {
    console.log("sending Public message!");
    if (stomp) {
      let message = {
        senderName: userLoginData.userName,
        message: userMessageData.message,
        messageType: "MESSAGE",
      };
      stomp.send(`/app/public-message`, {}, JSON.stringify(message));
      setUserMessageData({ ...userMessageData, message: "" });
    }
  };
  

  const sendPrivMess = () => {
    console.log("sending Private Message!");
    if (stomp) {
      let message = {
        senderName: userLoginData.userName,
        receiverName: userMessageData.receiverName,
        message: userMessageData.message,
        messageType: "MESSAGE",
      };
      stomp.send(`/app/private-message`, {}, JSON.stringify(message));
      privateChats.get(message.receiverName)?.push(message.message);
      setPrivateChats(prev => new Map<string, string[]>([...prev, [message.senderName, [...prev.get(message.senderName)!, message.message]]]));
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

  // useEffect(() => {
  //   console.log("Online users are", onlineUsers);
  // }, [onlineUsers]);

  useEffect(() => {
    console.log("Private chats have been updated!", privateChats);
    return () => {
      console.log("On unmount, privateChats is",privateChats);
    }
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
          <header>
            <h1>{userLoginData.userName}</h1>
            <button>Disconnect</button>
          </header>
          <ul className="tabs">
            {/* <h2>Online Users:</h2>
            <div className="online-users">
              {onlineUsers.map((user, index) => (
                <span
                  className="online-user"
                  onClick={() => handleTabs(user)}
                  key={index}
                >
                  {user}
                </span>
              ))}
            </div> */}
            <h2>Tabs:</h2>
            {["public-chat", ...privateChats.keys()].map(
              (tabOption, index) =>
                tabOption !== userLoginData.userName && (
                  <li
                    className={`tab ${
                      tab.currentTab === tabOption ? "selected" : ""
                    }`}
                    key={index}
                    onClick={() => handleTabs(tabOption)}
                  >
                    {tabOption}
                  </li>
                )
            )}
          </ul>
          <ul className="chats">
            <h3>Chat:</h3>
            {tab.isPublicChat
              ? publicChats.map((chat, index) => (
                  <li className="chat" key={index}>
                    {chat}
                  </li>
                ))
              : privateChats.get(tab.currentTab)?.map((chat, index) => (
                  <li className="chat" key={index}>
                    {chat}
                  </li>
                ))}
          </ul>
          <Compose
            sendPubMess={sendPubMess}
            sendPrivMess={sendPrivMess}
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
              onKeyDown={(e) => (e.key === "Enter" ? login() : null)}
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
