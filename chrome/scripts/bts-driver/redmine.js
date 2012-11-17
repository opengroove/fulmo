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

function driver(){}
driver.prototype = {

    /*** 
     * 設定画面のBTS選択画面に表示するラベル
     */
    name: 'redmine',
    label: 'Redmine',
    icon: 'redmine.png',

    _normalizationPath: function(account) {
        path = account.path;
        url = account.url;
        if (path.charAt(path.length - 1) != '/') {
            url += '/';
            path += '/';
        }
        var tmp = url.split('/');
        if (tmp.length < 3 || tmp[tmp.length - 3] != 'projects') return null;
        return {path: path, url: url};
    },

    _openChain: function (client, params, account, success, error) {
        var index = 0;
        function _openOne() {
            if (client.overrideMimeType) {
                client.overrideMimeType('application/xml; charset=utf-8');
            }
            if (account.authType == 'none') {
                client.open('GET', params[index][0], true);
            } else {
                client.open('GET', params[index][0], true, account.userId, account.password);
            }
            client.send('', function() {
                if (client.status == 200) {
                    if (params[index][1] !== null) params[index][1](index);
                    index++;
                    if (index < params.length) {
                        _openOne();
                    } else {
                        success();
                    }
                } else {
                    error(index, params[index][0]);
                }
            });
        }
        _openOne();
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
        if (normParam === null) {
            p.error(p.formatString('fulmo_redmine_test_message_url_invalid', []));
            return;
        }
        fulmo.xmlHttpRequestCredential.cleanup();
        var client = new fulmo.FulmoXMLHttpRequest();
        var projectUrl = normParam.url;
        var tmp = projectUrl.split('/');
        tmp.pop();
        tmp.pop();
        tmp.pop();
        var baseUrl = tmp.join('/') + '/';
        var testUrl = baseUrl + 'users/current.xml';

        this._openChain(
            client,
            [
                [testUrl, null]
            ], 
            p.account, 
            function() { // success
                p.success(p.formatString('fulmo_test_message_succeeded_no_version', [normParam.url]));
            },
            function(index, url) { // error
                var errorStr = client.statusText;
                if (errorStr == '') errorStr = 'Response Code = ' + client.status;
                p.error(p.formatString('fulmo_test_message_failed', [testUrl ,errorStr]));
            }
        );
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
     */
    loginAndGetFields: function(idPrefix, p, resetup) {
        var _THIS = this;
        this._extGetFields(idPrefix, p, resetup, function(){_THIS._stdGetFields(p);});
    },

    _extGetFields: function(idPrefix, p, resetup, errorFunc) {
        var trackerId = 1;
        var projectId = 0;
        if (resetup) {
            projectId = parseInt($('#' + idPrefix + 'project_id').val());
            trackerId = parseInt($('#'+ idPrefix + 'tracker_id').val());
        }
        var normParam = this._normalizationPath(p.account);
        if (normParam === null) {
            p.error(p.formatString('fulmo_redmine_test_message_url_invalid', []));
            return;
        }
        fulmo.xmlHttpRequestCredential.cleanup();
        var client = new fulmo.FulmoXMLHttpRequest();
        var projectUrl = normParam.url;
        var tmp = projectUrl.split('/');
        tmp.pop();
        var projectIdentifier = tmp.pop();
        tmp.pop();
        var baseUrl = tmp.join('/') + '/';
        var params1 = [];
        var params2 = [];
        var params3 = [];

        var urlParams = [
            [
                // プロジェクトl情報取得
                baseUrl + 'projects.xml?limit=100',function(index) {
                    var arr = client.responseXML.getElementsByTagName('project');
                    tmp = [];
                    for (var i = 0; i < arr.length; i++) {
                        var tmpId = arr[i].getElementsByTagName('id')[0].textContent;
                        var tmpIdentifier = arr[i].getElementsByTagName('identifier')[0].textContent;
                        var is_default;
                        if (!projectId) {
                            is_default = tmpIdentifier == projectIdentifier;
                        } else {
                            is_default = tmpId == projectId;
                        }
                        tmp.push({
                            id: tmpId,
                            name: arr[i].getElementsByTagName('name')[0].textContent,
                            is_default: is_default
                        });
                        if (is_default) {
                            projectId = tmpId;
                            projectUrl = baseUrl + 'projects/' + tmpIdentifier + '/';
                        }
                    }
                    params1.push(
                        {
                            label: p.formatString('fulmo_redmine_label_project',[]),
                            name: 'project_id',
                            format: 'list',
                            items: tmp,
                            is_required: true,
                            reload: true
                        }
                    );
                    urlParams[1][0] = projectUrl + 'trackers.xml';
                }
            ],
            [
                // トラッカー情報取得
                '', // URLはプロジェクト情報取得時に決定している
                function(index) {
                    var arr = client.responseXML.getElementsByTagName('tracker');
                    var tmp = [];
                    for (var i = 0; i < arr.length; i++) {
                        var tmpId = arr[i].getElementsByTagName('id')[0].textContent;
                        var is_default = trackerId == tmpId;
                        tmp.push({
                                id: tmpId, 
                                name: arr[i].getElementsByTagName('name')[0].textContent,
                                is_default: is_default
                        });
                    }
                    params1.push(
                        {
                            label: p.formatString('fulmo_redmine_label_tracker',[]),
                            name: 'tracker_id',
                            format: 'list',
                            items: tmp,
                            is_required: true,
                            reload: true
                        }
                    );
                    urlParams[2][0] = projectUrl + 'issues/attributes.xml?tracker_id=' + trackerId;
                }
            ],
            [
                // チケットフィールド情報取得
                '',  // URLはトラッカー情報取得時に決定している
                function(index) {
                    var stdArr = client.responseXML.getElementsByTagName('standard_attribute');
                    var cstArr = client.responseXML.getElementsByTagName('custom_attribute');
                    var attrs = {
                        label: '',
                        format: '',
                        is_required: false,
                        default_value: '',
                        min_length: 0,
                        max_length: 0,
                        multiple: false,
                        regexp: '',
                        is_required: false
                    };
                    for (var i = 0; i < stdArr.length; i++) {
                        var tmp = {};
                        tmp['name'] = stdArr[i].getAttribute('name');
                        for (var j in attrs) {
                            if (stdArr[i].getElementsByTagName(j).length) {
                                var tmp2 = stdArr[i].getElementsByTagName(j)[0].textContent;
                                switch (typeof(attrs[j])) {
                                case 'number':
                                    tmp[j] = parseInt(tmp2);
                                    break;
                                case 'boolean':
                                    tmp[j] = (tmp2 == 'true');
                                    break;
                                case 'string':
                                default:
                                    tmp[j] = tmp2;
                                    break;
                                }
                            } else {
                                tmp[j] = attrs[j];
                            }
                            if (tmp['format'] == 'list' || tmp['format'] == 'user' || tmp['format'] == 'version') {
                                var tmp2 = [];
                                var arrLists = stdArr[i].getElementsByTagName('possible_values')[0].getElementsByTagName('value');
                                for (var k = 0; k < arrLists.length; k++) {
                                    tmp2.push({
                                        id: arrLists[k].getAttribute('id'),
                                        name: arrLists[k].textContent,
                                        is_default: arrLists[k].getAttribute('id') == tmp['default_value']
                                    });
                                }
                                tmp['items'] = tmp2;
                            }
                        }
                        params2.push(tmp);
                    }
                    for (i = 0; i < cstArr.length; i++) {
                        var tmp = {};
                        var tmpId = cstArr[i].getAttribute('id');
                        for (var j in attrs) {
                            if (cstArr[i].getElementsByTagName(j).length) {
                                var tmp2 = cstArr[i].getElementsByTagName(j)[0].textContent;
                                switch (typeof(attrs[j])) {
                                case 'number':
                                    tmp[j] = parseInt(tmp2);
                                    break;
                                case 'boolean':
                                    if (tmp2 == 'true') tmp[j] = true;
                                    else tmp[j] = false;
                                    break;
                                case 'string':
                                default:
                                    tmp[j] = tmp2;
                                    break;
                                }
                            } else {
                                tmp[j] = attrs[j];
                            }
                            tmp['label'] = cstArr[i].getElementsByTagName('name')[0].textContent;
                            if (cstArr[i].getElementsByTagName('id').length) {
                                tmpId = cstArr[i].getElementsByTagName('id')[0].textContent;
                            }
                            tmp['name'] = 'custom-attributes-' +  tmpId;
                            if (tmp['format'] == 'list' || tmp['format'] == 'user' || tmp['format'] == 'version') {
                                var tmp2 = [];
                                var arrLists = cstArr[i].getElementsByTagName('possible_values')[0].getElementsByTagName('value');
                                for (var k = 0; k < arrLists.length; k++) {
                                    tmp2.push({
                                        id: arrLists[k].getAttribute('id'),
                                        name: arrLists[k].textContent,
                                        is_default: arrLists[k].getAttribute('id') == tmp['default_value']
                                    });
                                }
                                tmp['items'] = tmp2;
                            }
                        }
                        params3.push(tmp);
                    }
                }
            ]
        ];
        this._openChain(
            client,
            urlParams,
            p.account, 
            function() { // success
                var out = {
                    resetup: p.resetup,
                    account: p.account,
                    client: client,
                    baseUrl: baseUrl,
                    projectUrl: projectUrl,
                    projectId: projectId,
                    top: [
                    ],
                    bottom: [params1, params2, params3],
                }
                p.success(out);

            },
            function(index, url) { // error
                if (errorFunc && client.status == 404) {
                    errorFunc();
                } else {
                    var errorStr = client.statusText;
                    if (errorStr == '') errorStr = 'Response Code = ' + client.status;
                    errorStr = 'URL: ' + url + '\n' + errorStr;
                    p.error(errorStr);
                }
            }
        );
    },

    _stdGetFields: function(p) {
        var normParam = this._normalizationPath(p.account);
        if (normParam === null) {
            p.error(p.formatString('fulmo_redmine_test_message_url_invalid', []));
            return;
        }
        fulmo.xmlHttpRequestCredential.cleanup();
        var client = new fulmo.FulmoXMLHttpRequest();
        var projectUrl = normParam.url;
        var tmp = projectUrl.split('/');
        tmp.pop();
        var projectIdentifier = tmp.pop();
        tmp.pop();
        var baseUrl = tmp.join('/') + '/';
        var params = {};

        this._openChain(
            client,
            [
                [
                    // カテゴリ取得
                    projectUrl + 'issue_categories.xml',function(index) {
                        var arr = client.responseXML.getElementsByTagName('issue_category');
                        params.categories = [];
                        for (var i = 0; i < arr.length; i++) {
                            params.categories.push({
                                    id: arr[i].getElementsByTagName('id')[0].textContent, 
                                    name: arr[i].getElementsByTagName('name')[0].textContent
                            });
                        }
                    }
                ],
                [
                    // ステータス取得
                    baseUrl + 'issue_statuses.xml',function(index) {
                        var arr = client.responseXML.getElementsByTagName('issue_status');
                        params.statuses = [];
                        for (var i = 0; i < arr.length; i++) {
                            var id = arr[i].getElementsByTagName('id')[0].textContent;
                            var name = arr[i].getElementsByTagName('name')[0].textContent;
                            params.statuses.push({
                                    id: arr[i].getElementsByTagName('id')[0].textContent, 
                                    name: arr[i].getElementsByTagName('name')[0].textContent,
                                    is_default: arr[i].getElementsByTagName('is_default')[0].textContent == 'true',
                                    is_closes: arr[i].getElementsByTagName('is_closed')[0].textContent == 'true'
                            });
                        }
                    }
                ],
                [
                    // トラッカー取得
                    baseUrl + 'trackers.xml',function(index) {
                        var arr = client.responseXML.getElementsByTagName('tracker');
                        params.trackers = [];
                        for (var i = 0; i < arr.length; i++) {
                            params.trackers.push({
                                    id: arr[i].getElementsByTagName('id')[0].textContent, 
                                    name: arr[i].getElementsByTagName('name')[0].textContent,
                            });
                        }
                    }
                ],
                [
                    // プロジェクト取得
                    baseUrl + 'projects.xml?limit=100',function(index) {
                        var arr = client.responseXML.getElementsByTagName('project');
                        params.projects = [];
                        for (var i = 0; i < arr.length; i++) {
                            params.projects.push({
                                id: arr[i].getElementsByTagName('id')[0].textContent,
                                name: arr[i].getElementsByTagName('name')[0].textContent,
                                is_default: projectIdentifier == arr[i].getElementsByTagName('identifier')[0].textContent,
                            });
                        }

                    }
                ]
            ], 
            p.account, 
            function() { // success
                var projectId = 1;
                if (params.projects[projectIdentifier]) {
                    projectId = params.projects[projectIdentifier];
                }
                var out = {
                    account: p.account,
                    client: client,
                    baseUrl: baseUrl,
                    projectUrl: projectUrl,
                    projectId: projectId,
                    top: [
                    ],
                    bottom: [
                        [
                            {
                                label: p.formatString('fulmo_redmine_label_project',[]),
                                name: 'project_id',
                                format: 'list',
                                reload: true,
                                is_required: true,
                                items: params.projects,
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_tracker',[]),
                                name: 'tracker_id',
                                format: 'list',
                                reload: true,
                                is_required: true,
                                items: params.trackers
                            },
                        ],
                        [
                            {
                                label: p.formatString('fulmo_redmine_label_status',[]),
                                name: 'status_id',
                                format: 'list',
                                is_required: true,
                                items: params.statuses
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_priority',[]),
                                format: 'list',
                                name: 'priority_id',
                                is_required: true,
                                items: [
                                    {id: '3', name: 'Low'},
                                    {id: '4', name: 'Normal', is_default: true},
                                    {id: '5', name: 'High'},
                                    {id: '6', name: 'Urgent'},
                                    {id: '7', name: 'Immediate'}
                                ]
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_category',[]),
                                format: 'list',
                                name: 'category_id',
                                items: params.categories
                            },

                            {
                                label: p.formatString('fulmo_redmine_label_parent_issue',[]),
                                name: 'parent_issue_id',
                                format: 'string'
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_start_date',[]),
                                name: 'start_date',
                                format: 'date'
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_due_date',[]),
                                name: 'due_date',
                                format: 'date'
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_estimated_hours',[]),
                                name: 'estimated_hours',
                                format: 'string'
                            },
                            {
                                label: p.formatString('fulmo_redmine_label_done_ratio',[]),
                                name: 'done_ratio',
                                format: 'list',
                                items: [
                                    {id: '0', name: '0 %'},
                                    {id: '10', name: '10 %'},
                                    {id: '20', name: '20 %'},
                                    {id: '30', name: '30 %'},
                                    {id: '40', name: '40 %'},
                                    {id: '50', name: '50 %'},
                                    {id: '60', name: '60 %'},
                                    {id: '70', name: '70 %'},
                                    {id: '80', name: '80 %'},
                                    {id: '90', name: '90 %'},
                                    {id: '100', name: '100 %'}
                                ]
                            }
                        ],
                        []
                    ],
                }
                p.success(out);
            },
            function(index, url) { // error
                var errorStr = client.statusText;
                if (errorStr == '') errorStr = 'Response Code = ' + client.status;
                errorStr = 'URL: ' + url + '\n' + errorStr;
                p.error(errorStr);
            }

        );
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

        function createElement(target, val) {

            function reloadAttribute() {
                p.resetup();
            }

            var createInput = {
                'string': function(val) {
                    var inp = $('<input>');
                    if (val.default_value) inp.val(val.default_value);
                    inp.attr('id', idPrefix + name);
                    inp.addClass('screenshot-sender-property');
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label + ': ');
                    label.append(inp);
                    var span = $('<span>');
                    span.append(label);
                    span.append(inp);
                    return span;
                },
                'list': function(val) {
                    var sel = $('<select>');
                    if (val.multiple) {
                        sel.attr('multiple', 'multiple');
                        sel.attr('size', '5');
                    }
                    if (val.items) {
                        if (!val.is_required && !val.multiple) {
                            sel.append($('<option>'));
                        }
                        for (var i = 0; i < val.items.length; i++) {
                            var opt = $('<option>');
                            opt.text(val.items[i].name);
                            opt.val(val.items[i].id);
                            if (val.items[i].is_default) {
                                opt.attr('selected', 'selected');
                            }
                            sel.append(opt);
                        }
                    }
                    sel.attr('id', idPrefix + name);
                    sel.addClass('screenshot-sender-property');
                    if (val.reload) {
                        sel.change(reloadAttribute);
                    }
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label + ': ');
                    var span = $('<span>');
                    span.append(label);
                    span.append(sel);
                    return span;
                },
                'bool': function(val) {
                    var inp = $('<input>');
                    inp.val('1');
                    if (val.default_value != '0') { // チェック済の場合、'1' や 'on' が入る
                        inp.attr('checked', 'checked');
                    }
                    inp.css('width', '1.5em');
                    inp.attr('id', idPrefix + name);
                    inp.attr('type', 'checkbox');
                    inp.addClass('screenshot-sender-property');
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label + ': ');
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
                    glabel.text(val.label + ': ');
                    glabel.addClass('screenshot-sender-properties-label');
                    span.append(glabel);
                    var def = val.default_value ? val.default_value : null;
                    var wrap = $('<span>');
                    wrap.addClass('screenshot-sender-property');
                    wrap.attr('id', idPrefix + name);
                    for (var i = 0; i < val.options.length; i++) {
                        var label = $('<label>');
                        label.addClass('screenshot-sender-radio-label');
                        label.text(val.options[i]);
                        var inp = $('<input>');
                        inp.attr('name', idPrefix + name);
                        inp.attr('id', idPrefix + name + '-' + i);
                        inp.attr('type', 'radio');
                        inp.val(val.options[i]);
                        if (val.options[i] == def) inp.attr('checked', 'checked');
                        label.prepend(inp);
                        wrap.append(label);
                    }
                    span.append(wrap);
                    return span;
                },
                'text': function(val) {
                    var inp = $('<textarea>');
                    if (val.default_value) inp.text(val.default_value);
                    inp.attr('id', idPrefix + name);
                    inp.addClass('screenshot-sender-property');
                    if (val.width) inp.attr('cols', val.width);
                    if (val.height) inp.attr('rows', val.height);
                    var label = $('<label>');
                    label.addClass('screenshot-sender-properties-label');
                    label.attr('for', idPrefix + name);
                    label.text(val.label + ': ');
                    label.append(inp);
                    var span = $('<span>');
                    span.append(label);
                    span.append(inp);
                    return span;
                }
            };
            createInput['user'] = createInput['list'];
            createInput['version'] = createInput['list'];

            var li = $('<li>');
            if (val === null) {
                li.addClass('dummy');
                target.append(li);
            } else {
                var format = val.format;
                var name = val.name;
                if (!createInput[format]) format = 'string';
                var inp = createInput[format](val);
                if (inp) {
                    li.append(inp);
                    target.append(li);
                }
            }
            return li;
        }

        var target = $('#screenshot-sender-property-list');
        target.html('');
        var offset;
        var el;

        offset = ~~((p.bottom[0].length + 1) / 2);
        for (var i = 0; i < offset; i++) {
            el = createElement(target, p.bottom[0][i]);
            el.css('clear', 'left');
            if (i + offset < p.bottom[0].length) createElement(target, p.bottom[0][i + offset]);
        }
        var left = ['status_id', 'priority_id', 'assigned_to_id', 'category_id', 'fixed_version_id'];
        var right = ['parent_issue_id', 'start_date', 'due_date', 'estimated_hours', 'done_ratio'];
        var hash = {};
        for (i = 0; i < p.bottom[1].length; i++) {
            hash[p.bottom[1][i].name] = p.bottom[1][i];
        }
        while (left.length || right.length) {
            var id;
            id = '';
            while (!(id in hash) && left.length)
                id = left.shift();
            if (id in hash) {
                el = createElement(target, hash[id]);
            } else {
                el = createElement(target, null);
            }
            el.css('clear', 'left');
            id = '';
            while (!(id in hash) && right.length)
                id = right.shift();
            if (id in hash) {
                createElement(target, hash[id]);
            }
        }
        offset = ~~((p.bottom[2].length + 1) / 2);
        for (i = 0; i < offset; i++) {
            el = createElement(target, p.bottom[2][i]);
            el.css('clear', 'left');
            if (i + offset < p.bottom[2].length) createElement(target, p.bottom[2][i + offset]);
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
       @param {hash} attributes 各プロパティのIDをキーとし、設定値を値としたハッシュ。ただし複数の値を持つ場合はArrayが返される。
       @param {function} success: 成功時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、WEBサイトのチケットのページのURLを返す
       @param {function} error: 失敗時に呼ばれる関数オブジェクト。success()はひとつの引数を取り、失敗時のメッセージを渡す
       @detail
        
     */
    send: function(p) {
        function uploadTicket(token) {

            var domOuter = document.createElement('div');
            var domIssue = document.createElement('issue');
            domOuter.appendChild(domIssue);
            var domSubject = document.createElement('subject');
            var domDescription = document.createElement('description');
            domSubject.textContent = p.sumarry;
            domDescription.textContent = p.description;
            domIssue.appendChild(domSubject);
            domIssue.appendChild(domDescription);
            var domCustomFields = document.createElement('custom_fields');
            domCustomFields.setAttribute('type', 'array');
            domIssue.appendChild(domCustomFields);
            var custom = {};
            for (id in p.attributes) {
                if (id.substr(0, 'custom-attributes-'.length) == 'custom-attributes-') {
                    var domCustomField = document.createElement('custom_field');
                    var cid = id.substr('custom-attributes-'.length);
                    domCustomField.setAttribute('id', cid);
                    if (typeof(p.attributes[id]) == 'object') {
                        for (var i = 0; i < p.attributes[id].length; i++) {
                            var domCustomFieldValue = document.createElement('value');
                            domCustomFieldValue.textContent = p.attributes[id][i];
                            domCustomField.appendChild(domCustomFieldValue);
                        }
                    } else {
                        var domCustomFieldValue = document.createElement('value');
                        domCustomFieldValue.textContent = p.attributes[id];
                        domCustomField.appendChild(domCustomFieldValue);
                    }
                    domCustomFields.appendChild(domCustomField);
                } else {
                    var domAttr = document.createElement(id);
                    domAttr.textContent = p.attributes[id];
                    domIssue.appendChild(domAttr);
                }
            }
            if (token !== null) {
                var domUploads = document.createElement('uploads');
                domUploads.setAttribute('type', 'array');
                domIssue.appendChild(domUploads);
                var domUpload = document.createElement('upload');
                domUploads.appendChild(domUpload);
                var domToken = document.createElement('token');
                domToken.textContent = token;
                domUpload.appendChild(domToken);
                var domFilename = document.createElement('filename');
                domFilename.textContent = p.imageFileName;
                domUpload.appendChild(domFilename);
                var domContentType = document.createElement('content_type');
                domContentType.textContent = 'image/png';
                domUpload.appendChild(domContentType);
                domIssue.appendChild(domUploads);
            }
            var url = p.loginProperties.baseUrl + 'issues.xml';
            if (p.loginProperties.account.authType == 'none') {
                client.open('POST', url, true);
            } else {
                client.open('POST', url, true, p.loginProperties.account.userId, p.loginProperties.account.password);
            }
            client.setRequestHeader('Content-Type', 'application/xml');
            var xmlstr = '<?xml version="1.0"?>\n' + domOuter.innerHTML;
            client.send(xmlstr, function() {
                if (client.status == 201) {
                    var id = client.responseXML.getElementsByTagName('id')[0].textContent;
                    if (p.loginProperties.account.authType != 'none') {
                        // 間違ったパスワードで認証を失敗させ、自動的な認証ヘッダの送信を防止している
                        client.open('GET', url, true, p.loginProperties.account.userId, p.loginProperties.account.password + 'dummy');
                        client.send('', function(){
                            p.success(p.loginProperties.baseUrl + 'issues/' + id);
                        });
                    } else {
                        p.success(p.loginProperties.baseUrl + 'issues/' + id);
                    }
                } else {
                    if (client.status == 422) {
                        var domErrors = client.responseXML.getElementsByTagName('error');
                        if (domErrors.length != 0) {
                            var errors = [];
                            for (var i = 0; i < domErrors.length; i++) {
                                errors.push(domErrors[i].textContent);
                            }
                            errorStr = errors.join('\n');
                        } else {
                            errorStr = client.responseText;
                        }
                    } else {
                        var errorStr = client.statusText;
                        if (errorStr == '') errorStr = 'Response Code = ' + client.status;
                        errorStr = 'URL: ' + url + '\n' + errorStr;
                    }
                    if (p.loginProperties.account.authType != 'none') {
                        client.open('GET', url, true, p.loginProperties.account.userId, p.loginProperties.account.password + 'dummy');
                        client.send('', function(){
                            p.error(errorStr);
                        });
                    } else {
                        p.error(errorStr);
                    }
                }
            });
        }

        var client = new fulmo.FulmoXMLHttpRequest();

        if (p.imageParams) {
            var data = p.imageParams[0].replace(/^data:image\/png;base64,/, '');
            data = atob(data);
            var url = p.loginProperties.baseUrl + 'uploads.xml';
            if (p.loginProperties.account.authType == 'none') {
                client.open('POST', url, true);
            } else {
                client.open('POST', url, true, p.loginProperties.account.userId, p.loginProperties.account.password);
            }
            client.setRequestHeader('Content-Type', 'application/octet-stream');
            client.sendAsBinary(data, function() {
                if (client.status == 201) {
                    token = client.responseXML.getElementsByTagName('token')[0].textContent;
                    uploadTicket(token);
                } else {
                    var errorStr = client.statusText;
                    if (errorStr == '') errorStr = 'Response Code = ' + client.status;
                    errorStr = 'URL: ' + url + '\n' + errorStr;
                    p.error(errorStr);
                }
            });
        } else {
            uploadTicket(null);
        }
    }

};

fulmo.bts_driver_redmine = driver;

})(fulmo);
