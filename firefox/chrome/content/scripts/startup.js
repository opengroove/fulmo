function contentInterfaceImplementation(w) {
    var settingsDialog = null;
    var settingsDialog_bk = null;

    this.createScreenCapture = function(rect, func) {
        var canvas = window.content.document.createElement("canvas");
        canvas.width = rect[2];
        canvas.height = rect[3];
        var ctx = canvas.getContext("2d");
        ctx.drawWindow(window.content, rect[0], rect[1], rect[2], rect[3], "#ffffff");
        func(canvas.toDataURL("image/png"));
    }
    this.openMainWindow = function(params) {
        window.open('chrome://fulmo/content/main.html', '_blank', 'resizable,centerscreen,scrollbars,width=600,height=680');
    }
    this.loadSettings = function(func) {
        var settings = fulmoSettingsManager.load();
        func(settings);
    }
    this.getString = function(tag) {
        var strings = w.document.getElementById('screenshot-sender-strings');
        return strings.getString(tag);
    }
    this.openSettingWindow = function() {
        if (settingsDialog) {
            settingsDialog.focus();
        } else {
            settingsDialog_bk = settingsDialog = window.openDialog('chrome://fulmo/content/settings.xul');
            settingsDialog.addEventListener('load', function(e){ settingsDialog = settingsDialog_bk}, false);
            settingsDialog.addEventListener('unload', function(){ settingsDialog = null;}, false);
        }
    }
    this.setupContextMenu = function(params) {
        var actions = [
            { // 0
                title: 'fulmo_name',
            },
            { // 1
                title: 'fulmo_action_all_send',
                icon: 'chrome://fulmo/skin/images/get_document.png',
                command: 0
            },
            { // 2
                title: 'fulmo_action_view_send',
                icon: 'chrome://fulmo/skin/images/get_window.png',
                command: 10
            },
            { // 3
                title: 'fulmo_action_parts_send',
                icon: 'chrome://fulmo/skin/images/get_selected_area.png',
                command: 20
            },
            { // 4
                title: 'fulmo_action_no_image_send',
                icon: 'chrome://fulmo/skin/images/create_ticket.png',
                command: 30
            }
        ];
        function create(o, trunk, no, labelMode) {
            var item = w.document.createElement('menuitem');
            var lv = o.getString(actions[no].title);
            if (labelMode) lv = o.getString(actions[0].title) + ' - ' + lv;
            item.setAttribute('label', lv);
            item.className = 'menuitem-iconic screenshot-sender-menu-item';
            item.setAttribute('image', actions[no].icon);
            item.setAttribute('oncommand', 'screenshotSender.goSend(' + actions[no].command + ')');
            trunk.appendChild(item);
        }
        var rootMenu = w.document.getElementById("contentAreaContextMenu");
        var oldMenu = w.document.getElementById('screenshot-sender-menu');
        if (oldMenu) {
            rootMenu.removeChild(oldMenu);
        }
        var oldItems = rootMenu.getElementsByTagName('menuitem');
        for (var i = 0; i < oldItems.length; i++) {
            if (oldItems[i].className.split(' ').indexOf('screenshot-sender-menu-item') != -1) {
                rootMenu.removeChild(oldItems[i]);
            }
        }
        if (!params || params.length == 0) return;
        if (params.length == 1) {
            create(this, rootMenu, params[0], true);
        } else {
            var newMenu = w.document.createElement('menu');
            newMenu.setAttribute('label', this.getString(actions[0].title));
            newMenu.id = 'screenshot-sender-menu';
            rootMenu.appendChild(newMenu);
            var newPopup = w.document.createElement('menupopup');
            newMenu.appendChild(newPopup);
            for (i = 0; i < params.length; i++) {
                create(this, newPopup, params[i], false);
            }
        }
    }
}

var screenshotSenderCII = new contentInterfaceImplementation(window);
var screenshotSender = new ScreenshotSender(function(){return window.content;}, screenshotSenderCII);

window.addEventListener('load', function() {
    screenshotSenderCII.loadSettings(function(settings) {
        screenshotSenderCII.setupContextMenu(settings.contextMenu);
    });
}, false);

