#! /usr/bin/ruby -Ku
require 'json'
require 'yaml'
require 'kconv'

class CreateLocaleFiles
    IS_WARNING = 1
    IS_ERROR = 2

    def checkAsYaml fileName, data
        begin
            YAML.load data.gsub(/"(\\"|[^"])*"/, '""')
        rescue => e
            raise sprintf("'%s'をYAMLとしてパース中にエラーが発生しました。パーサが返したエラーは以下の通りです(日本語非対応です)。\n\n%s\n\n"\
            "エラー箇所が不明な場合は、指摘された行だけでなく、その前後の行も確認して下さい。\n"\
            "またメッセージが分かりにくい場合は、以下のような点に注意してみて下さい。\n\n"\
                " {}, [] 等の対応が正しくない\n"\
                '   例: { "商品グループ" : "標準" ]'"\n"\
                ' 項目名をクォートしていない'"\n"\
                '   例: { 商品グループ : "標準"]'"\n"\
                ' 文字列をクォートしていない'"\n"\
                '   例: { "商品グループ" : 標準}'"\n"\
                ' 最後の項目の末尾にカンマがある'"\n"\
                '   例: { "商品グループ" : "標準",}'"\n"\
                ' カンマの後に空白が無い(YAMLパーサの仕様)'"\n"\
                '   例: { "０４４",-64,-76,-143}'"\n\n", fileName, e.message)
        end
    end

    def checkAsJson fileName, lines
        data = nil
        begin
            data = JSON.parse(lines.join)
        rescue JSON::ParserError => e
            raise Exception, sprintf("%s: パース中にエラーが発生しました。パーサが返したエラーは以下の通りです。\n%s", fileName, e.message)
        end
        return data;
    end

    def outputFirefoxDTD fileName, locale, messages, block
        fp = File::open(fileName, 'w')
        messages.each { |key, message|
            if message.class == Hash
                message = message['firefox']
                if message == nil
                    block.call IS_WARNING, sprintf("文字列 '%s' のロケール '%s' はブラウザごとの指定が為されていますが、'firefox'の指定が存在しません。仮の文字列'???'を割り当てます", key, locale)
                    message = '???'
                end
            end
            fp.puts sprintf("<!ENTITY %s \"%s\">\n", key, message.gsub(/\n/, '\n').gsub(/\t/, '\t').gsub(/\"/, '\"').gsub(/%/, '&#37;'))
        }
    end

    def outputFirefoxProperties fileName, locale, messages, block
        fp = File::open(fileName, 'w')
        messages.each { |key, message|
            if message.class == Hash
                message = message['firefox']
                if message == nil
                    block.call IS_WARNING, sprintf("文字列 '%s' のロケール '%s' はブラウザごとの指定が為されていますが、'firefox'の指定が存在しません。仮の文字列'???'を割り当てます", key, locale)
                    message = '???'
                end
            end
            fp.puts sprintf("%s=%s\n", key, message.gsub(/\n/, '\n').gsub(/\t/, '\t'))
        }
    end

    def outputGoogleChromeJson fileName, locale, messages, block
        fp = File::open(fileName, 'w')
        fp.puts "{"
        for i in 0...messages.length
            key = messages[i][0]
            message = messages[i][1]
            if message.class == Hash
                message = message['google_chrome']
                if message == nil
                    block.call IS_WARNING, sprintf("文字列 '%s' のロケール '%s' はブラウザごとの指定が為されていますが、'google_chrome'の指定が存在しません。仮の文字列'???'を割り当てます", key, locale)
                    message = '???'
                end
            end
            fp.puts sprintf(' "%s": {' , key)
            fp.puts sprintf('  "message": "%s"', message.gsub(/\n/, '\n').gsub(/\t/, '\t').gsub(/\"/, '\"'))
            if i != messages.length - 1
                fp.puts " },"
            else 
                fp.puts " }"
            end
        end
        fp.puts "}"
    end

    def createFiles fileName, &block
        begin
            if ! test "r?", fileName
                raise Exception, "ファイル '#{fileName}' がオープンできません。"
            end
            lines = open(fileName).readlines("\n")
            checkAsYaml fileName, lines.join
            data = checkAsJson fileName, lines
            rootDir = File::dirname fileName
            if ! test "d?" , rootDir + '/' + data["firefox"]["dir"]
                raise Exception, sprintf("'%s' はディレクトリではありません", data["firefox"]["dir"])
            end
            if ! test "d?" , rootDir + '/' + data["google_chrome"]["dir"]
                raise Exception, sprintf("'%s' はディレクトリではありません", data["google_chrome"]["dir"])
            end
            out = {}
            data["locales"].each {|locale|
                out[locale] = []
            }
            data["messages"].each {|key, messages|
                defaultMessage = messages[data['master_locale']]
                if defaultMessage == nil
                    block.call IS_WARNING, sprintf("文字列 '%s' のマスターロケール '%s' の定義がありません。仮のメッセージ 'no message' を指定しました。", key, data['master_locale'])
                end
                messages.each {|locale, message|
                    if data["locales"].index(locale) == nil
                        block.call IS_WARNING, sprintf("文字列 '%s' に、不明なロケール '%s' が指定されています。", key, locale)
                    end
                }
                out.each {|locale, arr|
                    if data["messages"][key][locale] == nil
                        block.call IS_WARNING, sprintf("文字列 '%s' の、ロケール '%s' の定義がありません。", key, locale)
                        arr.push [key, defaultMessage]
                    else
                        arr.push [key, data["messages"][key][locale]]
                    end
                }
            }
            out.each {|locale, messages|
                if ! test "d?", rootDir + '/' + data["firefox"]["dir"] + '/' + locale
                    Dir::mkdir rootDir + '/' + data["firefox"]["dir"] + '/' + locale
                end
                if ! test "d?", rootDir + '/' + data["google_chrome"]["dir"] + '/' + locale
                    Dir::mkdir rootDir + '/' + data["google_chrome"]["dir"] + '/' + locale
                end
                outputFirefoxDTD rootDir + '/' + data["firefox"]["dir"] + '/' + locale + '/' + data["firefox"]["dtd"], locale, messages, block
                outputFirefoxProperties rootDir + '/' + data["firefox"]["dir"] + '/' + locale + '/' + data["firefox"]["properties"], locale, messages, block
                outputGoogleChromeJson rootDir + '/' + data["google_chrome"]["dir"] + '/' + locale + '/' + data["google_chrome"]["json"], locale, messages, block
            }
        rescue Exception => exp
            block.call IS_ERROR, exp.message
            raise exp
            return
        end
    end
end

# 文字列出力。Windows対応版
def kp m
    if ENV['LANG'] =~ /UTF-8$/
        print m + "\n"
    else
        print m.kconv(Kconv::SJIS, Kconv::UTF8) + "\n"
    end
end

if ARGV.length == 1 && ARGV[0] == '--help'
    kp "usage: createLocaleFiles [filename]"
    exit(1)
end

if ARGV.length == 0
    fileName = File::dirname($0) + '/../locale.json'
else
    fileName = ARGV[0]
end
errorCount = 0;
warningCount = 0;

CreateLocaleFiles.new.createFiles(fileName) { |messageKind, message|
    if messageKind == CreateLocaleFiles::IS_ERROR
        kp 'ERROR: ' + message
        errorCount += 1
    end
    if messageKind == CreateLocaleFiles::IS_WARNING
        kp 'WARNING: ' + message
        warningCount += 1
    end
    
}
if errorCount != 0
    kp sprintf("%d個のエラーが見つかりました。", errorCount)
end
if warningCount != 0
    kp sprintf("%d個の警告が見つかりました。", warningCount)
end
