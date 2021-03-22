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
function rasterizeVector({ x, y }, radius) {
	if ((x == 0 && y == 0) || radius == 0) {
		return { x: 0, y: 0 };
	}
	// multiply by the ratio of desired radius to (pythagoras of) x/y vector
	const multiplier = radius / Math.sqrt(y * y + x * x);
	return { x: x * multiplier, y: y * multiplier };
}

const behavioursByDistance = [
	[
		(a, b, distance) => distance < (a.radiusNear + b.radiusNear) / 2,
		(a, b, distance) => {
			const radiusNear = (a.radiusNear + b.radiusNear) / 2;
			const repulsionForceMultiplier =
				(a.repulsionForceMultiplier + b.repulsionForceMultiplier) / 2;

			const urgencyLinearToDistance = (radiusNear - distance) / radiusNear;

			var force = repulsionForceMultiplier * Math.pow(urgencyLinearToDistance, 2);
			a.dx += force * (a.x - b.x);
			a.dy += force * (a.y - b.y);
			b.dx -= force * (a.x - b.x);
			b.dy -= force * (a.y - b.y);

			a.connections.push({ node: b, color: `rgba(0,0,0,${urgencyLinearToDistance})` });
			b.connections.push({ node: a, color: `rgba(0,0,0,${urgencyLinearToDistance})` });
		}
	],
	[
		(a, b, distance) => {
			return (
				distance > (a.radiusFar + b.radiusFar) / 2 &&
				distance < (a.radiusFalloff + b.radiusFalloff) / 2
			);
		},
		(a, b, distance) => {
			const radiusFalloff = (a.radiusFalloff + b.radiusFalloff) / 2;
			const attractionForceMultiplier =
				(a.attractionForceMultiplier + b.attractionForceMultiplier) / 2;

			var force = Math.pow((attractionForceMultiplier * distance) / radiusFalloff, 1.6);
			a.dx -= force * (a.x - b.x);
			a.dy -= force * (a.y - b.y);
			b.dx += force * (a.x - b.x);
			b.dy += force * (a.y - b.y);

			// a.connections.push({ node: b, color: `rgba(0,0,255,1)` });
			// b.connections.push({ node: a, color: `rgba(0,0,255,1)` });
		}
	]
];
export class Node {
	constructor() {
		this.x = 10;
		this.y = 10;
		this.dx = 0;
		this.dy = 0;

		this.color = 'black';
		this.connections = [];

		this.radiusNear = 40;
		this.radiusFar = 700;
		this.radiusFalloff = 800;
		this.attractionForceMultiplier = 0.005;
		this.repulsionForceMultiplier = 0.1;
		this.frictionForceMultiplier = 0.95;

		this.size = 5;
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
		this.dx *= this.frictionForceMultiplier;
		this.dy *= this.frictionForceMultiplier;
	}

	draw({ size, collection }, context) {
		this.connections.forEach(conn => {
			context.strokeStyle = conn.color;
			context.lineWidth = 0.25;
			context.beginPath();
			context.moveTo(this.x, this.y);
			context.lineTo(conn.node.x, conn.node.y);
			context.closePath();
			context.stroke();
		});

		context.strokeStyle = this.color;
		context.lineWidth = 1;
		context.beginPath();
		context.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
		context.closePath();
		context.stroke();
		this.connections.splice(0, this.connections.length);
	}

	explodeFrom(x, y, force, radius) {
		var ddx = x - this.x;
		var ddy = y - this.y;
		var dist = Math.sqrt(ddx * ddx + ddy * ddy);
		if (dist <= radius) {
			var nd = rasterizeVector({ x: -ddx, y: -ddy }, force * (1 - dist / radius));
			this.dx += nd.x;
			this.dy += nd.y;
		}
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
				frictionForceMultiplier: 0.95 //randomWithinBounds(0.7, 0.95)
			})
		);
	}, []);

	return null;
}
