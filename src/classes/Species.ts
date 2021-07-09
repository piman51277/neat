import { Net } from './Net';
interface SpeciesOptions {
	nets: Net[]
}

export class Species {
	nets: Net[];
	totalLocalFitness: number;
	constructor(options: SpeciesOptions) {
		this.nets = options.nets;
		this.totalLocalFitness = this.getTotalLocalFitness();
	}
	addMember(net: Net): void {
		this.nets.push(net);
		this.totalLocalFitness = this.getTotalLocalFitness();
	}
	testCompatibility(net: Net): number {
		return net.getCompatibilty(this.nets[0]);
	}
	repopulate(amount: number): Net[] {
		//sort current members by fitness
		this.nets = this.nets.sort((a, b) => a.fitness - b.fitness);

		//kill bottom 50%
		const killAmount = Math.floor(this.nets.length * 0.5);
		const netsCopy = this.nets.slice(0, killAmount + 1);

		//crossover
		const offspring = [];

		//select two random surviving members and crossover between them
		if (this.nets.length == 1) { //this is actually faster, as I don't need to check this condition again n times
			for (let i = 0; i < amount; i++) {
				offspring.push(new Net(netsCopy[0]).mutate());
			}
		} else {
			for (let i = 0; i < amount; i++) {
				//this is a dumb way to do it, but alas, it works
				const idArray = new Array(netsCopy.length).fill(0).map((n, i) => i);
				const firstRandom = Math.floor(Math.random() * idArray.length);
				const firstIndex = idArray.splice(firstRandom, firstRandom + 1)[0];
				const secondRandom = Math.floor(Math.random() * idArray.length);
				const secondIndex = idArray.splice(secondRandom, secondRandom + 1)[0];
				offspring.push(netsCopy[firstIndex].crossover(netsCopy[secondIndex]).mutate());
			}
		}

		return offspring;
	}
	private getTotalLocalFitness(): number {
		let fitnessSum = 0;
		this.nets.forEach(n => fitnessSum += n.fitness);
		return fitnessSum / this.nets.length;
	}
}