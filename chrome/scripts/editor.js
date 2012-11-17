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

// 選択
// 選択コマンドは実際にはプリミティブではないので特殊な実装になっている
// 新プリミティブ作成の参考にするべきではない
var primitiveSel = function (base, ctrlCtx, cvWidth, cvHeight) {
    var _layers;
    var _last;
    var _mode = 'none';
    var _current = null;
    var _currentNo = -1;
    var _top, _left, _right, _bottom;
    var _ox, _oy;
    var _width, _height;
    var _newLeft, _newTop, _newRight, _newBottom;
    var _moved;
    var _this = this;

    $('.drag-box').mousedown(function() {
        _mode = $(this).attr('id').substr('drag-'.length);
        _moved = false;
        return false;
    });
    $('.drag-box').mouseup(function() {
        _mode = 'none';
    });

    $('#prim-delete').click(function() {
        _this.remove();
    });

    this.init = function() {
        _layers = base.layers();
        _last = null;
        _mode = 'none';
        _moved = false;
    }
    this.mouseDown = function(ev) {
        if (_current != null) {
            _mode = 'move';
            _ox = _left - ev.pageX;
            _oy = _top - ev.pageY;
            _moved = false;
        }
    }

    this.remove = function() {
        if (!_current) return;
        _current.layer.remove();
        _layers.splice(_currentNo, 1);
        _current = null;
        $('#primitive-tools div').css('display', 'none');
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        base.refreshMergedImage();
        base.setDirty(true);
    }

    this.mouseMove = function(ev) {
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        if (_mode == 'none') {
            if (_current !== null) {
                _top = ~~(_current.viewport.rect.top - _current.viewport.margin.top);
                _left = ~~(_current.viewport.rect.left - _current.viewport.margin.left);
                _right = ~~(_current.viewport.rect.right + _current.viewport.margin.right);
                _bottom = ~~(_current.viewport.rect.bottom + _current.viewport.margin.bottom);
                _width = _right - _left;
                _height = _bottom - _top;
                if (_left <= ev.pageX && ev.pageX <= _right && _top <= ev.pageY && ev.pageY <= _bottom) {
                    ;
                } else {
                    _current = null;
                }
            }
            if (_current === null) {
                var len = _layers.length;
                for (var i = len - 1; i >= 0; i--) {
                    _top = ~~(_layers[i].viewport.rect.top - _layers[i].viewport.margin.top);
                    _left = ~~(_layers[i].viewport.rect.left - _layers[i].viewport.margin.left);
                    _right = ~~(_layers[i].viewport.rect.right + _layers[i].viewport.margin.right);
                    _bottom = ~~(_layers[i].viewport.rect.bottom + _layers[i].viewport.margin.bottom);
                    _width = _right - _left;
                    _height = _bottom - _top;
                    if (_left <= ev.pageX && ev.pageX <= _right && _top <= ev.pageY && ev.pageY <= _bottom) {
                        _current = _layers[i];
                        _currentNo = i;
                        break;
                    }
                }
            }
            if (_current !== null) {
                _current.layer.css('display', 'block');
            }
            $('#ctrl-canvas').css('cursor', 'move');
        } else if (_mode == 'Delete') {
        } else {
            var startTop, startLeft, startRight, startBottom, startWidth, startHeight;
            var strechMode = 'bottom';
            startTop = ~~(_current.viewportOrg.rect.top - _current.viewportOrg.margin.top);
            startLeft = ~~(_current.viewportOrg.rect.left - _current.viewportOrg.margin.left);
            startRight = ~~(_current.viewportOrg.rect.right + _current.viewportOrg.margin.right);
            startBottom = ~~(_current.viewportOrg.rect.bottom + _current.viewportOrg.margin.bottom);
            startWidth = startRight - startLeft;
            startHeight = startBottom - startTop;

            if (_mode == 'TL') {
                if (_bottom - ev.pageY > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _top = ev.pageY;
                }
                if (_right - ev.pageX > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _left = ev.pageX;
                }
                strechMode = 'top';
            } else if (_mode == 'T') {
                if (_bottom - ev.pageY > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _top = ev.pageY;
                }
                strechMode = 'right';
            } else if (_mode == 'TR') {
                if (_bottom - ev.pageY > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _top = ev.pageY;
                }
                if (ev.pageX - _left > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _right = ev.pageX;
                }
                strechMode = 'right';
            } else if (_mode == 'L') {
                if (_right - ev.pageX > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _left = ev.pageX;
                }
            } else if (_mode == 'R') {
                if (ev.pageX - _left > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _right = ev.pageX;
                }
            } else if (_mode == 'BL') {
                if (ev.pageY - _top > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _bottom = ev.pageY;
                }
                if (_right - ev.pageX > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _left = ev.pageX;
                }
            } else if (_mode == 'B') {
                if (ev.pageY - _top > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _bottom = ev.pageY;
                }
                strechMode = 'right';
            } else if (_mode == 'BR') {
                if (ev.pageY - _top > _current.viewport.margin.top + _current.viewport.margin.bottom) {
                    _bottom = ev.pageY;
                }
                if (ev.pageX - _left > _current.viewport.margin.left + _current.viewport.margin.right) {
                    _right = ev.pageX;
                }
                strechMode = 'right';
            } else if (_mode == 'move') {
                _top = ev.pageY + _oy;
                _left = ev.pageX + _ox;
                _bottom = _top + _height;
                _right = _left + _width;
            }
            if (ev.shiftKey) {
                if (strechMode == 'bottom') {
                    _bottom = _top + (_right - _left) / startWidth * startHeight;
                } else if (strechMode == 'right') {
                    _right = _left + (_bottom - _top) / startHeight * startWidth;
                } else if (strechMode == 'top') {
                    _top = _bottom - (_right - _left) / startWidth * startHeight;
                }
            }
            _width = _right - _left;
            _height = _bottom - _top;

            _newLeft = _left + _current.viewport.margin.left;
            _newTop = _top + _current.viewport.margin.top;
            _newRight = _right - _current.viewport.margin.right;
            _newBottom = _bottom - _current.viewport.margin.bottom;
            var newViewport = _current.prim.draw(ctrlCtx, _current.params, 
                _newLeft - _current.viewportOrg.rect.left,
                _newTop - _current.viewportOrg.rect.top,
                (_newRight - _newLeft) / (_current.viewportOrg.rect.right - _current.viewportOrg.rect.left),
                (_newBottom - _newTop) / (_current.viewportOrg.rect.bottom - _current.viewportOrg.rect.top),
                true);

            _top = ~~(newViewport.rect.top - newViewport.margin.top);
            _left = ~~(newViewport.rect.left - newViewport.margin.left);
            _right = ~~(newViewport.rect.right + newViewport.margin.right);
            _bottom = ~~(newViewport.rect.bottom + newViewport.margin.bottom);
            _width = _right - _left;
            _height = _bottom - _top;

            $('#ctrl-canvas').css('cursor', $('#drag-' + _mode).css('cursor'));
            _current.layer.css('display', 'none');
        }

        if (_current !== null) {
            ctrlCtx.strokeStyle = '#000';
            ctrlCtx.lineWidth = 2;
            ctrlCtx.beginPath();
            ctrlCtx.moveTo(_left, _top);
            ctrlCtx.lineTo(_right, _top);
            ctrlCtx.lineTo(_right, _bottom);
            ctrlCtx.lineTo(_left, _bottom);
            ctrlCtx.closePath();
            ctrlCtx.stroke();
            $('#primitive-tools div').css('display', 'block');
            if (_current.prim.unresizable) {
                $('#primitive-tools div.drag-box').css('display', 'none');
            }

            $('#drag-TL').css('top', _top + 'px');
            $('#drag-TL').css('left', _left + 'px');
            $('#drag-T').css('top', _top + 'px');
            $('#drag-T').css('left', ~~((_left + _right) / 2 - $('#drag-T').outerWidth() / 2) + 'px');
            $('#drag-TR').css('top', _top + 'px');
            $('#drag-TR').css('left', _right - $('#drag-TR').outerWidth() + 'px');
            $('#drag-L').css('top', ~~((_top + _bottom) / 2 - $('#drag-L').outerHeight() / 2) + 'px');
            $('#drag-L').css('left', _left + 'px');
            $('#drag-R').css('top', ~~((_top + _bottom) / 2 - $('#drag-R').outerHeight() / 2) + 'px');
            $('#drag-R').css('left', _right - $('#drag-R').outerWidth() + 'px');
            $('#drag-BL').css('top', _bottom - $('#drag-BL').outerHeight() + 'px');
            $('#drag-BL').css('left', _left + 'px');
            $('#drag-B').css('top', _bottom - $('#drag-B').outerHeight() + 'px');
            $('#drag-B').css('left', ~~((_left + _right) / 2 - $('#drag-B').outerWidth() / 2) + 'px');
            $('#drag-BR').css('top', _bottom - $('#drag-BR').outerHeight() + 'px');
            $('#drag-BR').css('left', ~~(_right - $('#drag-BR').outerWidth()) + 'px');

            if (_bottom - _top > 32 && _right - _left > 32) {
                if (_current.prim.unresizable) {
                    $('#prim-delete').css('top', _top + 'px');
                    $('#prim-delete').css('left', _right - $('#prim-delete').outerWidth() + 'px');
                } else {
                    $('#prim-delete').css('top', _top + 8 + 'px');
                    $('#prim-delete').css('left', _right - $('#prim-delete').outerWidth() - 8 + 'px');
                }
                $('#prim-delete').css('display', 'block');
            } else {
                $('#prim-delete').css('display', 'none');
            }

        } else {
            $('#primitive-tools div').css('display', 'none');
            $('#ctrl-canvas').css('cursor', 'default');
        }
        _moved = true;
    }

    this.mouseUp = function(ev) {
        _mode = 'none';
        if (!_moved) return;
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        $('#primitive-tools div').css('display', 'none');
        if (_current !== null) {
            newViewport = _current.prim.draw(ctrlCtx, _current.params, 
                _newLeft - _current.viewportOrg.rect.left,
                _newTop - _current.viewportOrg.rect.top,
                (_newRight - _newLeft) / (_current.viewportOrg.rect.right - _current.viewportOrg.rect.left),
                (_newBottom - _newTop) / (_current.viewportOrg.rect.bottom - _current.viewportOrg.rect.top),
                false);
            _top = ~~(newViewport.rect.top - newViewport.margin.top);
            _left = ~~(newViewport.rect.left - newViewport.margin.left);
            _right = ~~(newViewport.rect.right + newViewport.margin.right);
            _bottom = ~~(newViewport.rect.bottom + newViewport.margin.bottom);
            _width = _right - _left;
            _height = _bottom - _top;
            _current.viewport = newViewport;
            var newLayer = base.createNewLayer(ctrlCtx, _left, _top, _width, _height, newViewport.shadow);
            _current.layer.after(newLayer);
            _current.layer.remove();
            _current.layer = newLayer;
            base.refreshMergedImage();
            base.setDirty(true);
        }
    }
    this.finish = function(nextMode) {
        base.finish(nextMode, false);
    }
};

// ぼかし
var primitiveEdit = function (base, ctrlCtx, cvWidth, cvHeight) {

    var _this = this;
    var _x0, _y0, _x1, _y1;
    var _started = false; // 始点が設定されたら真になる

    this.init = function() {
        _started = false;
        $('#ctrl-canvas').css('cursor', 'crosshair');

    }
    this.mouseDown = function(ev) {
        _x0 = _x1 = ev.pageX;
        _y0 = _y1 = ev.pageY;
        _started = true;
    }

    this.mouseMove = function(ev) {
        if (!_started) return;
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        _x1 = ev.pageX;
        _y1 = ev.pageY;
        this.draw(ctrlCtx, 
            {
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            },
            0, 0, 1, 1, true);

    }
    this.mouseUp = function(ev) {
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        _this.finish(null);
    }

    this.finish = function(nextMode) {
        base.finish(nextMode, _started && _x0 != _x1 && _y0 != _y1 ? 
            {
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            } 
            : false);
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var minX = (params.x0 < params.x1) ? params.x0 : params.x1;
        var minY = (params.y0 < params.y1) ? params.y0 : params.y1;
        var maxX = (params.x0 > params.x1) ? params.x0 : params.x1;
        var maxY = (params.y0 > params.y1) ? params.y0 : params.y1;
        var x0 = offsetX + minX;
        var x1 = (maxX - minX) * scaleX + offsetX + minX;
        var y0 = offsetY + minY;
        var y1 = (maxY - minY) * scaleY + offsetY + minY;
        var margin = 0;
        if (x1 - x0 != 0 && y1 - y0 != 0) {
            if (quick) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#999';
                ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            } else {
                ctx.fillStyle = '#fff';
                var q = 10;
                var img = base.imgCtx().getImageData(x0, y0, x1 - x0, y1 - y0);
                ctx.putImageData(img, x0, y0);

                for (var ii = 0; ii < q; ii++) {
                    var img = ctx.getImageData(x0, y0, x1 - x0, 1);
                    for (var i = 1; i <= q; i++) {
                        ctx.putImageData(img, x0, y0 - i);
                    }
                    img = ctx.getImageData(x0, y1 - 1, x1 - x0, 1);
                    for (i = 1; i <= q; i++) {
                        ctx.putImageData(img, x0, y1 + i);
                    }
                    img = ctx.getImageData(x0, y0 - q, 1, y1 - y0 + q + q + 1);
                    for (i = 1; i <= q; i++) {
                        ctx.putImageData(img, x0 - i, y0 - q);
                    }
                    img = ctx.getImageData(x1 - 1, y0 - q, 1, y1 - y0 + q + q + 1);
                    for (i = 1; i <= q; i++) {
                        ctx.putImageData(img, x1 + i, y0 - q);
                    }

                    img = ctx.getImageData(x0 - q, y0 - q, x1 - x0 + q + q + 1, y1 - y0 + q + q + 1);
                    var tmpCanvas = $('<canvas>');
                    tmpCanvas.attr('width', x1 - x0 + q + q + 1);
                    tmpCanvas.attr('height', y1 - y0 + q + q + 1);
                    tmpCanvas[0].getContext('2d').putImageData(img, 0, 0);

                    ctx.globalAlpha = 0.2;
                    for (i = 1; i >= -1; i--) {
                        for (var j = 1; j >= -1; j--) {
                            ctx.drawImage(tmpCanvas[0], x0 - q + j, y0 - q + i);
                            ctx.drawImage(tmpCanvas[0], x0 - q - j, y0 - q - i);
                        }
                    }
                }

            }
        }
        ctx.globalAlpha = 1;
        return {
            rect: {left: x0, top: y0, right: x1, bottom: y1},
            margin: {left: margin, top: margin, right: margin, bottom: margin},
            shadow: false
        };

    }

    this.isPrepend = true;
};


// 多角形
var primitivePoly = function (base, ctrlCtx, cvWidth, cvHeight) {
    var _this = this;
    var _x0, _y0, _x1, _y1;
    var _started = false; // 始点が設定されたら真になる

    this.init = function() {
        _started = false;
        $('#ctrl-canvas').css('cursor', 'crosshair');
    }
    this.mouseDown = function(ev) {
        _x0 = _x1 = ev.pageX;
        _y0 = _y1 = ev.pageY;
        _started = true;
    }

    this.mouseMove = function(ev) {
        if (!_started) return;
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        _x1 = ev.pageX;
        _y1 = ev.pageY;
        this.draw(ctrlCtx, 
            {
                color: base.currentColor(),
                width: base.currentPenWidth(),
                polyType: base.currentPolyType(),
                paintMode: base.currentPaintMode(),
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            },
            0, 0, 1, 1, false);

    }
    this.mouseUp = function(ev) {
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        _this.finish(null);
    }

    this.finish = function(nextMode) {
        base.finish(nextMode, _started && _x0 != _x1 && _y0 != _y1 ? 
            {
                color: base.currentColor(),
                width: base.currentPenWidth(),
                polyType: base.currentPolyType(),
                paintMode: base.currentPaintMode(),
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            } 
            : false);
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var minX = (params.x0 < params.x1) ? params.x0 : params.x1;
        var minY = (params.y0 < params.y1) ? params.y0 : params.y1;
        var maxX = (params.x0 > params.x1) ? params.x0 : params.x1;
        var maxY = (params.y0 > params.y1) ? params.y0 : params.y1;
        var x0 = offsetX + minX;
        var x1 = (maxX - minX) * scaleX + offsetX + minX;
        var y0 = offsetY + minY;
        var y1 = (maxY - minY) * scaleY + offsetY + minY;
        var margin = 0;
        if (x1 - x0 != 0 && y1 - y0 != 0) {
            ctx.lineWidth = params.width;
            ctx.strokeStyle = params.color;
            ctx.fillStyle = params.color;
            if (params.polyType == 'rect') {
                if (params.paintMode == 'edge') {
                    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
                    margin = params.width / 2;
                } else if (params.paintMode == 'all') {
                    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
                }
            } else if (params.polyType == 'radius-rect') {
                var radius = 5; // 丸めの幅
                ctx.beginPath();
                ctx.moveTo(x0 + radius, y0);
                ctx.lineTo(x1 - radius, y0);
                ctx.quadraticCurveTo(x1, y0, x1, y0 + radius);
                ctx.lineTo(x1, y1 - radius);
                ctx.quadraticCurveTo(x1, y1, x1 - radius, y1);
                ctx.lineTo(x0 + radius, y1);
                ctx.quadraticCurveTo(x0, y1, x0, y1 - radius);
                ctx.lineTo(x0, y0 + radius);
                ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
                if (params.paintMode == 'edge') {
                    ctx.stroke();
                    margin = params.width / 2;
                } else if (params.paintMode == 'all') {
                    ctx.fill();
                }
            } else if (params.polyType == 'ellipse') {
                var hw = (x1 - x0) / 2;
                var hh = (y1 - y0) / 2;
                var cx = x0 + hw;
                var cy = y0 + hh;
                ctx.beginPath();
                var cw = 4.0 * (Math.sqrt(2.0) - 1.0) * hw / 3.0;
                var ch = 4.0 * (Math.sqrt(2.0) - 1.0) * hh / 3.0;
                ctx.moveTo(cx, y0);
                ctx.bezierCurveTo(cx + cw, y0, x1, cy - ch, x1, cy);
                ctx.bezierCurveTo(x1, cy + ch, cx + cw, y1, cx, y1);
                ctx.bezierCurveTo(cx - cw, y1, x0, cy + ch, x0, cy);
                ctx.bezierCurveTo(x0, cy - ch, cx - cw, y0, cx, y0);
                if (params.paintMode == 'edge') {
                    ctx.stroke();
                    margin = params.width / 2;
                } else if (params.paintMode == 'all') {
                    ctx.fill();
                }
            }
        }
        return {
            rect: {left: x0, top: y0, right: x1, bottom: y1},
            margin: {left: margin, top: margin, right: margin, bottom: margin},
            shadow: true
        };

    }

};

// テキスト
var primitiveText = function (base, ctrlCtx, cvWidth, cvHeight) {
    var _this = this;
    var _mode;
    var _width = 200;
    var _height = 100;
    var _layers = base.layers();
    var _adjustX = 3;
    var _adjustY = 5;
    var _lyaerNo = -1;
    var _margin = 4;

    this.init = function() {
        _mode = 'start';
        _layerNo = -1;
    }
    this.mouseDown = function(ev) {
        var primitives = base.primitives();
        var tmpLayerNo = -1;
        for (var i = _layers.length - 1; i >= 0; i--) {
            if (_layers[i].prim == primitives['text']) {
                var x = ~~(_layers[i].viewport.rect.left - _layers[i].viewport.margin.left);
                var y = ~~(_layers[i].viewport.rect.top - _layers[i].viewport.margin.top);
                var x2 = ~~(_layers[i].viewport.rect.right + _layers[i].viewport.margin.right);
                var y2 = ~~(_layers[i].viewport.rect.bottom + _layers[i].viewport.margin.bottom);
                var w = x2 - x;
                var h = y2 - y;
                if (x <= ev.pageX && ev.pageX <= x + w && y <= ev.pageY && ev.pageY <= y + h) {
                    tmpLayerNo = i;
                    break;
                }
            }
        }

        if (_mode == 'start') {
            _lyaerNo = tmpLayerNo;
            var ed = $('#text-editor');
            if (_lyaerNo == -1) {
                ed.val('');
                ed.css('display', 'block');
                ed.css('top', ev.pageY + 'px');
                ed.css('left', ev.pageX + base.leftMargin() + 'px');
                ed.css('min-width', '100px');
                ed.css('width', 'auto');
                ed.css('height', 'auto');
                ed.css('font-size', base.currentTextSize() + 'px');
                ed.css('line-height', base.currentTextSize() * 1.2 + 'px');
                ed.css('color', base.currentColor());
            } else {
                ed.val(_layers[_lyaerNo].params.text);
                ed.css('display', 'block');
                ed.css('top', y  - 1 + 'px');
                ed.css('left', x + base.leftMargin() + 'px');
                ed.css('min-width', '100px');
                ed.css('width', w + 'px');
                ed.css('height', h + 'px');
                ed.css('font-size', base.currentTextSize() + 'px');
                ed.css('line-height', base.currentTextSize() * 1.2 + 'px');
                ed.css('color', base.currentColor());
                _layers[_lyaerNo].layer.css('display', 'none');
            }
            ed.select();
            ed.focus();
            _mode = 'edit';
        } else if (_mode == 'edit') {
            _this.finish(null);
            _this.init();
            if (tmpLayerNo != -1) _this.mouseDown(ev);
        }
    }
    this.mouseMove = function(ev) {
        var primitives = base.primitives();
        var cursor = 'default';
        for (var i = _layers.length - 1; i >= 0; i--) {
            if (_layers[i].prim == primitives['text']) {
                var x = ~~(_layers[i].viewport.rect.left - _layers[i].viewport.margin.left);
                var y = ~~(_layers[i].viewport.rect.top - _layers[i].viewport.margin.top);
                var x2 = ~~(_layers[i].viewport.rect.right + _layers[i].viewport.margin.right);
                var y2 = ~~(_layers[i].viewport.rect.bottom + _layers[i].viewport.margin.bottom);
                var w = x2 - x;
                var h = y2 - y;
                if (x <= ev.pageX && ev.pageX <= x + w && y <= ev.pageY && ev.pageY <= y + h) {
                    cursor = 'text';
                }
            }
        }
        $('#ctrl-canvas').css('cursor', cursor);
    }
    this.mouseUp = function(ev) {
    }
    this.finish = function(nextMode) {
        var ed = $('#text-editor');
        if (_mode == 'start') {
            base.finish(nextMode, false);
            ed.css('display', 'none');
            return;
        }
        if (_lyaerNo == -1) {
            if (ed.val() == '') {
                base.finish(nextMode, false);
                ed.css('display', 'none');
                return;
            }
            var params = {
                top: ed.offset().top - base.topMargin() + _adjustY,
                left: ed.offset().left - base.leftMargin() + _adjustX,
                width: ed.width(),
                height: ed.height(),
                text: ed.val(),
                color: ed.css('color'),
                fontSize: base.currentTextSize(), 
                lineHeight: base.currentTextSize() * 1.2,
                fontFamily: ed.css('font-family')
            };
            base.finish(nextMode, params);
        } else {
            var params = {
                top: ed.offset().top  - base.topMargin() +_margin,
                left: ed.offset().left - base.leftMargin() + _margin,
                width: ed.width() - _margin * 2,
                height: ed.height() - _margin * 2,
                text: ed.val(),
                color: ed.css('color'),
                fontSize: base.currentTextSize(), 
                lineHeight: base.currentTextSize() * 1.2,
                fontFamily: ed.css('font-family')
            };
            var newViewport = this.draw(ctrlCtx, params, 0, 0, 1, 1, false);
            var newLayer = base.createNewLayer(ctrlCtx, 
                newViewport.rect.left - newViewport.margin.left,
                newViewport.rect.top - newViewport.margin.top,
                (newViewport.rect.right + newViewport.margin.right) - (newViewport.rect.left - newViewport.margin.left),
                (newViewport.rect.bottom + newViewport.margin.bottom) - (newViewport.rect.top - newViewport.margin.top), true);
            _layers[_lyaerNo].viewport = newViewport;
            _layers[_lyaerNo].viewportOrg = newViewport;
            _layers[_lyaerNo].layer.after(newLayer);
            _layers[_lyaerNo].layer.remove();
            _layers[_lyaerNo].layer = newLayer;
            _layers[_lyaerNo].params = params;
            base.finish(nextMode, false);
        }
        ed.css('display', 'none');
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var x = params.left + offsetX;
        var y = params.top + offsetY;
        var width = params.width * scaleX;
        var height = params.height * scaleY;
        var primitives = base.primitives();

        ctx.font = params.fontSize + 'px ' + params.fontFamily;
        ctx.textBaseline = 'top';
        ctx.textAlign = "left";
        var newHeight = calcHeightAndDraw(ctx, x, y, width, params.lineHeight, params.text, params.color, broderWidth(params.fontSize), true);
        var newBottom = y + newHeight > y + height ? y + newHeight : y + height
        return {
            rect: {left: x, top: y, right: x + width, bottom: newBottom},
            margin: {left: _margin, top: _margin, right: _margin, bottom: _margin},
            shadow: true
        };
    }
    
    function broderWidth(fontSize) {
        if (fontSize <= 12) return 3;
        if (fontSize <= 20) return 5;
        return 7;
    }
    
    function calcHeightAndDraw(ctx, x, y, width, lineHeight, text, color, borderWidth, doDraw) {
        var yy = y;
        var border = ~~(borderWidth / 2);
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var textLen = 0;
            var str = lines[i];
            while (true) {
                textLen++;
                var tmpStr = str.substr(0, textLen);
                var textWidth = ctx.measureText(tmpStr).width;
                if (width < textWidth || tmpStr.length == str.length) {
                    if (width < textWidth && textLen == 1) { // 1文字入るスペースがない
                        break;
                    }
                    if (width < textWidth) tmpStr = str.substr(0, textLen - 1);
                    if (doDraw) {
                        ctx.fillStyle = '#ffffff'
                        for (var j = -border; j <= border; j++) {
                            for (var k = -border; k <= border; k++) {
                                ctx.fillText(tmpStr, x + k, y + j);
                            }
                        }
                        ctx.fillStyle = color;
                        ctx.fillText(tmpStr, x, y);
                    }
                    y += lineHeight;
                    if (width >= textWidth) break;
                    str = str.substr(textLen - 1);
                    textLen = 0;
                }
            }
        }
        return y - yy;
    }
};

// 直線
var primitiveLine = function (base, ctrlCtx, cvWidth, cvHeight, lineType) {
    var _this = this;
    var _x0, _y0, _x1, _y1;
    var _started = false; // 始点が設定されたら真になる
    var _moved = false; // 開始されてから一度でも移動が行われたら真
    
    _x1 = false;

    this.init = function() {
        _started = false;
        _moved = false;
        if (lineType == 'none') {
            $('#ctrl-canvas').css('cursor', 'url(css/images/cursor/line.cur) 15 15, auto');
        } else if (lineType == 'end-arrow') {
            $('#ctrl-canvas').css('cursor', 'url(css/images/cursor/arrow.cur) 15 15, auto');
        } else if (lineType == 'both-arrow') {
            $('#ctrl-canvas').css('cursor', 'url(css/images/cursor/both-arrow.cur) 15 15, auto');
        }
    };
    this.mouseDown = function(ev) {
        _x0 = ev.pageX;
        _y0 = ev.pageY;
        if (_x1 === false) {
            _x1 = ev.pageX;
            _y1 = ev.pageY;
        }
        _started = true;
    }
    this.mouseMove = function(ev) {
        if (!_started) return;
        _moved = true;
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        _x1 = ev.pageX;
        _y1 = ev.pageY;
        this.draw(ctrlCtx, 
            {
                color: base.currentColor(),
                width: base.currentPenWidth(),
                lineType: lineType,
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            },
            0, 0, 1, 1, false);

    }
    this.mouseUp = function(ev) {
        ctrlCtx.clearRect(0, 0, cvWidth, cvHeight);
        if (!_moved) {
            var tx = _x0;
            var ty = _y0;
            _x0 = _x1;
            _y0 = _y1;
            _x1 = tx;
            _y1 = ty;
        }
        _this.finish(null);
    }

    this.finish = function(nextMode) {
        base.finish(nextMode, _started && (_x0 != _x1 || _y0 != _y0) ? 
            {
                color: base.currentColor(),
                width: base.currentPenWidth(),
                lineType: lineType,
                x0: _x0,
                y0: _y0,
                x1: _x1,
                y1: _y1
            } 
            : false);
        if (nextMode !== null) _x1 = false;
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var width = params.width;
        var minX = (params.x0 < params.x1) ? params.x0 : params.x1;
        var minY = (params.y0 < params.y1) ? params.y0 : params.y1;
        var maxX = (params.x0 > params.x1) ? params.x0 : params.x1;
        var maxY = (params.y0 > params.y1) ? params.y0 : params.y1;
        var x0 = (params.x0 - minX) * scaleX + offsetX + minX;
        var x1 = (params.x1 - minX) * scaleX + offsetX + minX;
        var y0 = (params.y0 - minY) * scaleY + offsetY + minY;
        var y1 = (params.y1 - minY) * scaleY + offsetY + minY;

        if (x1 - x0 != 0 || y1 - y0 != 0) {
            var xx0 = x0, yy0 = y0, xx1 = x1, yy1 = y1;
            ctx.strokeStyle = ctx.fillStyle = params.color;
            var len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
            var lineType = params.lineType;
            var width2 = width;
            if (width2 < 2) width2 = 2;
            var arrowLen = width2 * 3;
            var arrowWidth = width2 * 3;
            var ax01, ay01, ax02, ay02;
            var ax11, ay11, ax12, ay12;
            var nx0, ny0, nx1, ny1;
            var bx01, by01, bx02, by02;
            var bx11, by11, bx12, by12;
            var ang = Math.atan((y1 - y0) / (x1 - x0)) + Math.PI / 2;
            var intrusion = 0.9;

            ctx.lineCap = "round";
            if (lineType == 'start-arrow') {
                xx0 = x0 + (x1 - x0) * arrowLen / len;
                yy0 = y0 + (y1 - y0) * arrowLen / len;
                nx0 = x0 + (x1 - x0) * arrowLen * intrusion / len;
                ny0 = y0 + (y1 - y0) * arrowLen * intrusion / len;
                ax01 = xx0 + Math.cos(ang) * (arrowWidth / 2);
                ay01 = yy0 + Math.sin(ang) * (arrowWidth / 2);
                ax02 = xx0 - Math.cos(ang) * (arrowWidth / 2);
                ay02 = yy0 - Math.sin(ang) * (arrowWidth / 2);
                bx01 = nx0 + Math.cos(ang) * (width / 2);
                by01 = ny0 + Math.sin(ang) * (width / 2);
                bx02 = nx0 - Math.cos(ang) * (width / 2);
                by02 = ny0 - Math.sin(ang) * (width / 2);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(ax01, ay01);
                ctx.lineTo(bx01, by01);
                ctx.lineTo(x1, y1);
                ctx.lineTo(bx02, by02);
                ctx.lineTo(ax02, ay02);
                ctx.closePath();
                ctx.fill();
            } else if (lineType == 'end-arrow') {
                xx1 = x1 - (x1 - x0) * arrowLen / len;
                yy1 = y1 - (y1 - y0) * arrowLen / len;
                nx1 = x1 - (x1 - x0) * arrowLen * intrusion / len;
                ny1 = y1 - (y1 - y0) * arrowLen * intrusion / len;
                ax11 = xx1 + Math.cos(ang) * (arrowWidth / 2);
                ay11 = yy1 + Math.sin(ang) * (arrowWidth / 2);
                ax12 = xx1 - Math.cos(ang) * (arrowWidth / 2);
                ay12 = yy1 - Math.sin(ang) * (arrowWidth / 2);
                bx11 = nx1 + Math.cos(ang) * (width / 2);
                by11 = ny1 + Math.sin(ang) * (width / 2);
                bx12 = nx1 - Math.cos(ang) * (width / 2);
                by12 = ny1 - Math.sin(ang) * (width / 2);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(ax11, ay11);
                ctx.lineTo(bx11, by11);
                ctx.lineTo(x0, y0);
                ctx.lineTo(bx12, by12);
                ctx.lineTo(ax12, ay12);
                ctx.closePath();
                ctx.fill();
            } else if (lineType == 'both-arrow') {
                xx0 = x0 + (x1 - x0) * arrowLen / len;
                yy0 = y0 + (y1 - y0) * arrowLen / len;
                nx0 = x0 + (x1 - x0) * arrowLen * intrusion / len;
                ny0 = y0 + (y1 - y0) * arrowLen * intrusion / len;
                ax01 = xx0 + Math.cos(ang) * (arrowWidth / 2);
                ay01 = yy0 + Math.sin(ang) * (arrowWidth / 2);
                ax02 = xx0 - Math.cos(ang) * (arrowWidth / 2);
                ay02 = yy0 - Math.sin(ang) * (arrowWidth / 2);
                bx01 = nx0 + Math.cos(ang) * (width / 2);
                by01 = ny0 + Math.sin(ang) * (width / 2);
                bx02 = nx0 - Math.cos(ang) * (width / 2);
                by02 = ny0 - Math.sin(ang) * (width / 2);
                xx1 = x1 - (x1 - x0) * arrowLen / len;
                yy1 = y1 - (y1 - y0) * arrowLen / len;
                nx1 = x1 - (x1 - x0) * arrowLen * intrusion / len;
                ny1 = y1 - (y1 - y0) * arrowLen * intrusion / len;
                ax11 = xx1 + Math.cos(ang) * (arrowWidth / 2);
                ay11 = yy1 + Math.sin(ang) * (arrowWidth / 2);
                ax12 = xx1 - Math.cos(ang) * (arrowWidth / 2);
                ay12 = yy1 - Math.sin(ang) * (arrowWidth / 2);
                bx11 = nx1 + Math.cos(ang) * (width / 2);
                by11 = ny1 + Math.sin(ang) * (width / 2);
                bx12 = nx1 - Math.cos(ang) * (width / 2);
                by12 = ny1 - Math.sin(ang) * (width / 2);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(ax01, ay01);
                ctx.lineTo(bx01, by01);
                ctx.lineTo(bx11, by11);
                ctx.lineTo(ax11, ay11);
                ctx.lineTo(x1, y1);
                ctx.lineTo(ax12, ay12);
                ctx.lineTo(bx12, by12);
                ctx.lineTo(bx02, by02);
                ctx.lineTo(ax02, ay02);
                ctx.closePath();
                ctx.fill();

            } else {
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(xx0, yy0);
                ctx.lineTo(xx1, yy1);
                ctx.stroke();
            }
        }

        var newMinX = (x0 < x1) ? x0 : x1;
        var newMinY = (y0 < y1) ? y0 : y1;
        var newMaxX = (x0 > x1) ? x0 : x1;
        var newMaxY = (y0 > y1) ? y0 : y1;

        return {
            rect: {left: newMinX, top: newMinY, right: newMaxX, bottom: newMaxY},
            margin: {left: arrowWidth / 2, top: arrowWidth / 2, right: arrowWidth / 2, bottom: arrowWidth / 2},
            shadow: true
        };

    }
};

// 自由線
var primitiveFree = function (base, ctrlCtx, cvWidth, cvHeight) {
    var _this = this;
    var _drawn = false; // 描画が開始されたら真になる
    var _points = [];

    this.init = function() {
        _drawn = false;
        _points = [];
        $('#ctrl-canvas').css('cursor', 'url(css/images/cursor/free.png), default');
    };
    this.mouseDown = function(ev) {
        ctrlCtx.strokeStyle = base.currentColor();
        ctrlCtx.lineWidth = base.currentPenWidth();
        ctrlCtx.beginPath();
        ctrlCtx.lineCap = "round";
        ctrlCtx.moveTo(ev.pageX, ev.pageY);
        ctrlCtx.lineTo(ev.pageX + 0.1, ev.pageY + 0.1);
        ctrlCtx.stroke();
        _drawn = true;
        _points = [[ev.pageX, ev.pageY]];
    };
    this.mouseMove = function(ev) {
        if (!_drawn) return;
        ctrlCtx.lineTo(ev.pageX, ev.pageY);
        ctrlCtx.stroke();
        _points.push([ev.pageX, ev.pageY]);
    };
    this.mouseUp = function(ev) {
        ctrlCtx.closePath();
        _this.finish(null);
    };
    this.finish = function(nextMode) {
        base.finish(nextMode, _drawn ? 
            {
                color: base.currentColor(),
                width: base.currentPenWidth(),
                path: _points
            } 
            : false);
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var len = params.path.length;
        var minX = params.path[0][0];
        var minY = params.path[0][1];
        var maxX = params.path[0][0];
        var maxY = params.path[0][1];
        for (var i = 1; i < len; i++) {
            if (minX > params.path[i][0]) minX = params.path[i][0];
            if (maxX < params.path[i][0]) maxX = params.path[i][0];
            if (minY > params.path[i][1]) minY = params.path[i][1];
            if (maxY < params.path[i][1]) maxY = params.path[i][1];
        }
        ctx.strokeStyle = params.color;
        ctx.lineWidth = params.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        var x = (params.path[0][0] - minX) * scaleX + offsetX + minX;
        var y = (params.path[0][1] - minY) * scaleY + offsetY + minY;
        var newMinX = x;
        var newMinY = y;
        var newMaxX = x;
        var newMaxY = y;
        ctx.moveTo(x, y);
        if (len == 1) {
            ctx.lineTo(x + 0.1, y + 0.1);
        } else {
            for (i = 1; i < len; i++) {
                x = (params.path[i][0] - minX) * scaleX + offsetX + minX;
                y = (params.path[i][1] - minY) * scaleY + offsetY + minY;
                if (newMinX > x) newMinX = x;
                if (newMaxX < x) newMaxX = x;
                if (newMinY > y) newMinY = y;
                if (newMaxY < y) newMaxY = y;
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        return {
            rect: {left: newMinX, top: newMinY, right: newMaxX, bottom: newMaxY},
            margin: {left: params.width / 2, top: params.width / 2, right: params.width / 2, bottom: params.width / 2},
            shadow: true
        };
    }
};

// ライブラリ
var primitiveLib = function (base, ctrlCtx, cvWidth, cvHeight) {
    this.init = function() {
        var img = new Image();
        img.src = base.currentStamp().attr('src');
        var ww = $(window).width() < cvWidth ? $(window).width() : cvWidth;
        var wh = $(window).height() < cvHeight ? $(window).height() : cvHeight;
        var iw = img.width / 2;
        var ih = img.height / 2;
        if (ww < iw) {
            ih = ih * ww / iw;
            iw = ww;
        }
        if (wh < ih) {
            iw = iw * wh / ih;
            ih = wh;
        }
        var sx = $(window).scrollLeft();
        var sy = $(window).scrollTop();
        sx += (ww - iw) / 2;
        sy += (wh - ih) / 2;
        img.onload = function() {
            base.finish('sel', {x:sx, y:sy, w: iw, h: ih, img: img});
        }
    }
    this.mouseDown = function(ev) {
    }
    this.mouseMove = function(ev) {
    }
    this.mouseUp = function(ev) {
    }
    this.finish = function(nextMode) {
        base.finish(nextMode, false);
    }

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var x = params.x + offsetX;
        var y = params.y + offsetY;
        var w = params.w * scaleX;
        var h = params.h * scaleY;

        if (w != 0 && h != 0) {
            params.img.width = w;
            params.img.height = h;
            ctx.drawImage(params.img, x, y, w, h);
        }

        return {
            rect: {left: x, top: y, right: x + w, bottom: y + h},
            margin: {left: 0, top: 0, right: 0, bottom: 0},
            shadow: true
        };
    }
};

// 連番
var primitiveNumber = function (base, ctrlCtx, cvWidth, cvHeight) {
    var _num = 1;
    var _img = new Image();
    _img.src = $('#num-bg').attr('src');
    var _ev;
    var _mode;

    this.init = function() {
        _mode = 'start';
    }
    this.mouseDown = function(ev) {
    }
    this.mouseMove = function(ev) {
    }
    this.mouseUp = function(ev) {
        _ev = ev;
        _mode = 'click';
        this.finish(null);
        _num++;
    }
    this.finish = function(nextMode) {
        base.finish(nextMode, _mode == 'click' ? 
            {
                x: _ev.pageX,
                y: _ev.pageY,
                num: _num + ''
            } : false);
    };

    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var w = _img.width;
        var h = _img.height;
        var x = params.x + offsetX - w / 2;
        var y = params.y + offsetY - h / 2;
        var margin = 2;
        ctx.drawImage(_img, x, y);
        ctx.font = "18px 'Courier New'";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(params.num, x + w / 2, y + h / 2);

        return {
            rect: {left: x, top: y, right: x + w, bottom: y + h},
            margin: {left: margin, top: margin, right: margin, bottom: margin},
            shadow: true
        };
    };

    this.unresizable = true;
};


// 追加機能のためのテンプレート
var primitiveTemplate = function (base, ctrlCtx, cvWidth, cvHeight) {
    this.init = function(layer) {
    }
    this.mouseDown = function(ev) {
    }
    this.mouseMove = function(ev) {
    }
    this.mouseUp = function(ev) {
    }
    this.finish = function(nextMode) {
        base.finish(nextMode, false);
    }
    
    /*
     描画を行う。draw()はさまざまな状況で呼び出されるので、副作用があってはならない。
     同じ引数が与えられたら、必ず同じ結果を返すような実装にする事
     （ここで言う「結果」とは戻り値の範囲情報の他に、入力として与えられたctxへの描画内容も含んでいる）
     */
    this.draw = function(ctx, params, offsetX, offsetY, scaleX, scaleY, quick) {
        var x = params.left + offsetX;
        var y = params.top + offsetY;
        var w = params.width * scaleX;
        var h = params.height * scaleY;
        return {
            rect: {left: x, top: y, right: x + w, bottom: y + h},
            margin: {left: 4, top: 4, right: 4, bottom: 4},
            shadow: true
        };
        
    }
    // 新規プリミティブを最背面に設置する場合は真。現在「ぼかし」のみ真に設定されている。
    this.isPrepend = false;
};


fulmo.editor = function(EII) {
    var _currentPrimitive;
    var _currentLayer;
    var _layers = [];
    var _mergedImage;
    var _dragImage;
    var _THIS = this;
    var _refreshTimer;
    var _dirty = parseHash('dirty', true) ? true : false;

    // 言語の設定
    $('.i18n').each(function() {
        $(this).text(EII.getString($(this).text()));
    });
    $('.i18n-title').each(function() {
        var title = $(this).attr('title');
        $(this).attr('title', EII.getString(title));
    });
    $('a').attr('href', 'javascript:void(0)');
    $('#tool-bar a').each(function() {
        if (this.getAttribute('draggable') === null) {
            this.setAttribute('draggable', 'false');
        }
    });

    // イメージの設定
    var imageParams = EII.getImageParams();
    var cv = document.getElementById('main-canvas');
    cv.width = imageParams[1];
    cv.height = imageParams[2];
    $(cv).css('display', 'block');
    var _imgCtx = cv.getContext('2d');
    var _img = new Image();
    _img.onload = function() {
        _imgCtx.drawImage(this, 0, 0);
        _mergedImage = _img.cloneNode();
        triggerCreateDragImage(this);
    };
    _img.src = imageParams[0];
    var ctrl = document.getElementById('ctrl-canvas');
    ctrl.width = imageParams[1];
    ctrl.height = imageParams[2];
    ctrlCtx = ctrl.getContext('2d');
    var wrapper = document.getElementById('canvas-wrapper');
    wrapper.width = imageParams[1];
    wrapper.height = imageParams[2];
    var _currentStamp = null;

    // レイヤー情報を返す
    this.layers = function() {
        return _layers;
    }

    // プリミティブオブジェクト情報を返す
    this.primitives = function() {
        return _primitives;
    }

    function parseHash(key, isInt) {
        var str = location.hash;
        if (str == '' || str == '#') return null;
        var params = str.substr(1).split('&');
        for (var i = 0; i < params.length; i++) {
            var tmp = params[i].split('=');
            if (tmp[0] == key) {
                if (tmp.length < 2) return null;
                if (isInt) return parseInt(tmp[1]);
                return tmp[1];
            }
        }
        return null;
    }

    function generateFilename() {
        function pad0(val, n) {
            var pad;
            switch (n) {
                case 2: pad = '00';   break;
                case 4: pad = '0000'; break;
            }
            return (pad + val).slice(-n);
        }
        var now = new Date();
        now = {year: now.getFullYear(), month: now.getMonth() + 1,
               date: now.getDate(), hours: now.getHours(),
               minutes: now.getMinutes(), seconds: now.getSeconds()};
        return [
            'image-',
            pad0(now.year, 4), pad0(now.month, 2), pad0(now.date, 2),
            '-',
            pad0(now.hours, 2), pad0(now.minutes, 2), pad0(now.seconds, 2),
            '.png'].join('');
    }

    function triggerCreateDragImage(source) {
        source = source || _mergedImage;
        var scale = 96.0 / Math.max(source.width, source.height);
        var width = source.width;
        var height = source.height;
        if (scale < 1.0) {
            width = width * scale;
            height = height * scale;
        }
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.drawImage(source, 0, 0, width, height);
        var image = new Image();
        image.onload = function() {
            this.onload = undefined;
            _dragImage = this;
        };
        image.src = canvas.toDataURL();
    }

    // プリミティブ配列
    // ハッシュ名は mode-selector クラスを持つ<li>要素のidに紐づく
    // (プレフィックスの 'btn-' は省く)
    var _primitives = {
        'sel': new primitiveSel(this, ctrlCtx, imageParams[1], imageParams[2]),
        'edit': new primitiveEdit(this, ctrlCtx, imageParams[1], imageParams[2]),
        'poly': new primitivePoly(this, ctrlCtx, imageParams[1], imageParams[2]),
        'edit': new primitiveEdit(this, ctrlCtx, imageParams[1], imageParams[2]),
        'text': new primitiveText(this, ctrlCtx, imageParams[1], imageParams[2]),
        'line': new primitiveLine(this, ctrlCtx, imageParams[1], imageParams[2], 'none'),
        'arrow': new primitiveLine(this, ctrlCtx, imageParams[1], imageParams[2], 'end-arrow'),
        'both-arrow': new primitiveLine(this, ctrlCtx, imageParams[1], imageParams[2], 'both-arrow'),
        'free': new primitiveFree(this, ctrlCtx, imageParams[1], imageParams[2]),
        'num': new primitiveNumber(this, ctrlCtx, imageParams[1], imageParams[2]),
        'lib': new primitiveLib(this, ctrlCtx, imageParams[1], imageParams[2])
    };

    // イベントのハンドリング
    (function() {
        var funcs = {mousedown: 'mouseDown', mousemove: 'mouseMove',
                     mouseup: 'mouseUp'};
        var toolbar = $('#tool-bar-wrapper').get(0);
        var body = document.body;
        $(window).bind('mousedown mousemove mouseup', function(ev) {
            var x = ev.pageX, y = ev.pageY;
            var type = ev.type;
            if (type === 'mousedown') {
                var target = ev.target;
                if (target === toolbar || $.contains(toolbar, target))
                    return;
                if (!$.contains(body, target))
                    return;
                if (target.nodeName.toLowerCase() === 'textarea')
                    return;
            }
            var offset = $('#main-canvas').offset();
            ev.pageY = y - offset.top;
            ev.pageX = x - offset.left;
            _currentPrimitive[funcs[type]](ev);
            return false;
        });
    })();
    $('body').keydown(function(ev) {
        var id  = ev.target.id;
        if (id == 'text-editor') return;
        if (ev.keyCode == 27) { // escape key
            if (_currentPrimitive.cancel) _currentPrimitive.cancel();
            return false;
        } else if (ev.keyCode == 46) { // delete key
            if (_currentPrimitive.remove) _currentPrimitive.remove();
            return false;
        }
    });
    var beforeunload = false;
    $(window).bind('beforeunload', function(ev) {
        if (_dirty && beforeunload === false) {
            beforeunload = true;
            setTimeout(function() { beforeunload = false }, 100);
            return ' ';
        }
    });

    // メニューの設定
    $('#tool-bar .menu').mouseover(
        function() {
            var offset = $(this).position();
            var w = $('.ui-pane', $(this).parent());
            w.css('display', 'block');
            w.css('top', (offset.top + $(this).attr('offsetHeight') + 8 - $('body').attr('scrollTop')) + 'px');
            w.css('left', (offset.left + 4 + 'px'));
        }
    );
    $('#tool-bar .menu').mouseout(
        function() {
            var w = $('.ui-pane', $(this).parent());
            w.css('display', 'none');
        }
    );
    $('.ui-pane').mouseover(
        function() {
            $(this).css('display', 'block');
        }
    );
    $('.ui-pane').mouseout(
        function() {
            $(this).css('display', 'none');
        }
    );
    // 単一選択可能グループ内のアイテムがクリックされた時の動作の指定
    $('.selector a').click(
        function() {
            $('a', $(this).closest('.selector')).removeClass('selected');
            $(this).addClass('selected');
            if ($(this).closest('.selector').hasClass('typify')) {
                $('a.menu', $(this).closest('.mode-selector')).css('background-image', $(this).css('background-image'));
            }
            return false;
        }
    );
    // 複数選択可能グループ内のアイテムがクリックされた時の動作の指定（現在未使用）
    $('.multi-selector a').click(
        function() {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
            } else {
                $(this).addClass('selected');
            }
            return false;
        }
    );
    // モード選択用のアイコンがクリックされた時に指定されたモードに移動する
    $('#tool-bar li.mode-selector a').click(
        function() {
            $('#tool-bar li.mode-selector a.menu').removeClass('selected');
            $('a.menu', $(this).closest('li.mode-selector')).addClass('selected');
            var mode = $(this).closest('li.mode-selector').attr('id').substr('btn-'.length);
            _currentPrimitive.finish(mode);
            return false;
        }
    );

    // BTS画面に移動
    $('#btn-send').click(function() {
        imageUrl(function(str) {
            var tmp = _dirty;
            _dirty = false;
            EII.returnToMain(str, tmp);
        });
        return false;
    });

    // 保存
    $('#btn-save').click(function() {
        var message = EII.getString('fulmo_save_image_as');
        EII.showImageDialog(message, generateFilename(), imageUrl);
    });

    // Drag-and-Drop
    $('#btn-drag').bind('dragstart', function(event) {
        if (_mergedImage) {
            var transfer = event.originalEvent.dataTransfer;
            if (_dragImage) {
                transfer.setDragImage(_dragImage, _dragImage.width / 2,
                                      _dragImage.height / 2);
            }
            var url = _mergedImage.src;
            transfer.setData('text/uri-list', url);
        }
    });
    $('#btn-save').bind('dragstart', function(event) {
        if (_mergedImage) {
            var transfer = event.originalEvent.dataTransfer;
            if (_dragImage) {
                transfer.setDragImage(_dragImage, _dragImage.width / 2,
                                      _dragImage.height / 2);
            }
            var values = ['image/png', generateFilename(), _mergedImage.src];
            transfer.setData('DownloadURL', values.join(':'));
        }
    });

    // 色アイコンの背景色を設定する
    $('#pen-color a').each(function(){
        var col = '#' + $(this).attr('id').substr('color-'.length);
        $(this).css('background-color', col);
    });

    // 色アイコンクリック時に描画色アイコンを変更
    $('#pen-color a').click(setColor);

    // スタンプメニュークリック時にメニューを閉じて、最後にクリックしたスタンプを記憶する
    $('#btn-lib .ui-pane a img').click(function() {
        $(this).closest('.ui-pane').css('display', 'none');
        _currentStamp = $(this);
    });

    // 描画領域の幅を画像の幅に合わせる
    $('#canvas-wrapper').css('width', imageParams[1] + 'px');

    // ツールの初期化(角丸四角で開始)
    _currentPrimitive = _primitives['poly'];
    _currentLayer = createLayer();
    _currentPrimitive.init();

    // レイヤーの作成
    function createLayer() {
        var newLayer = $('<canvas>');
        newLayer.attr('width', cv.width);
        newLayer.attr('height', cv.height);
        newLayer.css('display', 'block');
        newLayer.css('position', 'absolute');
        newLayer.css('top', '0');
        newLayer.css('left', '0');
        $('#layers').append(newLayer);
        return newLayer;
    }

    // レイヤーを統合し画像のURLを返す
    function imageUrl(fn) {
        var _idx = 0;
        var tmp = $('<canvas>');
        tmp.attr('width', imageParams[1]);
        tmp.attr('height', imageParams[2]);
        var img = new Image();
        img.src = imageParams[0];
        img.onload = function() {
            tmp[0].getContext('2d').drawImage(img, 0, 0);
            mergeData(0);
            function mergeData(i) {
                if (i < _layers.length) {
                    var x = _layers[i].layer.attr('offsetLeft');
                    var y = _layers[i].layer.attr('offsetTop');
                    var w = _layers[i].layer.attr('width');
                    var h = _layers[i].layer.attr('height');
                    var img2 = new Image();
                    img2.onload = function() {
                        tmp[0].getContext('2d').drawImage(img2, x, y);
                        mergeData(i + 1);
                    };
                    img2.src = _layers[i].layer[0].toDataURL();
                } else {
                    fn(tmp[0].toDataURL());
                }
            }
        };
    }

    // クライアント領域の上マージンを返す
    this.topMargin = function() {
        return $('#main-canvas').offset().top;
    };
    
    // クライアント領域の左マージンを返す
    this.leftMargin = function() {
        return $('#main-canvas').offset().left;
    };

    // 現在の色を返す
    this.currentColor = function() {
        return '#' + $('#pen-color a.selected').attr('id').substr('color-'.length);
    };

    // デフォルトの色アイコンを設定
    function setColor() {
        var url = $('#btn-color a.menu').css('background-image');
        if (url.match(/url\(["']?([^"']*)["']?\)/)) {
            var tmp = RegExp.$1.split('/');
            tmp[tmp.length - 1] = _THIS.currentColor().substr(1);
            $('#btn-color a.menu').css('background-image', 'url(' + tmp.join('/') + '.png)');
        }
    }
    // 色の初期設定
    setColor();

    // 現在のペンの太さを返す
    this.currentPenWidth = function() {
        return parseInt($('#pen-width a.selected').attr('id').substr('width-'.length));
    };

    // 現在の線種を返す
    this.currentLineType = function() {
        return $('#line-type a.selected').attr('id').substr('line-'.length);
    };

    // 選択されている多角形を返す
    this.currentPolyType = function() {
        return $('#poly-type a.selected').attr('id').substr('poly-'.length);
    };

    // 選択されている塗りつぶしモードを返す
    this.currentPaintMode = function() {
        return $('#paint-mode a.selected').attr('id').substr('paint-mode-'.length);
    };

    // 選択されているテキストサイズを返す
    this.currentTextSize = function() {
        return parseInt($('#text-size a.selected').attr('id').substr('text-size-'.length));
    };

    // 選択されたスタンプを返す
    this.currentStamp = function() {
        return _currentStamp;
    };

    // 現在の描画を完結させる
    // nextMode: 次の描画モードで、null の場合は現在のモードを継続する
    // params: draw()関数に渡されるパラメータ。nullの場合、描画が破棄された事を意味する。
    this.finish = function(nextMode, params) {
        ctrlCtx.clearRect(0, 0, cv.width, cv.height);
        if (params === false) {
            _currentLayer.remove();
        } else {
            var ctx = _currentLayer[0].getContext('2d');
            var viewport = _currentPrimitive.draw(ctx, params, 0, 0, 1, 1, false);
            var totalTop = ~~(viewport.rect.top - viewport.margin.top);
            var totalLeft = ~~(viewport.rect.left - viewport.margin.left);
            var totalWidth = ~~(viewport.rect.right - viewport.rect.left + viewport.margin.left + viewport.margin.right);
            var totalHeight = ~~(viewport.rect.bottom - viewport.rect.top + viewport.margin.top + viewport.margin.bottom);
            var newLayer = this.createNewLayer(ctx, totalLeft, totalTop, totalWidth, totalHeight, viewport.shadow);
            _currentLayer.remove();

            if (_currentPrimitive.isPrepend) {
                $('#layers').prepend(newLayer);
                _layers.unshift({
                    layer: newLayer,
                    prim: _currentPrimitive,
                    params: params,
                    viewport: viewport,
                    viewportOrg: viewport
                });
            } else {
                $('#layers').append(newLayer);
                _layers.push({
                    layer: newLayer,
                    prim: _currentPrimitive,
                    params: params,
                    viewport: viewport,
                    viewportOrg: viewport
                });
            }
            _THIS.setDirty(true);
        }
        if (nextMode !== null) {
            _currentPrimitive = _primitives[nextMode];
            $('#tool-bar li.mode-selector a.menu').removeClass('selected');
            $('#btn-' + nextMode + ' a.menu').addClass('selected');
        }
        _currentLayer = createLayer();
        $('#ctrl-canvas').css('cursor', 'default');
        _currentPrimitive.init();
        this.refreshMergedImage();
    };

    this.refreshMergedImage = function() {
        if (_refreshTimer !== undefined && _mergedImage !== undefined) {
            clearTimeout(_refreshTimer);
        }
        _refreshTimer = setTimeout(function() {
            _mergedImage = undefined;
            _dragImage = undefined;
            $('#btn-drag, #btn-save').attr({draggable: 'false', color: '#ccc'});
            imageUrl(function(url) {
                var image = new Image();
                image.onload = function() {
                    this.onload = undefined;
                    _mergedImage = this;
                    _refreshTimer = undefined;
                    triggerCreateDragImage();
                    $('#btn-drag, #btn-save').attr({draggable: 'true', color: ''});
                }
                image.src = url;
            });
        }, 500);
    };

    // 仮レイヤーの内容から、本レイヤーに取りこむためのレイヤーに変換
    // ctx: 仮レイヤーのコンテキスト
    // left, top: 仮レイヤーの左上座標
    // width, height: 仮レイヤーの幅と高さ
    // shadow: 影付きで取りこむ場合に真
    this.createNewLayer = function(ctx, left, top, width, height, shadow) {
        if (width == 0) width = 1;
        if (height == 0) height = 1;
        var img = ctx.getImageData(left, top, width, height);
        var tmpLayer = $('<canvas>');
        tmpLayer.attr('width', width);
        tmpLayer.attr('height', height);
        tmpLayer.css('display', 'block');
        tmpLayer.css('position', 'absolute');
        tmpLayer.css('left', left + 'px');
        tmpLayer.css('top', top + 'px');
        tmpLayer[0].getContext('2d').putImageData(img, 0, 0);

        var shadowLayer = $('<canvas>');
        shadowLayer.attr('width', width + 20);
        shadowLayer.attr('height', height + 20);
        shadowLayer.css('display', 'block');
        shadowLayer.css('position', 'absolute');
        shadowLayer.css('left', left + 'px');
        shadowLayer.css('top', top + 'px');
        var newCtx = shadowLayer[0].getContext('2d');

        if (shadow) {
            EII.setShadow(newCtx);
        }
        newCtx.drawImage(tmpLayer[0], 0, 0);
        return shadowLayer;
    };

    // メイン画像のコンテキストを返す
    this.imgCtx = function() {
        return _imgCtx;
    };

    // dirty flag の設定
    this.setDirty = function(flg) {
        _dirty = flg;
    }
};

})(fulmo);
