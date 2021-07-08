import { Net } from './Net';

interface PopulationOptions {
	nets?: Net[]
	links?: string[]
	inputSize: number
	outputSize: number
	populationSize: number
	comConfig: {
		excess: number
		disjoint: number
		weightDifference: number
		threshold: number
	}
}

interface testCallback{
	(nets:Net[]):Net[]
}

export class Population {
	nets: Net[]
	links: string[]
	inputSize: number
	outputSize: number
	populationSize: number
	comConfig: {
		excess: number
		disjoint: number
		weightDifference: number
		threshold: number
	}
	constructor(options: PopulationOptions) {
		this.links = options.links || [];
		this.nets = options.nets || [];
		this.inputSize = options.inputSize;
		this.outputSize = options.outputSize;
		this.populationSize = options.populationSize;
		this.comConfig = options.comConfig;
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
	test(callback:testCallback):void{
		this.nets = callback(this.nets);
	}
}