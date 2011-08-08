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

var screenshotSenderMain = function(MII) {

    var settings = fulmoSettingsManager.load();
    var account = null;
    var urlRegex = new RegExp(/^(https?):\/\/([^:\/]*)((:([0-9]+))?)(\/.*)/);
    var client = null;
    var idPrefix = 'screenshot-sender-property-';
    var imageParams = MII.getImageParams();
    var inFieldLabelsOptions = {
        fadeOpacity: 0.0,
        fadeDuration: 0
    };
    var animationSetuped = false;

    $('.i18n').each(function() {
        $(this).text(MII.getString($(this).text()));
    });
    $('.i18n-title').each(function() {
        var title = $(this).attr('title');
        $(this).attr('title', MII.getString(title));
    });
    var reporterOrgHtml = $('#screenshot-sender-property-reporter-wrapper').html();

    $('#screenshot-sender-application-image').attr('src', MII.imagePath() + 'icon32.png');
    $('#screenshot-sender-property-loading img').attr('src', MII.imagePath() + 'ajax-loader.gif');
    $('#screenshot-sender-main-image-filed p span').css('background-image', 'url(' + MII.imagePath() + 'camera_16.gif)');
    $('#screenshot-sender-property-loading').css('display', 'none');
    imageResize();
    $('#screenshot-sender-main-submit').click(sendTicket);
    setSiteList();

    function setImageAreaAnimation() {
        if (animationSetuped) return;
        animationSetuped = true;
        setTimeout(function() {
            $('#screenshot-sender-main-image-filed').animate({
                height: '16px'
            }, 500, 'easeInCubic', function(){
                $('#screenshot-sender-main-image-filed').click(function() {
                    var currentHeight = $(this).css('height');
                    if (currentHeight == '16px') {
                        $('#screenshot-sender-main-image-filed').animate({height: '136px'}, 500, 'easeOutCubic');
                    } else if (currentHeight == '136px') {
                        $('#screenshot-sender-main-image-filed').animate({height: '16px'}, 500, 'easeInCubic');
                    }
                });
            });
        }, 2000);
    }

    $('.screenshot-sender-main-item-label').inFieldLabels(inFieldLabelsOptions);

    function imageResize() {
        if (!imageParams) {
            $('#screenshot-sender-main-image-filed').css('display', 'none');
            return;
        }
        $('#screenshot-sender-main-image').attr('src', imageParams[0]);
        var wMax = 200;
        var hMax = 100;
        var w = imageParams[1];
        var h = imageParams[2];
        var wRate = 1;
        var hRate = 1;
        if (wMax < w) wRate = wMax / w;
        if (hMax < h) hRate = hMax / h;
        var rate = wRate < hRate ? wRate : hRate;
        w *= rate;
        h *= rate;
        $('#screenshot-sender-main-image').attr('width', w);
        $('#screenshot-sender-main-image').attr('height', h);
    }

    function setSiteList() {
        var list = $('#screenshot-sender-main-site');
        for (var i = 0; i < settings.accounts.length; i++) {
            var opt = $('<option>');
            opt.text(settings.accounts[i].name);
            opt.val(settings.accounts[i].id);
            list.append(opt);
            if (!i || settings.defaultAccountId == settings.accounts[i].id) {
                list.val(settings.accounts[i].id);
            }
        }
        $('#screenshot-sender-main-site').multiselect({
            multiple: false,
            selectedList: 1,
            minWidth: 180,
            header: false,
            click: function(e, ui) {
                setSite(ui.value);
            }
        });
        setSite(settings.defaultAccountId ? settings.defaultAccountId : settings.accounts[0].id);
    }

    function setSite(id) {
        function resetList() {
            var list = document.getElementById('screenshot-sender-main-site');
            list.selectedIndex = 0;
            $('#screenshot-sender-main-site').multiselect('refresh');
            $('#screenshot-sender-main-submit').attr('disabled', true);
            $('#screenshot-sender-property-reporter-wrapper').html(reporterOrgHtml);
            $('#screenshot-sender-property-reporter-lv').inFieldLabels(inFieldLabelsOptions);
            $('#screenshot-sender-property-reporter-wrapper').css('display','block');
        }

        if (!parseInt(id)) {
            $('#screenshot-sender-main-submit').attr('disabled', true);
            return;
        }
        var idx = 0;
        for (var i = 0; i < settings.accounts.length; i++) {
            if (settings.accounts[i].id == id) {
                idx = i;
                break;
            }
        }
        account = JSON.parse(JSON.stringify(settings.accounts[idx]));

        MII.login(account, 
            function() {
                if (account.url.match(urlRegex)) {
                    var protocol = RegExp.$1;
                    var host = RegExp.$2;
                    var port = 0 + RegExp.$5;
                    if (!port) port = protocol == 'http' ? 80 : 443;
                    var path = RegExp.$6;
                }
                if (path.charAt(path.length - 1) != '/') {
                    path += '/';
                }
                if (!account.authType) { // no password
                    path += 'rpc';
                } else {
                    path += 'login/rpc';
                }
                xmlHttpRequestCredential.cleanup();
                client = new xmlrpc_client(path, host, port, protocol);
                if (parseInt(account.authType)) client.setCredentials(account.userId, account.password, 0);
                $('#screenshot-sender-property-loading').css('display', 'block');
                $('#screenshot-sender-main-submit').attr('disabled', true);
                $('#property-block').html('');
                XMLHttpRequest = FulmoXMLHttpRequest;
                client.send(new xmlrpcmsg('ticket.getTicketFields'), 30, function(res){
                    $('#screenshot-sender-main-submit').attr('disabled', false);
                    $('#screenshot-sender-property-loading').css('display', 'none');
                    if (res.faultCode()) {
                        alert(MII.getString('fulmo_login_message_failed_1') + "\n\n" + res.faultString() + "\n\n" + MII.getString('fulmo_login_message_failed_2'));
                        resetList();
                        setImageAreaAnimation();
                        return;
                    }
                    $('#screenshot-sender-property-reporter-wrapper').html(reporterOrgHtml);
                    if (account.userId.trim().length) {
                        $('#screenshot-sender-property-reporter').val(account.userId);
                        $('#screenshot-sender-property-reporter-wrapper').css('display','none');
                    } else {
                        $('#screenshot-sender-property-reporter-wrapper').css('display','block');
                        $('#screenshot-sender-property-reporter-lv').inFieldLabels(inFieldLabelsOptions);
                    }
                    createProperty(res.val.me);
                    setImageAreaAnimation();
                });
                XMLHttpRequest = FulmoXMLHttpRequestBackup;
            },
            function() {
                $('#property-block').html('');
                resetList();
                setImageAreaAnimation();
            }
        );
    }

    function createProperty(val) {
        function v(val, name) {
            return val.me[name] ? val.me[name].me : null;
        }
        function createElement(target, val) {

            var createInput = {
                'text': function(val) {
                    var inp = $('<input>');
                    if (val.value) inp.val(val.value.me);
                    inp.attr('id', idPrefix + name);
                    inp.addClass('screenshot-sender-property');
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label.me + ': ');
                    label.append(inp);
                    var span = $('<span>');
                    span.append(label);
                    span.append(inp);
                    return span;
                },
                'select': function(val) {
                    var sel = $('<select>');
                    if (val.options) {
                        for (var i = 0; i < val.options.me.length; i++) {
                            var opt = $('<option>');
                            opt.text(val.options.me[i].me);
                            opt.val(val.options.me[i].me);
                            sel.append(opt);
                        }
                    }
                    if (val.value) {
                        sel.val(val.value.me);
                    }
                    sel.attr('id', idPrefix + name);
                    sel.addClass('screenshot-sender-property');
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label.me + ': ');
                    var span = $('<span>');
                    span.append(label);
                    span.append(sel);
                    return span;
                },
                'checkbox': function(val) {
                    var inp = $('<input>');
                    if (val.value) inp.val(val.value.me);
                    inp.attr('id', idPrefix + name);
                    inp.attr('type', 'checkbox');
                    inp.addClass('screenshot-sender-property');
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label.me + ': ');
                    label.append(inp);
                    var span = $('<span>');
                    span.append(label);
                    span.append(inp);
                    return span;
                },
                'radio': function(val) {
                    if (!val.options) return false;
                    var span = $('<span>');
                    var glabel = $('<span>');
                    glabel.text(val.label.me + ': ');
                    glabel.addClass('screenshot-sender-properties-label');
                    span.append(glabel);
                    var def = val.value ? val.value.me : null;
                    var wrap = $('<span>');
                    wrap.addClass('screenshot-sender-property');
                    wrap.attr('id', idPrefix + name);
                    for (var i = 0; i < val.options.me.length; i++) {
                        var label = $('<label>');
                        label.addClass('screenshot-sender-radio-label');
                        label.text(val.options.me[i].me);
                        var inp = $('<input>');
                        inp.attr('name', idPrefix + name);
                        inp.attr('id', idPrefix + name + '-' + i);
                        inp.attr('type', 'radio');
                        inp.val(val.options.me[i].me);
                        if (val.options.me[i].me == def) inp.attr('checked', 'checked');
                        label.prepend(inp);
                        wrap.append(label);
                    }
                    span.append(wrap);
                    return span;
                },
                'textarea': function(val) {
                    var inp = $('<textarea>');
                    if (val.value) inp.text(val.value.me);
                    inp.attr('id', idPrefix + name);
                    inp.addClass('screenshot-sender-property');
                    if (val.width) inp.attr('cols', val.width.me);
                    if (val.height) inp.attr('rows', val.height.me);
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label.me + ': ');
                    label.append(inp);
                    var span = $('<span>');
                    span.append(label);
                    span.append(inp);
                    return span;
                }
            };

            var name = val.name.me;
            var type = val.type.me;
            if (!createInput[type]) type = 'text';
            var li = $('<li>');
            var inp = createInput[type](val);
            if (inp) {
                li.append(inp);
                target.append(li);
            }
        }

        var ignore = [  'status', 'resolution', 'time', 'changetime', 'sumarry', 'reporter', 'description' ]
        var topStandardParams = {
            'type': null,
            'priority': null,
            'milestone': null,
            'component': null,
            'version': null,
            'severity': null,
            'keywords': null,
            'cc': null
        };
        var bottomStandardParams = {
            'owner': null
        }
        var customParams = [];
        for (var i = 0; i < val.length; i++) {
            var name = v(val[i], 'name');
            if (ignore.indexOf(name) != -1) continue;
            if (topStandardParams[name] === null) {
                topStandardParams[name] = val[i].me;
            } else if (bottomStandardParams[name] === null) {
                bottomStandardParams[name] = val[i].me;
            } else {
                var order = '' + v(val[i], 'order');
                if (!order) order = 0;
                if (!customParams[order]) customParams[order] = [];
                customParams[order].push(val[i].me);
            }
        }
        var target = $('#property-block');
        target.html('');
        for (var i in topStandardParams) {
            if (topStandardParams[i] !== null) {
                createElement(target, topStandardParams[i]);
            }
        }
        for (var i = 0; i < customParams.length; i++) {
            if (customParams[i]) {
                for (var j = 0; j < customParams[i].length; j++) {
                    createElement(target, customParams[i][j]);
                }
            }
        }
        for (var i in bottomStandardParams) {
            if (bottomStandardParams[i] !== null) {
                createElement(target, bottomStandardParams[i]);
            }
        }
    }

    function validateTicket() {
        var sumarry = $('#screenshot-sender-property-sumarry').val().trim();
        if (!sumarry.length) {
            alert(MII.getString('fulmo_main_message_sumarry_ind'));
            return false;
        }
        var reporter = $('#screenshot-sender-property-reporter').val().trim();
        if (!reporter.length) {
            alert(MII.getString('fulmo_main_message_reporter_ind'));
            return false;
        }
        return true;
    }

    function sendTicket() {
        function imageFileName() {
            function v00(n) {
                return ("00" + n.toString()).slice(-2);
            }
            var d = new Date();
            var fn = d.getFullYear() + '-' + v00((d.getMonth() + 1)) + '-' + v00(d.getDate())
                + '_' + v00(d.getHours()) + v00(d.getMinutes()) + v00(d.getSeconds()) + '.png';
            return fn;
        }
        if (!validateTicket()) return;
        $('#screenshot-sender-main-submit').attr('disabled', true);

        var msg = new xmlrpcmsg('ticket.create');
        msg.addParam(new xmlrpcval($('#screenshot-sender-property-sumarry').val().trim()));
        var desc = $('#screenshot-sender-property-description').val().trim();
        var fn;
        if (imageParams) {
            fn = imageFileName();
            desc += '\n\n[[Image(' + fn;
            desc += imageParams[1] > 320 ? ',320px)]]' : ')]]';
        }
        msg.addParam(new xmlrpcval(desc));
        var _attr = {
            'reporter': new xmlrpcval($('#screenshot-sender-property-reporter').val().trim())
        }

        $('.screenshot-sender-property').each(function() {
            var id = this.id.substr(idPrefix.length);
            if (this.tagName == 'INPUT') {
                if (this.type == 'checkbox') {
                    if (this.checked) {
                        _attr[id] = new xmlrpcval(this.value);
                    }
                } else {
                    _attr[id] = new xmlrpcval(this.value);
                }
            } else if (this.tagName == 'TEXTAREA') {
                _attr[id] = new xmlrpcval(this.textContent);
            } else if (this.tagName == 'SELECT') {
                _attr[id] = new xmlrpcval(this.value);
            } else if (this.tagName == 'SPAN') { // radio
                $(':checked', this).each(function() {
                    _attr[id] = new xmlrpcval(this.value);
                });
            }
        });

        var attr = new xmlrpcval();
        attr.addStruct(_attr);
        msg.addParam(attr);
        msg.addParam(new xmlrpcval(true, 'boolean'));   // notify parameter
        XMLHttpRequest = FulmoXMLHttpRequest;
        client.send(msg, 30, function(res) {
            function complete() {
                if ($('#screenshot-sender-open-ticket').attr('checked')) {
                    var url = account.url;
                    if (url.charAt(url.length - 1) != '/') url += '/';
                    url += 'ticket/' + no;
                    MII.openURL(url);
                }
                window.close();
            }

            if (res.faultCode()) {
                alert(MII.getString('fulmo_main_message_create_ticket_failed') + "\n\n" + res.faultString());
                $('#screenshot-sender-main-submit').attr('disabled', false);
                return;
            }
            var no = res.val.me;
            if (imageParams) {
                var desc = '';
                var data = base64_decode(imageParams[0].substr('data:image/png;base64,'.length));
                var msg = new xmlrpcmsg('ticket.putAttachment');
                msg.addParam(new xmlrpcval(no, 'int'));
                msg.addParam(new xmlrpcval(fn));
                msg.addParam(new xmlrpcval(desc));
                msg.addParam(new xmlrpcval(data, 'base64'));
                XMLHttpRequest = FulmoXMLHttpRequest;
                client.send(msg, 30, function(res) {
                    if (res.faultCode()) {
                        alert(MII.getString('fulmo_main_message_create_ticket_but_could_not_put_img') + "\n\n" + res.faultString());
                        $('#screenshot-sender-main-submit').attr('disabled', false);
                        return;
                    }
                    $('#screenshot-sender-main-submit').attr('disabled', false);
                    complete();
                });
                XMLHttpRequest = FulmoXMLHttpRequestBackup;
            } else {
                complete();
            }
        });
        XMLHttpRequest = FulmoXMLHttpRequestBackup;
        return false;
        
    }

}
