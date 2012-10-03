
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"app": function(exports, require, module) {(function() {
  var exercises, flatRenderer, simpleSrc;

  flatRenderer = require("flatRenderer");

  simpleSrc = "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = position.x;\n  gl_FragColor.g = position.y;\n  gl_FragColor.b = 1.0;\n  gl_FragColor.a = 1.0;\n}";

  exercises = [
    {
      start: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}",
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 0.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 1.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 1.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.5;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }
  ];

  module.exports = function() {
    var editor, loadExercise, makeEditor;
    editor = require("editor")({
      src: exercises[0].start,
      code: $("#code"),
      output: $("#output")
    });
    window.e = editor;
    makeEditor = require("editor")({
      src: exercises[0].solution,
      code: $("#makeCode"),
      output: $("#makeOutput")
    });
    return window.loadExercise = loadExercise = function(i) {
      var exercise;
      exercise = exercises[i];
      console.log(exercise);
      if (exercise.start) editor.set(exercise.start);
      return makeEditor.set(exercise.solution);
    };
  };

}).call(this);
}, "editor": function(exports, require, module) {(function() {
  var expandCanvas, flatRenderer, makeEditor, startTime;

  flatRenderer = require("flatRenderer");

  startTime = Date.now();

  expandCanvas = function(canvas) {
    var $canvas;
    $canvas = $(canvas);
    return $canvas.attr({
      width: $canvas.innerWidth(),
      height: $canvas.innerHeight()
    });
  };

  makeEditor = function(opts) {
    var $canvas, $code, $output, changeCallback, cm, ctx, draw, drawEveryFrame, errorLines, findUniforms, markErrors, refreshCode, renderer, src, update;
    src = opts.src;
    $output = $(opts.output);
    $code = $(opts.code);
    $canvas = $("<canvas />");
    $output.append($canvas);
    expandCanvas($canvas);
    ctx = $canvas[0].getContext("experimental-webgl", {
      premultipliedAlpha: false
    });
    renderer = flatRenderer(ctx);
    drawEveryFrame = false;
    changeCallback = null;
    draw = function() {
      renderer.setUniform("time", (Date.now() - startTime) / 1000);
      return renderer.draw();
    };
    findUniforms = function() {
      var newUniforms, u, _i, _len, _results;
      newUniforms = require("parse").uniforms(src);
      drawEveryFrame = false;
      _results = [];
      for (_i = 0, _len = newUniforms.length; _i < _len; _i++) {
        u = newUniforms[_i];
        if (u.name === "time") {
          _results.push(drawEveryFrame = true);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    errorLines = [];
    markErrors = function(errors) {
      var error, line, _i, _j, _len, _len2, _results;
      for (_i = 0, _len = errorLines.length; _i < _len; _i++) {
        line = errorLines[_i];
        cm.setLineClass(line, null, null);
        cm.clearMarker(line);
      }
      errorLines = [];
      $.fn.tipsy.revalidate();
      _results = [];
      for (_j = 0, _len2 = errors.length; _j < _len2; _j++) {
        error = errors[_j];
        line = cm.getLineHandle(error.lineNum - 1);
        errorLines.push(line);
        cm.setLineClass(line, null, "errorLine");
        _results.push(cm.setMarker(line, "<div class='errorMessage'>" + error.error + "</div>%N%", "errorMarker"));
      }
      return _results;
    };
    refreshCode = function() {
      var err, errors;
      src = cm.getValue();
      err = renderer.loadFragmentShader(src);
      if (err) {
        errors = require("parse").shaderError(err);
        markErrors(errors);
      } else {
        markErrors([]);
        findUniforms();
        renderer.link();
        if (!drawEveryFrame) draw();
      }
      if (changeCallback) return changeCallback(src);
    };
    cm = CodeMirror($code[0], {
      value: src,
      mode: "text/x-glsl",
      lineNumbers: true,
      onChange: refreshCode
    });
    cm.setSize("100%", $code.innerHeight());
    refreshCode();
    update = function() {
      if (drawEveryFrame) draw();
      return requestAnimationFrame(update);
    };
    update();
    $(window).focus(draw);
    return {
      set: function(newSrc) {
        return cm.setValue(newSrc);
      },
      snapshot: function(width, height) {
        var canvas, data, oldHeight, oldWidth;
        canvas = $canvas[0];
        if (width) {
          oldWidth = canvas.width;
          oldHeight = canvas.height;
          canvas.width = width;
          canvas.height = height;
          ctx.viewport(0, 0, width, height);
        }
        draw();
        data = canvas.toDataURL('image/png');
        if (width) {
          canvas.width = oldWidth;
          canvas.height = oldHeight;
          ctx.viewport(0, 0, oldWidth, oldHeight);
          draw();
        }
        return data;
      },
      onchange: function(callback) {
        return changeCallback = callback;
      }
    };
  };

  $(".errorMarker").tipsy({
    live: true,
    gravity: "e",
    opacity: 1.0,
    title: function() {
      return $(this).find(".errorMessage").text();
    }
  });

  module.exports = makeEditor;

}).call(this);
}, "evaluate": function(exports, require, module) {(function() {
  var abs, mod;

  abs = function(x) {
    return Math.abs(x);
  };

  mod = function(x, b) {
    return x % b;
  };

  module.exports = {
    direct: function(s) {
      return eval(s);
    },
    functionOfX: function(s) {
      return eval("(function (x) {return " + s + ";})");
    }
  };

}).call(this);
}, "exercise": function(exports, require, module) {(function() {
  var editor, template, testEqualEditors;

  editor = require("editor");

  template = "<div style=\"overflow: hidden\" class=\"workspace env\">\n  <div class=\"output canvas\" style=\"width: 300px; height: 300px; float: left;\"></div>\n  <div class=\"code\" style=\"margin-left: 324px; border: 1px solid #ccc\"></div>\n</div>\n\n<div style=\"overflow: hidden; margin-top: 24px\" class=\"solution env\">\n  <div class=\"output canvas\" style=\"width: 300px; height: 300px; float: left;\"></div>\n  <div class=\"code\" style=\"display: none\"></div>\n  <div style=\"margin-left: 324px; font-size: 30px; font-family: helvetica; height: 300px\">\n    <div style=\"float: left\">\n      <i class=\"icon-arrow-left\" style=\"font-size: 26px\"></i>\n    </div>\n    <div style=\"margin-left: 30px\">\n      <div>\n        Make this\n      </div>\n      <div style=\"font-size: 48px\">\n        <span style=\"color: #090\" data-bind=\"visible: solved\"><i class=\"icon-ok\"></i> <span style=\"font-size: 42px; font-weight: bold\">Solved</span></span>&nbsp;\n      </div>\n      <div>\n        <button style=\"vertical-align: middle\" data-bind=\"disable: onFirst, event: {click: previous}\">&#x2190;</button>\n        <span data-bind=\"text: currentExercise()+1\"></span> of <span data-bind=\"text: exercises.length\"></span>\n        <button style=\"vertical-align: middle\" data-bind=\"disable: onLast, event: {click: next}\">&#x2192;</button>\n      </div>\n    </div>\n    \n  </div>\n</div>";

  testEqualEditors = function(e1, e2) {
    return e1.snapshot(300, 300) === e2.snapshot(300, 300);
  };

  module.exports = function(opts) {
    var $div, editorSolution, editorWorkspace, exercise, exercises;
    exercises = opts.exercises;
    $div = $(opts.div);
    $div.html(template);
    editorWorkspace = editor({
      src: exercises[0].workspace,
      code: $div.find(".workspace .code"),
      output: $div.find(".workspace .output")
    });
    editorSolution = editor({
      src: exercises[0].solution,
      code: $div.find(".solution .code"),
      output: $div.find(".solution .output")
    });
    exercise = {
      workspace: ko.observable(""),
      solution: ko.observable(""),
      currentExercise: ko.observable(0),
      exercises: exercises,
      solved: ko.observable(false),
      previous: function() {
        if (!exercise.onFirst()) {
          return exercise.currentExercise(exercise.currentExercise() - 1);
        }
      },
      next: function() {
        if (!exercise.onLast()) {
          return exercise.currentExercise(exercise.currentExercise() + 1);
        }
      }
    };
    exercise.onFirst = ko.computed(function() {
      return exercise.currentExercise() === 0;
    });
    exercise.onLast = ko.computed(function() {
      return exercise.currentExercise() === exercise.exercises.length - 1;
    });
    editorWorkspace.onchange(function(src) {
      return exercise.workspace(src);
    });
    editorSolution.onchange(function(src) {
      return exercise.solution(src);
    });
    ko.computed(function() {
      var e;
      e = exercises[exercise.currentExercise()];
      if (e.workspace) editorWorkspace.set(e.workspace);
      return editorSolution.set(e.solution);
    });
    ko.computed(function() {
      exercise.workspace();
      exercise.solution();
      return exercise.solved(testEqualEditors(editorWorkspace, editorSolution));
    });
    ko.computed(function() {
      return exercises[exercise.currentExercise()].workspace = exercise.workspace();
    });
    return ko.applyBindings(exercise, $div[0]);
  };

}).call(this);
}, "flatRenderer": function(exports, require, module) {(function() {
  var bufferAttribute, compileShader, fragmentShaderSource, getShaderError, makeFlatRenderer, vertexShaderSource;

  vertexShaderSource = "precision mediump float;\n\nattribute vec3 vertexPosition;\nvarying vec2 position;\n\nvoid main() {\n  gl_Position = vec4(vertexPosition, 1.0);\n  position = (vertexPosition.xy + 1.0) * 0.5;\n}";

  fragmentShaderSource = "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor = vec4(1, 0, 0, 1);\n}";

  compileShader = function(gl, shaderSource, shaderType) {
    var shader;
    shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    return shader;
  };

  getShaderError = function(gl, shader) {
    var compiled;
    compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      return gl.getShaderInfoLog(shader);
    } else {
      return null;
    }
  };

  bufferAttribute = function(gl, program, attrib, data, size) {
    var buffer, location;
    if (size == null) size = 2;
    location = gl.getAttribLocation(program, attrib);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    return gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };

  makeFlatRenderer = function(gl) {
    var program, replaceShader, shaders;
    program = gl.createProgram();
    shaders = {};
    shaders[gl.VERTEX_SHADER] = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    shaders[gl.FRAGMENT_SHADER] = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, shaders[gl.VERTEX_SHADER]);
    gl.attachShader(program, shaders[gl.FRAGMENT_SHADER]);
    gl.linkProgram(program);
    gl.useProgram(program);
    bufferAttribute(gl, program, "vertexPosition", [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]);
    replaceShader = function(shaderSource, shaderType) {
      var err, shader;
      shader = compileShader(gl, shaderSource, shaderType);
      err = getShaderError(gl, shader);
      if (err) {
        gl.deleteShader(shader);
        return err;
      } else {
        gl.detachShader(program, shaders[shaderType]);
        gl.deleteShader(shaders[shaderType]);
        gl.attachShader(program, shader);
        shaders[shaderType] = shader;
        return null;
      }
    };
    return {
      loadFragmentShader: function(shaderSource) {
        return replaceShader(shaderSource, gl.FRAGMENT_SHADER);
      },
      link: function() {
        gl.linkProgram(program);
        return null;
      },
      setUniform: function(name, value, size) {
        var location;
        location = gl.getUniformLocation(program, name);
        if (typeof value === "number") value = [value];
        if (!size) size = value.length;
        switch (size) {
          case 1:
            return gl.uniform1fv(location, value);
          case 2:
            return gl.uniform2fv(location, value);
          case 3:
            return gl.uniform3fv(location, value);
          case 4:
            return gl.uniform4fv(location, value);
        }
      },
      createTexture: function(image) {
        var texture;
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        return texture;
      },
      draw: function() {
        return gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
  };

  module.exports = makeFlatRenderer;

}).call(this);
}, "pages/basics": function(exports, require, module) {(function() {
  var arithmetic, colors, gradients;

  colors = [
    {
      workspace: "precision mediump float;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}",
      solution: "precision mediump float;\n\nvoid main() {\n  gl_FragColor.r = 0.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 1.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 1.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.5;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvoid main() {\n  gl_FragColor.r = 0.5;\n  gl_FragColor.g = 0.5;\n  gl_FragColor.b = 0.5;\n  gl_FragColor.a = 1.0;\n}"
    }
  ];

  gradients = [
    {
      workspace: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = position.x;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}",
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 0.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = position.y;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = position.x;\n  gl_FragColor.g = position.x;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = position.x;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = position.y;\n  gl_FragColor.a = 1.0;\n}"
    }
  ];

  arithmetic = [
    {
      workspace: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0 - position.x;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}",
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 0.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 1.0 - position.y;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0 - position.x;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = position.x;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = (position.x + position.y) / 2.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = (position.x + 1.0 - position.y) / 2.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }
  ];

  module.exports = function() {
    $("code").each(function() {
      CodeMirror.runMode($(this).text(), "text/x-glsl", this);
      return $(this).addClass("cm-s-default");
    });
    require("../exercise")({
      div: $("#exercise-colors"),
      exercises: colors
    });
    require("../exercise")({
      div: $("#exercise-gradients"),
      exercises: gradients
    });
    return require("../exercise")({
      div: $("#exercise-arithmetic"),
      exercises: arithmetic
    });
  };

}).call(this);
}, "pages/exercises": function(exports, require, module) {(function() {
  var editor, exercises, testEqualEditors;

  editor = require("../editor");

  exercises = [
    {
      workspace: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}",
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 0.0;\n  gl_FragColor.g = 0.0;\n  gl_FragColor.b = 1.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 1.0;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 1.0;\n  gl_FragColor.g = 0.5;\n  gl_FragColor.b = 0.0;\n  gl_FragColor.a = 1.0;\n}"
    }, {
      solution: "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = 0.5;\n  gl_FragColor.g = 0.5;\n  gl_FragColor.b = 0.5;\n  gl_FragColor.a = 1.0;\n}"
    }
  ];

  testEqualEditors = function(e1, e2) {
    return e1.snapshot(300, 300) === e2.snapshot(300, 300);
  };

  module.exports = function() {
    var editorSolution, editorWorkspace, exercise;
    editorWorkspace = editor({
      src: exercises[0].workspace,
      code: $("#code"),
      output: $("#output")
    });
    editorSolution = editor({
      src: exercises[0].solution,
      code: $("#makeCode"),
      output: $("#makeOutput")
    });
    exercise = {
      workspace: ko.observable(""),
      solution: ko.observable(""),
      currentExercise: ko.observable(0),
      exercises: exercises,
      solved: ko.observable(false),
      previous: function() {
        return exercise.currentExercise(exercise.currentExercise() - 1);
      },
      next: function() {
        return exercise.currentExercise(exercise.currentExercise() + 1);
      }
    };
    editorWorkspace.onchange(function(src) {
      return exercise.workspace(src);
    });
    editorSolution.onchange(function(src) {
      return exercise.solution(src);
    });
    ko.computed(function() {
      var e;
      e = exercises[exercise.currentExercise()];
      if (e.workspace) editorWorkspace.set(e.workspace);
      return editorSolution.set(e.solution);
    });
    ko.computed(function() {
      exercise.workspace();
      exercise.solution();
      return exercise.solved(testEqualEditors(editorWorkspace, editorSolution));
    });
    ko.computed(function() {
      return exercises[exercise.currentExercise()].workspace = exercise.workspace();
    });
    return ko.applyBindings(exercise);
  };

}).call(this);
}, "pages/fullscreen": function(exports, require, module) {(function() {
  var quasiSrc, simpleSrc;

  simpleSrc = "precision mediump float;\n\nvarying vec2 position;\n\nvoid main() {\n  gl_FragColor.r = position.x;\n  gl_FragColor.g = position.y;\n  gl_FragColor.b = 1.0;\n  gl_FragColor.a = 1.0;\n}";

  quasiSrc = "precision mediump float;\n\nvarying vec2 position;\nuniform float time;\n\nconst float waves = 19.;\n\n// triangle wave from 0 to 1\nfloat wrap(float n) {\n  return abs(mod(n, 2.)-1.)*-1. + 1.;\n}\n\n// creates a cosine wave in the plane at a given angle\nfloat wave(float angle, vec2 point) {\n  float cth = cos(angle);\n  float sth = sin(angle);\n  return (cos (cth*point.x + sth*point.y) + 1.) / 2.;\n}\n\n// sum cosine waves at various interfering angles\n// wrap values when they exceed 1\nfloat quasi(float interferenceAngle, vec2 point) {\n  float sum = 0.;\n  for (float i = 0.; i < waves; i++) {\n    sum += wave(3.1416*i*interferenceAngle, point);\n  }\n  return wrap(sum);\n}\n\nvoid main() {\n  float b = quasi(time*0.002, (position-0.5)*200.);\n  vec4 c1 = vec4(0.0,0.,0.2,1.);\n  vec4 c2 = vec4(1.5,0.7,0.,1.);\n  gl_FragColor = mix(c1,c2,b);\n}";

  module.exports = function() {
    var editor;
    return editor = require("../editor")({
      src: quasiSrc,
      code: $("#code"),
      output: $("#output")
    });
  };

}).call(this);
}, "parse": function(exports, require, module) {(function() {

  module.exports = {
    shaderError: function(error) {
      var index, indexEnd, lineError, lineNum, parsed;
      while ((error.length > 1) && (error.charCodeAt(error.length - 1) < 32)) {
        error = error.substring(0, error.length - 1);
      }
      parsed = [];
      index = 0;
      while (index >= 0) {
        index = error.indexOf("ERROR: 0:", index);
        if (index < 0) break;
        index += 9;
        indexEnd = error.indexOf(':', index);
        if (indexEnd > index) {
          lineNum = parseInt(error.substring(index, indexEnd));
          index = indexEnd + 1;
          indexEnd = error.indexOf("ERROR: 0:", index);
          lineError = indexEnd > index ? error.substring(index, indexEnd) : error.substring(index);
          parsed.push({
            lineNum: lineNum,
            error: lineError
          });
        }
      }
      return parsed;
    },
    uniforms: function(src) {
      var regex, uniforms;
      regex = XRegExp('uniform +(?<type>[^ ]+) +(?<name>[^ ;]+) *;', 'g');
      uniforms = [];
      XRegExp.forEach(src, regex, function(match) {
        return uniforms.push({
          type: match.type,
          name: match.name
        });
      });
      return uniforms;
    }
  };

}).call(this);
}});
