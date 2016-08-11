export interface Options {
  outfocusStrike?: boolean;
  tinyList?: boolean;
  enabledSidebarInbox?: boolean;
  enabledSidebarSnoozed?: boolean;
  enabledSidebarUnimportant?: boolean;
  enabledSidebarUncategorized?: boolean;
  enabledSidebarFolders?: boolean;
  enabledSidebarDocuments?: boolean;
  discloseSidebarInbox?: boolean;
  discloseSidebarSnoozed?: boolean;
  discloseSidebarUnimportant?: boolean;
  discloseSidebarUncategorized?: boolean;
  discloseSidebarFolders?: boolean;
  discloseSidebarDocuments?: boolean;
}

export const defaultOptions: Options = Object.freeze({
  outfocusStrike: true,
  tinyList: false,
  enabledSidebarInbox: true,
  enabledSidebarSnoozed: true,
  enabledSidebarUnimportant: false,
  enabledSidebarUncategorized: false,
  enabledSidebarFolders: true,
  enabledSidebarDocuments: false,
  discloseSidebarInbox: true,
  discloseSidebarSnoozed: true,
  discloseSidebarUnimportant: true,
  discloseSidebarUncategorized: true,
  discloseSidebarFolders: true,
  discloseSidebarDocuments: true,
})

export function getOptionsFromStorage(): Promise<Options> {
  return new Promise<Options>(resolve => {
    chrome.storage.local.get([
      'outfocusStrike',
      'tinyList',
      'enabledSidebarInbox',
      'enabledSidebarSnoozed',
      'enabledSidebarUnimportant',
      'enabledSidebarUncategorized',
      'enabledSidebarFolders',
      'enabledSidebarDocuments',
      'discloseSidebarInbox',
      'discloseSidebarSnoozed',
      'discloseSidebarUnimportant',
      'discloseSidebarUncategorized',
      'discloseSidebarFolders',
      'discloseSidebarDocuments',
    ], (options: Options) => {
      resolve(Object.freeze(Object.assign({}, defaultOptions, options)));
    })
  })
}

export function setOptionsToStorage(options: Options) {
  chrome.storage.local.set(options);
}

type Changes = {[key: string]: {newValue: any, oldValue: any}};

export function observeOptionsFromStorage(next: (options: Options) => void) {
  chrome.storage.onChanged.addListener((changes: Changes, storage: string) => {
    if (storage === 'local') {
      const newOptions: Options = Object.keys(changes).reduce((options: Object, key: string) => {
        options[key] = changes[key].newValue;
        return options;
      }, {});
      
      next(newOptions);
    }
  })
}