/// <reference path="../src/typings/tsd.d.ts" />
declare enum Type {
    FOLDER = 0,
    DOCUMENT = 1,
}
interface FolderData {
    folder?: Folder;
    parentFolders?: Folder[];
}
interface Folder {
    name: string;
    encryptedId: string;
    parentFolderId?: string;
    children?: Doc[];
}
interface Doc {
    folderData?: FolderData;
    title: string;
    url: string;
    localPadId: string;
    isFavorite: boolean;
}
interface Section {
    title: string;
    items: Item[];
    disclosure: boolean;
}
interface Item {
    title: string;
    url: string;
    type: Type;
    isFavorite: boolean;
    isUnimportant: boolean;
    progress: number;
    isCurrent: boolean;
    children?: Item[];
    gtd: GTD2;
    depth?: number;
    parent?: Item;
}
declare function drawSidemenu(sections: Section[]): void;
declare enum GTD2 {
    INBOX = 2,
    SNOOZED = 1,
    NONE = 0,
}
declare const DISCLOSURE_PREFIX: string;
interface ActionTitle {
    title: string;
    gtd: GTD2;
    unimportant: boolean;
    progress: number;
}
declare function parseActionTitle(title: string): ActionTitle;
declare function compareByName(a: Item, b: Item): number;
declare function compareByValue(a: Item, b: Item): number;
declare function getSectionData(result: (sections: Section[]) => void): void;
