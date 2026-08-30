import { createEmptyNode, deepCopyNode, assignMissingRefs, createDownloadParseNodes } from '../../../state-builder/index.ts';
import type { UINode } from '../../../state-builder/index.ts';

export function useNodeTreeOperations(nodes: UINode[], updateNodes: (newNodes: UINode[]) => void) {
  const addNode = () => {
    const [newNode] = assignMissingRefs([createDownloadParseNodes()], nodes);
    updateNodes([...nodes, newNode]);
  };

  const addCanvas = () => {
    const canvasNode = createEmptyNode('canvas');
    updateNodes([...nodes, canvasNode]);
  };

  const updateNode = (id: string, updates: Partial<UINode>) => {
    updateNodes(nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)));
  };

  const removeNode = (id: string) => {
    updateNodes(nodes.filter((node) => node.id !== id));
  };

  const addChildToNode = (id: string) => {
    updateNodes(
      nodes.map((node) => {
        if (node.id === id) {
          const newChild = createEmptyNode();
          return {
            ...node,
            children: [...(node.children || []), newChild],
          };
        }
        return node;
      })
    );
  };

  const copyNode = (id: string) => {
    const nodeToCopy = nodes.find((node) => node.id === id);
    if (!nodeToCopy) return;

    const copiedNode = deepCopyNode(nodeToCopy);

    updateNodes([...nodes, copiedNode]);
  };

  const moveNodeUp = (id: string) => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index <= 0) return;

    const newNodes = [...nodes];
    [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
    updateNodes(newNodes);
  };

  const moveNodeDown = (id: string) => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index === -1 || index >= nodes.length - 1) return;

    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    updateNodes(newNodes);
  };

  return { addNode, addCanvas, updateNode, removeNode, addChildToNode, copyNode, moveNodeUp, moveNodeDown };
}
