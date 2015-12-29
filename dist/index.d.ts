/// <reference path="../src/typings/tsd.d.ts" />
declare enum GTDTag {
    INBOX = 0,
    SNOOZED = 1,
    NONE = 2,
}
declare enum ValueTag {
    IMPORTANT = 0,
    UNIMPORTANT = 1,
    NONE = 2,
}
interface BuildupItem {
    buildup_title: string;
    buildup_GTDTag?: GTDTag;
    buildup_valueTag?: ValueTag;
}
interface FolderData {
    folder?: Folder;
    parentFolders?: Folder[];
    isFavorite?: boolean;
}
interface Folder {
    name: string;
    encryptedId: string;
    parentFolderId?: string;
    isFavorite?: boolean;
}
interface Doc extends BuildupItem {
    folderData?: FolderData;
    title: string;
    url: string;
    localPadId: string;
    isFavorite: boolean;
    buildup_isCurrent: boolean;
}
interface BuildupFolder extends BuildupItem {
    url?: string;
    docs: Doc[];
    isFavorite: boolean;
}
interface GTD {
    title: string;
    folders: BuildupFolder[];
    docs: Doc[];
}
interface Disclosure {
    Inbox: boolean;
    Snoozed: boolean;
    Documents: boolean;
}
declare const DISCLOSURE_KEY: string;
declare const DISCLOSURE_ATTR_KEY: string;
declare const DISCLOSURE_SIGN: string;
declare let disclosure: Disclosure;
declare function renderSidemenu(gtds: GTD[], folders: BuildupFolder[]): void;
declare function actionTagging(title: string, item: BuildupItem): void;
declare function compareItems(a: BuildupItem, b: BuildupItem): number;
declare function buildupSidemenu(): void;
