export enum MessageType {
    JOIN = "JOIN",
    MESSAGE = "MESSAGE",
    LEAVE = "LEAVE",
  }

  export interface UserLoginData {
    userName: string;
    connected:boolean;
  }

  export interface UserMessageDetails {
    senderName: string;
    receiverName: string;
    message: string;
    date: string;
  }