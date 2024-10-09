import type { MessageFields } from "../App";

interface Props extends MessageFields {}

export function Message({ from, to, type, value }: Props) {
  if (type === "error") {
    return (
      <div className="grid grid-cols-4 p-2 bg-red-200 border rounded">
        <p>From: Node {from}</p>
        <p>To: {to}</p>
        <p>Type: {type}</p>
        <p>Value: {value}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 p-2 border rounded">
      <p>From: Node {from}</p>
      <p>To: {to}</p>
      <p>Type: {type}</p>
      <p>Value: {value}</p>
    </div>
  );
}
