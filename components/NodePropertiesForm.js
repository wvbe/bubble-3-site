import { useEffect, useCallback, useState } from '../dependencies/React.js';
import { useCanvasContext } from './Canvas.js';

function changePropOfEveryNode(collection, propObj) {
	collection.forEach(node => Object.assign(node, propObj));
}

function checkValidity(num) {
	return isFinite(num) && !isNaN(num) && num >= 0;
}
function NodePropertiesField({ label, initialValue, onChange, unit }) {
	const [value, setValue] = useState(initialValue);
	const [valid, setValid] = useState(checkValidity(initialValue));
	return React.createElement(
		'fieldset',
		{ className: valid ? 'valid' : 'invalid' },
		React.createElement('legend', {}, label),
		React.createElement('input', {
			type: 'number',
			value,
			onChange: event => {
				const val = parseFloat(event.target.value, 10);

				setValue(val);
				setValid(checkValidity(val));

				if (!isFinite(val) || isNaN(value)) {
					return;
				}

				onChange(val);
			}
		}),
		React.createElement('label', {}, unit)
	);
}
export function NodePropertiesForm() {
	const { collection } = useCanvasContext();

	return React.createElement(
		React.Fragment,
		{},
		React.createElement(
			'form',
			{},
			React.createElement(NodePropertiesField, {
				label: 'Near',
				initialValue: 40,
				unit: 'px',
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, { radiusNear: value })
				)
			}),
			React.createElement(NodePropertiesField, {
				label: 'Far',
				initialValue: 700,
				unit: 'px',
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, { radiusFar: value })
				)
			}),
			React.createElement(NodePropertiesField, {
				label: 'Falloff',
				unit: 'px',
				initialValue: 800,
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, { radiusFalloff: value })
				)
			}),
			React.createElement(NodePropertiesField, {
				label: 'Attract',
				initialValue: 1,
				unit: '%',
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, { attractionForceMultiplier: value / 100 })
				)
			}),
			React.createElement(NodePropertiesField, {
				label: 'Repulse',
				initialValue: 1,
				unit: '%',
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, { repulsionForceMultiplier: value / 100 })
				)
			}),
			React.createElement(NodePropertiesField, {
				label: 'Friction',
				initialValue: 5,
				unit: '%',
				onChange: useCallback(value =>
					changePropOfEveryNode(collection, {
						frictionForceMultiplier: (100 - value) / 100
					})
				)
			})
		)
	);
}
