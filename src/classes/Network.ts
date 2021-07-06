import { Net } from './Net';

interface NetworkOptions {
	nets?: Net[]
	links?: string[]
	inputSize: number
	outputSize: number
	populationSize: number
}

export class Network {
	nets: Net[]
	links: string[]
	inputSize: number
	outputSize: number
	populationSize: number
	constructor(options: NetworkOptions) {
		this.links = options.links || [];
		this.nets = options.nets || [];
		this.inputSize = options.inputSize;
		this.outputSize = options.outputSize;
		this.populationSize = options.populationSize;
	}
	initialize(): void {
		//wipe current nets
		this.nets = [];

		//add nets to this.nets
		for (let i = 0; i < this.populationSize; i++) {
			const net = new Net({
				parent: this
			});
			net.initialize(this.inputSize, this.outputSize);
			this.nets.push(net);
		}
	}
	getLinkInnovation(id: string): number {
		const pos = this.links.indexOf(id);
		if (pos >= 0) return pos;
		this.links.push(id);
		return this.links.length - 1;
	}
}