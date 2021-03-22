import { useEffect } from '../dependencies/React.js';
import { useCanvasContext } from './Canvas.js';

const constants = {
	outOfBoundsRecoverMinRatio: 0.3,
	outOfBoundsRecoverMaxRatio: 0.9,
	bounceMinRatio: 0.5,
	bounceMaxRatio: 0.8
};

export function MouseMoveControl({ radius, force }) {
	const { collection } = useCanvasContext();
	useEffect(() => {
		const handler = event =>
			collection.forEach(node =>
				node.explodeFrom(event.clientX, event.clientY, force, radius)
			);

		window.addEventListener('mousemove', handler);

		return () => window.removeEventListener('mousemove', handler);
	}, []);

	return null;
}
