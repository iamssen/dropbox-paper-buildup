import {Item} from '../models/Index';
import {IndexAction, UPDATE_INDEX} from '../actions/index';

export const inbox = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.inbox;
  return state;
}

export const snoozed = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.snoozed;
  return state;
}

export const favorited = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.favorited;
  return state;
}

export const unimportants = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.unimportants;
  return state;
}

export const uncategorized = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.uncategorized;
  return state;
}

export const folders = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.folders;
  return state;
}

export const documents = (state: Item[] = [], action: IndexAction) => {
  if (action.type === UPDATE_INDEX) return action.index.documents;
  return state;
}