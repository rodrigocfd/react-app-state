# AppState

A simple state manager for React.

* [Installation](#installation)
* [Usage](#usage)
* [Extending AppState](#extending-appstate)
* [Computed values](#computed-values)
* [Multiple subscriptions](#multiple-subscriptions)
* [Full API documentation](#full-api-documentation)

## Installation

AppState is intended to be 100% compatible with [create-react-app](https://github.com/facebookincubator/create-react-app#readme). No need to "eject" or install anything but AppState itself:

    npm install --save react-app-state

## Usage

Instantiate an AppState manager and initialize the variables it will keep:

    // --- fooState.js ---
    import AppState from 'react-app-state';

    let fooState = new AppState({ myName: '' });
    export default fooState;

If a component wants to update the state, it calls `set` method passing the variables to be updated:

    // --- InputComponent.js ---
    import React from 'react';
    import fooState from './fooState';

    const InputComponent = () => (
      <div>
        Name:
        <input type="text"
          onChange={ev =>
            fooState.set({ myName: ev.target.value })
          }/>
      </div>
    );

    export default InputComponent;

If a component wants to consume the state, it calls `subscribe`, which returns a [HOC](https://facebook.github.io/react/docs/higher-order-components.html). The subscribed variables then come through `props`:

    // --- DisplayComponent.js ---
    import React from 'react';
    import fooState from './fooState';

    const DisplayComponent = ({ myName }) => (
      <div>
        My name is {myName}.
      </div>
    );

    export default fooState.subscribe(DisplayComponent);

## Extending AppState

Extending AppState is useful to enforce business logic, or just to add a layer over the raw stored values.

    // --- nameOwner.js ---
    import AppState from 'react-app-state';

    class NameOwner extends AppState {
      constructor() {
        super({ myName: 'Mr. Doe' });
      }

      chooseMyName(name) {
        super.set({ myName: 'Mr. ' + name });
      }
    }

    export default new NameOwner();

Updating the state:

    // --- InputComponent.js ---
    import React from 'react';
    import nameOwner from './nameOwner';

    const InputComponent = () => (
      <div>
        Name:
        <input type="text"
          onChange={ev =>
            nameOwner.chooseMyName(ev.target.value)
          }>
      </div>
    );

    export default InputComponent;

And consuming:

    // --- DisplayComponent.js ---
    import React from 'react';
    import nameOwner from './nameOwner';

    const DisplayComponent = ({ myName }) => (
      <div>
        My name is {myName}.
      </div>
    );

    export default nameOwner.subscribe(DisplayComponent);

## Computed values

Extending AppState is also useful to provide computed values. Taking the previous example, we could choose to store `myName` as typed by the user and have a method to return the computed string:

    // --- nameOwner.js ----
    import AppState from 'react-app-state';

    class NameOwner extends AppState {
      constructor() {
        super({ myName: '' });
      }

      get prettyName() { // a getter, could be an ordinary function too
        return 'Mr. ' + super.get('myName');
      }

      chooseMyName(name) { // could also be a setter
        super.set({ myName: name });
      }
    }

    export default new NameOwner();

Consuming the computed value:

    // --- DisplayComponent.js ---
    import React from 'react';
    import nameOwner from './nameOwner';

    const DisplayComponent = () => (
      <div>
        My name is {nameOwner.prettyName}.
      </div>
    );

    export default nameOwner.subscribe(DisplayComponent);

## Multiple subscriptions

A component can subscribe to any number of AppState managers. Since `subscribe` returns a component, just chain the calls:

    nameOwner.subscribe(
      anotherState.subscribe(
        yetAnotherManager.subscribe(DisplayComponent)
      )
    );

The component will receive the variables of all those managers via `props`. Just beware name collisions: if two variables have the same name, the last one will prevail.

## Full API documentation

`AppState(propsAndValues)` – constructor. Instantiates AppState and initializes the values to be kept.

`AppState.subscribe(WrappedComponent)` – subscribes a component to the state manager instance. The component will receive the variables through its `props`. A component can subscribe to any number of AppState instances.

`AppState.get(propName)` – retrieves a value imperatively. Usually you don't need this, most of the time `props` is enough.

`AppState.set(propsAndValues, callback)` – updates the internal state, propagating the new values to the subscribed components. The 1st argument contains the values to be updated. The 2nd argument is a callback to be called after the state is set, just like an ordinary `setState` call works.
