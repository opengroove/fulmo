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

var screenshotSenderSettings = new ScreenshotSenderSettings(new function() {

    this.listValue = function(selectId) {
        if (document.getElementById(selectId).currentItem) return document.getElementById(selectId).currentItem.value
        if (!document.getElementById(selectId).selectedItem) return null;
        return document.getElementById(selectId).selectedItem.value;
    };

    this.addListItem = function(selectId, text, value) {
        var li = document.getElementById(selectId).appendItem(text, value);
        document.getElementById(selectId).ensureElementIsVisible(li);
        li.className = 'listitem-iconic';
        li.image = 'chrome://fulmo/skin/images/site.png';
        return li;
    };

    this.selectListItemByValue = function(id, value) {
        listUpdateNow = true;
        var list = document.getElementById(id);
        var items = list.getElementsByTagName('listitem');
        for (var i = 0; i < items.length; i++) {
            if (items[i].value == value) {
                setTimeout(function() {
                    list.selectItem(items[i]);
                    listUpdateNow = false;
                }, 0);
                break;
            }
        }
    };

    this.setCurrentListITemLabel = function(id, label) {
        document.getElementById(id).currentItem.label = label;
    };

    this.currentListItem = function(id) {
        return document.getElementById(id).currentItem
    };

    this.getString = function(tag) {
        strings = document.getElementById('screenshot-sender-settings-strings');
        return strings.getString(tag);
    };

    this.getFormattedString = function(tag, prm) {
        strings = document.getElementById('screenshot-sender-settings-strings');
        return strings.getFormattedString(tag, prm);
    };

    this.setDefaultIcon = function(settings) {
        var list = document.getElementById('screenshot-sender-account-list');
        var items = list.getElementsByTagName('listitem');
        for (var i = 0; i < items.length; i++) {
            // 見える位置にスクロールしてからimage属性を設定しないと、正しくアイコンが設定されないらしい
            document.getElementById('screenshot-sender-account-list').ensureElementIsVisible(items[i]);
            items[i].className = 'listitem-iconic';
            if (items[i].value == settings.defaultAccountId) {
                items[i].image = 'chrome://fulmo/skin/images/default_site.png';
            } else {
                items[i].image = 'chrome://fulmo/skin/images/site.png';
            }
        }
    };

    this.disableButton = function(id, disabled) {
        document.getElementById(id).disabled = disabled;
    };

    this.testConfirm = function(params, okFunc, cancelFunc) {
        window.openDialog('test.xul', '_blank', 'modal,centerscreen', params);
        if (params.goLogin) {
            okFunc();
        } else {
            cancelFunc();
        }
    };

    this.testStart = function() {
        document.getElementById('screenshot-sender-account-test-button').hidden = 'true';
        document.getElementById('screenshot-sender-account-test-progres').hidden = '';
    };

    this.testEnd = function() {
        document.getElementById('screenshot-sender-account-test-button').hidden = '';
        document.getElementById('screenshot-sender-account-test-progres').hidden = 'true';
    };

    this.closeWindow = function() {
        window.close();
    };

    this.setContextMenuStatus = function(params) {
        var list = document.getElementById('screenshot-sender-general-context-menu');
        var items = list.getElementsByTagName('listitem');
        for (var i = 0; i < items.length; i++) {
            if (params.indexOf(items[i].value) != -1) {
                list.addItemToSelection(items[i]);
            }
        }
    };

    this.getContextMenuStatus = function() {
        var out = [];
        var items = document.getElementById('screenshot-sender-general-context-menu').getElementsByTagName('listitem');
        for (var i = 0; i < items.length; i++) {
            if (items[i].selected) out.push(items[i].value);
        }
        return out;
    };

    this.setupContextMenu = function(params) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var browserWindow = wm.getMostRecentWindow("navigator:browser");
        browserWindow.screenshotSender.setupContextMenu(params);
    }

    this.setupBtsMenu = function() {
        for (var btsId in fulmo_bts_drivers) {
            document.getElementById('screenshot-sender-account-site-type').appendItem(fulmo_bts_drivers[btsId].label, btsId);
        }
        document.getElementById('screenshot-sender-account-site-type').selectedIndex = 0;
    }
});

window.addEventListener('load', function() {
    screenshotSenderSettings.init();
}, false);
