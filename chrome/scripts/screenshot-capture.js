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

fulmo.Capture = function(W, CII) {
    var settingsDialog = null;
    var settingsDialog_bk = null;
    var doingNow = false;
    var THIS = this;
    var zMax = 2147483647;
    var bgArea = null;
    var targetArea = null;
    var startX, startY, endX, endY;
    var dragModeNow = false;
    var imageParams = null;
    var settings = false;

    this.defaultCommand = function() {
        if (doingNow) { // ツールバー上のメニューがクリックされた時の対処
            doingNow = false;
            return; 
        }
        CII.loadSettings(function(_settings){
            settings = _settings;
            if (!checkSites()) return;
            var action = settings.defaultAction;
            THIS.goSend(action);
            doingNow = false;
        });
    };

    this.goSend = function(mode) {
        mode = parseInt(mode);
        CII.loadSettings(function(_settings){
            settings = _settings;
            doingNow = true;
            if (!checkSites()) return;
            switch (mode) {
            case 0:
                getScreenShot(calcDocumentRect());
                break;
            case 10:
                getScreenShot(calcWindowRect());
                break;
            case 20:
                startDragMode();
                break;
            case 30:
                setupMainWindow(null);
                break;
            }
        });
    };

    this.settings = function() {
        doingNow = true;
        CII.openSettingWindow();
    };

    function calcDocumentRect() {
        var doc = W().document;
        var element
            = (doc.documentElement && doc.documentElement.clientHeight != 0)
            ? doc.documentElement : doc.body;
        return [0, 0, element.scrollWidth, element.scrollHeight];
    }

    function calcWindowRect() {
        var doc = W().document;
        var element
            = (doc.documentElement && doc.documentElement.clientHeight != 0)
            ? doc.documentElement : doc.body;
        return [element.scrollLeft, element.scrollTop,
                element.clientWidth, element.clientHeight];
    }

    function getScreenShot(rect) {
        var width = rect[2];
        var height = rect[3];
        CII.createScreenCapture(rect, function(url) {
//            setupMainWindow([url, width, height]);
            setupEditor([url, width, height]);
        });
    }

    function endDragMode() {
        var window = W();
        var body = window.document.body;
        if (targetArea) body.removeChild(targetArea);
        if (bgArea) body.removeChild(bgArea);
        if (dragModeNow) {
            window.removeEventListener('keydown', keyCheck, false);
        }
        targetArea = null;
        bgArea = null;
    }

    function startDragMode() {
        endDragMode();
        if (dragModeNow) {
            dragModeNow = false;
            return;
        }
        dragModeNow = true;
        var doc = W().document;
        bgArea = doc.createElement("div");
        bgArea.style.cssText = [
            'position:fixed', 'background:#000000', 'top:0', 'left:0',
            'width:4000px', 'height:4000px', 'overflow:hidden',
            'cursor:crosshair', 'z-index:' + (zMax - 1) ].join(';');
        bgArea.style.opacity = 0.15;
        doc.body.appendChild(bgArea);

        targetArea = doc.createElement("div");
        targetArea.style.cssText = [
            'display:none', 'position:fixed', 'background:#150d62',
            'border:1px #150d62 solid', 'top:0', 'left:0', 'width:1px',
            'height:1px', 'overflow:hidden', 'cursor:crosshair',
            'z-index:' + zMax ].join(';');
        targetArea.style.opacity = 0.25;
        doc.body.appendChild(targetArea);
        bgArea.addEventListener('mousedown', startAreaRect, false);
        bgArea.addEventListener('mousemove', resizeAreaRect, false);
        bgArea.addEventListener('mouseup', endAreaRect, false);
        W().addEventListener('keydown', keyCheck, false);

        targetArea.addEventListener('mousedown', startAreaRect, false);
        targetArea.addEventListener('mousemove', resizeAreaRect, false);
        targetArea.addEventListener('mouseup', endAreaRect, false);
    }

    function keyCheck(ev) {
        if (ev.keyCode == 27) {
            endDragMode();
            dragModeNow = false;
        }
        ev.preventDefault();
    }

    function startAreaRect(ev) {
        targetArea.style.display = 'block';
        targetArea.style.left = ev.clientX + 'px';
        targetArea.style.top = ev.clientY + 'px';
        targetArea.style.width = '1px';
        targetArea.style.height = '1px';
        startX = ev.clientX;
        startY = ev.clientY;
        ev.preventDefault();
    }

    function resizeAreaRect(ev) {
        endX = ev.clientX;
        endY = ev.clientY;
        var x = startX;
        var y = startY;
        var w = endX - startX;
        var h = endY - startY;
        if (w < 0) {
            x = endX;
            w = -w;
        }
        if (h < 0) {
            y = endY;
            h = -h;
        }
        targetArea.style.left = x + 'px';
        targetArea.style.top = y + 'px';
        targetArea.style.width = w + 'px';
        targetArea.style.height = h + 'px';
        ev.preventDefault();
    }

    function endAreaRect(ev) {
        endX = ev.clientX;
        endY = ev.clientY;
        var x = startX;
        var y = startY;
        var w = endX - startX;
        var h = endY - startY;
        if (w < 0) {
            x = endX;
            w = -w;
        }
        if (h < 0) {
            y = endY;
            h = -h;
        }
        targetArea.style.display = 'none';
        if (w < 4 && h < 4) {
            return;
        }
        var r = calcWindowRect();
        endDragMode();
        dragModeNow = false;
        getScreenShot([r[0] + x, r[1] + y, w, h]);
        ev.preventDefault();
    }

    function checkSites() {
        if (!settings.accounts || !settings.accounts.length) {
            if (confirm(CII.getString('fulmo_general_no_site_warn'))) {
                THIS.settings();
            }
            return false;
        }
        return true;
    }

    this.getImageParams = function() {
        return imageParams;
    };

    this.setImageParams = function(params) {
        imageParams = params;
    }

    function setupMainWindow(params) {
        imageParams = params;
        CII.openMainWindow(params);
    }

    function setupEditor(params) {
        imageParams = params;
        CII.openEditor(params);
    }

    this.setupContextMenu = function(params) {
        CII.setupContextMenu(params);
    };
}

})(fulmo);
