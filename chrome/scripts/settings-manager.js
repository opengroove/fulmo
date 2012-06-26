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
    var masterPassword = '{E813A1FD-5C63-49c2-B898-82E683AC713B}';
    this.save = function(data) {
        var str = JSON.stringify(data);
        localStorage.data = sjcl.encrypt(masterPassword, str);
    };
    this.load = function() {
        var tmp = null;
        try {
            tmp = sjcl.decrypt(masterPassword, localStorage.data);
        } catch(e) {
        }
        if (!tmp) tmp = '{}';
        var params = JSON.parse(tmp);
        if (params.accounts) {
            for (var i = 0; i < params.accounts.length; i++) {
                var account = params.accounts[i];
                switch (account.authType) {
                case null:
                case 0: account.authType = 'none'; break;
                case 1: account.authType = 'http'; break;
                }
                if (account.siteType == null || account.siteType == 'trac') {
                    if (account.url.match(/^https:\/\/[^.]+\.ciklone\.com\//)) {
                        account.siteType = 'ciklone';
                    } else {
                        account.siteType = 'trac';
                    }
                }
            }
        }
        return params;
    };
})();

