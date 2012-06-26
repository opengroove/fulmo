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

function fulmo_bts_driver_trac(){}
fulmo_bts_driver_trac.prototype = {

    /*** 
     * 設定画面のBTS選択画面に表示するラベル
     */
    label: 'Trac',

    icon: 'trac.png',

    _normalizationPath: function(account) {
        path = account.path;
        url = account.url;
        if (path.charAt(path.length - 1) != '/') {
            url += '/';
            path += '/';
        }
        if (account.authType == '0' || account.authType == 'none') { // no password
            path += 'rpc';
            url += 'rpc';
        } else {
            path += 'login/rpc';
            url += 'login/rpc';
        }
        return {path: path, url: url};
    },

    /***
     * ログインテストを行う
       @param {hash} p パラメータをハッシュで与える
        @param {hash} p.account アカウント情報
         @param {string} p.account.id アカウントの一意なID
         @param {string} p.account.name アカウント名
         @param {string} p.account.url アクセス先のURL
         @param {string} p.account.siteType アカウントドライバーの名前 bts.js で定義される
         @param {string} p.account.autoType 認証方法 'none': なし 'http': basic認証、またはdigest認証 (その他の文字列が入る可能性もあり)
         @param {string} p.account.userId 認証に利用するユーザーID
         @param {string} p.account.password 認証に利用するパスワード
         @param {string} p.account.protocol アクセスするプロトコル 'http', 'https' 等が入る。p.account.url から導出される
         @param {string} p.account.host アクセス先のホスト名。p.account.url から導出される
         @param {number} p.account.port アクセス先のポート番号。p.account.url から導出される
         @param {string} p.account.path アクセス先のパス名。p.account.url から導出される
        @param {function} formatString sprintfライクな関数オブジェクト。環境依存になるのでドライバ内で書式付き文字列を利用したい場合、この関数オブジェクトを利用する事
        @param {function} success: 成功時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、成功時のメッセージを渡す
        @param {function} error: 失敗時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、失敗時のメッセージを渡す
       @detail
        設定画面でログインテストを行う時に呼ばれる関数です。ドライバはサーバーに接続し、与えられた認証パラメータで認証を行い、その結果を返す必要があります。
     */
    loginTest: function(p) {
        var normParam = this._normalizationPath(p.account);
        var msg = new xmlrpcmsg('system.getAPIVersion');
        xmlHttpRequestCredential.cleanup();
        var client = new xmlrpc_client(normParam.path, p.account.host, p.account.port, p.account.protocol);
        if (p.account.authType != 'none') {
            client.setCredentials(p.account.userId, p.account.password, 0);
        }
        client.send(msg, 180, function(res){
            if (res.faultCode()) {
                p.error(p.formatString('fulmo_test_message_failed', [normParam.url, res.faultString()]));
            } else {
                p.success(p.formatString('fulmo_test_message_succeeded', [normParam.url ,res.val.me[0].me, res.val.me[1].me, res.val.me[2].me]));
            }
        });
    },

    /**
     * ログインし、フィルードのリストを取得する
       @param {hash} p パラメータをハッシュで与える
        @param {hash} p.account アカウント情報
         @param {string} p.account.id アカウントの一意なID
         @param {string} p.account.name アカウント名
         @param {string} p.account.url アクセス先のURL
         @param {string} p.account.siteType アカウントドライバーの名前 bts.js で定義される
         @param {string} p.account.autoType 認証方法 'none': なし 'http': basic認証、またはdigest認証 (その他の文字列が入る可能性もあり)
         @param {string} p.account.userId 認証に利用するユーザーID
         @param {string} p.account.password 認証に利用するパスワード
         @param {string} p.account.protocol アクセスするプロトコル 'http', 'https' 等が入る。p.account.url から導出される
         @param {string} p.account.host アクセス先のホスト名。p.account.url から導出される
         @param {number} p.account.port アクセス先のポート番号。p.account.url から導出される
         @param {string} p.account.path アクセス先のパス名。p.account.url から導出される
        @param {function} p.success: 成功時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、成功時のメッセージを渡す
        @param {function} p.error: 失敗時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、失敗時のメッセージを渡す
        @param {function} formatString sprintfライクな関数オブジェクト。環境依存になるのでドライバ内で書式付き文字列を利用したい場合、この関数オブジェクトを利用する事
        @param {function} p.resetup: フィールドを再構成する関数。再構成を要求したい時にコールする
       @param resetup {boolean} 再構成の要求の時に真になる
       @detail
        サイトにログインし、fulmotのメイン画面に表示するための構成要素をサーバーから取得します。この関数はfulmoのメイン画面を
        表示する直前に「規定のサイト」の情報を取得するために呼ばれます。また、ユーザーがメイン画面の接続先を切り替えた時にも
        呼ばれます。
        ドライバ側では、サイトに接続後、構成要素を取得するためのリクエストを発行し、それを保存します。保存した結果は、p.success()
        関数の第一パラメータで返します。この内容は以後呼び出される createProperty() 関数と、 send() 関数で引数として与えられます。
        このパラメータは本体側で一時保存されますが、内容については関与しません。従って、自由に内容を定義する事ができます。
        再構成要求フラグである resetup は、この要求が新規の要求であるか、フィールドの値が変化した事に伴う再構成要求かを保持しています。
        再構成要求の場合、以前に作成したフィールドの内容が存在していますので、フィールドの値を読み取り、フィールドの値をカスタマイズ
        する事ができます。これはプロジェクトやトラッカーが変化した場合に要求されます。
        なお、再構成の要求はドライバが自分自身で発行しなければなりません。そのために、必要なタイミングで p.resetup() をコールして
        下さい。具体的には、プロジェクトやトラッカー等のUIが変化した時に、p.resetup() をコールするようにして下さい。
        loginAndGetFields() 関数は、$('#property-block').html('') 等を実行し、以前のUIをクリアしてからUIを構築して下さい。
        再構成要求の場合には、クリアする前の内容が以前に自分自身で作成した内容である事が保証されます。再構成要求以外の場合には、
        どのドライバがUIを作成したか不明なので、内容を参照してはいけません。
     */
    loginAndGetFields: function(idPrefix, p, resetup) {
        $('#property-block').html('');
        var normParam = this._normalizationPath(p.account);
        xmlHttpRequestCredential.cleanup();
        client = new xmlrpc_client(normParam.path, p.account.host, p.account.port, p.account.protocol);
        if (p.account.authType != 'none') client.setCredentials(p.account.userId, p.account.password, 0);

        client.send(new xmlrpcmsg('ticket.getTicketFields'), 30, function(res){
            if (res.faultCode()) {
                p.error(res.faultString());
                return;
            }
            p.success({client: client, url: p.account.url, val: res.val.me});
        });
    },

    /**
     * 画面に各フィールドのhtml要素を構築する
       @param {string} idPrefix html要素のID属性のprefix
       @param {hash} p loginAndGetFields() 関数が success() 関数で返した、パラメータ情報
       @detail
        fulmo のメイン画面に、サーバーから取得したプロパティ情報を利用し、入力フィールドを生成します。
        この関数内でjQuery 等を利用しながらDOMを操作します。
        入力要素は必ず screenshot-sender-property クラスを設定し、ID名には、idPrefix で指定された prefix を
        利用するようにして下さい。
     */
    createProperty: function(idPrefix, p) {
        var val = p.val;
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
                    if (val.optional && val.optional.me) {
                        sel.append($('<option>'));
                    }
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
        var target = $('#screenshot-sender-property-list');
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
    },

    /*** 
     * チケットをサーバーに送信する
       @param {hash} loginProperties loginAndGetFields() 関数が success() 関数で返した、パラメータ情報
       @param {string} sumarry タイトル
       @param {string} description 概要
       @param {array} imageParams 画像情報
        @param {string} imageParams[0] 画像のuri
        @param {string} imageParams[1] 幅
        @param {string} imageParams[2] 高さ
       @param {string} imageFileName 画像のファイル名(ベース名のみ)
       @param {string} reporter 報告者名
       @param {hash} attributes 各プロパティのIDをキーとし、設定値を値としたハッシュ
       @param {function} success: 成功時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、WEBサイトのチケットのページのURLを返す
       @param {function} error: 失敗時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、失敗時のメッセージを渡す
       @detail
        
     */
    send: function(p) {
        var msg = new xmlrpcmsg('ticket.create');
        msg.addParam(new xmlrpcval(p.sumarry));
        var desc = p.description;
        if (p.imageParams) {
            desc += '\n\n[[Image(' + p.imageFileName;
            desc += p.imageParams[1] > 320 ? ',320px)]]' : ')]]';
        }
        msg.addParam(new xmlrpcval(desc));
        var _attr = {
            reporter: new xmlrpcval(p.reporter)
        }
        for (id in p.attributes) {
            _attr[id] = new xmlrpcval(p.attributes[id]);
        }
        var attr = new xmlrpcval();
        attr.addStruct(_attr);
        msg.addParam(attr);
        msg.addParam(new xmlrpcval(true, 'boolean'));   // notify parameter
        p.loginProperties.client.send(msg, 30, function(res) {
            if (res.faultCode()) {
                p.error(res.faultString());
                return;
            }
            var no = res.val.me;
            var url = p.loginProperties.url;
            if (url.charAt(url.length - 1) != '/') url += '/';
            url += 'ticket/' + no;

            if (p.imageParams) {
                var desc = '';
                var data = base64_decode(p.imageParams[0].substr('data:image/png;base64,'.length));
                var msg = new xmlrpcmsg('ticket.putAttachment');
                msg.addParam(new xmlrpcval(no, 'int'));
                msg.addParam(new xmlrpcval(p.imageFileName));
                msg.addParam(new xmlrpcval(desc));
                msg.addParam(new xmlrpcval(data, 'base64'));
                p.loginProperties.client.send(msg, 30, function(res) {
                    if (res.faultCode()) {
                        p.error(res.faultString());
                        return;
                    }
                    p.success(url);
                });
            } else {
                p.success(url);
            }
        });
    }
};
