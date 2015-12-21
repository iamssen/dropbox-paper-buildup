function buildupSidemenu() {
    var location = window.location.href;
    d3.select('.buildup-container').remove();
    var buildupContainer = d3.select('.hp-sidebar-scroller')
        .insert('div', ':first-child')
        .classed('buildup-container', true);
    buildupContainer
        .append('h4')
        .classed('buildup-container-header', true)
        .text('Documents');
    function render(docs) {
        var categorized = {};
        var uncategorized = [];
        var folderInfo = {};
        docs.forEach(function (doc) {
            if (doc.folderData && doc.folderData.folder) {
                var folder = doc.folderData.folder.name;
                if (!categorized[folder]) {
                    folderInfo[folder] = doc.folderData.folder;
                    categorized[folder] = [];
                }
                categorized[folder].push(doc);
            }
            else {
                uncategorized.push(doc);
            }
        });
        var tree = [];
        for (var folder in categorized) {
            if (categorized.hasOwnProperty(folder)) {
                tree.push({ folder: folder, docs: categorized[folder] });
            }
        }
        tree.push({ folder: 'Uncategorized', docs: uncategorized });
        buildupContainer
            .append('ul')
            .classed('buildup-container-folders', true)
            .selectAll('li')
            .data(tree)
            .enter()
            .append('li')
            .classed('buildup-container-folder', true)
            .html(function (cate) {
            if (folderInfo[cate.folder]) {
                return "<h5><a href=\"/folder/show/" + folderInfo[cate.folder].encryptedId + "\">" + cate.folder + "</a></h5>";
            }
            else {
                return "<h5>" + cate.folder + "</h5>";
            }
        })
            .append('ul')
            .classed('buildup-container-docs', true)
            .selectAll('li')
            .data(function (cate) { return cate.docs; })
            .enter()
            .append('li')
            .attr('pad-id', function (doc) { return doc.localPadId; })
            .classed('buildup-container-doc', true)
            .classed('buildup-container-doc-selected', function (doc) { return location.indexOf(doc.localPadId) > -1; })
            .append('a')
            .html(function (doc) {
            var mark = doc.isFavorite ? '<span class="buildup-container-doc-favorited">★</span>' : '<span class="buildup-container-doc-unfavorited">☆</span>';
            return mark + " " + doc.title;
        })
            .attr('href', function (doc) { return doc.url; });
    }
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
            var result = [];
            var cache = {};
            docsList.forEach(function (item) {
                var docs = item[0].pads;
                docs.forEach(function (doc) {
                    if (!cache[doc.localPadId]) {
                        result.push(doc);
                        cache[doc.localPadId] = true;
                    }
                });
            });
            render(result);
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
    buildupSidemenu();
});
//# sourceMappingURL=index.js.map