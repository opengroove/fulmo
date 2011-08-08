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
        }
        return settings;
    };
})();
