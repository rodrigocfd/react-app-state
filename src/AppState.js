/**
 * A global state manager for React.
 * @author Rodrigo Cesar de Freitas Dias <rcesar@gmail.com>
 * @license MIT
 * @see https://github.com/rodrigocfd/react-app-state
 */

import 'babel-polyfill';
import React from 'react';

/* INTERNAL STRUCTURE LOOKS LIKE THIS:
this._variables = {
	"variable": { // a variable being subscribed to
		components: {
			"componentId": { // a component which subscribed to this variable
				instances: {
					"instanceId": AppStateSubscriber // an instance that must receive props
				}
			}
		},
		value: { ... } // current value for this variable
	],
	"anotherVariable": { ... }
};
*/

export default class AppState {
	// Instantiates a new class, optionally setting initial values.
	// new AppState({ myName:'foo' });
	constructor(initialState) {
		this._nextComponentId = 0; // these are supposed to be private...
		this._variables = { };     // ...if you mess with them, you're looking for trouble

		if (initialState) {
			this.set(initialState);
		}
	}

	// Updates one or more values.
	// set({ myName:'foo', mySurname:'bar' }, () => alert('done!'));
	set(userVars, callback) {
		let uniqueComponents = { }; // components that subscribed to a variable that user is updating
		let uniqueStates = { }; // unique state values to send to each component
		let instanceCount = 0; // how many instances are to be notified summing all components
		let subscriptionsHappened = (Object.keys(this._variables).length > 0); // component parsing/subscription already happened?

		for (const userVar of Object.keys(userVars)) { // each variable the user wants to update
			let variable = this._variables[userVar]; // a subscribed variable
			if (!variable) {
				if (subscriptionsHappened) {
					throw new Error('Updating a variable that no component has subscribed to: ' + userVar);
				} else { // probably an initial value being set in a controller class
					variable = { components: { } };
					this._variables[userVar] = variable; // create new entry
				}
			}
			variable.value = userVars[userVar]; // store new value for variable

			for (const componentId of Object.keys(variable.components)) { // components subscribed to this variable
				if (!uniqueComponents[componentId]) { // not added yet?
					uniqueComponents[componentId] = variable.components[componentId];
					uniqueStates[componentId] = { }; // will be passed to setState()
					instanceCount += Object.keys(uniqueComponents[componentId].instances).length;
				}
				uniqueStates[componentId][userVar] = userVars[userVar]; // add the variable that will be sent to instance
			}
		}

		let asyncDispatch = () => {
			if (callback && --instanceCount === 0) {
				callback(); // user callback is fired after the last setState() returns
			}
		};

		for (const componentId of Object.keys(uniqueComponents)) {
			let compToGo = uniqueComponents[componentId];
			let stateToGo = uniqueStates[componentId];
			for (const instanceId of Object.keys(compToGo.instances)) {
				compToGo.instances[instanceId].setState(stateToGo, // notify each instance with variables it subscribed to
					asyncDispatch); // callback asynchronous behavior just like setState()
			}
		}
	}

	// Retrieve one value imperatively.
	// get('myName');
	get(userVar) {
		return this._variables[userVar] ?
			this._variables[userVar].value : undefined;
	}

	// Subscribes a component to one or more variables, returns a HOC.
	// subscribe(MyComponent, 'myName', 'mySurname')
	subscribe(WrappedComponent, ...subscribedVars) {
		let componentId = 'co' + (this._nextComponentId++);
		let component = {
			instances: { },
			nextInstanceId: 0
		};

		for (const subsVar of subscribedVars) {
			if (!this._variables[subsVar]) { // no component subscribed to this variable yet?
				this._variables[subsVar] = { components: { } }; // create new entry
			}
			this._variables[subsVar].components[componentId] = component; // store component using componentId as key
		}

		let allVariables = this._variables; // so we can access this._variables inside AppStateSubscriber class below

		return class AppStateSubscriber extends React.Component {
			constructor(props) {
				super(props);
				this._instanceId = 'in' + (component.nextInstanceId++);
				component.instances[this._instanceId] = this; // store instance using instanceId as key
				let stateValues = { };

				for (const subsVar of subscribedVars) {
					if (allVariables[subsVar].value) { // a set() was already called on this variable?
						stateValues[subsVar] = allVariables[subsVar].value; // instance receives saved value right away
					}
				}
				this.state = stateValues; // will be passed to child props in render()
			}

			componentWillUnmount() {
				delete component.instances[this._instanceId]; // so set() won't dispatch to an inexistent object
			}

			render() {
				let allProps = { ...this.props, ...this.state }; // set() triggers this.state change, we add into wrapped's props
				return <div><WrappedComponent {...allProps}/></div>;
			}
		}
	}
}
