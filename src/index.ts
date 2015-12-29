//'use strict';
/// <reference path="typings/tsd.d.ts"/>

enum GTDTag { INBOX, SNOOZED, NONE }
enum ValueTag { IMPORTANT, UNIMPORTANT, NONE }

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
	name:string;
	encryptedId:string;
	parentFolderId?:string;
	isFavorite?:boolean;
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
	docs:Doc[];
	isFavorite:boolean;
}

interface GTD {
	title:string;
	folders:BuildupFolder[];
	docs:Doc[];
}

interface Disclosure {
	Inbox:boolean;
	Snoozed:boolean;
	Documents:boolean;
}

const DISCLOSURE_KEY:string = 'disclosure';
const DISCLOSURE_ATTR_KEY:string = 'disclosure-id';
const DISCLOSURE_SIGN:string = '...';

let disclosure:Disclosure = {
	Inbox: false,
	Snoozed: false,
	Documents: false
};

function renderSidemenu(gtds:GTD[], folders:BuildupFolder[]) {
	console.log(chrome.storage.local)

	let renderHeader = (selection:d3.Selection<string>) => {
		selection
			.classed('buildup-container-header', true)
			.html(d => {
				if (disclosure[d]) return `${d} <span class="buildup-container-header-disclosure-sign">${DISCLOSURE_SIGN}</span>`;
				return d;
			})
			.on('click', (d, i, o) => {
				let closed:boolean = !disclosure[d];
				let value:Object = {};
				disclosure[d] = closed;
				value[DISCLOSURE_KEY] = disclosure;
				chrome.storage.local.set(value);

				d3.select(selection[o][i])
					.html(() => {
						if (closed) return `${d} <span class="buildup-container-header-disclosure-sign">${DISCLOSURE_SIGN}</span>`;
						return d;
					});

				d3
					.select(`[${DISCLOSURE_ATTR_KEY}=${d}]`)
					.classed('buildup-container-disclosure-closed', closed);
			});
	};

	let renderItem = (selection:d3.Selection<BuildupItem>) => {
		selection
			.classed('buildup-container-doc-important', (item:BuildupItem) => item.buildup_valueTag === ValueTag.IMPORTANT)
			.classed('buildup-container-doc-unimportant', (item:BuildupItem) => item.buildup_valueTag === ValueTag.UNIMPORTANT)
	};

	let renderFolder = (selection:d3.Selection<BuildupFolder>) => {
		selection
			.classed('buildup-container-doc', true)
			.call(renderItem)
			.append('a')
			.html((folder:BuildupFolder) => {
				if (folder.isFavorite || folder.buildup_valueTag === ValueTag.IMPORTANT) return `<span class="buildup-container-doc-favorited">★</span> ${folder.buildup_title}`;
				return `<span class="buildup-container-doc-unfavorited">☆</span> ${folder.buildup_title}`;
			})
			.attr('href', (folder:BuildupFolder) => folder.url);
	};

	let renderDoc = (selection:d3.Selection<Doc>) => {
		selection
		//.attr('pad-id', (doc:Doc) => doc.localPadId)
			.classed('buildup-container-doc', true)
			.classed('buildup-container-doc-selected', (doc:Doc) => doc.buildup_isCurrent)
			.call(renderItem)
			.append('a')
			.html((doc:Doc) => {
				if (doc.isFavorite || doc.buildup_valueTag === ValueTag.IMPORTANT) return `<span class="buildup-container-doc-favorited">★</span> ${doc.buildup_title}`;
				return `<span class="buildup-container-doc-unfavorited">☆</span> ${doc.buildup_title}`;
			})
			.attr('href', (doc:Doc) => doc.url);
	};

	d3.select('.buildup-container').remove();

	let buildupContainer = d3.select('.hp-sidebar-scroller')
		//.append('div')
		.insert('div', ':first-child')
		.classed('buildup-container', true);

	gtds.forEach(gtd => {
		buildupContainer
			.append('h4')
			.datum(gtd.title)
			.call(renderHeader);

		let ul = buildupContainer
			.append('ul')
			.attr(DISCLOSURE_ATTR_KEY, gtd.title)
			.classed('buildup-container-disclosure-closed', disclosure[gtd.title])
			.classed('buildup-container-docs', true);

		if (gtd.folders.length > 0) {
			gtd.folders.forEach((folder:BuildupFolder) => {
				ul
					.append('li')
					.datum(folder)
					.call(renderFolder);
			});
		}

		if (gtd.docs.length > 0) {
			gtd.docs.forEach((doc:Doc) => {
				ul
					.append('li')
					.datum(doc)
					.call(renderDoc);
			});
		}
	});

	buildupContainer
		.append('h4')
		.datum('Documents')
		.call(renderHeader);

	buildupContainer
		.append('ul')
		.attr(DISCLOSURE_ATTR_KEY, 'Documents')
		.classed('buildup-container-disclosure-closed', disclosure.Documents)
		.classed('buildup-container-folders', true)
		.selectAll('li')
		.data(folders)
		.enter()
		.append('li')
		.classed('buildup-container-folder', true)
		.classed('buildup-container-folder-important', (folder:BuildupFolder) => folder.buildup_valueTag === ValueTag.IMPORTANT)
		.classed('buildup-container-folder-unimportant', (folder:BuildupFolder) => folder.buildup_valueTag === ValueTag.UNIMPORTANT)
		.html((folder:BuildupFolder) => {
			if (folder.url) return `<h5><a href="${folder.url}">${folder.buildup_title}</a></h5>`;
			return `<h5>${folder.buildup_title}</h5>`;
		})
		.append('ul')
		.classed('buildup-container-docs', true)
		.selectAll('li')
		.data((folder:BuildupFolder) => folder.docs)
		.enter()
		.append('li')
		.call(renderDoc)

	//.on('contextmenu', (doc:Doc, i:number, o:number) => {
	//	console.log('!!! contextmenu', doc, i, o);
	//	(d3.event as Event).preventDefault();
	//	(d3.event as Event).stopPropagation();
	//	(d3.event as Event).stopImmediatePropagation();
	//
	//	buildupMoveToFolder(doc, i, o, (d3.event as Event).target);
	//})
}

function actionTagging(title:string, item:BuildupItem) {
	const TEST_TAG:RegExp[] = [
		/(#inbox|#i)/,
		/(#snoozed|#s)/,
		/(#\+1)/,
		/(#\-1)/
	];

	let checked:boolean[] = TEST_TAG.map<boolean>((test:RegExp) => {
		if (test.test(title)) {
			title = title.replace(test, '');
			return true;
		}
		return false;
	});

	if (checked[0]) {
		item.buildup_GTDTag = GTDTag.INBOX;
	} else if (checked[1]) {
		item.buildup_GTDTag = GTDTag.SNOOZED;
	} else {
		item.buildup_GTDTag = GTDTag.NONE;
	}

	if (checked[2]) {
		item.buildup_valueTag = ValueTag.IMPORTANT;
	} else if (checked[3]) {
		item.buildup_valueTag = ValueTag.UNIMPORTANT;
	} else {
		item.buildup_valueTag = ValueTag.NONE;
	}

	item.buildup_title = title;
}

function compareItems(a:BuildupItem, b:BuildupItem):number {
	if (a.buildup_valueTag === b.buildup_valueTag) {
		return a.buildup_title > b.buildup_title ? 1 : -1;
	} else if (a.buildup_valueTag === ValueTag.IMPORTANT || b.buildup_valueTag === ValueTag.UNIMPORTANT) {
		return -1;
	} else if (a.buildup_valueTag === ValueTag.UNIMPORTANT || b.buildup_valueTag === ValueTag.IMPORTANT) {
		return 1;
	}
	return a.buildup_title > b.buildup_title ? 1 : -1;
}

function buildupSidemenu() {
	$.get('/folder/list', (folders:{data:{folder:Folder}[]}) => {
		let deferreds:any[] = [
			$.get('/ep/internal/padlist/?filter=2')
		];

		folders.data.forEach(data => {
			deferreds.push($.get(`/ep/internal/padlist/?q=&folderId=${data.folder.encryptedId}`));
		});

		$.when(...deferreds).done((...docsList) => {
			let location:string = window.location.href;

			// collect docs
			let inboxDocs:Doc[] = [];
			let snoozedDocs:Doc[] = [];
			let docs:Doc[] = [];
			let exists:{[padId:string]:boolean} = {};

			docsList.forEach(item => {
				let pads:Doc[] = item[0]['pads'];
				if (!pads || pads.length == 0) return;

				pads.forEach((doc:Doc) => {
					if (exists[doc.localPadId]) return;

					doc.buildup_isCurrent = location.indexOf(doc.localPadId) > -1;

					docs.push(doc);
					exists[doc.localPadId] = true;

					actionTagging(doc.title, doc);

					switch (doc.buildup_GTDTag) {
						case GTDTag.INBOX:
							inboxDocs.push(doc);
							break;
						case GTDTag.SNOOZED:
							snoozedDocs.push(doc);
							break;
					}
				});
			});

			// categorize docs
			let inboxFolders:BuildupFolder[] = [];
			let snoozedFolders:BuildupFolder[] = [];
			let categorized:{[folder:string]:Doc[]} = {};
			let uncategorized:Doc[] = [];
			let folderInfo:{[folder:string]:Folder} = {};

			docs.forEach((doc:Doc) => {
				if (doc.folderData && doc.folderData.folder) {
					let folderName:string = doc.folderData.folder.name;
					if (!categorized[folderName]) {
						let folder:Folder = doc.folderData.folder;
						folder.isFavorite = doc.folderData.isFavorite;
						folderInfo[folderName] = folder;
						categorized[folderName] = [];
					}
					categorized[folderName].push(doc);
				} else {
					uncategorized.push(doc);
				}
			});

			let folders:BuildupFolder[] = [];

			for (let folderName in categorized) {
				if (categorized.hasOwnProperty(folderName)) {
					let folder:BuildupFolder = {
						buildup_title: folderName,
						url: `/folder/show/${folderInfo[folderName].encryptedId}`,
						docs: categorized[folderName],
						isFavorite: folderInfo[folderName].isFavorite
					};

					folders.push(folder);

					actionTagging(folderName, folder);

					switch (folder.buildup_GTDTag) {
						case GTDTag.INBOX:
							inboxFolders.push(folder);
							break;
						case GTDTag.SNOOZED:
							snoozedFolders.push(folder);
							break;
					}
				}
			}

			// sort folders and docs
			inboxDocs = inboxDocs.sort(compareItems);
			snoozedDocs = snoozedDocs.sort(compareItems);
			inboxFolders = inboxFolders.sort(compareItems);
			snoozedFolders = snoozedFolders.sort(compareItems);

			folders = folders.sort(compareItems);
			folders.forEach(folder => folder.docs = folder.docs.sort(compareItems));
			uncategorized = uncategorized.sort(compareItems);

			// generate render data
			let gtds:GTD[] = [];

			if (inboxFolders.length > 0 || inboxDocs.length > 0) {
				gtds.push({
					title: 'Inbox',
					folders: inboxFolders,
					docs: inboxDocs
				});
			}

			if (snoozedFolders.length > 0 || snoozedDocs.length > 0) {
				gtds.push({
					title: 'Snoozed',
					folders: snoozedFolders,
					docs: snoozedDocs
				})
			}

			folders.push({
				buildup_title: 'Uncategorized',
				docs: uncategorized,
				buildup_GTDTag: GTDTag.NONE,
				buildup_valueTag: ValueTag.NONE,
				isFavorite: false
			});

			// render
			renderSidemenu(gtds, folders);
		});
	});
}

//----------------------------------------------------------------
// Entry point
//----------------------------------------------------------------
$(document).ready(() => {
	// inject style sheet
	['dist/index.css'].forEach((file:string) => {
		d3
			.select('head')
			.append('link')
			.attr({
				rel: 'stylesheet',
				type: 'text/css',
				href: chrome.extension.getURL(file)
			});
	});

	chrome.storage.local.get(DISCLOSURE_KEY, (value) => {
		if (value[DISCLOSURE_KEY]) {
			disclosure = value[DISCLOSURE_KEY];
		} else {
			let value:Object = {};
			value[DISCLOSURE_KEY] = disclosure;
			chrome.storage.local.set(value);
		}
		buildupSidemenu();
	});


	// TODO Refresh list - find api to detect location change
	//window.onpopstate = function (event) {
	//	console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
	//};
});

//----------------------------------------------------------------
// TODO Right-click move to folder action - need collect request header values and xsrf
//----------------------------------------------------------------
//function buildupMoveToFolder(doc:Doc, i:number, o:number, target:EventTarget) {
//	let targetBound:ClientRect = (target as Element).getBoundingClientRect();
//	let x:number = targetBound.right - 10;
//
//	$.get('/folder/list', (folders:{data:{folder:Folder}[]}) => {
//		let container = d3.select('body')
//			.append('div')
//			.classed('buildup-move2folder', true)
//
//		container.selectAll('a')
//			.data(folders.data)
//			.enter()
//			.append('a')
//			.classed('buildup-move2folder-folder', true)
//			.datum(data => data.folder)
//			.text((folder:Folder) => folder.name)
//			.on('click', (folder:Folder) => {
//				$.post(
//					'/folder/set-pad-folder',
//					{padId: doc.localPadId, folderId: folder.encryptedId, xsrf: 'mksKuwGkuk5c71H8Z7P8HR'},
//					(res) => console.log(res)
//				);
//
//				//chrome.cookies.get('xsrf', (cookie) => {
//				//	console.log(`!!! move to folder → padId=${doc.localPadId} folderId:${folder.encryptedId} xsrf:${window.document.cookie['xsrf']}`, doc, folder, cookie);
//				//})
//			})
//
//		let bound = $(container.node());
//		let h:number = bound.height();
//		let x:number = targetBound.right - 10;
//		let y:number = targetBound.bottom - (targetBound.height / 2) - (h / 2);
//
//		container.style({
//			left: `${x}px`,
//			top: `${y}px`
//		})
//
//		d3.select('body').on('click', () => container.remove());
//		setTimeout(() => container.remove(), 5000);
//	});
//}