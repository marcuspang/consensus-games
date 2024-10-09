import type { NodeFields } from "../App";

interface Props extends NodeFields {
  isByzantine: boolean;
  isActive: boolean;
}

export function Node({ id, state, value, isByzantine, isActive }: Props) {
  return (
    <div
      className={`p-4 border rounded ${
        isByzantine ? "border-red-500" : "border-green-500"
      } ${isActive ? "bg-yellow-100" : ""}`}
    >
      <h2 className="font-bold">Node {id}</h2>
      <p>State: {state}</p>
      <p>Value: {value}</p>
    </div>
  );
}
