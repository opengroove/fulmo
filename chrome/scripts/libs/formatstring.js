(function($) {
    // Like stringbundle.getFormattedString
    $.formatString = function(format, args) {
        var count = 0;
        return format.replace(/%[S%]/g, function(match) {
            var value;
            switch (match) {
            case '%S':
                value = args[count];
                break;
            case '%%':
                return '%';
            default:
                return match;
            }
            count++;
            return value;
        });
    };
})(jQuery);
