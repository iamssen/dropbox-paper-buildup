var Type;
(function (Type) {
    Type[Type["FOLDER"] = 0] = "FOLDER";
    Type[Type["DOCUMENT"] = 1] = "DOCUMENT";
})(Type || (Type = {}));
function drawSidemenu(sections) {
    var hierarchy = d3.layout.hierarchy();
    d3.select('.buildup-sidemenu').remove();
    var container = d3.select('.hp-sidebar-scroller')
        .insert('div', ':first-child')
        .attr('class', 'buildup-sidemenu');
    var section = container
        .selectAll('div')
        .data(sections)
        .enter()
        .append('div')
        .attr('class', 'section');
    section
        .append('h1')
        .html(function (section) { return (section.title + " <img src=\"" + chrome.extension.getURL('static/section.close.svg') + "\"/>"); })
        .attr('section-id', function (section) { return section.title; })
        .classed('section-hide', function (section) { return !section.disclosure; })
        .classed('section-title', true)
        .on('click', function (section) {
        var h1 = d3.select(this);
        var ul = d3.select("ul[section-id='" + section.title + "']");
        var disclosure = h1.classed('section-hide');
        h1.classed('section-hide', !disclosure);
        ul.classed('section-hide', !disclosure);
        var value = {};
        value[DISCLOSURE_PREFIX + section.title] = disclosure;
        chrome.storage.local.set(value);
    });
    var li = section
        .append('ul')
        .attr('section-id', function (section) { return section.title; })
        .classed('section-hide', function (section) { return !section.disclosure; })
        .selectAll('li')
        .data(function (section) { return hierarchy({ children: section.items }).slice(1); })
        .enter()
        .append('li');
    li
        .filter(function (item) { return item.type === Type.FOLDER && item.children && item.children.length > 0; })
        .attr('class', function (item) {
        var classes = ['item-group'];
        if (item.isUnimportant)
            classes.push('item-unimportant');
        return classes.join(' ');
    })
        .html(function (item) {
        return "<a href=\"" + item.url + "\">" + item.title + "</a>";
    });
    li
        .filter(function (item) { return item.type === Type.DOCUMENT || (item.type === Type.FOLDER && !item.children); })
        .attr('class', function (item) {
        var classes = ['item'];
        if (item.isCurrent)
            classes.push('item-current');
        if (item.isFavorite)
            classes.push('item-favorite');
        if (item.isUnimportant || (item.parent && item.parent.isUnimportant))
            classes.push('item-unimportant');
        return classes.join(' ');
    })
        .html(function (item) {
        var icon = (item.type === Type.DOCUMENT) ? 'document' : 'folder';
        if (item.isFavorite)
            icon += '.star';
        return "\n\t\t\t\t<img src=\"" + chrome.extension.getURL('static/' + icon + '.svg') + "\"/>\n\t\t\t\t<a href=\"" + item.url + "\">" + item.title + "</a>\n\t\t\t";
    });
    var innerArc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(3)
        .startAngle(0)
        .endAngle(function (d) { return Math.PI * 2 * d['progress']; });
    var svg = li
        .filter(function (item) { return !isNaN(item.progress); })
        .append('svg')
        .attr({ width: 10, height: 10 })
        .append('g')
        .attr('transform', 'translate(5, 5)');
    svg
        .append('circle')
        .attr('r', 4);
    svg
        .append('path')
        .attr('d', innerArc)
        .each(function (item) { return console.log('progress', item.title, item.progress); });
}
var GTD2;
(function (GTD2) {
    GTD2[GTD2["INBOX"] = 2] = "INBOX";
    GTD2[GTD2["SNOOZED"] = 1] = "SNOOZED";
    GTD2[GTD2["NONE"] = 0] = "NONE";
})(GTD2 || (GTD2 = {}));
var DISCLOSURE_PREFIX = 'disclosure_';
function parseActionTitle(title) {
    var TAGS = [
        /(#inbox|#i)/,
        /(#snoozed|#s)/,
        /(#\-1)/,
        /(#[0-9]+%)/
    ];
    var values = TAGS.map(function (test) {
        if (test.test(title))
            return test.exec(title)[0];
        return null;
    });
    TAGS.forEach(function (test) { return title = title.replace(test, ''); });
    title = title.replace(/^\s+|\s+$/gi, '');
    var p = values[3];
    var gtd = (values[0]) ? GTD2.INBOX : (values[1]) ? GTD2.SNOOZED : GTD2.NONE;
    var unimportant = values[2] !== null;
    var progress = (p) ? Number(p.substring(1, p.length - 1)) / 100 : NaN;
    return { title: title, gtd: gtd, unimportant: unimportant, progress: progress };
}
function compareByName(a, b) {
    if ((a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
        return a.title > b.title ? 1 : -1;
    }
    else if (a.isFavorite || b.isUnimportant) {
        return -1;
    }
    else if (a.isUnimportant || b.isFavorite) {
        return 1;
    }
    return a.title > b.title ? 1 : -1;
}
function compareByValue(a, b) {
    if ((a.gtd === b.gtd) && (a.isFavorite === b.isFavorite) && (a.isUnimportant === b.isUnimportant)) {
        return a.title > b.title ? 1 : -1;
    }
    else if (a.isFavorite || b.isUnimportant || a.gtd > b.gtd) {
        return -1;
    }
    else if (a.isUnimportant || b.isFavorite || a.gtd < b.gtd) {
        return 1;
    }
    return a.title > b.title ? 1 : -1;
}
function getSectionData(result) {
    $.get('/folder/list', function (folders) {
        var favoriteFolders = [];
        var requests = [$.get('/ep/internal/padlist/?filter=2')];
        folders.data.forEach(function (data) {
            if (data.inSidebar)
                favoriteFolders.push(data.folder.encryptedId);
            requests.push($.get("/ep/internal/padlist/?q=&folderId=" + data.folder.encryptedId));
        });
        $.when.apply($, requests).done(function () {
            var docsList = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                docsList[_i - 0] = arguments[_i];
            }
            var location = window.location.href;
            var exists = {};
            var items = {
                inbox: [],
                snoozed: [],
                favorited: [],
                unimportants: [],
                uncategorized: [],
                folders: [],
                documents: []
            };
            var categorized = {};
            var folderInfo = {};
            docsList.forEach(function (item) {
                var pads = item[0]['pads'];
                if (!pads || pads.length === 0)
                    return;
                pads.forEach(function (doc) {
                    if (exists[doc.localPadId])
                        return;
                    exists[doc.localPadId] = true;
                    var actionTitle = parseActionTitle(doc.title);
                    var item = {
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
                    if (item.isFavorite)
                        items.favorited.push(item);
                    if (item.isUnimportant)
                        items.unimportants.push(item);
                    if (doc.folderData && doc.folderData.folder) {
                        var folderName = doc.folderData.folder.name;
                        if (!categorized[folderName]) {
                            folderInfo[folderName] = doc.folderData.folder;
                            categorized[folderName] = [];
                        }
                        categorized[folderName].push(item);
                    }
                    else {
                        items.uncategorized.push(item);
                    }
                });
            });
            for (var folderName in categorized) {
                if (categorized.hasOwnProperty(folderName)) {
                    var actionTitle = parseActionTitle(folderName);
                    var folder = folderInfo[folderName];
                    var item = {
                        title: actionTitle.title,
                        url: "/folder/show/" + folder.encryptedId,
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
                        url: "/folder/show/" + folder.encryptedId,
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
                    if (item.isFavorite)
                        items.favorited.push(item);
                    if (item.isUnimportant)
                        items.unimportants.push(item);
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
            items.documents.forEach(function (folder) { return folder.children = folder.children.sort(compareByValue); });
            items.documents.push({
                title: 'Uncategorized',
                url: '/docs',
                type: Type.FOLDER,
                isFavorite: false,
                isUnimportant: false,
                progress: -1,
                isCurrent: false,
                gtd: GTD2.NONE,
                children: items.uncategorized
            });
            result([
                { title: 'Inbox', items: items.inbox, disclosure: true },
                { title: 'Snoozed', items: items.snoozed, disclosure: false },
                { title: 'Favorited', items: items.favorited, disclosure: false },
                { title: 'Folders', items: items.folders, disclosure: false },
                { title: 'Documents', items: items.documents, disclosure: true },
                { title: 'Unimportants', items: items.unimportants, disclosure: false }
            ]);
        });
    });
}
$(document).ready(function () {
    ['dist/index.css'].forEach(function (file) {
        d3
            .select('head')
            .append('link')
            .attr({
            rel: 'stylesheet',
            type: 'text/css',
            href: chrome.extension.getURL(file)
        });
    });
    getSectionData(function (sections) {
        var keys = sections.map(function (section) { return DISCLOSURE_PREFIX + section.title; });
        chrome.storage.local.get(keys, function (result) {
            var f = keys.length;
            var init = {};
            var doInit = false;
            while (--f >= 0) {
                var key = keys[f];
                if (result[key] === undefined) {
                    init[key] = sections[f].disclosure;
                    doInit = true;
                }
                else {
                    sections[f].disclosure = result[key];
                }
            }
            if (doInit)
                chrome.storage.local.set(init);
            drawSidemenu(sections);
        });
    });
});
//# sourceMappingURL=index.js.map