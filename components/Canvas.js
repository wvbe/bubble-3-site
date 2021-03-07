import { React, ReactDOM, useEffect, useRef } from '../dependencies/React.js';

export function CanvasComponent({}) {
	const canvasRef = useRef(null);

	useEffect(() => {
		if (canvasRef.current) {
			console.log(canvasRef.current);
		}
	}, []);

	return React.createElement('canvas', { ref: canvasRef });
}
