import * as $ from 'jquery';

export enum Type {FOLDER, DOCUMENT}
export enum GTD {INBOX = 2, SNOOZED = 1, NONE = 0}

export interface FolderData {
  folder?: Folder;
  parentFolders?: Folder[];
}

export interface Folder {
  name: string;
  encryptedId: string;
  parentFolderId?: string;
  children?: Doc[];
}

export interface Doc {
  folderData?: FolderData;
  title: string;
  url: string;
  localPadId: string;
  isFavorite: boolean;
}

export interface Item {
  title: string;
  url: string;
  type: Type;
  isFavorite: boolean;
  isUnimportant: boolean;
  progress: number;
  // isCurrent: boolean;
  children?: Item[];
  gtd: GTD;
  depth?: number;
  parent?: Item;
}

export interface ActionTitle {
  title: string;
  gtd: GTD;
  unimportant: boolean;
  progress: number;
}

function parseActionTitle(title: string): ActionTitle {
  const tags: RegExp[] = [
    /(#inbox|#i)/,
    /(#snoozed|#s)/,
    /(#-1)/,
    /(#[0-9]+%)/
  ];
  
  const values: string[] = tags.map((test: RegExp) => {
    if (test.test(title)) return test.exec(title)[0];
    return null;
  });
  
  tags.forEach((test) => title = title.replace(test, ''));
  title = title.replace(/^\s+|\s+$/gi, '');
  
  const p: string = values[3];
  
  const gtd: GTD = (values[0]) ? GTD.INBOX : (values[1]) ? GTD.SNOOZED : GTD.NONE;
  const unimportant: boolean = values[2] !== null;
  const progress: number = (p) ? Number(p.substring(1, p.length - 1)) / 100 : NaN;
  
  return {title, gtd, unimportant, progress};
}

function compareByName(a: Item, b: Item): number {
  if ((a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
    return a.title > b.title ? 1 : -1;
  } else if (a.isFavorite || b.isUnimportant) {
    return -1;
  } else if (a.isUnimportant || b.isFavorite) {
    return 1;
  }
  return a.title > b.title ? 1 : -1;
}

function compareByValue(a: Item, b: Item): number {
  if ((a.gtd === b.gtd) && (a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
    return a.title > b.title ? 1 : -1;
  } else if (a.isFavorite || b.isUnimportant || a.gtd > b.gtd) {
    return -1;
  } else if (a.isUnimportant || b.isFavorite || a.gtd < b.gtd) {
    return 1;
  }
  return a.title > b.title ? 1 : -1;
}

export interface Index {
  inbox: Item[];
  snoozed: Item[];
  favorited: Item[];
  unimportants: Item[];
  uncategorized: Item[];
  folders: Item[];
  documents: Item[];
}

export function get(): Promise<Index> {
  return new Promise<Index>(resolve => {
    $.get('/folder/list', (folders: {data: {folder: Folder, inSidebar: boolean}[]}) => {
      // fetch('/folder/list', {mode: 'no-cors'})
      //   .then(res => {
      //     console.log('Index.ts..()', res);
      //     return res.json()
      //   })
      //   .then((folders: {data: {folder: Folder, inSidebar: boolean}[]}) => {
      const favoriteFolders: string[] = [];
      const requests: JQueryXHR[] = [$.get('/ep/internal/padlist/?filter=2')];
      
      folders.data.forEach(data => {
        if (data.inSidebar) favoriteFolders.push(data.folder.encryptedId);
        requests.push($.get(`/ep/internal/padlist/?q=&folderId=${data.folder.encryptedId}`));
      });
      
      $.when(...requests).done((...docsList) => {
        const exists: {[padId: string]: boolean} = {};
        const index: Index = {
          inbox: [],
          snoozed: [],
          favorited: [],
          unimportants: [],
          uncategorized: [],
          folders: [],
          documents: []
        };
        const categorized: {[folder: string]: Item[]} = {};
        const folderInfo: {[folderName: string]: Folder} = {};
        
        docsList.forEach(item => {
          const pads: Doc[] = item[0]['pads'];
          if (!pads || pads.length === 0) return;
          
          pads.forEach((doc: Doc) => {
            if (exists[doc.localPadId]) return;
            exists[doc.localPadId] = true;
            
            const actionTitle: ActionTitle = parseActionTitle(doc.title);
            
            const item: Item = {
              title: actionTitle.title,
              url: doc.url,
              type: Type.DOCUMENT,
              isFavorite: doc.isFavorite,
              isUnimportant: actionTitle.unimportant,
              progress: actionTitle.progress,
              gtd: actionTitle.gtd,
            };
            
            switch (actionTitle.gtd) {
              case GTD.INBOX:
                index.inbox.push(item);
                break;
              case GTD.SNOOZED:
                index.snoozed.push(item);
                break;
            }
            
            if (item.isFavorite) index.favorited.push(item);
            if (item.isUnimportant) index.unimportants.push(item);
            
            if (doc.folderData && doc.folderData.folder) {
              const folderName: string = doc.folderData.folder.name;
              if (!categorized[folderName]) {
                folderInfo[folderName] = doc.folderData.folder;
                categorized[folderName] = [];
              }
              categorized[folderName].push(item);
            } else {
              index.uncategorized.push(item);
            }
          });
        });
        
        for (let folderName in categorized) {
          if (categorized.hasOwnProperty(folderName)) {
            const actionTitle: ActionTitle = parseActionTitle(folderName);
            const folder: Folder = folderInfo[folderName];
            
            let item: Item = {
              title: actionTitle.title,
              url: `/folder/show/${folder.encryptedId}`,
              type: Type.FOLDER,
              isFavorite: favoriteFolders.indexOf(folder.encryptedId) > -1,
              isUnimportant: actionTitle.unimportant,
              progress: actionTitle.progress,
              gtd: actionTitle.gtd,
              children: categorized[folderName]
            };
            
            index.documents.push(item);
            
            item = {
              title: actionTitle.title,
              url: `/folder/show/${folder.encryptedId}`,
              type: Type.FOLDER,
              isFavorite: favoriteFolders.indexOf(folder.encryptedId) > -1,
              isUnimportant: actionTitle.unimportant,
              progress: actionTitle.progress,
              gtd: actionTitle.gtd
            };
            
            switch (actionTitle.gtd) {
              case GTD.INBOX:
                index.inbox.push(item);
                break;
              case GTD.SNOOZED:
                index.snoozed.push(item);
                break;
            }
            
            if (item.isFavorite) index.favorited.push(item);
            if (item.isUnimportant) index.unimportants.push(item);
            
            index.folders.push(item);
          }
        }
        
        index.inbox = index.inbox.sort(compareByName);
        index.snoozed = index.snoozed.sort(compareByName);
        index.favorited = index.favorited.sort(compareByName);
        index.unimportants = index.unimportants.sort(compareByName);
        index.uncategorized = index.uncategorized.sort(compareByValue);
        index.folders = index.folders.sort(compareByValue);
        index.documents = index.documents.sort(compareByValue);
        index.documents.forEach((folder: Item) => folder.children = folder.children.sort(compareByValue));
        index.documents.push({
          title: 'Uncategorized',
          url: '/docs',
          type: Type.FOLDER,
          isFavorite: false,
          isUnimportant: false,
          progress: NaN,
          gtd: GTD.NONE,
          children: index.uncategorized
        });
        
        resolve(index);
      });
      // });
    });
    
  });
}

export function observe(next: (index: Index) => void) {
  // console.log('Index.ts..observe()', chrome.storage, chrome.declarativeWebRequest);
  // chrome.webRequest.onCompleted.addListener((...args) => {
  //   console.log('Index.ts..()', args);
  // });
}