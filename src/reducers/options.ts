import {Options, defaultOptions} from '../models/Options';
import {OptionsAction, UPDATE_OPTIONS} from '../actions/options';

export const options = (state: Options = defaultOptions, action: OptionsAction) => {
  if (action.type === UPDATE_OPTIONS) return Object.freeze(Object.assign({}, state, action.options));
  return state;
}