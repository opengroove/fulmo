/*
 * Copyright (C) 2012, OpenGroove, Inc. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *  2. Redistributions in binary form must reproduce the above
 *     copyright notice, this list of conditions and the following
 *     disclaimer in the documentation and/or other materials provided
 *     with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

(function(fulmo) {

var impl = new (function contentInterfaceImplementation(w) {
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
    this.openEditor = function(params) {
        window.open('chrome://fulmo/content/editor.html', '_blank', 'resizable,centerscreen,scrollbars');
    }
    this.loadSettings = function(func) {
        var settings = fulmo.settingsManager.load();
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
        function create(o, trunk, no, labelMode) {
            var label, icon, arg;
            switch (parseInt(no)) {
            case 1:
                label = 'fulmo_action_all_send';
                icon = 'get_document.png';
                arg = 0;
                break;
            case 2:
                label = 'fulmo_action_view_send';
                icon = 'get_window.png';
                arg = 10;
                break;
            case 3:
                label = 'fulmo_action_parts_send';
                icon = 'get_selected_area.png';
                arg = 20;
                break;
            case 4:
                label = 'fulmo_action_no_image_send';
                icon = 'create_ticket.png';
                arg = 30;
                break;
            default:
                return;
            }
            label = o.getString(label);
            if (labelMode)
                label = o.getString('fulmo_name') + ' - ' + label;
            icon = 'chrome://fulmo/skin/images/' + icon;
            var command = function() { fulmo.sender.goSend(arg) };
            var item = w.document.createElement('menuitem');
            item.className = 'menuitem-iconic screenshot-sender-menu-item';
            item.setAttribute('label', label);
            item.setAttribute('image', icon);
            item.addEventListener('command', command, true);
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
            newMenu.setAttribute('label', this.getString('fulmo_name'));
            newMenu.id = 'screenshot-sender-menu';
            rootMenu.appendChild(newMenu);
            var newPopup = w.document.createElement('menupopup');
            newMenu.appendChild(newPopup);
            for (i = 0; i < params.length; i++) {
                create(this, newPopup, params[i], false);
            }
        }
    }
})(window);

window.addEventListener('load', function() {
    impl.loadSettings(function(settings) {
        impl.setupContextMenu(settings.contextMenu);
    });
}, false);

fulmo.sender = new fulmo.Sender(function(){return window.content;}, impl);

})(fulmo);
