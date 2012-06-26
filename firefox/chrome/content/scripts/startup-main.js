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

window.addEventListener('load', function() {
    var baseWindow = window.opener;

    var mainInterfaceImplementation = {
        getImageParams:  function() {
            return baseWindow.screenshotSender.getImageParams();
        },
        setImageParams: function(v) {
            imageParams = [
                v.url, v.width, v.height
            ];
        },
        getString: function(tag) {
            try {
                var strings = baseWindow.document.getElementById('screenshot-sender-strings');
                return strings.getString(tag);
            }
            catch (e) {
                if (window.console && console.log)
                    console.log(e);
                return tag;
            }
        },
        getFormattedString: function(tag, args) {
            try {
                var strings = window.opener.document.getElementById('screenshot-sender-strings');
                return strings.getFormattedString(tag, args);
            }
            catch (e) {
                if (window.console && console.log)
                    console.log([e, tag, args]);
                return tag;
            }
        },
        login: function(account, succFunc, failFunc) {
            if (account.userId.length && account.password.length) {
                succFunc();
                return;
            }
            if (account.authType == 'none') {
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
        },
        openEditorTab: function(imageParams, dirty) {
            var dirty_str = dirty ? '#dirty=1' : '';
            location.href = 'editor.html' + dirty_str;
        },
        showImageDialog: function(message, filename, callbackDataURL) {
            screenshotSenderLocalFile.saveImage(message, filename, callbackDataURL);
        }
    };
    if (!window.opener) {
        window.close();
        return;
    }
    screenshotSenderMain(mainInterfaceImplementation);
}, false);
