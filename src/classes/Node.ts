import { Link } from './Link';
import { sigmoid } from '../modules/sigmoid';

interface NodeOptions {
	id: number
	type: "input" | "output" | "hidden"
	inboundConnections?: Link[]
	outboundConnections?: Link[]
	sum?: number
	value?: number
	layer?: number
}

export class Node {
	id: number
	sum: number
	type: "input" | "output" | "hidden"
	layer: number
	value: number
	inboundConnections: Link[]
	outboundConnections: Link[]
	constructor(options: NodeOptions) {
		this.id = options.id;
		this.sum = options.sum || 0;
		this.value = options.value || 0;
		this.layer = options.layer;
		this.type = options.type;
		this.inboundConnections = options.inboundConnections || [];
		this.outboundConnections = options.outboundConnections || [];


	}
	getValue(): number {
		let sum = 0;
		this.inboundConnections.forEach(n => sum += n.getLinkValue());
		this.sum = sum;
		return this.value = sigmoid(sum);
	}
	//only execute below after all nodes have been initialized
	getLayer(): number {
		//find layer of node
		if(this.layer == undefined){
			switch (this.type) {
				case "input":
					this.layer = 0;
					break;
				case "output":
					this.layer = Infinity;
					break;
				case "hidden":
					this.layer = Math.max(...this.inboundConnections.map(n => n.in.getLayer())) + 1;
					break;
			}
		}
		return this.layer;
	}
}