// Generated by CoffeeScript 1.4.0
(function() {
  var breakdown, breakdownTypes, breakdownWorthy, extractChildren, markEnds, stringify, _;

  _ = require("underscore");

  extractChildren = function(ast, recursing) {
    if (recursing == null) {
      recursing = false;
    }
    if (recursing && ast.type) {
      return [ast];
    } else if (_.isObject(ast) || _.isArray(ast)) {
      return _.flatten(_.map(ast, function(v) {
        return extractChildren(v, true);
      }));
    } else {
      return [];
    }
  };

  markEnds = function(node, endOffset) {
    var child, childEndOffset, children, i, nextChild, _i, _len, _results;
    node.endOffset = endOffset;
    children = extractChildren(node);
    children = _.sortBy(children, "offset");
    _results = [];
    for (i = _i = 0, _len = children.length; _i < _len; i = ++_i) {
      child = children[i];
      if (i === children.length - 1) {
        childEndOffset = endOffset;
      } else {
        nextChild = children[i + 1];
        childEndOffset = nextChild.offset;
      }
      _results.push(markEnds(child, childEndOffset));
    }
    return _results;
  };

  stringify = function(ast, src) {
    var ch, endParens, s, _i, _len;
    s = src.substring(ast.offset, ast.endOffset);
    s = s.replace(/\s+$/, "");
    endParens = 0;
    for (_i = 0, _len = s.length; _i < _len; _i++) {
      ch = s[_i];
      if (ch === "(") {
        endParens--;
      } else if (ch === ")") {
        endParens++;
      }
    }
    s = s.substr(0, s.length - endParens);
    return s;
  };

  breakdownTypes = ["identifier", "unary", "binary", "function_call"];

  breakdownWorthy = function(node) {
    return _.contains(breakdownTypes, node.type);
  };

  breakdown = function(node) {
    var children;
    children = _.flatten(_.map(extractChildren(node), breakdown));
    if (breakdownWorthy(node)) {
      return [
        {
          node: node,
          children: children
        }
      ];
    } else {
      return children;
    }
  };

  module.exports = {
    markEnds: markEnds,
    extractChildren: extractChildren,
    breakdown: breakdown,
    stringify: stringify
  };

}).call(this);
