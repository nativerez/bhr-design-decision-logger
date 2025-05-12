// This plugin allows designers to log and track design decisions.

// Define the Decision interface
interface Decision {
  id: string;
  title: string;
  rationale: string;
  context: string;
  timestamp: number;
  author: string;
  links: Array<{title: string, url: string}>;
  pros?: string[];
  cons?: string[];
  tags?: string[];
  nodeId?: string;
  nodeName?: string;
}

// In-memory storage for decisions (will be persisted to clientStorage)
let decisions: Decision[] = [];

// Load the HTML UI
figma.showUI(__html__, { width: 450, height: 550 });

// Load saved decisions when plugin starts
async function initializePlugin() {
  try {
    const savedDecisions = await figma.clientStorage.getAsync('designDecisions');
    if (savedDecisions) {
      decisions = JSON.parse(savedDecisions);
      figma.ui.postMessage({ type: 'load-decisions', decisions });
    }
  } catch (error) {
    console.error('Error loading saved decisions:', error);
    figma.notify('Error loading saved decisions');
  }

  // Send current selection info to UI
  sendSelectionInfo();
}

// Send information about the currently selected node to the UI
function sendSelectionInfo() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const selectedNode = selection[0];
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: selectedNode.id,
      nodeName: selectedNode.name
    });
  } else if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: null,
      nodeName: `Multiple items (${selection.length})`
    });
  } else {
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: null,
      nodeName: null
    });
  }
}

// Initialize the plugin
initializePlugin();

// Handle selection changes
figma.on('selectionchange', () => {
  sendSelectionInfo();
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'create-decision': {
      // Create a new decision with a unique ID
      const newDecision = {
        id: Date.now().toString(),
        title: msg.title,
        rationale: msg.rationale,
        context: msg.context,
        timestamp: Date.now(),
        author: figma.currentUser?.name || 'Unknown',
        links: msg.links || [],
        pros: msg.pros || [],
        cons: msg.cons || [],
        tags: msg.tags || [],
        nodeId: msg.nodeId,
        nodeName: msg.nodeName
      };
      
      // Add to our list and save
      decisions.push(newDecision);
      try {
        await figma.clientStorage.setAsync('designDecisions', JSON.stringify(decisions));
        figma.ui.postMessage({ type: 'decision-created', decision: newDecision });
        figma.notify('Decision logged successfully');
      } catch (error) {
        figma.notify('Error saving decision');
        console.error('Error saving decision:', error);
      }
      break;
    }
      
    case 'edit-decision': {
      // Find and update the decision
      const index = decisions.findIndex(d => d.id === msg.decision.id);
      if (index !== -1) {
        decisions[index] = {
          ...msg.decision,
          timestamp: Date.now() // Update timestamp on edit
        };
        
        try {
          await figma.clientStorage.setAsync('designDecisions', JSON.stringify(decisions));
          figma.ui.postMessage({ type: 'decision-updated', decision: decisions[index] });
          figma.notify('Decision updated successfully');
        } catch (error) {
          figma.notify('Error updating decision');
          console.error('Error updating decision:', error);
        }
      }
      break;
    }
      
    case 'delete-decision': {
      // Remove the decision
      decisions = decisions.filter(d => d.id !== msg.id);
      try {
        await figma.clientStorage.setAsync('designDecisions', JSON.stringify(decisions));
        figma.ui.postMessage({ type: 'decision-deleted', id: msg.id });
        figma.notify('Decision deleted successfully');
      } catch (error) {
        figma.notify('Error deleting decision');
        console.error('Error deleting decision:', error);
      }
      break;
    }
    
    case 'get-user-info': {
      // Send back current user info
      figma.ui.postMessage({
        type: 'user-info',
        name: figma.currentUser?.name,
        id: figma.currentUser?.id
      });
      break;
    }
    
    case 'navigate-to-node': {
      const nodeId = msg.nodeId;
      if (nodeId) {
        try {
          const node = await figma.getNodeByIdAsync(nodeId);
          if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
            // Only scene nodes (like layers) can be selected - not pages or the document
            const sceneNode = node as SceneNode;
            
            // Select the node first
            figma.currentPage.selection = [sceneNode];
            
            // Get node's absolute position in the canvas
            // Wait a moment to ensure the node is properly selected before centering
            setTimeout(() => {
              // First reset the zoom level to ensure consistency
              figma.viewport.zoom = 0.5;
              
              // Center viewport on the node
              figma.viewport.scrollAndZoomIntoView([sceneNode]);
              
              // Notify success
              figma.notify('Navigated to linked element');
            }, 100);
          } else {
            figma.notify('Could not find the linked element or it cannot be selected', { error: true });
          }
        } catch (error) {
          console.error('Error navigating to node:', error);
          figma.notify('Could not find the linked element', { error: true });
        }
      }
      break;
    }
      
    case 'close':
      figma.closePlugin();
      break;
  }
};
