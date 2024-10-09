import { Phase } from "../App";

interface Props {
  phase: Phase;
  onAction: (action: string) => void;
}

export function ActionPrompt({ phase, onAction }: Props) {
  let prompt = "";
  let actions: string[] = [];

  switch (phase) {
    case Phase.PROPOSE:
      prompt = `Propose a value:`;
      actions = ["A", "B"];
      break;
    case Phase.PRE_PREPARE:
      prompt = `Send pre-prepare message:`;
      actions = ["Send"];
      break;
    case Phase.PREPARE:
      prompt = `Prepare a value:`;
      actions = ["A", "B"];
      break;
    case Phase.COMMIT:
      prompt = `Commit to a value:`;
      actions = ["A", "B"];
      break;
  }

  return (
    <div className="mb-4">
      <p className="font-bold">{prompt}</p>
      <div className="space-x-2">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className="px-2 py-1 font-bold text-white bg-green-500 rounded hover:bg-green-700"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
