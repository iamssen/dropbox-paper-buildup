import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {OptionsComponent} from './components/Options';
import {createStore, applyMiddleware, Store, combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {getOptionsFromStorage, Options} from './models/Options';
import {options} from './reducers/options';

//const createLogger = require('redux-logger');
// , createLogger()
//const logger = store => next => action => {
//  console.log('????',  action);
//  return next(action);
//}

const reducers = {options};

interface State {
  options: Options;
}

getOptionsFromStorage().then((options: Options) => {
  const store: Store<State> = createStore<State>(
    combineReducers<State>(reducers), {options},
    applyMiddleware(thunkMiddleware)
  );
  
  ReactDOM.render((
    <Provider store={store}>
      <OptionsComponent/>
    </Provider>
  ), document.querySelector('#container'));
});

