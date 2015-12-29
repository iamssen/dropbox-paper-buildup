var GTDTag;
(function (GTDTag) {
    GTDTag[GTDTag["INBOX"] = 0] = "INBOX";
    GTDTag[GTDTag["SNOOZED"] = 1] = "SNOOZED";
    GTDTag[GTDTag["NONE"] = 2] = "NONE";
})(GTDTag || (GTDTag = {}));
var ValueTag;
(function (ValueTag) {
    ValueTag[ValueTag["IMPORTANT"] = 0] = "IMPORTANT";
    ValueTag[ValueTag["UNIMPORTANT"] = 1] = "UNIMPORTANT";
    ValueTag[ValueTag["NONE"] = 2] = "NONE";
})(ValueTag || (ValueTag = {}));
var DISCLOSURE_KEY = 'disclosure';
var DISCLOSURE_ATTR_KEY = 'disclosure-id';
var DISCLOSURE_SIGN = '...';
var disclosure = {
    Inbox: false,
    Snoozed: false,
    Documents: false
};
function renderSidemenu(gtds, folders) {
    console.log(chrome.storage.local);
    var renderHeader = function (selection) {
        selection
            .classed('buildup-container-header', true)
            .html(function (d) {
            if (disclosure[d])
                return d + " <span class=\"buildup-container-header-disclosure-sign\">" + DISCLOSURE_SIGN + "</span>";
            return d;
        })
            .on('click', function (d, i, o) {
            var closed = !disclosure[d];
            var value = {};
            disclosure[d] = closed;
            value[DISCLOSURE_KEY] = disclosure;
            chrome.storage.local.set(value);
            d3.select(selection[o][i])
                .html(function () {
                if (closed)
                    return d + " <span class=\"buildup-container-header-disclosure-sign\">" + DISCLOSURE_SIGN + "</span>";
                return d;
            });
            d3
                .select("[" + DISCLOSURE_ATTR_KEY + "=" + d + "]")
                .classed('buildup-container-disclosure-closed', closed);
        });
    };
    var renderItem = function (selection) {
        selection
            .classed('buildup-container-doc-important', function (item) { return item.buildup_valueTag === ValueTag.IMPORTANT; })
            .classed('buildup-container-doc-unimportant', function (item) { return item.buildup_valueTag === ValueTag.UNIMPORTANT; });
    };
    var renderFolder = function (selection) {
        selection
            .classed('buildup-container-doc', true)
            .call(renderItem)
            .append('a')
            .html(function (folder) {
            if (folder.isFavorite || folder.buildup_valueTag === ValueTag.IMPORTANT)
                return "<span class=\"buildup-container-doc-favorited\">\u2605</span> " + folder.buildup_title;
            return "<span class=\"buildup-container-doc-unfavorited\">\u2606</span> " + folder.buildup_title;
        })
            .attr('href', function (folder) { return folder.url; });
    };
    var renderDoc = function (selection) {
        selection
            .classed('buildup-container-doc', true)
            .classed('buildup-container-doc-selected', function (doc) { return doc.buildup_isCurrent; })
            .call(renderItem)
            .append('a')
            .html(function (doc) {
            if (doc.isFavorite || doc.buildup_valueTag === ValueTag.IMPORTANT)
                return "<span class=\"buildup-container-doc-favorited\">\u2605</span> " + doc.buildup_title;
            return "<span class=\"buildup-container-doc-unfavorited\">\u2606</span> " + doc.buildup_title;
        })
            .attr('href', function (doc) { return doc.url; });
    };
    d3.select('.buildup-container').remove();
    var buildupContainer = d3.select('.hp-sidebar-scroller')
        .insert('div', ':first-child')
        .classed('buildup-container', true);
    gtds.forEach(function (gtd) {
        buildupContainer
            .append('h4')
            .datum(gtd.title)
            .call(renderHeader);
        var ul = buildupContainer
            .append('ul')
            .attr(DISCLOSURE_ATTR_KEY, gtd.title)
            .classed('buildup-container-disclosure-closed', disclosure[gtd.title])
            .classed('buildup-container-docs', true);
        if (gtd.folders.length > 0) {
            gtd.folders.forEach(function (folder) {
                ul
                    .append('li')
                    .datum(folder)
                    .call(renderFolder);
            });
        }
        if (gtd.docs.length > 0) {
            gtd.docs.forEach(function (doc) {
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
        .classed('buildup-container-folder-important', function (folder) { return folder.buildup_valueTag === ValueTag.IMPORTANT; })
        .classed('buildup-container-folder-unimportant', function (folder) { return folder.buildup_valueTag === ValueTag.UNIMPORTANT; })
        .html(function (folder) {
        if (folder.url)
            return "<h5><a href=\"" + folder.url + "\">" + folder.buildup_title + "</a></h5>";
        return "<h5>" + folder.buildup_title + "</h5>";
    })
        .append('ul')
        .classed('buildup-container-docs', true)
        .selectAll('li')
        .data(function (folder) { return folder.docs; })
        .enter()
        .append('li')
        .call(renderDoc);
}
function actionTagging(title, item) {
    var TEST_TAG = [
        /(#inbox|#i)/,
        /(#snoozed|#s)/,
        /(#\+1)/,
        /(#\-1)/
    ];
    var checked = TEST_TAG.map(function (test) {
        if (test.test(title)) {
            title = title.replace(test, '');
            return true;
        }
        return false;
    });
    if (checked[0]) {
        item.buildup_GTDTag = GTDTag.INBOX;
    }
    else if (checked[1]) {
        item.buildup_GTDTag = GTDTag.SNOOZED;
    }
    else {
        item.buildup_GTDTag = GTDTag.NONE;
    }
    if (checked[2]) {
        item.buildup_valueTag = ValueTag.IMPORTANT;
    }
    else if (checked[3]) {
        item.buildup_valueTag = ValueTag.UNIMPORTANT;
    }
    else {
        item.buildup_valueTag = ValueTag.NONE;
    }
    item.buildup_title = title;
}
function compareItems(a, b) {
    if (a.buildup_valueTag === b.buildup_valueTag) {
        return a.buildup_title > b.buildup_title ? 1 : -1;
    }
    else if (a.buildup_valueTag === ValueTag.IMPORTANT || b.buildup_valueTag === ValueTag.UNIMPORTANT) {
        return -1;
    }
    else if (a.buildup_valueTag === ValueTag.UNIMPORTANT || b.buildup_valueTag === ValueTag.IMPORTANT) {
        return 1;
    }
    return a.buildup_title > b.buildup_title ? 1 : -1;
}
function buildupSidemenu() {
    $.get('/folder/list', function (folders) {
        var deferreds = [
            $.get('/ep/internal/padlist/?filter=2')
        ];
        folders.data.forEach(function (data) {
            deferreds.push($.get("/ep/internal/padlist/?q=&folderId=" + data.folder.encryptedId));
        });
        $.when.apply($, deferreds).done(function () {
            var docsList = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                docsList[_i - 0] = arguments[_i];
            }
            var location = window.location.href;
            var inboxDocs = [];
            var snoozedDocs = [];
            var docs = [];
            var exists = {};
            docsList.forEach(function (item) {
                var pads = item[0]['pads'];
                if (!pads || pads.length == 0)
                    return;
                pads.forEach(function (doc) {
                    if (exists[doc.localPadId])
                        return;
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
            var inboxFolders = [];
            var snoozedFolders = [];
            var categorized = {};
            var uncategorized = [];
            var folderInfo = {};
            docs.forEach(function (doc) {
                if (doc.folderData && doc.folderData.folder) {
                    var folderName = doc.folderData.folder.name;
                    if (!categorized[folderName]) {
                        var folder = doc.folderData.folder;
                        folder.isFavorite = doc.folderData.isFavorite;
                        folderInfo[folderName] = folder;
                        categorized[folderName] = [];
                    }
                    categorized[folderName].push(doc);
                }
                else {
                    uncategorized.push(doc);
                }
            });
            var folders = [];
            for (var folderName in categorized) {
                if (categorized.hasOwnProperty(folderName)) {
                    var folder = {
                        buildup_title: folderName,
                        url: "/folder/show/" + folderInfo[folderName].encryptedId,
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
            inboxDocs = inboxDocs.sort(compareItems);
            snoozedDocs = snoozedDocs.sort(compareItems);
            inboxFolders = inboxFolders.sort(compareItems);
            snoozedFolders = snoozedFolders.sort(compareItems);
            folders = folders.sort(compareItems);
            folders.forEach(function (folder) { return folder.docs = folder.docs.sort(compareItems); });
            uncategorized = uncategorized.sort(compareItems);
            var gtds = [];
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
                });
            }
            folders.push({
                buildup_title: 'Uncategorized',
                docs: uncategorized,
                buildup_GTDTag: GTDTag.NONE,
                buildup_valueTag: ValueTag.NONE,
                isFavorite: false
            });
            renderSidemenu(gtds, folders);
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
    chrome.storage.local.get(DISCLOSURE_KEY, function (value) {
        if (value[DISCLOSURE_KEY]) {
            disclosure = value[DISCLOSURE_KEY];
        }
        else {
            var value_1 = {};
            value_1[DISCLOSURE_KEY] = disclosure;
            chrome.storage.local.set(value_1);
        }
        buildupSidemenu();
    });
});
//# sourceMappingURL=index.js.map