/// <reference path="../src/typings/tsd.d.ts" />
declare module chrome {
    module extension {
        function getURL(file: string): string;
    }
}
interface Docs {
    pads: Doc[];
}
interface FolderData {
    folder?: Folder;
    parentFolders?: Folder[];
}
interface Folder {
    name: string;
    encryptedId: string;
    parentFolderId?: string;
}
interface Doc {
    folderData?: FolderData;
    url: string;
    title: string;
    localPadId: string;
    isFavorite: boolean;
}
declare function buildupSidemenu(): void;
