import { Node } from './Node';
import { Link } from './Link';
import { Population } from './Population';

interface netOptions {
	nodes?: Node[]
	links?: Link[]
	parent: Population
}

interface genomeComparison {
	shared: Link[][]
	excess: Link[]
	disjoint: Link[]
}

export class Net {
	nodes: Node[]
	links: Link[]
	parent: Population
	fitness: number
	constructor(options: netOptions) {
		this.nodes = options.nodes || [];
		this.links = options.links || [];
		this.parent = options.parent;
		this.fitness = 0; //this will be set by the testing function in Population
	}
	initialize(inputs: number, outputs: number): void {
		for (let i = 0; i < inputs; i++) {
			const node = new Node({
				id: this.nodes.length,
				type: "input",
				layer: 0,
				bias: Math.random() * 4 - 2
			});
			this.nodes.push(node);

		}
		for (let i = 0; i < outputs; i++) {
			const node = new Node({
				id: this.nodes.length,
				type: "output",
				layer: 1,
				bias: Math.random() * 4 - 2
			});
			this.nodes.push(node);

			for (let selectedInput = 0; selectedInput < inputs; selectedInput++) {
				const link = new Link({
					in: this.nodes[selectedInput],
					out: node,
					enabled: true,
					weight: Math.random() * 4 - 2,
					innovation: this.parent.getLinkInnovation(`${selectedInput}-${this.nodes.length - 1}`)
				});

				//add link to referenced nodes
				this.nodes[selectedInput].outboundConnections.push(link);
				node.inboundConnections.push(link);
				this.links.push(link);
			}
		}

	}
	evaluate(inputs: number[]): number[] {
		//initialize input nodes with data
		inputs.forEach((n, i) => {
			this.nodes[i].value = n;
		});

		//gets values of output nodes
		const output = this.nodes.filter(n => n.type == "output").map(n => n.getValue());

		return output;
	}
	getCompatibilty(other: Net): number {
		const { disjoint, excess, shared } = this.compareGenomes(other);

		//compute weight difference sum
		let weightDifferenceSum = 0;
		shared.forEach(n => weightDifferenceSum += n[0].weight - n[1].weight);

		return (this.parent.comConfig.excess * excess.length / this.parent.links.length) + (this.parent.comConfig.disjoint * disjoint.length / this.parent.links.length) + this.parent.comConfig.weightDifference * (weightDifferenceSum / shared.length);
	}
	addRandomNode(): void {
		//get a current link
		const avalibleLinkIndexes = this.links.map((n, i) => n.enabled ? i : -1).filter(n => n >= 0);
		const selectedIndex = avalibleLinkIndexes[Math.floor(Math.random() * avalibleLinkIndexes.length)];

		//turn it off
		this.links[selectedIndex].enabled = false;

		//add a new node
		const node = new Node({
			id: this.nodes.length,
			type: "hidden",
			bias: Math.random() * 4 - 2
		});

		//create links to and from this new Node
		const inboundLink = new Link({
			innovation: this.parent.getLinkInnovation(`${this.links[selectedIndex].in.id}-${node.id}`),
			in: this.links[selectedIndex].in,
			out: node,
			enabled: true,
			weight: 1
		});
		const outboundLink = new Link({
			innovation: this.parent.getLinkInnovation(`${node.id}-${this.links[selectedIndex].out.id}`),
			in: node,
			out: this.links[selectedIndex].out,
			enabled: true,
			weight: 1
		});

		//below is simply a far more efficient version of this.recalculateNodeLayers(), as we only need to think about ONE node

		//node's layer is simply the layer of the input + 1;
		node.layer = this.links[selectedIndex].in.layer + 1;

		//add one to layer of all affected nodes
		const threshold = node.layer == this.links[selectedIndex].out.layer ? node.layer : node.layer + 1;
		this.nodes.map(n => {
			if (n.layer >= threshold) n.layer++;
			return n;
		});

		//add new links to node
		node.inboundConnections.push(inboundLink);
		node.outboundConnections.push(outboundLink);

		//add new link to connecting nodes
		this.links[selectedIndex].out.inboundConnections.push(outboundLink);
		this.links[selectedIndex].in.outboundConnections.push(inboundLink);

		//add all new links/nodes to this
		this.nodes.push(node);
		this.links.push(inboundLink);
		this.links.push(outboundLink);
	}
	addRandomLink(): void {

		//sort each node into buckets
		const maxLayer = this.nodes.find(n => n.type == "output").layer;
		const nodeLayers: Node[][] = [];
		for (let i = 0; i <= maxLayer; i++) {
			nodeLayers.push([]);
		}
		for (const node of this.nodes) {
			nodeLayers[node.layer].push(node);
		}

		//get saturation numbers for every layer
		const saturationNumbers = new Array(maxLayer + 1).fill(0);
		// eslint-disable-next-line for-direction
		for (let i = maxLayer - 1; i >= 0; i--) {
			saturationNumbers[i] = saturationNumbers[i + 1] + nodeLayers[i + 1].length;
		}

		//select valid node, weighted on num avalible new connections
		const validNodes = [];
		const culmWeights = [];
		let currentTotal = 0;
		for (const node of this.nodes) {
			if (node.outboundConnections.length < saturationNumbers[node.layer] && node.type != "output") {
				//get all possible connections
				validNodes.push(node.id);
				currentTotal += saturationNumbers[node.layer] - node.outboundConnections.length;
				culmWeights.push(currentTotal);
			}
		}

		//if there are no valid input nodes, exit
		if (validNodes.length == 0) return;

		//binary search to select random node
		const targetValue = Math.random() * currentTotal;
		let currentSearch = culmWeights;
		while (currentSearch.length > 1) {
			if (currentSearch.length % 2 == 0) {
				const middle = currentSearch.length / 2;
				if ((currentSearch[middle] + currentSearch[middle - 1]) * 0.5 < targetValue) {
					currentSearch = currentSearch.slice(0, middle);
				} else {
					currentSearch = currentSearch.slice(middle);
				}
			} else {
				const middle = Math.floor(currentSearch.length / 2);
				if (currentSearch[middle] < targetValue) {
					currentSearch = currentSearch.slice(0, middle);
				} else {
					currentSearch = currentSearch.slice(middle + 1);
				}
			}
		}

		const selectedNodeId = validNodes[culmWeights.indexOf(currentSearch[0])];
		const selectedNode = this.nodes[selectedNodeId];
		const existingNodeConnections = new Set(selectedNode.outboundConnections.map(n => n.out.id));

		//get valid connections for selected node

		//compile valid output Nodes
		const validIds = [];
		for (let i = selectedNode.layer + 1; i < nodeLayers.length; i++) {
			nodeLayers[i].forEach(n => {
				if (!existingNodeConnections.has(n.id)) validIds.push(n.id);
			});
		}

		//select random output Node
		const selectedOutputNodeId = validIds[Math.floor(Math.random() * validIds.length)];

		//create new Link
		const newLink = new Link({
			in: selectedNode,
			out: this.nodes[selectedOutputNodeId],
			weight: Math.random() * 4 - 2,
			innovation: this.parent.getLinkInnovation(`${selectedNodeId}-${selectedOutputNodeId}`),
			enabled: true
		});

		//assign link to existing nodes
		this.nodes[selectedNodeId].outboundConnections.push(newLink);
		this.nodes[selectedOutputNodeId].inboundConnections.push(newLink);

		//insert new Link into this
		this.links.push(newLink);

	}
	mutate(): Net {
		const randomValue = Math.random();

		//weight mutation -> 70%
		if (randomValue < 0.7) {
			this.links.forEach(n => n.mutate());
		}

		//bias mutation -> 60%
		if (randomValue < 0.6) {
			this.nodes.forEach(n => n.mutate());
		}

		//add node mutation -> 5%
		if (randomValue < 0.05) {
			this.addRandomNode();
		}

		//add link mutation -> 20%
		if (randomValue < 0.2) {
			this.addRandomLink();
		}

		return this;
	}
	private compareGenomes(other: Net): genomeComparison {
		const results: genomeComparison = {
			shared: [],
			excess: [],
			disjoint: []
		};

		//map both other.links and this.links onto arrays with index being innovation number
		const myLinks: Link[] = [];
		const otherLinks: Link[] = [];
		this.links.forEach(n => myLinks[n.innovation] = n);
		other.links.forEach(n => otherLinks[n.innovation] = n);

		for (let i = 0; i < Math.max(myLinks.length, otherLinks.length); i++) {
			if (myLinks[i] != undefined && otherLinks[i] != undefined) {
				//they are matching
				results.shared.push([myLinks[i], otherLinks[i]]);
			} else if (myLinks[i] == undefined && otherLinks[i] == undefined) {
				//do nothing
			} else if (myLinks[i] != undefined && i > otherLinks.length - 1) {
				//they are excess
				results.excess.push(myLinks[i]);
			} else if (otherLinks[i] != undefined && i > myLinks.length - 1) {
				//they are excess
				results.excess.push(otherLinks[i]);
			} else if (otherLinks[i] != undefined) {
				//they are disjoint
				results.disjoint.push(otherLinks[i]);
			} else {
				results.disjoint.push(myLinks[i]);
			}
		}

		return results;

	}
	private recalculateNodeLayers(): void {
		//set all hidden & output node layers to -1;
		this.nodes.filter(n => n.type != "input").forEach(n => n.layer = -1);

		//get all output nodes and recalculate thier layer
		const outputLayer = Math.max(...this.nodes.filter(n => n.type == "output").map(n => n.getLayer()));

		//set all output nodes to outputLayer
		this.nodes.filter(n => n.type == "output").map(n => n.layer = outputLayer);
	}
	crossover(other: Net): Net {
		let nodes: Node[] = [];

		//insert nodes randomly from parents
		for (let node = 0; node < Math.max(this.nodes.length, other.nodes.length); node++) {
			if (this.nodes[node] != undefined && other.nodes[node] != undefined) {
				if (Math.random() < 0.5) {
					nodes.push(this.nodes[node].shallowClone());
				} else {
					nodes.push(other.nodes[node].shallowClone());
				}
				//TODO assign new node the higher layer number between the two
			} else if (this.nodes[node] != undefined) {
				nodes.push(this.nodes[node].shallowClone());
			} else if (other.nodes[node] != undefined) {
				nodes.push(other.nodes[node].shallowClone());
			}
		}

		//sort nodes
		nodes = nodes.sort((a, b) => a.id - b.id);

		//gather relationships of links between both Nets
		const { disjoint, shared, excess } = this.compareGenomes(other);

		//compile relationships into links
		const links: Link[] = [];

		//randomly assign shared links
		for (const link of shared) {
			const targetLink = link[Math.round(Math.random())];
			const newLink = new Link({
				innovation: targetLink.innovation,
				enabled: targetLink.enabled,
				weight: targetLink.weight,
				in: nodes[targetLink.in.id],
				out: nodes[targetLink.out.id]
			});
			nodes[targetLink.in.id].outboundConnections.push(newLink);
			nodes[targetLink.out.id].inboundConnections.push(newLink);
			links.push(newLink);
		}

		//assign shared and excess links
		const disjointAndExcess = disjoint.concat(excess);
		for (const link of disjointAndExcess) {
			const targetLink = link[0];
			const newLink = new Link({
				innovation: targetLink.innovation,
				enabled: targetLink.enabled,
				weight: targetLink.weight,
				in: nodes[targetLink.in.id],
				out: nodes[targetLink.out.id]
			});
			nodes[targetLink.in.id].outboundConnections.push(newLink);
			nodes[targetLink.out.id].inboundConnections.push(newLink);
			links.push(newLink);
		}

		//create a new Net based on these nodes and links
		const newNet = new Net({
			nodes,
			links,
			parent: this.parent
		});

		//recalcuate node layers for new Net
		newNet.recalculateNodeLayers();

		return newNet;
	}
}