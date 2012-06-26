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

var xmlHttpRequestCredential = new function() {
    var _isProxy = false;
    var _challenge = null;
    var _authType = '';
    var _sessionState = {};
    var _continuationState = {};

    this.usable = function() {
        return _challenge != null;
    };

    this.setup = function(authType, isProxy, challenge) {
        _authType = authType;
        _isProxy = isProxy;
        _challenge = challenge;
    };

    this.cleanup = function() {
        _isProxy = false;
        _challenge = null;
        _sessionState = {};
        _continuationState = {};
    };
    
    this.createHeader = function(channel, host, url, user, password) {
        var authenticator = Components.classes["@mozilla.org/network/http-authenticator;1?scheme=" + _authType].getService(Components.interfaces.nsIHttpAuthenticator);
        var outFlags = {};
        var credentials = authenticator.generateCredentials(channel, _challenge,
                                                            _isProxy, host, user,
                                                            password, _sessionState,
                                                            _continuationState, outFlags);
        var httpChannel = channel.QueryInterface(Components.interfaces.nsIHttpChannel);
        if (_isProxy) {
            httpChannel.setRequestHeader("Proxy-Authorization", credentials, true);
        } else {
            httpChannel.setRequestHeader("Authorization", credentials, true);
        }
    }
};

var FulmoXMLHttpRequestBackup = XMLHttpRequest;
var FulmoXMLHttpRequest = function() {
    var _channel;
    var _url;
    var _host;
    var _async;
    var _method;
    var _scheme;
    var _requestHeaders = {};
    var _responseHeaders = {};
    var _rowResponseHeader = '';
    var _THIS = this;
    var _ioService
    var _requestText;
    var _listener;
    var _observeListener;
    var _callback;

    var READY_STATE_UNINITIALIZED = 0;
    var READY_STATE_LOADING       = 1;
    var READY_STATE_LOADED        = 2;
    var READY_STATE_INTERACTIVE   = 3;
    var READY_STATE_COMPLETE      = 4;

    this.open = function(method, url, async, user, password) {
        _method = method;
        _url = url;
        _async = async;
        _user = user;
        _password = password;

        var urlRegex = new RegExp(/^(https?):\/\/([^:\/]*)((:([0-9]+))?)(\/.*)/);
        if (url.match(urlRegex)) {
            _scheme = RegExp.$1;
            if (_scheme != 'http' && _scheme != 'https') {
                throw new Error("Invalid scheme '" + _scheme + "'.");
            }
            _host = RegExp.$2;
        } else {
            throw new Error('Invalid url');
        }
        this.statusText = '';
        this.responseText = '';
        this.responseXML = null;
        this.status = 0;
    };
    
    this.setRequestHeader = function(key, value) {
        _requestHeaders[key] = value;
    };

    this.readyState = READY_STATE_UNINITIALIZED;

    this.onreadystatechange = function(){};

    this.getAllResponseHeaders = function() {
        return _rowResponseHeader;
    };

    this.getResponseHeader = function(key) {
        return _responseHeaders[key.toLowerCase()];
    };

    this.abort = function() {
    };

    this.responseXML = null;

    this.send = function(data, callback) {
        this.sendAsBinary(unescape(encodeURIComponent(data)), callback);
    };

    this.sendAsBinary = function(data, callback) {
        _callback = callback;
        _requestText = data;
        _THIS.readyState = READY_STATE_LOADING;
        _THIS.onreadystatechange();
        _ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        _channel = setupChannel(_requestText);
        _listener.startup();
        _channel.asyncOpen(_listener, null);
    };

    _listener = new function StreamListener() {
        var _data = '';
        var _authCallback = false;
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this, "http-on-modify-request", false);
        observerService.addObserver(this, "http-on-examine-response", false);

        this.startup = function() {
            _authCallback = false;
        };

        this.onStartRequest = function (aRequest, aContext) {
            var http = aRequest.QueryInterface(Components.interfaces.nsIHttpChannel);
            var challenges = [];
            var isProxy = false;
            _data = '';

            if (http.responseStatus == 407 && !_authCallback) {
                isProxy = true;
                challenges = http.getResponseHeader("Proxy-Authenticate").split("\n");
            } else if (http.responseStatus == 401 && !_authCallback) {
                challenges = http.getResponseHeader("WWW-Authenticate").split("\n");
            } else {
                _THIS.status = http.responseStatus;
                _authCallback = false;
                return;
            }

            var challenge = challenges[0];
            var authType = (challenge.split(/\s/))[0].toLowerCase();

            switch (authType) {
                case "basic":
                case "digest":
                case "ntml":
                case "negotiate":
                    break;
                default:
                    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            }
            xmlHttpRequestCredential.setup(authType, isProxy, challenges);

            _authCallback = function () {
                _channel = setupChannel(_requestText);
                _channel.asyncOpen(_listener, null);
            }
        };

        this.onDataAvailable = function (aRequest, aContext, aStream, aSourceOffset, aLength) {
            var stream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
            stream.init(aStream);
            _data += stream.read(aLength);
        };

        this.onStopRequest = function (aRequest, aContext, aStatus) {
            _channel = null;
            if (_authCallback) {
                _authCallback();
            } else {
                if (Components.isSuccessCode(aStatus)) {
                    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                                              .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                    // XXX response data is charset=utf-8 at any time
                    converter.charset = "UTF-8";
                    _data = converter.ConvertToUnicode(_data);
                    _THIS.responseText = _data;
                    var parser = new DOMParser();
                    _THIS.responseXML = parser.parseFromString(_data, 'application/xml');
                } else {
                }
                _THIS.readyState = READY_STATE_COMPLETE;
                _THIS.onreadystatechange();
                if (_callback) _callback();
            }
        };

        this.onChannelRedirect = function (aOldChannel, aNewChannel, aFlags) {
            _channel = aNewChannel;
        };

        this.getInterface = function (aIID) {
          try {
            return this.QueryInterface(aIID);
          } catch (e) {
            throw Components.results.NS_NOINTERFACE;
          }
        };

        this.onProgress = function (aRequest, aContext, aProgress, aProgressMax) {};
        this.onStatus = function (aRequest, aContext, aStatus, aStatusArg) {};
        this.onRedirect = function (aOldChannel, aNewChannel) {};

        this.observe = function(aSubject, aTopic, aData) {
            if (aSubject == _channel) {
                var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
                if (aTopic == "http-on-modify-request") {
                    httpChannel.setRequestHeader('Cookie', '', false);
                } else if (aTopic == "http-on-examine-response") {
                    httpChannel.setResponseHeader('Set-Cookie', '', false);
                }
            }
        };

        this.QueryInterface = function(aIID) {
            if (aIID.equals(Components.interfaces.nsISupports) ||
                aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
                aIID.equals(Components.interfaces.nsIChannelEventSink) || 
                aIID.equals(Components.interfaces.nsIProgressEventSink) ||
                aIID.equals(Components.interfaces.nsIHttpEventSink) ||
                aIID.equals(Components.interfaces.nsIStreamListener) ||
                aIID.equals(Components.interfaces.nsIObserver)) {
                    return this;
            }
            throw Components.results.NS_NOINTERFACE;
        }
    }();

    function setupChannel(data) {
        var channel = _ioService.newChannel(_url, null, null).QueryInterface(Components.interfaces.nsIHttpChannel);
        channel.notificationCallbacks = _listener;
        channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE |
                               Components.interfaces.nsIRequest.INHIBIT_CACHING;
        var httpChannel = channel.QueryInterface(Components.interfaces.nsIHttpChannel);
        if (data && data.length) {
            var inputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
            inputStream.setData(data, data.length);
            var uploadChannel = channel.QueryInterface(Components.interfaces.nsIUploadChannel);
            uploadChannel.setUploadStream(inputStream, "application/x-www-form-urlencoded", data.length);
        }
        for (var i in _requestHeaders) {
            httpChannel.setRequestHeader(i, _requestHeaders[i], true);
        }
        httpChannel.setRequestHeader('Content-Length', data.length, true);
        httpChannel.requestMethod = _method;

        if (xmlHttpRequestCredential.usable()) {
            xmlHttpRequestCredential.createHeader(channel, _host, _url, _user, _password);
        }
        return channel;
    }
}
