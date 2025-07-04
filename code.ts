// This plugin allows designers to log and track design decisions.

// Define the Decision interface
interface Decision {
  id: string;
  title: string;
  rationale: string;
  context: string; // Represents "Decision Details" in the UI
  timestamp: number;
  author: string;
  links: Array<{title: string, url: string}>;
  pros?: string[];
  cons?: string[];
  tags?: string[];
  nodeId?: string;
  nodeName?: string;
  pageName?: string; // Adding pageName property
  status: 'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded'; // Adding status property
}

// Define the Resource interface
interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  timestamp: number;
  author: string;
  tags?: string[];
}

// In-memory storage for decisions and resources (will be persisted to document storage)
let decisions: Decision[] = [];
let resources: Resource[] = [];

// Constants for plugin storage
const PLUGIN_NAMESPACE = 'bhrDesignDecisionLogger';
const DECISIONS_KEY = 'designDecisions';
const RESOURCES_KEY = 'designResources';

// Track current document ID to detect file changes
let currentDocumentId: string = figma.fileKey || figma.root.id;

// Load the HTML UI
figma.showUI(__html__, { width: 640, height: 840 });

// Load saved decisions and resources when plugin starts
async function initializePlugin() {
  try {
    // Update current document ID
    currentDocumentId = figma.fileKey || figma.root.id;
    
    // Load decisions from document storage
    const savedDecisions = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, DECISIONS_KEY);
    if (savedDecisions) {
      decisions = JSON.parse(savedDecisions);
      figma.ui.postMessage({ 
        type: 'load-decisions', 
        decisions,
        documentId: currentDocumentId,
        fileName: figma.root.name || 'Untitled'
      });
    } else {
      // Clear decisions if none exist in this document
      decisions = [];
      figma.ui.postMessage({ 
        type: 'load-decisions', 
        decisions: [],
        documentId: currentDocumentId,
        fileName: figma.root.name || 'Untitled'
      });
    }
    
    // Load resources from document storage
    const savedResources = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, RESOURCES_KEY);
    if (savedResources) {
      resources = JSON.parse(savedResources);
      figma.ui.postMessage({ type: 'load-resources', resources });
    } else {
      // Clear resources if none exist in this document
      resources = [];
      figma.ui.postMessage({ type: 'load-resources', resources: [] });
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
    figma.notify('Error loading saved data');
    // Reset arrays to be safe
    decisions = [];
    resources = [];
    figma.ui.postMessage({ type: 'load-decisions', decisions: [] });
    figma.ui.postMessage({ type: 'load-resources', resources: [] });
  }

  // Rebuild visual log if there are decisions
  if (decisions.length > 0) {
    await rebuildVisualLog();
  }

  // Send current selection info to UI
  sendSelectionInfo();
}

// Function to save decisions to document storage
function saveDecisionsToDocument() {
  try {
    figma.root.setSharedPluginData(PLUGIN_NAMESPACE, DECISIONS_KEY, JSON.stringify(decisions));
    return true;
  } catch (error) {
    console.error('Error saving decisions to document storage:', error);
    return false;
  }
}

// Function to save resources to document storage
function saveResourcesToDocument() {
  try {
    figma.root.setSharedPluginData(PLUGIN_NAMESPACE, RESOURCES_KEY, JSON.stringify(resources));
    return true;
  } catch (error) {
    console.error('Error saving resources to document storage:', error);
    return false;
  }
}

// Send information about the currently selected node to the UI
function sendSelectionInfo() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const selectedNode = selection[0];
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: selectedNode.id,
      nodeName: selectedNode.name,
      pageName: figma.currentPage.name // Adding the page name
    });
  } else if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: null,
      nodeName: `Multiple items (${selection.length})`,
      pageName: figma.currentPage.name // Adding the page name
    });
  } else {
    figma.ui.postMessage({
      type: 'selection-info',
      nodeId: null,
      nodeName: null,
      pageName: null
    });
  }
}

// Check if we've switched to a different document and reload decisions if needed
function checkForDocumentChange() {
  if (currentDocumentId !== figma.fileKey || figma.root.id) {
    console.log('Document changed, reloading decisions');
    initializePlugin();
  }
}

// Function to create or get the Design Decisions page
async function getOrCreateDesignDecisionsPage(): Promise<PageNode> {
  // Check if 'Design Decisions' page already exists
  const existingPage = figma.root.children.find(page => page.name === 'Design Decisions') as PageNode;
  
  if (existingPage) {
    return existingPage;
  }
  
  // Create new page
  const newPage = figma.createPage();
  newPage.name = 'Design Decisions';
  
  // Create the main container frame
  const containerFrame = figma.createFrame();
  containerFrame.name = 'Decision Log';
  containerFrame.resize(1200, 800);
  containerFrame.x = 100;
  containerFrame.y = 100;
  containerFrame.fills = [{type: 'SOLID', color: {r: 0.98, g: 0.98, b: 0.98}}];
  containerFrame.layoutMode = 'VERTICAL';
  containerFrame.primaryAxisSizingMode = 'AUTO';
  containerFrame.counterAxisSizingMode = 'FIXED';
  containerFrame.itemSpacing = 16;
  containerFrame.paddingTop = 32;
  containerFrame.paddingBottom = 32;
  containerFrame.paddingLeft = 32;
  containerFrame.paddingRight = 32;
  
  // Create title
  const titleText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fontSize = 32;
  titleText.characters = 'Design Decisions Log';
  titleText.fills = [{type: 'SOLID', color: {r: 0.1, g: 0.1, b: 0.1}}];
  
  // Create table header
  const headerFrame = await createDecisionTableHeader();
  
  containerFrame.appendChild(titleText);
  containerFrame.appendChild(headerFrame);
  newPage.appendChild(containerFrame);
  
  return newPage;
}

// Function to create table header
async function createDecisionTableHeader(): Promise<FrameNode> {
  const headerFrame = figma.createFrame();
  headerFrame.name = 'Table Header';
  headerFrame.resize(1136, 48); // Full width minus padding
  headerFrame.fills = [{type: 'SOLID', color: {r: 0.95, g: 0.95, b: 0.95}}];
  headerFrame.layoutMode = 'HORIZONTAL';
  headerFrame.counterAxisSizingMode = 'FIXED';
  headerFrame.primaryAxisSizingMode = 'FIXED';
  headerFrame.itemSpacing = 16;
  headerFrame.paddingTop = 12;
  headerFrame.paddingBottom = 12;
  headerFrame.paddingLeft = 16;
  headerFrame.paddingRight = 16;
  
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  
  const headers = [
    { text: 'Title', width: 200 },
    { text: 'Status', width: 100 },
    { text: 'Details', width: 250 },
    { text: 'Rationale', width: 250 },
    { text: 'Author', width: 120 },
    { text: 'Date', width: 120 },
    { text: 'Tags', width: 160 }
  ];
  
  headers.forEach(header => {
    const headerText = figma.createText();
    headerText.fontName = { family: "Inter", style: "Medium" };
    headerText.fontSize = 14;
    headerText.characters = header.text;
    headerText.fills = [{type: 'SOLID', color: {r: 0.3, g: 0.3, b: 0.3}}];
    headerText.resize(header.width, 24);
    headerText.textAlignHorizontal = 'LEFT';
    headerText.textAlignVertical = 'CENTER';
    headerFrame.appendChild(headerText);
  });
  
  return headerFrame;
}

// Function to create a decision row in the table
async function createDecisionRow(decision: Decision): Promise<FrameNode> {
  const rowFrame = figma.createFrame();
  rowFrame.name = `Decision: ${decision.title}`;
  rowFrame.resize(1136, 80); // Adjustable height
  rowFrame.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];
  rowFrame.strokes = [{type: 'SOLID', color: {r: 0.9, g: 0.9, b: 0.9}}];
  rowFrame.strokeWeight = 1;
  rowFrame.layoutMode = 'HORIZONTAL';
  rowFrame.counterAxisSizingMode = 'FIXED';
  rowFrame.primaryAxisSizingMode = 'FIXED';
  rowFrame.itemSpacing = 16;
  rowFrame.paddingTop = 12;
  rowFrame.paddingBottom = 12;
  rowFrame.paddingLeft = 16;
  rowFrame.paddingRight = 16;
  
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  
  // Format date
  const date = new Date(decision.timestamp);
  const formattedDate = date.toLocaleDateString();
  
  // Status color mapping
  const statusColors = {
    'proposed': {r: 0.05, g: 0.28, b: 0.63}, // Blue
    'accepted': {r: 0.11, g: 0.37, b: 0.13}, // Green
    'rejected': {r: 0.72, g: 0.11, b: 0.11}, // Red
    'deprecated': {r: 0.24, g: 0.15, b: 0.14}, // Brown
    'superseded': {r: 0.29, g: 0.08, b: 0.55} // Purple
  };
  
  const cellData = [
    { text: decision.title, width: 200, weight: 'Medium' },
    { text: decision.status.toUpperCase(), width: 100, weight: 'Medium', color: statusColors[decision.status] },
    { text: decision.context.substring(0, 100) + (decision.context.length > 100 ? '...' : ''), width: 250, weight: 'Regular' },
    { text: decision.rationale.substring(0, 100) + (decision.rationale.length > 100 ? '...' : ''), width: 250, weight: 'Regular' },
    { text: decision.author, width: 120, weight: 'Regular' },
    { text: formattedDate, width: 120, weight: 'Regular' },
    { text: decision.tags ? decision.tags.join(', ') : '', width: 160, weight: 'Regular' }
  ];
  
  cellData.forEach(cell => {
    const cellText = figma.createText();
    cellText.fontName = { family: "Inter", style: cell.weight as 'Regular' | 'Medium' };
    cellText.fontSize = 12;
    cellText.characters = cell.text;
    cellText.fills = [{type: 'SOLID', color: cell.color || {r: 0.2, g: 0.2, b: 0.2}}];
    cellText.resize(cell.width, 56);
    cellText.textAlignHorizontal = 'LEFT';
    cellText.textAlignVertical = 'TOP';
    cellText.textAutoResize = 'HEIGHT';
    rowFrame.appendChild(cellText);
  });
  
  return rowFrame;
}

// Function to add a decision to the visual log
async function addDecisionToVisualLog(decision: Decision) {
  try {
    // Get or create the Design Decisions page
    const decisionsPage = await getOrCreateDesignDecisionsPage();
    
    // Switch to the decisions page
    await figma.setCurrentPageAsync(decisionsPage);
    
    // Find the container frame
    const containerFrame = decisionsPage.findOne(node => node.name === 'Decision Log') as FrameNode;
    
    if (!containerFrame) {
      console.error('Could not find Decision Log container frame');
      return;
    }
    
    // Create the decision row
    const decisionRow = await createDecisionRow(decision);
    
    // Add the row to the container (it will be added in date order due to how we append)
    containerFrame.appendChild(decisionRow);
    
    // Update the container height if needed
    containerFrame.resize(containerFrame.width, containerFrame.height + 96); // Row height + spacing
    
    console.log('Decision added to visual log successfully');
    
  } catch (error) {
    console.error('Error adding decision to visual log:', error);
  }
}

// Function to update existing decision in visual log
async function updateDecisionInVisualLog(updatedDecision: Decision) {
  try {
    // Get the Design Decisions page
    const decisionsPage = figma.root.children.find(page => page.name === 'Design Decisions') as PageNode;
    
    if (!decisionsPage) {
      console.log('Design Decisions page not found, skipping visual update');
      return;
    }
    
    // Find the container frame
    const containerFrame = decisionsPage.findOne(node => node.name === 'Decision Log') as FrameNode;
    
    if (!containerFrame) {
      console.error('Could not find Decision Log container frame');
      return;
    }
    
    // Find the existing decision row
    const existingRow = containerFrame.findOne(node => node.name === `Decision: ${updatedDecision.title}`) as FrameNode;
    
    if (existingRow) {
      // Remove the old row
      existingRow.remove();
      
      // Create new row with updated data
      const newRow = await createDecisionRow(updatedDecision);
      
      // Add the updated row back
      containerFrame.appendChild(newRow);
    }
    
    console.log('Decision updated in visual log successfully');
    
  } catch (error) {
    console.error('Error updating decision in visual log:', error);
  }
}

// Function to delete decision from visual log
async function deleteDecisionFromVisualLog(decisionTitle: string) {
  try {
    // Get the Design Decisions page
    const decisionsPage = figma.root.children.find(page => page.name === 'Design Decisions') as PageNode;
    
    if (!decisionsPage) {
      console.log('Design Decisions page not found, skipping visual deletion');
      return;
    }
    
    // Find the container frame
    const containerFrame = decisionsPage.findOne(node => node.name === 'Decision Log') as FrameNode;
    
    if (!containerFrame) {
      console.error('Could not find Decision Log container frame');
      return;
    }
    
    // Find and remove the decision row
    const rowToDelete = containerFrame.findOne(node => node.name === `Decision: ${decisionTitle}`) as FrameNode;
    
    if (rowToDelete) {
      rowToDelete.remove();
      console.log('Decision removed from visual log successfully');
    }
    
  } catch (error) {
    console.error('Error deleting decision from visual log:', error);
  }
}

// Function to rebuild the entire visual log (used on plugin load)
async function rebuildVisualLog() {
  try {
    if (decisions.length === 0) {
      console.log('No decisions to display in visual log');
      return;
    }
    
    // Get or create the Design Decisions page
    const decisionsPage = await getOrCreateDesignDecisionsPage();
    
    // Find the container frame
    const containerFrame = decisionsPage.findOne(node => node.name === 'Decision Log') as FrameNode;
    
    if (!containerFrame) {
      console.error('Could not find Decision Log container frame');
      return;
    }
    
    // Remove all existing decision rows (keep title and header)
    const childrenToRemove = containerFrame.children.filter(child => 
      child.name.startsWith('Decision:')
    );
    
    childrenToRemove.forEach(child => child.remove());
    
    // Sort decisions by timestamp (newest first)
    const sortedDecisions = [...decisions].sort((a, b) => b.timestamp - a.timestamp);
    
    // Add all decisions to the visual log
    for (const decision of sortedDecisions) {
      const decisionRow = await createDecisionRow(decision);
      containerFrame.appendChild(decisionRow);
    }
    
    console.log('Visual log rebuilt successfully');
    
  } catch (error) {
    console.error('Error rebuilding visual log:', error);
  }
}

// Initialize the plugin
initializePlugin();

// Handle selection changes
figma.on('selectionchange', () => {
  // Check if document has changed
  checkForDocumentChange();
  // Then handle selection as usual
  sendSelectionInfo();
});

// Monitor document changes (runs when the plugin UI gains focus)
figma.ui.on('message', () => {
  checkForDocumentChange();
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  // Check for document change on each message from UI
  checkForDocumentChange();
  
  switch (msg.type) {
    case 'create-resource': {
      // Create a new resource with a unique ID
      const newResource = {
        id: Date.now().toString(),
        title: msg.title,
        description: msg.description,
        url: msg.url,
        category: msg.category,
        timestamp: Date.now(),
        author: figma.currentUser?.name || 'Unknown',
        tags: msg.tags || []
      };
      
      // Add to our list and save
      resources.push(newResource);
      if (saveResourcesToDocument()) {
        figma.ui.postMessage({ type: 'resource-created', resource: newResource });
        figma.notify('Resource added successfully');
      } else {
        figma.notify('Error saving resource');
      }
      break;
    }
      
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
        nodeName: msg.nodeName,
        pageName: msg.pageName, // Store the page name
        status: msg.status || 'proposed' // Default to 'proposed' if not specified
      };
      
      // Add to our list and save
      decisions.push(newDecision);
      if (saveDecisionsToDocument()) {
        figma.ui.postMessage({ type: 'decision-created', decision: newDecision });
        figma.notify('Decision logged successfully');
        
        // Also add to visual log
        await addDecisionToVisualLog(newDecision);
      } else {
        figma.notify('Error saving decision');
      }
      break;
    }
      
    case 'edit-decision': {
      // Find and update the decision
      const index = decisions.findIndex(d => d.id === msg.decision.id);
      if (index !== -1) {
        decisions[index] = {
          ...msg.decision,
          timestamp: Date.now(), // Update timestamp on edit
          author: decisions[index].author // Preserve the original author
        };
        
        if (saveDecisionsToDocument()) {
          figma.ui.postMessage({ type: 'decision-updated', decision: decisions[index] });
          figma.notify('Decision updated successfully');
          
          // Update visual log as well
          await updateDecisionInVisualLog(decisions[index]);
        } else {
          figma.notify('Error updating decision');
        }
      }
      break;
    }
      
    case 'delete-decision': {
      // Find the decision title before deleting (for visual log cleanup)
      const decisionToDelete = decisions.find(d => d.id === msg.id);
      const decisionTitle = decisionToDelete?.title || '';
      
      // Remove the decision
      decisions = decisions.filter(d => d.id !== msg.id);
      if (saveDecisionsToDocument()) {
        figma.ui.postMessage({ type: 'decision-deleted', id: msg.id });
        figma.notify('Decision deleted successfully');
        
        // Also delete from visual log
        if (decisionTitle) {
          await deleteDecisionFromVisualLog(decisionTitle);
        }
      } else {
        figma.notify('Error deleting decision');
      }
      break;
    }
    
    case 'edit-resource': {
      // Find and update the resource
      const index = resources.findIndex(r => r.id === msg.resource.id);
      if (index !== -1) {
        resources[index] = {
          ...msg.resource,
          timestamp: Date.now(), // Update timestamp on edit
          author: resources[index].author // Preserve the original author
        };
        
        if (saveResourcesToDocument()) {
          figma.ui.postMessage({ type: 'resource-updated', resource: resources[index] });
          figma.notify('Resource updated successfully');
        } else {
          figma.notify('Error updating resource');
        }
      }
      break;
    }
    
    case 'delete-resource': {
      // Remove the resource
      resources = resources.filter(r => r.id !== msg.id);
      if (saveResourcesToDocument()) {
        figma.ui.postMessage({ type: 'resource-deleted', id: msg.id });
        figma.notify('Resource deleted successfully');
      } else {
        figma.notify('Error deleting resource');
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
    
    case 'get-document-id': {
      // Send back current document ID and file name
      const fileName = figma.root.name || 'Untitled';
      const documentId = figma.fileKey || figma.root.id;
      figma.ui.postMessage({
        type: 'document-id',
        documentId: documentId,
        fileName: fileName
      });
      console.log('Sending document ID to UI:', documentId);
      console.log('Sending file name to UI:', fileName);
      break;
    }
    
    case 'navigate-to-node': {
      const nodeId = msg.nodeId;
      const _pageName = msg.pageName;
      
      if (nodeId) {
        try {
          // Find the node first
          const node = await figma.getNodeByIdAsync(nodeId);
          
          if (node) {
            // Find the page that contains this node - traverse up the tree
            let currentNode = node;
            let targetPage: PageNode | null = null;
            
            while (currentNode && currentNode.parent) {
              if (currentNode.parent.type === "PAGE") {
                targetPage = currentNode.parent as PageNode;
                break;
              }
              currentNode = currentNode.parent;
            }
            
            if (targetPage) {
              // Switch to the correct page first using the async version
              await figma.setCurrentPageAsync(targetPage);
              
              // Wait a moment for the page switch to take effect
              setTimeout(() => {
                // Only scene nodes can be selected
                if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
                  const sceneNode = node as SceneNode;
                  
                  // Select the node
                  figma.currentPage.selection = [sceneNode];
                  
                  // Reset zoom level for consistency
                  figma.viewport.zoom = 0.5;
                  
                  // Center viewport on the node
                  figma.viewport.scrollAndZoomIntoView([sceneNode]);
                  
                  // Notify success - we know targetPage is not null at this point
                  figma.notify(`Navigated to linked element on page "${targetPage.name}"`);
                }
              }, 200);
            } else {
              figma.notify('Could not find the page containing this element', { error: true });
            }
          } else {
            figma.notify('Could not find the linked element', { error: true });
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
