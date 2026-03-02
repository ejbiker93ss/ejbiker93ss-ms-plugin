import { MessageViewExtension } from 'mailspring-exports';

/* ===================== Helpers ===================== */

const outputHTMLFor = function (doc, initialHTML) {
  if (!doc || !doc.body) return initialHTML;

  if (/<\s?head\s?>/i.test(initialHTML) || /<\s?body[\s>]/i.test(initialHTML)) {
    return doc.children[0].innerHTML;
  }
  return doc.body.innerHTML;
};

const isElement = function (n) {
  return n && n.nodeType === 1;
};

const getTrimmedText = function (el) {
  if (!el) return '';
  return String(el.textContent || '').replace(/\u00a0/g, ' ').trim();
};

const hasClass = function (el, cls) {
  if (!el || !el.classList) return false;
  return el.classList.contains(cls);
};

const isInsideGmailQuote = function (el) {
  if (!el || !el.closest) return false;
  return !!el.closest('blockquote.gmail_quote, blockquote.gmail_quote *');
};

const findNextElementSibling = function (el) {
  if (!el) return null;
  var n = el.nextSibling;
  while (n && n.nodeType !== 1) n = n.nextSibling;
  return n;
};

/* ===================== Core wrapper (blockquotes only) ===================== */

const wrapSiblingsFromHere = function (doc, startEl) {
  if (!startEl || !startEl.parentNode) return false;

  var parent = startEl.parentNode;
  if (isElement(parent) && hasClass(parent, 'gmail_quote')) return false;

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
  var attrs = doc.querySelectorAll(
    '.gmail_quote_attribution, [fr-original-class="gmail_quote_attribution"]'
  );

  for (var i = 0; i < attrs.length; i++) {
    var a = attrs[i];

    if (!hasClass(a, 'gmail_quote_attribution')) a.classList.add('gmail_quote_attribution');
    if (a.closest && a.closest('blockquote.gmail_quote')) continue;

    var next = findNextElementSibling(a);
    if (!next) continue;

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

  if (!separatorSpan) return null;

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
      } else if (isElement(spanChild)) {
        var tag = (spanChild.tagName || '').toLowerCase();
        if (tag === 'div' || tag === 'p' || tag === 'table' || tag === 'blockquote' ||
            tag === 'hr' || tag === 'ul' || tag === 'ol' || tag === 'pre') {
          reachedContent = true;
          contentNodes.push(spanChild);
        } else {
          attrText += spanChild.textContent || '';
        }
      }
    } else {
      if (isElement(spanChild) || (spanChild.nodeType === 3 && (spanChild.textContent || '').trim())) {
        contentNodes.push(spanChild);
      }
    }

    spanChild = nextSpanChild;
  }

  attrText = attrText.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  if (!/^On\s.+wrote:\s*$/i.test(attrText)) return null;

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
  if (!lines.length) return null;

  var firstLine = lines[0];
  if (!/^On\s.+wrote:/i.test(firstLine)) return null;

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
    if (el.getAttribute && el.getAttribute('data-msse-wrapped') === '1') continue;
    if (isInsideGmailQuote(el)) continue;
    if (el.parentNode && isElement(el.parentNode) && hasClass(el.parentNode, 'freshdesk_quote')) {
      continue;
    }
    target = el;
    break;
  }

  if (!target) return;

  var targetTag = (target.tagName || '').toLowerCase();

  var innerBq;
  if (targetTag === 'blockquote') {
    innerBq = target;
  } else {
    innerBq = target.querySelector('blockquote.freshdesk_quote') || target.querySelector('blockquote');
  }

  if (!innerBq) return;

  var attrText = extractSeparatorAttribution(innerBq);

  if (!attrText) {
    attrText = stripLeadingOnWroteLine(innerBq);
  }

  var parent = target.parentNode;
  if (!parent) return;

  // Convert blockquote → div
  var contentDiv = doc.createElement('div');
  contentDiv.className = 'freshdesk_quote_content';
  while (innerBq.firstChild) {
    contentDiv.appendChild(innerBq.firstChild);
  }

  if (targetTag !== 'blockquote') {
    parent.insertBefore(contentDiv, target);
    parent.removeChild(target);
  } else {
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

export default class LongDashQuotedReplyExtension extends MessageViewExtension {
  static formatMessageBody({ message }) {
    if (!message) return;
    if (message.plaintext) return;

    var html = message.body;
    if (typeof html !== 'string' || !html.length) return;

    var doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (error) {
      AppEnv.reportError(error);
      return;
    }

    if (!doc || !doc.body) return;

    normalizeFroalaQuoteAttribution(doc);
    wrapAttributionBlockquotePairs(doc);

    normalizeFreshdeskQuotes(doc);

    forceWrapAtSeparators(doc);

    message.body = outputHTMLFor(doc, html);
  }
}