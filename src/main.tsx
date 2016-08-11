/// <reference path="./typings.d.ts"/>
import {select} from 'd3-selection';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Store, combineReducers, createStore, applyMiddleware} from 'redux';
import {getOptionsFromStorage, Options, observeOptionsFromStorage} from './models/Options';
import {options} from './reducers/options';
import {update as updateOptions} from './actions/options';
import thunkMiddleware from 'redux-thunk';
import {Sidebar} from './components/Sidebar';
import {Style} from './components/Style';
import {get as getIndex, observe as observeIndex} from './models/Index';
import {update as updateIndex} from './actions/index';
import {inbox, snoozed, favorited, unimportants, uncategorized, folders, documents} from './reducers/index';
import {observe as observeLocation} from './models/Location';
import {currentPathname} from './reducers/location';
import {update as updatePathname} from './actions/location';

const reducers = {
  options,
  inbox,
  snoozed,
  favorited,
  unimportants,
  uncategorized,
  folders,
  documents,
  currentPathname,
};

interface State {
  options: Options;
}

document.addEventListener('DOMContentLoaded', () => {
  getOptionsFromStorage().then((options: Options) => {
    // create store
    const store: Store<State> = createStore<State>(
      combineReducers<State>(reducers), {options},
      applyMiddleware(thunkMiddleware)
    );
    
    // create sidebar component
    const sidebarContainer = select('.hp-sidebar-scroller')
      .insert('buildup-sidebar', ':first-child')
      .node();
    
    ReactDOM.render((
      <Provider store={store}>
        <Sidebar/>
      </Provider>
    ), sidebarContainer as Element);
    
    // create style component
    const styleContainer = select('head')
      .append('buildup-style')
      .node();
    
    ReactDOM.render((
      <Provider store={store}>
        <Style/>
      </Provider>
    ), styleContainer as Element);
    
    // observe options
    observeOptionsFromStorage((options: Options) => {
      //noinspection TypeScriptUnresolvedFunction
      store.dispatch(updateOptions(options, false));
    });
    
    // get documents
    getIndex().then(index => {
      //noinspection TypeScriptUnresolvedFunction
      store.dispatch(updateIndex(index));
      //noinspection TypeScriptUnresolvedFunction
      observeIndex(index => store.dispatch(updateIndex(index)));
    });
    
    observeLocation((pathname:string) => {
      //noinspection TypeScriptUnresolvedFunction
      store.dispatch(updatePathname(pathname));
    });
  });
});