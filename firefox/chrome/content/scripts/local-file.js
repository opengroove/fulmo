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

fulmo.localFile = {
    saveImage: function(message, filename, callbackDataURL) {
        var IOService = Components.Constructor("@mozilla.org/network/io-service;1",
                                               "nsIIOService");

        function FilePicker() {
            return Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(Components.interfaces.nsIFilePicker);
        }
        function WebBrowserPersist() {
            return Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                   .createInstance(Components.interfaces.nsIWebBrowserPersist);
        }
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = FilePicker();
        picker.init(window, message, nsIFilePicker.modeSave);
        picker.defaultString = filename;
        picker.appendFilter('PNG', '*.png');
        picker.filterIndex = 0;
        switch (picker.show()) {
            case picker.returnOK:
            case picker.returnReplace:
                break;
            default:
                return;
        }
        if (!picker.file) {
            return;
        }
        var save;
        try {
            const {Downloads} = Components.utils.import("resource://gre/modules/Downloads.jsm", {});
            save = function(source, target) {
                var promise = Downloads.createDownload({source: source, target: target});
                promise.then(function(download) { download.start() });
            };
        }
        catch (e) {
            save = function(source, target) {
                Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
                var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                         .getService(Components.interfaces.nsIWindowMediator);
                var browser = mediator.getMostRecentWindow("navigator:browser");
                var context = PrivateBrowsingUtils.getPrivacyContextFromWindow(browser);
                var persist = WebBrowserPersist();
                persist.saveURI(source, null, null, null, null, target, context);
            };
        }
        callbackDataURL(function(dataURL) {
            var uri = IOService().newURI(dataURL, "UTF8", null);
            save(uri, picker.file);
        });
    }
};

})(fulmo);
