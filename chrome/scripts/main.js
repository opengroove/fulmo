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
    fulmo.main = function(MII) {
        var settings = fulmo.settingsManager.load();
        var account = null;
        var urlRegex = new RegExp(/^(https?):\/\/([^:\/]*)((:([0-9]+))?)(\/.*)/);
        var loginProperties = null;
        var currentDriver = null;
        var idPrefix = 'screenshot-sender-property-value-';
        var imageParams = MII.getImageParams();
        var inFieldLabelsOptions = {
            fadeOpacity: 0.0,
            fadeDuration: 0
        };
        var animationSetuped = false;
        var _dirty = parseHash('dirty', true) ? true : false;

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
        $('#screenshot-sender-image-field p span').css('background-image', 'url(' + MII.imagePath() + 'camera_16.gif)');
        $('#screenshot-sender-property-loading').css('display', 'none');
        imageResize();
        $('#screenshot-sender-submit').click(sendTicket);
        $('#screenshot-sender-image-field-save').click(function(){
            var message = MII.getString('fulmo_save_image_as');
            MII.showImageDialog(message, generateFilename(), function(fn){fn(imageParams[0])});
            return false;
        });
        $('#screenshot-sender-image-field-edit').click(function(){
            var tmp = _dirty;
            _dirty = false;
            MII.openEditorTab(imageParams, tmp);
        });
        var beforeunload = false;
        $(window).bind('beforeunload', function(ev) {
            if (_dirty && beforeunload === false) {
                beforeunload = true;
                setTimeout(function() { beforeunload = false }, 100);
                return ' ';
            }
        });

        setSiteList();

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

        function setImageAreaAnimation() {
            if (animationSetuped) return;
            animationSetuped = true;
            setTimeout(function() {
                $('#screenshot-sender-image-field').animate({
                    height: '16px'
                }, 500, 'easeInCubic', function(){
                    $('#screenshot-sender-image-field').click(function() {
                        var currentHeight = $(this).css('height');
                        if (currentHeight == '16px') {
                            $('#screenshot-sender-image-field').animate({height: '136px'}, 500, 'easeOutCubic');
                        } else if (currentHeight == '136px') {
                            $('#screenshot-sender-image-field').animate({height: '16px'}, 500, 'easeInCubic');
                        }
                    });
                });
            }, 2000);
        }

        $('.screenshot-sender-item-label').inFieldLabels(inFieldLabelsOptions);

        function imageResize() {
            if (!imageParams) {
                $('#screenshot-sender-image-field').css('display', 'none');
                return;
            }
            $('#screenshot-sender-image').attr('src', imageParams[0]);
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
            $('#screenshot-sender-image').attr('width', w);
            $('#screenshot-sender-image').attr('height', h);
        }

        function setupSiteListIcon() {
            setTimeout(function() {
                $('#screenshot-sender-site+button span+span img').remove();
                var vals = $('#screenshot-sender-site').multiselect('getChecked').map(function(){ return this.value;}).get();
                var idx = -1;
                for (var i = 0; i < settings.accounts.length; i++) {
                    if (settings.accounts[i].id == vals[0]) {
                        idx = i;
                        break;
                    }
                }
                if (idx != -1) {
                    var img = $('<img>');
                    img.attr('src', MII.imagePath() + 'bts/' + fulmo.bts_drivers[settings.accounts[idx].siteType].icon);
                    img.attr('width', 16);
                    img.attr('height', 16);
                    img.css('vertical-align', '-2px');
                    img.css('padding-right', '2px');
                    $('#screenshot-sender-site+button span+span').prepend(img);
                }

                for (i = 0; i < settings.accounts.length; i++) {
                    var label_id = '#ui-multiselect-screenshot-sender-site-option-' + (i + 1);
                    $(label_id + '+span img').remove();
                    var img = $('<img>');
                    img.attr('src', MII.imagePath() + 'bts/' + fulmo.bts_drivers[settings.accounts[i].siteType].icon);
                    img.attr('width', 16);
                    img.attr('height', 16);
                    img.css('vertical-align', '-2px');
                    img.css('padding-right', '2px');
                    $(label_id + '+span').prepend(img);
                }

            }, 20); // multi-select のタイムアウトが10ミリ秒後に起動するため20ミリ秒後に動作するようにした
        }


        function setSiteList() {

            var list = $('#screenshot-sender-site');
            for (var i = 0; i < settings.accounts.length; i++) {
                var opt = $('<option>');
                opt.text(settings.accounts[i].name);
                opt.val(settings.accounts[i].id);
                list.append(opt);
                if (!i || settings.defaultAccountId == settings.accounts[i].id) {
                    list.val(settings.accounts[i].id);
                }
            }
            $('#screenshot-sender-site').multiselect({
                multiple: false,
                selectedList: 1,
                minWidth: 380,
                header: false,
                click: function(e, ui) {
                    setSite(ui.value, false);
                },
                close: function(e, ui) {
                    setupSiteListIcon();
                }
            });
            setupSiteListIcon();
            setSite(settings.defaultAccountId ? settings.defaultAccountId : settings.accounts[0].id, false);
        }

        function setSite(id, resetup) {
            function resetList() {
                var list = document.getElementById('screenshot-sender-site');
                list.selectedIndex = 0;
                $('#screenshot-sender-site').multiselect('refresh');
                $('#screenshot-sender-submit').attr('disabled', true);
                $('#screenshot-sender-property-reporter-wrapper').html(reporterOrgHtml);
                $('#screenshot-sender-property-reporter-lv').inFieldLabels(inFieldLabelsOptions);
                $('#screenshot-sender-property-reporter-wrapper').css('display','block');
                setupSiteListIcon();
            }

            if (!parseInt(id)) {
                $('#screenshot-sender-submit').attr('disabled', true);
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
            if (account.url.match(urlRegex)) {
                account.protocol = RegExp.$1;
                account.host = RegExp.$2;
                account.port = 0 + RegExp.$5;
                if (!account.port) account.port = account.protocol == 'http' ? 80 : 443;
                account.path = RegExp.$6;
            }

            MII.login(account, 
                function() {
                    $('#screenshot-sender-property-loading').css('display', 'block');
                    $('#screenshot-sender-submit').attr('disabled', true);
                    $('#screenshot-sender-property-list').css('display', 'none');
                    currentDriver = fulmo.bts_drivers[account.siteType];
                    currentDriver.loginAndGetFields(idPrefix, {
                        account: account,
                        error: function(message) {
                            $('#screenshot-sender-submit').attr('disabled', false);
                            $('#screenshot-sender-property-loading').css('display', 'none');
                            $('#screenshot-sender-property-list').css('display', 'block');
                            alert(MII.getString('fulmo_login_message_failed_1') + "\n\n" + message + "\n\n" + MII.getString('fulmo_login_message_failed_2'));
                            resetList();
                            setImageAreaAnimation();
                        },
                        success: function(props) {
                            loginProperties = props;
                            $('#screenshot-sender-submit').attr('disabled', false);
                            $('#screenshot-sender-property-loading').css('display', 'none');
                            $('#screenshot-sender-property-list').css('display', 'block');
                            $('#screenshot-sender-property-reporter-wrapper').html(reporterOrgHtml);
                            if (account.userId.trim().length) {
                                $('#screenshot-sender-property-reporter').val(account.userId);
                                $('#screenshot-sender-property-reporter-wrapper').css('display','none');
                            } else {
                                $('#screenshot-sender-property-reporter-wrapper').css('display','block');
                                $('#screenshot-sender-property-reporter-lv').inFieldLabels(inFieldLabelsOptions);
                            }
                            currentDriver.createProperty(idPrefix, props);
                            setImageAreaAnimation();
                        },
                        formatString: MII.getFormattedString,
                        resetup: function(){ setSite(id, true);},
                    }, resetup);
                },
                function() {
                    resetList();
                    setImageAreaAnimation();
                }
            );
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
            if (!validateTicket()) return false;
            $('#screenshot-sender-submit').attr('disabled', true);

            var attr = {}
            $('.screenshot-sender-property').each(function() {
                var id = this.id.substr(idPrefix.length);
                if (this.tagName == 'INPUT') {
                    if (this.type == 'checkbox') {
                        // XXX unchecked value must be '0' in all BTS
                        attr[id] = this.checked ? this.value : '0';
                    } else {
                        attr[id] = this.value;
                    }
                } else if (this.tagName == 'TEXTAREA') {
                    attr[id] = this.value;
                } else if (this.tagName == 'SELECT') {
                    if (this.multiple) {
                        attr[id] = [];
                        $('option:selected', this).each(function(){
                            attr[id].push($(this).val());
                        });
                    } else {
                        attr[id] = this.value;
                    }
                } else if (this.tagName == 'SPAN') { // radio
                    $(':checked', this).each(function() {
                        attr[id] = this.value;
                    });
                }
            });

            currentDriver.send({
                loginProperties: loginProperties,
                sumarry: $('#screenshot-sender-property-sumarry').val().trim(),
                description: $('#screenshot-sender-property-description').val().trim(),
                imageParams: imageParams,
                imageFileName: imageParams ? imageFileName() : null,
                reporter: $('#screenshot-sender-property-reporter').val().trim(),
                attributes: attr,
                error: function(message) {
                    alert(MII.getString('fulmo_main_message_create_ticket_failed') + "\n\n" + message);
                    $('#screenshot-sender-submit').attr('disabled', false);
                },
                success: function(url) {
                    $('#screenshot-sender-submit').attr('disabled', false);
                    if ($('#screenshot-sender-open-ticket').attr('checked')) {
                        MII.openURL(url);
                    }
                    _dirty = false;
                    window.close();
                }
            });
            return false;
        }

        fulmo.main.setImage = function(imageUrl) {
            imageParams[0] = imageUrl;
            imageResize();
        };
    };
})(fulmo);
