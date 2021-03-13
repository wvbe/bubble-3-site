import {
	createContext,
	React,
	useContext,
	useEffect,
	useRef,
	useState
} from '../dependencies/React.js';

export function useCanvasContext() {
	return useContext(CanvasContext);
}
export class NodeCollection {
	constructor() {
		this.nodes = [];
	}
	iterate(...args) {
		this.forEach(node => node.iterate(...args));
	}
	draw(...args) {
		this.forEach(node => node.draw(...args));
	}
	add(inst) {
		this.nodes.push(inst);
		return () => this.nodes.splice(this.nodes.indexOf(inst), 1);
	}
	filter(...args) {
		return this.nodes.filter(...args);
	}
	map(...args) {
		return this.nodes.map(...args);
	}
	forEach(...args) {
		return this.nodes.forEach(...args);
	}
	find(...args) {
		return this.nodes.find(...args);
	}
}

export const CanvasContext = createContext();

function createEvent() {
	const handlers = [];
	return {
		on: cb => {
			handlers.push(cb);
			return () => handlers.splice(handlers.indexOf(cb), 1);
		},
		emit: (...rest) => {
			handlers.forEach(cb => cb(...rest));
		}
	};
}

export function CanvasComponent({ children }) {
	const canvasRef = useRef(null);
	const x = useRef({
		size: { width: window.innerWidth, height: window.innerHeight },
		collection: new NodeCollection()
	});
	const [sizes, setSizes] = useState(x.current.size);

	useEffect(() => {
		if (!canvasRef.current) {
			throw new Error('Derp.');
		}

		let enabled = true;
		const context = canvasRef.current.getContext('2d');
		context.strokeStyle = 'black';

		// Start and maintain the iteration and draw loop
		(function iterate() {
			if (!enabled) {
				return;
			}
			x.current.collection.iterate(x.current);
			context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
			x.current.collection.draw(x.current, context);
			window.requestAnimationFrame(iterate);
		})();

		const handleWindowResize = () => {
			if (sizes.width === window.innerWidth && sizes.height === window.innerHeight) {
				return;
			}
			x.current.size.width = window.innerWidth;
			x.current.size.height = window.innerHeight;
			setSizes({ ...x.current.size });
		};
		window.addEventListener('resize', handleWindowResize);

		return () => {
			enabled = false;
			window.removeEventListener('resize', handleWindowResize);
		};
	}, [window]);

	return React.createElement(
		CanvasContext.Provider,
		{
			value: x.current
		},
		children,
		React.createElement('canvas', { ref: canvasRef, width: sizes.width, height: sizes.height })
	);
}

export function ContextDebugComponent() {
	// throw new Error('Nerf');
	const { size } = useCanvasContext();
	return React.createElement(
		'div',
		{
			style: {
				display: 'inline-block',
				backgroundColor: 'black',
				color: 'yellow',
				padding: '3px',
				margin: '3px'
			}
		},
		`W: ${size.width}, H: ${size.height}`
	);
}
