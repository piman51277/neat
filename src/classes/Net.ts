import { Node } from './Node';
import { Link } from './Link';
import { Network } from './Network';

interface netOptions {
	nodes?: Node[]
	links?: Link[]
	parent: Network
}
export class Net {
	nodes: Node[]
	links: Link[]
	parent: Network
	constructor(options: netOptions) {
		this.nodes = options.nodes || [];
		this.links = options.links || [];
		this.parent = options.parent;
	}
	initialize(inputs: number, outputs: number): void {
		let nodeId = 0;
		for (let i = 0; i < inputs; i++) {
			const node = new Node({
				id: nodeId,
				type: "input",
				layer: 0
			});
			this.nodes.push(node);
			nodeId++;
		}
		for (let i = 0; i < outputs; i++) {
			const node = new Node({
				id: nodeId,
				type: "output",
				layer: Infinity
			});
			this.nodes.push(node);

			for (let selectedInput = 0; selectedInput < inputs; selectedInput++) {
				const link = new Link({
					in: this.nodes[selectedInput],
					out: node,
					enabled: true,
					weight: Math.random() * 4 - 2,
					innovation: this.parent.getLinkInnovation(`${selectedInput}_${nodeId}`)
				});

				//add link to referenced nodes
				this.nodes[selectedInput].outboundConnections.push(link);
				node.inboundConnections.push(link);

				this.links.push(link);
			}



			nodeId++;
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
}