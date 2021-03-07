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

export const CanvasContext = createContext();

export function CanvasComponent({ children }) {
	const canvasRef = useRef(null);
	const [sizes, setSizes] = useState({ width: window.innerWidth, height: window.innerHeight });

	useEffect(() => {
		if (!canvasRef.current) {
			throw new Error('Derp.');
		}

		const handleWindowResize = () =>
			(sizes.width === window.innerWidth && sizes.height === window.innerHeight) ||
			setSizes({ width: window.innerWidth, height: window.innerHeight });

		window.addEventListener('resize', handleWindowResize);
		return () => window.removeEventListener('resize', handleWindowResize);
	}, [window]);

	return React.createElement(
		CanvasContext.Provider,
		{
			value: {
				size: sizes
			}
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
