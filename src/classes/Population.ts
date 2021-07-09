import { Net } from './Net';
import { Species } from './Species';

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

interface testCallback {
	(nets: Net[]): Net[]
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
	test(callback: testCallback): void {
		this.nets = callback(this.nets);
	}
	//speciates and reproduces. test() has to be run first
	nextGen(): void {
		//speciate nets
		let species: Species[] = [];

		for (const net of this.nets) {
			//for god's sake, why is "species" both it's pural and singular form?!?
			let foundSpecies = false;
			for (const oneSpecies of species) {
				if (oneSpecies.testCompatibility(net) <= this.comConfig.threshold) {
					oneSpecies.addMember(net);
					foundSpecies = true;
					break;
				}
			}

			if (!foundSpecies) {
				//make a new species
				species.push(new Species({ nets: [net] }));
			}
		}

		//calculate local fitness of each species and assign member count porportionally
		species = species.sort((a, b) => a.totalLocalFitness - b.totalLocalFitness);
		let totalFitness = 0;
		species.forEach(n => totalFitness += n.totalLocalFitness);

		this.nets = [];
		species.forEach((n) => {
			this.nets = this.nets.concat(n.repopulate(Math.round(this.populationSize / Math.abs(n.totalLocalFitness/totalFitness))));
		});

		//if this.nets is over this.populationSize , trim down
		this.nets = this.nets.slice(0, 10);

		//if its under, reproduce more with top performing species
		if (this.nets.length < this.populationSize) {
			this.nets = this.nets.concat(species[0].repopulate(this.populationSize - this.nets.length));
		}
	}
}