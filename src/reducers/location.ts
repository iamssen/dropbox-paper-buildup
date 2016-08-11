import {LocationAction, UPDATE_CURRENT_PATHNAME} from '../actions/location';

export const currentPathname = (state: string = window.location.pathname, action: LocationAction) => {
  if (action.type === UPDATE_CURRENT_PATHNAME) return action.pathname;
  return state;
}