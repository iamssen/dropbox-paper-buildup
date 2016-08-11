import {Action} from 'redux';

export const UPDATE_CURRENT_PATHNAME: string = 'UPDATE_CURRENT_PATHNAME';

export interface LocationAction extends Action {
  pathname: string;
}

export const update = (pathname: string): LocationAction => ({
  type: UPDATE_CURRENT_PATHNAME,
  pathname
});