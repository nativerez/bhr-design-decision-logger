"use strict";
// This plugin allows designers to log and track design decisions.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// In-memory storage for decisions and resources (will be persisted to document storage)
let decisions = [];
let resources = [];
// Constants for plugin storage
const PLUGIN_NAMESPACE = 'bhrDesignDecisionLogger';
const DECISIONS_KEY = 'designDecisions';
const RESOURCES_KEY = 'designResources';
// Track current document ID to detect file changes
let currentDocumentId = figma.root.id;
// Load the HTML UI
figma.showUI(__html__, { width: 640, height: 840 });
// Load saved decisions and resources when plugin starts
function initializePlugin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Update current document ID
            currentDocumentId = figma.root.id;
            // Load decisions from document storage
            const savedDecisions = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, DECISIONS_KEY);
            if (savedDecisions) {
                decisions = JSON.parse(savedDecisions);
                figma.ui.postMessage({
                    type: 'load-decisions',
                    decisions,
                    documentId: currentDocumentId
                });
            }
            else {
                // Clear decisions if none exist in this document
                decisions = [];
                figma.ui.postMessage({
                    type: 'load-decisions',
                    decisions: [],
                    documentId: currentDocumentId
                });
            }
            // Load resources from document storage
            const savedResources = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, RESOURCES_KEY);
            if (savedResources) {
                resources = JSON.parse(savedResources);
                figma.ui.postMessage({ type: 'load-resources', resources });
            }
            else {
                // Clear resources if none exist in this document
                resources = [];
                figma.ui.postMessage({ type: 'load-resources', resources: [] });
            }
        }
        catch (error) {
            console.error('Error loading saved data:', error);
            figma.notify('Error loading saved data');
            // Reset arrays to be safe
            decisions = [];
            resources = [];
            figma.ui.postMessage({ type: 'load-decisions', decisions: [] });
            figma.ui.postMessage({ type: 'load-resources', resources: [] });
        }
        // Send current selection info to UI
        sendSelectionInfo();
    });
}
// Function to save decisions to document storage
function saveDecisionsToDocument() {
    try {
        figma.root.setSharedPluginData(PLUGIN_NAMESPACE, DECISIONS_KEY, JSON.stringify(decisions));
        return true;
    }
    catch (error) {
        console.error('Error saving decisions to document storage:', error);
        return false;
    }
}
// Function to save resources to document storage
function saveResourcesToDocument() {
    try {
        figma.root.setSharedPluginData(PLUGIN_NAMESPACE, RESOURCES_KEY, JSON.stringify(resources));
        return true;
    }
    catch (error) {
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
    }
    else if (selection.length > 1) {
        figma.ui.postMessage({
            type: 'selection-info',
            nodeId: null,
            nodeName: `Multiple items (${selection.length})`,
            pageName: figma.currentPage.name // Adding the page name
        });
    }
    else {
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
    if (currentDocumentId !== figma.root.id) {
        console.log('Document changed, reloading decisions');
        initializePlugin();
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
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
                author: ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                tags: msg.tags || []
            };
            // Add to our list and save
            resources.push(newResource);
            if (saveResourcesToDocument()) {
                figma.ui.postMessage({ type: 'resource-created', resource: newResource });
                figma.notify('Resource added successfully');
            }
            else {
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
                author: ((_b = figma.currentUser) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
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
            }
            else {
                figma.notify('Error saving decision');
            }
            break;
        }
        case 'edit-decision': {
            // Find and update the decision
            const index = decisions.findIndex(d => d.id === msg.decision.id);
            if (index !== -1) {
                decisions[index] = Object.assign(Object.assign({}, msg.decision), { timestamp: Date.now(), author: decisions[index].author // Preserve the original author
                 });
                if (saveDecisionsToDocument()) {
                    figma.ui.postMessage({ type: 'decision-updated', decision: decisions[index] });
                    figma.notify('Decision updated successfully');
                }
                else {
                    figma.notify('Error updating decision');
                }
            }
            break;
        }
        case 'delete-decision': {
            // Remove the decision
            decisions = decisions.filter(d => d.id !== msg.id);
            if (saveDecisionsToDocument()) {
                figma.ui.postMessage({ type: 'decision-deleted', id: msg.id });
                figma.notify('Decision deleted successfully');
            }
            else {
                figma.notify('Error deleting decision');
            }
            break;
        }
        case 'edit-resource': {
            // Find and update the resource
            const index = resources.findIndex(r => r.id === msg.resource.id);
            if (index !== -1) {
                resources[index] = Object.assign(Object.assign({}, msg.resource), { timestamp: Date.now(), author: resources[index].author // Preserve the original author
                 });
                if (saveResourcesToDocument()) {
                    figma.ui.postMessage({ type: 'resource-updated', resource: resources[index] });
                    figma.notify('Resource updated successfully');
                }
                else {
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
            }
            else {
                figma.notify('Error deleting resource');
            }
            break;
        }
        case 'get-user-info': {
            // Send back current user info
            figma.ui.postMessage({
                type: 'user-info',
                name: (_c = figma.currentUser) === null || _c === void 0 ? void 0 : _c.name,
                id: (_d = figma.currentUser) === null || _d === void 0 ? void 0 : _d.id
            });
            break;
        }
        case 'get-document-id': {
            // Send back current document ID
            figma.ui.postMessage({
                type: 'document-id',
                documentId: figma.root.id
            });
            console.log('Sending document ID to UI:', figma.root.id);
            break;
        }
        case 'navigate-to-node': {
            const nodeId = msg.nodeId;
            const _pageName = msg.pageName;
            if (nodeId) {
                try {
                    // Find the node first
                    const node = yield figma.getNodeByIdAsync(nodeId);
                    if (node) {
                        // Find the page that contains this node - traverse up the tree
                        let currentNode = node;
                        let targetPage = null;
                        while (currentNode && currentNode.parent) {
                            if (currentNode.parent.type === "PAGE") {
                                targetPage = currentNode.parent;
                                break;
                            }
                            currentNode = currentNode.parent;
                        }
                        if (targetPage) {
                            // Switch to the correct page first using the async version
                            yield figma.setCurrentPageAsync(targetPage);
                            // Wait a moment for the page switch to take effect
                            setTimeout(() => {
                                // Only scene nodes can be selected
                                if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
                                    const sceneNode = node;
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
                        }
                        else {
                            figma.notify('Could not find the page containing this element', { error: true });
                        }
                    }
                    else {
                        figma.notify('Could not find the linked element', { error: true });
                    }
                }
                catch (error) {
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
});
