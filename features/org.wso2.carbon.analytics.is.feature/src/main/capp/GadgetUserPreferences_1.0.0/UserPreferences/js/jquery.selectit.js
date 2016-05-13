// jquery.selectit plugin v0.1 Alpha
// Copyright (c) 2011 Chris Pietschmann (http://pietschsoft.com)
// This work is licensed under a Creative Commons Attribution 3.0 United States License, unless explicitly stated otherwise within the posted content.
// http://creativecommons.org/licenses/by/3.0/us/
(function ($) {
    var keyCodes = {
        space: 32,
        enter: 13,
        comma: 188,
        backspace: 8,
        control: 17,
        isMatch: function () {
            var which = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                if (arguments[i] === which) {
                    return true;
                }
            }
            return false;
        }
    };
    var defaultOptions = {
        fieldname: null,
        values: null
    };
    function parseValues(options) {
        var tags = splitString(this.val());
        for (var i in tags) {
            var tag = tags[i];
            if (tag.length > 0) {
                addValue.call(this.parent(), tag, options);
            }
        }
        this.val('');
    }
    function addValue(tag, options) {
        var hiddeninput = $('<input/>').attr('type', 'hidden').val(tag);
        if (options.fieldname) {
            hiddeninput.attr('name', options.fieldname);
        }
        this.before(
                    $('<span/>').addClass('selectit-option').html(tag).append(hiddeninput).append(
                        $('<a/>').addClass('selectit-close').attr('title', 'remove').html('x').click(function () {
                            $(this).parent().remove();
                        })
                    )
                );
    }
    function splitString(str) {
        var arr = str.split(',');
        var finishedArray = [];
        for (var i = 0; i < arr.length; i++) {
            var temp = arr[i].split(' ');
            for (var x = 0; x < temp.length; x++) {
                finishedArray.push(temp[x]);
            }
        }
        return finishedArray;
    }

    $.fn.selectit = function (opts) {
        if (!opts || (opts && typeof opts !== 'string')) {
            var options = $.extend({}, defaultOptions, opts);
            var that = this;
            this.data('selectit-options', options);
            this.addClass("selectit").each(function () {
                // add input box
                var input = $('<input/>').
                                attr({ type: 'text' }).
                                addClass('selectit-input').
                                keyup(function (e) {
                                    var elem = $(this);
                                    if (keyCodes.isMatch(e.which, keyCodes.comma, keyCodes.control, keyCodes.enter, keyCodes.space)) {
                                        parseValues.call(elem, that.data('selectit-options'));
                                    }
                                }).
                                blur(function () {
                                    parseValues.call($(this), that.data('selectit-options'));
                                }).
                                keydown(function (e) {
                                    var elem = $(this);
                                    if (keyCodes.isMatch(e.which, keyCodes.backspace)) {
                                        if (elem.val().length === 0) {
                                            // remove the far right tag
                                            var lastoption = elem.parent().parent().find('.selectit-option:last');
                                            elem.val(lastoption.find('input').val());
                                            lastoption.remove();
                                            return false;
                                        }
                                    }
                                });
                $('<span/>').addClass('selectit-new').append(input).appendTo(this);
            });
            if (options.values) {
                this.selectit('add', options.values);
            }
        } else {
            var method = opts.toLowerCase();
            var value = arguments[1];

            // run methods on the selectit box
            // possible: add, remove, clear

            if (method === 'values') {
                var values = [];
                $(this).find('.selectit-option input[type=hidden]').each(function () {
                    values.push($(this).val());
                });
                return values;
            } else if (method === 'clear') {
                $(this).find('.selectit-option').remove();
            } else if (method === 'add') {
                if (typeof value === 'string') {
                    value = [value];
                }
                for (var vi = 0; vi < value.length; vi++) {
                    addValue.call($(this).find('.selectit-new'), value[vi], $(this).data('selectit-options'));
                }
            }

        }
        return this;
    };
})(jQuery);