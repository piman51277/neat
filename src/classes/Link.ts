import { Node } from './Node';

interface LinkOptions{
	innovation: number
	in: Node
	out: Node
	enabled: boolean
	weight: number
}

export class Link {
	innovation: number
	in: Node
	out: Node
	enabled: boolean
	weight: number
	constructor(options: LinkOptions) {
		this.innovation = options.innovation;
		this.in = options.in;
		this.out = options.out;
		this.enabled = options.enabled;
		this.weight = options.weight;
	}
	getLinkValue():number {
		return this.weight * this.in.value;
	}
	getId():string {
		return `${this.in.id}-${this.out.id}`;
	}
	//randomly changes weight
	mutate():void{
		this.weight += Math.random() * 0.02 - 0.01;
	}
}