window.addEventListener('load', function() {
    var mainInterfaceImplementation = {
        getImageParams:  function() {
            return window.opener.screenshotSender.getImageParams();
        },
        setImageParams: function(v) {
            imageParams = [
                v.url, v.width, v.height
            ];
        },
        getString: function(tag) {
            var strings = window.opener.document.getElementById('screenshot-sender-strings');
            return strings.getString(tag);
        },
        getFormattedString: function(tag, args) {
            var strings = window.opener.document.getElementById('screenshot-sender-strings');
            return strings.getFormattedString(tag, args);
        },
        login: function(account, succFunc, failFunc) {
            if (account.userId.length && account.password.length) {
                succFunc();
                return;
            }
            if (!parseInt(account.authType)) {
                succFunc();
                return;
            }
            var params = {account: account, goLogin:false};
            window.openDialog('login.xul', '_blank', 'modal,centerscreen', params);
            if (params.goLogin) {
                succFunc();
            } else {
                failFunc();
            }
        },
        imagePath: function() {
            return 'chrome://fulmo/skin/images/';
        },
        openURL: function(url) {
            window.opener.gBrowser.selectedTab = window.opener.gBrowser.addTab(url);
        }
    };
    if (!window.opener) {
        window.close();
        return;
    }
    screenshotSenderMain(mainInterfaceImplementation);
}, false);
