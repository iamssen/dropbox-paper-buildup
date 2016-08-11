import {Action} from 'redux';
import {Index} from '../models/Index';

export const UPDATE_INDEX: string = 'UPDATE_INDEX';

export interface IndexAction extends Action {
  index: Index;
}

export const update = (index: Index): IndexAction => ({
  type: UPDATE_INDEX,
  index
});