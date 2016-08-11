import {Action} from 'redux';
import {Options, setOptionsToStorage} from '../models/Options';

export const UPDATE_OPTIONS: string = 'UPDATE_OPTIONS';

export interface OptionsAction extends Action {
  options: Options;
}

export const update = (options: Options, writeToStorage: boolean = true): OptionsAction => {
  if (writeToStorage) setOptionsToStorage(options);
  return {
    type: UPDATE_OPTIONS,
    options
  }
}

export const updateOutfocusStrike = (outfocusStrike: boolean) => update({outfocusStrike});
export const updateTinyList = (tinyList: boolean) => update({tinyList});
export const updateEnabledSidebarInbox = (enabledSidebarInbox: boolean) => update({enabledSidebarInbox});
export const updateEnabledSidebarSnoozed = (enabledSidebarSnoozed: boolean) => update({enabledSidebarSnoozed});
export const updateEnabledSidebarUnimportant = (enabledSidebarUnimportant: boolean) => update({enabledSidebarUnimportant});
export const updateEnabledSidebarUncategorized = (enabledSidebarUncategorized: boolean) => update({enabledSidebarUncategorized});
export const updateEnabledSidebarFolders = (enabledSidebarFolders: boolean) => update({enabledSidebarFolders});
export const updateEnabledSidebarDocuments = (enabledSidebarDocuments: boolean) => update({enabledSidebarDocuments});
export const updateDiscloseSidebarInbox = (discloseSidebarInbox: boolean) => update({discloseSidebarInbox});
export const updateDiscloseSidebarSnoozed = (discloseSidebarSnoozed: boolean) => update({discloseSidebarSnoozed});
export const updateDiscloseSidebarUnimportant = (discloseSidebarUnimportant: boolean) => update({discloseSidebarUnimportant});
export const updateDiscloseSidebarUncategorized = (discloseSidebarUncategorized: boolean) => update({discloseSidebarUncategorized});
export const updateDiscloseSidebarFolders = (discloseSidebarFolders: boolean) => update({discloseSidebarFolders});
export const updateDiscloseSidebarDocuments = (discloseSidebarDocuments: boolean) => update({discloseSidebarDocuments});