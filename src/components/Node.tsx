import type { NodeFields } from "../App";

interface Props extends NodeFields {
  isByzantine: boolean;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function Node({
  id,
  state,
  value,
  view,
  isByzantine,
  isActive,
  isSelected,
  onClick,
}: Props) {
  return (
    <div
      className={`p-4 border rounded cursor-pointer ${
        isByzantine ? "border-red-500" : "border-green-500"
      } ${isActive ? "bg-yellow-100" : ""} ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <h2 className="font-bold">Node {id}</h2>
      <p>State: {state}</p>
      <p>Value: {value}</p>
      <p>View: {view}</p>
    </div>
  );
}
