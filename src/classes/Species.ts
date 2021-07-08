import { Net } from './Net';
interface SpeciesOptions {
	nets: Net[]
}

export class Species {
	nets: Net[];
	constructor(options: SpeciesOptions) {
		this.nets = options.nets;
	}
	addMember(net: Net): void {
		this.nets.push(net);
	}
	testCompatibility(net: Net): number {
		return net.getCompatibilty(this.nets[0]);
	}
	repopulate(): void {
		//sort current members by fitness
		this.nets = this.nets.sort((a, b) => a.fitness - b.fitness);

		//kill bottom 50%
		const killAmount = Math.floor(this.nets.length * 0.5);
		this.nets.splice(killAmount * -1);

		//crossover
		const offspring = [];

		//if odd, separate off last one and breed by itself
		if (this.nets.length % 2 == 1) {
			const oddOneOut = this.nets.splice(-1)[0];
			offspring.push(new Net(oddOneOut).mutate());
		}

		//split into pairs and crossover
		for(let i =0;i<this.nets.length;i+=2){
			const pair = this.nets.slice(i,i+1);
			offspring.push(pair[0].crossover(pair[1]).mutate());
			offspring.push(pair[0].crossover(pair[1]).mutate());
			offspring.push(pair[0].crossover(pair[1]).mutate());
			offspring.push(pair[0].crossover(pair[1]).mutate());
		}

		this.nets = offspring;
	}
}