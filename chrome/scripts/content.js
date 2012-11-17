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

function getScrollPos() {
    var x = document.documentElement.scrollLeft || document.body.scrollLeft;
    var y = document.documentElement.scrollTop || document.body.scrollTop;
    return [x, y];
}

function getScreenSize() {
    var w = document.documentElement.clientWidth || document.body.clientWidth || document.body.scrollWidth;
    var h = document.documentElement.clientHeight || document.body.clientHeight || document.body.scrollHeight;
    return [w, h];
}

function getDocSize() {
    var w = document.documentElement.scrollWidth || document.body.scrollWidth;
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    return [w, h];
}


var contentInterfaceImplementation = {
    createScreenCapture: function(rect, func) {
        var winSize = getScreenSize();
        var docSize = getDocSize();
        var currentPos = getScrollPos();
        var margin = 64;

        chrome.extension.sendRequest({command: 'setCanvasSize', width: rect[2], height: rect[3]}, function(res) {
            if (rect[0] == 0 && rect[1] == 0 && rect[2] == docSize[0] && rect[3] == docSize[1]) {
                function onScroll(ev) {
                      window.removeEventListener('scroll', onScroll, false);
                      setTimeout(function() {
                        var pos = getScrollPos();
                        x = pos[0];
                        y = pos[1];
                        chrome.extension.sendRequest({command: 'putDocumentPart', pos: [x, y, winSize[0], winSize[1]], margin: margin}, function(res) {
                            captureSplit(x, y);
                        });
                    }, 1);
                }
                function captureSplit(x, y) {
                    if (x + winSize[0] < docSize[0]) {
                        x += winSize[0] - margin;
                        window.addEventListener('scroll', onScroll, false);
                        setTimeout(function() {
                            window.scroll(x, y);
                        }, 10);
                    } else if (y + winSize[1] < docSize[1]) {
                        x = 0;
                        y += winSize[1] - margin;
                        window.addEventListener('scroll', onScroll, false);
                        setTimeout(function() {
                            window.scroll(x, y);
                        }, 10);
                    } else {
                        chrome.extension.sendRequest({command: 'getCanvas'}, function(res) {
                            window.scroll(currentPos[0], currentPos[1]);
                            func(res.url);
                        });
                    }
                }
                var x = 0;
                var y = 0;
                if (currentPos[0] == 0 && currentPos[1] == 0) {
                    onScroll(null);
                } else {
                    window.addEventListener('scroll', onScroll, false);
                    setTimeout(function() {
                        window.scroll(0, 0);
                    }, 10);
                }
            } else if (rect[0] == 0 && rect[1] == 0 && rect[2] == winSize[0] && rect[3] == winSize[1]) {
                chrome.extension.sendRequest({command: 'putDocumentPart', pos: [0, 0, winSize[0], winSize[1]], margin: 0}, function(res) {
                    chrome.extension.sendRequest({command: 'getCanvas'}, function(res) {
                        window.scroll(currentPos[0], currentPos[1]);
                        func(res.url);
                    });
                });
            } else {
                chrome.extension.sendRequest({command: 'putWindowPart', pos: [rect[0], rect[1], rect[2], rect[3]]}, function(res) {
                    chrome.extension.sendRequest({command: 'getCanvas'}, function(res) {
                        window.scroll(currentPos[0], currentPos[1]);
                        func(res.url);
                    });
                });
            }
        });
    },
    openMainWindow: function(params) {
        chrome.extension.sendRequest({command: 'openMainWindow', params: params}, function(res) {
        });
    },
    openEditor: function(params) {
        chrome.extension.sendRequest({command: 'openEditor', params: params}, function(res) {
        });
    },
    loadSettings: function(func) {
        chrome.extension.sendRequest({command: 'loadSetting'}, function(res) {
            func(JSON.parse(res.data));
        });
    },
    getString: function(tag) {
        try {
            return chrome.i18n.getMessage(tag);
        }
        catch (e) {
            if (window.console && console.log)
                console.log([e, tag]);
            return tag;
        }
    },
    openSettingWindow: function() {
        chrome.extension.sendRequest({command: "openSettingWindow"}, function(response) {});
    },
    setupContextMenu: function(params) {
        chrome.extension.sendRequest({command: "setupContextMenu", params: params}, function(response) {});
    }
};

var sender = new fulmo.Sender(function(){return window;}, contentInterfaceImplementation);
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (!request.command) {
            sendResponse({result: 'through'});
            return;
        } else if (request.command == 'documentCapture') {
            var sz = getScreenSize();
            if (sz[0] < 320 || sz[1] < 100) {
                alert(contentInterfaceImplementation.getString('fulmo_not_enough_width'));
            } else {
                sender.goSend(0);
            }
            sendResponse({result: 'ok'});
        } else if (request.command == 'windowCapture') {
            sender.goSend(10);
            sendResponse({result: 'ok'});
        } else if (request.command == 'selectArea') {
            sender.goSend(20);
            sendResponse({result: 'ok'});
        } else if (request.command == 'withoutImage') {
            sender.goSend(30);
            sendResponse({result: 'ok'});
        }
    }
);

})(fulmo);
