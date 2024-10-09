import { Block } from "../App";
import { cn } from "../utils";

interface BlockchainProps {
  blocks: Block[];
}

export const Blockchain: React.FC<BlockchainProps> = ({ blocks }) => {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold">Blockchain</h2>
      <div className="flex pb-4 space-x-4 overflow-x-auto">
        {blocks.map((block) => (
          <div
            key={block.number}
            className={cn(
              "flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex flex-col items-center justify-center",
              block.isByzantine ? "bg-red-300" : "bg-green-300"
            )}
          >
            <div className="font-bold">Block {block.number}</div>
            <div>Value: {block.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
