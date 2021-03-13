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

const RADIUS_NEAR = 40;
const RADIUS_FAR = 700;
const RADIUS_VOID = 800;
const ATTRACTION_MULTIPLIER = 0.005;
const REPULSION_MULTIPLIER = 0.1;

const behavioursByDistance = [
	[
		(a, b, distance) => distance < RADIUS_NEAR,
		(a, b, distance) => {
			const urgencyLinearToDistance = (RADIUS_NEAR - distance) / RADIUS_NEAR;
			var force = REPULSION_MULTIPLIER * Math.pow(urgencyLinearToDistance, 2);
			a.dx += force * (a.x - b.x);
			a.dy += force * (a.y - b.y);
			b.dx -= force * (a.x - b.x);
			b.dy -= force * (a.y - b.y);
			a.connections.push(b);
			b.connections.push(a);
		}
	],
	[
		(a, b, distance) => {
			return distance > RADIUS_FAR && distance < RADIUS_VOID;
		},
		(a, b, distance) => {
			// aantrekken
			var force = Math.pow((ATTRACTION_MULTIPLIER * distance) / RADIUS_VOID, 1.6);
			a.dx -= force * (a.x - b.x);
			a.dy -= force * (a.y - b.y);
			b.dx += force * (a.x - b.x);
			b.dy += force * (a.y - b.y);

			a.connections.push(b);
			b.connections.push(a);
		}
	]
];
export class Node {
	constructor() {
		this.x = 10;
		this.y = 10;
		this.dx = 0;
		this.dy = 0;
		this.size = 5;
		this.inertiaDecay = 1;
		this.color = 'black';
		this.connections = [];
	}

	iterate({ size, collection }) {
		// Push/pull/interact every node with every other node, bi-directionally and in one pass
		for (let i = collection.nodes.indexOf(this) + 1; i < collection.nodes.length; i++) {
			const node = collection.nodes[i];
			const dx = this.x - node.x;
			const dy = this.y - node.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const bracket = behavioursByDistance.find(([isMatch]) => isMatch(this, node, distance));
			if (bracket) {
				bracket[1](this, node, distance);
			}
		}

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

	draw({ size, collection }, context) {
		context.beginPath();
		context.strokeStyle = this.color;
		context.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
		context.closePath();

		context.stroke();
		this.connections.forEach(conn => {
			context.beginPath();

			context.moveTo(this.x, this.y);
			context.lineTo(conn.x, conn.y);
			context.stroke();
		});

		this.connections.splice(0, this.connections.length);
	}

	static fromJson(opts) {
		const inst = new Node();
		Object.assign(inst, opts);
		return inst;
	}
}

export function NodeComponent(options) {
	const { collection, size } = useCanvasContext();
	useEffect(() => {
		return collection.add(
			Node.fromJson({
				...options,
				x: size.width / 2 + randomWithinBounds(-10, 10),
				y: size.height / 2 + randomWithinBounds(-10, 10),
				dx: randomWithinBounds(-10, 10),
				dy: randomWithinBounds(-10, 10),
				inertiaDecay: 0.8 //randomWithinBounds(0.7, 0.95)
			})
		);
	}, []);

	return null;
}
