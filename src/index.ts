//'use strict';
/// <reference path="typings/tsd.d.ts"/>

declare module chrome {
	module extension {
		function getURL(file:string):string;
	}
}

interface Docs {
	pads:Doc[];
}

interface FolderData {
	folder?: Folder;
	parentFolders?: Folder[];
}

interface Folder {
	name:string;
	encryptedId:string;
	parentFolderId?:string;
}

interface Doc {
	folderData?: FolderData;
	url: string;
	title: string;
	localPadId: string;
	isFavorite: boolean;
}

function buildupSidemenu() {
	let location:string = window.location.href;

	d3.select('.buildup-container').remove();

	let buildupContainer = d3.select('.hp-sidebar-scroller')
		//.append('div')
		.insert('div', ':first-child')
		.classed('buildup-container', true);

	buildupContainer
		.append('h4')
		.classed('buildup-container-header', true)
		.text('Documents');

	function render(docs:Doc[]) {
		interface Category {
			folder:string;
			docs:Doc[];
		}

		let categorized:{[folder:string]:Doc[]} = {};
		let uncategorized:Doc[] = [];
		let folderInfo:{[folder:string]:Folder} = {};

		docs.forEach((doc:Doc) => {
			if (doc.folderData && doc.folderData.folder) {
				let folder:string = doc.folderData.folder.name;
				if (!categorized[folder]) {
					folderInfo[folder] = doc.folderData.folder;
					categorized[folder] = [];
				}
				categorized[folder].push(doc);
			} else {
				uncategorized.push(doc);
			}
		});

		let tree:Category[] = [];

		for (let folder in categorized) {
			if (categorized.hasOwnProperty(folder)) {
				tree.push({folder, docs: categorized[folder]});
			}
		}

		tree.push({folder: 'Uncategorized', docs: uncategorized});

		buildupContainer
			.append('ul')
			.classed('buildup-container-folders', true)
			.selectAll('li')
			.data(tree)
			.enter()
			.append('li')
			.classed('buildup-container-folder', true)
			.html((cate:Category) => {
				if (folderInfo[cate.folder]) {
					return `<h5><a href="/folder/show/${folderInfo[cate.folder].encryptedId}">${cate.folder}</a></h5>`
				} else {
					return `<h5>${cate.folder}</h5>`
				}
			})
			.append('ul')
			.classed('buildup-container-docs', true)
			.selectAll('li')
			.data((cate:Category) => cate.docs)
			.enter()
			.append('li')
			.attr('pad-id', (doc:Doc) => doc.localPadId)
			.classed('buildup-container-doc', true)
			.classed('buildup-container-doc-selected', (doc:Doc) => location.indexOf(doc.localPadId) > -1)
			//.classed('buildup-container-doc-favorited', (doc:Doc) => doc.isFavorite)
			.append('a')
			.html((doc:Doc) => {
				let mark:string = doc.isFavorite ? '<span class="buildup-container-doc-favorited">★</span>' : '<span class="buildup-container-doc-unfavorited">☆</span>';
				return `${mark} ${doc.title}`;
			})
			.attr('href', (doc:Doc) => doc.url)
	}

	// /folder/list
	// /ep/internal/padlist/?q=&folderId=e.4ABicIua2YZr0ye0eP3Z1M2qitVpZnZOq7nrzicTAmWQOSAcK
	// /ep/internal/padlist/?filter=2

	$.get('/folder/list', (folders:{data:{folder:Folder}[]}) => {
		let deferreds:any[] = [
			$.get('/ep/internal/padlist/?filter=2')
		];

		folders.data.forEach(data => {
			deferreds.push($.get(`/ep/internal/padlist/?q=&folderId=${data.folder.encryptedId}`));
		});

		$.when(...deferreds).done((...docsList) => {
			let result:Doc[] = [];
			let cache:{[index:string]:boolean} = {};
			docsList.forEach(item => {
				let docs:Doc[] = item[0].pads;
				docs.forEach((doc:Doc) => {
					if (!cache[doc.localPadId]) {
						result.push(doc);
						cache[doc.localPadId] = true;
					}
				});
			});
			render(result);
		});
	});

	//$.get('/ep/internal/padlist/?filter=2', (docs:Docs) => {
	//	render(docs.pads);
	//});
}

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

	buildupSidemenu();

	// TODO find api to detect location change
	//window.onpopstate = function (event) {
	//	console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
	//};
});


