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

window.addEventListener('load', function(){
    if (document.getElementById('screenshot-sender-account-name')) {
        document.getElementById('screenshot-sender-account-name').value = window.arguments[0].account.name;
    }
    document.getElementById('screenshot-sender-account-user-id').value = window.arguments[0].account.userId;
    document.getElementById('screenshot-sender-account-password').value = window.arguments[0].account.password;
    if (window.arguments[0].account.userId.length) {
        document.getElementById('screenshot-sender-account-user-id').disabled = true;
    }
    if (window.arguments[0].account.password.length) {
        document.getElementById('screenshot-sender-account-password').disabled = true;
    }
}, false);

function onOk() {
    window.arguments[0].account.userId = document.getElementById('screenshot-sender-account-user-id').value;
    window.arguments[0].account.password = document.getElementById('screenshot-sender-account-password').value;
    window.arguments[0].goLogin = true;
}
