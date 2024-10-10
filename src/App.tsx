import { useEffect, useState } from "react";
import { ActionPrompt } from "./components/ActionPrompt";
import { Blockchain } from "./components/Blockchain";
import { Message } from "./components/Message";
import { Node } from "./components/Node";
import { NodeDetails } from "./components/NodeDetails";
import { toast, Toaster } from "sonner";

export interface NodeFields {
  id: number;
  state: string;
  value: string | null;
  isByzantine: boolean;
  view: number;
}

export interface MessageFields {
  from: number;
  to: string;
  type: string;
  value: string | null;
  view: number;
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
  const [messages, setMessages] = useState<MessageFields[]>([]);
  const [numNodes, setNumNodes] = useState(10);
  const [nodes, setNodes] = useState<NodeFields[]>(
    Array(numNodes)
      .fill(null)
      .map((_, i) => ({
        id: i,
        state: NodeState.IDLE,
        value: null,
        isByzantine: Math.random() < byzantineProbability,
        view: 0,
      }))
  );
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.IDLE);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [currentView, setCurrentView] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [currentLeader, setCurrentLeader] = useState<number>(0);

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

  useEffect(() => {
    setNodes(
      Array(numNodes)
        .fill(null)
        .map((_, i) => ({
          id: i,
          state: NodeState.IDLE,
          value: null,
          isByzantine: Math.random() < byzantineProbability,
          view: 0,
        }))
    );
  }, [numNodes, byzantineProbability]);

  const startConsensus = () => {
    setCurrentPhase(Phase.PROPOSE);
    setNodes(
      nodes.map((node) => ({ ...node, state: NodeState.IDLE, value: null }))
    );
    const newLeader = (currentLeader + 1) % numNodes;
    setCurrentLeader(newLeader);
  };

  const handleAction = (action: string) => {
    const newNodes = [...nodes];
    const newMessages = [...messages];

    if (currentPhase === Phase.IDLE) {
      return;
    }

    if (currentPhase === Phase.PROPOSE) {
      // Only the leader proposes a value
      const leaderNode = newNodes[currentLeader];
      leaderNode.value = action;
      leaderNode.state = NodeState.PROPOSED;

      // Leader sends pre-prepare messages to all other nodes
      newNodes.forEach((node) => {
        if (node.id !== currentLeader) {
          newMessages.push({
            from: currentLeader,
            to: node.id.toString(),
            type: "pre-prepare",
            value: action,
            view: currentView,
          });
        }
      });

      setCurrentPhase(Phase.PRE_PREPARE);
      setNodes(newNodes);
      setMessages(newMessages);
      automaticConsensus(newNodes, newMessages, action);
    }
  };

  const automaticConsensus = (
    nodes: NodeFields[],
    messages: MessageFields[],
    clientAction: string
  ) => {
    // Pre-prepare phase
    nodes.forEach((node) => {
      const recipients = nodes.filter((n) => n.id !== node.id);
      recipients.forEach((recipient) => {
        messages.push({
          from: node.id,
          to: recipient.id.toString(),
          type: "pre-prepare",
          value: node.value,
          view: node.view,
        });
      });
      node.state = NodeState.PRE_PREPARED;
    });

    // Prepare phase
    nodes.forEach((node, index) => {
      if (index !== currentLeader) {
        const prepareValue = node.isByzantine
          ? clientAction === "A"
            ? "B"
            : "A"
          : clientAction;
        const recipients = nodes.filter((n) => n.id !== node.id);
        recipients.forEach((recipient) => {
          messages.push({
            from: node.id,
            to: recipient.id.toString(),
            type: "prepare",
            value: prepareValue,
            view: node.view,
          });
        });
        node.state = NodeState.PREPARED;
        node.value = prepareValue;
      }
    });

    // Commit phase
    nodes.forEach((node) => {
      const commitValue = node.isByzantine
        ? clientAction === "A"
          ? "B"
          : "A"
        : clientAction;
      const recipients = nodes.filter((n) => n.id !== node.id);
      recipients.forEach((recipient) => {
        messages.push({
          from: node.id,
          to: recipient.id.toString(),
          type: "commit",
          value: commitValue,
          view: node.view,
        });
      });
      node.state = NodeState.COMMITTED;
    });

    // Add new block to the blockchain
    const consensusValue = getMajorityValue(nodes);
    if (consensusValue) {
      setBlockchain((prevBlockchain) => [
        ...prevBlockchain,
        {
          number: prevBlockchain.length,
          value: consensusValue,
          isByzantine: consensusValue !== clientAction,
        },
      ]);
      setFailureCount(0);
      setCurrentPhase(Phase.IDLE);
    } else {
      nodes.forEach((node) => {
        messages.push({
          from: -1,
          to: node.id.toString(),
          type: "error",
          value: "Consensus failed",
          view: node.view,
        });
      });
      handleConsensusFailure();
    }

    setNodes(nodes);
    setMessages(messages);
  };

  const handleConsensusFailure = () => {
    setFailureCount((prev) => {
      toast.error(`Consensus failed, failure count: ${prev + 1}`);
      if (prev >= 2) {
        initiateViewChange();
      } else {
        setCurrentPhase(Phase.PROPOSE);
      }

      return prev + 1;
    });
  };

  const initiateViewChange = () => {
    toast.info("Initiating view change");
    setCurrentPhase(Phase.VIEW_CHANGE);
    setFailureCount(0);
    setCurrentView((prev) => {
      const newMessages = [...messages];
      newMessages.push({
        from: -1,
        to: "all",
        type: "view-change",
        value: `View changed to ${prev + 1}`,
        view: prev,
      });

      setMessages(newMessages);
      return prev + 1;
    });

    // Reset nodes for the new view
    setNodes((prev) =>
      prev.map((node) => ({ ...node, state: NodeState.IDLE, value: null }))
    );

    // After a short delay, start a new consensus round
    setTimeout(() => {
      toast.info("Starting new consensus round");
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
    const threshold = 2 * getByzantineFaultToleranceThreshold(numNodes) + 1;
    const majorityValue = Object.entries(valueCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    if (valueCounts[majorityValue] >= threshold) {
      return majorityValue;
    }
    return null;
  };

  const handleNodeClick = (nodeId: number) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };

  const getMessagesForNode = (nodeId: number) => {
    console.log({ messages, nodeId });
    return messages.filter(
      (msg) => msg.from === nodeId || msg.to === nodeId.toString()
    );
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
        <label htmlFor="num-nodes">Number of Nodes:</label>
        <input
          type="number"
          id="num-nodes"
          min="1"
          step="1"
          value={numNodes}
          className="px-4 py-2 border-2 rounded"
          onChange={(e) => setNumNodes(Number(e.target.value))}
        />
      </div>
      <div className="flex gap-2 mb-4">
        <label htmlFor="byzantine-probability w-8">Byzantine Probability</label>
        <input
          type="range"
          id="byzantine-probability"
          min="0"
          max="1"
          step="0.01"
          value={byzantineProbability}
          onChange={(e) => setByzantineProbability(Number(e.target.value))}
        />
        <p>{byzantineProbability}</p>
      </div>
      <p className="mb-4">Current Phase: {currentPhase}</p>
      <p className="mb-4">Current View: {currentView}</p>
      <p className="mb-4">Current Leader: Node {currentLeader}</p>
      <p className="mb-4">
        Byzantine Nodes: {byzantineNodeCount} / {numNodes} (
        {Math.round((byzantineNodeCount / numNodes) * 100)}%)
      </p>
      <p className="mb-4">
        Is Byzantine Fault Tolerant:{" "}
        {isByzantineFaultTolerant(byzantineNodeCount, numNodes) ? "Yes" : "No"}
      </p>

      <Blockchain blocks={blockchain} />

      {currentPhase === Phase.IDLE ? (
        <button
          onClick={startConsensus}
          className="px-4 py-2 mb-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Start Consensus Round
        </button>
      ) : currentPhase === Phase.PROPOSE ? (
        <ActionPrompt phase={currentPhase} onAction={handleAction} />
      ) : (
        <p className="mb-4 text-yellow-600">
          Consensus in progress: {currentPhase}
        </p>
      )}

      <div className="grid grid-cols-8 gap-4 mb-4">
        {nodes.map((node) => (
          <Node
            key={node.id}
            {...node}
            isActive={
              currentPhase !== Phase.IDLE && currentPhase !== Phase.VIEW_CHANGE
            }
            isSelected={node.id === selectedNode}
            onClick={() => handleNodeClick(node.id)}
          />
        ))}
      </div>

      {selectedNode !== null && (
        <NodeDetails
          node={nodes.find((n) => n.id === selectedNode)!}
          messages={getMessagesForNode(selectedNode)}
        />
      )}

      <div className="mb-4 space-y-2">
        <button
          onClick={() => setShowAllMessages((prev) => !prev)}
          className="px-4 py-2 mb-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          {showAllMessages ? "Hide All Messages" : "Show All Messages"}
        </button>
        {showAllMessages &&
          messages.map((msg, index) => <Message key={index} {...msg} />)}
      </div>
      <Toaster />
    </div>
  );
}
