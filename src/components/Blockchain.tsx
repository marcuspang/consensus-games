import { Block } from "../App";

interface BlockchainProps {
  blocks: Block[];
}

export const Blockchain: React.FC<BlockchainProps> = ({ blocks }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Blockchain</h2>
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {blocks.map((block) => (
          <div
            key={block.number}
            className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex flex-col items-center justify-center"
          >
            <div className="font-bold">Block {block.number}</div>
            <div>Value: {block.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
