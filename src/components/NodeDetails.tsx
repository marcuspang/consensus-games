import React from "react";
import { NodeFields, MessageFields } from "../App";
import { Message } from "./Message";

interface Props {
  node: NodeFields;
  messages: MessageFields[];
}

export const NodeDetails: React.FC<Props> = ({ node, messages }) => {
  return (
    <div className="p-4 mt-4 border rounded">
      <h2 className="mb-2 text-xl font-bold">Node {node.id} Details</h2>
      <p>State: {node.state}</p>
      <p>Value: {node.value}</p>
      <p>Byzantine: {node.isByzantine ? "Yes" : "No"}</p>
      <h3 className="mt-4 mb-2 text-lg font-semibold">Messages</h3>
      <div className="space-y-2">
        {messages.map((msg, index) => (
          <Message key={index} {...msg} />
        ))}
      </div>
    </div>
  );
};
