//'use strict';
/// <reference path="typings/tsd.d.ts"/>

enum Type {FOLDER, DOCUMENT}

interface FolderData {
	folder?: Folder;
	parentFolders?: Folder[];
}

interface Folder {
	name:string;
	encryptedId:string;
	parentFolderId?:string;
	children?: Doc[];
}

interface Doc {
	folderData?: FolderData;
	title: string;
	url: string;
	localPadId: string;
	isFavorite: boolean;
}

//----------------------------------------------------------------
// Common
//----------------------------------------------------------------
interface Section {
	title: string;
	items: Item[];
	disclosure: boolean;
}

interface Item {
	title:string;
	url:string;
	type:Type;
	isFavorite:boolean;
	isUnimportant:boolean;
	progress:number;
	isCurrent:boolean;
	children?:Item[];
	gtd: GTD2;
	depth?:number;
	parent?:Item;
}

//----------------------------------------------------------------
// Render
//----------------------------------------------------------------
function drawSidemenu(sections:Section[]) {
	sections = sections.filter((section:Section) => section.items && section.items.length > 0);

	const hierarchy = d3.layout.hierarchy();

	d3.select('.buildup-sidemenu').remove();

	const container = d3.select('.hp-sidebar-scroller')
		.insert('div', ':first-child')
		.attr('class', 'buildup-sidemenu')

	const section = container
		.selectAll('div')
		.data(sections)
		.enter()
		.append('div')
		.attr('class', 'section')

	section
		.append('h1')
		.html((section:Section) => `${section.title} <img src="${chrome.extension.getURL('static/section.close.svg')}"/>`)
		.attr('section-id', (section:Section) => section.title)
		.classed('section-hide', (section:Section) => !section.disclosure)
		.classed('section-title', true)
		.on('click', function (section:Section) {
			let h1 = d3.select(this);
			let ul = d3.select(`ul[section-id='${section.title}']`);

			let disclosure:boolean = h1.classed('section-hide');

			h1.classed('section-hide', !disclosure);
			ul.classed('section-hide', !disclosure);

			let value:{[key:string]:boolean} = {};
			value[DISCLOSURE_PREFIX + section.title] = disclosure;
			chrome.storage.local.set(value);
		})

	const li = section
		.append('ul')
		.attr('section-id', (section:Section) => section.title)
		.classed('section-hide', (section:Section) => !section.disclosure)
		.selectAll('li')
		.data((section:Section) => hierarchy({children: section.items}).slice(1))
		.enter()
		.append('li')

	li
		.filter((item:Item) => item.type === Type.FOLDER && item.children && item.children.length > 0)
		.attr('class', (item:Item) => {
			let classes:string[] = ['item-group'];
			if (item.isUnimportant) classes.push('item-unimportant');
			return classes.join(' ');
		})
		.html((item:Item) => {
			return `<a href="${item.url}">${item.title}</a>`
		})

	li
		.filter((item:Item) => item.type === Type.DOCUMENT || (item.type === Type.FOLDER && !item.children))
		.attr('class', (item:Item) => {
			let classes:string[] = ['item'];
			if (item.isCurrent) classes.push('item-current');
			if (item.isFavorite) classes.push('item-favorite');
			if (item.isUnimportant || (item.parent && item.parent.isUnimportant)) classes.push('item-unimportant');
			return classes.join(' ');
		})
		.html((item:Item) => {
			let icon:string = (item.type === Type.DOCUMENT) ? 'document' : 'folder';
			if (item.isFavorite) icon += '.star';
			return `
				<img src="${chrome.extension.getURL('static/' + icon + '.svg')}"/>
				<a href="${item.url}">${item.title}</a>
			`;
		})

	const innerArc = d3.svg.arc()
		.innerRadius(0)
		.outerRadius(3)
		.startAngle(0)
		.endAngle(d => Math.PI * 2 * d['progress'])

	const svg = li
		.filter((item:Item) => item.progress && !isNaN(item.progress))
		.append('svg')
		.attr({width: 10, height: 10})
		.append('g')
		.attr('transform', 'translate(5, 5)')

	svg
		.append('circle')
		.attr('r', 4)

	svg
		.append('path')
		.attr('d', innerArc)
		.each((item:Item) => console.log('progress', item.title, item.progress))

}

//----------------------------------------------------------------
// Data
//----------------------------------------------------------------
enum GTD2 {INBOX = 2, SNOOZED = 1, NONE = 0}

const DISCLOSURE_PREFIX:string = 'disclosure_';

interface ActionTitle {
	title:string;
	gtd:GTD2;
	unimportant:boolean;
	progress:number;
}

function parseActionTitle(title:string):ActionTitle {
	const TAGS:RegExp[] = [
		/(#inbox|#i)/,
		/(#snoozed|#s)/,
		/(#\-1)/,
		/(#[0-9]+%)/
	];

	const values:string[] = TAGS.map((test:RegExp) => {
		if (test.test(title)) return test.exec(title)[0];
		return null;
	});

	TAGS.forEach((test) => title = title.replace(test, ''));
	title = title.replace(/^\s+|\s+$/gi, '');

	const p:string = values[3];

	const gtd:GTD2 = (values[0]) ? GTD2.INBOX : (values[1]) ? GTD2.SNOOZED : GTD2.NONE;
	const unimportant:boolean = values[2] !== null;
	const progress:number = (p) ? Number(p.substring(1, p.length - 1)) / 100 : NaN;

	return {title, gtd, unimportant, progress};
}

function compareByName(a:Item, b:Item):number {
	if ((a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
		return a.title > b.title ? 1 : -1;
	} else if (a.isFavorite || b.isUnimportant) {
		return -1;
	} else if (a.isUnimportant || b.isFavorite) {
		return 1;
	}
	return a.title > b.title ? 1 : -1;
}

function compareByValue(a:Item, b:Item):number {
	if ((a.gtd === b.gtd) && (a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
		return a.title > b.title ? 1 : -1;
	} else if (a.isFavorite || b.isUnimportant || a.gtd > b.gtd) {
		return -1;
	} else if (a.isUnimportant || b.isFavorite || a.gtd < b.gtd) {
		return 1;
	}
	return a.title > b.title ? 1 : -1;
}

function getSectionData(result:(sections:Section[]) => void) {
	$.get('/folder/list', (folders:{data:{folder:Folder, inSidebar:boolean}[]}) => {
		let favoriteFolders:string[] = [];
		let requests:JQueryXHR[] = [$.get('/ep/internal/padlist/?filter=2')];

		folders.data.forEach(data => {
			if (data.inSidebar) favoriteFolders.push(data.folder.encryptedId);
			requests.push($.get(`/ep/internal/padlist/?q=&folderId=${data.folder.encryptedId}`));
		});

		$.when(...requests).done((...docsList) => {
			const location:string = window.location.href;

			let exists:{[padId:string]:boolean} = {};
			let items:{
				inbox: Item[],
				snoozed: Item[],
				favorited: Item[],
				unimportants: Item[],
				uncategorized: Item[],
				folders: Item[],
				documents: Item[]} = {
				inbox: [],
				snoozed: [],
				favorited: [],
				unimportants: [],
				uncategorized: [],
				folders: [],
				documents: []
			};
			let categorized:{[folder:string]: Item[]} = {};
			let folderInfo:{[folderName:string]:Folder} = {};

			docsList.forEach(item => {
				const pads:Doc[] = item[0]['pads'];
				if (!pads || pads.length === 0) return;

				pads.forEach((doc:Doc) => {
					if (exists[doc.localPadId]) return;
					exists[doc.localPadId] = true;

					const actionTitle:ActionTitle = parseActionTitle(doc.title);

					const item:Item = {
						title: actionTitle.title,
						url: doc.url,
						type: Type.DOCUMENT,
						isFavorite: doc.isFavorite,
						isUnimportant: actionTitle.unimportant,
						progress: actionTitle.progress,
						isCurrent: location.indexOf(doc.localPadId) > -1,
						gtd: actionTitle.gtd
					};

					switch (actionTitle.gtd) {
						case GTD2.INBOX:
							items.inbox.push(item);
							break;
						case GTD2.SNOOZED:
							items.snoozed.push(item);
							break;
					}

					if (item.isFavorite) items.favorited.push(item);
					if (item.isUnimportant) items.unimportants.push(item);

					if (doc.folderData && doc.folderData.folder) {
						const folderName:string = doc.folderData.folder.name;
						if (!categorized[folderName]) {
							folderInfo[folderName] = doc.folderData.folder;
							categorized[folderName] = [];
						}
						categorized[folderName].push(item);
					} else {
						items.uncategorized.push(item);
					}
				});
			});

			for (let folderName in categorized) {
				if (categorized.hasOwnProperty(folderName)) {
					const actionTitle:ActionTitle = parseActionTitle(folderName);
					const folder:Folder = folderInfo[folderName];

					let item:Item = {
						title: actionTitle.title,
						url: `/folder/show/${folder.encryptedId}`,
						type: Type.FOLDER,
						isFavorite: favoriteFolders.indexOf(folder.encryptedId) > -1,
						isUnimportant: actionTitle.unimportant,
						progress: actionTitle.progress,
						isCurrent: false,
						gtd: actionTitle.gtd,
						children: categorized[folderName]
					};

					items.documents.push(item);

					item = {
						title: actionTitle.title,
						url: `/folder/show/${folder.encryptedId}`,
						type: Type.FOLDER,
						isFavorite: favoriteFolders.indexOf(folder.encryptedId) > -1,
						isUnimportant: actionTitle.unimportant,
						progress: actionTitle.progress,
						isCurrent: false,
						gtd: actionTitle.gtd
					};

					switch (actionTitle.gtd) {
						case GTD2.INBOX:
							items.inbox.push(item);
							break;
						case GTD2.SNOOZED:
							items.snoozed.push(item);
							break;
					}

					if (item.isFavorite) items.favorited.push(item);
					if (item.isUnimportant) items.unimportants.push(item);

					items.folders.push(item);
				}
			}

			items.inbox = items.inbox.sort(compareByName);
			items.snoozed = items.snoozed.sort(compareByName);
			items.favorited = items.favorited.sort(compareByName);
			items.unimportants = items.unimportants.sort(compareByName);
			items.folders = items.folders.sort(compareByValue);
			items.uncategorized = items.uncategorized.sort(compareByValue);
			items.documents = items.documents.sort(compareByValue);
			items.documents.forEach((folder:Item) => folder.children = folder.children.sort(compareByValue));
			items.documents.push({
				title: 'Uncategorized',
				url: '/docs',
				type: Type.FOLDER,
				isFavorite: false,
				isUnimportant: false,
				progress: NaN,
				isCurrent: false,
				gtd: GTD2.NONE,
				children: items.uncategorized
			});

			result([
				{title: 'Inbox', items: items.inbox, disclosure: true},
				{title: 'Snoozed', items: items.snoozed, disclosure: false},
				{title: 'Favorites', items: items.favorited, disclosure: false},
				{title: 'Folders', items: items.folders, disclosure: false},
				{title: 'Documents', items: items.documents, disclosure: true},
				{title: 'Unimportants', items: items.unimportants, disclosure: false}
			]);
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

	getSectionData((sections:Section[]) => {
		const keys:string[] = sections.map(section => DISCLOSURE_PREFIX + section.title);
		chrome.storage.local.get(keys, (result) => {
			let f:number = keys.length;
			let init:{[key:string]:boolean} = {};
			let doInit:boolean = false;
			while (--f >= 0) {
				const key:string = keys[f];
				if (result[key] === undefined) {
					init[key] = sections[f].disclosure;
					doInit = true;
				} else {
					sections[f].disclosure = result[key];
				}
			}

			if (doInit) chrome.storage.local.set(init);

			drawSidemenu(sections);
		});
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