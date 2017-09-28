# AppState

A simple state manager for React.

## Installation

    npm install --save react-app-state

## Usage

Instantiate a state manager:

    import AppState from 'react-app-state';

    let fooState = new AppState();
    export default fooState;

If a component wants to update the state, it calls `set` method passing the variables to be changed:

    import React from 'react';
    import fooState from './fooState';

    const InputComponent = () => (
      <div>
        Name:
        <input type="text"
          onChange={ev =>
            fooState.set({
              myName: ev.target.value
            })
          }>
      </div>
    );

    export default InputComponent;

If a component wants to consume the state, it subscribes to the variables it wants to receive by calling `subscribe`, which returns a [HOC](https://facebook.github.io/react/docs/higher-order-components.html). The subscribed variables come via `props`:

    import React from 'react';
    import fooState from './fooState';

    const DisplayComponent = (props) => (
      <div>
        My name is {props.myName}.
      </div>
    );

    export default fooState.subscribe(DisplayComponent, 'myName');

## With a wrapper

We can have an ordinary class to take care of the `set` calls, maybe enforcing a business rule:

    import AppState from 'react-app-state';

    class NameOwner {
      constructor() {
        this.ourState = new AppState({ myName: 'Sr. Doe' });
        // here we defined an initial value, this is optional
      }
      chooseMyName(name) {
        this.ourState.set({ myName: 'Sr. ' + name });
      }
      subscribe(TheComponent) {
        return this.ourState.subscribe(TheComponent, 'myName');
      }
    }

    export default new NameOwner();

And now we update the state like this:

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

And consume...

    import React from 'react';
    import nameOwner from './nameOwner';

    const DisplayComponent = (props) => (
      <div>
        My name is {props.myName}.
      </div>
    );

    export default nameOwner.subscribe(DisplayComponent);

And there's also a `get` method to retrieve a variable imperatively, if you ever need:

    let name = nameOwner.get('myName');
