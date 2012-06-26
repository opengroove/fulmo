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

$(function() {

    var imageParams = null;
    var baseWindow = window.opener;
    var editorInterfaceImplementation = {
        getImageParams:  function() {
            imageParams = baseWindow.screenshotSender.getImageParams()
            return imageParams;
        },
        returnToMain: function(imageUrl, dirty) {
            var dirty_str = dirty ? '#dirty=1' : '';
            imageParams[0] = imageUrl;
            location.href = 'chrome://fulmo/content/main.html' + dirty_str;
        },
        setShadow: function(ctx) {
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.shadowColor = "#000";
        },
        getString: function(tag) {
            try {
                var strings = baseWindow.document.getElementById('screenshot-sender-strings');
                return strings.getString(tag);
            }
            catch (e) {
                if (window.console && console.log)
                    console.log([e, tag]);
                return tag;
            }
        },
        showImageDialog: function(message, filename, callbackDataURL) {
            screenshotSenderLocalFile.saveImage(message, filename, callbackDataURL);
        }
    };
    screenshotSenderEditor(editorInterfaceImplementation);
});
