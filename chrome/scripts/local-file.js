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

var screenshotSenderLocalFile = {
    saveImage: function(message, filename, callbackDataURL) {
        var URL = window.URL || window.webkitURL || undefined;
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                          undefined;

        function getBlobFromDataURL(url) {
            var re = /^data:([^,;]+)((?:;[^;,]*)*),([^\n]*)/;
            var match = re.exec(url);
            if (!match) {
                return;
            }
            var mimetype = match[1].toLowerCase();
            var attrs = match[2].substring(1);
            var body = match[3];
            $.each(attrs.split(/;/), function(idx, val) {
                switch (val) {
                case 'base64':
                    body = atob(body);
                    break;
                }
            });
            var length = body.length;
            var buffer = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                buffer[i] = body.charCodeAt(i);
            }
            var builder = new BlobBuilder();
            builder.append(buffer.buffer);
            return builder.getBlob(mimetype);
        }

        callbackDataURL(function(uri) {
            var blob = getBlobFromDataURL(uri);
            var href = URL.createObjectURL(blob);
            try {
                var anchor = document.createElement('a');
                anchor.href = href;
                anchor.setAttribute('download', filename);
                anchor.click();
            }
            finally {
                setTimeout(function() { URL.revokeObjectURL(href) },
                           600 * 1000);
            }
        });
    }
}
