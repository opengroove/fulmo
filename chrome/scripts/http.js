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

fulmo.xmlHttpRequestCredential = new function() {
    this.cleanup = function() {};
};
var FulmoXMLHttpRequest = fulmo.FulmoXMLHttpRequest = XMLHttpRequest;

FulmoXMLHttpRequest.prototype.sendAsBinary = function(data, callback) {
    function byteValue(x){
        return x.charCodeAt(0) & 0xff;
    }
    var ords = Array.prototype.map.call(data, byteValue);
    var ui8a = new Uint8Array(ords);
    this.send(ui8a.buffer, callback);
}

FulmoXMLHttpRequest.prototype.openOrg = FulmoXMLHttpRequest.prototype.open;
FulmoXMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this.__url = url;
    this.__savedCookies = {};
    var _THIS = this;

    this.urlFromCookie = function(cookie) {
        return (cookie.secure ? 'https://' : 'http://')
             + cookie.domain + cookie.path;
    }

    var readystatechange = function() {
        if (this.readyState === 4) {
            // Remove new incoming cookies
            chrome.cookies.getAll({url: url}, function(cookies) {
                function removeChain(idx) {
                    if (idx < cookies.length) {
                        var cookie = cookies[idx];
                        var details = {url: _THIS.urlFromCookie(cookie), name: cookie.name};
                        chrome.cookies.remove(details, function() {
                            removeChain(idx + 1);
                        });
                    } else {
                        function setChain(idx) {
                            if (idx < _THIS.__savedCookies.length) {
                                var cookie = _THIS.__savedCookies[idx];
                                if (!cookie.url)
                                    cookie.url = _THIS.urlFromCookie(cookie);
                                if ('session' in cookie)
                                    delete cookie.session;
                                if ('hostOnly' in cookie) {
                                    if (cookie.hostOnly && 'domain' in cookie)
                                        delete cookie.domain;
                                    delete cookie.hostOnly;
                                }
                                chrome.cookies.set(_THIS.__savedCookies[idx], function(){
                                    setChain(idx + 1);
                                });
                            } else {
                                if (_THIS.__callback) {
                                    _THIS.__callback();
                                }
                            }
                        }
                        setChain(0);
                    }
                }
                removeChain(0);
            });
            this.onload = undefined;
        }
    };
    this.onload = readystatechange;
    this.openOrg(method, url, async, user, password);
}

FulmoXMLHttpRequest.prototype.sendOrg = FulmoXMLHttpRequest.prototype.send;
FulmoXMLHttpRequest.prototype.send = function(data, callback) {
    var _THIS = this;
    this.__callback = callback;

    // Save original cookies and remove
    chrome.cookies.getAll({url: this.__url}, function(cookies) {
        function removeChain(idx) {
            if (idx < cookies.length) {
                var cookie = cookies[idx];
                var details = {url: _THIS.urlFromCookie(cookie), name: cookie.name};
                chrome.cookies.remove(details, function() {
                    removeChain(idx + 1);
                });
            } else {
                _THIS.sendOrg(data);
            }
        }
        _THIS.__savedCookies = cookies;
        removeChain(0);
    });
}

})(fulmo);
