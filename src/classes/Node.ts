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
	bias?: number
}

export class Node {
	id: number
	sum: number
	type: "input" | "output" | "hidden"
	layer: number
	value: number
	bias: number
	inboundConnections: Link[]
	outboundConnections: Link[]
	constructor(options: NodeOptions) {
		this.id = options.id;
		this.sum = options.sum || 0;
		this.value = options.value || 0;
		this.bias = options.bias || 0;
		this.layer = options.layer;
		this.type = options.type;
		this.inboundConnections = options.inboundConnections || [];
		this.outboundConnections = options.outboundConnections || [];
	}
	getValue(): number {
		let sum = 0;
		this.inboundConnections.filter(n => n.enabled).forEach(n => sum += n.getLinkValue());
		this.sum = sum + this.bias;
		return this.value = sigmoid(sum);
	}
	//randomly changes bias
	mutate(): void {
		this.bias += Math.random() * 0.02 - 0.01;
	}
	shallowClone(): Node {
		return new Node({
			id: this.id,
			sum: this.sum || 0,
			value: this.value || 0,
			bias: this.bias || 0,
			layer: this.layer,
			type: this.type
		});
	}
	//use only when recalculating ALL nodes
	getLayer():number{
		if(this.layer < 0){
			this.layer = Math.max(...this.inboundConnections.map(n=>n.in.getLayer())) + 1;
		}
		return this.layer;
	}
}