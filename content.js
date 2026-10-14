(function(){"use strict";const __libs={1: (module, exports, __require) => {
// node_modules/turndown/lib/turndown.browser.es.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TurndownService;
function extend(destination) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key))
                destination[key] = source[key];
        }
    }
    return destination;
}
function repeat(character, count) {
    return Array(count + 1).join(character);
}
function trimLeadingNewlines(string) {
    return string.replace(/^\n*/, '');
}
function trimTrailingNewlines(string) {
    // avoid match-at-end regexp bottleneck, see #370
    var indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === '\n')
        indexEnd--;
    return string.substring(0, indexEnd);
}
function trimNewlines(string) {
    return trimTrailingNewlines(trimLeadingNewlines(string));
}
var blockElements = ['ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS', 'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES', 'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'];
function isBlock(node) {
    return is(node, blockElements);
}
var voidElements = ['AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'];
function isVoid(node) {
    return is(node, voidElements);
}
function hasVoid(node) {
    return has(node, voidElements);
}
var meaningfulWhenBlankElements = ['A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT', 'AUDIO', 'VIDEO'];
function isMeaningfulWhenBlank(node) {
    return is(node, meaningfulWhenBlankElements);
}
function hasMeaningfulWhenBlank(node) {
    return has(node, meaningfulWhenBlankElements);
}
function is(node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
}
function has(node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function (tagName) {
        return node.getElementsByTagName(tagName).length;
    });
}
var markdownEscapes = [[/\\/g, '\\\\'], [/\*/g, '\\*'], [/^-/g, '\\-'], [/^\+ /g, '\\+ '], [/^(=+)/g, '\\$1'], [/^(#{1,6}) /g, '\\$1 '], [/`/g, '\\`'], [/^~~~/g, '\\~~~'], [/\[/g, '\\['], [/\]/g, '\\]'], [/^>/g, '\\>'], [/_/g, '\\_'], [/^(\d+)\. /g, '$1\\. ']];
function escapeMarkdown(string) {
    return markdownEscapes.reduce(function (accumulator, escape) {
        return accumulator.replace(escape[0], escape[1]);
    }, string);
}
var rules = {};
rules.paragraph = {
    filter: 'p',
    replacement: function (content) {
        return '\n\n' + content + '\n\n';
    }
};
rules.lineBreak = {
    filter: 'br',
    replacement: function (content, node, options) {
        return options.br + '\n';
    }
};
rules.heading = {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function (content, node, options) {
        var hLevel = Number(node.nodeName.charAt(1));
        if (options.headingStyle === 'setext' && hLevel < 3) {
            var underline = repeat(hLevel === 1 ? '=' : '-', content.length);
            return '\n\n' + content + '\n' + underline + '\n\n';
        }
        else {
            return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n';
        }
    }
};
rules.blockquote = {
    filter: 'blockquote',
    replacement: function (content) {
        content = trimNewlines(content).replace(/^/gm, '> ');
        return '\n\n' + content + '\n\n';
    }
};
rules.list = {
    filter: ['ul', 'ol'],
    replacement: function (content, node) {
        var parent = node.parentNode;
        if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
            return '\n' + content;
        }
        else {
            return '\n\n' + content + '\n\n';
        }
    }
};
rules.listItem = {
    filter: 'li',
    replacement: function (content, node, options) {
        var prefix = options.bulletListMarker + '   ';
        var parent = node.parentNode;
        if (parent.nodeName === 'OL') {
            var start = parent.getAttribute('start');
            var index = Array.prototype.indexOf.call(parent.children, node);
            prefix = (start ? Number(start) + index : index + 1) + '.  ';
        }
        var isParagraph = /\n$/.test(content);
        content = trimNewlines(content) + (isParagraph ? '\n' : '');
        content = content.replace(/\n/gm, '\n' + ' '.repeat(prefix.length)); // indent
        return prefix + content + (node.nextSibling ? '\n' : '');
    }
};
rules.indentedCodeBlock = {
    filter: function (node, options) {
        return options.codeBlockStyle === 'indented' && node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
    },
    replacement: function (content, node, options) {
        return '\n\n    ' + node.firstChild.textContent.replace(/\n/g, '\n    ') + '\n\n';
    }
};
rules.fencedCodeBlock = {
    filter: function (node, options) {
        return options.codeBlockStyle === 'fenced' && node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
    },
    replacement: function (content, node, options) {
        var className = node.firstChild.getAttribute('class') || '';
        var language = (className.match(/language-(\S+)/) || [null, ''])[1];
        var code = node.firstChild.textContent;
        var fenceChar = options.fence.charAt(0);
        var fenceSize = 3;
        var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');
        var match;
        while (match = fenceInCodeRegex.exec(code)) {
            if (match[0].length >= fenceSize) {
                fenceSize = match[0].length + 1;
            }
        }
        var fence = repeat(fenceChar, fenceSize);
        return '\n\n' + fence + language + '\n' + code.replace(/\n$/, '') + '\n' + fence + '\n\n';
    }
};
rules.horizontalRule = {
    filter: 'hr',
    replacement: function (content, node, options) {
        return '\n\n' + options.hr + '\n\n';
    }
};
rules.inlineLink = {
    filter: function (node, options) {
        return options.linkStyle === 'inlined' && node.nodeName === 'A' && node.getAttribute('href');
    },
    replacement: function (content, node) {
        var href = escapeLinkDestination(node.getAttribute('href'));
        var title = escapeLinkTitle(cleanAttribute(node.getAttribute('title')));
        var titlePart = title ? ' "' + title + '"' : '';
        return '[' + content + '](' + href + titlePart + ')';
    }
};
rules.referenceLink = {
    filter: function (node, options) {
        return options.linkStyle === 'referenced' && node.nodeName === 'A' && node.getAttribute('href');
    },
    replacement: function (content, node, options) {
        var href = escapeLinkDestination(node.getAttribute('href'));
        var title = cleanAttribute(node.getAttribute('title'));
        if (title)
            title = ' "' + escapeLinkTitle(title) + '"';
        var replacement;
        var reference;
        switch (options.linkReferenceStyle) {
            case 'collapsed':
                replacement = '[' + content + '][]';
                reference = '[' + content + ']: ' + href + title;
                break;
            case 'shortcut':
                replacement = '[' + content + ']';
                reference = '[' + content + ']: ' + href + title;
                break;
            default:
                var id = this.references.length + 1;
                replacement = '[' + content + '][' + id + ']';
                reference = '[' + id + ']: ' + href + title;
        }
        this.references.push(reference);
        return replacement;
    },
    references: [],
    append: function (options) {
        var references = '';
        if (this.references.length) {
            references = '\n\n' + this.references.join('\n') + '\n\n';
            this.references = []; // Reset references
        }
        return references;
    }
};
rules.emphasis = {
    filter: ['em', 'i'],
    replacement: function (content, node, options) {
        if (!content.trim())
            return '';
        return options.emDelimiter + content + options.emDelimiter;
    }
};
rules.strong = {
    filter: ['strong', 'b'],
    replacement: function (content, node, options) {
        if (!content.trim())
            return '';
        return options.strongDelimiter + content + options.strongDelimiter;
    }
};
rules.code = {
    filter: function (node) {
        var hasSiblings = node.previousSibling || node.nextSibling;
        var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
        return node.nodeName === 'CODE' && !isCodeBlock;
    },
    replacement: function (content) {
        if (!content)
            return '';
        content = content.replace(/\r?\n|\r/g, ' ');
        var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
        var delimiter = '`';
        var matches = content.match(/`+/gm) || [];
        while (matches.indexOf(delimiter) !== -1)
            delimiter = delimiter + '`';
        return delimiter + extraSpace + content + extraSpace + delimiter;
    }
};
rules.image = {
    filter: 'img',
    replacement: function (content, node) {
        var alt = escapeMarkdown(cleanAttribute(node.getAttribute('alt')));
        var src = escapeLinkDestination(node.getAttribute('src') || '');
        var title = cleanAttribute(node.getAttribute('title'));
        var titlePart = title ? ' "' + escapeLinkTitle(title) + '"' : '';
        return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
    }
};
function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '';
}
function escapeLinkDestination(destination) {
    var escaped = destination.replace(/([<>()])/g, '\\$1');
    return escaped.indexOf(' ') >= 0 ? '<' + escaped + '>' : escaped;
}
function escapeLinkTitle(title) {
    return title.replace(/"/g, '\\"');
}
/**
 * Manages a collection of rules used to convert HTML to Markdown
 */
function Rules(options) {
    this.options = options;
    this._keep = [];
    this._remove = [];
    this.blankRule = {
        replacement: options.blankReplacement
    };
    this.keepReplacement = options.keepReplacement;
    this.defaultRule = {
        replacement: options.defaultReplacement
    };
    this.array = [];
    for (var key in options.rules)
        this.array.push(options.rules[key]);
}
Rules.prototype = {
    add: function (key, rule) {
        this.array.unshift(rule);
    },
    keep: function (filter) {
        this._keep.unshift({
            filter: filter,
            replacement: this.keepReplacement
        });
    },
    remove: function (filter) {
        this._remove.unshift({
            filter: filter,
            replacement: function () {
                return '';
            }
        });
    },
    forNode: function (node) {
        if (node.isBlank)
            return this.blankRule;
        var rule;
        if (rule = findRule(this.array, node, this.options))
            return rule;
        if (rule = findRule(this._keep, node, this.options))
            return rule;
        if (rule = findRule(this._remove, node, this.options))
            return rule;
        return this.defaultRule;
    },
    forEach: function (fn) {
        for (var i = 0; i < this.array.length; i++)
            fn(this.array[i], i);
    }
};
function findRule(rules, node, options) {
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (filterValue(rule, node, options))
            return rule;
    }
    return undefined;
}
function filterValue(rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === 'string') {
        if (filter === node.nodeName.toLowerCase())
            return true;
    }
    else if (Array.isArray(filter)) {
        if (filter.indexOf(node.nodeName.toLowerCase()) > -1)
            return true;
    }
    else if (typeof filter === 'function') {
        if (filter.call(rule, node, options))
            return true;
    }
    else {
        throw new TypeError('`filter` needs to be a string, array, or function');
    }
}
/**
 * The collapseWhitespace function is adapted from collapse-whitespace
 * by Luc Thevenard.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * collapseWhitespace(options) removes extraneous whitespace from an the given element.
 *
 * @param {Object} options
 */
function collapseWhitespace(options) {
    var element = options.element;
    var isBlock = options.isBlock;
    var isVoid = options.isVoid;
    var isPre = options.isPre || function (node) {
        return node.nodeName === 'PRE';
    };
    if (!element.firstChild || isPre(element))
        return;
    var prevText = null;
    var keepLeadingWs = false;
    var prev = null;
    var node = next(prev, element, isPre);
    while (node !== element) {
        if (node.nodeType === 3 || node.nodeType === 4) {
            // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
            var text = node.data.replace(/[ \r\n\t]+/g, ' ');
            if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === ' ') {
                text = text.substr(1);
            }
            // `text` might be empty at this point.
            if (!text) {
                node = remove(node);
                continue;
            }
            node.data = text;
            prevText = node;
        }
        else if (node.nodeType === 1) {
            // Node.ELEMENT_NODE
            if (isBlock(node) || node.nodeName === 'BR') {
                if (prevText) {
                    prevText.data = prevText.data.replace(/ $/, '');
                }
                prevText = null;
                keepLeadingWs = false;
            }
            else if (isVoid(node) || isPre(node)) {
                // Avoid trimming space around non-block, non-BR void elements and inline PRE.
                prevText = null;
                keepLeadingWs = true;
            }
            else if (prevText) {
                // Drop protection if set previously.
                keepLeadingWs = false;
            }
        }
        else {
            node = remove(node);
            continue;
        }
        var nextNode = next(prev, node, isPre);
        prev = node;
        node = nextNode;
    }
    if (prevText) {
        prevText.data = prevText.data.replace(/ $/, '');
        if (!prevText.data) {
            remove(prevText);
        }
    }
}
/**
 * remove(node) removes the given node from the DOM and returns the
 * next node in the sequence.
 *
 * @param {Node} node
 * @return {Node} node
 */
function remove(node) {
    var next = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next;
}
/**
 * next(prev, current, isPre) returns the next node in the sequence, given the
 * current and previous nodes.
 *
 * @param {Node} prev
 * @param {Node} current
 * @param {Function} isPre
 * @return {Node}
 */
function next(prev, current, isPre) {
    if (prev && prev.parentNode === current || isPre(current)) {
        return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
}
/*
 * Set up window for Node.js
 */
var root = typeof window !== 'undefined' ? window : {};
/*
 * Parsing HTML strings
 */
function canParseHTMLNatively() {
    var Parser = root.DOMParser;
    var canParse = false;
    // Adapted from https://gist.github.com/1129031
    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if (new Parser().parseFromString('', 'text/html')) {
            canParse = true;
        }
    }
    catch (e) { }
    return canParse;
}
function createHTMLParser() {
    var Parser = function () { };
    {
        if (shouldUseActiveX()) {
            Parser.prototype.parseFromString = function (string) {
                var doc = new window.ActiveXObject('htmlfile');
                doc.designMode = 'on'; // disable on-page scripts
                doc.open();
                doc.write(string);
                doc.close();
                return doc;
            };
        }
        else {
            Parser.prototype.parseFromString = function (string) {
                var doc = document.implementation.createHTMLDocument('');
                doc.open();
                doc.write(string);
                doc.close();
                return doc;
            };
        }
    }
    return Parser;
}
function shouldUseActiveX() {
    var useActiveX = false;
    try {
        document.implementation.createHTMLDocument('').open();
    }
    catch (e) {
        if (root.ActiveXObject)
            useActiveX = true;
    }
    return useActiveX;
}
var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
function RootNode(input, options) {
    var root;
    if (typeof input === 'string') {
        var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + '</x-turndown>', 'text/html');
        root = doc.getElementById('turndown-root');
    }
    else {
        root = input.cloneNode(true);
    }
    collapseWhitespace({
        element: root,
        isBlock: isBlock,
        isVoid: isVoid,
        isPre: options.preformattedCode ? isPreOrCode : null
    });
    return root;
}
var _htmlParser;
function htmlParser() {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser;
}
function isPreOrCode(node) {
    return node.nodeName === 'PRE' || node.nodeName === 'CODE';
}
function Node(node, options) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === 'CODE' || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node, options);
    return node;
}
function isBlank(node) {
    return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
}
function flankingWhitespace(node, options) {
    if (node.isBlock || options.preformattedCode && node.isCode) {
        return {
            leading: '',
            trailing: ''
        };
    }
    var edges = edgeWhitespace(node.textContent);
    // abandon leading ASCII WS if left-flanked by ASCII WS
    if (edges.leadingAscii && isFlankedByWhitespace('left', node, options)) {
        edges.leading = edges.leadingNonAscii;
    }
    // abandon trailing ASCII WS if right-flanked by ASCII WS
    if (edges.trailingAscii && isFlankedByWhitespace('right', node, options)) {
        edges.trailing = edges.trailingNonAscii;
    }
    return {
        leading: edges.leading,
        trailing: edges.trailing
    };
}
function edgeWhitespace(string) {
    var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
        leading: m[1],
        // whole string for whitespace-only strings
        leadingAscii: m[2],
        leadingNonAscii: m[3],
        trailing: m[4],
        // empty for whitespace-only strings
        trailingNonAscii: m[5],
        trailingAscii: m[6]
    };
}
function isFlankedByWhitespace(side, node, options) {
    var sibling;
    var regExp;
    var isFlanked;
    if (side === 'left') {
        sibling = node.previousSibling;
        regExp = / $/;
    }
    else {
        sibling = node.nextSibling;
        regExp = /^ /;
    }
    if (sibling) {
        if (sibling.nodeType === 3) {
            isFlanked = regExp.test(sibling.nodeValue);
        }
        else if (options.preformattedCode && sibling.nodeName === 'CODE') {
            isFlanked = false;
        }
        else if (sibling.nodeType === 1 && !isBlock(sibling)) {
            isFlanked = regExp.test(sibling.textContent);
        }
    }
    return isFlanked;
}
var reduce = Array.prototype.reduce;
function TurndownService(options) {
    if (!(this instanceof TurndownService))
        return new TurndownService(options);
    var defaults = {
        rules: rules,
        headingStyle: 'setext',
        hr: '* * *',
        bulletListMarker: '*',
        codeBlockStyle: 'indented',
        fence: '```',
        emDelimiter: '_',
        strongDelimiter: '**',
        linkStyle: 'inlined',
        linkReferenceStyle: 'full',
        br: '  ',
        preformattedCode: false,
        blankReplacement: function (content, node) {
            return node.isBlock ? '\n\n' : '';
        },
        keepReplacement: function (content, node) {
            return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML;
        },
        defaultReplacement: function (content, node) {
            return node.isBlock ? '\n\n' + content + '\n\n' : content;
        }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
}
TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */
    turndown: function (input) {
        if (!canConvert(input)) {
            throw new TypeError(input + ' is not a string, or an element/document/fragment node.');
        }
        if (input === '')
            return '';
        var output = process.call(this, new RootNode(input, this.options));
        return postProcess.call(this, output);
    },
    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */
    use: function (plugin) {
        if (Array.isArray(plugin)) {
            for (var i = 0; i < plugin.length; i++)
                this.use(plugin[i]);
        }
        else if (typeof plugin === 'function') {
            plugin(this);
        }
        else {
            throw new TypeError('plugin must be a Function or an Array of Functions');
        }
        return this;
    },
    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    addRule: function (key, rule) {
        this.rules.add(key, rule);
        return this;
    },
    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    keep: function (filter) {
        this.rules.keep(filter);
        return this;
    },
    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    remove: function (filter) {
        this.rules.remove(filter);
        return this;
    },
    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */
    escape: function (string) {
        return escapeMarkdown(string);
    }
};
/**
 * Reduces a DOM node down to its Markdown string equivalent
 * @private
 * @param {HTMLElement} parentNode The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */
function process(parentNode) {
    var self = this;
    return reduce.call(parentNode.childNodes, function (output, node) {
        node = new Node(node, self.options);
        var replacement = '';
        if (node.nodeType === 3) {
            replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
        }
        else if (node.nodeType === 1) {
            replacement = replacementForNode.call(self, node);
        }
        return join(output, replacement);
    }, '');
}
/**
 * Appends strings as each rule requires and trims the output
 * @private
 * @param {String} output The conversion output
 * @returns A trimmed version of the ouput
 * @type String
 */
function postProcess(output) {
    var self = this;
    this.rules.forEach(function (rule) {
        if (typeof rule.append === 'function') {
            output = join(output, rule.append(self.options));
        }
    });
    return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '');
}
/**
 * Converts an element node to its Markdown equivalent
 * @private
 * @param {HTMLElement} node The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */
function replacementForNode(node) {
    var rule = this.rules.forNode(node);
    var content = process.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing)
        content = content.trim();
    return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
}
/**
 * Joins replacement to the current output with appropriate number of new lines
 * @private
 * @param {String} output The current conversion output
 * @param {String} replacement The string to append to the output
 * @returns Joined output
 * @type String
 */
function join(output, replacement) {
    var s1 = trimTrailingNewlines(output);
    var s2 = trimLeadingNewlines(replacement);
    var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
    var separator = '\n\n'.substring(0, nls);
    return s1 + separator + s2;
}
/**
 * Determines whether an input can be converted
 * @private
 * @param {String|HTMLElement} input Describe this parameter
 * @returns Describe what it returns
 * @type String|Object|Array|Boolean|Number
 */
function canConvert(input) {
    return input != null && (typeof input === 'string' || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
}

},
2: (module, exports, __require) => {
// node_modules/marked/lib/marked.esm.js
"use strict";
/**
 * marked v18.0.7 - a markdown parser
 * Copyright (c) 2018-2026, MarkedJS. (MIT License)
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
 * https://github.com/markedjs/marked
 */
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkTokens = exports.use = exports.setOptions = exports.parser = exports.parseInline = exports.parse = exports.options = exports.lexer = exports.defaults = exports.Tokenizer = exports.TextRenderer = exports.Renderer = exports.Parser = exports.Marked = exports.Lexer = exports.Hooks = void 0;
exports.getDefaults = z;
exports.marked = g;
/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */
function z() { return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null }; }
var T = z();
exports.defaults = T;
function N(l) { exports.defaults = T = l; }
var _ = { exec: () => null };
function E(l) { let e = []; return t => { let n = Math.max(0, Math.min(3, t - 1)), s = e[n]; return s || (s = l(n), e[n] = s), s; }; }
function d(l, e = "") { let t = typeof l == "string" ? l : l.source, n = { replace: (s, r) => { let i = typeof r == "string" ? r : r.source; return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n; }, getRegex: () => new RegExp(t, e) }; return n; }
var Te = ((l = "") => { try {
    return !!new RegExp("(?<=1)(?<!1)" + l);
}
catch {
    return !1;
} })(), m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: l => new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: E(l => new RegExp(`^ {0,${l}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: E(l => new RegExp(`^ {0,${l}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)), fencesBeginRegex: E(l => new RegExp(`^ {0,${l}}(?:\`\`\`|~~~)`)), headingBeginRegex: E(l => new RegExp(`^ {0,${l}}#`)), htmlBeginRegex: E(l => new RegExp(`^ {0,${l}}<(?:[a-z].*>|!--)`, "i")), blockquoteBeginRegex: E(l => new RegExp(`^ {0,${l}}>`)) }, Oe = /^(?:[ \t]*(?:\n|$))+/, we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, B = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, j = / {0,3}(?:[*+-]|\d{1,9}[.)])/, oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, ae = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Se = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/, $e = /^[^\n]+/, U = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, Le = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", U).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), _e = d(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, j).getRegex(), H = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", K = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Me = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", K).replace("tag", H).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), le = l => d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", l).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex(), ze = le(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/), Ee = le(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/), Ce = d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ee).getRegex(), W = { blockquote: Ce, code: we, def: Le, fences: ye, heading: Pe, hr: B, html: Me, lheading: ae, list: _e, newline: Oe, paragraph: ze, table: _, text: $e }, se = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex(), Ae = { ...W, lheading: Se, table: se, paragraph: d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~~~)[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex() }, Ie = { ...W, html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", K).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: _, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: d(F).replace("hr", B).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, Be = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, qe = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ue = /^( {2,}|\\)\n(?!\s*$)/, De = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, C = /[\p{P}\p{S}]/u, Z = /[\s\p{P}\p{S}]/u, X = /[^\s\p{P}\p{S}]/u, ve = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Z).getRegex(), pe = /(?!~)[\p{P}\p{S}]/u, He = /(?!~)[\s\p{P}\p{S}]/u, Ze = /(?:[^\s\p{P}\p{S}]|~)/u, Ge = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/, Ne = d(ce, "u").replace(/punct/g, C).getRegex(), Qe = d(ce, "u").replace(/punct/g, pe).getRegex(), he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", je = d(he, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, C).getRegex(), Fe = d(he, "gu").replace(/notPunctSpace/g, Ze).replace(/punctSpace/g, He).replace(/punct/g, pe).getRegex(), Ue = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, C).getRegex(), Ke = d(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, C).getRegex(), We = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", Xe = d(We, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, C).getRegex(), Je = d(/\\(punct)/, "gu").replace(/punct/g, C).getRegex(), Ve = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ye = d(K).replace("(?:-->|$)", "-->").getRegex(), et = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ye).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), v = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/, tt = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", v).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), ke = d(/^!?\[(label)\]\[(ref)\]/).replace("label", v).replace("ref", U).getRegex(), de = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", U).getRegex(), nt = d("reflink|nolink(?!\\()", "g").replace("reflink", ke).replace("nolink", de).getRegex(), ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, J = { _backpedal: _, anyPunctuation: Je, autolink: Ve, blockSkip: Ge, br: ue, code: qe, del: _, delLDelim: _, delRDelim: _, emStrongLDelim: Ne, emStrongRDelimAst: je, emStrongRDelimUnd: Ue, escape: Be, link: tt, nolink: de, punctuation: ve, reflink: ke, reflinkSearch: nt, tag: et, text: De, url: _ }, rt = { ...J, link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", v).getRegex(), reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", v).getRegex() }, Q = { ...J, emStrongRDelimAst: Fe, emStrongLDelim: Qe, delLDelim: Ke, delRDelim: Xe, url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: d(/^(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex() }, st = { ...Q, br: d(ue).replace("{2,}", "*").getRegex(), text: d(Q.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, q = { normal: W, gfm: Ae, pedantic: Ie }, A = { normal: J, gfm: Q, breaks: st, pedantic: rt };
var it = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, ge = l => it[l];
function O(l, e) { if (e) {
    if (m.escapeTest.test(l))
        return l.replace(m.escapeReplace, ge);
}
else if (m.escapeTestNoEncode.test(l))
    return l.replace(m.escapeReplaceNoEncode, ge); return l; }
function V(l) { try {
    l = encodeURI(l).replace(m.percentDecode, "%");
}
catch {
    return null;
} return l; }
function Y(l, e) { let t = l.replace(m.findPipe, (r, i, o) => { let u = !1, a = i; for (; --a >= 0 && o[a] === "\\";)
    u = !u; return u ? "|" : " |"; }), n = t.split(m.splitPipe), s = 0; if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e)
    if (n.length > e)
        n.splice(e);
    else
        for (; n.length < e;)
            n.push(""); for (; s < n.length; s++)
    n[s] = n[s].trim().replace(m.slashPipe, "|"); return n; }
function $(l, e, t) { let n = l.length; if (n === 0)
    return ""; let s = 0; for (; s < n;) {
    let r = l.charAt(n - s - 1);
    if (r === e && !t)
        s++;
    else if (r !== e && t)
        s++;
    else
        break;
} return l.slice(0, n - s); }
function ee(l) {
    let e = l.split(`
`), t = e.length - 1;
    for (; t >= 0 && m.blankLine.test(e[t]);)
        t--;
    return e.length - t <= 2 ? l : e.slice(0, t + 1).join(`
`);
}
function fe(l, e) { if (l.indexOf(e[1]) === -1)
    return -1; let t = 0; for (let n = 0; n < l.length; n++)
    if (l[n] === "\\")
        n++;
    else if (l[n] === e[0])
        t++;
    else if (l[n] === e[1] && (t--, t < 0))
        return n; return t > 0 ? -2 : -1; }
function me(l, e = 0) { let t = e, n = ""; for (let s of l)
    if (s === "	") {
        let r = 4 - t % 4;
        n += " ".repeat(r), t += r;
    }
    else
        n += s, t++; return n; }
function xe(l, e, t, n, s) { let r = e.href, i = e.title || null, o = l[1].replace(s.other.outputLinkReplace, "$1"); n.state.inLink = !0; let u = { type: l[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: i, text: o, tokens: n.inlineTokens(o) }; return n.state.inLink = !1, u; }
function ot(l, e, t) {
    let n = l.match(t.other.indentCodeCompensation);
    if (n === null)
        return e;
    let s = n[1];
    return e.split(`
`).map(r => { let i = r.match(t.other.beginningSpace); if (i === null)
        return r; let [o] = i; return o.length >= s.length ? r.slice(s.length) : r; }).join(`
`);
}
var w = class {
    constructor(e) { this.options = e || T; }
    space(e) { let t = this.rules.block.newline.exec(e); if (t && t[0].length > 0)
        return { type: "space", raw: t[0] }; }
    code(e) { let t = this.rules.block.code.exec(e); if (t) {
        let n = this.options.pedantic ? t[0] : ee(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
        return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
    } }
    fences(e) { let t = this.rules.block.fences.exec(e); if (t) {
        let n = t[0], s = ot(n, t[3] || "", this.rules);
        return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
    } }
    heading(e) {
        let t = this.rules.block.heading.exec(e);
        if (t) {
            let n = t[2].trim();
            if (this.rules.other.endingHash.test(n)) {
                let s = $(n, "#");
                (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
            }
            return { type: "heading", raw: $(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
        }
    }
    hr(e) {
        let t = this.rules.block.hr.exec(e);
        if (t)
            return { type: "hr", raw: $(t[0], `
`) };
    }
    blockquote(e) {
        let t = this.rules.block.blockquote.exec(e);
        if (t) {
            let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
            for (; n.length > 0;) {
                let o = !1, u = [], a;
                for (a = 0; a < n.length; a++)
                    if (this.rules.other.blockquoteStart.test(n[a]))
                        u.push(n[a]), o = !0;
                    else if (!o)
                        u.push(n[a]);
                    else
                        break;
                n = n.slice(a);
                let p = u.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
                s = s ? `${s}
${p}` : p, r = r ? `${r}
${c}` : c;
                let h = this.lexer.state.top;
                if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = h, n.length === 0)
                    break;
                let k = i.at(-1);
                if (k?.type === "code")
                    break;
                if (k?.type === "blockquote") {
                    let R = k, f = R.raw + `
` + n.join(`
`), S = this.blockquote(f);
                    i[i.length - 1] = S, s = s.substring(0, s.length - R.raw.length) + S.raw, r = r.substring(0, r.length - R.text.length) + S.text;
                    break;
                }
                else if (k?.type === "list") {
                    let R = k, f = R.raw + `
` + n.join(`
`), S = this.list(f);
                    i[i.length - 1] = S, s = s.substring(0, s.length - k.raw.length) + S.raw, r = r.substring(0, r.length - R.raw.length) + S.raw, n = f.substring(i.at(-1).raw.length).split(`
`);
                    continue;
                }
            }
            return { type: "blockquote", raw: s, tokens: i, text: r };
        }
    }
    list(e) {
        let t = this.rules.block.list.exec(e);
        if (t) {
            let n = t[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: !1, items: [] };
            n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
            let i = this.rules.other.listItemRegex(n), o = !1;
            for (; e;) {
                let a = !1, p = "", c = "";
                if (!(t = i.exec(e)) || this.rules.block.hr.test(e))
                    break;
                p = t[0], e = e.substring(p.length);
                let h = me(t[2].split(`
`, 1)[0], t[1].length), k = e.split(`
`, 1)[0], R = !h.trim(), f = 0;
                if (this.options.pedantic ? (f = 2, c = h.trimStart()) : R ? f = t[1].length + 1 : (f = h.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = h.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(k) && (p += k + `
`, e = e.substring(k.length + 1), a = !0), !a) {
                    let S = this.rules.other.nextBulletRegex(f), te = this.rules.other.hrRegex(f), ne = this.rules.other.fencesBeginRegex(f), re = this.rules.other.headingBeginRegex(f), be = this.rules.other.htmlBeginRegex(f), Re = this.rules.other.blockquoteBeginRegex(f);
                    for (; e;) {
                        let G = e.split(`
`, 1)[0], I;
                        if (k = G, this.options.pedantic ? (k = k.replace(this.rules.other.listReplaceNesting, "  "), I = k) : I = k.replace(this.rules.other.tabCharGlobal, "    "), ne.test(k) || re.test(k) || be.test(k) || Re.test(k) || S.test(k) || te.test(k))
                            break;
                        if (I.search(this.rules.other.nonSpaceChar) >= f || !k.trim())
                            c += `
` + I.slice(f);
                        else {
                            if (R || h.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne.test(h) || re.test(h) || te.test(h))
                                break;
                            c += `
` + k;
                        }
                        R = !k.trim(), p += G + `
`, e = e.substring(G.length + 1), h = I.slice(f);
                    }
                }
                r.loose || (o ? r.loose = !0 : this.rules.other.doubleBlankLine.test(p) && (o = !0)), r.items.push({ type: "list_item", raw: p, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: !1, text: c, tokens: [] }), r.raw += p;
            }
            let u = r.items.at(-1);
            if (u)
                u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
            else
                return;
            r.raw = r.raw.trimEnd();
            for (let a of r.items) {
                this.lexer.state.top = !1, a.tokens = this.lexer.blockTokens(a.text, []);
                let p = a.tokens[0];
                if (a.task && (p?.type === "text" || p?.type === "paragraph")) {
                    a.text = a.text.replace(this.rules.other.listReplaceTask, ""), p.raw = p.raw.replace(this.rules.other.listReplaceTask, ""), p.text = p.text.replace(this.rules.other.listReplaceTask, "");
                    for (let h = this.lexer.inlineQueue.length - 1; h >= 0; h--)
                        if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[h].src)) {
                            this.lexer.inlineQueue[h].src = this.lexer.inlineQueue[h].src.replace(this.rules.other.listReplaceTask, "");
                            break;
                        }
                    let c = this.rules.other.listTaskCheckbox.exec(a.raw);
                    if (c) {
                        let h = { type: "checkbox", raw: c[0] + " ", checked: c[0] !== "[ ]" };
                        a.checked = h.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = h.raw + a.tokens[0].raw, a.tokens[0].text = h.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(h)) : a.tokens.unshift({ type: "paragraph", raw: h.raw, text: h.raw, tokens: [h] }) : a.tokens.unshift(h);
                    }
                }
                else
                    a.task && (a.task = !1);
                if (!r.loose) {
                    let c = a.tokens.filter(k => k.type === "space"), h = c.length > 0 && c.some(k => this.rules.other.anyLine.test(k.raw));
                    r.loose = h;
                }
            }
            if (r.loose)
                for (let a of r.items) {
                    a.loose = !0;
                    for (let p of a.tokens)
                        p.type === "text" && (p.type = "paragraph");
                }
            return r;
        }
    }
    html(e) { let t = this.rules.block.html.exec(e); if (t) {
        let n = ee(t[0]);
        return { type: "html", block: !0, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
    } }
    def(e) {
        let t = this.rules.block.def.exec(e);
        if (t) {
            let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
            return { type: "def", tag: n, raw: $(t[0], `
`), href: s, title: r };
        }
    }
    table(e) {
        let t = this.rules.block.table.exec(e);
        if (!t || !this.rules.other.tableDelimiter.test(t[2]))
            return;
        let n = Y(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: $(t[0], `
`), header: [], align: [], rows: [] };
        if (n.length === s.length) {
            for (let o of s)
                this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
            for (let o = 0; o < n.length; o++)
                i.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: !0, align: i.align[o] });
            for (let o of r)
                i.rows.push(Y(o, i.header.length).map((u, a) => ({ text: u, tokens: this.lexer.inline(u), header: !1, align: i.align[a] })));
            return i;
        }
    }
    lheading(e) {
        let t = this.rules.block.lheading.exec(e);
        if (t) {
            let n = t[1].trim();
            return { type: "heading", raw: $(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
        }
    }
    paragraph(e) {
        let t = this.rules.block.paragraph.exec(e);
        if (t) {
            let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
            return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
        }
    }
    text(e) { let t = this.rules.block.text.exec(e); if (t)
        return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) }; }
    escape(e) { let t = this.rules.inline.escape.exec(e); if (t)
        return { type: "escape", raw: t[0], text: t[1] }; }
    tag(e) { let t = this.rules.inline.tag.exec(e); if (t)
        return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: t[0] }; }
    link(e) { let t = this.rules.inline.link.exec(e); if (t) {
        let n = t[2].trim();
        if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
            if (!this.rules.other.endAngleBracket.test(n))
                return;
            let i = $(n.slice(0, -1), "\\");
            if ((n.length - i.length) % 2 === 0)
                return;
        }
        else {
            let i = fe(t[2], "()");
            if (i === -2)
                return;
            if (i > -1) {
                let u = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
                t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, u).trim(), t[3] = "";
            }
        }
        let s = t[2], r = "";
        if (this.options.pedantic) {
            let i = this.rules.other.pedanticHrefTitle.exec(s);
            i && (s = i[1], r = i[3]);
        }
        else
            r = t[3] ? t[3].slice(1, -1) : "";
        return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, { href: s && s.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    } }
    reflink(e, t) { let n; if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
        let s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = t[s.toLowerCase()];
        if (!r) {
            let i = n[0].charAt(0);
            return { type: "text", raw: i, text: i };
        }
        return xe(n, r, n[0], this.lexer, this.rules);
    } }
    emStrong(e, t, n = "") { let s = this.rules.inline.emStrongLDelim.exec(e); if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric))
        return; if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let i = [...s[0]].length - 1, o, u, a = i, p = 0, c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        for (c.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = c.exec(t)) !== null;) {
            if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o)
                continue;
            if (u = [...o].length, s[3] || s[4]) {
                a += u;
                continue;
            }
            else if ((s[5] || s[6]) && i % 3 && !((i + u) % 3)) {
                p += u;
                continue;
            }
            if (a -= u, a > 0)
                continue;
            u = Math.min(u, u + a + p);
            let h = [...s[0]][0].length, k = e.slice(0, i + s.index + h + u);
            if (Math.min(i, u) % 2) {
                let f = k.slice(1, -1);
                return { type: "em", raw: k, text: f, tokens: this.lexer.inlineTokens(f) };
            }
            let R = k.slice(2, -2);
            return { type: "strong", raw: k, text: R, tokens: this.lexer.inlineTokens(R) };
        }
    } }
    codespan(e) { let t = this.rules.inline.code.exec(e); if (t) {
        let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
        return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    } }
    br(e) { let t = this.rules.inline.br.exec(e); if (t)
        return { type: "br", raw: t[0] }; }
    del(e, t, n = "") { let s = this.rules.inline.delLDelim.exec(e); if (!s)
        return; if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let i = [...s[0]].length - 1, o, u, a = i, p = this.rules.inline.delRDelim;
        for (p.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = p.exec(t)) !== null;) {
            if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (u = [...o].length, u !== i))
                continue;
            if (s[3] || s[4]) {
                a += u;
                continue;
            }
            if (a -= u, a > 0)
                continue;
            u = Math.min(u, u + a);
            let c = [...s[0]][0].length, h = e.slice(0, i + s.index + c + u), k = h.slice(i, -i);
            return { type: "del", raw: h, text: k, tokens: this.lexer.inlineTokens(k) };
        }
    } }
    autolink(e) { let t = this.rules.inline.autolink.exec(e); if (t) {
        let n, s;
        return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    } }
    url(e) { let t; if (t = this.rules.inline.url.exec(e)) {
        let n, s;
        if (t[2] === "@")
            n = t[0], s = "mailto:" + n;
        else {
            let r;
            do
                r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
            while (r !== t[0]);
            n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
        }
        return { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    } }
    inlineText(e) { let t = this.rules.inline.text.exec(e); if (t) {
        let n = this.lexer.state.inRawBlock;
        return { type: "text", raw: t[0], text: t[0], escaped: n };
    } }
};
exports.Tokenizer = w;
var x = class l {
    constructor(e) { this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new w, this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 }; let t = { other: m, block: q.normal, inline: A.normal }; this.options.pedantic ? (t.block = q.pedantic, t.inline = A.pedantic) : this.options.gfm && (t.block = q.gfm, this.options.breaks ? t.inline = A.breaks : t.inline = A.gfm), this.tokenizer.rules = t; }
    static get rules() { return { block: q, inline: A }; }
    static lex(e, t) { return new l(t).lex(e); }
    static lexInline(e, t) { return new l(t).inlineTokens(e); }
    lex(e) {
        e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
        for (let t = 0; t < this.inlineQueue.length; t++) {
            let n = this.inlineQueue[t];
            this.inlineTokens(n.src, n.tokens);
        }
        return this.inlineQueue = [], this.tokens;
    }
    blockTokens(e, t = [], n = !1) {
        this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
        let s = 1 / 0;
        for (; e;) {
            if (e.length < s)
                s = e.length;
            else {
                this.infiniteLoopError(e.charCodeAt(0));
                break;
            }
            let r;
            if (this.options.extensions?.block?.some(o => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1))
                continue;
            if (r = this.tokenizer.space(e)) {
                e = e.substring(r.raw.length);
                let o = t.at(-1);
                r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
                continue;
            }
            if (r = this.tokenizer.code(e)) {
                e = e.substring(r.raw.length);
                let o = t.at(-1);
                o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
                continue;
            }
            if (r = this.tokenizer.fences(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.heading(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.hr(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.blockquote(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.list(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.html(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.def(e)) {
                e = e.substring(r.raw.length);
                let o = t.at(-1);
                o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
                continue;
            }
            if (r = this.tokenizer.table(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            if (r = this.tokenizer.lheading(e)) {
                e = e.substring(r.raw.length), t.push(r);
                continue;
            }
            let i = e;
            if (this.options.extensions?.startBlock) {
                let o = 1 / 0, u = e.slice(1), a;
                this.options.extensions.startBlock.forEach(p => { a = p.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (o = Math.min(o, a)); }), o < 1 / 0 && o >= 0 && (i = e.substring(0, o + 1));
            }
            if (this.state.top && (r = this.tokenizer.paragraph(i))) {
                let o = t.at(-1);
                n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
                continue;
            }
            if (r = this.tokenizer.text(e)) {
                e = e.substring(r.raw.length);
                let o = t.at(-1);
                o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
                continue;
            }
            if (e) {
                this.infiniteLoopError(e.charCodeAt(0));
                break;
            }
        }
        return this.state.top = !0, t;
    }
    inline(e, t = []) { return this.inlineQueue.push({ src: e, tokens: t }), t; }
    inlineTokens(e, t = []) { this.tokenizer.lexer = this; let n = e; if (this.tokens.links) {
        let o = Object.keys(this.tokens.links);
        o.length > 0 && (n = n.replace(this.tokenizer.rules.inline.reflinkSearch, u => o.includes(u.slice(u.lastIndexOf("[") + 1, -1)) ? "[" + "a".repeat(u.length - 2) + "]" : u));
    } n = n.replace(this.tokenizer.rules.inline.anyPunctuation, "++"), n = n.replace(this.tokenizer.rules.inline.blockSkip, (o, u, a) => { let p = a ? a.length : 0; return o.slice(0, p) + "[" + "a".repeat(o.length - p - 2) + "]"; }), n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n; let s = !1, r = "", i = 1 / 0; for (; e;) {
        if (e.length < i)
            i = e.length;
        else {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
        }
        s || (r = ""), s = !1;
        let o;
        if (this.options.extensions?.inline?.some(a => (o = a.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1))
            continue;
        if (o = this.tokenizer.escape(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.tag(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.link(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.reflink(e, this.tokens.links)) {
            e = e.substring(o.raw.length);
            let a = t.at(-1);
            o.type === "text" && a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
            continue;
        }
        if (o = this.tokenizer.emStrong(e, n, r)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.codespan(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.br(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.del(e, n, r)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (o = this.tokenizer.autolink(e)) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        if (!this.state.inLink && (o = this.tokenizer.url(e))) {
            e = e.substring(o.raw.length), t.push(o);
            continue;
        }
        let u = e;
        if (this.options.extensions?.startInline) {
            let a = 1 / 0, p = e.slice(1), c;
            this.options.extensions.startInline.forEach(h => { c = h.call({ lexer: this }, p), typeof c == "number" && c >= 0 && (a = Math.min(a, c)); }), a < 1 / 0 && a >= 0 && (u = e.substring(0, a + 1));
        }
        if (o = this.tokenizer.inlineText(u)) {
            e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (r = o.raw.slice(-1)), s = !0;
            let a = t.at(-1);
            a?.type === "text" ? (a.raw += o.raw, a.text += o.text) : t.push(o);
            continue;
        }
        if (e) {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
        }
    } return t; }
    infiniteLoopError(e) { let t = "Infinite loop on byte: " + e; if (this.options.silent)
        console.error(t);
    else
        throw new Error(t); }
};
exports.Lexer = x;
var y = class {
    constructor(e) { this.options = e || T; }
    space(e) { return ""; }
    code({ text: e, lang: t, escaped: n }) {
        let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
        return s ? '<pre><code class="language-' + O(s) + '">' + (n ? r : O(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, !0)) + `</code></pre>
`;
    }
    blockquote({ tokens: e }) {
        return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
    }
    html({ text: e }) { return e; }
    def(e) { return ""; }
    heading({ tokens: e, depth: t }) {
        return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
    }
    hr(e) {
        return `<hr>
`;
    }
    list(e) {
        let t = e.ordered, n = e.start, s = "";
        for (let o = 0; o < e.items.length; o++) {
            let u = e.items[o];
            s += this.listitem(u);
        }
        let r = t ? "ol" : "ul", i = t && n !== 1 ? ' start="' + n + '"' : "";
        return "<" + r + i + `>
` + s + "</" + r + `>
`;
    }
    listitem(e) {
        return `<li>${this.parser.parse(e.tokens)}</li>
`;
    }
    checkbox({ checked: e }) { return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> '; }
    paragraph({ tokens: e }) {
        return `<p>${this.parser.parseInline(e)}</p>
`;
    }
    table(e) {
        let t = "", n = "";
        for (let r = 0; r < e.header.length; r++)
            n += this.tablecell(e.header[r]);
        t += this.tablerow({ text: n });
        let s = "";
        for (let r = 0; r < e.rows.length; r++) {
            let i = e.rows[r];
            n = "";
            for (let o = 0; o < i.length; o++)
                n += this.tablecell(i[o]);
            s += this.tablerow({ text: n });
        }
        return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
    }
    tablerow({ text: e }) {
        return `<tr>
${e}</tr>
`;
    }
    tablecell(e) {
        let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
        return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
    }
    strong({ tokens: e }) { return `<strong>${this.parser.parseInline(e)}</strong>`; }
    em({ tokens: e }) { return `<em>${this.parser.parseInline(e)}</em>`; }
    codespan({ text: e }) { return `<code>${O(e, !0)}</code>`; }
    br(e) { return "<br>"; }
    del({ tokens: e }) { return `<del>${this.parser.parseInline(e)}</del>`; }
    link({ href: e, title: t, tokens: n }) { let s = this.parser.parseInline(n), r = V(e); if (r === null)
        return s; e = r; let i = '<a href="' + e + '"'; return t && (i += ' title="' + O(t) + '"'), i += ">" + s + "</a>", i; }
    image({ href: e, title: t, text: n, tokens: s }) { s && (n = this.parser.parseInline(s, this.parser.textRenderer)); let r = V(e); if (r === null)
        return O(n); e = r; let i = `<img src="${e}" alt="${O(n)}"`; return t && (i += ` title="${O(t)}"`), i += ">", i; }
    text(e) { return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text); }
};
exports.Renderer = y;
var L = class {
    strong({ text: e }) { return e; }
    em({ text: e }) { return e; }
    codespan({ text: e }) { return e; }
    del({ text: e }) { return e; }
    html({ text: e }) { return e; }
    text({ text: e }) { return e; }
    link({ text: e }) { return "" + e; }
    image({ text: e }) { return "" + e; }
    br() { return ""; }
    checkbox({ raw: e }) { return e; }
};
exports.TextRenderer = L;
var b = class l {
    constructor(e) { this.options = e || T, this.options.renderer = this.options.renderer || new y, this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L; }
    static parse(e, t) { return new l(t).parse(e); }
    static parseInline(e, t) { return new l(t).parseInline(e); }
    parse(e) { this.renderer.parser = this; let t = ""; for (let n = 0; n < e.length; n++) {
        let s = e[n];
        if (this.options.extensions?.renderers?.[s.type]) {
            let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
            if (o !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(i.type)) {
                t += o || "";
                continue;
            }
        }
        let r = s;
        switch (r.type) {
            case "space": {
                t += this.renderer.space(r);
                break;
            }
            case "hr": {
                t += this.renderer.hr(r);
                break;
            }
            case "heading": {
                t += this.renderer.heading(r);
                break;
            }
            case "code": {
                t += this.renderer.code(r);
                break;
            }
            case "table": {
                t += this.renderer.table(r);
                break;
            }
            case "blockquote": {
                t += this.renderer.blockquote(r);
                break;
            }
            case "list": {
                t += this.renderer.list(r);
                break;
            }
            case "checkbox": {
                t += this.renderer.checkbox(r);
                break;
            }
            case "html": {
                t += this.renderer.html(r);
                break;
            }
            case "def": {
                t += this.renderer.def(r);
                break;
            }
            case "paragraph": {
                t += this.renderer.paragraph(r);
                break;
            }
            case "text": {
                t += this.renderer.text(r);
                break;
            }
            default: {
                let i = 'Token with "' + r.type + '" type was not found.';
                if (this.options.silent)
                    return console.error(i), "";
                throw new Error(i);
            }
        }
    } return t; }
    parseInline(e, t = this.renderer) { this.renderer.parser = this; let n = ""; for (let s = 0; s < e.length; s++) {
        let r = e[s];
        if (this.options.extensions?.renderers?.[r.type]) {
            let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
            if (o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
                n += o || "";
                continue;
            }
        }
        let i = r;
        switch (i.type) {
            case "escape": {
                n += t.text(i);
                break;
            }
            case "html": {
                n += t.html(i);
                break;
            }
            case "link": {
                n += t.link(i);
                break;
            }
            case "image": {
                n += t.image(i);
                break;
            }
            case "checkbox": {
                n += t.checkbox(i);
                break;
            }
            case "strong": {
                n += t.strong(i);
                break;
            }
            case "em": {
                n += t.em(i);
                break;
            }
            case "codespan": {
                n += t.codespan(i);
                break;
            }
            case "br": {
                n += t.br(i);
                break;
            }
            case "del": {
                n += t.del(i);
                break;
            }
            case "text": {
                n += t.text(i);
                break;
            }
            default: {
                let o = 'Token with "' + i.type + '" type was not found.';
                if (this.options.silent)
                    return console.error(o), "";
                throw new Error(o);
            }
        }
    } return n; }
};
exports.Parser = b;
var P = (_a = class {
        constructor(e) { this.options = e || T; }
        preprocess(e) { return e; }
        postprocess(e) { return e; }
        processAllTokens(e) { return e; }
        emStrongMask(e) { return e; }
        provideLexer(e = this.block) { return e ? x.lex : x.lexInline; }
        provideParser(e = this.block) { return e ? b.parse : b.parseInline; }
    },
    __setFunctionName(_a, "P"),
    _a.passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]),
    _a.passThroughHooksRespectAsync = new Set(["preprocess", "postprocess", "processAllTokens"]),
    _a);
exports.Hooks = P;
var D = class {
    constructor(...e) {
        this.defaults = z();
        this.options = this.setOptions;
        this.parse = this.parseMarkdown(!0);
        this.parseInline = this.parseMarkdown(!1);
        this.Parser = b;
        this.Renderer = y;
        this.TextRenderer = L;
        this.Lexer = x;
        this.Tokenizer = w;
        this.Hooks = P;
        this.use(...e);
    }
    walkTokens(e, t) { let n = []; for (let s of e)
        switch (n = n.concat(t.call(this, s)), s.type) {
            case "table": {
                let r = s;
                for (let i of r.header)
                    n = n.concat(this.walkTokens(i.tokens, t));
                for (let i of r.rows)
                    for (let o of i)
                        n = n.concat(this.walkTokens(o.tokens, t));
                break;
            }
            case "list": {
                let r = s;
                n = n.concat(this.walkTokens(r.items, t));
                break;
            }
            default: {
                let r = s;
                this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach(i => { let o = r[i].flat(1 / 0); n = n.concat(this.walkTokens(o, t)); }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
            }
        } return n; }
    use(...e) { let t = this.defaults.extensions || { renderers: {}, childTokens: {} }; return e.forEach(n => { let s = { ...n }; if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach(r => { if (!r.name)
        throw new Error("extension name required"); if ("renderer" in r) {
        let i = t.renderers[r.name];
        i ? t.renderers[r.name] = function (...o) { let u = r.renderer.apply(this, o); return u === !1 && (u = i.apply(this, o)), u; } : t.renderers[r.name] = r.renderer;
    } if ("tokenizer" in r) {
        if (!r.level || r.level !== "block" && r.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
        let i = t[r.level];
        i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
    } "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens); }), s.extensions = t), n.renderer) {
        let r = this.defaults.renderer || new y(this.defaults);
        for (let i in n.renderer) {
            if (!(i in r))
                throw new Error(`renderer '${i}' does not exist`);
            if (["options", "parser"].includes(i))
                continue;
            let o = i, u = n.renderer[o], a = r[o];
            r[o] = (...p) => { let c = u.apply(r, p); return c === !1 && (c = a.apply(r, p)), c || ""; };
        }
        s.renderer = r;
    } if (n.tokenizer) {
        let r = this.defaults.tokenizer || new w(this.defaults);
        for (let i in n.tokenizer) {
            if (!(i in r))
                throw new Error(`tokenizer '${i}' does not exist`);
            if (["options", "rules", "lexer"].includes(i))
                continue;
            let o = i, u = n.tokenizer[o], a = r[o];
            r[o] = (...p) => { let c = u.apply(r, p); return c === !1 && (c = a.apply(r, p)), c; };
        }
        s.tokenizer = r;
    } if (n.hooks) {
        let r = this.defaults.hooks || new P;
        for (let i in n.hooks) {
            if (!(i in r))
                throw new Error(`hook '${i}' does not exist`);
            if (["options", "block"].includes(i))
                continue;
            let o = i, u = n.hooks[o], a = r[o];
            P.passThroughHooks.has(i) ? r[o] = p => { if (this.defaults.async && P.passThroughHooksRespectAsync.has(i))
                return (async () => { let h = await u.call(r, p); return a.call(r, h); })(); let c = u.call(r, p); return a.call(r, c); } : r[o] = (...p) => { if (this.defaults.async)
                return (async () => { let h = await u.apply(r, p); return h === !1 && (h = await a.apply(r, p)), h; })(); let c = u.apply(r, p); return c === !1 && (c = a.apply(r, p)), c; };
        }
        s.hooks = r;
    } if (n.walkTokens) {
        let r = this.defaults.walkTokens, i = n.walkTokens;
        s.walkTokens = function (o) { let u = []; return u.push(i.call(this, o)), r && (u = u.concat(r.call(this, o))), u; };
    } this.defaults = { ...this.defaults, ...s }; }), this; }
    setOptions(e) { return this.defaults = { ...this.defaults, ...e }, this; }
    lexer(e, t) { return x.lex(e, t ?? this.defaults); }
    parser(e, t) { return b.parse(e, t ?? this.defaults); }
    parseMarkdown(e) { return (n, s) => { let r = { ...s }, i = { ...this.defaults, ...r }, o = this.onError(!!i.silent, !!i.async); if (this.defaults.async === !0 && r.async === !1)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.")); if (typeof n > "u" || n === null)
        return o(new Error("marked(): input parameter is undefined or null")); if (typeof n != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected")); if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async)
        return (async () => { let u = i.hooks ? await i.hooks.preprocess(n) : n, p = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(u, i), c = i.hooks ? await i.hooks.processAllTokens(p) : p; i.walkTokens && await Promise.all(this.walkTokens(c, i.walkTokens)); let k = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(c, i); return i.hooks ? await i.hooks.postprocess(k) : k; })().catch(o); try {
        i.hooks && (n = i.hooks.preprocess(n));
        let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
        i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
        let c = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
        return i.hooks && (c = i.hooks.postprocess(c)), c;
    }
    catch (u) {
        return o(u);
    } }; }
    onError(e, t) {
        return n => {
            if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
                let s = "<p>An error occurred:</p><pre>" + O(n.message + "", !0) + "</pre>";
                return t ? Promise.resolve(s) : s;
            }
            if (t)
                return Promise.reject(n);
            throw n;
        };
    }
};
exports.Marked = D;
var M = new D;
function g(l, e) { return M.parse(l, e); }
g.options = g.setOptions = function (l) { return M.setOptions(l), g.defaults = M.defaults, N(g.defaults), g; };
g.getDefaults = z;
g.defaults = T;
g.use = function (...l) { return M.use(...l), g.defaults = M.defaults, N(g.defaults), g; };
g.walkTokens = function (l, e) { return M.walkTokens(l, e); };
g.parseInline = M.parseInline;
g.Parser = b;
g.parser = b.parse;
g.Renderer = y;
g.TextRenderer = L;
g.Lexer = x;
g.lexer = x.lex;
g.Tokenizer = w;
g.Hooks = P;
g.parse = g;
var Kt = g.options, Wt = g.setOptions, Xt = g.use, Jt = g.walkTokens, Vt = g.parseInline, Yt = g, en = b.parse, tn = x.lex;
exports.options = Kt;
exports.setOptions = Wt;
exports.use = Xt;
exports.walkTokens = Jt;
exports.parseInline = Vt;
exports.parse = Yt;
exports.parser = en;
exports.lexer = tn;
//# sourceMappingURL=marked.esm.js.map

},
3: (module, exports, __require) => {
// node_modules/dompurify/dist/purify.es.mjs
"use strict";
/*! @license DOMPurify 3.4.12 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.12/LICENSE */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++)
        n[e] = r[e];
    return n;
}
function _arrayWithHoles(r) {
    if (Array.isArray(r))
        return r;
}
function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
        var e, n, i, u, a = [], f = true, o = false;
        try {
            if (i = (t = t.call(r)).next, 0 === l)
                ;
            else
                for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0)
                    ;
        }
        catch (r) {
            o = true, n = r;
        }
        finally {
            try {
                if (!f && null != t.return && (u = t.return(), Object(u) !== u))
                    return;
            }
            finally {
                if (o)
                    throw n;
            }
        }
        return a;
    }
}
function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
    if (r) {
        if ("string" == typeof r)
            return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
}
const entries = Object.entries, setPrototypeOf = Object.setPrototypeOf, isFrozen = Object.isFrozen, getPrototypeOf = Object.getPrototypeOf, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
let freeze = Object.freeze, seal = Object.seal, create = Object.create; // eslint-disable-line import/no-mutable-exports
let _ref = typeof Reflect !== 'undefined' && Reflect, apply = _ref.apply, construct = _ref.construct;
if (!freeze) {
    freeze = function freeze(x) {
        return x;
    };
}
if (!seal) {
    seal = function seal(x) {
        return x;
    };
}
if (!apply) {
    apply = function apply(func, thisArg) {
        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
        }
        return func.apply(thisArg, args);
    };
}
if (!construct) {
    construct = function construct(Func) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }
        return new Func(...args);
    };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const arrayIsArray = Array.isArray;
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const numberToString = unapply(Number.prototype.toString);
const booleanToString = unapply(Boolean.prototype.toString);
const bigintToString = typeof BigInt === 'undefined' ? null : unapply(BigInt.prototype.toString);
const symbolToString = typeof Symbol === 'undefined' ? null : unapply(Symbol.prototype.toString);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const objectToString = unapply(Object.prototype.toString);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
/**
 * Creates a new function that calls the given function with a specified thisArg and arguments.
 *
 * @param func - The function to be wrapped and called.
 * @returns A new function that calls the given function with a specified thisArg and arguments.
 */
function unapply(func) {
    return function (thisArg) {
        if (thisArg instanceof RegExp) {
            thisArg.lastIndex = 0;
        }
        for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            args[_key3 - 1] = arguments[_key3];
        }
        return apply(func, thisArg, args);
    };
}
/**
 * Creates a new function that constructs an instance of the given constructor function with the provided arguments.
 *
 * @param func - The constructor function to be wrapped and called.
 * @returns A new function that constructs an instance of the given constructor function with the provided arguments.
 */
function unconstruct(Func) {
    return function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
        }
        return construct(Func, args);
    };
}
/**
 * Add properties to a lookup table
 *
 * @param set - The set to which elements will be added.
 * @param array - The array containing elements to be added to the set.
 * @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
 * @returns The modified set with added elements.
 */
function addToSet(set, array) {
    let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
    if (setPrototypeOf) {
        // Make 'in' and truthy checks like Boolean(set.constructor)
        // independent of any properties defined on Object.prototype.
        // Prevent prototype setters from intercepting set as a this value.
        setPrototypeOf(set, null);
    }
    if (!arrayIsArray(array)) {
        return set;
    }
    let l = array.length;
    while (l--) {
        let element = array[l];
        if (typeof element === 'string') {
            const lcElement = transformCaseFunc(element);
            if (lcElement !== element) {
                // Config presets (e.g. tags.js, attrs.js) are immutable.
                if (!isFrozen(array)) {
                    array[l] = lcElement;
                }
                element = lcElement;
            }
        }
        set[element] = true;
    }
    return set;
}
/**
 * Clean up an array to harden against CSPP
 *
 * @param array - The array to be cleaned.
 * @returns The cleaned version of the array
 */
function cleanArray(array) {
    for (let index = 0; index < array.length; index++) {
        const isPropertyExist = objectHasOwnProperty(array, index);
        if (!isPropertyExist) {
            array[index] = null;
        }
    }
    return array;
}
/**
 * Shallow clone an object
 *
 * @param object - The object to be cloned.
 * @returns A new object that copies the original.
 */
function clone(object) {
    const newObject = create(null);
    for (const _ref2 of entries(object)) {
        var _ref3 = _slicedToArray(_ref2, 2);
        const property = _ref3[0];
        const value = _ref3[1];
        const isPropertyExist = objectHasOwnProperty(object, property);
        if (isPropertyExist) {
            if (arrayIsArray(value)) {
                newObject[property] = cleanArray(value);
            }
            else if (value && typeof value === 'object' && value.constructor === Object) {
                newObject[property] = clone(value);
            }
            else {
                newObject[property] = value;
            }
        }
    }
    return newObject;
}
/**
 * Convert non-node values into strings without depending on direct property access.
 *
 * @param value - The value to stringify.
 * @returns A string representation of the provided value.
 */
function stringifyValue(value) {
    switch (typeof value) {
        case 'string':
            {
                return value;
            }
        case 'number':
            {
                return numberToString(value);
            }
        case 'boolean':
            {
                return booleanToString(value);
            }
        case 'bigint':
            {
                return bigintToString ? bigintToString(value) : '0';
            }
        case 'symbol':
            {
                return symbolToString ? symbolToString(value) : 'Symbol()';
            }
        case 'undefined':
            {
                return objectToString(value);
            }
        case 'function':
        case 'object':
            {
                if (value === null) {
                    return objectToString(value);
                }
                const valueAsRecord = value;
                const valueToString = lookupGetter(valueAsRecord, 'toString');
                if (typeof valueToString === 'function') {
                    const stringified = valueToString(valueAsRecord);
                    return typeof stringified === 'string' ? stringified : objectToString(stringified);
                }
                return objectToString(value);
            }
        default:
            {
                return objectToString(value);
            }
    }
}
/**
 * This method automatically checks if the prop is function or getter and behaves accordingly.
 *
 * @param object - The object to look up the getter function in its prototype chain.
 * @param prop - The property name for which to find the getter function.
 * @returns The getter function found in the prototype chain or a fallback function.
 */
function lookupGetter(object, prop) {
    while (object !== null) {
        const desc = getOwnPropertyDescriptor(object, prop);
        if (desc) {
            if (desc.get) {
                return unapply(desc.get);
            }
            if (typeof desc.value === 'function') {
                return unapply(desc.value);
            }
        }
        object = getPrototypeOf(object);
    }
    function fallbackValue() {
        return null;
    }
    return fallbackValue;
}
function isRegex(value) {
    try {
        regExpTest(value, '');
        return true;
    }
    catch (_unused) {
        return false;
    }
}
const html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);
const svg$1 = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'enterkeyhint', 'exportparts', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'inputmode', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'part', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);
const svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);
// List of SVG elements that are disallowed by default.
// We still need to know them so that we can do namespace
// checks properly in case one wants to add them to
// allow-list.
const svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);
const mathMl$1 = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'mprescripts']);
// Similarly to SVG, we want to know all MathML elements,
// even those that we disallow by default.
const mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);
const text = freeze(['#text']);
const html = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'command', 'commandfor', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'exportparts', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inert', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'nonce', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'part', 'pattern', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'popovertargetaction', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'slot', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'wrap', 'xmlns']);
const svg = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'amplitude', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dominant-baseline', 'dur', 'edgemode', 'elevation', 'end', 'exponent', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'mask-type', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'slope', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'tablevalues', 'targetx', 'targety', 'transform', 'transform-origin', 'text-anchor', 'text-decoration', 'text-orientation', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);
const mathMl = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnalign', 'columnlines', 'columnspacing', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lquote', 'lspace', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);
const xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);
const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
// Markup-significant character probes used by _sanitizeElements.
// Shared module-level instances are safe despite the sticky /g flags:
// unapply() resets lastIndex for RegExp receivers before every call.
const ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
const COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
const FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
const SELF_CLOSING_TAG = seal(/\/>/i);
// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const NODE_TYPE = {
    element: 1,
    attribute: 2,
    text: 3,
    cdataSection: 4,
    entityReference: 5,
    // Deprecated
    entityNode: 6,
    // Deprecated
    processingInstruction: 7,
    comment: 8,
    document: 9,
    documentType: 10,
    documentFragment: 11,
    notation: 12 // Deprecated
};
const getGlobal = function getGlobal() {
    return typeof window === 'undefined' ? null : window;
};
/**
 * Creates a no-op policy for internal use only.
 * Don't export this function outside this module!
 * @param trustedTypes The policy factory.
 * @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
 * @return The policy created (or null, if Trusted Types
 * are not supported or creating the policy failed).
 */
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
    if (typeof trustedTypes !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
        return null;
    }
    // Allow the callers to control the unique policy name
    // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
    // Policy creation with duplicate names throws in Trusted Types.
    let suffix = null;
    const ATTR_NAME = 'data-tt-policy-suffix';
    if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
        suffix = purifyHostElement.getAttribute(ATTR_NAME);
    }
    const policyName = 'dompurify' + (suffix ? '#' + suffix : '');
    try {
        return trustedTypes.createPolicy(policyName, {
            createHTML(html) {
                return html;
            },
            createScriptURL(scriptUrl) {
                return scriptUrl;
            }
        });
    }
    catch (_) {
        // Policy creation failed (most likely another DOMPurify script has
        // already run). Skip creating the policy, as this will only cause errors
        // if TT are enforced.
        console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
        return null;
    }
};
const _createHooksMap = function _createHooksMap() {
    return {
        afterSanitizeAttributes: [],
        afterSanitizeElements: [],
        afterSanitizeShadowDOM: [],
        beforeSanitizeAttributes: [],
        beforeSanitizeElements: [],
        beforeSanitizeShadowDOM: [],
        uponSanitizeAttribute: [],
        uponSanitizeElement: [],
        uponSanitizeShadowNode: []
    };
};
/**
 * Resolve a set-valued configuration option: a fresh set built from
 * cfg[key] when it is an own array property (seeded with a clone of
 * options.base when given, case-normalized via options.transform),
 * the fallback set otherwise.
 *
 * @param cfg the cloned, prototype-free configuration object
 * @param key the configuration property to read
 * @param fallback the set to use when the option is absent or not an array
 * @param options transform and optional base set to merge into
 * @returns the resolved set
 */
const _resolveSetOption = function _resolveSetOption(cfg, key, fallback, options) {
    return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
};
function createDOMPurify() {
    let window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
    const DOMPurify = root => createDOMPurify(root);
    DOMPurify.version = '3.4.12';
    DOMPurify.removed = [];
    if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
        // Not running in a browser, provide a factory function
        // so that you can pass your own Window
        DOMPurify.isSupported = false;
        return DOMPurify;
    }
    let document = window.document;
    const originalDocument = document;
    const currentScript = originalDocument.currentScript;
    window.DocumentFragment;
    const HTMLTemplateElement = window.HTMLTemplateElement, Node = window.Node, Element = window.Element, NodeFilter = window.NodeFilter, _window$NamedNodeMap = window.NamedNodeMap;
    _window$NamedNodeMap === void 0 ? window.NamedNodeMap || window.MozNamedAttrMap : _window$NamedNodeMap;
    window.HTMLFormElement;
    const DOMParser = window.DOMParser, trustedTypes = window.trustedTypes;
    const ElementPrototype = Element.prototype;
    const cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
    const remove = lookupGetter(ElementPrototype, 'remove');
    const getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
    const getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
    const getParentNode = lookupGetter(ElementPrototype, 'parentNode');
    const getShadowRoot = lookupGetter(ElementPrototype, 'shadowRoot');
    const getAttributes = lookupGetter(ElementPrototype, 'attributes');
    const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, 'nodeType') : null;
    const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, 'nodeName') : null;
    // As per issue #47, the web-components registry is inherited by a
    // new document created via createHTMLDocument. As per the spec
    // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
    // a new empty registry is used when creating a template contents owner
    // document, so we use that as our parent document to ensure nothing
    // is inherited.
    if (typeof HTMLTemplateElement === 'function') {
        const template = document.createElement('template');
        if (template.content && template.content.ownerDocument) {
            document = template.content.ownerDocument;
        }
    }
    let trustedTypesPolicy;
    let emptyHTML = '';
    // The instance's own internal Trusted Types policy. Unlike a caller-supplied
    // `TRUSTED_TYPES_POLICY`, this is created at most once — Trusted Types throws
    // on duplicate policy names — and is the only policy allowed to persist
    // across configurations and survive `clearConfig()`.
    let defaultTrustedTypesPolicy;
    let defaultTrustedTypesPolicyResolved = false;
    // Tracks whether we are already inside a call to the configured Trusted Types
    // policy (`createHTML` or `createScriptURL`). If a supplied policy callback
    // itself calls `DOMPurify.sanitize` (the cause of #1422), `sanitize` would
    // re-enter the policy and recurse until the stack overflows. We detect that
    // re-entry and throw a clear, actionable error instead. The guard is shared
    // across both callbacks, because either one re-entering `sanitize` triggers
    // the same unbounded recursion.
    let IN_TRUSTED_TYPES_POLICY = 0;
    const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy() {
        if (IN_TRUSTED_TYPES_POLICY > 0) {
            throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or ' + 'createScriptURL) must not call DOMPurify.sanitize, as that causes ' + 'infinite recursion. Do not pass a policy whose callbacks wrap ' + 'DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted ' + 'Types" section of the README.');
        }
    };
    const _createTrustedHTML = function _createTrustedHTML(html) {
        _assertNotInTrustedTypesPolicy();
        IN_TRUSTED_TYPES_POLICY++;
        try {
            return trustedTypesPolicy.createHTML(html);
        }
        finally {
            IN_TRUSTED_TYPES_POLICY--;
        }
    };
    const _createTrustedScriptURL = function _createTrustedScriptURL(scriptUrl) {
        _assertNotInTrustedTypesPolicy();
        IN_TRUSTED_TYPES_POLICY++;
        try {
            return trustedTypesPolicy.createScriptURL(scriptUrl);
        }
        finally {
            IN_TRUSTED_TYPES_POLICY--;
        }
    };
    // Lazily resolve (and cache) the instance's internal default policy.
    // Resolution is attempted at most once: a successful `createPolicy` cannot be
    // repeated (Trusted Types throws on duplicate names), and a failed or
    // unsupported attempt must not be retried on every parse.
    const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy() {
        if (!defaultTrustedTypesPolicyResolved) {
            defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
            defaultTrustedTypesPolicyResolved = true;
        }
        return defaultTrustedTypesPolicy;
    };
    const _document = document, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
    const importNode = originalDocument.importNode;
    let hooks = _createHooksMap();
    /**
     * Expose whether this browser supports running the full DOMPurify.
     */
    DOMPurify.isSupported = typeof entries === 'function' && typeof getParentNode === 'function' && implementation && implementation.createHTMLDocument !== undefined;
    const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
    let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
    /**
     * We consider the elements and attributes below to be safe. Ideally
     * don't add any new ones but feel free to remove unwanted ones.
     */
    /* allowed element names */
    let ALLOWED_TAGS = null;
    const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
    /* Allowed attribute names */
    let ALLOWED_ATTR = null;
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
    /*
     * Configure how DOMPurify should handle custom elements and their attributes as well as customized built-in elements.
     * @property {RegExp|Function|null} tagNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any custom elements)
     * @property {RegExp|Function|null} attributeNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any attributes not on the allow list)
     * @property {boolean} allowCustomizedBuiltInElements allow custom elements derived from built-ins if they pass CUSTOM_ELEMENT_HANDLING.tagNameCheck. Default: `false`.
     */
    let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
        tagNameCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
        },
        attributeNameCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
        },
        allowCustomizedBuiltInElements: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: false
        }
    }));
    /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
    let FORBID_TAGS = null;
    /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
    let FORBID_ATTR = null;
    /* Config object to store ADD_TAGS/ADD_ATTR functions (when used as functions) */
    const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
        tagCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
        },
        attributeCheck: {
            writable: true,
            configurable: false,
            enumerable: true,
            value: null
        }
    }));
    /* Decide if ARIA attributes are okay */
    let ALLOW_ARIA_ATTR = true;
    /* Decide if custom data attributes are okay */
    let ALLOW_DATA_ATTR = true;
    /* Decide if unknown protocols are okay */
    let ALLOW_UNKNOWN_PROTOCOLS = false;
    /* Decide if self-closing tags in attributes are allowed.
     * Usually removed due to a mXSS issue in jQuery 3.0 */
    let ALLOW_SELF_CLOSE_IN_ATTR = true;
    /* Output should be safe for common template engines.
     * This means, DOMPurify removes data attributes, mustaches and ERB
     */
    let SAFE_FOR_TEMPLATES = false;
    /* Output should be safe even for XML used within HTML and alike.
     * This means, DOMPurify removes comments when containing risky content.
     */
    let SAFE_FOR_XML = true;
    /* Decide if document with <html>... should be returned */
    let WHOLE_DOCUMENT = false;
    /* Track whether config is already set on this instance of DOMPurify. */
    let SET_CONFIG = false;
    /* Pristine allowlist bindings captured at setConfig() time. On the
     * persistent-config path sanitize() restores the sets from these before
     * the per-walk hook clone-guard, so a hook's in-call widening cannot
     * carry across calls. Null until setConfig() is called; reset by
     * clearConfig(). */
    let SET_CONFIG_ALLOWED_TAGS = null;
    let SET_CONFIG_ALLOWED_ATTR = null;
    /* Decide if all elements (e.g. style, script) must be children of
     * document.body. By default, browsers might move them to document.head */
    let FORCE_BODY = false;
    /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
     * string (or a TrustedHTML object if Trusted Types are supported).
     * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
     */
    let RETURN_DOM = false;
    /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
     * string  (or a TrustedHTML object if Trusted Types are supported) */
    let RETURN_DOM_FRAGMENT = false;
    /* Try to return a Trusted Type object instead of a string, return a string in
     * case Trusted Types are not supported  */
    let RETURN_TRUSTED_TYPE = false;
    /* Output should be free from DOM clobbering attacks?
     * This sanitizes markups named with colliding, clobberable built-in DOM APIs.
     */
    let SANITIZE_DOM = true;
    /* Achieve full DOM Clobbering protection by isolating the namespace of named
     * properties and JS variables, mitigating attacks that abuse the HTML/DOM spec rules.
     *
     * HTML/DOM spec rules that enable DOM Clobbering:
     *   - Named Access on Window (§7.3.3)
     *   - DOM Tree Accessors (§3.1.5)
     *   - Form Element Parent-Child Relations (§4.10.3)
     *   - Iframe srcdoc / Nested WindowProxies (§4.8.5)
     *   - HTMLCollection (§4.2.10.2)
     *
     * Namespace isolation is implemented by prefixing `id` and `name` attributes
     * with a constant string, i.e., `user-content-`
     */
    let SANITIZE_NAMED_PROPS = false;
    const SANITIZE_NAMED_PROPS_PREFIX = 'user-content-';
    /* Keep element content when removing element? */
    let KEEP_CONTENT = true;
    /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
     * of importing it into a new Document and returning a sanitized copy */
    let IN_PLACE = false;
    /* Allow usage of profiles like html, svg and mathMl */
    let USE_PROFILES = {};
    /* Tags to ignore content of when KEEP_CONTENT is true */
    let FORBID_CONTENTS = null;
    const DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script',
        // <selectedcontent> mirrors the selected <option>'s subtree, cloned by
        // the UA (customizable <select>) — including any on* handlers — and the
        // engine re-mirrors synchronously whenever a removal changes which
        // option/selectedcontent is current, even inside DOMPurify's inert
        // DOMParser document. Hoisting its children on removal re-inserts a fresh
        // mirror target ahead of the walk, which the engine refills, looping
        // forever (DoS) and amplifying output. Dropping its content on removal
        // (rather than hoisting) breaks that cascade; the content is a duplicate
        // of the option, which is sanitized on its own. See campaign-3 F1/F6.
        'selectedcontent', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);
    /* Tags that are safe for data: URIs */
    let DATA_URI_TAGS = null;
    const DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
    /* Attributes safe for values like "javascript:" */
    let URI_SAFE_ATTRIBUTES = null;
    const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
    const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
    /* Document namespace */
    let NAMESPACE = HTML_NAMESPACE;
    let IS_EMPTY_INPUT = false;
    /* Allowed XHTML+XML namespaces */
    let ALLOWED_NAMESPACES = null;
    const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
    const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze(['mi', 'mo', 'mn', 'ms', 'mtext']);
    let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    const DEFAULT_HTML_INTEGRATION_POINTS = freeze(['annotation-xml']);
    let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    // Certain elements are allowed in both SVG and HTML
    // namespace. We need to specify them explicitly
    // so that they don't get erroneously deleted from
    // HTML namespace.
    const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ['title', 'style', 'font', 'a', 'script']);
    /* Parsing of strict XHTML documents */
    let PARSER_MEDIA_TYPE = null;
    const SUPPORTED_PARSER_MEDIA_TYPES = ['application/xhtml+xml', 'text/html'];
    const DEFAULT_PARSER_MEDIA_TYPE = 'text/html';
    let transformCaseFunc = null;
    /* Keep a reference to config to pass to hooks */
    let CONFIG = null;
    /* Ideally, do not touch anything below this line */
    /* ______________________________________________ */
    const formElement = document.createElement('form');
    const isRegexOrFunction = function isRegexOrFunction(testValue) {
        return testValue instanceof RegExp || testValue instanceof Function;
    };
    /**
     * _parseConfig
     *
     * @param cfg optional config literal
     */
    // eslint-disable-next-line complexity
    const _parseConfig = function _parseConfig() {
        let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        if (CONFIG && CONFIG === cfg) {
            return;
        }
        /* Shield configuration object from tampering */
        if (!cfg || typeof cfg !== 'object') {
            cfg = {};
        }
        /* Shield configuration object from prototype pollution */
        cfg = clone(cfg);
        PARSER_MEDIA_TYPE =
            // eslint-disable-next-line unicorn/prefer-includes
            SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
        // HTML tags and attributes are not case-sensitive, converting to lowercase. Keeping XHTML as is.
        transformCaseFunc = PARSER_MEDIA_TYPE === 'application/xhtml+xml' ? stringToString : stringToLowerCase;
        /* Set configuration parameters */
        ALLOWED_TAGS = _resolveSetOption(cfg, 'ALLOWED_TAGS', DEFAULT_ALLOWED_TAGS, {
            transform: transformCaseFunc
        });
        ALLOWED_ATTR = _resolveSetOption(cfg, 'ALLOWED_ATTR', DEFAULT_ALLOWED_ATTR, {
            transform: transformCaseFunc
        });
        ALLOWED_NAMESPACES = _resolveSetOption(cfg, 'ALLOWED_NAMESPACES', DEFAULT_ALLOWED_NAMESPACES, {
            transform: stringToString
        });
        URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, 'ADD_URI_SAFE_ATTR', DEFAULT_URI_SAFE_ATTRIBUTES, {
            transform: transformCaseFunc,
            base: DEFAULT_URI_SAFE_ATTRIBUTES
        });
        DATA_URI_TAGS = _resolveSetOption(cfg, 'ADD_DATA_URI_TAGS', DEFAULT_DATA_URI_TAGS, {
            transform: transformCaseFunc,
            base: DEFAULT_DATA_URI_TAGS
        });
        FORBID_CONTENTS = _resolveSetOption(cfg, 'FORBID_CONTENTS', DEFAULT_FORBID_CONTENTS, {
            transform: transformCaseFunc
        });
        FORBID_TAGS = _resolveSetOption(cfg, 'FORBID_TAGS', clone({}), {
            transform: transformCaseFunc
        });
        FORBID_ATTR = _resolveSetOption(cfg, 'FORBID_ATTR', clone({}), {
            transform: transformCaseFunc
        });
        USE_PROFILES = objectHasOwnProperty(cfg, 'USE_PROFILES') ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === 'object' ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
        ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
        ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
        ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
        ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false; // Default true
        SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
        SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false; // Default true
        WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
        RETURN_DOM = cfg.RETURN_DOM || false; // Default false
        RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
        RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
        FORCE_BODY = cfg.FORCE_BODY || false; // Default false
        SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
        SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false; // Default false
        KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
        IN_PLACE = cfg.IN_PLACE || false; // Default false
        IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI; // Default regexp
        NAMESPACE = typeof cfg.NAMESPACE === 'string' ? cfg.NAMESPACE : HTML_NAMESPACE; // Default HTML namespace
        MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, 'MATHML_TEXT_INTEGRATION_POINTS') && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === 'object' ? clone(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS); // Default built-in map
        HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, 'HTML_INTEGRATION_POINTS') && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === 'object' ? clone(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS); // Default built-in map
        const customElementHandling = objectHasOwnProperty(cfg, 'CUSTOM_ELEMENT_HANDLING') && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === 'object' ? clone(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
        CUSTOM_ELEMENT_HANDLING = create(null);
        if (objectHasOwnProperty(customElementHandling, 'tagNameCheck') && isRegexOrFunction(customElementHandling.tagNameCheck)) {
            CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck; // Default undefined
        }
        if (objectHasOwnProperty(customElementHandling, 'attributeNameCheck') && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
            CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck; // Default undefined
        }
        if (objectHasOwnProperty(customElementHandling, 'allowCustomizedBuiltInElements') && typeof customElementHandling.allowCustomizedBuiltInElements === 'boolean') {
            CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements; // Default undefined
        }
        seal(CUSTOM_ELEMENT_HANDLING);
        if (SAFE_FOR_TEMPLATES) {
            ALLOW_DATA_ATTR = false;
        }
        if (RETURN_DOM_FRAGMENT) {
            RETURN_DOM = true;
        }
        /* Parse profile info */
        if (USE_PROFILES) {
            ALLOWED_TAGS = addToSet({}, text);
            ALLOWED_ATTR = create(null);
            if (USE_PROFILES.html === true) {
                addToSet(ALLOWED_TAGS, html$1);
                addToSet(ALLOWED_ATTR, html);
            }
            if (USE_PROFILES.svg === true) {
                addToSet(ALLOWED_TAGS, svg$1);
                addToSet(ALLOWED_ATTR, svg);
                addToSet(ALLOWED_ATTR, xml);
            }
            if (USE_PROFILES.svgFilters === true) {
                addToSet(ALLOWED_TAGS, svgFilters);
                addToSet(ALLOWED_ATTR, svg);
                addToSet(ALLOWED_ATTR, xml);
            }
            if (USE_PROFILES.mathMl === true) {
                addToSet(ALLOWED_TAGS, mathMl$1);
                addToSet(ALLOWED_ATTR, mathMl);
                addToSet(ALLOWED_ATTR, xml);
            }
        }
        /* Always reset function-based ADD_TAGS / ADD_ATTR checks to prevent
         * leaking across calls when switching from function to array config */
        EXTRA_ELEMENT_HANDLING.tagCheck = null;
        EXTRA_ELEMENT_HANDLING.attributeCheck = null;
        /* Merge configuration parameters */
        if (objectHasOwnProperty(cfg, 'ADD_TAGS')) {
            if (typeof cfg.ADD_TAGS === 'function') {
                EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
            }
            else if (arrayIsArray(cfg.ADD_TAGS)) {
                if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
                    ALLOWED_TAGS = clone(ALLOWED_TAGS);
                }
                addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
            }
        }
        if (objectHasOwnProperty(cfg, 'ADD_ATTR')) {
            if (typeof cfg.ADD_ATTR === 'function') {
                EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
            }
            else if (arrayIsArray(cfg.ADD_ATTR)) {
                if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
                    ALLOWED_ATTR = clone(ALLOWED_ATTR);
                }
                addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
            }
        }
        if (objectHasOwnProperty(cfg, 'ADD_URI_SAFE_ATTR') && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) {
            addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
        }
        if (objectHasOwnProperty(cfg, 'FORBID_CONTENTS') && arrayIsArray(cfg.FORBID_CONTENTS)) {
            if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
                FORBID_CONTENTS = clone(FORBID_CONTENTS);
            }
            addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
        }
        if (objectHasOwnProperty(cfg, 'ADD_FORBID_CONTENTS') && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
            if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
                FORBID_CONTENTS = clone(FORBID_CONTENTS);
            }
            addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
        }
        /* Add #text in case KEEP_CONTENT is set to true */
        if (KEEP_CONTENT) {
            ALLOWED_TAGS['#text'] = true;
        }
        /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
        if (WHOLE_DOCUMENT) {
            addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
        }
        /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
        if (ALLOWED_TAGS.table) {
            addToSet(ALLOWED_TAGS, ['tbody']);
            delete FORBID_TAGS.tbody;
        }
        // Re-derive the active Trusted Types policy from this configuration on
        // every parse. The active policy must never be sticky closure state that
        // outlives the config that set it: a caller-supplied policy left in place
        // after `clearConfig()` — or after a later call that supplied none, or
        // `TRUSTED_TYPES_POLICY: null` — could sign a subsequent "default"
        // `RETURN_TRUSTED_TYPE` result with a foreign, possibly unsafe policy.
        // See GHSA-vxr8-fq34-vvx9.
        if (cfg.TRUSTED_TYPES_POLICY) {
            if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== 'function') {
                throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
            }
            if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== 'function') {
                throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
            }
            // A caller-supplied policy applies to this configuration only.
            const previousTrustedTypesPolicy = trustedTypesPolicy;
            trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
            // Sign local variables required by `sanitize`. If the supplied policy's
            // `createHTML` is circular (i.e. it calls `DOMPurify.sanitize`), this
            // throws via the re-entrancy guard. Restore the previous policy first so
            // the instance is not left in a poisoned state. See #1422.
            try {
                emptyHTML = _createTrustedHTML('');
            }
            catch (error) {
                trustedTypesPolicy = previousTrustedTypesPolicy;
                throw error;
            }
        }
        else if (cfg.TRUSTED_TYPES_POLICY === null) {
            // Explicit opt-out for this call: perform no Trusted Types signing and
            // create nothing (so a strict `trusted-types` CSP that disallows a
            // `dompurify` policy can still call `sanitize` from inside its own
            // policy — see #1422). Resetting to `undefined` rather than a sticky
            // `null` also drops any previously retained caller policy, so it cannot
            // resurface on a later call, while still allowing the next config-less
            // call to restore the internal default policy. See GHSA-vxr8-fq34-vvx9.
            trustedTypesPolicy = undefined;
            emptyHTML = '';
        }
        else {
            // No policy supplied: keep the currently active policy if one is set — a
            // previously supplied policy is intentionally sticky across config-less
            // calls — otherwise fall back to the instance's own internal policy,
            // created at most once. (A policy supplied for a *single* call still
            // lingers by design; what must not linger is a policy whose configuration
            // has been torn down via `clearConfig()`, which restores the default.)
            if (trustedTypesPolicy === undefined) {
                trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
            }
            // Sign internal variables only when a policy is active. A falsy policy
            // (Trusted Types unsupported, creation failed, or an explicit opt-out)
            // leaves `emptyHTML` as a plain string, so we never call `.createHTML` on
            // a non-policy and throw. See #1422.
            if (trustedTypesPolicy && typeof emptyHTML === 'string') {
                emptyHTML = _createTrustedHTML('');
            }
        }
        // Prevent further manipulation of configuration.
        // Not available in IE8, Safari 5, etc.
        if (freeze) {
            freeze(cfg);
        }
        CONFIG = cfg;
    };
    /* Keep track of all possible SVG and MathML tags
     * so that we can perform the namespace checks
     * correctly. */
    const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
    const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
    /**
     * Namespace rules for an element in the SVG namespace.
     *
     * @param tagName the element's lowercase tag name
     * @param parent the (possibly simulated) parent node
     * @param parentTagName the parent's lowercase tag name
     * @returns true if a spec-compliant parser could produce this element
     */
    const _checkSvgNamespace = function _checkSvgNamespace(tagName, parent, parentTagName) {
        // The only way to switch from HTML namespace to SVG
        // is via <svg>. If it happens via any other tag, then
        // it should be killed.
        if (parent.namespaceURI === HTML_NAMESPACE) {
            return tagName === 'svg';
        }
        // The only way to switch from MathML to SVG is via <svg>
        // if the parent is either <annotation-xml> or a MathML
        // text integration point.
        if (parent.namespaceURI === MATHML_NAMESPACE) {
            return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
        }
        // We only allow elements that are defined in SVG
        // spec. All others are disallowed in SVG namespace.
        return Boolean(ALL_SVG_TAGS[tagName]);
    };
    /**
     * Namespace rules for an element in the MathML namespace.
     *
     * @param tagName the element's lowercase tag name
     * @param parent the (possibly simulated) parent node
     * @param parentTagName the parent's lowercase tag name
     * @returns true if a spec-compliant parser could produce this element
     */
    const _checkMathMlNamespace = function _checkMathMlNamespace(tagName, parent, parentTagName) {
        // The only way to switch from HTML namespace to MathML
        // is via <math>. If it happens via any other tag, then
        // it should be killed.
        if (parent.namespaceURI === HTML_NAMESPACE) {
            return tagName === 'math';
        }
        // The only way to switch from SVG to MathML is via
        // <math> and HTML integration points
        if (parent.namespaceURI === SVG_NAMESPACE) {
            return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
        }
        // We only allow elements that are defined in MathML
        // spec. All others are disallowed in MathML namespace.
        return Boolean(ALL_MATHML_TAGS[tagName]);
    };
    /**
     * Namespace rules for an element in the HTML namespace.
     *
     * @param tagName the element's lowercase tag name
     * @param parent the (possibly simulated) parent node
     * @param parentTagName the parent's lowercase tag name
     * @returns true if a spec-compliant parser could produce this element
     */
    const _checkHtmlNamespace = function _checkHtmlNamespace(tagName, parent, parentTagName) {
        // The only way to switch from SVG to HTML is via
        // HTML integration points, and from MathML to HTML
        // is via MathML text integration points
        if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
            return false;
        }
        if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
            return false;
        }
        // We disallow tags that are specific for MathML
        // or SVG and should never appear in HTML namespace
        return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    };
    /**
     * @param element a DOM element whose namespace is being checked
     * @returns Return false if the element has a
     *  namespace that a spec-compliant parser would never
     *  return. Return true otherwise.
     */
    const _checkValidNamespace = function _checkValidNamespace(element) {
        let parent = getParentNode(element);
        // In JSDOM, if we're inside shadow DOM, then parentNode
        // can be null. We just simulate parent in this case.
        if (!parent || !parent.tagName) {
            parent = {
                namespaceURI: NAMESPACE,
                tagName: 'template'
            };
        }
        const tagName = stringToLowerCase(element.tagName);
        const parentTagName = stringToLowerCase(parent.tagName);
        if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
            return false;
        }
        if (element.namespaceURI === SVG_NAMESPACE) {
            return _checkSvgNamespace(tagName, parent, parentTagName);
        }
        if (element.namespaceURI === MATHML_NAMESPACE) {
            return _checkMathMlNamespace(tagName, parent, parentTagName);
        }
        if (element.namespaceURI === HTML_NAMESPACE) {
            return _checkHtmlNamespace(tagName, parent, parentTagName);
        }
        // For XHTML and XML documents that support custom namespaces
        if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && ALLOWED_NAMESPACES[element.namespaceURI]) {
            return true;
        }
        // The code should never reach this place (this means
        // that the element somehow got namespace that is not
        // HTML, SVG, MathML or allowed via ALLOWED_NAMESPACES).
        // Return false just in case.
        return false;
    };
    /**
     * _forceRemove
     *
     * @param node a DOM node
     */
    const _forceRemove = function _forceRemove(node) {
        arrayPush(DOMPurify.removed, {
            element: node
        });
        try {
            // eslint-disable-next-line unicorn/prefer-dom-node-remove
            getParentNode(node).removeChild(node);
        }
        catch (_) {
            /* The normal detach failed — this is reached for a parentless node
               (getParentNode() is null, so .removeChild throws). Element.prototype
               .remove() is itself a spec no-op on a parentless node, so a recorded
               "removal" would otherwise hand the caller back an intact,
               payload-bearing node (e.g. a detached IN_PLACE root the mXSS canary or
               the style-with-element-child rule decided to kill). Fail closed by
               throwing — exactly as a clobbered root does at the IN_PLACE entry —
               rather than trying to "neutralize" the node via its own methods.
               Neutralizing would mean calling getAttributeNames()/removeAttribute()
               on the node, both of which a <form> root can clobber via a named child
               (and _isClobbered does not even probe getAttributeNames), so the
               neutralize step could itself be silently defeated, leaving the payload
               intact. A throw touches only the cached, clobber-safe remove() and
               getParentNode(). Generalizes GHSA-r47g-fvhr-h676 (clobbered-form root)
               to every root-kill reason. REPORT-3.
                      This lives inside the catch, so it never fires for a normally-removed
               in-tree node: those have a parent, removeChild() succeeds, and the
               catch is not entered. Only a kept (parentless) root reaches here. */
            remove(node);
            if (!getParentNode(node)) {
                throw typeErrorCreate('a node selected for removal could not be detached from its tree ' + 'and cannot be safely returned; refusing to sanitize in place');
            }
        }
    };
    /**
     * _neutralizeRoot
     *
     * Fail-closed teardown of an in-place root after the sanitize walk aborts
     * (campaign-3 F2). An internal throw mid-walk — e.g. a page-registered
     * custom element's reaction detaches a node so `_forceRemove`'s deliberate
     * parentless guard throws, or any other re-entrant engine mutation — would
     * otherwise leave the caller's *live* tree half-sanitized, with everything
     * after the abort point still carrying its handlers. There is no safe way
     * to resume the walk (the tree mutated under us), so we strip the root bare:
     * remove every child and every attribute, then let the caller's catch see
     * the original error. Clobber-safe (cached `remove`/`childNodes`/`attributes`
     * getters; the root was already clobber-pre-flighted at the IN_PLACE entry).
     *
     * @param root the in-place root to empty
     */
    const _neutralizeRoot = function _neutralizeRoot(root) {
        /* Strip every disallowed attribute (on* handlers included) off the whole
           subtree BEFORE detaching anything. Detaching first would hand back
           handler-bearing originals (e.g. an already-loading `<img onerror>`)
           whose queued resource event still fires in page scope after we throw.
           Clobber-safe reads; a doomed clobbered node's own attributes are
           irrelevant while its non-clobbered descendants are reached and scrubbed. */
        _neutralizeSubtree(root);
        const childNodes = getChildNodes(root);
        if (childNodes) {
            const snapshot = [];
            arrayForEach(childNodes, child => {
                arrayPush(snapshot, child);
            });
            arrayForEach(snapshot, child => {
                try {
                    remove(child);
                }
                catch (_) {
                    /* Best-effort teardown; a still-attached child is handled below */
                }
            });
        }
        const attributes = getAttributes(root);
        if (attributes) {
            for (let i = attributes.length - 1; i >= 0; --i) {
                const attribute = attributes[i];
                const name = attribute && attribute.name;
                if (typeof name === 'string') {
                    try {
                        root.removeAttribute(name);
                    }
                    catch (_) {
                        /* Clobbered removeAttribute — ignore (fail-closed best effort) */
                    }
                }
            }
        }
    };
    /**
     * _removeAttribute
     *
     * @param name an Attribute name
     * @param element a DOM node
     */
    const _removeAttribute = function _removeAttribute(name, element) {
        try {
            arrayPush(DOMPurify.removed, {
                attribute: element.getAttributeNode(name),
                from: element
            });
        }
        catch (_) {
            arrayPush(DOMPurify.removed, {
                attribute: null,
                from: element
            });
        }
        element.removeAttribute(name);
        // We void attribute values for unremovable "is" attributes
        if (name === 'is') {
            if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
                try {
                    _forceRemove(element);
                }
                catch (_) { }
            }
            else {
                try {
                    element.setAttribute(name, '');
                }
                catch (_) { }
            }
        }
    };
    /**
     * _stripDisallowedAttributes
     *
     * Removes every attribute the active configuration does not allow from a
     * single element, using the same allowlist as the main attribute pass (so
     * `on*` handlers go, but no `/^on/` blocklist is introduced). Used only to
     * neutralise nodes that are being discarded from an in-place tree.
     *
     * @param element the element to strip
     */
    const _stripDisallowedAttributes = function _stripDisallowedAttributes(element) {
        const attributes = getAttributes(element);
        if (!attributes) {
            return;
        }
        for (let i = attributes.length - 1; i >= 0; --i) {
            const attribute = attributes[i];
            const name = attribute && attribute.name;
            if (typeof name !== 'string' || ALLOWED_ATTR[transformCaseFunc(name)]) {
                continue;
            }
            try {
                element.removeAttribute(name);
            }
            catch (_) {
                /* Clobbered removeAttribute on a doomed node — ignore */
            }
        }
    };
    /**
     * _neutralizeSubtree
     *
     * Completes the audit-5 F1 fix across every removal path. The KEEP_CONTENT
     * move-hoist neutralises only disallowed-tag removals; clobber, mXSS-canary,
     * namespace, comment, processing-instruction and KEEP_CONTENT:false removals
     * all drop their subtree wholesale via `_forceRemove`. On the IN_PLACE path
     * those dropped nodes are detached from the caller's LIVE tree but a
     * handler-bearing original among them (an `<img onerror>`/`<video>` that was
     * loading) keeps its queued resource event, which fires in page scope after
     * sanitize returns. This walks a removed subtree and strips every attribute
     * the active configuration does not allow — so `on*` handlers are cancelled
     * through the SAME allowlist that governs kept nodes, not a separate `/^on/`
     * blocklist. Run synchronously before sanitize returns, i.e. before any
     * queued event can fire. Hook-free by design: these nodes leave the output,
     * so firing attribute hooks for them would be surprising. Clobber-safe reads;
     * a doomed clobbered node may shadow `removeAttribute` (its own attributes are
     * irrelevant — it is discarded — while its non-clobbered descendants, e.g.
     * the `<img>`, are reached and scrubbed).
     *
     * @param root the root of a removed subtree to neutralise
     */
    const _neutralizeSubtree = function _neutralizeSubtree(root) {
        const stack = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
            if (nodeType === NODE_TYPE.element) {
                _stripDisallowedAttributes(node);
            }
            const childNodes = getChildNodes(node);
            if (childNodes) {
                for (let i = childNodes.length - 1; i >= 0; --i) {
                    stack.push(childNodes[i]);
                }
            }
        }
    };
    /**
     * _neutralizePatchLinkage
     *
     * IN_PLACE entry pre-pass (declarative-partial-updates / streaming
     * hardening, https://github.com/WICG/declarative-partial-updates).
     *
     * The main walk strips patch linkage (`for`/`patchsrc`) and removes range
     * markers (PIs / markup comments) node-by-node, in document order, AS it
     * reaches each node. On a live in-place root that leaves a window: from the
     * moment the root is connected until the walk arrives at a given node, that
     * node's linkage is live. A patch applied on connection/stream can fire as
     * a microtask during the walk and inject or teleport an unsanitized DOM
     * range into a region the iterator has already passed and will not revisit,
     * so the post-return "tree is sanitized" contract is violated. Sweep the
     * whole tree once up front and sever every linkage before the walk begins,
     * closing that window.
     *
     * This CANNOT undo a patch that already fired before sanitize ran — that is
     * the irreducible "do not IN_PLACE a live-connected attacker tree" caveat —
     * but it closes everything from sanitize-start onward. Gated on SAFE_FOR_XML
     * to group with the rest of the declarative-partial-updates handling and
     * stay overridable, consistent with the codebase.
     *
     * Clobber-safe traversal (cached childNodes getter); per-node try/catch so a
     * clobbered root cannot defeat the sweep of its non-clobbered descendants.
     *
     * NOTE (pending real-Chrome confirmation, see test/declarative-patch-probe
     * .html Q1): this mirrors the existing policy of keeping `for` on
     * <label>/<output>. If the shipping feature can drive a patch through a
     * surviving `for`-on-label/output + `id` pair, this pre-pass and the
     * attribute check at _isBasicCustomElement's caller must additionally drop
     * that pair on the IN_PLACE path. Left as-is until the taxonomy is verified.
     *
     * @param root the in-place root to sweep
     */
    const _neutralizePatchLinkage = function _neutralizePatchLinkage(root) {
        if (!SAFE_FOR_XML) {
            return;
        }
        const stack = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
            /* Remove range markers (the target side of a patch linkage): every
               processing instruction, and any markup-bearing comment. */
            if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
                try {
                    remove(node);
                }
                catch (_) {
                    /* Best-effort */
                }
                continue;
            }
            /* Strip patch-source attributes (the source side) off elements. */
            if (nodeType === NODE_TYPE.element) {
                const element = node;
                const lcTag = transformCaseFunc(getNodeName ? getNodeName(node) : node.nodeName);
                try {
                    if (element.hasAttribute && element.hasAttribute('patchsrc')) {
                        element.removeAttribute('patchsrc');
                    }
                    if (element.hasAttribute && element.hasAttribute('for') && lcTag !== 'label' && lcTag !== 'output') {
                        element.removeAttribute('for');
                    }
                }
                catch (_) {
                    /* Clobbered removeAttribute/hasAttribute on a doomed node — ignore */
                }
            }
            const childNodes = getChildNodes(node);
            if (childNodes) {
                for (let i = childNodes.length - 1; i >= 0; --i) {
                    stack.push(childNodes[i]);
                }
            }
        }
    };
    /**
     * _initDocument
     *
     * @param dirty - a string of dirty markup
     * @return a DOM, filled with the dirty markup
     */
    const _initDocument = function _initDocument(dirty) {
        /* Create a HTML document */
        let doc = null;
        let leadingWhitespace = null;
        if (FORCE_BODY) {
            dirty = '<remove></remove>' + dirty;
        }
        else {
            /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
            const matches = stringMatch(dirty, /^[\r\n\t ]+/);
            leadingWhitespace = matches && matches[0];
        }
        if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && NAMESPACE === HTML_NAMESPACE) {
            // Root of XHTML doc must contain xmlns declaration (see https://www.w3.org/TR/xhtml1/normative.html#strict)
            dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + '</body></html>';
        }
        const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
        /*
         * Use the DOMParser API by default, fallback later if needs be
         * DOMParser not work for svg when has multiple root element.
         */
        if (NAMESPACE === HTML_NAMESPACE) {
            try {
                doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
            }
            catch (_) { }
        }
        /* Use createHTMLDocument in case DOMParser is not available */
        if (!doc || !doc.documentElement) {
            doc = implementation.createDocument(NAMESPACE, 'template', null);
            try {
                doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
            }
            catch (_) {
                // Syntax error if dirtyPayload is invalid xml
            }
        }
        const body = doc.body || doc.documentElement;
        if (dirty && leadingWhitespace) {
            body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
        }
        /* Work on whole document or just its body */
        if (NAMESPACE === HTML_NAMESPACE) {
            return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
        }
        return WHOLE_DOCUMENT ? doc.documentElement : body;
    };
    /**
     * Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
     *
     * @param root The root element or node to start traversing on.
     * @return The created NodeIterator
     */
    const _createNodeIterator = function _createNodeIterator(root) {
        return createNodeIterator.call(root.ownerDocument || root, root, 
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
    };
    /**
     * Replace template expression syntax (mustache, ERB, template
     * literal) with a space; shared by all SAFE_FOR_TEMPLATES scrub
     * sites. Order matters: mustache, then ERB, then template literal.
     *
     * @param value the string to scrub
     * @returns the scrubbed string
     */
    const _stripTemplateExpressions = function _stripTemplateExpressions(value) {
        value = stringReplace(value, MUSTACHE_EXPR$1, ' ');
        value = stringReplace(value, ERB_EXPR$1, ' ');
        value = stringReplace(value, TMPLIT_EXPR$1, ' ');
        return value;
    };
    /**
     * Strip template-engine expressions ({{...}}, ${...}, <%...%>) from the
     * character data of an element subtree. Used as the final safety net for
     * SAFE_FOR_TEMPLATES on every DOM-returning code path so that expressions
     * which only form after text-node normalization (e.g. fragments split across
     * stripped elements) cannot survive into a template-evaluating framework.
     *
     * Walks text/comment/CDATA/processing-instruction nodes and mutates `.data`
     * in place rather than round-tripping through innerHTML. This preserves
     * descendant node references (important for IN_PLACE callers), avoids a
     * serialize/reparse cycle, and reads literal character data — which means
     * `<%...%>` in text content matches the ERB regex against its real bytes
     * instead of the HTML-entity-escaped form innerHTML would produce.
     *
     * Attribute values are not visited here; SAFE_FOR_TEMPLATES handling for
     * attributes is performed during the per-node `_sanitizeAttributes` pass.
     *
     * @param node The root element whose character data should be scrubbed.
     */
    const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
        var _node$querySelectorAl;
        node.normalize();
        const walker = createNodeIterator.call(node.ownerDocument || node, node, 
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION, null);
        let currentNode = walker.nextNode();
        while (currentNode) {
            currentNode.data = _stripTemplateExpressions(currentNode.data);
            currentNode = walker.nextNode();
        }
        // NodeIterator does not descend into <template>.content per the DOM spec,
        // so we must explicitly recurse into each template's content fragment,
        // mirroring the approach used by _sanitizeShadowDOM.
        const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, 'template');
        if (templates) {
            arrayForEach(templates, tmpl => {
                if (_isDocumentFragment(tmpl.content)) {
                    _scrubTemplateExpressions2(tmpl.content);
                }
            });
        }
    };
    /**
     * _isClobbered
     *
     * Detect DOM-clobbering on HTMLFormElement nodes. Form is the only HTML
     * interface with [LegacyOverrideBuiltIns]; a descendant element with a
     * `name` attribute matching a prototype property shadows that property
     * on direct reads. We use this check at the IN_PLACE entry-point and
     * during attribute sanitization to refuse clobbered forms.
     *
     * @param element element to check for clobbering attacks
     * @return true if clobbered, false if safe
     */
    const _isClobbered = function _isClobbered(element) {
        // Realm-independent tag-name probe. If we can't determine the tag
        // name at all, we can't reason about clobbering — return false
        // (the caller's other defences still apply).
        const realTagName = getNodeName ? getNodeName(element) : null;
        if (typeof realTagName !== 'string') {
            return false;
        }
        if (transformCaseFunc(realTagName) !== 'form') {
            return false;
        }
        return typeof element.nodeName !== 'string' || typeof element.textContent !== 'string' || typeof element.removeChild !== 'function' ||
            // Realm-safe NamedNodeMap detection: equality against the cached
            // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
            // makes the direct read diverge from the cached read; a clean form
            // (same-realm OR foreign-realm) has both reads pointing at the same
            // canonical NamedNodeMap.
            element.attributes !== getAttributes(element) || typeof element.removeAttribute !== 'function' || typeof element.setAttribute !== 'function' || typeof element.namespaceURI !== 'string' || typeof element.insertBefore !== 'function' || typeof element.hasChildNodes !== 'function' ||
            // NodeType clobbering probe. Cached Node.prototype.nodeType getter
            // returns the integer 1 for any Element regardless of realm; direct
            // read on a clobbered form (e.g. <input name="nodeType">) returns
            // the named child element. Cheap addition — nodeType is read from
            // an internal slot, no serialization cost — and removes a residual
            // clobbering surface used by several mXSS / PI / comment branches
            // in _sanitizeElements that compare currentNode.nodeType directly.
            element.nodeType !== getNodeType(element) ||
            // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
            // "childNodes" shadows the prototype getter. Direct reads of
            // form.childNodes from a clobbered form return the named child
            // instead of the real NodeList, so any walk that reads it directly
            // skips the form's real children. Compare the direct read to the
            // cached Node.prototype getter — when the form's named-property
            // getter intercepts the read, the two values differ and we flag
            // the form. This catches every clobbering child type (input,
            // select, etc.) regardless of whether the named child happens to
            // carry a numeric .length, which a typeof-based probe would miss
            // (e.g. HTMLSelectElement.length is a defined unsigned-long).
            element.childNodes !== getChildNodes(element);
    };
    /**
     * Checks whether the given value is a DocumentFragment from any realm.
     *
     * The realm-independent replacement reads `nodeType` through the cached
     * Node.prototype getter and compares to the DOCUMENT_FRAGMENT_NODE
     * constant (11). nodeType is a numeric value resolved from the node's
     * internal slot, identical across realms for the same kind of node.
     *
     * @param value object to check
     * @return true if value is a DocumentFragment-shaped node from any realm
     */
    const _isDocumentFragment = function _isDocumentFragment(value) {
        if (!getNodeType || typeof value !== 'object' || value === null) {
            return false;
        }
        try {
            return getNodeType(value) === NODE_TYPE.documentFragment;
        }
        catch (_) {
            return false;
        }
    };
    /**
     * Checks whether the given object is a DOM node, including nodes that
     * originate from a different window/realm (e.g. an iframe's
     * contentDocument). The previous `value instanceof Node` check was
     * realm-bound: nodes from a different window failed it, causing
     * sanitize() to silently stringify them and reset IN_PLACE to false,
     * returning the original node unsanitized. See GHSA-4w3q-35jp-p934.
     *
     * @param value object to check whether it's a DOM node
     * @return true if value is a DOM node from any realm
     */
    const _isNode = function _isNode(value) {
        if (!getNodeType || typeof value !== 'object' || value === null) {
            return false;
        }
        try {
            return typeof getNodeType(value) === 'number';
        }
        catch (_) {
            return false;
        }
    };
    function _executeHooks(hooks, currentNode, data) {
        if (hooks.length === 0) {
            return;
        }
        arrayForEach(hooks, hook => {
            hook.call(DOMPurify, currentNode, data, CONFIG);
        });
    }
    /**
     * Structural-threat checks that condemn a node regardless of the
     * allowlists: mXSS via namespace confusion, risky CSS construction,
     * processing instructions, markup-bearing comments. Pure predicate;
     * the caller removes. Check order is load-bearing.
     *
     * @param currentNode the node to inspect
     * @param tagName the node's transformCaseFunc'd tag name
     * @return true if the node must be removed
     */
    const _isUnsafeNode = function _isUnsafeNode(currentNode, tagName) {
        /* Detect mXSS attempts abusing namespace confusion */
        if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) {
            return true;
        }
        /* Remove risky CSS construction leading to mXSS */
        if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === 'style' && _isNode(currentNode.firstElementChild)) {
            return true;
        }
        /* Remove any occurrence of processing instructions */
        if (currentNode.nodeType === NODE_TYPE.processingInstruction) {
            return true;
        }
        /* Remove any kind of possibly harmful comments */
        if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) {
            return true;
        }
        return false;
    };
    /**
     * Handle a node whose tag is forbidden or not allowlisted: keep
     * allowed custom elements (false return exits _sanitizeElements
     * early - the namespace and fallback-tag removal checks are
     * intentionally skipped for kept custom elements), else hoist
     * content per KEEP_CONTENT and remove.
     *
     * A kept custom element is the ONLY case in which this function
     * returns false, so the caller uses that return value to run the
     * afterSanitizeElements hook on the kept element and keep the
     * element-hook lifecycle consistent with normal allowlisted
     * elements (GHSA-c2j3-45gr-mqc4).
     *
     * @param currentNode the disallowed node
     * @param tagName the node's transformCaseFunc'd tag name
     * @return true if the node was removed, false if kept
     */
    const _sanitizeDisallowedNode = function _sanitizeDisallowedNode(currentNode, tagName) {
        /* Check if we have a custom element to handle */
        if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
            if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
                return false;
            }
            if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
                return false;
            }
        }
        /* Keep content except for bad-listed elements.
             Use the cached prototype getters exclusively — the previous code
             had `|| currentNode.parentNode` / `|| currentNode.childNodes`
             fallbacks, but the cached getters always return the canonical
             value (or null for a real parent-less node), so the fallback
             path was dead in safe cases and a clobbering surface in unsafe
             ones. Falsy cached results stay falsy; the `if (childNodes &&
             parentNode)` check already gates correctly. */
        if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
            const parentNode = getParentNode(currentNode);
            const childNodes = getChildNodes(currentNode);
            if (childNodes && parentNode) {
                const childCount = childNodes.length;
                /* In-place: hoist the *original* children so the iterator visits
                     and sanitises them through the same allowlist pass as every other
                     node. The caller built the tree in the live document, so the
                     originals carry already-queued resource events (`<img onerror>`,
                     `<video>`/`<audio>` error, lazy/`onload`, …); cloning would leave
                     those originals detached but still armed, firing in page scope
                     while the returned tree looked clean. Moving is safe in-place: the
                     root is pre-validated as an allowed tag and so is never the node
                     being removed, which keeps `parentNode` inside the iterator root
                     and the relocated child inside the serialised tree.
                              Otherwise (string / DOM-copy paths): clone. The iterator is rooted
                     at — and the result serialised from — `body`, so a restrictive
                     ALLOWED_TAGS that removes `body` itself must leave its content in
                     place, which only cloning does; and those paths parse into an
                     inert document, so their discarded originals never had a queued
                     event to neutralise.
                              `childNodes` is live; a tail-to-head walk keeps `childNodes[i]`
                     valid whether we move (drops the trailing entry) or clone (leaves
                     the list intact). */
                for (let i = childCount - 1; i >= 0; --i) {
                    const hoisted = IN_PLACE ? childNodes[i] : cloneNode(childNodes[i], true);
                    parentNode.insertBefore(hoisted, getNextSibling(currentNode));
                }
            }
        }
        _forceRemove(currentNode);
        return true;
    };
    /**
     * _sanitizeElements
     *
     * @protect nodeName
     * @protect textContent
     * @protect removeChild
     * @param currentNode to check for permission to exist
     * @return true if node was killed, false if left alive
     */
    // eslint-disable-next-line complexity
    const _sanitizeElements = function _sanitizeElements(currentNode, root) {
        /* Execute a hook if present */
        _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
        /* A hook may have detached the node — treat it as removed (see the
           detached-node comment after the uponSanitizeElement hook below). */
        if (currentNode !== root && getParentNode(currentNode) === null) {
            return true;
        }
        /* Check if element is clobbered or can clobber */
        if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
            return true;
        }
        /* Now let's check the element's type and name */
        const tagName = transformCaseFunc(getNodeName ? getNodeName(currentNode) : currentNode.nodeName);
        /* Execute a hook if present */
        _executeHooks(hooks.uponSanitizeElement, currentNode, {
            tagName,
            allowedTags: ALLOWED_TAGS
        });
        /* A hook may have detached the node from the tree — a long-standing
           user pattern (issue #469; draw.io-style foreignObject filtering).
           Per the cached, unclobberable parentNode getter the node is
           genuinely out of the tree, so it can reach neither the serialized
           output nor an IN_PLACE live tree; treat it as removed and stop
           processing it. Without this guard, the unsafe-node / namespace
           checks below would call _forceRemove on a parentless node and hit
           the REPORT-3 fail-closed throw — which exists for nodes DOMPurify
           wants gone but *cannot* detach (clobbered / parentless roots), the
           opposite of a node that is already safely gone. The walk root is
           exempt: a detached IN_PLACE root is legitimate input and must still
           be fully sanitized, and a kill-decision on it must keep hitting the
           REPORT-3 throw. Nodes detached by hooks are the hook's
           responsibility: they are not recorded in DOMPurify.removed and are
           not neutralized by the post-walk IN_PLACE pass. */
        if (currentNode !== root && getParentNode(currentNode) === null) {
            return true;
        }
        /* Remove mXSS vectors, processing instructions and risky comments */
        if (_isUnsafeNode(currentNode, tagName)) {
            _forceRemove(currentNode);
            return true;
        }
        /* Remove element if anything forbids its presence */
        if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
            const removed = _sanitizeDisallowedNode(currentNode, tagName);
            /* A false return means the node is a custom element kept via
               CUSTOM_ELEMENT_HANDLING - the only keep path through
               _sanitizeDisallowedNode. Run afterSanitizeElements on it so the
               element-hook lifecycle matches normal allowlisted elements: a
               security policy applied in this hook (e.g. stripping an attribute
               from every surviving element) must not silently skip kept custom
               elements (GHSA-c2j3-45gr-mqc4). This mirrors the normal-element
               tail below - the hook runs, then the walker's subsequent
               _sanitizeAttributes pass sanitizes the element's attributes. The
               deliberately skipped namespace and fallback-tag removal checks stay
               skipped; they are removal decisions, not the hook contract. */
            if (removed === false) {
                _executeHooks(hooks.afterSanitizeElements, currentNode, null);
            }
            return removed;
        }
        /* Check whether element has a valid namespace.
           Realm-safe check (GHSA-hpcv-96wg-7vj8): use the cached Node.prototype
           nodeType getter rather than `instanceof Element`, which is realm-
           bound and short-circuits to false for any node minted in a different
           realm — letting a foreign-realm element with a forbidden namespace
           slip past the namespace check entirely. */
        const nt = getNodeType ? getNodeType(currentNode) : currentNode.nodeType;
        if (nt === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
            _forceRemove(currentNode);
            return true;
        }
        /* Make sure that older browsers don't get fallback-tag mXSS */
        if ((tagName === 'noscript' || tagName === 'noembed' || tagName === 'noframes') && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
            _forceRemove(currentNode);
            return true;
        }
        /* Sanitize element content to be template-safe */
        if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
            /* Get the element's text content */
            const content = _stripTemplateExpressions(currentNode.textContent);
            if (currentNode.textContent !== content) {
                arrayPush(DOMPurify.removed, {
                    element: currentNode.cloneNode()
                });
                currentNode.textContent = content;
            }
        }
        /* Execute a hook if present */
        _executeHooks(hooks.afterSanitizeElements, currentNode, null);
        return false;
    };
    /**
     * _isValidAttribute
     *
     * @param lcTag Lowercase tag name of containing element.
     * @param lcName Lowercase attribute name.
     * @param value Attribute value.
     * @return Returns true if `value` is valid, otherwise false.
     */
    // eslint-disable-next-line complexity
    const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
        /* FORBID_ATTR must always win, even if ADD_ATTR predicate would allow it */
        if (FORBID_ATTR[lcName]) {
            return false;
        }
        /* Reject declarative-partial-updates patch-linkage attributes
           (https://github.com/WICG/declarative-partial-updates).
                Empirical note (Chrome 150, verified — see
           test/declarative-patch-probe-v3.html): expansion is NOT applied after
           sanitization. For the string path it fires during sanitize()'s own
           parse, so the walk sees and sanitizes the fully materialized expanded
           tree — teleports into MathML/SVG integration points included; a
           weaponized `<template for>`->`<img onerror>` comes back with the handler
           stripped. For the IN_PLACE path it fires on connection, before the walk.
           Either way DOMPurify is NOT blind to the patch.
                This removal is therefore defense-in-depth rather than the sole barrier:
           it prevents live linkage from surviving into the OUTPUT and re-expanding
           in the caller's context, and keeps behaviour deterministic if a future
           engine defers expansion. `for` is legitimate only on <label>/<output>;
           anywhere else (notably <template for>) it links the element to a patch
           target and teleports or removes an arbitrary DOM range by id/marker name.
           `patchsrc` fetches remote markup and is treated as a script-loading
           mechanism (CSP). Gated on SAFE_FOR_XML so the removal groups with the
           other structural-threat checks and stays overridable, consistent with
           the rest of the codebase. PI range markers are already removed by
           _isUnsafeNode. */
        if (SAFE_FOR_XML && lcName === 'patchsrc') {
            return false;
        }
        if (SAFE_FOR_XML && lcName === 'for' && lcTag !== 'label' && lcTag !== 'output') {
            return false;
        }
        /* Make sure attribute cannot clobber */
        if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
            return false;
        }
        const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
        /* Allow valid data-* attributes: At least one character after "-"
            (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
            XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
            We don't need to check the value; it's always URI safe. */
        if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName))
            ;
        else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName))
            ;
        else if (!nameIsPermitted) {
            if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) ||
                // Alternative, second condition checks if it's an `is`-attribute, AND
                // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
                lcName === 'is' && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value)))
                ;
            else {
                return false;
            }
            /* Check value is safe. First, is attr inert? If so, is safe */
        }
        else if (URI_SAFE_ATTRIBUTES[lcName])
            ;
        else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, '')))
            ;
        else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag])
            ;
        else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, '')))
            ;
        else if (value) {
            return false;
        }
        else
            ;
        return true;
    };
    /* Names the HTML spec reserves from valid-custom-element-name; these must
     * never be treated as basic custom elements even when a permissive
     * CUSTOM_ELEMENT_HANDLING.tagNameCheck is configured. */
    const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ['annotation-xml', 'color-profile', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'missing-glyph']);
    /**
     * _isBasicCustomElement
     * checks if at least one dash is included in tagName, and it's not the first char
     * for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
     *
     * @param tagName name of the tag of the node to sanitize
     * @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
     */
    const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
        return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
    };
    /**
     * Wrap an attribute value in the matching Trusted Types object when
     * the active policy requires it. Namespaced attributes pass through
     * unchanged (no TT support yet, see
     * https://bugs.chromium.org/p/chromium/issues/detail?id=1305293).
     *
     * @param lcTag lowercase tag name of the containing element
     * @param lcName lowercase attribute name
     * @param namespaceURI the attribute's namespace, if any
     * @param value the attribute value to wrap
     * @return the value, wrapped when Trusted Types demand it
     */
    const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value) {
        if (trustedTypesPolicy && typeof trustedTypes === 'object' && typeof trustedTypes.getAttributeType === 'function' && !namespaceURI) {
            switch (trustedTypes.getAttributeType(lcTag, lcName)) {
                case 'TrustedHTML':
                    {
                        return _createTrustedHTML(value);
                    }
                case 'TrustedScriptURL':
                    {
                        return _createTrustedScriptURL(value);
                    }
            }
        }
        return value;
    };
    /**
     * Write a modified attribute value back onto the element. On
     * success, re-probe for clobbering introduced by the new value and
     * remove the element when found; otherwise pop the removal entry
     * recorded by the earlier _removeAttribute (long-standing pairing
     * with the SANITIZE_NAMED_PROPS path - do not "fix" casually). On
     * failure, remove the attribute instead.
     *
     * @param currentNode the element carrying the attribute
     * @param name the attribute name as present on the element
     * @param namespaceURI the attribute's namespace, if any
     * @param value the new attribute value
     */
    const _setAttributeValue = function _setAttributeValue(currentNode, name, namespaceURI, value) {
        try {
            if (namespaceURI) {
                currentNode.setAttributeNS(namespaceURI, name, value);
            }
            else {
                /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
                currentNode.setAttribute(name, value);
            }
            if (_isClobbered(currentNode)) {
                _forceRemove(currentNode);
            }
            else {
                arrayPop(DOMPurify.removed);
            }
        }
        catch (_) {
            _removeAttribute(name, currentNode);
        }
    };
    /**
     * _sanitizeAttributes
     *
     * @protect attributes
     * @protect nodeName
     * @protect removeAttribute
     * @protect setAttribute
     *
     * @param currentNode to sanitize
     */
    const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
        /* Execute a hook if present */
        _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
        const attributes = currentNode.attributes;
        /* Check if we have attributes; if not we might have a text node */
        if (!attributes || _isClobbered(currentNode)) {
            return;
        }
        const hookEvent = {
            attrName: '',
            attrValue: '',
            keepAttr: true,
            allowedAttributes: ALLOWED_ATTR,
            forceKeepAttr: undefined
        };
        let l = attributes.length;
        const lcTag = transformCaseFunc(currentNode.nodeName);
        /* Go backwards over all attributes; safely remove bad ones */
        while (l--) {
            const attr = attributes[l];
            const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
            const lcName = transformCaseFunc(name);
            const initValue = attrValue;
            let value = name === 'value' ? initValue : stringTrim(initValue);
            /* Execute a hook if present */
            hookEvent.attrName = lcName;
            hookEvent.attrValue = value;
            hookEvent.keepAttr = true;
            hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
            _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
            value = hookEvent.attrValue;
            /* Full DOM Clobbering protection via namespace isolation,
             * Prefix id and name attributes with `user-content-`
             */
            if (SANITIZE_NAMED_PROPS && (lcName === 'id' || lcName === 'name') && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
                // Remove the attribute with this value
                _removeAttribute(name, currentNode);
                // Prefix the value and later re-create the attribute with the sanitized value
                value = SANITIZE_NAMED_PROPS_PREFIX + value;
            }
            // Else: already prefixed, leave the attribute alone — the prefix is
            // itself the clobbering protection, and re-applying it is incorrect.
            /* Work around a security issue with comments inside attributes */
            if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
                _removeAttribute(name, currentNode);
                continue;
            }
            /* Make sure we cannot easily use animated hrefs, even if animations are allowed */
            if (lcName === 'attributename' && stringMatch(value, 'href')) {
                _removeAttribute(name, currentNode);
                continue;
            }
            /* Did the hooks force-keep the attribute? */
            if (hookEvent.forceKeepAttr) {
                continue;
            }
            /* Did the hooks approve of the attribute? */
            if (!hookEvent.keepAttr) {
                _removeAttribute(name, currentNode);
                continue;
            }
            /* Work around a security issue in jQuery 3.0 */
            if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
                _removeAttribute(name, currentNode);
                continue;
            }
            /* Sanitize attribute content to be template-safe */
            if (SAFE_FOR_TEMPLATES) {
                value = _stripTemplateExpressions(value);
            }
            /* Is `value` valid for this attribute? */
            if (!_isValidAttribute(lcTag, lcName, value)) {
                _removeAttribute(name, currentNode);
                continue;
            }
            /* Handle attributes that require Trusted Types */
            value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
            /* Handle invalid data-* attribute set by try-catching it */
            if (value !== initValue) {
                _setAttributeValue(currentNode, name, namespaceURI, value);
            }
        }
        /* Execute a hook if present */
        _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
    };
    /**
     * _sanitizeShadowDOM
     *
     * @param fragment to iterate over recursively
     */
    const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
        let shadowNode = null;
        const shadowIterator = _createNodeIterator(fragment);
        /* Execute a hook if present */
        _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
        while (shadowNode = shadowIterator.nextNode()) {
            /* Execute a hook if present */
            _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
            /* Sanitize tags and elements */
            _sanitizeElements(shadowNode, fragment);
            /* Check attributes next */
            _sanitizeAttributes(shadowNode);
            /* Deep shadow DOM detected.
               Realm-safe check (GHSA-hpcv-96wg-7vj8): use nodeType against the
               DOCUMENT_FRAGMENT_NODE constant rather than instanceof, so we
               recurse into <template>.content from foreign realms too. */
            if (_isDocumentFragment(shadowNode.content)) {
                _sanitizeShadowDOM2(shadowNode.content);
            }
            /* An element iterated here may itself host an attached
               shadow root. The default NodeIterator does not enter shadow
               trees, so a shadow root nested inside template.content was
               previously reached by no walk at all (the pre-pass at
               _sanitizeAttachedShadowRoots descends via childNodes, which
               doesn't enter template.content; the template-content recursion
               above iterates the content but never inspected shadowRoot).
               Walk it explicitly. The nodeType guard avoids reading
               shadowRoot off text / comment / CDATA / PI nodes that the
               iterator also surfaces. */
            const shadowNodeType = getNodeType ? getNodeType(shadowNode) : shadowNode.nodeType;
            if (shadowNodeType === NODE_TYPE.element) {
                const innerSr = getShadowRoot(shadowNode);
                if (_isDocumentFragment(innerSr)) {
                    _sanitizeAttachedShadowRoots(innerSr);
                    _sanitizeShadowDOM2(innerSr);
                }
            }
        }
        /* Execute a hook if present */
        _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
    };
    /**
     * _sanitizeAttachedShadowRoots
     *
     * Walks `root` and feeds every attached shadow root we encounter into
     * the existing _sanitizeShadowDOM pipeline. The default node iterator
     * does not descend into shadow trees, so nodes inside an attached
     * shadow root would otherwise be skipped entirely.
     *
     * Two real input paths put attached shadow roots in front of us:
     *   1. IN_PLACE on a DOM node that already has shadow roots attached.
     *   2. DOM-node input where importNode(dirty, true) deep-clones the
     *      shadow root because it was created with `clonable: true`.
     *
     * This pass runs once, up front, so the main iteration loop (and the
     * existing _sanitizeShadowDOM template-content recursion) stay
     * untouched — string-input paths are not affected.
     *
     * @param root the subtree root to walk for attached shadow roots
     */
    const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots(root) {
        /* Iterative (explicit stack) rather than per-child recursion. DOM APIs
           impose no depth cap, so an attacker-shaped tree (JSON/CRDT/editor data
           built straight into the DOM — the IN_PLACE surface) deeper than the JS
           call-stack budget would otherwise overflow native recursion here and
           throw at the IN_PLACE entry pre-pass, before a single node is
           sanitized, leaving the caller's live tree untouched (fail-open). See
           campaign-3 F4. A heap stack keeps depth off the call stack.
                Each work item is either a node to descend into, or a deferred
           `_sanitizeShadowDOM` for an already-walked shadow root. The deferred
           form preserves the original post-order discipline: a shadow root's
           nested shadow roots are discovered before the outer shadow is
           sanitized (which may remove hosts). Pushes are in reverse of the
           desired processing order (LIFO): template content, then children, then
           the shadow-sanitize, then the shadow walk — so the order matches the
           previous recursion exactly. */
        const stack = [{
                node: root,
                shadow: null
            }];
        while (stack.length > 0) {
            const item = stack.pop();
            /* Deferred shadow-DOM sanitisation: runs after its subtree was walked. */
            if (item.shadow) {
                _sanitizeShadowDOM2(item.shadow);
                continue;
            }
            const node = item.node;
            const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
            const isElement = nodeType === NODE_TYPE.element;
            /* (pushed last → processed first) Children, snapshotted in reverse so
               the first child is processed first. Snapshotting matters because a
               hook may detach siblings mid-walk. */
            const childNodes = getChildNodes(node);
            if (childNodes) {
                for (let i = childNodes.length - 1; i >= 0; --i) {
                    stack.push({
                        node: childNodes[i],
                        shadow: null
                    });
                }
            }
            /* (pushed before children → processed after them, matching the old
               "template content last" order) When the node is a <template>,
               descend into its content. */
            if (isElement) {
                const rootName = getNodeName ? getNodeName(node) : null;
                if (typeof rootName === 'string' && transformCaseFunc(rootName) === 'template') {
                    const content = node.content;
                    if (_isDocumentFragment(content)) {
                        stack.push({
                            node: content,
                            shadow: null
                        });
                    }
                }
            }
            /* Shadow root (processed first): walk its subtree, then sanitise it.
               Realm-safe check (GHSA-hpcv-96wg-7vj8): nodeType-based detection
               rather than `instanceof DocumentFragment`, which is realm-bound and
               silently skipped foreign-realm shadow roots (e.g.
               iframe.contentDocument attachShadow). */
            if (isElement) {
                const sr = getShadowRoot(node);
                if (_isDocumentFragment(sr)) {
                    /* Push the deferred sanitise first so it pops after the shadow
                       walk we push next, i.e. nested shadow roots are discovered
                       before this one is sanitised. */
                    stack.push({
                        node: null,
                        shadow: sr
                    }, {
                        node: sr,
                        shadow: null
                    });
                }
            }
        }
    };
    // eslint-disable-next-line complexity
    DOMPurify.sanitize = function (dirty) {
        let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        let body = null;
        let importedNode = null;
        let currentNode = null;
        let returnNode = null;
        /* Make sure we have a string to sanitize.
          DO NOT return early, as this will return the wrong type if
          the user has requested a DOM object rather than a string */
        IS_EMPTY_INPUT = !dirty;
        if (IS_EMPTY_INPUT) {
            dirty = '<!-->';
        }
        /* Stringify, in case dirty is an object */
        if (typeof dirty !== 'string' && !_isNode(dirty)) {
            dirty = stringifyValue(dirty);
            if (typeof dirty !== 'string') {
                throw typeErrorCreate('dirty is not a string, aborting');
            }
        }
        /* Return dirty HTML if DOMPurify cannot run */
        if (!DOMPurify.isSupported) {
            return dirty;
        }
        /* Assign config vars */
        if (SET_CONFIG) {
            /* Persistent setConfig() path: _parseConfig is skipped, so the sets are
             * not re-derived per call. Restore them from the pristine bindings
             * captured at setConfig() time so a previous call's hook clone (mutated
             * below) does not carry over. */
            ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
            ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
        }
        else {
            _parseConfig(cfg);
        }
        /* Clone the hook-mutable allowlists before the walk whenever an
         * uponSanitize* hook is registered. The hook event exposes ALLOWED_TAGS
         * and ALLOWED_ATTR by reference (as allowedTags / allowedAttributes), so
         * a hook that widens them would otherwise mutate the shared set
         * permanently: across later calls and across every element. Cloning per
         * walk keeps documented in-call widening working while scoping it to the
         * call. A single guard for both config paths - the per-call path rebinds
         * the sets in _parseConfig each call, the persistent path restores them
         * from the captured bindings just above - so the two cannot diverge. */
        if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) {
            ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        if (hooks.uponSanitizeAttribute.length > 0) {
            ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        /* Clean up removed elements */
        DOMPurify.removed = [];
        /* Resolve IN_PLACE for this call without mutating persistent config.
           Writing the IN_PLACE closure variable here leaks under setConfig(),
           where _parseConfig is skipped on later calls: a single string call would
           disable in-place mode for every subsequent node call, returning a
           sanitized copy while leaving the caller's node — which in-place callers
           keep using and whose return value they ignore — unsanitized. REPORT-2. */
        const inPlace = IN_PLACE && typeof dirty !== 'string' && _isNode(dirty);
        if (inPlace) {
            /* Declarative-partial-updates / streaming pre-pass: sever every patch
               linkage across the live tree BEFORE the walk, so no patch can fire
               mid-walk and inject into an already-processed region. Runs first, so
               it also covers the forbidden/clobbered roots that throw below. */
            _neutralizePatchLinkage(dirty);
            /* Do some early pre-sanitization to avoid unsafe root nodes.
               Read nodeName through the cached prototype getter — a clobbering
               child named "nodeName" on the form root would otherwise shadow
               the property and let this check skip the root-allowlist
               validation entirely. */
            const nn = getNodeName ? getNodeName(dirty) : dirty.nodeName;
            if (typeof nn === 'string') {
                const tagName = transformCaseFunc(nn);
                if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
                    /* Fail closed on a live root: neutralize handlers/children before
                       throwing, exactly as the mid-walk abort path does. */
                    _neutralizeRoot(dirty);
                    throw typeErrorCreate('root node is forbidden and cannot be sanitized in-place');
                }
            }
            /* Pre-flight the root through _isClobbered. The iterator-driven
               removal path can not detach a parent-less root: _forceRemove
               falls through to Element.prototype.remove(), which per spec
               is a no-op on a node with no parent. A clobbered root would
               then survive the main loop with its attributes uninspected,
               because _sanitizeAttributes early-returns on _isClobbered. The
               result would be an attacker-controlled form, complete with any
               event-handler attributes the caller passed in, handed back to
               the application unsanitized. Refuse to sanitize such a root
               the same way we refuse a forbidden tag. GHSA-r47g-fvhr-h676. */
            if (_isClobbered(dirty)) {
                /* Fail closed on a live clobbered root before throwing.
                   _neutralizeRoot's reads are clobber-safe (cached getters); the
                   form's non-clobbered descendants, e.g. an armed <img>, are scrubbed. */
                _neutralizeRoot(dirty);
                throw typeErrorCreate('root node is clobbered and cannot be sanitized in-place');
            }
            /* Sanitize attached shadow roots before the main iterator runs.
               The iterator does not descend into shadow trees. Same fail-closed
               barrier as the main walk (campaign-3 F2): a custom-element reaction
               inside a shadow root could abort this pre-pass before the walk runs,
               which would otherwise leave the entire live tree unsanitized. */
            try {
                _sanitizeAttachedShadowRoots(dirty);
            }
            catch (error) {
                _neutralizeRoot(dirty);
                throw error;
            }
        }
        else if (_isNode(dirty)) {
            /* If dirty is a DOM element, append to an empty document to avoid
               elements being stripped by the parser */
            body = _initDocument('<!---->');
            importedNode = body.ownerDocument.importNode(dirty, true);
            if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === 'BODY') {
                /* Node is already a body, use as is */
                body = importedNode;
            }
            else if (importedNode.nodeName === 'HTML') {
                body = importedNode;
            }
            else {
                // eslint-disable-next-line unicorn/prefer-dom-node-append
                body.appendChild(importedNode);
            }
            /* Clonable shadow roots are deep-cloned by importNode(); sanitize
               them before the main iterator runs, since the iterator does not
               descend into shadow trees. The walk routes every read through a
               cached prototype getter so clobbering descendants on a form root
               cannot hide a shadow host from this pass. */
            _sanitizeAttachedShadowRoots(importedNode);
        }
        else {
            /* Exit directly if we have nothing to do */
            if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
                // eslint-disable-next-line unicorn/prefer-includes
                dirty.indexOf('<') === -1) {
                return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
            }
            /* Initialize the document to work on */
            body = _initDocument(dirty);
            /* Check we have a DOM node from the data */
            if (!body) {
                return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : '';
            }
        }
        /* Remove first element node (ours) if FORCE_BODY is set */
        if (body && FORCE_BODY) {
            _forceRemove(body.firstChild);
        }
        /* Get node iterator */
        const walkRoot = inPlace ? dirty : body;
        const nodeIterator = _createNodeIterator(walkRoot);
        /* Now start iterating over the created document.
           The walk runs inside an exception barrier (campaign-3 F2): a re-entrant
           engine/custom-element mutation can detach a node mid-walk so
           `_forceRemove`'s parentless guard throws, aborting the loop. Without the
           barrier the caller's in-place tree would be left half-sanitized with the
           unvisited tail still armed. On any throw we fail closed — strip the
           in-place root bare — then rethrow so the existing throw contract is
           preserved. (String/DOM-copy paths never return the partial body, so the
           propagating throw is already fail-closed there.) */
        try {
            while (currentNode = nodeIterator.nextNode()) {
                /* Sanitize tags and elements */
                _sanitizeElements(currentNode, walkRoot);
                /* Check attributes next */
                _sanitizeAttributes(currentNode);
                /* Shadow DOM detected, sanitize it.
                   Realm-safe check (GHSA-hpcv-96wg-7vj8): nodeType-based detection
                   instead of instanceof, so foreign-realm <template>.content is
                   walked correctly. */
                if (_isDocumentFragment(currentNode.content)) {
                    _sanitizeShadowDOM2(currentNode.content);
                }
            }
        }
        catch (error) {
            if (inPlace) {
                _neutralizeRoot(dirty);
                /* Nodes _forceRemove'd earlier in the aborted walk are already
                   detached from the root, so _neutralizeRoot's subtree pass does not
                   reach them. Defuse them too, mirroring the success-path loop below. */
                arrayForEach(DOMPurify.removed, entry => {
                    if (entry.element) {
                        _neutralizeSubtree(entry.element);
                    }
                });
            }
            throw error;
        }
        /* If we sanitized `dirty` in-place, return it. */
        if (inPlace) {
            /* Fail-closed completion of the audit-5 F1 fix: every node removed from
               the caller's live tree is detached but may still hold a queued
               resource-event handler that fires in page scope after we return. The
               move-hoist covers only disallowed-tag KEEP_CONTENT removals; strip the
               non-allow-listed attributes off every other removed subtree (clobber,
               mXSS, namespace, comments, KEEP_CONTENT:false, …) so those handlers are
               cancelled before any event can fire. Runs synchronously, pre-return. */
            arrayForEach(DOMPurify.removed, entry => {
                if (entry.element) {
                    _neutralizeSubtree(entry.element);
                }
            });
            if (SAFE_FOR_TEMPLATES) {
                _scrubTemplateExpressions2(dirty);
            }
            return dirty;
        }
        /* Return sanitized string or DOM */
        if (RETURN_DOM) {
            if (SAFE_FOR_TEMPLATES) {
                _scrubTemplateExpressions2(body);
            }
            if (RETURN_DOM_FRAGMENT) {
                returnNode = createDocumentFragment.call(body.ownerDocument);
                while (body.firstChild) {
                    // eslint-disable-next-line unicorn/prefer-dom-node-append
                    returnNode.appendChild(body.firstChild);
                }
            }
            else {
                returnNode = body;
            }
            if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
                /*
                  AdoptNode() is not used because internal state is not reset
                  (e.g. the past names map of a HTMLFormElement), this is safe
                  in theory but we would rather not risk another attack vector.
                  The state that is cloned by importNode() is explicitly defined
                  by the specs.
                */
                returnNode = importNode.call(originalDocument, returnNode, true);
            }
            return returnNode;
        }
        let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
        /* Serialize doctype if allowed */
        if (WHOLE_DOCUMENT && ALLOWED_TAGS['!doctype'] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
            serializedHTML = '<!DOCTYPE ' + body.ownerDocument.doctype.name + '>\n' + serializedHTML;
        }
        /* Sanitize final string template-safe */
        if (SAFE_FOR_TEMPLATES) {
            serializedHTML = _stripTemplateExpressions(serializedHTML);
        }
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
    };
    DOMPurify.setConfig = function () {
        let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        _parseConfig(cfg);
        SET_CONFIG = true;
        SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
        SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
    };
    DOMPurify.clearConfig = function () {
        CONFIG = null;
        SET_CONFIG = false;
        SET_CONFIG_ALLOWED_TAGS = null;
        SET_CONFIG_ALLOWED_ATTR = null;
        // Drop any caller-supplied Trusted Types policy so it cannot poison later
        // `RETURN_TRUSTED_TYPE` output. The internal default policy (cached, and
        // never recreated — Trusted Types throws on duplicate names) is restored by
        // the next `_parseConfig`. See GHSA-vxr8-fq34-vvx9.
        trustedTypesPolicy = defaultTrustedTypesPolicy;
        emptyHTML = '';
    };
    DOMPurify.isValidAttribute = function (tag, attr, value) {
        /* Initialize shared config vars if necessary. */
        if (!CONFIG) {
            _parseConfig({});
        }
        const lcTag = transformCaseFunc(tag);
        const lcName = transformCaseFunc(attr);
        return _isValidAttribute(lcTag, lcName, value);
    };
    DOMPurify.addHook = function (entryPoint, hookFunction) {
        if (typeof hookFunction !== 'function') {
            return;
        }
        /* Reject unknown entry points. Without this, a non-hook key (e.g.
         * '__proto__') indexes off the prototype chain rather than a real
         * hook array, and arrayPush then writes to Object.prototype. Guard
         * with an own-property check against the known hook names. */
        if (!objectHasOwnProperty(hooks, entryPoint)) {
            return;
        }
        arrayPush(hooks[entryPoint], hookFunction);
    };
    DOMPurify.removeHook = function (entryPoint, hookFunction) {
        if (!objectHasOwnProperty(hooks, entryPoint)) {
            return undefined;
        }
        if (hookFunction !== undefined) {
            const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
            return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
        }
        return arrayPop(hooks[entryPoint]);
    };
    DOMPurify.removeHooks = function (entryPoint) {
        if (!objectHasOwnProperty(hooks, entryPoint)) {
            return;
        }
        hooks[entryPoint] = [];
    };
    DOMPurify.removeAllHooks = function () {
        hooks = _createHooksMap();
    };
    return DOMPurify;
}
var purify = createDOMPurify();
exports.default = purify;
//# sourceMappingURL=purify.es.mjs.map

}};const __libCache={};function __oldRequire(i){if(__libCache[i])return __libCache[i].exports;const m={exports:{}};__libCache[i]=m;__libs[i](m,m.exports,__oldRequire);return m.exports};function __externalContent(s){const ids={turndown:1,marked:2,dompurify:3};if(ids[s])return __oldRequire(ids[s]);throw Error('Unknown dependency '+s)}
const __modules={"src/shared/types":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"src/shared/storage":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSLATION_LOG_RETENTION_MS = exports.TRANSLATION_LOG_MAX_ENTRIES = exports.DEFAULT_SETTINGS = void 0;
exports.hasStorageContext = hasStorageContext;
exports.getSettings = getSettings;
exports.setSettings = setSettings;
exports.getSetting = getSetting;
exports.getHistory = getHistory;
exports.addHistoryEntry = addHistoryEntry;
exports.updateHistoryFavorite = updateHistoryFavorite;
exports.removeHistoryEntry = removeHistoryEntry;
exports.clearHistory = clearHistory;
exports.getTranslationLogs = getTranslationLogs;
exports.addTranslationLog = addTranslationLog;
exports.flushTranslationLogWrites = flushTranslationLogWrites;
exports.clearTranslationLogs = clearTranslationLogs;
exports.DEFAULT_SETTINGS = {
    activeProvider: "mistral",
    providers: {
        mistral: { apiKeys: "", selectedModel: "mistral-small-latest" },
        groq: { apiKeys: "", selectedModel: "openai/gpt-oss-20b" },
        cerebras: { apiKeys: "", selectedModel: "gpt-oss-120b" },
        openai: { apiKeys: "", selectedModel: "gpt-4o-mini" },
        anthropic: { apiKeys: "", selectedModel: "claude-3-haiku-20240307" },
        gemini: { apiKeys: "", selectedModel: "gemini-2.0-flash" },
    },
    defaultTargetLanguage: "ru",
    llmEnabled: true,
    fallbackProvider: "auto",
    libreTranslateEndpoint: "",
    excludedSites: [],
    theme: "system",
    overlayTheme: "system",
    accentColor: "pink",
    fontSize: "medium",
    compactMode: false,
    showExamples: true,
};
const SYNC_KEYS = [
    "theme",
    "overlayTheme",
    "accentColor",
    "fontSize",
    "compactMode",
    "showExamples",
    "defaultTargetLanguage",
    "llmEnabled",
    "fallbackProvider",
    "libreTranslateEndpoint",
    "activeProvider",
];
function cloneDefaultSettings() {
    return {
        ...exports.DEFAULT_SETTINGS,
        providers: {
            mistral: { ...exports.DEFAULT_SETTINGS.providers.mistral },
            groq: { ...exports.DEFAULT_SETTINGS.providers.groq },
            cerebras: { ...exports.DEFAULT_SETTINGS.providers.cerebras },
            openai: { ...exports.DEFAULT_SETTINGS.providers.openai },
            anthropic: { ...exports.DEFAULT_SETTINGS.providers.anthropic },
            gemini: { ...exports.DEFAULT_SETTINGS.providers.gemini },
        },
        excludedSites: [...exports.DEFAULT_SETTINGS.excludedSites],
    };
}
function hasStorageContext() {
    return (typeof chrome !== "undefined" &&
        Boolean(chrome.runtime?.id) &&
        Boolean(chrome.storage?.sync) &&
        Boolean(chrome.storage?.local));
}
async function getSettings() {
    if (!hasStorageContext()) {
        return cloneDefaultSettings();
    }
    try {
        // 1. Fetch sync and local storage simultaneously
        const [syncRes, localRes] = await Promise.all([
            chrome.storage.sync.get(["settings", ...SYNC_KEYS]),
            chrome.storage.local.get(["settings", "providers", "excludedSites"]),
        ]);
        const legacySyncSettings = syncRes.settings || {};
        const legacyLocalSettings = localRes.settings || {};
        // 2. Resolve providers (local > legacyLocal > legacySync > DEFAULT)
        let storedProviders = localRes.providers || legacyLocalSettings.providers || legacySyncSettings.providers;
        // Check if migration is needed from sync to local
        let shouldSaveLocal = false;
        const localMigrationPayload = {};
        if (!localRes.providers && storedProviders) {
            localMigrationPayload.providers = storedProviders;
            shouldSaveLocal = true;
        }
        // 3. Resolve excludedSites (local > legacyLocal > legacySync > DEFAULT)
        let storedExcludedSites = localRes.excludedSites || legacyLocalSettings.excludedSites || legacySyncSettings.excludedSites;
        if (!localRes.excludedSites && storedExcludedSites) {
            localMigrationPayload.excludedSites = storedExcludedSites;
            shouldSaveLocal = true;
        }
        if (shouldSaveLocal) {
            chrome.storage.local.set(localMigrationPayload).catch(() => { });
        }
        // If legacy sync settings contain heavy keys, clean up sync storage
        if (legacySyncSettings.providers || legacySyncSettings.excludedSites) {
            const cleanSyncSettings = { ...legacySyncSettings };
            delete cleanSyncSettings.providers;
            delete cleanSyncSettings.excludedSites;
            chrome.storage.sync.set({ settings: cleanSyncSettings }).catch(() => { });
        }
        // 4. Merge provider configurations
        const mergedProviders = {
            mistral: { ...exports.DEFAULT_SETTINGS.providers.mistral },
            groq: { ...exports.DEFAULT_SETTINGS.providers.groq },
            cerebras: { ...exports.DEFAULT_SETTINGS.providers.cerebras },
            openai: { ...exports.DEFAULT_SETTINGS.providers.openai },
            anthropic: { ...exports.DEFAULT_SETTINGS.providers.anthropic },
            gemini: { ...exports.DEFAULT_SETTINGS.providers.gemini },
        };
        if (storedProviders) {
            for (const [key, val] of Object.entries(storedProviders)) {
                const providerKey = key;
                if (mergedProviders[providerKey]) {
                    mergedProviders[providerKey] = {
                        ...mergedProviders[providerKey],
                        ...val,
                    };
                }
            }
        }
        // 5. Merge sync settings
        const mergedSyncSettings = {};
        for (const key of SYNC_KEYS) {
            if (syncRes[key] !== undefined) {
                mergedSyncSettings[key] = syncRes[key];
            }
            else if (legacySyncSettings[key] !== undefined) {
                mergedSyncSettings[key] = legacySyncSettings[key];
            }
            else if (legacyLocalSettings[key] !== undefined) {
                mergedSyncSettings[key] = legacyLocalSettings[key];
            }
        }
        // Migration from v1.1.4: the old global theme controlled both popup and
        // floating translator. Preserve that appearance once, then keep the two
        // preferences independent (including after popup theme toggles).
        if (mergedSyncSettings.overlayTheme === undefined) {
            const legacyTheme = mergedSyncSettings.theme;
            const overlayTheme = legacyTheme === "light" || legacyTheme === "dark" || legacyTheme === "system"
                ? legacyTheme : exports.DEFAULT_SETTINGS.overlayTheme;
            mergedSyncSettings.overlayTheme = overlayTheme;
            // Failure to sync a new appearance preference must not make the rest
            // of the stored provider/translation settings appear to be missing.
            try {
                await chrome.storage.sync.set({ overlayTheme });
            }
            catch (error) {
                console.warn("[LinguaPop] Could not persist migrated overlay theme:", error);
            }
        }
        const rawFallback = mergedSyncSettings.fallbackProvider;
        const normalizedFallback = rawFallback === "none" ? "none" : "auto";
        return {
            ...exports.DEFAULT_SETTINGS,
            ...mergedSyncSettings,
            fallbackProvider: normalizedFallback,
            providers: mergedProviders,
            excludedSites: Array.isArray(storedExcludedSites)
                ? storedExcludedSites
                : exports.DEFAULT_SETTINGS.excludedSites,
        };
    }
    catch (err) {
        console.error("[LinguaPop] getSettings error:", err);
        return cloneDefaultSettings();
    }
}
let settingsWriteQueue = Promise.resolve();
async function setSettings(settings) {
    const write = settingsWriteQueue.catch(() => { }).then(() => writeSettings(settings));
    settingsWriteQueue = write;
    await write;
}
async function writeSettings(settings) {
    try {
        const current = await getSettings();
        const updated = { ...current, ...settings };
        // Deep merge providers if provided in partial settings
        if (settings.providers) {
            updated.providers = {
                ...current.providers,
            };
            for (const [k, v] of Object.entries(settings.providers)) {
                const pKey = k;
                updated.providers[pKey] = {
                    ...(current.providers[pKey] || exports.DEFAULT_SETTINGS.providers[pKey]),
                    ...v,
                };
            }
        }
        // 1. Prepare sync storage updates
        const syncData = {};
        for (const key of SYNC_KEYS) {
            if (Object.prototype.hasOwnProperty.call(settings, key) && settings[key] !== undefined) {
                syncData[key] = settings[key];
            }
        }
        // 2. Prepare local storage updates (heavy & private data)
        const localPayload = {};
        if (settings.providers)
            localPayload.providers = updated.providers;
        if (settings.excludedSites)
            localPayload.excludedSites = updated.excludedSites;
        await Promise.all([
            chrome.storage.sync.set(syncData),
            Object.keys(localPayload).length ? chrome.storage.local.set(localPayload) : Promise.resolve(),
        ]);
    }
    catch (err) {
        console.error("[LinguaPop] setSettings error:", err);
        throw err;
    }
}
async function getSetting(key) {
    const settings = await getSettings();
    return settings[key];
}
// Popup history is distinct from the removed Writing Assistant history.
const HISTORY_KEY = "popupTranslationHistory";
let historyWriteQueue = Promise.resolve();
async function getHistory() {
    const data = await chrome.storage.local.get(HISTORY_KEY);
    return Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
}
async function updateHistory(change) {
    const job = historyWriteQueue.catch(() => { }).then(async () => {
        const old = await getHistory();
        await chrome.storage.local.set({ [HISTORY_KEY]: change(old) });
    });
    historyWriteQueue = job;
    await job;
}
async function addHistoryEntry(entry) {
    await updateHistory((items) => {
        const withoutDuplicate = items.filter((item) => item.id !== entry.id);
        const list = [entry, ...withoutDuplicate];
        while (list.length > 500) {
            const idx = list.findLastIndex((item) => !item.favorite);
            if (idx < 0)
                list.pop();
            else
                list.splice(idx, 1);
        }
        return list;
    });
}
async function updateHistoryFavorite(id, favorite) {
    await updateHistory((items) => items.map((item) => item.id === id ? { ...item, favorite } : item));
}
async function removeHistoryEntry(id) {
    await updateHistory((items) => items.filter((item) => item.id !== id));
}
async function clearHistory() { await updateHistory(() => []); }
const TRANSLATION_LOG_KEY = "translationLogs";
exports.TRANSLATION_LOG_MAX_ENTRIES = 500;
exports.TRANSLATION_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
let translationLogWriteQueue = Promise.resolve();
function pruneTranslationLogs(logs, now = Date.now()) {
    const cutoff = now - exports.TRANSLATION_LOG_RETENTION_MS;
    return logs
        .filter((item) => Number(item?.timestamp) >= cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, exports.TRANSLATION_LOG_MAX_ENTRIES);
}
async function getTranslationLogs() {
    try {
        const result = await chrome.storage.local.get(TRANSLATION_LOG_KEY);
        const current = Array.isArray(result[TRANSLATION_LOG_KEY])
            ? result[TRANSLATION_LOG_KEY]
            : [];
        const pruned = pruneTranslationLogs(current);
        if (pruned.length !== current.length) {
            await chrome.storage.local.set({ [TRANSLATION_LOG_KEY]: pruned });
        }
        return pruned;
    }
    catch {
        return [];
    }
}
async function writeTranslationLog(entry) {
    const result = await chrome.storage.local.get(TRANSLATION_LOG_KEY);
    const current = Array.isArray(result[TRANSLATION_LOG_KEY])
        ? result[TRANSLATION_LOG_KEY]
        : [];
    const next = pruneTranslationLogs([entry, ...current]);
    await chrome.storage.local.set({ [TRANSLATION_LOG_KEY]: next });
}
function addTranslationLog(entry) {
    translationLogWriteQueue = translationLogWriteQueue
        .catch(() => { })
        .then(() => writeTranslationLog(entry));
    return translationLogWriteQueue;
}
async function flushTranslationLogWrites() {
    await translationLogWriteQueue.catch(() => { });
}
async function clearTranslationLogs() {
    await flushTranslationLogWrites();
    await chrome.storage.local.remove(TRANSLATION_LOG_KEY);
}

},
"src/shared/tts/tts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpeaking = isSpeaking;
exports.stopSpeaking = stopSpeaking;
exports.speak = speak;
let sharedAudioContext = null;
let currentAudioSource = null;
let currentAudioElement = null;
let speaking = false;
function getOrCreateAudioContext() {
    if (typeof window === "undefined")
        return null;
    if (!sharedAudioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            sharedAudioContext = new AudioContextClass();
        }
    }
    return sharedAudioContext;
}
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function isSpeaking() {
    return speaking;
}
function stopSpeaking() {
    speaking = false;
    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
            currentAudioSource.disconnect();
        }
        catch { }
        currentAudioSource = null;
    }
    if (currentAudioElement) {
        try {
            currentAudioElement.pause();
            currentAudioElement.currentTime = 0;
        }
        catch { }
        currentAudioElement = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
        }
        catch { }
    }
}
function splitTextIntoChunks(text, maxLen = 180) {
    const trimmed = text.trim();
    if (trimmed.length <= maxLen)
        return [trimmed];
    const chunks = [];
    const sentences = trimmed.match(/[^.!?\n]+[.!?\n]*/g) || [trimmed];
    let current = "";
    for (const sentence of sentences) {
        if ((current + sentence).length <= maxLen) {
            current += sentence;
        }
        else {
            if (current.trim()) {
                chunks.push(current.trim());
                current = "";
            }
            if (sentence.length <= maxLen) {
                current = sentence;
            }
            else {
                const words = sentence.split(/\s+/);
                for (const word of words) {
                    if ((current + " " + word).trim().length <= maxLen) {
                        current = (current + " " + word).trim();
                    }
                    else {
                        if (current.trim())
                            chunks.push(current.trim());
                        current = word;
                    }
                }
            }
        }
    }
    if (current.trim())
        chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [trimmed.slice(0, maxLen)];
}
async function fetchTTSAudio(text, lang) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
    return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: "FETCH_TTS", url }, (res) => {
                if (chrome.runtime.lastError || !res?.success) {
                    resolve({});
                }
                else {
                    resolve(res);
                }
            });
        }
        else {
            resolve({});
        }
    });
}
async function playAudioBuffer(arrayBuffer, ctx) {
    if (ctx.state === "suspended") {
        await ctx.resume();
    }
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    if (!speaking)
        return;
    return new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            if (currentAudioSource === source) {
                currentAudioSource = null;
            }
            resolve();
        };
        currentAudioSource = source;
        source.start();
    });
}
async function playAudioElement(dataUrl) {
    return new Promise((resolve, reject) => {
        if (typeof Audio === "undefined") {
            reject(new Error("HTMLAudioElement not supported"));
            return;
        }
        const audio = new Audio(dataUrl);
        currentAudioElement = audio;
        audio.onended = () => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            resolve();
        };
        audio.onerror = () => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            reject(new Error("Audio playback failed"));
        };
        audio.play().catch((err) => {
            if (currentAudioElement === audio) {
                currentAudioElement = null;
            }
            reject(err);
        });
    });
}
async function speak(text, lang = "en") {
    stopSpeaking();
    if (!text || !text.trim() || lang === "unknown")
        return;
    speaking = true;
    const targetLang = lang.toLowerCase().trim() || "en";
    // Pre-initialize and resume AudioContext synchronously inside user gesture
    const audioContext = getOrCreateAudioContext();
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => { });
    }
    const chunks = splitTextIntoChunks(text, 180);
    try {
        for (const chunk of chunks) {
            if (!speaking)
                break;
            const response = await fetchTTSAudio(chunk, targetLang);
            if (!response.dataUrl && !response.base64) {
                throw new Error("TTS fetch failed");
            }
            if (!speaking)
                break;
            if (response.dataUrl) {
                try {
                    await playAudioElement(response.dataUrl);
                    continue;
                }
                catch { }
            }
            const base64 = response.base64 || response.dataUrl?.split(",")[1];
            if (base64 && audioContext) {
                const arrayBuffer = base64ToArrayBuffer(base64);
                await playAudioBuffer(arrayBuffer, audioContext);
            }
            else {
                throw new Error("No audio playback method available");
            }
        }
    }
    catch (error) {
        console.warn("[LinguaPop] Audio playback failed, falling back to Web Speech:", error);
        if (speaking) {
            await fallbackSpeak(text, targetLang);
            return;
        }
    }
    speaking = false;
}
function getVoicesAsync() {
    return new Promise((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            resolve([]);
            return;
        }
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        let resolved = false;
        const onVoicesChanged = () => {
            if (resolved)
                return;
            resolved = true;
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
        setTimeout(() => {
            if (resolved)
                return;
            resolved = true;
            window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        }, 300);
    });
}
async function fallbackSpeak(text, lang) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
        speaking = false;
        return;
    }
    const voices = await getVoicesAsync();
    if (!speaking)
        return;
    const targetPrefix = lang.toLowerCase();
    const preferredVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix) &&
        (v.name.includes("Google") ||
            v.name.includes("Premium") ||
            v.name.includes("Natural"))) || voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
    const chunks = splitTextIntoChunks(text, 180);
    for (const chunk of chunks) {
        if (!speaking)
            break;
        await new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (preferredVoice)
                utterance.voice = preferredVoice;
            utterance.lang = lang;
            utterance.rate = 0.95;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    }
    speaking = false;
}

},
"src/shared/pageTranslation":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldContinuePageTranslation = shouldContinuePageTranslation;
exports.createPageTranslationBatches = createPageTranslationBatches;
exports.recoverPageBatchTranslations = recoverPageBatchTranslations;
function shouldContinuePageTranslation(input) {
    const maxPasses = Math.max(1, input.maxPasses ?? 8);
    if (input.remaining <= 0)
        return false;
    if (input.completedPasses >= maxPasses)
        return false;
    if (input.consecutiveNoProgressPasses >= 2)
        return false;
    return true;
}
function createPageTranslationBatches(items, getLength, options = {}) {
    const maxChars = Math.max(1, options.maxChars ?? 700);
    const maxItems = Math.max(1, options.maxItems ?? 10);
    const batches = [];
    let current = [];
    let currentChars = 0;
    for (const item of items) {
        const itemLength = Math.max(0, getLength(item));
        const wouldOverflowChars = current.length > 0 && currentChars + itemLength > maxChars;
        const wouldOverflowItems = current.length >= maxItems;
        if (wouldOverflowChars || wouldOverflowItems) {
            batches.push(current);
            current = [];
            currentChars = 0;
        }
        current.push(item);
        currentChars += itemLength;
    }
    if (current.length > 0)
        batches.push(current);
    return batches;
}
function isTransientBatchError(error) {
    const value = (error || "").toLowerCase();
    return (value.includes("rate_limit") ||
        value.includes("request_timeout") ||
        value.includes("network_error") ||
        value.includes("api_error") ||
        /\b(?:429|5\d\d)\b/.test(value));
}
function sleep(ms) {
    if (ms <= 0)
        return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function recoverPageBatchTranslations(texts, sendBatch, options = {}) {
    const retryDelay = Math.max(0, options.transientRetryDelayMs ?? 650);
    const maxDepth = Math.max(0, options.maxDepth ?? 5);
    const recover = async (chunk, depth) => {
        if (chunk.length === 0)
            return [];
        let response = await sendBatch(chunk);
        if (!response.success && isTransientBatchError(response.error)) {
            await sleep(retryDelay);
            response = await sendBatch(chunk);
            // A second transient failure on a multi-item batch often means the
            // request is too large/slow or the provider is rate-limiting bursts.
            // Split it instead of dropping the whole batch.
            if (!response.success && isTransientBatchError(response.error)) {
                if (chunk.length > 1 && depth < maxDepth) {
                    const middle = Math.ceil(chunk.length / 2);
                    const left = await recover(chunk.slice(0, middle), depth + 1);
                    const right = await recover(chunk.slice(middle), depth + 1);
                    return [...left, ...right];
                }
                // For a single text, allow one final attempt. This is cheap and avoids
                // leaving isolated labels untranslated after a short network wobble.
                if (chunk.length === 1) {
                    await sleep(retryDelay);
                    response = await sendBatch(chunk);
                }
            }
        }
        if (response.success && Array.isArray(response.translations)) {
            const translations = response.translations.map((item) => String(item ?? ""));
            if (translations.length === chunk.length) {
                const missingIndexes = translations
                    .map((value, index) => ({ value, index }))
                    .filter(({ value, index }) => chunk[index].trim() && !value.trim())
                    .map(({ index }) => index);
                if (missingIndexes.length === 0 || depth >= maxDepth) {
                    return translations;
                }
                const missingTexts = missingIndexes.map((index) => chunk[index]);
                const recoveredMissing = await recover(missingTexts, depth + 1);
                const merged = [...translations];
                missingIndexes.forEach((originalIndex, recoveredIndex) => {
                    if (recoveredMissing[recoveredIndex]?.trim()) {
                        merged[originalIndex] = recoveredMissing[recoveredIndex];
                    }
                });
                return merged;
            }
            // Models occasionally collapse a JSON array into one answer. Smaller
            // batches are substantially more reliable and keep DOM alignment exact.
            if (chunk.length > 1 && depth < maxDepth) {
                const middle = Math.ceil(chunk.length / 2);
                const left = await recover(chunk.slice(0, middle), depth + 1);
                const right = await recover(chunk.slice(middle), depth + 1);
                return [...left, ...right];
            }
        }
        // Authentication/model/configuration failures are not improved by splitting.
        // Keep exact alignment so a later page pass can retry only the missing nodes.
        return new Array(chunk.length).fill("");
    };
    return recover(texts, 0);
}

},
"src/shared/network":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
async function fetchWithTimeout(input, options = {}) {
    const { timeoutMs = 8000, signal: upstreamSignal, ...init } = options;
    const controller = new AbortController();
    let timedOut = false;
    const abortFromUpstream = () => {
        controller.abort(upstreamSignal?.reason);
    };
    if (upstreamSignal?.aborted) {
        abortFromUpstream();
    }
    else if (upstreamSignal) {
        upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    }
    const timer = timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, timeoutMs)
        : null;
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (upstreamSignal?.aborted) {
            throw new Error("request_aborted");
        }
        if (timedOut) {
            throw new Error("request_timeout");
        }
        if (controller.signal.aborted) {
            throw new Error("request_aborted");
        }
        const detail = error instanceof Error && error.message ? `: ${error.message}` : "";
        throw new Error(`network_error${detail}`);
    }
    finally {
        if (timer !== null) {
            clearTimeout(timer);
        }
        upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    }
}

},
"src/shared/language":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_NAMES = void 0;
exports.getLanguageName = getLanguageName;
exports.detectLanguage = detectLanguage;
exports.determineTargetLanguage = determineTargetLanguage;
exports.LANGUAGE_NAMES = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    de: "German",
    fr: "French",
    it: "Italian",
    pt: "Portuguese",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    tr: "Turkish",
    uk: "Ukrainian",
    pl: "Polish",
    nl: "Dutch",
    sv: "Swedish",
    fi: "Finnish",
    el: "Greek",
    he: "Hebrew",
    th: "Thai",
    vi: "Vietnamese",
    cs: "Czech",
    id: "Indonesian",
};
const SPANISH_COMMON_WORDS = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "pero",
    "por", "para", "con", "como", "en", "es", "son", "este", "esta", "esto",
    "estos", "estas", "que", "del", "al", "hola", "gracias", "bueno", "buena",
    "buenos", "buenas", "bien", "si", "no", "amigo", "amiga", "nosotros",
    "ellos", "ellas", "hacer", "tener", "estar", "ser", "mas", "todo", "todos",
    "toda", "todas", "muy", "mucho", "muchos", "donde", "cuando", "quien", "porque",
    "tambien", "nada", "casa", "dia", "tiempo", "ano", "vida", "hombre", "mujer",
]);
const FRENCH_COMMON_WORDS = new Set([
    "le", "la", "les", "un", "une", "des", "et", "ou", "mais", "pour", "avec",
    "comme", "dans", "est", "sont", "ce", "cette", "ces", "que", "qui", "du",
    "au", "aux", "bonjour", "merci", "bien", "oui", "non", "nous", "vous",
    "ils", "elles", "faire", "avoir", "etre", "suis", "es", "sommes", "etes",
    "plus", "tout", "tous", "toute", "toutes", "tres", "beaucoup", "quand",
    "pourquoi", "aussi", "rien", "maison", "jour", "temps", "vie", "homme", "femme",
]);
const GERMAN_COMMON_WORDS = new Set([
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "eines",
    "einem", "einen", "und", "oder", "aber", "fur", "mit", "wie", "in", "im",
    "ist", "sind", "dieser", "diese", "dieses", "dass", "nicht", "danke", "bitte",
    "gut", "guten", "ja", "nein", "wir", "ihr", "sie", "machen", "haben", "hat",
    "hatte", "sein", "bin", "bist", "war", "waren", "mehr", "alles", "alle",
    "sehr", "viel", "wo", "wann", "wer", "warum", "auch", "nichts", "haus", "tag",
    "zeit", "leben", "mann", "frau",
]);
const ITALIAN_COMMON_WORDS = new Set([
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "e", "ed", "o", "ma",
    "per", "con", "come", "in", "nel", "nella", "nei", "negli", "nelle", "sul",
    "sulla", "sui", "sono", "questo", "questa", "questi", "queste", "che", "chi",
    "del", "della", "dei", "degli", "delle", "al", "alla", "ai", "agli", "alle",
    "ciao", "grazie", "bene", "si", "no", "noi", "voi", "loro", "fare", "avere",
    "ho", "hai", "ha", "hanno", "essere", "siamo", "siete", "piu", "tutto", "tutti",
    "tutta", "tutte", "molto", "molti", "dove", "quando", "perche", "anche",
    "niente", "casa", "giorno", "tempo", "vita", "uomo", "donna",
]);
function getLanguageName(code) {
    if (!code)
        return "English";
    const normalized = code.toLowerCase().trim();
    if (exports.LANGUAGE_NAMES[normalized]) {
        return exports.LANGUAGE_NAMES[normalized];
    }
    // If already a full language name (e.g. "Russian", "English", "German")
    if (normalized.length > 3) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return code.toUpperCase();
}
function detectLanguage(text) {
    if (!text || !text.trim())
        return "unknown";
    // Clean text from URLs, markdown symbols, and numbers
    const clean = text
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[`*_~#\[\]()<>]/g, "")
        .trim();
    if (!clean)
        return "unknown";
    // Japanese Hiragana & Katakana
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(clean))
        return "ja";
    // Korean Hangul
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(clean))
        return "ko";
    // Chinese Hanzi (when no Japanese kana present)
    if (/[\u4E00-\u9FFF]/.test(clean))
        return "zh";
    // Arabic
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(clean))
        return "ar";
    // Hebrew
    if (/[\u0590-\u05FF]/.test(clean))
        return "he";
    // Greek
    if (/[\u0370-\u03FF]/.test(clean))
        return "el";
    // Devanagari (Hindi)
    if (/[\u0900-\u097F]/.test(clean))
        return "hi";
    // Thai
    if (/[\u0E00-\u0E7F]/.test(clean))
        return "th";
    // Ukrainian specific Cyrillic letters
    if (/[іїєґІЇЄҐ]/.test(clean))
        return "uk";
    // Russian / General Cyrillic
    if (/[а-яёА-ЯЁ\u0400-\u04FF]/.test(clean))
        return "ru";
    // Specific Latin character sets
    if (/[äöüßÄÖÜ]/.test(clean))
        return "de";
    if (/[àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ]/.test(clean))
        return "fr";
    if (/[ñ¿¡áéíóúÁÉÍÓÚÑ]/.test(clean))
        return "es";
    if (/[ãõâêôÃÕÂÊÔ]/.test(clean))
        return "pt";
    if (/[ğışĞİŞ]/.test(clean))
        return "tr";
    if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(clean))
        return "pl";
    if (/[ěščřžýáíéůúďťňĚŠČŘŽÝÁÍÉŮÚĎŤŇ]/.test(clean))
        return "cs";
    // Common word heuristics for unaccented Latin text
    const words = clean.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
    if (words.length > 0) {
        let esScore = 0;
        let frScore = 0;
        let deScore = 0;
        let itScore = 0;
        for (const w of words) {
            if (SPANISH_COMMON_WORDS.has(w))
                esScore++;
            if (FRENCH_COMMON_WORDS.has(w))
                frScore++;
            if (GERMAN_COMMON_WORDS.has(w))
                deScore++;
            if (ITALIAN_COMMON_WORDS.has(w))
                itScore++;
        }
        const maxScore = Math.max(esScore, frScore, deScore, itScore);
        if (maxScore > 0) {
            if (esScore === maxScore && esScore > frScore && esScore > deScore && esScore > itScore)
                return "es";
            if (frScore === maxScore && frScore > esScore && frScore > deScore && frScore > itScore)
                return "fr";
            if (deScore === maxScore && deScore > esScore && deScore > frScore && deScore > itScore)
                return "de";
            if (itScore === maxScore && itScore > esScore && itScore > frScore && itScore > deScore)
                return "it";
            if (esScore === maxScore)
                return "es";
            if (frScore === maxScore)
                return "fr";
            if (deScore === maxScore)
                return "de";
            if (itScore === maxScore)
                return "it";
        }
    }
    // Default Latin to English
    if (/[a-zA-Z]/.test(clean))
        return "en";
    return "unknown";
}
function determineTargetLanguage(detected, defaultTarget = "ru") {
    const normDetected = (detected || "unknown").toLowerCase().trim();
    const normDefault = (defaultTarget || "ru").toLowerCase().trim();
    // If detected language matches defaultTarget, toggle to alternate language
    if (normDetected !== "unknown" && normDetected === normDefault) {
        return normDefault === "ru" ? "en" : (normDefault === "en" ? "ru" : "en");
    }
    // If detected language is known and different from defaultTarget, translate into defaultTarget
    if (normDetected !== "unknown" && normDetected !== "") {
        return normDefault;
    }
    // Fallback to defaultTarget
    return normDefault;
}

},
"src/shared/translation/policy":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLanguagePair = resolveLanguagePair;
exports.isValidTranslation = isValidTranslation;
exports.isValidResult = isValidResult;
const language_1 = require("../language");
/** Only one resolver owns direction; explicit source+target is a deliberate override. */
function resolveLanguagePair(request) {
    const sourceLanguage = request.sourceLanguage && request.sourceLanguage !== "auto"
        ? request.sourceLanguage : (0, language_1.detectLanguage)(request.text);
    const targetLanguage = request.targetLanguage || (sourceLanguage === "ru" ? "en" : "ru");
    return { sourceLanguage: sourceLanguage === "unknown" ? "auto" : sourceLanguage, targetLanguage };
}
const normalized = (s) => s.toLocaleLowerCase().trim().replace(/\s+/g, " ");
const cyrillic = (s) => (s.match(/[а-яёіїєґ]/gi) || []).length;
const latin = (s) => (s.match(/[a-z]/gi) || []).length;
const COMMON_WORDS = new Set(["hello", "hi", "hey", "welcome", "goodbye", "thanks", "thank", "yes", "no", "please", "sorry", "morning", "evening", "night", "house", "book", "love", "world", "cat", "dog", "computer", "language", "text", "translate", "translation", "apple", "orange", "word", "english", "russian", "привет", "здравствуйте", "спасибо", "пожалуйста", "да", "нет", "мир", "дом", "книга", "кот", "кошка", "собака", "перевод", "язык", "текст", "слово"]);
const KNOWN_IDENTIFIERS = new Set(["iphone", "ipad", "macos", "github", "chatgpt", "openai", "python", "javascript", "typescript", "sql", "api", "gpt", "html", "css", "http", "json", "linux", "windows", "android", "ios", "microsoft", "google", "youtube"]);
const knownIdentifier = (s) => KNOWN_IDENTIFIERS.has(s.trim().toLocaleLowerCase());
const knownWord = (s) => COMMON_WORDS.has(s.trim().toLocaleLowerCase());
const entityOnly = (s) => !knownWord(s) && (knownIdentifier(s) || /[a-z][A-Z]/.test(s) || /^[\p{Lu}\p{N}\s.\-_'’+#@/]+$/u.test(s) || /^[A-Z][a-z]*\d*[+#]*$/.test(s));
/** Fail only on strong evidence. Never discard names, product labels, code or numbers. */
function isValidTranslation(source, translated, target) {
    const result = (translated || "").trim();
    if (!result)
        return false;
    const sourceClean = source.trim();
    if (!sourceClean || entityOnly(sourceClean) || /^(https?:\/\/|www\.)/i.test(sourceClean) || /^[\p{N}\p{P}\p{S}\s_]+$/u.test(sourceClean))
        return true;
    const sourceC = cyrillic(sourceClean), sourceL = latin(sourceClean);
    const outputC = cyrillic(result), outputL = latin(result);
    if (target === "ru" && sourceL >= 3 && sourceC === 0 && outputC === 0 && outputL >= 3) {
        // Protected entities have already been accepted above. A capitalized English
        // output is not enough evidence of a proper name ("Hello" -> "Greeting").
        return false;
    }
    if (target === "en" && sourceC >= 3 && sourceL === 0 && outputL === 0 && outputC >= 3)
        return false;
    if (normalized(sourceClean) === normalized(result) && sourceClean.length >= 4) {
        const textLang = (0, language_1.detectLanguage)(sourceClean);
        if (textLang === target)
            return true;
        if (textLang === "ru" && target === "en")
            return false;
        if (textLang === "en" && target === "ru")
            return entityOnly(sourceClean);
    }
    return true;
}
function isValidResult(request, result) {
    const target = request.targetLanguage || "ru";
    if ("translations" in result) {
        let texts;
        try {
            texts = JSON.parse(request.text);
        }
        catch {
            return false;
        }
        return Array.isArray(texts) && texts.length === result.translations.length &&
            texts.every((s, i) => isValidTranslation(s, result.translations[i], request.sourceLanguage === "auto" ? resolveLanguagePair({ ...request, mode: "phrase", text: s, targetLanguage: undefined }).targetLanguage : target));
    }
    return isValidTranslation(request.text, "mainTranslation" in result ? result.mainTranslation : result.translation, target);
}

},
"src/shared/translation/formatting":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitMarkdownIntoSegments = splitMarkdownIntoSegments;
exports.containsMarkdownFormatting = containsMarkdownFormatting;
exports.preservesMarkdownFormatting = preservesMarkdownFormatting;
exports.restoreSingleSpanFormatting = restoreSingleSpanFormatting;
exports.translationSlots = translationSlots;
exports.stitchTranslatedSlots = stitchTranslatedSlots;
// Inline marks emitted by Turndown: bold, emphasis, strike, links, inline code.
// Leave code content alone and retain link destinations verbatim.
const INLINE_MARK = /(\*\*([^*\n]+(?:\*(?!\*)[^*\n]+)*)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)|`([^`\n]+)`|(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!\w)_([^_\n]+)_(?!\w))/g;
function splitPlainText(value) {
    const pieces = [];
    // Preserve headings, list markers, blockquotes, and exact line breaks.
    const lines = value.split(/(\r?\n)/);
    for (const line of lines) {
        if (!line)
            continue;
        if (/^\r?\n$/.test(line)) {
            pieces.push({ text: "", before: line, after: "", translate: false });
            continue;
        }
        const prefix = line.match(/^(\s{0,3}(?:#{1,6}\s+|>\s+|[-+*]\s+|\d+\.\s+))/)?.[0] || "";
        pieces.push({ text: line.slice(prefix.length), before: prefix, after: "", translate: true });
    }
    return pieces;
}
function splitMarkdownIntoSegments(markdown) {
    const segments = [];
    let offset = 0;
    for (const match of markdown.matchAll(INLINE_MARK)) {
        const index = match.index ?? offset;
        if (index > offset)
            segments.push(...splitPlainText(markdown.slice(offset, index)));
        const full = match[0];
        if (match[2] !== undefined)
            segments.push({ text: match[2], before: "**", after: "**", translate: true });
        else if (match[3] !== undefined)
            segments.push({ text: match[3], before: "__", after: "__", translate: true });
        else if (match[4] !== undefined)
            segments.push({ text: match[4], before: "~~", after: "~~", translate: true });
        else if (match[5] !== undefined)
            segments.push({ text: match[5], before: "[", after: `](${match[6]})`, translate: true });
        else if (match[7] !== undefined)
            segments.push({ text: match[7], before: "`", after: "`", translate: false });
        else if (match[8] !== undefined)
            segments.push({ text: match[8], before: "*", after: "*", translate: true });
        else if (match[9] !== undefined)
            segments.push({ text: match[9], before: "_", after: "_", translate: true });
        offset = index + full.length;
    }
    if (offset < markdown.length)
        segments.push(...splitPlainText(markdown.slice(offset)));
    return segments;
}
function containsMarkdownFormatting(text) {
    const segments = splitMarkdownIntoSegments(text);
    return segments.some((segment) => segment.before === "**" || segment.before === "__" || segment.before === "*" ||
        segment.before === "_" || segment.before === "~~" || segment.before === "[" ||
        segment.before === "`" || /^(?:#{1,6}\s|>\s|[-+*]\s|\d+\.\s)/.test(segment.before));
}
function markCounts(text) {
    const counts = new Map();
    const add = (name) => counts.set(name, (counts.get(name) || 0) + 1);
    for (const s of splitMarkdownIntoSegments(text)) {
        if (s.before === "**" || s.before === "__")
            add("bold");
        if (s.before === "*" || s.before === "_")
            add("italic");
        if (s.before === "~~")
            add("strike");
        if (s.before === "[")
            add("link");
        if (s.before === "`")
            add("code");
        if (/^#{1,6}\s/.test(s.before))
            add("heading");
        if (/^[-+*]\s|^\d+\.\s/.test(s.before))
            add("list");
    }
    return counts;
}
function preservesMarkdownFormatting(source, translated) {
    const expected = markCounts(source);
    if (!expected.size)
        return true;
    const actual = markCounts(translated);
    for (const [mark, count] of expected) {
        if ((actual.get(mark) || 0) < count)
            return false;
    }
    return true;
}
/** Safe exact repair when a source consists of one styled span. */
function restoreSingleSpanFormatting(source, translated) {
    const pieces = splitMarkdownIntoSegments(source).filter((segment) => segment.text.trim());
    if (pieces.length !== 1 || !pieces[0].before || !pieces[0].after)
        return null;
    const piece = pieces[0];
    if (piece.before === "`" || (piece.before !== "[" && !["**", "__", "*", "_", "~~"].includes(piece.before)))
        return null;
    return piece.before + translated.trim() + piece.after;
}
/** Split one formatted source into text slots for a *single* structured LLM call.
 * Formatting is reconstructed locally; model output never owns the Markdown marks.
 * Non-translatable code, newlines and punctuation remain byte-for-byte intact.
 */
function translationSlots(markdown) {
    return splitMarkdownIntoSegments(markdown)
        .filter((s) => s.translate && /[\p{L}\p{N}]/u.test(s.text))
        .map((s) => s.text.trim());
}
function stitchTranslatedSlots(markdown, values) {
    const segments = splitMarkdownIntoSegments(markdown);
    const slots = segments.filter((s) => s.translate && /[\p{L}\p{N}]/u.test(s.text));
    if (!Array.isArray(values) || !slots.length || values.length !== slots.length)
        return null;
    if (values.some((value) => typeof value !== "string" || !value.trim() ||
        /\*\*|~~|`|(?<!\*)\*(?!\*)|\[[^\]]+\]\([^)]+\)/u.test(value)))
        return null;
    let i = 0;
    return segments.map((segment) => {
        if (!segment.translate || !/[\p{L}\p{N}]/u.test(segment.text)) {
            return segment.before + segment.text + segment.after;
        }
        const trimmedTranslation = values[i++].trim();
        const white = segment.text.match(/^(\s*)([\s\S]*?)(\s*)$/u);
        return segment.before + (white?.[1] || "") + trimmedTranslation + (white?.[3] || "") + segment.after;
    }).join("") || null;
}

},
"src/shared/translation/fallback":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateWithChromeTranslator = translateWithChromeTranslator;
exports.translateWithFallback = translateWithFallback;
exports.translateWithGoogleGTX = translateWithGoogleGTX;
const network_1 = require("../network");
const policy_1 = require("./policy");
const formatting_1 = require("./formatting");
function errorCode(error, fallback) {
    const message = error instanceof Error ? error.message : String(error || fallback);
    return (message.split(":", 1)[0] || fallback).trim();
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new Error("request_aborted");
    }
}
async function withBrowserDeadline(task, timeoutMs, signal) {
    throwIfAborted(signal);
    return await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
            fn();
        };
        const onAbort = () => finish(() => reject(new Error("request_aborted")));
        const timer = setTimeout(() => finish(() => reject(new Error("browser_translation_timeout"))), timeoutMs);
        signal?.addEventListener("abort", onAbort, { once: true });
        task.then((value) => finish(() => resolve(value)), (error) => finish(() => reject(error)));
    });
}
function normalizeLanguageCode(language) {
    const value = (language || "").trim();
    if (!value)
        return "";
    if (/^zh[-_]hant$/i.test(value))
        return "zh-Hant";
    return value.replace(/_/g, "-").split("-")[0].toLowerCase();
}
const translatorCache = new Map();
const MAX_TRANSLATOR_CACHE_ENTRIES = 8;
const LANGUAGE_DETECTION_TIMEOUT_MS = 1000;
const READY_TRANSLATOR_CREATE_TIMEOUT_MS = 2000;
const LOCAL_TRANSLATION_TIMEOUT_MS = 2000;
async function detectLanguageLocally(text, signal) {
    const i18n = globalThis.chrome?.i18n;
    if (!i18n || typeof i18n.detectLanguage !== "function")
        return null;
    try {
        throwIfAborted(signal);
        const result = await withBrowserDeadline(Promise.resolve(i18n.detectLanguage(text)), LANGUAGE_DETECTION_TIMEOUT_MS, signal);
        throwIfAborted(signal);
        const languages = Array.isArray(result?.languages) ? result.languages : [];
        if (languages.length === 0)
            return null;
        const best = [...languages]
            .filter((candidate) => candidate?.language)
            .sort((a, b) => Number(b?.percentage || 0) - Number(a?.percentage || 0))[0];
        return best?.language
            ? normalizeLanguageCode(String(best.language)) || null
            : null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        return null;
    }
}
function trimTranslatorCache() {
    while (translatorCache.size > MAX_TRANSLATOR_CACHE_ENTRIES) {
        const oldestKey = translatorCache.keys().next().value;
        if (!oldestKey)
            return;
        const entry = translatorCache.get(oldestKey);
        translatorCache.delete(oldestKey);
        void entry?.translatorPromise
            .then((translator) => {
            if (typeof translator?.destroy === "function") {
                try {
                    translator.destroy();
                }
                catch { }
            }
        })
            .catch(() => { });
    }
}
async function getReadyTranslator(TranslatorApi, sourceLanguage, targetLanguage, signal) {
    const key = `${sourceLanguage}->${targetLanguage}`;
    const cached = translatorCache.get(key);
    if (cached && cached.api === TranslatorApi) {
        // Refresh insertion order so the small cache behaves as an LRU.
        translatorCache.delete(key);
        translatorCache.set(key, cached);
        try {
            return await withBrowserDeadline(cached.translatorPromise, READY_TRANSLATOR_CREATE_TIMEOUT_MS, signal);
        }
        catch (error) {
            if (signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            if (translatorCache.get(key) === cached)
                translatorCache.delete(key);
            return null;
        }
    }
    if (cached && cached.api !== TranslatorApi) {
        translatorCache.delete(key);
    }
    const options = { sourceLanguage, targetLanguage };
    try {
        if (typeof TranslatorApi.availability === "function") {
            const availability = await withBrowserDeadline(Promise.resolve(TranslatorApi.availability(options)), 1000, signal);
            // Interactive translation must never wait for a model/language-pack
            // download. Google GTX is faster for this request; Chrome can be used
            // automatically once the pack becomes available later.
            if (availability !== "available")
                return null;
        }
        const entry = {
            api: TranslatorApi,
            translatorPromise: Promise.resolve(TranslatorApi.create(options)),
        };
        translatorCache.set(key, entry);
        trimTranslatorCache();
        // Remove only real creation failures. If one caller aborts while the shared
        // creation promise continues, keep it cached for the next request.
        entry.translatorPromise.catch(() => {
            if (translatorCache.get(key) === entry)
                translatorCache.delete(key);
        });
        return await withBrowserDeadline(entry.translatorPromise, READY_TRANSLATOR_CREATE_TIMEOUT_MS, signal);
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        return null;
    }
}
function invalidateCachedTranslator(TranslatorApi, sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}->${targetLanguage}`;
    const entry = translatorCache.get(key);
    if (!entry || entry.api !== TranslatorApi)
        return;
    translatorCache.delete(key);
    void entry.translatorPromise
        .then((translator) => {
        if (typeof translator?.destroy === "function") {
            try {
                translator.destroy();
            }
            catch { }
        }
    })
        .catch(() => { });
}
/**
 * Must run in a document context (content script / extension page), not the
 * Manifest V3 service worker. The Translator API is unavailable in Web Workers.
 * Language detection uses chrome.i18n.detectLanguage(), which avoids creating a
 * separate built-in AI model for every short translation.
 */
async function translateWithChromeTranslator(text, sourceLanguage = "auto", targetLanguage = "ru", signal) {
    const TranslatorApi = globalThis.Translator;
    if (!TranslatorApi || typeof TranslatorApi.create !== "function")
        return null;
    throwIfAborted(signal);
    const target = normalizeLanguageCode(targetLanguage) || "ru";
    let source = normalizeLanguageCode(sourceLanguage);
    if (!source || source === "auto") {
        source =
            (await detectLanguageLocally(text, signal)) ||
                normalizeLanguageCode(String(globalThis.document?.documentElement?.lang || ""));
    }
    if (!source)
        return null;
    if (source === target) {
        return { translation: text, detectedLanguage: source };
    }
    const translator = await getReadyTranslator(TranslatorApi, source, target, signal);
    if (!translator || typeof translator.translate !== "function")
        return null;
    try {
        const translated = await withBrowserDeadline(Promise.resolve(translator.translate(text)), LOCAL_TRANSLATION_TIMEOUT_MS, signal);
        throwIfAborted(signal);
        const translation = typeof translated === "string" ? translated.trim() : "";
        return translation
            ? { translation, detectedLanguage: source }
            : null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        invalidateCachedTranslator(TranslatorApi, source, target);
        return null;
    }
}
function parseBatchInput(text) {
    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed))
            return null;
        return parsed.map((item) => String(item));
    }
    catch {
        return null;
    }
}
async function translateBatchWithFallback(request, settings, signal, browserTranslate, trace) {
    const texts = parseBatchInput(request.text);
    if (!texts)
        throw new Error("bad_batch_input");
    if (texts.length === 0)
        return { translations: [] };
    const translations = new Array(texts.length).fill("");
    let nextIndex = 0;
    const workerCount = Math.min(4, texts.length);
    const worker = async () => {
        while (true) {
            throwIfAborted(signal);
            const index = nextIndex++;
            if (index >= texts.length)
                return;
            const itemRequest = {
                ...request,
                text: texts[index],
                mode: "phrase",
                ...(0, policy_1.resolveLanguagePair)({ text: texts[index], mode: "phrase" }),
            };
            try {
                const itemResult = await translateWithFallback(itemRequest, settings, signal, browserTranslate, trace);
                if ("translation" in itemResult) {
                    translations[index] = itemResult.translation || "";
                }
                else if ("mainTranslation" in itemResult) {
                    translations[index] = itemResult.mainTranslation || "";
                }
            }
            catch (error) {
                if (signal?.aborted ||
                    (error instanceof Error && error.message === "request_aborted")) {
                    throw new Error("request_aborted");
                }
                translations[index] = "";
            }
        }
    };
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return { translations };
}
function formatFallbackResult(request, translatedText, targetLang, detectedLang = "unknown") {
    if (request.mode === "word") {
        return {
            detectedLanguage: detectedLang,
            targetLanguage: targetLang,
            word: request.text,
            mainTranslation: translatedText,
            alternatives: [],
            partOfSpeech: "unknown",
            pronunciation: "",
            shortExamples: [],
        };
    }
    return {
        detectedLanguage: detectedLang,
        targetLanguage: targetLang,
        translation: translatedText,
    };
}
async function translateWithFallback(request, settings, signal, browserTranslate, trace) {
    throwIfAborted(signal);
    if (settings.fallbackProvider === "none") {
        throw new Error("llm_disabled_no_fallback");
    }
    if (request.mode === "batch") {
        return translateBatchWithFallback(request, settings, signal, browserTranslate, trace);
    }
    // Never pass Markdown markers to the fallback engines: they frequently
    // strip **bold**, *italic*, links, or list syntax. Translate the text pieces
    // individually, then reassemble the *unchanged* markup deterministically.
    if (request.mode === "phrase" && (0, formatting_1.containsMarkdownFormatting)(request.text)) {
        const segments = (0, formatting_1.splitMarkdownIntoSegments)(request.text);
        const translatable = segments
            .map((piece, index) => ({ piece, index }))
            .filter(({ piece }) => piece.translate && /[\p{L}\p{N}]/u.test(piece.text));
        if (translatable.length > 0 && translatable.length <= 64) {
            const pair = (0, policy_1.resolveLanguagePair)(request);
            const translatedPieces = new Array(segments.length).fill("");
            let cursor = 0;
            const workers = Array.from({ length: Math.min(3, translatable.length) }, async () => {
                while (cursor < translatable.length) {
                    throwIfAborted(signal);
                    const { piece, index } = translatable[cursor++];
                    const stripped = piece.text.trim();
                    const result = await translateWithFallback({ ...request, text: stripped, sourceLanguage: pair.sourceLanguage, targetLanguage: pair.targetLanguage }, settings, signal, browserTranslate, trace);
                    if (!("translation" in result) || !result.translation.trim()) {
                        throw new Error("formatted_translation_failed");
                    }
                    const whitespace = piece.text.match(/^(\s*)([\s\S]*?)(\s*)$/);
                    translatedPieces[index] = `${whitespace?.[1] || ""}${result.translation.trim()}${whitespace?.[3] || ""}`;
                }
            });
            await Promise.all(workers);
            return {
                detectedLanguage: pair.sourceLanguage,
                targetLanguage: pair.targetLanguage,
                translation: segments.map((piece, index) => piece.before + (piece.translate && /[\p{L}\p{N}]/u.test(piece.text) ? translatedPieces[index] : piece.text) + piece.after).join(""),
            };
        }
    }
    const pair = (0, policy_1.resolveLanguagePair)(request);
    const targetLang = pair.targetLanguage;
    const sourceLang = pair.sourceLanguage;
    // Preferred fallback: Chrome's local Translator API, executed in a document
    // context through a bridge supplied by the background service worker.
    if (browserTranslate) {
        const chromeStartedAt = Date.now();
        try {
            const localResult = await browserTranslate(request.text, sourceLang, targetLang, signal);
            if (localResult?.translation && (0, policy_1.isValidTranslation)(request.text, localResult.translation, targetLang)) {
                trace?.({
                    source: "chrome_translator",
                    status: "success",
                    durationMs: Date.now() - chromeStartedAt,
                });
                return formatFallbackResult(request, localResult.translation, targetLang, localResult.detectedLanguage ||
                    (sourceLang !== "auto" ? sourceLang : "unknown"));
            }
            trace?.({
                source: "chrome_translator",
                status: "miss",
                durationMs: Date.now() - chromeStartedAt,
                errorCode: "chrome_translator_unavailable",
            });
        }
        catch (error) {
            if (signal?.aborted ||
                (error instanceof Error && error.message === "request_aborted")) {
                throw new Error("request_aborted");
            }
            trace?.({
                source: "chrome_translator",
                status: "error",
                durationMs: Date.now() - chromeStartedAt,
                errorCode: errorCode(error, "chrome_translator_error"),
                errorMessage: error instanceof Error ? error.message : String(error),
            });
        }
    }
    else {
        trace?.({
            source: "chrome_translator",
            status: "miss",
            durationMs: 0,
            errorCode: "chrome_translator_bridge_unavailable",
        });
    }
    throwIfAborted(signal);
    // Final network fallback. This is intentionally used only after the local
    // browser translator is unavailable or fails.
    const gtxResult = await translateWithGoogleGTX(request.text, targetLang, sourceLang, signal, trace);
    if (gtxResult && (0, policy_1.isValidTranslation)(request.text, gtxResult.translation, targetLang)) {
        return formatFallbackResult(request, gtxResult.translation, targetLang, gtxResult.detectedLanguage);
    }
    throw new Error("llm_disabled_no_fallback");
}
async function translateWithGoogleGTX(text, targetLang, sourceLang = "auto", signal, trace) {
    const startedAt = Date.now();
    try {
        const sl = sourceLang && sourceLang !== "unknown" ? sourceLang : "auto";
        const tl = targetLang || "ru";
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await (0, network_1.fetchWithTimeout)(url, {
            signal,
            timeoutMs: 3000,
        });
        if (!response.ok) {
            trace?.({
                source: "google_gtx",
                status: "error",
                durationMs: Date.now() - startedAt,
                errorCode: `http_${response.status}`,
            });
            return null;
        }
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
            const translation = data[0]
                .map((item) => (Array.isArray(item) ? item[0] : ""))
                .filter(Boolean)
                .join("");
            const detectedLanguage = typeof data[2] === "string"
                ? data[2]
                : sl !== "auto"
                    ? sl
                    : "unknown";
            if (translation) {
                trace?.({
                    source: "google_gtx",
                    status: "success",
                    durationMs: Date.now() - startedAt,
                });
                return { translation, detectedLanguage };
            }
            trace?.({
                source: "google_gtx",
                status: "error",
                durationMs: Date.now() - startedAt,
                errorCode: "empty_response",
            });
            return null;
        }
        trace?.({
            source: "google_gtx",
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: "invalid_response",
        });
        return null;
    }
    catch (error) {
        if (signal?.aborted ||
            (error instanceof Error && error.message === "request_aborted")) {
            throw new Error("request_aborted");
        }
        trace?.({
            source: "google_gtx",
            status: "error",
            durationMs: Date.now() - startedAt,
            errorCode: errorCode(error, "google_gtx_error"),
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

},
"src/shared/accent":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_COLORS = exports.ACCENTS = void 0;
exports.resolveAccent = resolveAccent;
exports.accentForeground = accentForeground;
exports.accentHover = accentHover;
exports.accentFocusRing = accentFocusRing;
exports.applyAccent = applyAccent;
/** Central palette shared by popup, settings and the content-script Shadow DOM. */
exports.ACCENTS = [
    ["Розовый", "#df37a7"], ["Синий", "#3b82f6"], ["Изумруд", "#10b981"],
    ["Фиолетовый", "#8b5cf6"], ["Оранжевый", "#f97316"], ["Индиго", "#6366f1"],
    ["Бирюзовый", "#14b8a6"], ["Голубой", "#0ea5e9"], ["Красный", "#ef4444"],
    ["Янтарный", "#d97706"], ["Лайм", "#65a30d"], ["Малиновый", "#e11d48"],
    ["Сиреневый", "#a855f7"], ["Фуксия", "#d946ef"], ["Лазурный", "#0284c7"],
    ["Хвойный", "#15803d"], ["Шоколад", "#92400e"], ["Графит", "#475569"],
    ["Коралловый", "#e76f51"], ["Небесный", "#38bdf8"], ["Слива", "#9333ea"],
    ["Морская волна", "#0f766e"], ["Терракотовый", "#c2410c"], ["Лаванда", "#7c3aed"],
];
exports.LEGACY_COLORS = {
    pink: "#df37a7", blue: "#3b82f6", green: "#10b981", purple: "#8b5cf6", orange: "#f97316",
};
function resolveAccent(value) {
    if (/^#[\da-f]{6}$/i.test(value))
        return value.toLowerCase();
    return exports.LEGACY_COLORS[value] || "#df37a7";
}
function accentForeground(color) {
    const hex = resolveAccent(color);
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 > .18 ? "#111827" : "#ffffff";
}
/** Derive hover and focus colors from the current accent, never from the old pink theme. */
function accentHover(color) {
    const hex = resolveAccent(color);
    const toHex = (value) => Math.round(value * 0.86).toString(16).padStart(2, "0");
    return "#" + [1, 3, 5].map((start) => toHex(parseInt(hex.slice(start, start + 2), 16))).join("");
}
function accentFocusRing(color) {
    const hex = resolveAccent(color);
    const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`;
}
function applyAccent(color, el = document.documentElement) {
    el.style.setProperty("--lp-primary", resolveAccent(color));
    el.style.setProperty("--lp-primary-contrast", accentForeground(color));
    el.style.setProperty("--lp-primary-hover", accentHover(color));
    el.style.setProperty("--lp-focus-ring", accentFocusRing(color));
}
},
"src/content/content":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeGetExcludedSites = safeGetExcludedSites;
const turndown_1 = __importDefault(require("turndown"));
const marked_1 = require("marked");
const dompurify_1 = __importDefault(require("dompurify"));
const storage_1 = require("../shared/storage");
const tts_1 = require("../shared/tts/tts");
const pageTranslation_1 = require("../shared/pageTranslation");
const fallback_1 = require("../shared/translation/fallback");
const accent_1 = require("../shared/accent");
let currentAccentColor = "#df37a7";
let cachedExcludedSites = [];
let showExamples = true;
let contentFontSize = "medium";
let compactContent = false;
let contentTheme = "system";
let contentSettingsRevision = 0;
function useDarkContentTheme() {
    return contentTheme === "dark" ||
        (contentTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}
function applyContentAppearance() {
    const host = document.getElementById("linguapop-host");
    if (!host)
        return;
    host.dataset.theme = useDarkContentTheme() ? "dark" : "light";
    host.style.setProperty("--lp-primary", currentAccentColor);
    host.style.setProperty("--lp-primary-hover", (0, accent_1.accentHover)(currentAccentColor));
    host.style.setProperty("--lp-primary-contrast", (0, accent_1.accentForeground)(currentAccentColor));
    host.style.setProperty("--lp-content-font", contentFontSize === "small" ? "13px" : contentFontSize === "large" ? "17px" : "15px");
    host.style.setProperty("--lp-content-pad", compactContent ? "10px" : "16px");
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyContentAppearance);
function refreshContentSettings() {
    if (!(0, storage_1.hasStorageContext)())
        return;
    const revision = ++contentSettingsRevision;
    void (0, storage_1.getSettings)().then((settings) => {
        if (revision !== contentSettingsRevision)
            return;
        contentTheme = settings.overlayTheme;
        currentAccentColor = (0, accent_1.resolveAccent)(settings.accentColor);
        showExamples = settings.showExamples;
        contentFontSize = settings.fontSize;
        compactContent = settings.compactMode;
        cachedExcludedSites = Array.isArray(settings.excludedSites)
            ? [...settings.excludedSites]
            : [];
        applyContentAppearance();
    });
}
refreshContentSettings();
if ((0, storage_1.hasStorageContext)() && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.settings ||
            changes.overlayTheme || changes.accentColor || changes.showExamples || changes.fontSize || changes.compactMode ||
            changes.excludedSites) {
            if (changes.overlayTheme?.newValue)
                contentTheme = changes.overlayTheme.newValue;
            if (changes.accentColor?.newValue)
                currentAccentColor = (0, accent_1.resolveAccent)(changes.accentColor.newValue);
            applyContentAppearance();
            refreshContentSettings();
        }
    });
}
const turndownService = new turndown_1.default({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
});
const POPUP_CSS = `
:host {
  all: initial;
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2147483647;
  pointer-events: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color-scheme: light;
  --lp-c-bg: #ffffff;
  --lp-c-fg: #333333;
  --lp-c-title: #240029;
  --lp-c-muted: #6d526d;
  --lp-c-border: #e8e0e8;
  --lp-c-line: #ece5ec;
  --lp-c-hover: #f5f0f5;
  --lp-c-soft: #faf8fa;
  --lp-c-tag: #f8f0f8;
  --lp-c-code: #f3eef3;
  --lp-c-pre: #240029;
  --lp-c-pre-fg: #fdf2f8;
  direction: ltr;
  text-align: left;
}

:host([data-theme="dark"]) {
  color-scheme: dark;
  --lp-c-bg: #1e2229;
  --lp-c-fg: #e9edf4;
  --lp-c-title: #f6f7fb;
  --lp-c-muted: #b6bdc9;
  --lp-c-border: #404653;
  --lp-c-line: #404653;
  --lp-c-hover: #333946;
  --lp-c-soft: #292e38;
  --lp-c-tag: #353b47;
  --lp-c-code: #353b47;
  --lp-c-pre: #10141b;
  --lp-c-pre-fg: #f6f7fb;
}
*, *::before, *::after {
  box-sizing: border-box;
}

.lp-popup, .lp-fab, .lp-toast {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  pointer-events: auto;
  color-scheme: inherit;
  direction: ltr;
  text-align: left;
}

.lp-popup {
  position: fixed;
  z-index: 2147483647;
  background: var(--lp-c-bg);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(36,0,41,.18), 0 2px 8px rgba(36,0,41,.08);
  padding: var(--lp-content-pad, 16px);
  width: min(340px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  max-height: min(420px, calc(100vh - 20px));
  overflow-y: auto;
  color: var(--lp-c-fg);
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid var(--lp-c-border);
}

.lp-popup-phrase {
  width: min(560px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  max-height: min(540px, calc(100vh - 20px));
}

.lp-fab {
  position: fixed;
  z-index: 2147483646;
  background: var(--lp-primary, #df37a7);
  color: var(--lp-primary-contrast, #fff);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform .1s, background .15s;
  font-family: inherit;
}
.lp-fab:hover { background: var(--lp-primary-hover, #c42e92); transform: translateY(-1px); }
.lp-fab:active { transform: translateY(0); }
.lp-fab svg {
  display: block;
  margin: 0;
  flex: 0 0 auto;
  vertical-align: middle;
}

.lp-loading { color: var(--lp-c-muted); font-size: 14px; padding: 8px 0; display: flex; align-items: center; gap: 10px; }
.lp-spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--lp-c-border);
  border-top-color: var(--lp-primary, #df37a7);
  border-radius: 50%;
  animation: lp-spin 0.8s linear infinite;
}
@keyframes lp-spin { to { transform: rotate(360deg); } }

.lp-close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: var(--lp-c-muted);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.lp-close-btn:hover { color: var(--lp-c-title); background: var(--lp-c-hover); }
/* Keep close alongside action buttons: absolute positioning can cover Copy. */
.lp-popup .lp-close-inline {
  position: static;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--lp-c-border);
  background: var(--lp-c-bg);
  border-radius: 10px;
  font-size: 23px;
  font-weight: 400;
  line-height: 1;
}
.lp-popup .lp-close-inline:hover { background: var(--lp-c-hover); }

.lp-word-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; padding-right: 0; }
.lp-word-header .lp-close-inline { margin-left: auto; }
.lp-word { font-size: 18px; font-weight: 700; color: var(--lp-c-title); }
.lp-pos { font-size: 12px; color: var(--lp-c-muted); text-transform: lowercase; background: var(--lp-c-hover); padding: 2px 8px; border-radius: 10px; }
.lp-pronunciation { font-size: 13px; color: var(--lp-c-muted); margin-bottom: 8px; font-style: italic; }

.lp-result-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
/* When the popup is narrow, actions move below the translation instead of overlapping it. */
.lp-popup-phrase .lp-result-header { flex-wrap: wrap; }
.lp-popup-phrase .lp-phrase-translation { flex: 1 1 200px; }
.lp-popup-phrase .lp-icon-actions { margin-left: auto; }
.lp-main-translation { font-size: 16px; font-weight: 600; color: var(--lp-primary, #df37a7); flex: 1; min-width: 0; }

/* Markdown typography & elements */
.lp-phrase-translation {
  font-size: var(--lp-content-font, 15px);
  color: var(--lp-c-fg);
  line-height: 1.6;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.lp-phrase-translation p { margin: 0 0 8px 0; }
.lp-phrase-translation p:last-child { margin-bottom: 0; }
.lp-phrase-translation h1, .lp-phrase-translation h2, .lp-phrase-translation h3,
.lp-phrase-translation h4, .lp-phrase-translation h5, .lp-phrase-translation h6 {
  margin: 12px 0 6px 0;
  font-weight: 600;
  line-height: 1.3;
  color: var(--lp-c-title);
}
.lp-phrase-translation h1:first-child, .lp-phrase-translation h2:first-child, .lp-phrase-translation h3:first-child {
  margin-top: 0;
}
.lp-phrase-translation h1 { font-size: 18px; }
.lp-phrase-translation h2 { font-size: 16px; }
.lp-phrase-translation h3 { font-size: 15px; }
.lp-phrase-translation h4 { font-size: 14px; }
.lp-phrase-translation strong, .lp-phrase-translation b { font-weight: 600; }
.lp-phrase-translation em, .lp-phrase-translation i { font-style: italic; }
.lp-phrase-translation code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  background: var(--lp-c-code);
  padding: 2px 5px;
  border-radius: 4px;
  color: #a21caf;
}
.lp-phrase-translation pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  background: var(--lp-c-pre);
  color: var(--lp-c-pre-fg);
  padding: 10px 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  line-height: 1.4;
}
.lp-phrase-translation pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  border-radius: 0;
}
.lp-phrase-translation blockquote {
  margin: 8px 0;
  padding: 4px 10px;
  border-left: 3px solid var(--lp-primary, #df37a7);
  background: var(--lp-c-soft);
  border-radius: 0 6px 6px 0;
  color: var(--lp-c-muted);
  font-style: italic;
}
.lp-phrase-translation blockquote p { margin: 0; }
.lp-phrase-translation a {
  color: var(--lp-primary, #df37a7);
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
}
.lp-phrase-translation a:hover { opacity: 0.85; }
.lp-phrase-translation ul, .lp-phrase-translation ol {
  padding-left: 20px;
  margin: 0 0 8px 0;
}
.lp-phrase-translation ul:last-child, .lp-phrase-translation ol:last-child { margin-bottom: 0; }
.lp-phrase-translation li { margin-bottom: 4px; }
.lp-phrase-translation li:last-child { margin-bottom: 0; }
.lp-phrase-translation table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 13px;
}
.lp-phrase-translation th, .lp-phrase-translation td {
  border: 1px solid var(--lp-c-border);
  padding: 6px 10px;
  text-align: left;
}
.lp-phrase-translation th {
  background: var(--lp-c-soft);
  font-weight: 600;
  color: var(--lp-c-title);
}
.lp-phrase-translation tr:nth-child(even) td { background: var(--lp-c-soft); }
.lp-phrase-translation hr {
  border: none;
  border-top: 1px solid var(--lp-c-line);
  margin: 10px 0;
}

.lp-icon-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.lp-icon-actions > * { flex-shrink: 0; }
.lp-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lp-c-border);
  border-radius: 10px;
  background: var(--lp-c-bg);
  color: var(--lp-c-title);
  cursor: pointer;
  transition: all .15s;
  padding: 0;
}
.lp-icon-btn svg { width: 16px; height: 16px; fill: currentColor; }
.lp-icon-btn:hover { background: var(--lp-c-tag); border-color: var(--lp-c-border); transform: translateY(-1px); }
.lp-icon-btn:active { transform: translateY(0); }
.lp-icon-btn.is-copied { background: #ecfdf3; border-color: #86efac; color: #166534; }

.lp-alternatives { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.lp-alt { background: var(--lp-c-tag); color: var(--lp-c-muted); padding: 3px 10px; border-radius: 12px; font-size: 12px; border: 1px solid var(--lp-c-line); }

.lp-examples { margin-bottom: 12px; }
.lp-example { padding: 8px 10px; background: var(--lp-c-soft); border-radius: 8px; margin-bottom: 6px; font-size: 13px; border-left: 3px solid var(--lp-primary, #df37a7); }
.lp-example div:first-child { color: var(--lp-c-fg); margin-bottom: 2px; }
.lp-example div:last-child { color: var(--lp-c-muted); }

.lp-actions { display: none; }
.lp-error { color: #ef4444; font-size: 14px; padding: 8px 0; }
.lp-divider { height: 1px; background: var(--lp-c-line); margin: 10px 0; }

.lp-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--lp-c-pre);
  color: var(--lp-c-pre-fg);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2147483647;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: lp-fade-in-up 0.3s ease-out;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lp-toast.lp-hiding {
  animation: lp-fade-out-down 0.3s ease-in forwards;
}
@keyframes lp-fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lp-fade-out-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}
`;
let currentFab = null;
let isTranslatingPage = false;
let pageTranslationEpoch = 0;
let activePopupRequestId = 0;
let activePopupNetworkRequestId = null;
const activePageNetworkRequestIds = new Set();
let dragMouseMoveHandler = null;
let dragMouseUpHandler = null;
const originalTexts = new WeakMap();
const translatedNodes = new WeakSet();
const ICONS = {
    translate: '<svg viewBox="4 6 20 20" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12.87 15.07 11 13.2a4.7 4.7 0 0 0 .95-2.2h2.39v-2H7v2h2.86A6.7 6.7 0 0 1 7 15.3l1.4 1.4a8.7 8.7 0 0 0 3.18-2.53l1.7 1.7.59-1.8ZM17.5 10h-2l-4.5 12h2l1.12-3h4.76L20 22h2l-4.5-12Zm-2.56 7 1.44-4.33L17.82 17h-2.88Z"/></svg>',
    speak: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2a3.5 3.5 0 0 0-2.5-3.35v6.69A3.5 3.5 0 0 0 16.5 12Zm0-7.5v2.06A7 7 0 0 1 21 12a7 7 0 0 1-4.5 5.44v2.06A9 9 0 0 0 23 12a9 9 0 0 0-6.5-7.5Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>',
};
function hasExtensionContext() {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}
function cancelTranslationRequest(requestId) {
    if (!requestId || !hasExtensionContext())
        return;
    safeSendMessage({ type: "CANCEL_TRANSLATION", requestId }, () => { });
}
function cancelActivePopupTranslation() {
    if (!activePopupNetworkRequestId)
        return;
    cancelTranslationRequest(activePopupNetworkRequestId);
    activePopupNetworkRequestId = null;
}
function cancelActivePageTranslations() {
    for (const requestId of activePageNetworkRequestIds) {
        cancelTranslationRequest(requestId);
    }
    activePageNetworkRequestIds.clear();
}
function safeSendMessage(message, onResponse) {
    if (!hasExtensionContext()) {
        onResponse({ success: false, error: "extension_unavailable" });
        return;
    }
    try {
        chrome.runtime.sendMessage(message, (response) => {
            const lastErr = chrome.runtime.lastError;
            if (lastErr) {
                const isInvalidated = lastErr.message?.includes("Extension context invalidated") ||
                    !hasExtensionContext();
                onResponse({
                    success: false,
                    error: isInvalidated
                        ? "extension_unavailable"
                        : lastErr.message || "network_error",
                });
                return;
            }
            onResponse(response ?? null);
        });
    }
    catch (err) {
        const errorMsg = err?.message || "";
        const isInvalidated = errorMsg.includes("Extension context invalidated") ||
            !hasExtensionContext();
        onResponse({
            success: false,
            error: isInvalidated ? "extension_unavailable" : "network_error",
        });
    }
}
function safeGetExcludedSites(onResult) {
    onResult([...cachedExcludedSites]);
}
function createHost() {
    let host = document.getElementById("linguapop-host");
    if (host)
        return host;
    host = document.createElement("div");
    host.id = "linguapop-host";
    host.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
    const root = document.documentElement || document.body;
    if (root) {
        root.appendChild(host);
    }
    applyContentAppearance();
    return host;
}
function getOrCreateShadowRoot() {
    let host = document.getElementById("linguapop-host");
    if (!host) {
        host = createHost();
        host.style.setProperty("--lp-primary", currentAccentColor);
        host.style.setProperty("--lp-primary-hover", (0, accent_1.accentHover)(currentAccentColor));
        host.style.setProperty("--lp-primary-contrast", (0, accent_1.accentForeground)(currentAccentColor));
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = POPUP_CSS;
        shadow.appendChild(style);
        return shadow;
    }
    if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = POPUP_CSS;
        shadow.appendChild(style);
        return shadow;
    }
    return host.shadowRoot;
}
function hidePopup() {
    cancelActivePopupTranslation();
    const host = document.getElementById("linguapop-host");
    if (host && host.shadowRoot) {
        const popup = host.shadowRoot.querySelector(".lp-popup");
        if (popup) {
            popup.remove();
        }
    }
    (0, tts_1.stopSpeaking)();
    if (dragMouseMoveHandler) {
        window.removeEventListener("mousemove", dragMouseMoveHandler);
        dragMouseMoveHandler = null;
    }
    if (dragMouseUpHandler) {
        window.removeEventListener("mouseup", dragMouseUpHandler);
        dragMouseUpHandler = null;
    }
}
function hideFab() {
    if (currentFab) {
        currentFab.remove();
        currentFab = null;
    }
}
function hideAll() {
    hidePopup();
    hideFab();
}
let activeToast = null;
function showToast(message, duration = 3000, isLoading = false) {
    const shadow = getOrCreateShadowRoot();
    if (activeToast) {
        activeToast.remove();
    }
    const toast = document.createElement("div");
    toast.className = "lp-toast";
    let html = "";
    if (isLoading) {
        html +=
            '<div class="lp-spinner" style="width: 14px; height: 14px; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';
    }
    html += `<span>${escapeHtml(message)}</span>`;
    toast.innerHTML = html;
    shadow.appendChild(toast);
    activeToast = toast;
    if (duration > 0) {
        setTimeout(() => {
            if (activeToast === toast) {
                toast.classList.add("lp-hiding");
                setTimeout(() => toast.remove(), 300);
                activeToast = null;
            }
        }, duration);
    }
}
function getSelectionRange(selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return null;
    }
    try {
        return selection.getRangeAt(0);
    }
    catch {
        return null;
    }
}
function makeDraggable(popup) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    const onMouseMove = (e) => {
        if (!isDragging)
            return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx !== 0 || dy !== 0) {
            popup.dataset.dragged = "true";
        }
        const popupRect = popup.getBoundingClientRect();
        const margin = 10;
        const minLeft = margin;
        const maxLeft = Math.max(margin, window.innerWidth - popupRect.width - margin);
        const minTop = margin;
        const maxTop = Math.max(margin, window.innerHeight - popupRect.height - margin);
        const newLeft = Math.min(Math.max(minLeft, initialLeft + dx), maxLeft);
        const newTop = Math.min(Math.max(minTop, initialTop + dy), maxTop);
        popup.style.left = `${Math.round(newLeft)}px`;
        popup.style.top = `${Math.round(newTop)}px`;
    };
    const onMouseUp = () => {
        if (!isDragging)
            return;
        isDragging = false;
        popup.style.cursor = "default";
        popup.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        if (dragMouseMoveHandler === onMouseMove) {
            dragMouseMoveHandler = null;
        }
        if (dragMouseUpHandler === onMouseUp) {
            dragMouseUpHandler = null;
        }
    };
    popup.addEventListener("mousedown", (e) => {
        if (e.button !== 0)
            return;
        const target = e.target;
        if (target.closest(".lp-btn, .lp-close-btn, .lp-icon-btn, a, button, input, textarea, select"))
            return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = popup.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        popup.style.cursor = "grabbing";
        popup.style.userSelect = "none";
        e.preventDefault();
        if (dragMouseMoveHandler) {
            window.removeEventListener("mousemove", dragMouseMoveHandler);
        }
        if (dragMouseUpHandler) {
            window.removeEventListener("mouseup", dragMouseUpHandler);
        }
        dragMouseMoveHandler = onMouseMove;
        dragMouseUpHandler = onMouseUp;
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
}
function attachPopupListeners(popup) {
    popup.querySelectorAll(".lp-close-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            hidePopup();
        });
    });
    popup.querySelectorAll(".lp-btn-speak, .lp-icon-speak").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const b = e.currentTarget;
            (0, tts_1.speak)(b.dataset.text || "", b.dataset.lang || "unknown");
        });
    });
    popup.querySelectorAll(".lp-btn-copy, .lp-icon-copy").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const b = e.currentTarget;
            const text = b.dataset.text || "";
            // Copy plain text even when the popup visually preserves rich formatting.
            const copyPromise = navigator.clipboard.writeText(text);
            copyPromise.then(() => {
                if (b.classList.contains("lp-icon-btn")) {
                    b.classList.add("is-copied");
                    b.setAttribute("title", "Copied");
                    setTimeout(() => {
                        b.classList.remove("is-copied");
                        b.setAttribute("title", "Copy");
                    }, 1200);
                }
                else {
                    b.textContent = "Скопировано";
                    setTimeout(() => (b.textContent = "Копировать"), 1500);
                }
            })
                .catch((err) => {
                console.warn("Failed to copy text:", err);
                showToast("Не удалось скопировать", 2000);
            });
        });
    });
}
function createPopupInShadow() {
    const shadow = getOrCreateShadowRoot();
    const existing = shadow.querySelector(".lp-popup");
    if (existing)
        existing.remove();
    const popup = document.createElement("div");
    popup.className = "lp-popup";
    shadow.appendChild(popup);
    makeDraggable(popup);
    return popup;
}
/**
 * Range.getClientRects() can include boxes for inline widgets, absolutely
 * positioned descendants and empty wrappers. Those boxes may be hundreds
 * of pixels away from the visible highlighted text (e.g. ChatGPT toolbars).
 * Locate the final *selected text character* instead of the final DOM rect.
 */
function getLastSelectedGlyphRect(range) {
    const root = range.commonAncestorContainer;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
    let lastVisible = null;
    let scanned = 0;
    while (node && scanned++ < 5000) {
        const text = node;
        if (text.data && range.intersectsNode(text)) {
            const from = text === range.startContainer ? range.startOffset : 0;
            const to = text === range.endContainer ? range.endOffset : text.data.length;
            let cursor = Math.min(to, text.data.length) - 1;
            while (cursor >= from && /\s/.test(text.data[cursor]))
                cursor--;
            if (cursor >= from) {
                const glyph = document.createRange();
                glyph.setStart(text, cursor);
                glyph.setEnd(text, cursor + 1);
                const rect = glyph.getBoundingClientRect();
                const style = text.parentElement && getComputedStyle(text.parentElement);
                if (rect.width > 0 && rect.height > 0 && style?.visibility !== "hidden" && style?.display !== "none") {
                    lastVisible = rect;
                }
            }
        }
        node = walker.nextNode();
    }
    return lastVisible;
}
function getRangeAnchorRect(range, anchor = "bounds") {
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    if (rects.length === 0) {
        return range.getBoundingClientRect();
    }
    if (anchor === "start") {
        return rects[0];
    }
    if (anchor === "end") {
        return getLastSelectedGlyphRect(range) ?? rects[rects.length - 1];
    }
    return range.getBoundingClientRect();
}
function positionPopup(popup, rect, preferredPosition) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 12;
    const margin = 10;
    const isPhrase = popup.classList.contains("lp-popup-phrase");
    const defaultMaxWidth = isPhrase ? 560 : 340;
    const defaultMaxHeight = isPhrase ? 540 : 420;
    // Available vertical space above and below
    const spaceAbove = Math.max(0, rect.top - gap - margin);
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - gap - margin);
    // Measure popup dimensions
    const popupRect = popup.getBoundingClientRect();
    const popupWidth = Math.min(popupRect.width || defaultMaxWidth, viewportWidth - margin * 2);
    let popupHeight = popupRect.height || 200;
    // Decide position based on preference and available space
    let chosenPosition = preferredPosition;
    if (preferredPosition === "above") {
        if (popupHeight > spaceAbove && spaceBelow > spaceAbove) {
            chosenPosition = "below";
        }
    }
    else {
        if (popupHeight > spaceBelow && spaceAbove > spaceBelow) {
            chosenPosition = "above";
        }
    }
    // Adjust maxHeight dynamically based on chosen placement
    const maxAvailableHeight = chosenPosition === "above" ? spaceAbove : spaceBelow;
    const targetMaxHeight = Math.min(defaultMaxHeight, Math.max(120, maxAvailableHeight));
    popup.style.maxHeight = `${targetMaxHeight}px`;
    // Re-read height if maxHeight constrained it
    popupHeight = Math.min(popup.getBoundingClientRect().height || popupHeight, targetMaxHeight);
    // Calculate top coordinate
    let top;
    if (chosenPosition === "above") {
        top = rect.top - popupHeight - gap;
    }
    else {
        top = rect.bottom + gap;
    }
    // Clamp top and bottom within viewport
    const maxTop = Math.max(margin, viewportHeight - popupHeight - margin);
    top = Math.min(Math.max(margin, top), maxTop);
    // Clamp left coordinate
    let left = rect.left;
    const maxLeft = Math.max(margin, viewportWidth - popupWidth - margin);
    left = Math.min(Math.max(margin, left), maxLeft);
    popup.style.left = `${Math.round(left)}px`;
    popup.style.top = `${Math.round(top)}px`;
}
function eventHitsPopupOrFab(event) {
    const host = document.getElementById("linguapop-host");
    const popup = host?.shadowRoot?.querySelector(".lp-popup");
    const target = event.target;
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (popup) {
        if (path.includes(popup))
            return true;
        if (target && popup.contains(target))
            return true;
    }
    if (currentFab) {
        if (path.includes(currentFab))
            return true;
        if (target && currentFab.contains(target))
            return true;
    }
    return false;
}
function escapeHtml(text) {
    if (!text)
        return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function renderWordResult(popup, result, originalText) {
    const lang = result.detectedLanguage === "ru" ? "ru" : "en";
    const actionButtons = `
    <div class="lp-icon-actions">
      <button class="lp-icon-btn lp-icon-speak" type="button" title="Speak" data-text="${escapeHtml(originalText)}" data-lang="${lang}">${ICONS.speak}</button>
      <button class="lp-icon-btn lp-icon-copy" type="button" title="Copy" data-text="${escapeHtml(result.mainTranslation)}">${ICONS.copy}</button>
    </div>
  `;
    let html = `
    <div class="lp-word-header">
      <span class="lp-word">${escapeHtml(result.word)}</span>
      <span class="lp-pos">${escapeHtml(result.partOfSpeech)}</span>
      <button class="lp-close-btn lp-close-inline" type="button" title="Закрыть" aria-label="Закрыть">×</button>
    </div>
  `;
    if (result.pronunciation) {
        html += `<div class="lp-pronunciation">${escapeHtml(result.pronunciation)}</div>`;
    }
    html += `
    <div class="lp-result-header">
      <div class="lp-main-translation">${escapeHtml(result.mainTranslation)}</div>
      ${actionButtons}
    </div>
  `;
    if (result.alternatives && result.alternatives.length > 0) {
        html += `<div class="lp-alternatives">${result.alternatives.map((a) => `<span class="lp-alt">${escapeHtml(a)}</span>`).join("")}</div>`;
    }
    if (showExamples && result.shortExamples && result.shortExamples.length > 0) {
        html += `<div class="lp-examples">`;
        for (const ex of result.shortExamples) {
            html += `<div class="lp-example"><div>${escapeHtml(ex.source)}</div><div>${escapeHtml(ex.translation)}</div></div>`;
        }
        html += `</div>`;
    }
    html += `
    <div class="lp-actions">
      <button class="lp-btn lp-btn-speak" data-text="${escapeHtml(originalText)}" data-lang="${lang}">Озвучить</button>
      <button class="lp-btn lp-btn-copy" data-text="${escapeHtml(result.mainTranslation)}">Копировать</button>
    </div>
  `;
    popup.innerHTML = html;
    attachPopupListeners(popup);
}
function renderPhraseResult(popup, result, originalText, rawOriginalText) {
    const lang = result.detectedLanguage === "ru" ? "ru" : "en";
    // Fix literal \n strings if Mistral over-escaped them
    const fixedTranslation = result.translation.replace(/\\n/g, "\n");
    const rawHtml = marked_1.marked.parse(fixedTranslation, { breaks: true });
    const safeHtml = dompurify_1.default.sanitize(rawHtml, {
        ADD_ATTR: ["target", "rel"],
    });
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHtml;
    tempDiv.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
    });
    const finalHtml = tempDiv.innerHTML;
    // innerText may be empty on a detached DOM node. textContent strips markup
    // reliably, so copying never includes Markdown tokens or HTML tags.
    const plainText = (tempDiv.textContent || "").trim() || result.translation;
    const safeOriginalText = rawOriginalText || originalText;
    popup.innerHTML = `
    <div class="lp-result-header">
      <div class="lp-phrase-translation">${finalHtml}</div>
      <div class="lp-icon-actions">
        <button class="lp-icon-btn lp-icon-speak" type="button" title="Speak" data-text="${escapeHtml(safeOriginalText)}" data-lang="${lang}">${ICONS.speak}</button>
        <button class="lp-icon-btn lp-icon-copy" type="button" title="Copy" data-text="${escapeHtml(plainText)}">${ICONS.copy}</button>
        <button class="lp-close-btn lp-close-inline" type="button" title="Закрыть" aria-label="Закрыть">×</button>
      </div>
    </div>
    <div class="lp-actions">
      <button class="lp-btn lp-btn-speak" data-text="${escapeHtml(safeOriginalText)}" data-lang="${lang}">Озвучить</button>
      <button class="lp-btn lp-btn-copy" data-text="${escapeHtml(plainText)}">Копировать</button>
    </div>
  `;
    attachPopupListeners(popup);
}
function renderError(popup, error) {
    const messages = {
        missing_api_key: "Укажите API ключ в настройках расширения.",
        invalid_api_key: "Неверный API ключ.",
        network_error: "Ошибка сети. Проверьте подключение.",
        rate_limit: "Превышен лимит запросов.",
        request_timeout: "Сервис перевода не ответил вовремя.",
        bad_request: "Модель отклонила запрос. Проверьте модель в настройках.",
        api_error: "Ошибка сервиса перевода.",
        extension_unavailable: "Extension was reloaded. Refresh the page.",
        llm_disabled_no_fallback: "LLM отключён. Настройте fallback-переводчик в настройках.",
    };
    const errorCode = error.split(":", 1)[0].trim();
    popup.innerHTML = `
    <button class="lp-close-btn" title="Закрыть">×</button>
    <div class="lp-error">${messages[errorCode] || "Ошибка перевода."}</div>
  `;
    attachPopupListeners(popup);
}
function showWordPopup(selection, text) {
    const range = getSelectionRange(selection);
    if (!range)
        return;
    hideFab();
    hidePopup();
    const rect = getRangeAnchorRect(range, "bounds");
    const popup = createPopupInShadow();
    popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;
    requestAnimationFrame(() => {
        positionPopup(popup, rect, "above");
    });
    const requestId = ++activePopupRequestId;
    const networkRequestId = `popup-${requestId}`;
    activePopupNetworkRequestId = networkRequestId;
    safeSendMessage({
        type: "TRANSLATE",
        requestId: networkRequestId,
        data: { text, mode: "word" },
    }, (response) => {
        if (activePopupNetworkRequestId === networkRequestId) {
            activePopupNetworkRequestId = null;
        }
        if (requestId !== activePopupRequestId)
            return;
        const host = document.getElementById("linguapop-host");
        if (!host || !host.shadowRoot)
            return;
        const currentPopup = host.shadowRoot.querySelector(".lp-popup");
        if (!currentPopup)
            return;
        if (!response) {
            renderError(currentPopup, "extension_unavailable");
        }
        else if (response.success) {
            renderWordResult(currentPopup, response.result, text);
        }
        else {
            renderError(currentPopup, response?.error || "unknown");
        }
        if (currentPopup.dataset.dragged !== "true") {
            requestAnimationFrame(() => {
                positionPopup(currentPopup, rect, "above");
            });
        }
    });
}
function showFab(selection, text, rawText) {
    const range = getSelectionRange(selection);
    if (!range)
        return;
    hidePopup();
    hideFab();
    const rect = getRangeAnchorRect(range, "end");
    const fab = document.createElement("button");
    fab.className = "lp-fab";
    fab.style.cssText = `
    position: fixed;
    z-index: 2147483646;
    color: var(--lp-primary-contrast, #fff);
    border: none;
    border-radius: 999px;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 0;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s, background 0.15s;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
    fab.innerHTML = ICONS.translate;
    fab.setAttribute("title", "Translate");
    fab.setAttribute("aria-label", "Translate");
    fab.addEventListener("click", (e) => {
        e.stopPropagation();
        hideFab();
        showPhrasePopup(selection, text, rawText);
    });
    const shadow = getOrCreateShadowRoot();
    shadow.appendChild(fab);
    currentFab = fab;
    let targetLeft = rect.right - 2;
    if (targetLeft + 28 > window.innerWidth - 8) {
        targetLeft = window.innerWidth - 28 - 8;
    }
    targetLeft = Math.max(8, targetLeft);
    let targetTop = rect.bottom + 2;
    if (targetTop + 28 > window.innerHeight - 8) {
        targetTop = Math.max(8, rect.top - 28 - 2);
    }
    fab.style.left = `${Math.round(targetLeft)}px`;
    fab.style.top = `${Math.round(targetTop)}px`;
}
function showPhrasePopup(selection, text, rawText) {
    const range = getSelectionRange(selection);
    if (!range)
        return;
    hidePopup();
    const rect = getRangeAnchorRect(range, "end");
    const popup = createPopupInShadow();
    popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;
    popup.classList.add("lp-popup-phrase");
    requestAnimationFrame(() => {
        positionPopup(popup, rect, "below");
    });
    const requestId = ++activePopupRequestId;
    const networkRequestId = `popup-${requestId}`;
    activePopupNetworkRequestId = networkRequestId;
    safeSendMessage({
        type: "TRANSLATE",
        requestId: networkRequestId,
        data: { text, mode: "phrase" },
    }, (response) => {
        if (activePopupNetworkRequestId === networkRequestId) {
            activePopupNetworkRequestId = null;
        }
        if (requestId !== activePopupRequestId)
            return;
        const host = document.getElementById("linguapop-host");
        if (!host || !host.shadowRoot)
            return;
        const currentPopup = host.shadowRoot.querySelector(".lp-popup");
        if (!currentPopup)
            return;
        currentPopup.classList.add("lp-popup-phrase");
        if (!response) {
            renderError(currentPopup, "extension_unavailable");
        }
        else if (response.success) {
            renderPhraseResult(currentPopup, response.result, text, rawText);
        }
        else {
            renderError(currentPopup, response?.error || "unknown");
        }
        if (currentPopup.dataset.dragged !== "true") {
            requestAnimationFrame(() => {
                positionPopup(currentPopup, rect, "below");
            });
        }
    });
}
/**
 * Ranges omit partially selected ancestors, and Turndown intentionally drops
 * CSS-only <span> styles. Resolve the actual computed formatting on the live
 * text nodes BEFORE converting the detached selection to Markdown.
 */
function getMarkdownFromSelection(selection) {
    const range = getSelectionRange(selection);
    if (!range)
        return "";
    try {
        const fragment = range.cloneContents();
        const sourceTexts = [];
        const ancestor = range.commonAncestorContainer;
        const root = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
        const sourceWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = sourceWalker.nextNode(); node; node = sourceWalker.nextNode()) {
            if (range.intersectsNode(node)) {
                const text = node;
                if (!text.textContent)
                    continue;
                // Ignore text nodes only touched at the range boundary.
                const clipped = document.createRange();
                clipped.selectNodeContents(text);
                if (clipped.compareBoundaryPoints(Range.START_TO_START, range) < 0)
                    clipped.setStart(range.startContainer, range.startOffset);
                if (clipped.compareBoundaryPoints(Range.END_TO_END, range) > 0)
                    clipped.setEnd(range.endContainer, range.endOffset);
                if (clipped.toString())
                    sourceTexts.push(text);
            }
        }
        const clonedTexts = [];
        const cloneWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
        for (let node = cloneWalker.nextNode(); node; node = cloneWalker.nextNode()) {
            if (node.textContent)
                clonedTexts.push(node);
        }
        if (sourceTexts.length === clonedTexts.length) {
            const includesTag = (text, tagNames) => {
                for (let node = text.parentNode; node && node !== fragment; node = node.parentNode) {
                    if (node.nodeType === Node.ELEMENT_NODE && tagNames.includes(node.tagName.toLowerCase()))
                        return true;
                }
                return false;
            };
            sourceTexts.forEach((source, index) => {
                const cloned = clonedTexts[index];
                const parent = source.parentElement;
                if (!parent || !cloned.parentNode)
                    return;
                const computed = getComputedStyle(parent);
                const fontWeight = Number.parseInt(computed.fontWeight, 10);
                const bold = fontWeight >= 600 || computed.fontWeight === "bold";
                const italic = computed.fontStyle === "italic" || computed.fontStyle === "oblique";
                let strike = false;
                for (let node = parent; node; node = node.parentElement) {
                    if (getComputedStyle(node).textDecorationLine.includes("line-through")) {
                        strike = true;
                        break;
                    }
                }
                let wrapped = cloned;
                const wrap = (tag) => {
                    const element = document.createElement(tag);
                    wrapped.parentNode?.replaceChild(element, wrapped);
                    element.appendChild(wrapped);
                    wrapped = element;
                };
                if (bold && !includesTag(cloned, ["strong", "b"]))
                    wrap("strong");
                if (italic && !includesTag(cloned, ["em", "i"]))
                    wrap("em");
                if (strike && !includesTag(cloned, ["s", "del", "strike"]))
                    wrap("del");
                const anchor = parent.closest("a[href]");
                if (anchor && !includesTag(cloned, ["a"])) {
                    const href = anchor.getAttribute("href") || "";
                    if (/^(https?:\/\/|mailto:)/i.test(href)) {
                        const link = document.createElement("a");
                        link.setAttribute("href", href);
                        wrapped.parentNode?.replaceChild(link, wrapped);
                        link.appendChild(wrapped);
                    }
                }
            });
        }
        const container = document.createElement("div");
        container.appendChild(fragment);
        container.querySelectorAll("script, style, noscript, iframe").forEach(n => n.remove());
        return turndownService.turndown(container.innerHTML).trim();
    }
    catch (error) {
        console.warn("Selection formatting extraction failed:", error);
        return selection.toString().trim();
    }
}
let selectionTimeout = null;
let selectionScrollSerial = 0;
function isInsideEditableOrInput(node) {
    if (!node)
        return false;
    const element = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
    if (!element)
        return false;
    if (element.isContentEditable)
        return true;
    const tag = element.tagName?.toLowerCase();
    if (["input", "textarea", "select"].includes(tag))
        return true;
    if (element.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) {
        return true;
    }
    return false;
}
function handleSelection() {
    if (selectionTimeout)
        clearTimeout(selectionTimeout);
    const scrollSerial = selectionScrollSerial;
    selectionTimeout = setTimeout(() => {
        if (scrollSerial !== selectionScrollSerial)
            return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            hideAll();
            return;
        }
        const rawText = selection.toString().trim();
        if (!rawText) {
            hideAll();
            return;
        }
        // Don't show popup for selections inside inputs/textareas/contenteditables
        if (isInsideEditableOrInput(selection.anchorNode) ||
            isInsideEditableOrInput(selection.focusNode)) {
            hideAll();
            return;
        }
        checkExcluded().then((excluded) => {
            if (excluded || scrollSerial !== selectionScrollSerial)
                return;
            const words = rawText.split(/\s+/).filter((w) => w.length > 0);
            if (words.length === 1 && rawText.length > 0 && rawText.length < 50) {
                showWordPopup(selection, rawText);
            }
            else {
                const md = getMarkdownFromSelection(selection);
                const text = md || rawText;
                showFab(selection, text, rawText);
            }
        });
    }, 150);
}
async function checkExcluded() {
    const hostname = window.location.hostname.toLowerCase();
    return cachedExcludedSites.some((site) => {
        const trimmed = site.trim().toLowerCase();
        return trimmed ? hostname.includes(trimmed) : false;
    });
}
document.addEventListener("mouseup", (e) => {
    if (e.button !== 0)
        return;
    if (eventHitsPopupOrFab(e)) {
        return;
    }
    handleSelection();
});
document.addEventListener("keyup", (e) => {
    if (e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta")
        return;
    handleSelection();
});
document.addEventListener("mousedown", (e) => {
    if (e.button !== 0)
        return;
    if (eventHitsPopupOrFab(e)) {
        return;
    }
    hideAll();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        hideAll();
    }
});
// Throttled scroll & resize listeners
let scrollRafId = null;
let lastScrollY = window.scrollY;
function onScrollThrottled() {
    // A fixed FAB cannot follow nested scrollers reliably; hide it immediately.
    selectionScrollSerial++;
    if (currentFab)
        hideFab();
    if (scrollRafId !== null)
        return;
    scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        const delta = Math.abs(window.scrollY - lastScrollY);
        if (delta > 80) {
            hideAll();
        }
        lastScrollY = window.scrollY;
    });
}
let resizeRafId = null;
function onResizeThrottled() {
    selectionScrollSerial++;
    if (currentFab)
        hideFab();
    if (resizeRafId !== null)
        return;
    resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
    });
}
window.addEventListener("scroll", onScrollThrottled, { passive: true });
document.addEventListener("scroll", onScrollThrottled, {
    passive: true,
    capture: true,
});
window.addEventListener("resize", onResizeThrottled, { passive: true });
// Keyboard shortcut: Alt+T to translate current selection
document.addEventListener("keydown", (e) => {
    if (e.altKey &&
        (e.key === "t" || e.key === "T") &&
        !e.ctrlKey &&
        !e.metaKey) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
            const rawText = selection.toString().trim();
            if (rawText) {
                const words = rawText.split(/\s+/).filter((w) => w.length > 0);
                if (words.length === 1 && rawText.length < 50) {
                    showWordPopup(selection, rawText);
                }
                else {
                    const md = getMarkdownFromSelection(selection);
                    const text = md || rawText;
                    showPhrasePopup(selection, text, rawText);
                }
            }
        }
    }
});
// Context menu and runtime message handler
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "CHROME_TRANSLATOR_FALLBACK") {
        const { text, sourceLanguage, targetLanguage } = request.data || {};
        (0, fallback_1.translateWithChromeTranslator)(String(text || ""), String(sourceLanguage || "auto"), String(targetLanguage || "ru"))
            .then((result) => sendResponse({ success: Boolean(result), result }))
            .catch((error) => sendResponse({ success: false, error: error.message || "chrome_translator_error" }));
        return true;
    }
    if (request.type === "CONTEXT_MENU_TRANSLATE") {
        const text = request.text;
        hideAll();
        const popup = createPopupInShadow();
        popup.innerHTML = `<div class="lp-loading"><div class="lp-spinner"></div>Перевод...</div>`;
        popup.style.left = `${Math.max(10, window.innerWidth / 2 - 150)}px`;
        popup.style.top = `${Math.max(10, window.innerHeight / 2 - 100)}px`;
        const mode = text.split(/\s+/).filter((w) => w.length > 0).length === 1
            ? "word"
            : "phrase";
        if (mode === "phrase") {
            popup.classList.add("lp-popup-phrase");
        }
        const requestId = ++activePopupRequestId;
        const networkRequestId = `popup-${requestId}`;
        activePopupNetworkRequestId = networkRequestId;
        safeSendMessage({ type: "TRANSLATE", requestId: networkRequestId, data: { text, mode } }, (response) => {
            if (activePopupNetworkRequestId === networkRequestId) {
                activePopupNetworkRequestId = null;
            }
            if (requestId !== activePopupRequestId)
                return;
            const host = document.getElementById("linguapop-host");
            if (!host || !host.shadowRoot)
                return;
            const currentPopup = host.shadowRoot.querySelector(".lp-popup");
            if (!currentPopup)
                return;
            if (mode === "phrase") {
                currentPopup.classList.add("lp-popup-phrase");
            }
            if (!response) {
                renderError(currentPopup, "extension_unavailable");
            }
            else if (response.success) {
                if (mode === "word") {
                    renderWordResult(currentPopup, response.result, text);
                }
                else {
                    renderPhraseResult(currentPopup, response.result, text);
                }
            }
            else {
                renderError(currentPopup, response?.error || "unknown");
            }
        });
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "START_PAGE_TRANSLATION") {
        startPageTranslation();
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "RESTORE_PAGE") {
        restorePage();
        sendResponse({ success: true });
        return true;
    }
    if (request.type === "KEYBOARD_SHORTCUT_TRANSLATE") {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
            const rawText = selection.toString().trim();
            if (rawText) {
                const words = rawText.split(/\s+/).filter((w) => w.length > 0);
                if (words.length === 1 && rawText.length < 50) {
                    showWordPopup(selection, rawText);
                }
                else {
                    const md = getMarkdownFromSelection(selection);
                    const text = md || rawText;
                    showPhrasePopup(selection, text, rawText);
                }
                sendResponse({ success: true });
                return true;
            }
        }
        sendResponse({ success: false, error: "no_selection" });
        return true;
    }
    return false;
});
// Page translation
function isPageTextNodeCandidate(node) {
    const parent = node.parentElement;
    if (!parent || !node.isConnected)
        return false;
    const tag = parent.tagName.toLowerCase();
    if ([
        "script",
        "style",
        "noscript",
        "input",
        "textarea",
        "select",
        "code",
        "pre",
        "iframe",
    ].includes(tag)) {
        return false;
    }
    if (parent.closest('script, style, noscript, input, textarea, select, code, pre, iframe, [translate="no"], .notranslate')) {
        return false;
    }
    if (parent.hidden || parent.style?.display === "none") {
        return false;
    }
    const text = node.textContent?.trim() || "";
    if (text.length === 0)
        return false;
    if (!/[a-zA-Zа-яёА-ЯЁ0-9]/.test(text))
        return false;
    if (translatedNodes.has(node))
        return false;
    return true;
}
function collectPageTextNodes() {
    if (!document.body)
        return [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => isPageTextNodeCandidate(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode()))
        nodes.push(node);
    return nodes;
}
function sendPageBatch(texts, currentEpoch, requestSuffix) {
    return new Promise((resolve) => {
        if (currentEpoch !== pageTranslationEpoch) {
            resolve({ success: false, error: "request_aborted" });
            return;
        }
        const networkRequestId = `page-${currentEpoch}-${requestSuffix}`;
        activePageNetworkRequestIds.add(networkRequestId);
        safeSendMessage({
            type: "TRANSLATE",
            requestId: networkRequestId,
            data: {
                text: JSON.stringify(texts),
                mode: "batch",
                sourceLanguage: "auto",
            },
        }, (response) => {
            activePageNetworkRequestIds.delete(networkRequestId);
            if (currentEpoch !== pageTranslationEpoch) {
                resolve({ success: false, error: "request_aborted" });
                return;
            }
            if (!response?.success) {
                resolve({ success: false, error: response?.error || "api_error" });
                return;
            }
            const result = response.result;
            resolve({
                success: true,
                translations: Array.isArray(result?.translations)
                    ? result.translations.map(String)
                    : [],
            });
        });
    });
}
async function translatePageNodePass(nodes, currentEpoch, passIndex) {
    const conservativeMode = passIndex >= 4;
    const batches = (0, pageTranslation_1.createPageTranslationBatches)(nodes, (node) => node.textContent?.length || 0, conservativeMode
        ? { maxChars: 350, maxItems: 5 }
        : { maxChars: 700, maxItems: 10 });
    // Later recovery passes are intentionally sequential. If the provider is
    // throttling or timing out, parallel retries can keep the same fragments stuck.
    // translateBatchWithFallback already processes up to four text items in
    // parallel. Keep one outer batch in flight to avoid 8 simultaneous GTX
    // requests and the rate-limit/retry stalls that follow.
    const CONCURRENCY = 1;
    let batchIndex = 0;
    let translated = 0;
    let missing = 0;
    let requestSerial = 0;
    const processNextBatch = async () => {
        while (batchIndex < batches.length) {
            if (currentEpoch !== pageTranslationEpoch)
                return;
            const currentIndex = batchIndex++;
            const batch = batches[currentIndex];
            const sourceTexts = batch.map((node) => node.textContent?.trim() || "");
            const parts = await (0, pageTranslation_1.recoverPageBatchTranslations)(sourceTexts, (texts) => sendPageBatch(texts, currentEpoch, `${passIndex}-${currentIndex}-${requestSerial++}`), { transientRetryDelayMs: 650, maxDepth: 4 });
            if (currentEpoch !== pageTranslationEpoch)
                return;
            batch.forEach((node, index) => {
                const translatedText = parts[index]?.trim() || "";
                if (!translatedText) {
                    missing++;
                    return;
                }
                if (!node.isConnected || translatedNodes.has(node))
                    return;
                // A SPA may replace/update text while the network request is in flight.
                // Never overwrite newer text with a stale translation; the next pass
                // will pick the node up with its current content.
                if ((node.textContent?.trim() || "") !== sourceTexts[index]) {
                    missing++;
                    return;
                }
                const original = node.textContent || "";
                originalTexts.set(node, original);
                const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
                const leadingSpace = match ? match[1] : "";
                const trailingSpace = match ? match[3] : "";
                node.textContent = `${leadingSpace}${translatedText}${trailingSpace}`;
                translatedNodes.add(node);
                translated++;
            });
        }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, Math.max(1, batches.length)) }, () => processNextBatch()));
    return { translated, missing };
}
async function startPageTranslation() {
    if (isTranslatingPage)
        return;
    cancelActivePageTranslations();
    isTranslatingPage = true;
    const currentEpoch = ++pageTranslationEpoch;
    showToast("Переводим страницу...", 0, true);
    let totalTranslated = 0;
    let completedPasses = 0;
    let consecutiveNoProgressPasses = 0;
    const MAX_PASSES = 8;
    try {
        let remaining = collectPageTextNodes().length;
        if (remaining === 0) {
            showToast("На странице нет подходящего текста.", 3000);
            return;
        }
        while ((0, pageTranslation_1.shouldContinuePageTranslation)({
            remaining,
            completedPasses,
            consecutiveNoProgressPasses,
            maxPasses: MAX_PASSES,
        })) {
            if (currentEpoch !== pageTranslationEpoch)
                return;
            const nodes = collectPageTextNodes();
            if (nodes.length === 0)
                break;
            const pass = await translatePageNodePass(nodes, currentEpoch, completedPasses);
            totalTranslated += pass.translated;
            completedPasses++;
            if (currentEpoch !== pageTranslationEpoch)
                return;
            if (pass.translated === 0) {
                consecutiveNoProgressPasses++;
            }
            else {
                consecutiveNoProgressPasses = 0;
            }
            // Let SPA frameworks settle after text replacements. This catches nodes
            // that were mounted/replaced while the previous requests were running.
            await new Promise((resolve) => setTimeout(resolve, 300));
            remaining = collectPageTextNodes().length;
        }
        if (currentEpoch !== pageTranslationEpoch)
            return;
        // One final short settle check catches late React/Vue/GitHub rerenders after
        // the page temporarily reaches zero remaining nodes.
        remaining = collectPageTextNodes().length;
        if (remaining === 0 && totalTranslated > 0 && completedPasses < MAX_PASSES) {
            await new Promise((resolve) => setTimeout(resolve, 350));
            remaining = collectPageTextNodes().length;
            if (remaining > 0 && currentEpoch === pageTranslationEpoch) {
                const finalNodes = collectPageTextNodes();
                const finalPass = await translatePageNodePass(finalNodes, currentEpoch, completedPasses);
                totalTranslated += finalPass.translated;
                remaining = collectPageTextNodes().length;
            }
        }
        if (remaining === 0 && totalTranslated > 0) {
            showToast("Страница успешно переведена!", 3000);
        }
        else if (remaining > 0) {
            showToast(`Переведено частично. Осталось фрагментов: ${remaining}. Запустите перевод ещё раз.`, 4500);
        }
        else {
            showToast("На странице нет подходящего текста.", 3000);
        }
    }
    finally {
        if (currentEpoch === pageTranslationEpoch) {
            isTranslatingPage = false;
            cancelActivePageTranslations();
        }
    }
}
function restorePage() {
    cancelActivePageTranslations();
    pageTranslationEpoch++; // Invalidates in-flight batches
    isTranslatingPage = false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        const textNode = node;
        if (translatedNodes.has(textNode)) {
            const original = originalTexts.get(textNode);
            if (original !== undefined) {
                textNode.textContent = original;
            }
            translatedNodes.delete(textNode);
        }
    }
    showToast("Оригинал восстановлен", 2000);
}

}};
const __EXTERNAL={};
const __cache=Object.create(null);function __normalize(s){const out=[];for(const p of s.split('/')){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/').replace(/\.(js|ts|tsx)$/,'')}function __load(id){id=__normalize(id);if(__cache[id])return __cache[id].exports;const factory=__modules[id];if(!factory)throw Error('Missing module '+id);const module={exports:{}};__cache[id]=module;const base=id.includes('/')?id.slice(0,id.lastIndexOf('/')):'';const require=(spec)=>spec.startsWith('.')?__load(base+'/'+spec):external(spec);factory(module,module.exports,require);return module.exports}function external(s){if(s in __EXTERNAL)return __EXTERNAL[s];if(true)return __externalContent(s);throw Error('External dependency missing: '+s)};
__load("src/content/content");})();
