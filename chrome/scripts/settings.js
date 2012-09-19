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

var ScreenshotSenderSettings = function(SII /* settingInterfaceImplementation */) {
    var settings = null;
    var currentId = -1;
    var updated = false;
    var startupNow = true;
    var listUpdateNow = false;
    var urlRegex = new RegExp('^(https?)://([^:/]+)((:([0-9]+))?)(/.*)?$');

    this.init = function() {
        settings = fulmoSettingsManager.load();
        if (!settings.accounts) {
            settings.accounts = [];
        }
        if (!settings.defaultAccountId) {
            settings.defaultAccountId = 0;
        }
        if (!settings.defaultAction) {
            settings.defaultAction = 0;
        }
        if (!settings.contextMenu) {
            settings.contextMenu = [];
        }

        SII.selectListItemByValue('screenshot-sender-general-default-action-list', settings.defaultAction);

        var list = document.getElementById('screenshot-sender-account-list');
        var currentPos = 0;
        SII.setupBtsMenu();
        if (settings.accounts.length) {
            for (var i = 0; i <  settings.accounts.length; i++) {
                var li = SII.addListItem('screenshot-sender-account-list', settings.accounts[i].name, settings.accounts[i].id);
                if (settings.defaultAccountId == settings.accounts[i].id) {
                    currentPos = i;
                }
            }
            currentId = currentPos ? settings.defaultAccountId : settings.accounts[0].id;
            setUi(currentId);
            SII.setDefaultIcon(settings);
        }
        SII.setContextMenuStatus(settings.contextMenu);
        setEditMode(settings.accounts.length == 0);
        startupNow = false;
    }

    this.onChange = function() {
        if (startupNow) return;
        updated = true;
    }

    this.onChangeName = function() {
        if (listUpdateNow) return;
        var name = document.getElementById('screenshot-sender-account-name').value;
        SII.setCurrentListITemLabel('screenshot-sender-account-list', name);
        settings.accounts[getSettingPos(currentId)].name = name;
    }

    function clearUi() {
        var texts = [
            'screenshot-sender-account-name',
            'screenshot-sender-account-url',
            'screenshot-sender-account-user-id',
            'screenshot-sender-account-password'
        ];
        var lists = [
            'screenshot-sender-account-site-type',
            'screenshot-sender-account-auth-type'
        ];
        for (var i = 0; i < texts.length; i++) {
            document.getElementById(texts[i]).value = '';
        }
        for (var i = 0; i < lists.length; i++) {
            document.getElementById(lists[i]).selectedIndex = 0;
        }
    }
    
    function getSettingPos(id) {
        for (var i = 0; i < settings.accounts.length; i++) {
            if (settings.accounts[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    function setUi(c) {
        var setting = settings.accounts[getSettingPos(c)];
        document.getElementById('screenshot-sender-account-name').value = setting.name;
        document.getElementById('screenshot-sender-account-url').value = setting.url;
        document.getElementById('screenshot-sender-account-site-type').value = setting.siteType;
        document.getElementById('screenshot-sender-account-auth-type').value = setting.authType;
        document.getElementById('screenshot-sender-account-user-id').value = setting.userId;
        document.getElementById('screenshot-sender-account-password').value = setting.password
        SII.selectListItemByValue('screenshot-sender-account-list', c);
    }

    this.onSelectAccount = function() {
        if (listUpdateNow) return;
        if (!validateCurrentAccount()) {
            SII.selectListItemByValue('screenshot-sender-account-list', currentId);
            return;
        }
        settings.accounts[getSettingPos(currentId)] = getCurrentAccount(false);
        currentId = SII.currentListItem('screenshot-sender-account-list') ? SII.listValue('screenshot-sender-account-list') : -1;
        if (currentId != -1) {
            setUi(currentId);
            setEditMode(false);
        } else {
            setEditMode(true);
        }
    }

    function getAccountNewId() {
        max = 0;
        for (var i = 0; i < settings.accounts.length; i++) {
            if (max < settings.accounts[i].id) max = settings.accounts[i].id;
        }
        return parseInt(max) + 1;
    }

    function setEditMode(noList) {
        document.getElementById('screenshot-sender-account-add-button').disabled = false;

        var fields = [
            'screenshot-sender-account-name',
            'screenshot-sender-account-url',
            'screenshot-sender-account-site-type',
            'screenshot-sender-account-auth-type',
            'screenshot-sender-account-user-id',
            'screenshot-sender-account-password'
        ];
        var buttons = [
            'screenshot-sender-account-copy-button',
            'screenshot-sender-account-delete-button',
            'screenshot-sender-account-set-default-button'
        ];

        for (var i = 0; i < buttons.length; i++) {
            SII.disableButton(buttons[i], noList);
        }
        for (var i = 0; i < fields.length; i++) {
            document.getElementById(fields[i]).disabled = noList;
        }
    }

    function validateAccount(s) {
        var out = [];
        var ids = [];
        var mess = [];
        if (!s.name || !s.name.length) {
            out.push(['screenshot-sender-account-name', true, 'screenshot-sender-account-name-lv', SII.getString('fulmo_setting_message_account_name_ind')]);
        }
        if (!s.url || !s.url.length) {
            out.push(['screenshot-sender-account-url', true, 'screenshot-sender-account-url-lv', SII.getString('fulmo_setting_message_url_ind')]);
        } else if (!s.url.match(urlRegex)) {
            out.push(['screenshot-sender-account-url', true, 'screenshot-sender-account-url-lv', SII.getString('fulmo_setting_message_url_warn')]);
        }
        return out;
    }

    function validateCurrentAccount() {
        if (currentId == -1) return true;
        var account = getCurrentAccount(false);
        var validateResult = validateAccount(account);
        if (validateResult.length) {
            displayError(validateResult);
            return false;
        }
        return true;
    }

    function displayError(errors) {
        var mess = [];
        for (var i = 0; i < errors.length; i++) {
            mess.push(errors[i][3]);
        }
        alert(mess.join('\n'));
        document.getElementById(errors[0][0]).focus();
        if (errors[0][1]) {
            document.getElementById(errors[0][0]).select();
        }
    }

    function getCurrentAccount(isNew) {
        var url = document.getElementById('screenshot-sender-account-url').value;
        var out = {
            id:         isNew ? getAccountNewId() : currentId,
            name:       document.getElementById('screenshot-sender-account-name').value,
            url:        url,
            siteType:   SII.listValue('screenshot-sender-account-site-type'),
            authType:   SII.listValue('screenshot-sender-account-auth-type'),
            userId:     document.getElementById('screenshot-sender-account-user-id').value,
            password:   document.getElementById('screenshot-sender-account-password').value,
            errorMessage: null,
            isValid:    function(){ return this.errorMessage === null; }
        }
        if (url.match(urlRegex)) {
            out.protocol = RegExp.$1;
            out.host = RegExp.$2;
            out.port = 0 + RegExp.$5;
            if (!out.port) out.port =out.protocol == 'http' ? 80 : 443;
            out.path = RegExp.$6;
        } else {
            out.errorMessage = SII.getString('fulmo_setting_message_url_warn');
        }
        return out;
    }

    this.addAccount = function() {
        if (!validateCurrentAccount()) return;
        if (currentId != -1) {
            settings.accounts[getSettingPos(currentId)] = getCurrentAccount(false);
        }
        clearUi();
        var newAccount = getCurrentAccount(true);
        var tmpName = SII.getString('fulmo_setting_value_default_account_name');
        newAccount.name = getUniqueName(tmpName);
        settings.accounts.push(newAccount);
        currentId = newAccount.id

        listUpdateNow = true;
        setEditMode(false);
        var li = SII.addListItem('screenshot-sender-account-list', newAccount.name, newAccount.id);
        updated = true;
        setUi(currentId);
        document.getElementById('screenshot-sender-account-name').select();
        document.getElementById('screenshot-sender-account-name').focus();
        setTimeout(function(){
            listUpdateNow = false;
        },0);
    }

    function getPosFromName(name) {
        for (var i = 0; i < settings.accounts.length; i++) {
            if (settings.accounts[i].name == name) return i;
        }
        return -1;
    }

    function getUniqueName(orig) {
        if (getPosFromName(orig) == -1)
            return orig;
        var name = orig;
        for (var i = 2; i < 99; i++) {
            name = orig + ' (' + i + ')';
            if (getPosFromName(name) == -1)
                return name;
        }
        return name;
    }

    this.copyAccount = function() {
        if (!validateCurrentAccount()) return;
        settings.accounts[getSettingPos(currentId)] = getCurrentAccount(false);
        var copyAccount = getCurrentAccount(true);
        copyAccount.name = getUniqueName(SII.getString('fulmo_value_copied_account_name')
                                         .replace(/\$\{name\}/g, copyAccount.name));
        settings.accounts.push(copyAccount);
        currentId = copyAccount.id;

        listUpdateNow = true;
        var li = SII.addListItem('screenshot-sender-account-list', copyAccount.name, copyAccount.id);
        updated = true;
        setUi(currentId);
        document.getElementById('screenshot-sender-account-name').select();
        document.getElementById('screenshot-sender-account-name').focus();
        listUpdateNow = false;
    }

    this.deleteAccount = function() {
        var name = document.getElementById('screenshot-sender-account-name').value;
        if (confirm(SII.getFormattedString('fulmo_setting_message_confirm_delete', [name]))) {
            listUpdateNow = true;
            var idx = getSettingPos(currentId);
            settings.accounts.splice(idx, 1);
            var list = document.getElementById('screenshot-sender-account-list');
            list.removeChild(SII.currentListItem('screenshot-sender-account-list'));
            currentId = -1;
            clearUi();
            setEditMode(true);
            listUpdateNow = false;
        }
    }

    this.setDefaultAccount = function() {
        updated = true;
        settings.defaultAccountId = currentId;
        SII.setDefaultIcon(settings);
    }

    this.onSelectDefaultAction = function() {
        update = true;
        settings.defaultAction = parseInt(
            document.getElementById('screenshot-sender-general-default-action-list').currentItem.value,
            10);
    }

    this.ok = function() {
        settings.contextMenu = SII.getContextMenuStatus();
        if (currentId != -1) {
            if (!validateCurrentAccount()) return false;
            settings.accounts[getSettingPos(currentId)] = getCurrentAccount(false);
        }
        fulmoSettingsManager.save(settings);
        SII.setupContextMenu(settings.contextMenu);
        SII.closeWindow();
        return true;
    }

    this.cancel = function() {
        SII.closeWindow();
        return true;
    }

    this.goTest = function() {

        function testStart() {
            SII.testStart();
            fulmo_bts_drivers[account.siteType].loginTest({
                account: account,
                formatString: SII.getFormattedString,
                success: function(message) {
                    SII.testEnd();
                    alert(message);
                },
                error: function(message) {
                    SII.testEnd();
                    alert(message);
                }
            });
        }

        function testEnd() {
            SII.testEnd();
        }

        var account = getCurrentAccount(true);
        if (!account.isValid()) {
            alert(account.errorMessage);
            return;
        }

        if (account.authType == 'none') {
            testStart();
            testEnd();
        } else {
            var testParams = {account: account, goLogin:false};
            SII.testConfirm(testParams, testStart, testEnd);
        }
    }

};
