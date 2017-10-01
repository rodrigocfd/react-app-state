/**
 * A global state manager for React.
 * @author Rodrigo Cesar de Freitas Dias <rcesar@gmail.com>
 * @license MIT
 * @see https://github.com/rodrigocfd/react-app-state
 */

import React from 'react';

export default class AppState {
	constructor(propsAndValues) {
		this._propsAndValues = propsAndValues; // each prop with initial value
		this._components = []; // each subscribed component
		this._instanceCount = 0; // how many instances to call setState()
	}

	subscribe(WrappedComponent) {
		let component = {
			instances: { }, // AppStateSubscriber instances
			nextInstanceId: 0
		};
		this._components.push(component);
		let THIS = this; // so we can access it inside class below

		return class AppStateSubscriber extends React.Component {
			constructor(props) {
				super(props);
				this._instanceId = 'in' + (component.nextInstanceId++);
				component.instances[this._instanceId] = this; // store instance using ID as key
				++THIS._instanceCount;
				this.state = { ...THIS._propsAndValues }; // receive current values right away
			}

			componentWillUnmount() {
				--THIS._instanceCount;
				delete component.instances[this._instanceId]; // so set() won't dispatch to inexistent instance
			}

			render() {
				return <WrappedComponent {...this.props} {...this.state}/>;
			}
		}
	}

	get(propName) {
		if (!this._propsAndValues.hasOwnProperty(propName)) {
			throw new Error('Retrieving an inexistent prop: ' + propName);
		}
		return this._propsAndValues[propName];
	}

	set(propsAndValues, callback) {
		for (const propName of Object.keys(propsAndValues)) {
			if (!this._propsAndValues.hasOwnProperty(propName)) {
				throw new Error('Updating an inexistent prop: ' + propName);
			}
		}
		this._propsAndValues = { ...this._propsAndValues, ...propsAndValues }; // update internal store

		let asyncCallback = null;
		if (callback) {
			let instanceCount = this._instanceCount;
			asyncCallback = () => {
				if (--instanceCount === 0) {
					callback(); // user callback is fired after last setState() returns
				}
			};
		}

		for (const component of this._components) {
			for (const instanceId of Object.keys(component.instances)) {
				component.instances[instanceId].setState({ ...propsAndValues }, asyncCallback); // AppStateSubscriber.setState()
			}
		}
	}
}
