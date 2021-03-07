import { useEffect } from '../dependencies/React.js';
import { useCanvasContext } from './Canvas.js';

const constants = {
	outOfBoundsRecoverMinRatio: 0.3,
	outOfBoundsRecoverMaxRatio: 0.9,
	bounceMinRatio: 0.5,
	bounceMaxRatio: 0.8
};

function randomWithinBounds(min, max) {
	return min + (max - min) * Math.random();
}

export class Node {
	constructor() {
		this.x = 10;
		this.y = 10;
		this.dx = 0;
		this.dy = 0;
		this.size = 5;
		this.inertiaDecay = 1;
		this.color = 'black';
	}

	iterate({ size, nodes }) {
		// Correct course if a node is found outside the canvas due to window resizes or w/e
		if (this.x < 0 || this.x > size.width) {
			const aboveUpperBound = this.x > size.width;
			this.dx =
				randomWithinBounds(
					constants.outOfBoundsRecoverMinRatio,
					constants.outOfBoundsRecoverMaxRatio
				) *
				((aboveUpperBound ? size.width : 0) - this.x);
			this.x = aboveUpperBound ? size.width : 0;
		}
		if (this.y < 0 || this.y > size.height) {
			const aboveUpperBound = this.y > size.height;
			this.dy =
				randomWithinBounds(
					constants.outOfBoundsRecoverMinRatio,
					constants.outOfBoundsRecoverMaxRatio
				) *
				((aboveUpperBound ? size.height : 0) - this.y);
			this.y = aboveUpperBound ? size.height : 0;
		}

		// Newtons 2nd law of motion
		this.x = this.x + this.dx;
		this.y = this.y + this.dy;

		// Bounce off the edges in normal scenarios
		if (this.x < 0) {
			this.x = 0;
			this.dx =
				Math.abs(this.dx) *
				randomWithinBounds(constants.bounceMinRatio, constants.bounceMaxRatio);
		} else if (this.x > size.width) {
			this.x = size.width;
			this.dx =
				-Math.abs(this.dx) *
				randomWithinBounds(constants.bounceMinRatio, constants.bounceMaxRatio);
		}
		if (this.y < 0) {
			this.y = 0;
			this.dy =
				Math.abs(this.dy) *
				randomWithinBounds(constants.bounceMinRatio, constants.bounceMaxRatio);
		} else if (this.y > size.height) {
			this.y = size.height;
			this.dy =
				-Math.abs(this.dy) *
				randomWithinBounds(constants.bounceMinRatio, constants.bounceMaxRatio);
		}

		// Slow down gradually
		this.dx *= this.inertiaDecay;
		this.dy *= this.inertiaDecay;
	}

	draw({ size, nodes }, context) {
		context.beginPath();
		context.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
		context.closePath();
		context.stroke();
	}

	static fromJson(opts) {
		const inst = new Node();
		Object.assign(inst, opts);
		return inst;
	}
}

export function NodeComponent(options) {
	const { nodes, size } = useCanvasContext();
	useEffect(() => {
		return nodes.add(
			Node.fromJson({
				...options,
				x: size.width / 2,
				y: size.height / 2,
				dx: (Math.random() * 2 - 1) * Math.random() * 30,
				dy: (Math.random() * 2 - 1) * Math.random() * 30,
				inertiaDecay: randomWithinBounds(0.7, 0.95)
			})
		);
	}, []);

	return null;
}
