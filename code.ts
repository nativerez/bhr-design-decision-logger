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
}

// Initialize the plugin
initializePlugin();

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
        tags: msg.tags || []
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
      
    case 'close':
      figma.closePlugin();
      break;
  }
};
