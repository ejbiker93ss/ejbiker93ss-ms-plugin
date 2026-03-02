"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
/* ===================== Helpers ===================== */
const outputHTMLFor = function (doc, initialHTML) {
    if (!doc || !doc.body)
        return initialHTML;
    if (/<\s?head\s?>/i.test(initialHTML) || /<\s?body[\s>]/i.test(initialHTML)) {
        return doc.children[0].innerHTML;
    }
    return doc.body.innerHTML;
};
const isElement = function (n) {
    return n && n.nodeType === 1;
};
const getTrimmedText = function (el) {
    if (!el)
        return '';
    return String(el.textContent || '').replace(/\u00a0/g, ' ').trim();
};
const hasClass = function (el, cls) {
    if (!el || !el.classList)
        return false;
    return el.classList.contains(cls);
};
const isInsideGmailQuote = function (el) {
    if (!el || !el.closest)
        return false;
    return !!el.closest('blockquote.gmail_quote, blockquote.gmail_quote *');
};
const findNextElementSibling = function (el) {
    if (!el)
        return null;
    var n = el.nextSibling;
    while (n && n.nodeType !== 1)
        n = n.nextSibling;
    return n;
};
/* ===================== Core wrapper (blockquotes only) ===================== */
const wrapSiblingsFromHere = function (doc, startEl) {
    if (!startEl || !startEl.parentNode)
        return false;
    var parent = startEl.parentNode;
    if (isElement(parent) && hasClass(parent, 'gmail_quote'))
        return false;
    var wrapper = doc.createElement('blockquote');
    wrapper.className = 'gmail_quote';
    parent.insertBefore(wrapper, startEl);
    var node = startEl;
    while (node) {
        var next = node.nextSibling;
        wrapper.appendChild(node);
        node = next;
    }
    return true;
};
/* ================= Froala attribution normalization ================= */
const normalizeFroalaQuoteAttribution = function (doc) {
    var nodes = doc.querySelectorAll('[fr-original-class="gmail_quote_attribution"]');
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.add('gmail_quote_attribution');
    }
};
const wrapAttributionBlockquotePairs = function (doc) {
    var attrs = doc.querySelectorAll('.gmail_quote_attribution, [fr-original-class="gmail_quote_attribution"]');
    for (var i = 0; i < attrs.length; i++) {
        var a = attrs[i];
        if (!hasClass(a, 'gmail_quote_attribution'))
            a.classList.add('gmail_quote_attribution');
        if (a.closest && a.closest('blockquote.gmail_quote'))
            continue;
        var next = findNextElementSibling(a);
        if (!next)
            continue;
        if (next.tagName && next.tagName.toLowerCase() === 'blockquote') {
            next.classList.add('gmail_quote');
        }
    }
};
/* ================= Separators (Outlook / dashed) ================= */
const forceWrapAtSeparators = function (doc) {
    var hr = doc.querySelector('hr#previousmessagehr');
    if (hr && !isInsideGmailQuote(hr)) {
        wrapSiblingsFromHere(doc, hr);
        return;
    }
    var candidates = doc.querySelectorAll('div, p, pre, span, font');
    for (var i = 0; i < candidates.length; i++) {
        var t = getTrimmedText(candidates[i]);
        if (/^-{15,}$/.test(t) && !isInsideGmailQuote(candidates[i])) {
            wrapSiblingsFromHere(doc, candidates[i]);
            return;
        }
    }
};
/* ================= Freshdesk / Freshservice ================= */
const extractSeparatorAttribution = function (bq) {
    var separatorSpan = null;
    var child = bq.firstChild;
    while (child) {
        if (isElement(child) && (child.tagName || '').toLowerCase() === 'span' && hasClass(child, 'separator')) {
            separatorSpan = child;
            break;
        }
        child = child.nextSibling;
    }
    if (!separatorSpan)
        return null;
    var attrText = '';
    child = bq.firstChild;
    while (child && child !== separatorSpan) {
        if (child.nodeType === 3) {
            attrText += child.textContent || '';
        }
        child = child.nextSibling;
    }
    var spanChild = separatorSpan.firstChild;
    var contentNodes = [];
    var reachedContent = false;
    while (spanChild) {
        var nextSpanChild = spanChild.nextSibling;
        if (!reachedContent) {
            if (spanChild.nodeType === 3) {
                attrText += spanChild.textContent || '';
            }
            else if (isElement(spanChild)) {
                var tag = (spanChild.tagName || '').toLowerCase();
                if (tag === 'div' || tag === 'p' || tag === 'table' || tag === 'blockquote' ||
                    tag === 'hr' || tag === 'ul' || tag === 'ol' || tag === 'pre') {
                    reachedContent = true;
                    contentNodes.push(spanChild);
                }
                else {
                    attrText += spanChild.textContent || '';
                }
            }
        }
        else {
            if (isElement(spanChild) || (spanChild.nodeType === 3 && (spanChild.textContent || '').trim())) {
                contentNodes.push(spanChild);
            }
        }
        spanChild = nextSpanChild;
    }
    attrText = attrText.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/^On\s.+wrote:\s*$/i.test(attrText))
        return null;
    var insertBefore = separatorSpan.nextSibling;
    for (var c = 0; c < contentNodes.length; c++) {
        bq.insertBefore(contentNodes[c], insertBefore);
    }
    while (bq.firstChild && bq.firstChild !== separatorSpan) {
        bq.removeChild(bq.firstChild);
    }
    if (separatorSpan.parentNode) {
        separatorSpan.parentNode.removeChild(separatorSpan);
    }
    while (bq.firstChild) {
        var x = bq.firstChild;
        if (x.nodeType === 3 && !String(x.textContent || '').trim()) {
            bq.removeChild(x);
            continue;
        }
        if (isElement(x) && (x.tagName || '').toLowerCase() === 'br') {
            bq.removeChild(x);
            continue;
        }
        break;
    }
    return attrText;
};
const stripLeadingOnWroteLine = function (bq) {
    var raw = (bq.innerText || bq.textContent || '').replace(/\u00a0/g, ' ');
    var lines = String(raw).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!lines.length)
        return null;
    var firstLine = lines[0];
    if (!/^On\s.+wrote:/i.test(firstLine))
        return null;
    var removed = 0;
    while (bq.firstChild && removed < 60) {
        var fc = bq.firstChild;
        if (isElement(fc) && (fc.tagName || '').toLowerCase() === 'br') {
            bq.removeChild(fc);
            removed++;
            break;
        }
        bq.removeChild(fc);
        removed++;
    }
    while (bq.firstChild) {
        var x = bq.firstChild;
        if (x.nodeType === 3 && !String(x.textContent || '').trim()) {
            bq.removeChild(x);
            continue;
        }
        if (isElement(x) && (x.tagName || '').toLowerCase() === 'br') {
            bq.removeChild(x);
            continue;
        }
        break;
    }
    return firstLine;
};
const normalizeFreshdeskQuotes = function (doc) {
    var candidates = doc.querySelectorAll('.freshdesk_quote');
    var target = null;
    for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (el.getAttribute && el.getAttribute('data-msse-wrapped') === '1')
            continue;
        if (isInsideGmailQuote(el))
            continue;
        if (el.parentNode && isElement(el.parentNode) && hasClass(el.parentNode, 'freshdesk_quote')) {
            continue;
        }
        target = el;
        break;
    }
    if (!target)
        return;
    var targetTag = (target.tagName || '').toLowerCase();
    var innerBq;
    if (targetTag === 'blockquote') {
        innerBq = target;
    }
    else {
        innerBq = target.querySelector('blockquote.freshdesk_quote') || target.querySelector('blockquote');
    }
    if (!innerBq)
        return;
    var attrText = extractSeparatorAttribution(innerBq);
    if (!attrText) {
        attrText = stripLeadingOnWroteLine(innerBq);
    }
    var parent = target.parentNode;
    if (!parent)
        return;
    // Convert blockquote → div
    var contentDiv = doc.createElement('div');
    contentDiv.className = 'freshdesk_quote_content';
    while (innerBq.firstChild) {
        contentDiv.appendChild(innerBq.firstChild);
    }
    if (targetTag !== 'blockquote') {
        parent.insertBefore(contentDiv, target);
        parent.removeChild(target);
    }
    else {
        parent.insertBefore(contentDiv, target);
        parent.removeChild(target);
    }
    // Insert attribution
    var attrEl = doc.createElement('div');
    attrEl.className = 'gmail_quote_attribution';
    attrEl.textContent = attrText || 'quoted text';
    contentDiv.parentNode.insertBefore(attrEl, contentDiv);
    // Wrap from attribution onward
    wrapSiblingsFromHere(doc, attrEl);
};
/* ================= Entry ================= */
class LongDashQuotedReplyExtension extends mailspring_exports_1.MessageViewExtension {
    static formatMessageBody({ message }) {
        if (!message)
            return;
        if (message.plaintext)
            return;
        var html = message.body;
        if (typeof html !== 'string' || !html.length)
            return;
        var doc;
        try {
            doc = new DOMParser().parseFromString(html, 'text/html');
        }
        catch (error) {
            AppEnv.reportError(error);
            return;
        }
        if (!doc || !doc.body)
            return;
        normalizeFroalaQuoteAttribution(doc);
        wrapAttributionBlockquotePairs(doc);
        normalizeFreshdeskQuotes(doc);
        forceWrapAtSeparators(doc);
        message.body = outputHTMLFor(doc, html);
    }
}
exports.default = LongDashQuotedReplyExtension;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9uZy1kYXNoLXF1b3RlZC1yZXBseS1leHRlbnNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXh0ZW5zaW9ucy9sb25nLWRhc2gtcXVvdGVkLXJlcGx5LWV4dGVuc2lvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUEwRDtBQUUxRCx5REFBeUQ7QUFFekQsTUFBTSxhQUFhLEdBQUcsVUFBVSxHQUFHLEVBQUUsV0FBVztJQUM5QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUk7UUFBRSxPQUFPLFdBQVcsQ0FBQztJQUUxQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzNFLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7S0FDbEM7SUFDRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUVGLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQztJQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUM7QUFFRixNQUFNLGNBQWMsR0FBRyxVQUFVLEVBQUU7SUFDakMsSUFBSSxDQUFDLEVBQUU7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDckUsQ0FBQyxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsVUFBVSxFQUFFLEVBQUUsR0FBRztJQUNoQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJ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