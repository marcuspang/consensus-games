import { useEffect, useState } from "react";
import { ActionPrompt } from "./components/ActionPrompt";
import { Blockchain } from "./components/Blockchain";
import { Message } from "./components/Message";
import { Node } from "./components/Node";

const NUM_NODES = 12;

export interface NodeFields {
  id: number;
  state: string;
  value: string | null;
  isByzantine: boolean;
}

export interface MessageFields {
  from: number;
  to: string;
  type: string;
  value: string | null;
}

export enum Phase {
  IDLE = "idle",
  PROPOSE = "propose",
  PRE_PREPARE = "pre-prepare",
  PREPARE = "prepare",
  COMMIT = "commit",
  VIEW_CHANGE = "view-change",
}

export enum NodeState {
  IDLE = "idle",
  PROPOSED = "proposed",
  PRE_PREPARED = "pre-prepared",
  PREPARED = "prepared",
  COMMITTED = "committed",
}

export interface Block {
  number: number;
  value: string;
  isByzantine: boolean;
}

/**
 * numNodes = 3f + 1
 * f = (numNodes - 1) / 3
 *
 * @param numNodes
 * @returns
 */
function getByzantineFaultToleranceThreshold(numNodes: number): number {
  return Math.floor((numNodes - 1) / 3);
}

function isByzantineFaultTolerant(
  byzantineNodeCount: number,
  numNodes: number
): boolean {
  return byzantineNodeCount <= getByzantineFaultToleranceThreshold(numNodes);
}

export default function App() {
  const [isAllHonest, setIsAllHonest] = useState(false);
  const [byzantineProbability, setByzantineProbability] = useState(0.2);
  const [nodes, setNodes] = useState<NodeFields[]>(
    Array(NUM_NODES)
      .fill(null)
      .map((_, i) => ({
        id: i,
        state: NodeState.IDLE,
        value: null,
        isByzantine: Math.random() < byzantineProbability,
      }))
  );
  const [messages, setMessages] = useState<MessageFields[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.IDLE);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [currentView, setCurrentView] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  const byzantineNodeCount = nodes.filter((node) => node.isByzantine).length;

  useEffect(() => {
    if (isAllHonest) {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          isByzantine: false,
        }))
      );
    } else {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          isByzantine: Math.random() < byzantineProbability,
        }))
      );
    }
  }, [isAllHonest]);

  const startConsensus = () => {
    setCurrentPhase(Phase.PROPOSE);
    setNodes(
      nodes.map((node) => ({ ...node, state: NodeState.IDLE, value: null }))
    );
    setMessages([]);
  };

  const handleAction = (action: string) => {
    const newNodes = [...nodes];
    const newMessages = [...messages];

    if (currentPhase === Phase.IDLE) {
      return;
    }

    if (currentPhase === Phase.PROPOSE) {
      newNodes.forEach((node) => {
        if (node.isByzantine) {
          node.value = action === "A" ? "B" : "A";
        } else {
          node.value = action;
        }
        node.state = NodeState.PROPOSED;
      });
      setCurrentPhase(Phase.PRE_PREPARE);
    } else if (currentPhase === Phase.PRE_PREPARE) {
      newNodes.forEach((node) => {
        newMessages.push({
          from: node.id,
          to: "all",
          type: "pre-prepare",
          value: node.value,
        });
        node.state = NodeState.PRE_PREPARED;
      });
      setCurrentPhase(Phase.PREPARE);
    } else if (currentPhase === Phase.PREPARE) {
      newNodes.forEach((node) => {
        newMessages.push({
          from: node.id,
          to: "all",
          type: "prepare",
          value: action,
        });
        node.state = NodeState.PREPARED;
        node.value = node.isByzantine ? (action === "A" ? "B" : "A") : action;
      });
      setCurrentPhase(Phase.COMMIT);
    } else if (currentPhase === Phase.COMMIT) {
      newNodes.forEach((node) => {
        newMessages.push({
          from: node.id,
          to: "all",
          type: "commit",
          value: node.isByzantine ? (action === "A" ? "B" : "A") : action,
        });
        node.state = NodeState.COMMITTED;
      });

      // Add new block to the blockchain
      const consensusValue = getMajorityValue(newNodes);
      console.log({ consensusValue, action });
      if (consensusValue) {
        setBlockchain([
          ...blockchain,
          {
            number: blockchain.length,
            value: consensusValue,
            // If the consensus value is not the same as the action, then the Byzantine nodes won
            isByzantine: consensusValue !== action,
          },
        ]);
        setFailureCount(0);
        setCurrentPhase(Phase.IDLE);
      } else {
        console.error("Consensus failed");
        newMessages.push({
          from: -1,
          to: "all",
          type: "error",
          value: "Consensus failed",
        });
        handleConsensusFailure();
      }
    }

    setNodes(newNodes);
    setMessages(newMessages);
  };

  const handleConsensusFailure = () => {
    setFailureCount((prev) => prev + 1);
    if (failureCount >= 2) {
      initiateViewChange();
    } else {
      setCurrentPhase(Phase.PROPOSE);
    }
  };

  const initiateViewChange = () => {
    setCurrentView((prev) => prev + 1);
    setCurrentPhase(Phase.VIEW_CHANGE);
    setFailureCount(0);

    const newMessages = [...messages];
    newMessages.push({
      from: -1,
      to: "all",
      type: "view-change",
      value: `View changed to ${currentView + 1}`,
    });
    setMessages(newMessages);

    // Reset nodes for the new view
    setNodes(
      nodes.map((node) => ({ ...node, state: NodeState.IDLE, value: null }))
    );

    // After a short delay, start a new consensus round
    setTimeout(() => {
      setCurrentPhase(Phase.PROPOSE);
    }, 2000);
  };

  const getMajorityValue = (nodes: NodeFields[]) => {
    const valueCounts = nodes.reduce((acc, node) => {
      if (node.value) {
        acc[node.value] = (acc[node.value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Check if majority count passes the Byzantine fault tolerance threshold = 2f + 1
    const threshold = 2 * getByzantineFaultToleranceThreshold(NUM_NODES) + 1;
    const majorityValue = Object.entries(valueCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    if (valueCounts[majorityValue] >= threshold) {
      return majorityValue;
    }
    return null;
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Interactive PBFT Simulation</h1>
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setIsAllHonest((prev) => !prev)}
          className="px-4 py-2 mb-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          {isAllHonest ? "Enable Byzantine Nodes" : "Disable Byzantine Nodes"}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="byzantine-probability">
          Byzantine Probability: {byzantineProbability}
        </label>
        <input
          type="range"
          id="byzantine-probability"
          min="0"
          max="1"
          step="0.01"
          value={byzantineProbability}
          onChange={(e) => setByzantineProbability(Number(e.target.value))}
        />
      </div>
      <p className="mb-4">Current Phase: {currentPhase}</p>
      <p className="mb-4">Current View: {currentView}</p>
      <p className="mb-4">
        Byzantine Nodes: {byzantineNodeCount} / {NUM_NODES} (
        {Math.round((byzantineNodeCount / NUM_NODES) * 100)}%)
      </p>
      <p className="mb-4">
        Is Byzantine Fault Tolerant:{" "}
        {isByzantineFaultTolerant(byzantineNodeCount, NUM_NODES) ? "Yes" : "No"}
      </p>
      <div className="grid grid-cols-8 gap-4 mb-4">
        {nodes.map((node) => (
          <Node
            key={node.id}
            {...node}
            isActive={
              currentPhase !== Phase.IDLE && currentPhase !== Phase.VIEW_CHANGE
            }
          />
        ))}
      </div>
      {currentPhase === Phase.IDLE ? (
        <button
          onClick={startConsensus}
          className="px-4 py-2 mb-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Start Consensus Round
        </button>
      ) : currentPhase !== Phase.VIEW_CHANGE ? (
        <ActionPrompt phase={currentPhase} onAction={handleAction} />
      ) : (
        <p className="mb-4 text-yellow-600">View change in progress...</p>
      )}
      <Blockchain blocks={blockchain} />
      <div className="mb-4 space-y-2">
        {messages.map((msg, index) => (
          <Message key={index} {...msg} />
        ))}
      </div>
    </div>
  );
}
