/*
 * Copyright (C) 2011, OpenGroove, Inc. All rights reserved.
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

$(function() {
    var mainInterfaceImplementation = {
        getImageParams:  function() {
            return window.opener.imageParams;
        },
        setImageParams: function(v) {
            imageParams = [
                v.url, v.width, v.height
            ];
        },
        getString: function(tag) {
            return chrome.i18n.getMessage(tag);
        },
        getFormattedString: function(tag, prm) {
            return $.formatString(chrome.i18n.getMessage(tag), prm);
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
            var okButtonPushed = false;
            $('#screenshot-sender-account-name').text(account.name);
            if (account.userId.length) {
                $('#screenshot-sender-account-id').val(account.userId);
                $('#screenshot-sender-account-id').attr('disabled', true);
            } else {
                $('#screenshot-sender-account-id').val('');
                $('#screenshot-sender-account-id').attr('disabled', false);
            }
            if (account.password.length) {
                $('#screenshot-sender-account-password').val(account.password);
                $('#screenshot-sender-account-password').attr('disabled', true);
            } else {
                $('#screenshot-sender-account-password').val('');
                $('#screenshot-sender-account-password').attr('disabled', false);
            }
            $('#screenshot-sender-account-dialog').dialog('option', 'buttons', [
                {
                    text: chrome.i18n.getMessage('fulmo_general_button_ok'),
                    click: function() {
                        account.userId = $('#screenshot-sender-account-id').val();
                        account.password = $('#screenshot-sender-account-password').val();
                        okButtonPushed = true;
                        $(this).dialog("close");
                        succFunc();
                    }
                },
                {
                    text: chrome.i18n.getMessage('fulmo_general_button_cancel'),
                    click: function() {
                         $(this).dialog("close");
                    }
                }
            ]);
            $('#screenshot-sender-account-dialog').dialog('option', 'close', function() {
                if (!okButtonPushed) failFunc();
            });

            // ウェイト無しだとダイアログが正しく中心に配置されない場合があるので、
            // 少しまってから表示する。
            setTimeout(function() {
                $('#screenshot-sender-account-dialog').dialog('open');
            }, 500);
        },
        imagePath: function() {
            return 'images/';
        },
        openURL: function(url) {
            window.open(url, '_blank');
        }
    };
    $('#screenshot-sender-account-dialog').dialog({
        autoOpen: false,
        modal: true,
        width: 320
    });
    screenshotSenderMain(mainInterfaceImplementation);
}, false);
