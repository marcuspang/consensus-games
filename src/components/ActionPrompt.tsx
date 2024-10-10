import { Phase } from "../App";

interface Props {
  phase: Phase;
  onAction: (action: string) => void;
}

export function ActionPrompt({ phase, onAction }: Props) {
  if (phase !== Phase.PROPOSE) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="font-bold">Choose a value to send as client:</p>
      <div className="flex gap-2">
        {["A", "B"].map((action) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className="px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
