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

var fulmoSettingsManager = new (function() {
    var loginManagerPrefix = 'chrome://fulmo.account.';
    this.save = function(data) {
        var prefSvc = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
        var prefBranch = prefSvc.getBranch('extensions.fulmo.');

        var saveData = JSON.parse(JSON.stringify(data)); // シリアライズを経由する事でコピーを作成する
        var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

        var currentLogins = loginManager.getAllLogins({}); 
        for (var i = 0; i < currentLogins.length; i++) {
            var loginInfo = currentLogins[i];
            if (loginInfo.hostname.substr(0, loginManagerPrefix.length) == loginManagerPrefix) {
                loginManager.removeLogin(loginInfo);
            }
        }
        var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
        for (i = 0; i < saveData.accounts.length; i++) {
            var account = saveData.accounts[i];
            if (account.password.length) {
                loginInfo = new nsLoginInfo(loginManagerPrefix + account.id, null, account.url /* realm */ , account.userId, account.password, "", "");
                loginManager.addLogin(loginInfo);
                account.password = '';
            }
        }
        prefBranch.setCharPref('settings', unescape(encodeURIComponent(JSON.stringify(saveData))));
    };
    this.load = function() {
        var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
        var prefSvc = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
        var prefBranch = prefSvc.getBranch('extensions.fulmo.');
        var data = decodeURIComponent(escape(prefBranch.getCharPref('settings')));
        settings = JSON.parse(data);
        if (!settings.accounts) settings.accounts = [];
        for (var i = 0; i < settings.accounts.length; i++) {
            var account = settings.accounts[i];
            account.password = '';
            var logins = loginManager.findLogins({}, loginManagerPrefix + account.id, null, account.url);
            if (logins.length) {
                account.password = logins[0].password;
            }
            switch (account.authType) {
            case null:
            case '0': account.authType = 'none'; break;
            case '1': account.authType = 'http'; break;
            }
            if (account.siteType == null) {
                if (account.url.match(/^https:\/\/[^.]+\.ciklone\.com\//)) {
                    account.siteType = 'ciklone';
                } else {
                    account.siteType = 'trac';
                }
            }
        }
        return settings;
    };
})();
