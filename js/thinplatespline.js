var ThinPlateSpline = (function(){

function ThinPlateSpline(options) {

  this.block = false;
  this.que   = [];

  if (!options) { options = {}; }

  this.__ord = {
    pointer : Runtime.stackAlloc(104),
    solved  : false
  };
  this.__rev = {
    pointer : Runtime.stackAlloc(104),
    solved  : false
  };
  this.isWorker = false;
  var me     = this;

  Module['ccall']('_ZN17VizGeorefSpline2DC1Ei', 'void', ['number', 'number'], [this.__ord.pointer, 2]);
  Module['ccall']('_ZN17VizGeorefSpline2DC1Ei', 'void', ['number', 'number'], [this.__rev.pointer, 2]);
  //__ZN17VizGeorefSpline2DC1Ei(this.__ord.pointer,2);
  //__ZN17VizGeorefSpline2DC1Ei(this.__rev.pointer,2);

  if (options.use_worker) {
    var root = '';
    var scripts = document.getElementsByTagName("script");
    var i = scripts.length;
    while (i--) {
      var match = scripts[i].src.match(/(^|.*\/)thinplatespline\.js/);
      if (match) {
        root = match[1];
        break;
      }
    }

    var worker = this.worker = new Worker(root + 'thinplatespline.js');

    worker.onmessage = function(e) {
      var data      = e.data;
      var e_type    = data.event;

      switch (e_type){
        case 'solved':
          console.log("Solved");
          worker.postMessage({'method':'serialize'});
          break;
        case 'serialized':
          var serial = data.serial;
          console.log(serial);
          delete(me.worker);
          worker.terminate();
          me.deserialize(serial);
          console.log("Serialized");

          //var blob = new Blob([me.serialize()]);
          //location.href = window.URL.createObjectURL(blob);

          break;
        case 'echo':
          console.log(data.data);
      }
    };
  }

  if (options.transform_callback) {
    this.transform_callback = options.transform_callback;
  }

  if (options.error_callback) {
    this.error_callback = options.error_callback;
  }

  if (options.web_falback && options.transform_callback) {
    this.web_fallback = options.web_falback;
  }
}

ThinPlateSpline.prototype.destructor = function() {
  Module['ccall']('_ZN17VizGeorefSpline2DD1Ev', 'void', ['number'], [this.__ord.pointer]);
  Module['ccall']('_ZN17VizGeorefSpline2DD1Ev', 'void', ['number'], [this.__rev.pointer]);
  Module['ccall']('_ZdlPv', 'void', ['number'], [this.__ord.pointer]);
  Module['ccall']('_ZdlPv', 'void', ['number'], [this.__rev.pointer]);
  //__ZN17VizGeorefSpline2DD1Ev(this.__ord.pointer);
  //__ZN17VizGeorefSpline2DD1Ev(this.__rev.pointer);
  //__ZdlPv(this.__ord.pointer);
  //__ZdlPv(this.__rev.pointer);
};

ThinPlateSpline.prototype.push_points = function(points) {
  if (this.worker) {
    this.worker.postMessage({'method':'push_points','data':points});
  } else {
    for (var i=0,len=points.length;i<len;i++) {
      var point = points[i];
      this.add_point(point[0],point[1]);
    }
    this.solve();
  }
};

ThinPlateSpline.prototype.load_points = function(url) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'load_points','data':url});
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function(e) {
      if (this.status == 200) {
        var points = JSON.parse(this.response);
        me.push_points(points);
      } else {
        //self.postMessage({'event':'cannotLoad'});
      }
    };
    xhr.send();
  }
};

ThinPlateSpline.prototype.load_serial = function(url) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'load_serial','data':url});
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      if (this.status == 200) {
        var serial = new Uint8Array(this.response);
        me.deserialize(serial);
      } else {
        //self.postMessage({'event':'cannotLoad'});
      }
    };
    xhr.send();
  }
};

ThinPlateSpline.prototype.add_point = function(P, D) {
  this.__add_point(this.__ord, P, D);
  this.__add_point(this.__rev, D, P);
};

ThinPlateSpline.prototype.__add_point = function(self, P, D) {
  /*var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  var DPtr=(__stackBase__);

  var DPtr1=((DPtr)|0);
  (HEAPF64[(tempDoublePtr)>>3]=D[0],HEAP32[((DPtr1)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((DPtr1)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]);
  var DPtr2=((DPtr+8)|0);
  (HEAPF64[(tempDoublePtr)>>3]=D[1],HEAP32[((DPtr2)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((DPtr2)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]);

  var ret = __ZN17VizGeorefSpline2D9add_pointEddPKd(self.pointer, P[0], P[1], DPtr);
  //var ret = Module['ccall']('_ZN17VizGeorefSpline2D9add_pointEddPKd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);
  STACKTOP = __stackBase__;*/

  var DPtr = _malloc(16);
  Module.setValue(DPtr,     D[0], 'double');
  Module.setValue(DPtr + 8, D[1], 'double');
  var ret = Module['ccall']('_ZN17VizGeorefSpline2D9add_pointEddPKd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);

  _free(DPtr);

  self.solved = false;

  return ret;
};

ThinPlateSpline.prototype.solve = function() {
  this.__solve(this.__ord);
  this.__solve(this.__rev);
};

ThinPlateSpline.prototype.__solve = function(self) {
  self.solved = true;
  //return __ZN17VizGeorefSpline2D5solveEv(self.pointer);
  return Module['ccall']('_ZN17VizGeorefSpline2D5solveEv', 'number', ['number'], [self.pointer]);
};

ThinPlateSpline.prototype.transform = function(P, isRev, options) {
  if (this.block && (!options || options.recurse != 1)) {
    this.que.push({"P":P,"isRev":isRev,"options":options});
    return;
  } else {
    this.block = true;
    if (options && options.recurse == 1) {
      var next = this.que.pop();
      P       = next.P;
      isRev   = next.isRev;
      options = next.options;
    }
  }
  var self = isRev ? this.__rev : this.__ord;
  var ret  = this.__get_point(self, P);
  var me   = this;

  if (me.transform_callback) {
    if (ret === 0) {
      if (me.web_fallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.web_fallback + '?x=' + P[0] + '&y=' + P[1] + '&inv=' + isRev, true);

        xhr.onload = function(e) {
          if (this.status == 200) {
            var data = JSON.parse(this.response);
            me.transform_callback([data.data.x,data.data.y], isRev, options);
          } else if (me.error_callback) {
            me.error_callback(P, isRev);
          }
        };
        xhr.send();
      } else if (me.error_callback) {
        me.error_callback(P, isRev);
      }
    } else {
      me.transform_callback(ret, isRev, options);
    }
  } else {
    return ret;
  }

  if (this.que.length > 0) {
    this.transform(null,null,{"recurse":1});
  } else {
    this.block = false;
  }
};

ThinPlateSpline.prototype.__get_point = function(self, P) {
  if (!self.solved) { return 0; } //this.__solve(self); }
  
  /*var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  var $__dstr=(__stackBase__);

  //var res = __ZN15ThinPlateSpline9get_pointEddPd(this.pointer, P[0], P[1], $__dstr);
  var res = __ZN17VizGeorefSpline2D9get_pointEddPd(self.pointer, P[0], P[1], $__dstr);
  var $21=(($__dstr)|0);
  var $22=(HEAP32[((tempDoublePtr)>>2)]=HEAP32[(($21)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[((($21)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
  var $23=(($__dstr+8)|0);
  var $24=(HEAP32[((tempDoublePtr)>>2)]=HEAP32[(($23)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[((($23)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);

  STACKTOP = __stackBase__;*/

  var DPtr = _malloc(16);
  var res  = Module['ccall']('_ZN17VizGeorefSpline2D9get_pointEddPd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);
  var ret  = [];
  ret[0]   = Module.getValue(DPtr,    'double');
  ret[1]   = Module.getValue(DPtr + 8,'double');

  _free(DPtr);

  return ret;
};

ThinPlateSpline.prototype.serialize = function() {
  var alloc_size = this.serialize_size();
  var all_size   = alloc_size[0] + alloc_size[1] + 2;
  var serial_ptr = _malloc(all_size);
  var work_ptr   = serial_ptr;

  work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D9serializeEPc', 'void', ['number', 'number'], [this.__ord.pointer, work_ptr]);
  Module.setValue(work_ptr, this.__ord.solved ? 1 : 0, 'i8');
  work_ptr++;

  work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D9serializeEPc', 'void', ['number', 'number'], [this.__rev.pointer, work_ptr]);
  Module.setValue(work_ptr, this.__rev.solved ? 1 : 0, 'i8');
  work_ptr++;

  var ret = new Uint8Array(new Uint8Array(HEAPU8.buffer, serial_ptr, all_size));

  _free(serial_ptr);

  return ret;
};

ThinPlateSpline.prototype.deserialize = function(serial) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'deserialize','data':serial});
  } else {
    var all_size   = serial.length;
    var serial_ptr = _malloc(all_size);
    var work_ptr   = serial_ptr;

    HEAPU8.set(serial, serial_ptr);

    work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D11deserializeEPc', 'void', ['number', 'number'], [this.__ord.pointer, work_ptr]);
    this.__ord.solved = Module.getValue(work_ptr, 'i8') ? true : false;
    work_ptr++;

    work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D11deserializeEPc', 'void', ['number', 'number'], [this.__rev.pointer, work_ptr]);
    this.__rev.solved = Module.getValue(work_ptr, 'i8') ? true : false;
    work_ptr++;

    _free(serial_ptr);
  }
};

ThinPlateSpline.prototype.serialize_size = function() {
  return [this.__serialize_size(this.__ord),this.__serialize_size(this.__rev)];
};

ThinPlateSpline.prototype.__serialize_size = function(self) {
  //return __ZN17VizGeorefSpline2D14serialize_sizeEv(self.pointer);
  return Module['ccall']('_ZN17VizGeorefSpline2D14serialize_sizeEv', 'number', ['number'], [self.pointer]);
};

// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}

if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  Module['load'] = importScripts;
}

if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  BITSHIFT64_SHL: 0,
  BITSHIFT64_ASHR: 1,
  BITSHIFT64_LSHR: 2,
  bitshift64: function (low, high, op, bits) {
    var ret;
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
          break;
      }
    } else if (bits == 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [high, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high, 0];
          break;
      }
    } else { // bits > 32
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low << (bits - 32)];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high >>>  (bits - 32) , 0];
          break;
      }
    }
    HEAP32[tempDoublePtr>>2] = ret[0]; // cannot use utility functions since we are in runtime itself
    HEAP32[tempDoublePtr+4>>2] = ret[1];
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var utf8 = new Runtime.UTF8Processor();
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (nullTerminated && t == 0) break;
    ret += utf8.processCChar(t);
    i += 1;
    if (!nullTerminated && i == length) break;
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max

var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY

var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

// === Body ===



assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);

STATICTOP += 752;

assert(STATICTOP < TOTAL_MEMORY);

var _stderr;








var __ZTVN10__cxxabiv120__si_class_type_infoE;

var __ZTISt9exception;


allocate(24, "i8", ALLOC_NONE, 5242880);
allocate([109,97,116,114,105,120,73,110,118,101,114,116,40,41,58,32,69,82,82,79,82,32,45,32,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,102,97,105,108,101,100,46,10,0] /* matrixInvert(): ERRO */, "i8", ALLOC_NONE, 5242904);
allocate([32,65,32,112,111,105,110,116,32,119,97,115,32,100,101,108,101,116,101,100,32,97,102,116,101,114,32,116,104,101,32,108,97,115,116,32,115,111,108,118,101,10,0] /*  A point was deleted */, "i8", ALLOC_NONE, 5242956);
allocate([32,78,79,32,105,110,116,101,114,112,111,108,97,116,105,111,110,32,45,32,114,101,116,117,114,110,32,118,97,108,117,101,115,32,97,114,101,32,122,101,114,111,10,0] /*  NO interpolation -  */, "i8", ALLOC_NONE, 5243000);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5243044);
allocate([32,65,32,112,111,105,110,116,32,119,97,115,32,97,100,100,101,100,32,97,102,116,101,114,32,116,104,101,32,108,97,115,116,32,115,111,108,118,101,10,0] /*  A point was added a */, "i8", ALLOC_NONE, 5243060);
allocate(472, "i8", ALLOC_NONE, 5243104);
allocate([0,0,0,0,224,2,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243576);
allocate(1, "i8", ALLOC_NONE, 5243596);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5243600);
allocate(12, "i8", ALLOC_NONE, 5243616);
allocate(4, "i8", ALLOC_NONE, 5243628);
HEAP32[((5243584)>>2)]=(4);
HEAP32[((5243588)>>2)]=(2);
HEAP32[((5243592)>>2)]=(6);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([2,0,0,0], "i8", ALLOC_STATIC);
HEAP32[((5243616)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5243620)>>2)]=((5243600)|0);
HEAP32[((5243624)>>2)]=__ZTISt9exception;

  var _fabs=Math.abs;

  var _sqrt=Math.sqrt;

  var _log=Math.log;

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return (tempRet0 = x*y > 4294967295,(x*y)>>>0);
    }

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;

  
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }

  function ___gxx_personality_v0() {
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return (tempRet0 = typeArray[i],thrown);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return (tempRet0 = throwntype,thrown);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }

  function __ZNSt9exceptionD2Ev(){}

  var _llvm_memset_p0i8_i64=_memset;

  
  
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
  
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
    
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
    
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
    
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
    
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
    
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.ensureObjects();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }





  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],ensureObjects:function () {
        if (Browser.ensured) return;
        Browser.ensured = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
  
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false,
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},requestFullScreen:function () {
        var canvas = Module['canvas'];
        function fullScreenChange() {
          var isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                        canvas['mozRequestPointerLock'] ||
                                        canvas['webkitRequestPointerLock'];
            canvas.requestPointerLock();
            isFullScreen = true;
          }
          if (Module['onFullScreen']) Module['onFullScreen'](isFullScreen);
        }
  
        document.addEventListener('fullscreenchange', fullScreenChange, false);
        document.addEventListener('mozfullscreenchange', fullScreenChange, false);
        document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      }};
___setErrNo(0);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  


var FUNCTION_TABLE = [0,0,__ZNSt9bad_allocD0Ev,0,__ZNSt9bad_allocD1Ev,0,__ZNKSt9bad_alloc4whatEv,0];

function __ZN17VizGeorefSpline2DC1Ei(r1, r2) {
  var r3, r4, r5;
  r3 = r1 >> 2;
  HEAP32[r3 + 21] = 0;
  HEAP32[r3 + 16] = 0;
  HEAP32[r3 + 15] = 0;
  HEAP32[r3 + 23] = 0;
  HEAP32[r3 + 22] = 0;
  L1 : do {
    if ((r2 | 0) > 0) {
      r4 = 0;
      while (1) {
        HEAP32[((r4 << 2) + 68 >> 2) + r3] = 0;
        HEAP32[((r4 << 2) + 76 >> 2) + r3] = 0;
        r5 = r4 + 1 | 0;
        if ((r5 | 0) == (r2 | 0)) {
          break L1;
        } else {
          r4 = r5;
        }
      }
    }
  } while (0);
  r4 = r1 + 36 | 0;
  r5 = (r1 + 20 | 0) >> 2;
  HEAP32[r5] = 0;
  HEAP32[r5 + 1] = 0;
  HEAP32[r5 + 2] = 0;
  HEAP32[r5 + 3] = 0;
  HEAPF64[tempDoublePtr >> 3] = 10, HEAP32[r4 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r4 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
  HEAP32[r3 + 2] = 0;
  HEAP32[r3 + 1] = r2;
  HEAP32[r3 + 3] = 0;
  HEAP32[r3 + 24] = 0;
  HEAP32[r3 + 25] = 0;
  __ZN17VizGeorefSpline2D11grow_pointsEv(r1);
  HEAP32[r3] = 0;
  return;
}
Module["__ZN17VizGeorefSpline2DC1Ei"] = __ZN17VizGeorefSpline2DC1Ei;
function __ZN17VizGeorefSpline2D11grow_pointsEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8;
  r2 = r1 >> 2;
  r3 = (r1 + 12 | 0) >> 2;
  r4 = HEAP32[r3];
  r5 = r4 << 1;
  r6 = r5 + 2 | 0;
  r7 = r5 + 5 | 0;
  if ((r4 | 0) != 0) {
    r4 = r1 + 60 | 0;
    r5 = r7 << 3;
    HEAP32[r4 >> 2] = _realloc(HEAP32[r4 >> 2], r5);
    r4 = r1 + 64 | 0;
    HEAP32[r4 >> 2] = _realloc(HEAP32[r4 >> 2], r5);
    r4 = r1 + 84 | 0;
    HEAP32[r4 >> 2] = _realloc(HEAP32[r4 >> 2], r5);
    r4 = r1 + 88 | 0;
    r8 = r7 << 2;
    HEAP32[r4 >> 2] = _realloc(HEAP32[r4 >> 2], r8);
    r4 = r1 + 92 | 0;
    HEAP32[r4 >> 2] = _realloc(HEAP32[r4 >> 2], r8);
    r8 = r1 + 68 | 0;
    HEAP32[r8 >> 2] = _realloc(HEAP32[r8 >> 2], r5);
    r8 = r1 + 76 | 0;
    HEAP32[r8 >> 2] = _realloc(HEAP32[r8 >> 2], r5);
    r8 = r1 + 72 | 0;
    HEAP32[r8 >> 2] = _realloc(HEAP32[r8 >> 2], r5);
    r8 = r1 + 80 | 0;
    HEAP32[r8 >> 2] = _realloc(HEAP32[r8 >> 2], r5);
    HEAP32[r3] = r6;
    return;
  }
  r5 = r7 << 3;
  HEAP32[r2 + 15] = _malloc(r5);
  HEAP32[r2 + 16] = _malloc(r5);
  HEAP32[r2 + 21] = _malloc(r5);
  r8 = r7 << 2;
  HEAP32[r2 + 22] = _malloc(r8);
  HEAP32[r2 + 23] = _malloc(r8);
  r8 = (r7 & 536870911 | 0) == (r7 | 0) ? r5 : -1;
  if (r7 >>> 0 > 65535) {
    r7 = _malloc(r8);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r8);
      }
    } while (0);
    HEAP32[r2 + 17] = r7;
    r7 = _malloc(r8);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r8);
      }
    } while (0);
    HEAP32[r2 + 19] = r7;
    r7 = _malloc(r8);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r8);
      }
    } while (0);
    HEAP32[r2 + 18] = r7;
    r7 = _malloc(r8);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r8);
      }
    } while (0);
    HEAP32[r2 + 20] = r7;
    HEAP32[r3] = r6;
    return;
  } else {
    r7 = _malloc(r5);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r5);
      }
    } while (0);
    HEAP32[r2 + 17] = r7;
    r7 = _malloc(r5);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r5);
      }
    } while (0);
    HEAP32[r2 + 19] = r7;
    r7 = _malloc(r5);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r5);
      }
    } while (0);
    HEAP32[r2 + 18] = r7;
    r7 = _malloc(r5);
    do {
      if ((r7 | 0) != 0) {
        if ((HEAP32[r7 - 4 >> 2] & 3 | 0) == 0) {
          break;
        }
        _memset(r7, 0, r5);
      }
    } while (0);
    HEAP32[r2 + 20] = r7;
    HEAP32[r3] = r6;
    return;
  }
}
function __ZN17VizGeorefSpline2D9add_pointEddPKd(r1, r2, r3, r4) {
  var r5, r6, r7, r8, r9, r10;
  r5 = r1 >> 2;
  HEAP32[r5] = 5;
  r6 = (r1 + 8 | 0) >> 2;
  r7 = HEAP32[r6];
  if ((r7 | 0) == (HEAP32[r5 + 3] | 0)) {
    __ZN17VizGeorefSpline2D11grow_pointsEv(r1);
    r8 = HEAP32[r6];
  } else {
    r8 = r7;
  }
  r7 = (r8 << 3) + HEAP32[r5 + 15] | 0;
  HEAPF64[tempDoublePtr >> 3] = r2, HEAP32[r7 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r7 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
  r7 = (r8 << 3) + HEAP32[r5 + 16] | 0;
  HEAPF64[tempDoublePtr >> 3] = r3, HEAP32[r7 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r7 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
  r7 = r1 + 4 | 0;
  if ((HEAP32[r7 >> 2] | 0) <= 0) {
    r9 = HEAP32[r6];
    r10 = r9 + 1 | 0;
    HEAP32[r6] = r10;
    return 1;
  }
  r1 = r8 + 3 | 0;
  r8 = 0;
  while (1) {
    r3 = (r8 << 3) + r4 | 0;
    r2 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r3 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r3 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
    r3 = (r1 << 3) + HEAP32[((r8 << 2) + 68 >> 2) + r5] | 0;
    HEAPF64[tempDoublePtr >> 3] = r2, HEAP32[r3 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r3 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
    r3 = r8 + 1 | 0;
    if ((r3 | 0) < (HEAP32[r7 >> 2] | 0)) {
      r8 = r3;
    } else {
      break;
    }
  }
  r9 = HEAP32[r6];
  r10 = r9 + 1 | 0;
  HEAP32[r6] = r10;
  return 1;
}
Module["__ZN17VizGeorefSpline2D9add_pointEddPKd"] = __ZN17VizGeorefSpline2D9add_pointEddPKd;
function __ZN17VizGeorefSpline2D5solveEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46, r47;
  r2 = r1 >> 2;
  r3 = (r1 + 8 | 0) >> 2;
  r4 = HEAP32[r3];
  if ((r4 | 0) < 1) {
    HEAP32[r2] = 0;
    r5 = 0;
    return r5;
  }
  if ((r4 | 0) == 1) {
    HEAP32[r2] = 1;
    r5 = 1;
    return r5;
  }
  r6 = (r1 + 60 | 0) >> 2;
  r7 = HEAP32[r6], r8 = r7 >> 2;
  if ((r4 | 0) == 2) {
    r9 = r7 + 8 | 0;
    r10 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r9 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r9 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) - (HEAP32[tempDoublePtr >> 2] = HEAP32[r8], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r8 + 1], HEAPF64[tempDoublePtr >> 3]);
    r9 = (r1 + 44 | 0) >> 2;
    HEAPF64[tempDoublePtr >> 3] = r10, HEAP32[r9] = HEAP32[tempDoublePtr >> 2], HEAP32[r9 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
    r11 = HEAP32[r2 + 16];
    r12 = r11 + 8 | 0;
    r13 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r12 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r12 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) - (HEAP32[tempDoublePtr >> 2] = HEAP32[r11 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r11 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
    r11 = r1 + 52 | 0;
    r12 = 1 / (r10 * r10 + r13 * r13);
    r14 = r10 * r12;
    HEAPF64[tempDoublePtr >> 3] = r14, HEAP32[r9] = HEAP32[tempDoublePtr >> 2], HEAP32[r9 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
    r9 = r12 * r13;
    HEAPF64[tempDoublePtr >> 3] = r9, HEAP32[r11 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r11 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
    HEAP32[r2] = 2;
    r5 = 2;
    return r5;
  }
  r11 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r8], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r8 + 1], HEAPF64[tempDoublePtr >> 3]);
  r8 = (r1 + 64 | 0) >> 2;
  r9 = HEAP32[r8];
  r13 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r9 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r9 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
  r12 = r13;
  r14 = r13;
  r10 = 0;
  r15 = 0;
  r16 = 0;
  r17 = 0;
  r18 = 0;
  r19 = r11;
  r20 = r11;
  r21 = 1;
  r22 = r11;
  r11 = r13;
  while (1) {
    r23 = r20 > r22 ? r20 : r22;
    r24 = r19 < r22 ? r19 : r22;
    r25 = r14 > r11 ? r14 : r11;
    r26 = r12 < r11 ? r12 : r11;
    r27 = r10 + r22;
    r28 = r16 + r22 * r22;
    r29 = r15 + r11;
    r30 = r17 + r11 * r11;
    r31 = r18 + r22 * r11;
    if ((r21 | 0) >= (r4 | 0)) {
      break;
    }
    r13 = (r21 << 3) + r7 | 0;
    r32 = (r21 << 3) + r9 | 0;
    r12 = r26;
    r14 = r25;
    r10 = r27;
    r15 = r29;
    r16 = r28;
    r17 = r30;
    r18 = r31;
    r19 = r24;
    r20 = r23;
    r21 = r21 + 1 | 0;
    r22 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r13 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r13 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
    r11 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r32 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r32 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
  }
  r11 = r23 - r24;
  r24 = r25 - r26;
  r26 = r27 * r27;
  r25 = r4 | 0;
  r4 = r29 * r29;
  r23 = r31 - r27 * r29 / r25;
  do {
    if (!(r11 < r24 * .001 | r24 < r11 * .001)) {
      if (Math.abs(r23 * r23 / ((r30 - r4 / r25) * (r28 - r26 / r25))) > .99) {
        break;
      }
      HEAP32[r2] = 4;
      r29 = (r1 + 96 | 0) >> 2;
      r27 = HEAP32[r29];
      if ((r27 | 0) != 0) {
        _free(r27);
      }
      r27 = (r1 + 100 | 0) >> 2;
      r31 = HEAP32[r27];
      if ((r31 | 0) != 0) {
        _free(r31);
      }
      r31 = HEAP32[r3] + 3 | 0;
      r22 = (r1 + 16 | 0) >> 2;
      HEAP32[r22] = r31;
      r21 = Math.imul(r31, r31);
      do {
        if ((r21 | 0) == 0) {
          r33 = 0;
        } else {
          r31 = r21 << 3;
          if (r21 >>> 0 <= 65535) {
            r33 = r31;
            break;
          }
          r33 = (Math.floor((r31 >>> 0) / (r21 >>> 0)) | 0) == 8 ? r31 : -1;
        }
      } while (0);
      r21 = _malloc(r33);
      do {
        if ((r21 | 0) != 0) {
          if ((HEAP32[r21 - 4 >> 2] & 3 | 0) == 0) {
            break;
          }
          _memset(r21, 0, r33);
        }
      } while (0);
      HEAP32[r29] = r21;
      r31 = HEAP32[r22];
      r20 = Math.imul(r31, r31);
      do {
        if ((r20 | 0) == 0) {
          r34 = 0;
        } else {
          r31 = r20 << 3;
          if (r20 >>> 0 <= 65535) {
            r34 = r31;
            break;
          }
          r34 = (Math.floor((r31 >>> 0) / (r20 >>> 0)) | 0) == 8 ? r31 : -1;
        }
      } while (0);
      r20 = _malloc(r34);
      do {
        if ((r20 | 0) != 0) {
          if ((HEAP32[r20 - 4 >> 2] & 3 | 0) == 0) {
            break;
          }
          _memset(r20, 0, r34);
        }
      } while (0);
      HEAP32[r27] = r20;
      r21 = HEAP32[r29];
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = HEAP32[r29] + 8 | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = HEAP32[r29] + 16 | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = (HEAP32[r22] << 3) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = (HEAP32[r22] + 1 << 3) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = (HEAP32[r22] + 2 << 3) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = (HEAP32[r22] << 4) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = ((HEAP32[r22] << 1 | 1) << 3) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r21 = ((HEAP32[r22] << 1) + 2 << 3) + HEAP32[r29] | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r21 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      L99 : do {
        if ((HEAP32[r3] | 0) > 0) {
          r21 = 0;
          while (1) {
            r31 = r21 + 3 | 0;
            r19 = (r31 << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = 1, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = (r21 << 3) + HEAP32[r6] | 0;
            r18 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r19 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r19 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
            r19 = (HEAP32[r22] + r31 << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = r18, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = (r21 << 3) + HEAP32[r8] | 0;
            r18 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r19 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r19 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
            r19 = ((HEAP32[r22] << 1) + r31 << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = r18, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = (Math.imul(HEAP32[r22], r31) << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = 1, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = (r21 << 3) + HEAP32[r6] | 0;
            r18 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r19 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r19 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
            r19 = ((Math.imul(HEAP32[r22], r31) + 1 | 0) << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = r18, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = (r21 << 3) + HEAP32[r8] | 0;
            r18 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r19 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r19 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
            r19 = ((Math.imul(HEAP32[r22], r31) + 2 | 0) << 3) + HEAP32[r29] | 0;
            HEAPF64[tempDoublePtr >> 3] = r18, HEAP32[r19 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r19 = r21 + 1 | 0;
            r35 = HEAP32[r3];
            if ((r19 | 0) < (r35 | 0)) {
              r21 = r19;
            } else {
              break;
            }
          }
          if ((r35 | 0) > 0) {
            r36 = 0;
            r37 = r35;
          } else {
            break;
          }
          while (1) {
            L105 : do {
              if ((r36 | 0) < (r37 | 0)) {
                r21 = r36 + 3 | 0;
                r19 = r36;
                while (1) {
                  r18 = HEAP32[r6];
                  r31 = (r36 << 3) + r18 | 0;
                  r17 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r31 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r31 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                  r31 = HEAP32[r8];
                  r16 = (r36 << 3) + r31 | 0;
                  r15 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r16 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r16 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                  r16 = (r19 << 3) + r18 | 0;
                  r18 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r16 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r16 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                  r16 = (r19 << 3) + r31 | 0;
                  r31 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r16 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r16 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                  if (r17 == r18 & r15 == r31) {
                    r38 = 0;
                  } else {
                    r16 = r18 - r17;
                    r17 = r31 - r15;
                    r15 = r16 * r16 + r17 * r17;
                    r38 = r15 * Math.log(r15);
                  }
                  r15 = r19 + 3 | 0;
                  r17 = ((Math.imul(HEAP32[r22], r21) + r15 | 0) << 3) + HEAP32[r29] | 0;
                  HEAPF64[tempDoublePtr >> 3] = r38, HEAP32[r17 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r17 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
                  if ((r36 | 0) != (r19 | 0)) {
                    r17 = HEAP32[r22];
                    r16 = Math.imul(r17, r21) + r15 | 0;
                    r31 = HEAP32[r29];
                    r18 = (r16 << 3) + r31 | 0;
                    r16 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r18 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r18 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                    r18 = (Math.imul(r17, r15) + r21 << 3) + r31 | 0;
                    HEAPF64[tempDoublePtr >> 3] = r16, HEAP32[r18 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r18 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
                  }
                  r18 = r19 + 1 | 0;
                  r16 = HEAP32[r3];
                  if ((r18 | 0) < (r16 | 0)) {
                    r19 = r18;
                  } else {
                    r39 = r16;
                    break L105;
                  }
                }
              } else {
                r39 = r37;
              }
            } while (0);
            r19 = r36 + 1 | 0;
            if ((r19 | 0) < (r39 | 0)) {
              r36 = r19;
              r37 = r39;
            } else {
              break L99;
            }
          }
        }
      } while (0);
      if ((__Z12matrixInvertiPdS_(HEAP32[r22], HEAP32[r29], HEAP32[r27]) | 0) == 0) {
        r5 = 0;
        return r5;
      }
      r20 = r1 + 4 | 0;
      r19 = HEAP32[r20 >> 2];
      if ((r19 | 0) <= 0) {
        r5 = 4;
        return r5;
      }
      r21 = 0;
      r16 = HEAP32[r22];
      r18 = r19;
      while (1) {
        if ((r16 | 0) > 0) {
          r19 = (r21 << 2) + r1 + 76 | 0;
          r31 = (r21 << 2) + r1 + 68 | 0;
          r15 = 0;
          while (1) {
            r17 = (r15 << 3) + HEAP32[r19 >> 2] | 0;
            HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r17 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r17 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
            r17 = HEAP32[r22];
            L129 : do {
              if ((r17 | 0) > 0) {
                r10 = 0;
                r14 = r17;
                while (1) {
                  r12 = ((Math.imul(r14, r15) + r10 | 0) << 3) + HEAP32[r27] | 0;
                  r32 = (r10 << 3) + HEAP32[r31 >> 2] | 0;
                  r13 = ((r15 << 3) + HEAP32[r19 >> 2] | 0) >> 2;
                  r40 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r12 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r12 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * (HEAP32[tempDoublePtr >> 2] = HEAP32[r32 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r32 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) + (HEAP32[tempDoublePtr >> 2] = HEAP32[r13], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r13 + 1], HEAPF64[tempDoublePtr >> 3]);
                  HEAPF64[tempDoublePtr >> 3] = r40, HEAP32[r13] = HEAP32[tempDoublePtr >> 2], HEAP32[r13 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
                  r13 = r10 + 1 | 0;
                  r40 = HEAP32[r22];
                  if ((r13 | 0) < (r40 | 0)) {
                    r10 = r13;
                    r14 = r40;
                  } else {
                    r41 = r40;
                    break L129;
                  }
                }
              } else {
                r41 = r17;
              }
            } while (0);
            r17 = r15 + 1 | 0;
            if ((r17 | 0) < (r41 | 0)) {
              r15 = r17;
            } else {
              break;
            }
          }
          r42 = r41;
          r43 = HEAP32[r20 >> 2];
        } else {
          r42 = r16;
          r43 = r18;
        }
        r15 = r21 + 1 | 0;
        if ((r15 | 0) < (r43 | 0)) {
          r21 = r15;
          r16 = r42;
          r18 = r43;
        } else {
          r5 = 4;
          break;
        }
      }
      return r5;
    }
  } while (0);
  HEAP32[r2] = 3;
  r2 = r28 * r25 - r26;
  r26 = (r1 + 44 | 0) >> 2;
  r28 = r30 * r25 - r4;
  r4 = (r1 + 52 | 0) >> 2;
  r25 = 1 / Math.sqrt(r2 * r2 + r28 * r28);
  r30 = r2 * r25;
  HEAPF64[tempDoublePtr >> 3] = r30, HEAP32[r26] = HEAP32[tempDoublePtr >> 2], HEAP32[r26 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
  r2 = r25 * r28;
  HEAPF64[tempDoublePtr >> 3] = r2, HEAP32[r4] = HEAP32[tempDoublePtr >> 2], HEAP32[r4 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
  r28 = r1 + 84 | 0;
  r25 = r1 + 88 | 0;
  r43 = 0;
  r42 = r7;
  r7 = r9;
  r9 = r30;
  r30 = r2;
  while (1) {
    r2 = (r43 << 3) + r42 | 0;
    r41 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r2 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r2 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) - (HEAP32[tempDoublePtr >> 2] = HEAP32[r42 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r42 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
    r2 = (r43 << 3) + r7 | 0;
    r39 = r41 * r9 + ((HEAP32[tempDoublePtr >> 2] = HEAP32[r2 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r2 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) - (HEAP32[tempDoublePtr >> 2] = HEAP32[r7 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r7 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) * r30;
    r2 = (r43 << 3) + HEAP32[r28 >> 2] | 0;
    HEAPF64[tempDoublePtr >> 3] = r39, HEAP32[r2 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r2 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
    HEAP32[HEAP32[r25 >> 2] + (r43 << 2) >> 2] = 1;
    r2 = r43 + 1 | 0;
    r44 = HEAP32[r3];
    if ((r2 | 0) >= (r44 | 0)) {
      break;
    }
    r39 = HEAP32[r6];
    r41 = HEAP32[r8];
    r43 = r2;
    r42 = r39;
    r7 = r41;
    r9 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r26], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r26 + 1], HEAPF64[tempDoublePtr >> 3]);
    r30 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r4], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r4 + 1], HEAPF64[tempDoublePtr >> 3]);
  }
  if ((r44 | 0) <= 0) {
    r5 = 3;
    return r5;
  }
  r4 = r1 + 92 | 0;
  r30 = r1 + 88 | 0;
  r26 = r1 + 84 | 0;
  r1 = 0;
  r9 = r44;
  while (1) {
    L146 : do {
      if ((r9 | 0) > 0) {
        r44 = HEAP32[r30 >> 2];
        r7 = 0;
        r42 = -1;
        r43 = 0;
        while (1) {
          if ((HEAP32[r44 + (r7 << 2) >> 2] | 0) == 0) {
            r45 = r43;
            r46 = r42;
          } else {
            r8 = (r7 << 3) + HEAP32[r26 >> 2] | 0;
            r6 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r8 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r8 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
            r8 = (r42 | 0) < 0 | r6 < r43;
            r45 = r8 ? r6 : r43;
            r46 = r8 ? r7 : r42;
          }
          r8 = r7 + 1 | 0;
          if ((r8 | 0) < (r9 | 0)) {
            r7 = r8;
            r42 = r46;
            r43 = r45;
          } else {
            r47 = r46;
            break L146;
          }
        }
      } else {
        r47 = -1;
      }
    } while (0);
    HEAP32[HEAP32[r4 >> 2] + (r1 << 2) >> 2] = r47;
    HEAP32[HEAP32[r30 >> 2] + (r47 << 2) >> 2] = 0;
    r43 = r1 + 1 | 0;
    r42 = HEAP32[r3];
    if ((r43 | 0) < (r42 | 0)) {
      r1 = r43;
      r9 = r42;
    } else {
      r5 = 3;
      break;
    }
  }
  return r5;
}
Module["__ZN17VizGeorefSpline2D5solveEv"] = __ZN17VizGeorefSpline2D5solveEv;
function __ZN17VizGeorefSpline2D14serialize_sizeEv(r1) {
  var r2, r3, r4;
  r2 = (HEAP32[r1 + 12 >> 2] << 6) + 256 | 0;
  r3 = HEAP32[r1 + 16 >> 2];
  if ((HEAP32[r1 + 96 >> 2] | 0) == 0) {
    r4 = r2;
    return r4;
  }
  r4 = Math.imul(r3 << 4, r3) + r2 | 0;
  return r4;
}
Module["__ZN17VizGeorefSpline2D14serialize_sizeEv"] = __ZN17VizGeorefSpline2D14serialize_sizeEv;
function __ZN17VizGeorefSpline2D9serializeEPc(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24;
  r3 = r1 + 12 | 0;
  r4 = HEAP32[r3 >> 2];
  r5 = r4 + 3 | 0;
  r6 = r1 + 16 | 0;
  r7 = HEAP32[r6 >> 2];
  r8 = Math.imul(r7, r7);
  r7 = r1 + 96 | 0;
  r9 = (HEAP32[r7 >> 2] | 0) != 0;
  r10 = r1 + 4 | 0;
  r11 = r2;
  tempBigInt = HEAPU8[r10] | HEAPU8[r10 + 1 | 0] << 8 | HEAPU8[r10 + 2 | 0] << 16 | HEAPU8[r10 + 3 | 0] << 24 | 0;
  HEAP8[r11] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 3 | 0] = tempBigInt & 255;
  r11 = r1 + 8 | 0;
  r10 = r2 + 4 | 0;
  tempBigInt = HEAPU8[r11] | HEAPU8[r11 + 1 | 0] << 8 | HEAPU8[r11 + 2 | 0] << 16 | HEAPU8[r11 + 3 | 0] << 24 | 0;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r2 + 8 | 0;
  tempBigInt = HEAPU8[r3] | HEAPU8[r3 + 1 | 0] << 8 | HEAPU8[r3 + 2 | 0] << 16 | HEAPU8[r3 + 3 | 0] << 24 | 0;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r2 + 12 | 0;
  tempBigInt = HEAPU8[r6] | HEAPU8[r6 + 1 | 0] << 8 | HEAPU8[r6 + 2 | 0] << 16 | HEAPU8[r6 + 3 | 0] << 24 | 0;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r2 + 16 | 0;
  tempBigInt = r9 & 1;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r1 | 0;
  r6 = r2 + 20 | 0;
  tempBigInt = HEAPU8[r10] | HEAPU8[r10 + 1 | 0] << 8 | HEAPU8[r10 + 2 | 0] << 16 | HEAPU8[r10 + 3 | 0] << 24 | 0;
  HEAP8[r6] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r6 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r6 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r6 + 3 | 0] = tempBigInt & 255;
  r6 = r1 + 20 | 0;
  r10 = r2 + 24 | 0;
  r3 = r6 | 0;
  r11 = r6 + 4 | 0;
  r6 = HEAPU8[r11] | HEAPU8[r11 + 1 | 0] << 8 | HEAPU8[r11 + 2 | 0] << 16 | HEAPU8[r11 + 3 | 0] << 24 | 0;
  r11 = r10 | 0;
  tempBigInt = HEAPU8[r3] | HEAPU8[r3 + 1 | 0] << 8 | HEAPU8[r3 + 2 | 0] << 16 | HEAPU8[r3 + 3 | 0] << 24 | 0;
  HEAP8[r11] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 3 | 0] = tempBigInt & 255;
  r11 = r10 + 4 | 0;
  tempBigInt = r6;
  HEAP8[r11] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r11 + 3 | 0] = tempBigInt & 255;
  r11 = r1 + 28 | 0;
  r6 = r2 + 32 | 0;
  r10 = r11 | 0;
  r3 = r11 + 4 | 0;
  r11 = HEAPU8[r3] | HEAPU8[r3 + 1 | 0] << 8 | HEAPU8[r3 + 2 | 0] << 16 | HEAPU8[r3 + 3 | 0] << 24 | 0;
  r3 = r6 | 0;
  tempBigInt = HEAPU8[r10] | HEAPU8[r10 + 1 | 0] << 8 | HEAPU8[r10 + 2 | 0] << 16 | HEAPU8[r10 + 3 | 0] << 24 | 0;
  HEAP8[r3] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 3 | 0] = tempBigInt & 255;
  r3 = r6 + 4 | 0;
  tempBigInt = r11;
  HEAP8[r3] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r3 + 3 | 0] = tempBigInt & 255;
  r3 = r1 + 36 | 0;
  r11 = r2 + 40 | 0;
  r6 = r3 | 0;
  r10 = r3 + 4 | 0;
  r3 = HEAPU8[r10] | HEAPU8[r10 + 1 | 0] << 8 | HEAPU8[r10 + 2 | 0] << 16 | HEAPU8[r10 + 3 | 0] << 24 | 0;
  r10 = r11 | 0;
  tempBigInt = HEAPU8[r6] | HEAPU8[r6 + 1 | 0] << 8 | HEAPU8[r6 + 2 | 0] << 16 | HEAPU8[r6 + 3 | 0] << 24 | 0;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r11 + 4 | 0;
  tempBigInt = r3;
  HEAP8[r10] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r10 + 3 | 0] = tempBigInt & 255;
  r10 = r1 + 44 | 0;
  r3 = r2 + 48 | 0;
  r11 = r10 | 0;
  r6 = r10 + 4 | 0;
  r10 = HEAPU8[r6] | HEAPU8[r6 + 1 | 0] << 8 | HEAPU8[r6 + 2 | 0] << 16 | HEAPU8[r6 + 3 | 0] << 24 | 0;
  r12 = r3 | 0;
  tempBigInt = HEAPU8[r11] | HEAPU8[r11 + 1 | 0] << 8 | HEAPU8[r11 + 2 | 0] << 16 | HEAPU8[r11 + 3 | 0] << 24 | 0;
  HEAP8[r12] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 3 | 0] = tempBigInt & 255;
  r12 = r3 + 4 | 0;
  tempBigInt = r10;
  HEAP8[r12] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r12 + 3 | 0] = tempBigInt & 255;
  r12 = r1 + 52 | 0;
  r10 = r2 + 56 | 0;
  r3 = r12 | 0;
  r13 = r12 + 4 | 0;
  r12 = HEAPU8[r13] | HEAPU8[r13 + 1 | 0] << 8 | HEAPU8[r13 + 2 | 0] << 16 | HEAPU8[r13 + 3 | 0] << 24 | 0;
  r13 = r10 | 0;
  tempBigInt = HEAPU8[r3] | HEAPU8[r3 + 1 | 0] << 8 | HEAPU8[r3 + 2 | 0] << 16 | HEAPU8[r3 + 3 | 0] << 24 | 0;
  HEAP8[r13] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 3 | 0] = tempBigInt & 255;
  r13 = r10 + 4 | 0;
  tempBigInt = r12;
  HEAP8[r13] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r13 + 3 | 0] = tempBigInt & 255;
  r13 = r2 + 64 | 0;
  if ((r5 | 0) > 0) {
    r12 = r1 + 88 | 0;
    r10 = r1 + 92 | 0;
    r3 = r1 + 60 | 0;
    r14 = r1 + 64 | 0;
    r15 = r1 + 84 | 0;
    r16 = r1 + 68 | 0;
    r17 = (r4 << 6) + 256 | 0;
    r4 = r13;
    r18 = 0;
    while (1) {
      r19 = (r18 << 2) + HEAP32[r12 >> 2] | 0;
      r20 = r4;
      tempBigInt = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0;
      HEAP8[r20] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 3 | 0] = tempBigInt & 255;
      r20 = (r18 << 2) + HEAP32[r10 >> 2] | 0;
      r19 = r4 + 4 | 0;
      tempBigInt = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      HEAP8[r19] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 3 | 0] = tempBigInt & 255;
      r19 = (r18 << 3) + HEAP32[r3 >> 2] | 0;
      r20 = r4 + 8 | 0;
      r21 = r19 | 0;
      r22 = r19 + 4 | 0;
      r19 = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0;
      r22 = r20 | 0;
      tempBigInt = HEAPU8[r21] | HEAPU8[r21 + 1 | 0] << 8 | HEAPU8[r21 + 2 | 0] << 16 | HEAPU8[r21 + 3 | 0] << 24 | 0;
      HEAP8[r22] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 3 | 0] = tempBigInt & 255;
      r22 = r20 + 4 | 0;
      tempBigInt = r19;
      HEAP8[r22] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 3 | 0] = tempBigInt & 255;
      r22 = (r18 << 3) + HEAP32[r14 >> 2] | 0;
      r19 = r4 + 16 | 0;
      r20 = r22 | 0;
      r21 = r22 + 4 | 0;
      r22 = HEAPU8[r21] | HEAPU8[r21 + 1 | 0] << 8 | HEAPU8[r21 + 2 | 0] << 16 | HEAPU8[r21 + 3 | 0] << 24 | 0;
      r21 = r19 | 0;
      tempBigInt = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      HEAP8[r21] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 3 | 0] = tempBigInt & 255;
      r21 = r19 + 4 | 0;
      tempBigInt = r22;
      HEAP8[r21] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 3 | 0] = tempBigInt & 255;
      r21 = (r18 << 3) + HEAP32[r15 >> 2] | 0;
      r22 = r4 + 24 | 0;
      r19 = r21 | 0;
      r20 = r21 + 4 | 0;
      r21 = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      r20 = r22 | 0;
      tempBigInt = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0;
      HEAP8[r20] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 3 | 0] = tempBigInt & 255;
      r20 = r22 + 4 | 0;
      tempBigInt = r21;
      HEAP8[r20] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r20 + 3 | 0] = tempBigInt & 255;
      r20 = (r18 << 3) + HEAP32[r16 >> 2] | 0;
      r21 = r4 + 32 | 0;
      r22 = r20 | 0;
      r19 = r20 + 4 | 0;
      r20 = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0;
      r19 = r21 | 0;
      tempBigInt = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0;
      HEAP8[r19] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 3 | 0] = tempBigInt & 255;
      r19 = r21 + 4 | 0;
      tempBigInt = r20;
      HEAP8[r19] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r19 + 3 | 0] = tempBigInt & 255;
      r19 = (r18 << 3) + HEAP32[r1 + 76 >> 2] | 0;
      r20 = r4 + 40 | 0;
      r21 = r19 | 0;
      r22 = r19 + 4 | 0;
      r19 = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0;
      r11 = r20 | 0;
      tempBigInt = HEAPU8[r21] | HEAPU8[r21 + 1 | 0] << 8 | HEAPU8[r21 + 2 | 0] << 16 | HEAPU8[r21 + 3 | 0] << 24 | 0;
      HEAP8[r11] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r11 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r11 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r11 + 3 | 0] = tempBigInt & 255;
      r6 = r20 + 4 | 0;
      tempBigInt = r19;
      HEAP8[r6] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r6 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r6 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r6 + 3 | 0] = tempBigInt & 255;
      r19 = (r18 << 3) + HEAP32[r1 + 72 >> 2] | 0;
      r20 = r4 + 48 | 0;
      r21 = r19 | 0;
      r22 = r19 + 4 | 0;
      r19 = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0;
      r22 = r20 | 0;
      tempBigInt = HEAPU8[r21] | HEAPU8[r21 + 1 | 0] << 8 | HEAPU8[r21 + 2 | 0] << 16 | HEAPU8[r21 + 3 | 0] << 24 | 0;
      HEAP8[r22] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 3 | 0] = tempBigInt & 255;
      r22 = r20 + 4 | 0;
      tempBigInt = r19;
      HEAP8[r22] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r22 + 3 | 0] = tempBigInt & 255;
      r22 = (r18 << 3) + HEAP32[r1 + 80 >> 2] | 0;
      r19 = r4 + 56 | 0;
      r20 = r22 | 0;
      r21 = r22 + 4 | 0;
      r22 = HEAPU8[r21] | HEAPU8[r21 + 1 | 0] << 8 | HEAPU8[r21 + 2 | 0] << 16 | HEAPU8[r21 + 3 | 0] << 24 | 0;
      r21 = r19 | 0;
      tempBigInt = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      HEAP8[r21] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 3 | 0] = tempBigInt & 255;
      r21 = r19 + 4 | 0;
      tempBigInt = r22;
      HEAP8[r21] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r21 + 3 | 0] = tempBigInt & 255;
      r21 = r18 + 1 | 0;
      if ((r21 | 0) == (r5 | 0)) {
        break;
      } else {
        r4 = r4 + 64 | 0;
        r18 = r21;
      }
    }
    r23 = r2 + r17 | 0;
  } else {
    r23 = r13;
  }
  if ((r8 | 0) == 0 | r9 ^ 1) {
    r24 = r23;
    return r24;
  }
  r9 = r1 + 100 | 0;
  r1 = (r8 | 0) > 1 ? r8 << 4 : 16;
  r13 = r23;
  r17 = 0;
  while (1) {
    r2 = (r17 << 3) + HEAP32[r7 >> 2] | 0;
    r18 = r13;
    r4 = r2 | 0;
    r5 = r2 + 4 | 0;
    r2 = HEAPU8[r5] | HEAPU8[r5 + 1 | 0] << 8 | HEAPU8[r5 + 2 | 0] << 16 | HEAPU8[r5 + 3 | 0] << 24 | 0;
    r5 = r18 | 0;
    tempBigInt = HEAPU8[r4] | HEAPU8[r4 + 1 | 0] << 8 | HEAPU8[r4 + 2 | 0] << 16 | HEAPU8[r4 + 3 | 0] << 24 | 0;
    HEAP8[r5] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 1 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 2 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 3 | 0] = tempBigInt & 255;
    r5 = r18 + 4 | 0;
    tempBigInt = r2;
    HEAP8[r5] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 1 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 2 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r5 + 3 | 0] = tempBigInt & 255;
    r5 = (r17 << 3) + HEAP32[r9 >> 2] | 0;
    r2 = r13 + 8 | 0;
    r18 = r5 | 0;
    r4 = r5 + 4 | 0;
    r5 = HEAPU8[r4] | HEAPU8[r4 + 1 | 0] << 8 | HEAPU8[r4 + 2 | 0] << 16 | HEAPU8[r4 + 3 | 0] << 24 | 0;
    r4 = r2 | 0;
    tempBigInt = HEAPU8[r18] | HEAPU8[r18 + 1 | 0] << 8 | HEAPU8[r18 + 2 | 0] << 16 | HEAPU8[r18 + 3 | 0] << 24 | 0;
    HEAP8[r4] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 1 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 2 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 3 | 0] = tempBigInt & 255;
    r4 = r2 + 4 | 0;
    tempBigInt = r5;
    HEAP8[r4] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 1 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 2 | 0] = tempBigInt & 255;
    tempBigInt = tempBigInt >> 8;
    HEAP8[r4 + 3 | 0] = tempBigInt & 255;
    r4 = r17 + 1 | 0;
    if ((r4 | 0) < (r8 | 0)) {
      r13 = r13 + 16 | 0;
      r17 = r4;
    } else {
      break;
    }
  }
  r24 = r23 + r1 | 0;
  return r24;
}
Module["__ZN17VizGeorefSpline2D9serializeEPc"] = __ZN17VizGeorefSpline2D9serializeEPc;
function __Z12matrixInvertiPdS_(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24;
  r4 = 0;
  r5 = r1 << 1;
  r6 = _llvm_umul_with_overflow_i32(Math.imul(r5, r1), 8);
  r7 = __Znaj(tempRet0 ? -1 : r6);
  r6 = r7;
  if ((r7 | 0) == 0) {
    _fwrite(5242904, 50, 1, HEAP32[_stderr >> 2]);
    r8 = 0;
    return r8;
  }
  r9 = (r1 | 0) > 0;
  L179 : do {
    if (r9) {
      r10 = 0;
      while (1) {
        r11 = Math.imul(r10, r1);
        r12 = Math.imul(r5, r10);
        r13 = 0;
        while (1) {
          r14 = (r13 + r11 << 3) + r2 | 0;
          r15 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r14 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r14 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
          r14 = r13 + r12 | 0;
          r16 = (r14 << 3) + r6 | 0;
          HEAPF64[tempDoublePtr >> 3] = r15, HEAP32[r16 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r16 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
          r16 = (r14 + r1 << 3) + r6 | 0;
          HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r16 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r16 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
          r16 = r13 + 1 | 0;
          if ((r16 | 0) == (r1 | 0)) {
            break;
          } else {
            r13 = r16;
          }
        }
        r13 = (r10 + r1 + r12 << 3) + r6 | 0;
        HEAPF64[tempDoublePtr >> 3] = 1, HEAP32[r13 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r13 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
        r13 = r10 + 1 | 0;
        if ((r13 | 0) == (r1 | 0)) {
          break;
        } else {
          r10 = r13;
        }
      }
      if (!r9) {
        break;
      }
      r10 = r1 << 1;
      r13 = 0;
      while (1) {
        r11 = r13 + 1 | 0;
        r16 = (r11 | 0) < (r1 | 0);
        L189 : do {
          if (r16) {
            r14 = r11;
            r15 = r13;
            while (1) {
              r17 = (Math.imul(r5, r14) + r13 << 3) + r6 | 0;
              r18 = Math.abs((HEAP32[tempDoublePtr >> 2] = HEAP32[r17 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r17 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]));
              r17 = (Math.imul(r5, r15) + r13 << 3) + r6 | 0;
              r19 = r18 > Math.abs((HEAP32[tempDoublePtr >> 2] = HEAP32[r17 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r17 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) ? r14 : r15;
              r17 = r14 + 1 | 0;
              if ((r17 | 0) == (r1 | 0)) {
                break;
              } else {
                r14 = r17;
                r15 = r19;
              }
            }
            if (!((r19 | 0) != (r13 | 0) & (r13 | 0) < (r5 | 0))) {
              break;
            }
            r15 = Math.imul(r5, r13);
            r14 = Math.imul(r5, r19);
            r17 = r13;
            while (1) {
              r18 = ((r17 + r15 << 3) + r6 | 0) >> 2;
              r20 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r18], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r18 + 1], HEAPF64[tempDoublePtr >> 3]);
              r21 = ((r17 + r14 << 3) + r6 | 0) >> 2;
              r22 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r21], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r21 + 1], HEAPF64[tempDoublePtr >> 3]);
              HEAPF64[tempDoublePtr >> 3] = r22, HEAP32[r18] = HEAP32[tempDoublePtr >> 2], HEAP32[r18 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
              HEAPF64[tempDoublePtr >> 3] = r20, HEAP32[r21] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
              r21 = r17 + 1 | 0;
              if ((r21 | 0) == (r10 | 0)) {
                break L189;
              } else {
                r17 = r21;
              }
            }
          }
        } while (0);
        r12 = Math.imul(r13 << 1, r1);
        r17 = (r12 + r13 << 3) + r6 | 0;
        r14 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r17 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r17 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
        if (r14 == 0) {
          r4 = 148;
          break;
        }
        r17 = (r13 | 0) < (r5 | 0);
        L198 : do {
          if (r17) {
            r15 = r13;
            while (1) {
              r21 = ((r15 + r12 << 3) + r6 | 0) >> 2;
              r20 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r21], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r21 + 1], HEAPF64[tempDoublePtr >> 3]) / r14;
              HEAPF64[tempDoublePtr >> 3] = r20, HEAP32[r21] = HEAP32[tempDoublePtr >> 2], HEAP32[r21 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
              r21 = r15 + 1 | 0;
              if ((r21 | 0) == (r10 | 0)) {
                break;
              } else {
                r15 = r21;
              }
            }
            if (r17) {
              r23 = 0;
            } else {
              break;
            }
            while (1) {
              L204 : do {
                if ((r23 | 0) != (r13 | 0)) {
                  r15 = Math.imul(r23 << 1, r1);
                  r21 = (r15 + r13 << 3) + r6 | 0;
                  r20 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r21 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r21 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                  r21 = r13;
                  while (1) {
                    r18 = (r21 + r12 << 3) + r6 | 0;
                    r22 = r20 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r18 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r18 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
                    r18 = ((r21 + r15 << 3) + r6 | 0) >> 2;
                    r24 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r18], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r18 + 1], HEAPF64[tempDoublePtr >> 3]) - r22;
                    HEAPF64[tempDoublePtr >> 3] = r24, HEAP32[r18] = HEAP32[tempDoublePtr >> 2], HEAP32[r18 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
                    r18 = r21 + 1 | 0;
                    if ((r18 | 0) == (r10 | 0)) {
                      break L204;
                    } else {
                      r21 = r18;
                    }
                  }
                }
              } while (0);
              r21 = r23 + 1 | 0;
              if ((r21 | 0) == (r1 | 0)) {
                break L198;
              } else {
                r23 = r21;
              }
            }
          }
        } while (0);
        if (r16) {
          r13 = r11;
        } else {
          break;
        }
      }
      if (r4 == 148) {
        __ZdaPv(r7);
        r8 = 0;
        return r8;
      }
      if (!r9) {
        break;
      }
      r13 = r1 << 3;
      r10 = r1 << 4;
      r12 = 0;
      while (1) {
        r17 = Math.imul(r10, r12);
        _memcpy((Math.imul(r12, r1) << 3) + r3 | 0, r7 + r13 + r17 | 0, r13);
        r17 = r12 + 1 | 0;
        if ((r17 | 0) == (r1 | 0)) {
          break L179;
        } else {
          r12 = r17;
        }
      }
    }
  } while (0);
  __ZdaPv(r7);
  r8 = 1;
  return r8;
}
function __ZN17VizGeorefSpline2D9get_pointEddPd(r1, r2, r3, r4) {
  var r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33;
  r5 = r1 >> 2;
  r6 = HEAP32[r5];
  if ((r6 | 0) == 4) {
    r7 = (r1 + 4 | 0) >> 2;
    r8 = HEAP32[r7];
    L222 : do {
      if ((r8 | 0) > 0) {
        r9 = 0;
        while (1) {
          r10 = HEAP32[((r9 << 2) + 76 >> 2) + r5];
          r11 = r10 + 8 | 0;
          r12 = r10 + 16 | 0;
          r13 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r10 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r10 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) + (HEAP32[tempDoublePtr >> 2] = HEAP32[r11 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r11 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * r2 + (HEAP32[tempDoublePtr >> 2] = HEAP32[r12 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r12 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * r3;
          r12 = (r9 << 3) + r4 | 0;
          HEAPF64[tempDoublePtr >> 3] = r13, HEAP32[r12 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r12 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
          r12 = r9 + 1 | 0;
          r13 = HEAP32[r7];
          if ((r12 | 0) < (r13 | 0)) {
            r9 = r12;
          } else {
            r14 = r13;
            break L222;
          }
        }
      } else {
        r14 = r8;
      }
    } while (0);
    r8 = r1 + 8 | 0;
    r9 = HEAP32[r8 >> 2];
    if ((r9 | 0) <= 0) {
      r15 = 1;
      return r15;
    }
    r13 = r1 + 60 | 0;
    r12 = r1 + 64 | 0;
    r11 = 0;
    r10 = r14;
    r14 = r9;
    while (1) {
      r9 = (r11 << 3) + HEAP32[r13 >> 2] | 0;
      r16 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r9 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r9 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
      r9 = (r11 << 3) + HEAP32[r12 >> 2] | 0;
      r17 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r9 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r9 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
      if (r16 == r2 & r17 == r3) {
        r18 = 0;
      } else {
        r9 = r16 - r2;
        r16 = r17 - r3;
        r17 = r9 * r9 + r16 * r16;
        r18 = r17 * Math.log(r17);
      }
      if ((r10 | 0) > 0) {
        r17 = r11 + 3 | 0;
        r16 = 0;
        while (1) {
          r9 = (r17 << 3) + HEAP32[((r16 << 2) + 76 >> 2) + r5] | 0;
          r19 = ((r16 << 3) + r4 | 0) >> 2;
          r20 = r18 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r9 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r9 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) + (HEAP32[tempDoublePtr >> 2] = HEAP32[r19], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r19 + 1], HEAPF64[tempDoublePtr >> 3]);
          HEAPF64[tempDoublePtr >> 3] = r20, HEAP32[r19] = HEAP32[tempDoublePtr >> 2], HEAP32[r19 + 1] = HEAP32[tempDoublePtr + 4 >> 2];
          r19 = r16 + 1 | 0;
          r21 = HEAP32[r7];
          if ((r19 | 0) < (r21 | 0)) {
            r16 = r19;
          } else {
            break;
          }
        }
        r22 = r21;
        r23 = HEAP32[r8 >> 2];
      } else {
        r22 = r10;
        r23 = r14;
      }
      r16 = r11 + 1 | 0;
      if ((r16 | 0) < (r23 | 0)) {
        r11 = r16;
        r10 = r22;
        r14 = r23;
      } else {
        r15 = 1;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 1) {
    r23 = r1 + 4 | 0;
    if ((HEAP32[r23 >> 2] | 0) > 0) {
      r24 = 0;
    } else {
      r15 = 1;
      return r15;
    }
    while (1) {
      r14 = HEAP32[((r24 << 2) + 68 >> 2) + r5] + 24 | 0;
      r22 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r14 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r14 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
      r14 = (r24 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = r22, HEAP32[r14 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r14 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r14 = r24 + 1 | 0;
      if ((r14 | 0) < (HEAP32[r23 >> 2] | 0)) {
        r24 = r14;
      } else {
        r15 = 1;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 0) {
    r24 = r1 + 4 | 0;
    if ((HEAP32[r24 >> 2] | 0) > 0) {
      r25 = 0;
    } else {
      r15 = 1;
      return r15;
    }
    while (1) {
      r23 = (r25 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r23 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r23 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r23 = r25 + 1 | 0;
      if ((r23 | 0) < (HEAP32[r24 >> 2] | 0)) {
        r25 = r23;
      } else {
        r15 = 1;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 2) {
    r25 = r1 + 44 | 0;
    r24 = HEAP32[r5 + 15];
    r23 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r25 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r25 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * (r2 - (HEAP32[tempDoublePtr >> 2] = HEAP32[r24 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r24 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]));
    r24 = r1 + 52 | 0;
    r25 = HEAP32[r5 + 16];
    r14 = r23 + (HEAP32[tempDoublePtr >> 2] = HEAP32[r24 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r24 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * (r3 - (HEAP32[tempDoublePtr >> 2] = HEAP32[r25 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r25 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]));
    r25 = r1 + 4 | 0;
    if ((HEAP32[r25 >> 2] | 0) <= 0) {
      r15 = 1;
      return r15;
    }
    r24 = 1 - r14;
    r23 = 0;
    while (1) {
      r22 = HEAP32[((r23 << 2) + 68 >> 2) + r5];
      r10 = r22 + 24 | 0;
      r11 = r22 + 32 | 0;
      r22 = r24 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r10 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r10 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) + r14 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r11 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r11 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
      r11 = (r23 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = r22, HEAP32[r11 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r11 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r11 = r23 + 1 | 0;
      if ((r11 | 0) < (HEAP32[r25 >> 2] | 0)) {
        r23 = r11;
      } else {
        r15 = 1;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 3) {
    r23 = r1 + 44 | 0;
    r25 = HEAP32[r5 + 15];
    r14 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r23 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r23 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * (r2 - (HEAP32[tempDoublePtr >> 2] = HEAP32[r25 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r25 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]));
    r25 = r1 + 52 | 0;
    r2 = HEAP32[r5 + 16];
    r23 = r14 + (HEAP32[tempDoublePtr >> 2] = HEAP32[r25 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r25 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) * (r3 - (HEAP32[tempDoublePtr >> 2] = HEAP32[r2 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r2 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]));
    r2 = HEAP32[r5 + 23] >> 2;
    r3 = HEAP32[r2];
    r25 = HEAP32[r5 + 21];
    r14 = (r3 << 3) + r25 | 0;
    L261 : do {
      if (r23 > (HEAP32[tempDoublePtr >> 2] = HEAP32[r14 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r14 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) {
        r24 = HEAP32[r5 + 2];
        r11 = HEAP32[(r24 - 1 << 2 >> 2) + r2];
        r22 = (r11 << 3) + r25 | 0;
        if (r23 < (HEAP32[tempDoublePtr >> 2] = HEAP32[r22 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r22 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) {
          r26 = 1;
          r27 = 0;
          r28 = 0;
          r29 = r3;
        } else {
          r30 = r11;
          r31 = HEAP32[(r24 - 2 << 2 >> 2) + r2];
          break;
        }
        while (1) {
          if ((r26 | 0) >= (r24 | 0)) {
            r30 = r28;
            r31 = r27;
            break L261;
          }
          r11 = HEAP32[(r26 << 2 >> 2) + r2];
          r22 = (r29 << 3) + r25 | 0;
          if (r23 >= (HEAP32[tempDoublePtr >> 2] = HEAP32[r22 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r22 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) {
            r22 = (r11 << 3) + r25 | 0;
            if (r23 <= (HEAP32[tempDoublePtr >> 2] = HEAP32[r22 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r22 + 4 >> 2], HEAPF64[tempDoublePtr >> 3])) {
              r30 = r11;
              r31 = r29;
              break L261;
            }
          }
          r26 = r26 + 1 | 0;
          r27 = r29;
          r28 = r11;
          r29 = r11;
        }
      } else {
        r30 = HEAP32[r2 + 1];
        r31 = r3;
      }
    } while (0);
    r3 = (r31 << 3) + r25 | 0;
    r2 = (HEAP32[tempDoublePtr >> 2] = HEAP32[r3 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r3 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
    r3 = (r30 << 3) + r25 | 0;
    r25 = (r23 - r2) / ((HEAP32[tempDoublePtr >> 2] = HEAP32[r3 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r3 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) - r2);
    r2 = r1 + 4 | 0;
    if ((HEAP32[r2 >> 2] | 0) <= 0) {
      r15 = 1;
      return r15;
    }
    r3 = 1 - r25;
    r23 = r31 + 3 | 0;
    r31 = r30 + 3 | 0;
    r30 = 0;
    while (1) {
      r29 = HEAP32[((r30 << 2) + 68 >> 2) + r5];
      r28 = (r23 << 3) + r29 | 0;
      r27 = (r31 << 3) + r29 | 0;
      r29 = r3 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r28 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r28 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]) + r25 * (HEAP32[tempDoublePtr >> 2] = HEAP32[r27 >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[r27 + 4 >> 2], HEAPF64[tempDoublePtr >> 3]);
      r27 = (r30 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = r29, HEAP32[r27 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r27 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r27 = r30 + 1 | 0;
      if ((r27 | 0) < (HEAP32[r2 >> 2] | 0)) {
        r30 = r27;
      } else {
        r15 = 1;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 5) {
    _fwrite(5243060, 40, 1, HEAP32[_stderr >> 2]);
    _fwrite(5243e3, 43, 1, HEAP32[_stderr >> 2]);
    r30 = r1 + 4 | 0;
    if ((HEAP32[r30 >> 2] | 0) > 0) {
      r32 = 0;
    } else {
      r15 = 0;
      return r15;
    }
    while (1) {
      r2 = (r32 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r2 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r2 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r2 = r32 + 1 | 0;
      if ((r2 | 0) < (HEAP32[r30 >> 2] | 0)) {
        r32 = r2;
      } else {
        r15 = 0;
        break;
      }
    }
    return r15;
  } else if ((r6 | 0) == 6) {
    _fwrite(5242956, 42, 1, HEAP32[_stderr >> 2]);
    _fwrite(5243e3, 43, 1, HEAP32[_stderr >> 2]);
    r6 = r1 + 4 | 0;
    if ((HEAP32[r6 >> 2] | 0) > 0) {
      r33 = 0;
    } else {
      r15 = 0;
      return r15;
    }
    while (1) {
      r1 = (r33 << 3) + r4 | 0;
      HEAPF64[tempDoublePtr >> 3] = 0, HEAP32[r1 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[r1 + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2];
      r1 = r33 + 1 | 0;
      if ((r1 | 0) < (HEAP32[r6 >> 2] | 0)) {
        r33 = r1;
      } else {
        r15 = 0;
        break;
      }
    }
    return r15;
  } else {
    r15 = 0;
    return r15;
  }
}
Module["__ZN17VizGeorefSpline2D9get_pointEddPd"] = __ZN17VizGeorefSpline2D9get_pointEddPd;
function __ZN17VizGeorefSpline2D11deserializeEPc(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24;
  r3 = (r1 + 96 | 0) >> 2;
  r4 = HEAP32[r3];
  if ((r4 | 0) != 0) {
    _free(r4);
    HEAP32[r3] = 0;
  }
  r4 = (r1 + 100 | 0) >> 2;
  r5 = HEAP32[r4];
  if ((r5 | 0) != 0) {
    _free(r5);
    HEAP32[r4] = 0;
  }
  r5 = (r1 + 60 | 0) >> 2;
  _free(HEAP32[r5]);
  r6 = (r1 + 64 | 0) >> 2;
  _free(HEAP32[r6]);
  r7 = (r1 + 84 | 0) >> 2;
  _free(HEAP32[r7]);
  r8 = (r1 + 88 | 0) >> 2;
  _free(HEAP32[r8]);
  r9 = (r1 + 92 | 0) >> 2;
  _free(HEAP32[r9]);
  r10 = (r1 + 68 | 0) >> 2;
  _free(HEAP32[r10]);
  r11 = (r1 + 76 | 0) >> 2;
  _free(HEAP32[r11]);
  r12 = (r1 + 72 | 0) >> 2;
  _free(HEAP32[r12]);
  r13 = (r1 + 80 | 0) >> 2;
  _free(HEAP32[r13]);
  r14 = r1 + 4 | 0;
  r15 = r2;
  tempBigInt = HEAPU8[r15] | HEAPU8[r15 + 1 | 0] << 8 | HEAPU8[r15 + 2 | 0] << 16 | HEAPU8[r15 + 3 | 0] << 24 | 0;
  HEAP8[r14] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 3 | 0] = tempBigInt & 255;
  r14 = r1 + 8 | 0;
  r15 = r2 + 4 | 0;
  tempBigInt = HEAPU8[r15] | HEAPU8[r15 + 1 | 0] << 8 | HEAPU8[r15 + 2 | 0] << 16 | HEAPU8[r15 + 3 | 0] << 24 | 0;
  HEAP8[r14] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 3 | 0] = tempBigInt & 255;
  r14 = r1 + 12 | 0;
  r15 = r2 + 8 | 0;
  r16 = HEAPU8[r15] | HEAPU8[r15 + 1 | 0] << 8 | HEAPU8[r15 + 2 | 0] << 16 | HEAPU8[r15 + 3 | 0] << 24 | 0;
  tempBigInt = r16;
  HEAP8[r14] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 3 | 0] = tempBigInt & 255;
  r14 = r1 + 16 | 0;
  r15 = r2 + 12 | 0;
  r17 = HEAPU8[r15] | HEAPU8[r15 + 1 | 0] << 8 | HEAPU8[r15 + 2 | 0] << 16 | HEAPU8[r15 + 3 | 0] << 24 | 0;
  tempBigInt = r17;
  HEAP8[r14] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r14 + 3 | 0] = tempBigInt & 255;
  r14 = r2 + 16 | 0;
  r15 = HEAPU8[r14] | HEAPU8[r14 + 1 | 0] << 8 | HEAPU8[r14 + 2 | 0] << 16 | HEAPU8[r14 + 3 | 0] << 24 | 0;
  r14 = r2 + 20 | 0;
  r18 = r1 | 0;
  tempBigInt = HEAPU8[r14] | HEAPU8[r14 + 1 | 0] << 8 | HEAPU8[r14 + 2 | 0] << 16 | HEAPU8[r14 + 3 | 0] << 24 | 0;
  HEAP8[r18] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r18 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r18 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r18 + 3 | 0] = tempBigInt & 255;
  r18 = r1 + 20 | 0;
  r14 = r2 + 24 | 0;
  r19 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r14] | HEAPU8[r14 + 1 | 0] << 8 | HEAPU8[r14 + 2 | 0] << 16 | HEAPU8[r14 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r14 + 4 | 0] | HEAPU8[r14 + 5 | 0] << 8 | HEAPU8[r14 + 6 | 0] << 16 | HEAPU8[r14 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
  HEAPF64[tempDoublePtr >> 3] = r19, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r18] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r18 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 7 | 0] = tempBigInt & 255;
  r18 = r1 + 28 | 0;
  r19 = r2 + 32 | 0;
  r14 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r19 + 4 | 0] | HEAPU8[r19 + 5 | 0] << 8 | HEAPU8[r19 + 6 | 0] << 16 | HEAPU8[r19 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
  HEAPF64[tempDoublePtr >> 3] = r14, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r18] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r18 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 7 | 0] = tempBigInt & 255;
  r18 = r1 + 36 | 0;
  r14 = r2 + 40 | 0;
  r19 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r14] | HEAPU8[r14 + 1 | 0] << 8 | HEAPU8[r14 + 2 | 0] << 16 | HEAPU8[r14 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r14 + 4 | 0] | HEAPU8[r14 + 5 | 0] << 8 | HEAPU8[r14 + 6 | 0] << 16 | HEAPU8[r14 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
  HEAPF64[tempDoublePtr >> 3] = r19, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r18] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r18 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 7 | 0] = tempBigInt & 255;
  r18 = r1 + 44 | 0;
  r19 = r2 + 48 | 0;
  r14 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r19 + 4 | 0] | HEAPU8[r19 + 5 | 0] << 8 | HEAPU8[r19 + 6 | 0] << 16 | HEAPU8[r19 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
  HEAPF64[tempDoublePtr >> 3] = r14, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r18] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r18 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 7 | 0] = tempBigInt & 255;
  r18 = r1 + 52 | 0;
  r1 = r2 + 56 | 0;
  r14 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r1] | HEAPU8[r1 + 1 | 0] << 8 | HEAPU8[r1 + 2 | 0] << 16 | HEAPU8[r1 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r1 + 4 | 0] | HEAPU8[r1 + 5 | 0] << 8 | HEAPU8[r1 + 6 | 0] << 16 | HEAPU8[r1 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
  HEAPF64[tempDoublePtr >> 3] = r14, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r18] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r18 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r18 + 7 | 0] = tempBigInt & 255;
  r18 = r16 + 3 | 0;
  r14 = r18 << 3;
  HEAP32[r5] = _malloc(r14);
  HEAP32[r6] = _malloc(r14);
  HEAP32[r7] = _malloc(r14);
  r1 = r18 << 2;
  HEAP32[r8] = _malloc(r1);
  HEAP32[r9] = _malloc(r1);
  r1 = r18 >>> 0 > 65535;
  r19 = (r18 & 536870911 | 0) == (r18 | 0) ? r14 : -1;
  r20 = r1 ? r19 : r14;
  r21 = _malloc(r20);
  do {
    if ((r21 | 0) != 0) {
      if ((HEAP32[r21 - 4 >> 2] & 3 | 0) == 0) {
        break;
      }
      _memset(r21, 0, r20);
    }
  } while (0);
  HEAP32[r10] = r21;
  r21 = r1 ? r19 : r14;
  r20 = _malloc(r21);
  do {
    if ((r20 | 0) != 0) {
      if ((HEAP32[r20 - 4 >> 2] & 3 | 0) == 0) {
        break;
      }
      _memset(r20, 0, r21);
    }
  } while (0);
  HEAP32[r11] = r20;
  r20 = r1 ? r19 : r14;
  r21 = _malloc(r20);
  do {
    if ((r21 | 0) != 0) {
      if ((HEAP32[r21 - 4 >> 2] & 3 | 0) == 0) {
        break;
      }
      _memset(r21, 0, r20);
    }
  } while (0);
  HEAP32[r12] = r21;
  r21 = r1 ? r19 : r14;
  r14 = _malloc(r21);
  do {
    if ((r14 | 0) != 0) {
      if ((HEAP32[r14 - 4 >> 2] & 3 | 0) == 0) {
        break;
      }
      _memset(r14, 0, r21);
    }
  } while (0);
  HEAP32[r13] = r14;
  r14 = r2 + 64 | 0;
  r21 = Math.imul(r17, r17);
  if ((r18 | 0) > 0) {
    r17 = (r16 << 6) + 256 | 0;
    r16 = r14;
    r19 = 0;
    while (1) {
      r1 = (r19 << 2) + HEAP32[r8] | 0;
      r20 = r16;
      tempBigInt = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      HEAP8[r1] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 3 | 0] = tempBigInt & 255;
      r1 = (r19 << 2) + HEAP32[r9] | 0;
      r20 = r16 + 4 | 0;
      tempBigInt = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0;
      HEAP8[r1] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 1 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 2 | 0] = tempBigInt & 255;
      tempBigInt = tempBigInt >> 8;
      HEAP8[r1 + 3 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r5] | 0;
      r20 = r16 + 8 | 0;
      r22 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r20 + 4 | 0] | HEAPU8[r20 + 5 | 0] << 8 | HEAPU8[r20 + 6 | 0] << 16 | HEAPU8[r20 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r22, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r6] | 0;
      r22 = r16 + 16 | 0;
      r20 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r22 + 4 | 0] | HEAPU8[r22 + 5 | 0] << 8 | HEAPU8[r22 + 6 | 0] << 16 | HEAPU8[r22 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r20, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r7] | 0;
      r20 = r16 + 24 | 0;
      r22 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r20 + 4 | 0] | HEAPU8[r20 + 5 | 0] << 8 | HEAPU8[r20 + 6 | 0] << 16 | HEAPU8[r20 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r22, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r10] | 0;
      r22 = r16 + 32 | 0;
      r20 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r22 + 4 | 0] | HEAPU8[r22 + 5 | 0] << 8 | HEAPU8[r22 + 6 | 0] << 16 | HEAPU8[r22 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r20, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r11] | 0;
      r20 = r16 + 40 | 0;
      r22 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r20 + 4 | 0] | HEAPU8[r20 + 5 | 0] << 8 | HEAPU8[r20 + 6 | 0] << 16 | HEAPU8[r20 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r22, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r12] | 0;
      r22 = r16 + 48 | 0;
      r20 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r22] | HEAPU8[r22 + 1 | 0] << 8 | HEAPU8[r22 + 2 | 0] << 16 | HEAPU8[r22 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r22 + 4 | 0] | HEAPU8[r22 + 5 | 0] << 8 | HEAPU8[r22 + 6 | 0] << 16 | HEAPU8[r22 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r20, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = (r19 << 3) + HEAP32[r13] | 0;
      r20 = r16 + 56 | 0;
      r22 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r20] | HEAPU8[r20 + 1 | 0] << 8 | HEAPU8[r20 + 2 | 0] << 16 | HEAPU8[r20 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r20 + 4 | 0] | HEAPU8[r20 + 5 | 0] << 8 | HEAPU8[r20 + 6 | 0] << 16 | HEAPU8[r20 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
      HEAPF64[tempDoublePtr >> 3] = r22, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r1] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r1 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r1 + 7 | 0] = tempBigInt & 255;
      r1 = r19 + 1 | 0;
      if ((r1 | 0) == (r18 | 0)) {
        break;
      } else {
        r16 = r16 + 64 | 0;
        r19 = r1;
      }
    }
    r23 = r2 + r17 | 0;
  } else {
    r23 = r14;
  }
  if ((r15 | 0) == 0) {
    r24 = r23;
    return r24;
  }
  r15 = r21 << 3;
  HEAP32[r3] = _malloc(r15);
  HEAP32[r4] = _malloc(r15);
  if ((r21 | 0) == 0) {
    r24 = r23;
    return r24;
  }
  r15 = (r21 | 0) > 1 ? r21 << 4 : 16;
  r14 = r23;
  r17 = 0;
  while (1) {
    r2 = (r17 << 3) + HEAP32[r3] | 0;
    r19 = r14;
    r16 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r19] | HEAPU8[r19 + 1 | 0] << 8 | HEAPU8[r19 + 2 | 0] << 16 | HEAPU8[r19 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r19 + 4 | 0] | HEAPU8[r19 + 5 | 0] << 8 | HEAPU8[r19 + 6 | 0] << 16 | HEAPU8[r19 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
    HEAPF64[tempDoublePtr >> 3] = r16, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r2] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r2 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 7 | 0] = tempBigInt & 255;
    r2 = (r17 << 3) + HEAP32[r4] | 0;
    r16 = r14 + 8 | 0;
    r19 = (HEAP32[tempDoublePtr >> 2] = HEAPU8[r16] | HEAPU8[r16 + 1 | 0] << 8 | HEAPU8[r16 + 2 | 0] << 16 | HEAPU8[r16 + 3 | 0] << 24 | 0, HEAP32[tempDoublePtr + 4 >> 2] = HEAPU8[r16 + 4 | 0] | HEAPU8[r16 + 5 | 0] << 8 | HEAPU8[r16 + 6 | 0] << 16 | HEAPU8[r16 + 7 | 0] << 24 | 0, HEAPF64[tempDoublePtr >> 3]);
    HEAPF64[tempDoublePtr >> 3] = r19, tempBigInt = HEAP32[tempDoublePtr >> 2], HEAP8[r2] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 1 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 2 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 3 | 0] = tempBigInt & 255, tempBigInt = HEAP32[tempDoublePtr + 4 >> 2], HEAP8[r2 + 4 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 5 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 6 | 0] = tempBigInt & 255, tempBigInt = tempBigInt >> 8, HEAP8[r2 + 7 | 0] = tempBigInt & 255;
    r2 = r17 + 1 | 0;
    if ((r2 | 0) < (r21 | 0)) {
      r14 = r14 + 16 | 0;
      r17 = r2;
    } else {
      break;
    }
  }
  r24 = r23 + r15 | 0;
  return r24;
}
Module["__ZN17VizGeorefSpline2D11deserializeEPc"] = __ZN17VizGeorefSpline2D11deserializeEPc;
function _malloc(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46, r47, r48, r49, r50, r51, r52, r53, r54, r55, r56, r57, r58, r59, r60, r61, r62, r63, r64, r65, r66, r67, r68, r69, r70, r71, r72, r73, r74, r75, r76, r77, r78, r79, r80, r81, r82, r83, r84, r85, r86, r87, r88, r89, r90, r91, r92, r93, r94, r95;
  r2 = 0;
  do {
    if (r1 >>> 0 < 245) {
      if (r1 >>> 0 < 11) {
        r3 = 16;
      } else {
        r3 = r1 + 11 & -8;
      }
      r4 = r3 >>> 3;
      r5 = HEAP32[1310776];
      r6 = r5 >>> (r4 >>> 0);
      if ((r6 & 3 | 0) != 0) {
        r7 = (r6 & 1 ^ 1) + r4 | 0;
        r8 = r7 << 1;
        r9 = (r8 << 2) + 5243144 | 0;
        r10 = (r8 + 2 << 2) + 5243144 | 0;
        r8 = HEAP32[r10 >> 2];
        r11 = r8 + 8 | 0;
        r12 = HEAP32[r11 >> 2];
        do {
          if ((r9 | 0) == (r12 | 0)) {
            HEAP32[1310776] = r5 & (1 << r7 ^ -1);
          } else {
            if (r12 >>> 0 < HEAP32[1310780] >>> 0) {
              _abort();
            }
            r13 = r12 + 12 | 0;
            if ((HEAP32[r13 >> 2] | 0) == (r8 | 0)) {
              HEAP32[r13 >> 2] = r9;
              HEAP32[r10 >> 2] = r12;
              break;
            } else {
              _abort();
            }
          }
        } while (0);
        r12 = r7 << 3;
        HEAP32[r8 + 4 >> 2] = r12 | 3;
        r10 = r8 + (r12 | 4) | 0;
        HEAP32[r10 >> 2] = HEAP32[r10 >> 2] | 1;
        r14 = r11;
        return r14;
      }
      if (r3 >>> 0 <= HEAP32[1310778] >>> 0) {
        r15 = r3, r16 = r15 >> 2;
        break;
      }
      if ((r6 | 0) != 0) {
        r10 = 2 << r4;
        r12 = r6 << r4 & (r10 | -r10);
        r10 = (r12 & -r12) - 1 | 0;
        r12 = r10 >>> 12 & 16;
        r9 = r10 >>> (r12 >>> 0);
        r10 = r9 >>> 5 & 8;
        r13 = r9 >>> (r10 >>> 0);
        r9 = r13 >>> 2 & 4;
        r17 = r13 >>> (r9 >>> 0);
        r13 = r17 >>> 1 & 2;
        r18 = r17 >>> (r13 >>> 0);
        r17 = r18 >>> 1 & 1;
        r19 = (r10 | r12 | r9 | r13 | r17) + (r18 >>> (r17 >>> 0)) | 0;
        r17 = r19 << 1;
        r18 = (r17 << 2) + 5243144 | 0;
        r13 = (r17 + 2 << 2) + 5243144 | 0;
        r17 = HEAP32[r13 >> 2];
        r9 = r17 + 8 | 0;
        r12 = HEAP32[r9 >> 2];
        do {
          if ((r18 | 0) == (r12 | 0)) {
            HEAP32[1310776] = r5 & (1 << r19 ^ -1);
          } else {
            if (r12 >>> 0 < HEAP32[1310780] >>> 0) {
              _abort();
            }
            r10 = r12 + 12 | 0;
            if ((HEAP32[r10 >> 2] | 0) == (r17 | 0)) {
              HEAP32[r10 >> 2] = r18;
              HEAP32[r13 >> 2] = r12;
              break;
            } else {
              _abort();
            }
          }
        } while (0);
        r12 = r19 << 3;
        r13 = r12 - r3 | 0;
        HEAP32[r17 + 4 >> 2] = r3 | 3;
        r18 = r17;
        r5 = r18 + r3 | 0;
        HEAP32[r18 + (r3 | 4) >> 2] = r13 | 1;
        HEAP32[r18 + r12 >> 2] = r13;
        r12 = HEAP32[1310778];
        if ((r12 | 0) != 0) {
          r18 = HEAP32[1310781];
          r4 = r12 >>> 3;
          r12 = r4 << 1;
          r6 = (r12 << 2) + 5243144 | 0;
          r11 = HEAP32[1310776];
          r8 = 1 << r4;
          do {
            if ((r11 & r8 | 0) == 0) {
              HEAP32[1310776] = r11 | r8;
              r20 = r6;
              r21 = (r12 + 2 << 2) + 5243144 | 0;
            } else {
              r4 = (r12 + 2 << 2) + 5243144 | 0;
              r7 = HEAP32[r4 >> 2];
              if (r7 >>> 0 >= HEAP32[1310780] >>> 0) {
                r20 = r7;
                r21 = r4;
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[r21 >> 2] = r18;
          HEAP32[r20 + 12 >> 2] = r18;
          HEAP32[r18 + 8 >> 2] = r20;
          HEAP32[r18 + 12 >> 2] = r6;
        }
        HEAP32[1310778] = r13;
        HEAP32[1310781] = r5;
        r14 = r9;
        return r14;
      }
      r12 = HEAP32[1310777];
      if ((r12 | 0) == 0) {
        r15 = r3, r16 = r15 >> 2;
        break;
      }
      r8 = (r12 & -r12) - 1 | 0;
      r12 = r8 >>> 12 & 16;
      r11 = r8 >>> (r12 >>> 0);
      r8 = r11 >>> 5 & 8;
      r17 = r11 >>> (r8 >>> 0);
      r11 = r17 >>> 2 & 4;
      r19 = r17 >>> (r11 >>> 0);
      r17 = r19 >>> 1 & 2;
      r4 = r19 >>> (r17 >>> 0);
      r19 = r4 >>> 1 & 1;
      r7 = HEAP32[((r8 | r12 | r11 | r17 | r19) + (r4 >>> (r19 >>> 0)) << 2) + 5243408 >> 2];
      r19 = r7;
      r4 = r7, r17 = r4 >> 2;
      r11 = (HEAP32[r7 + 4 >> 2] & -8) - r3 | 0;
      while (1) {
        r7 = HEAP32[r19 + 16 >> 2];
        if ((r7 | 0) == 0) {
          r12 = HEAP32[r19 + 20 >> 2];
          if ((r12 | 0) == 0) {
            break;
          } else {
            r22 = r12;
          }
        } else {
          r22 = r7;
        }
        r7 = (HEAP32[r22 + 4 >> 2] & -8) - r3 | 0;
        r12 = r7 >>> 0 < r11 >>> 0;
        r19 = r22;
        r4 = r12 ? r22 : r4, r17 = r4 >> 2;
        r11 = r12 ? r7 : r11;
      }
      r19 = r4;
      r9 = HEAP32[1310780];
      if (r19 >>> 0 < r9 >>> 0) {
        _abort();
      }
      r5 = r19 + r3 | 0;
      r13 = r5;
      if (r19 >>> 0 >= r5 >>> 0) {
        _abort();
      }
      r5 = HEAP32[r17 + 6];
      r6 = HEAP32[r17 + 3];
      L510 : do {
        if ((r6 | 0) == (r4 | 0)) {
          r18 = r4 + 20 | 0;
          r7 = HEAP32[r18 >> 2];
          do {
            if ((r7 | 0) == 0) {
              r12 = r4 + 16 | 0;
              r8 = HEAP32[r12 >> 2];
              if ((r8 | 0) == 0) {
                r23 = 0, r24 = r23 >> 2;
                break L510;
              } else {
                r25 = r8;
                r26 = r12;
                break;
              }
            } else {
              r25 = r7;
              r26 = r18;
            }
          } while (0);
          while (1) {
            r18 = r25 + 20 | 0;
            r7 = HEAP32[r18 >> 2];
            if ((r7 | 0) != 0) {
              r25 = r7;
              r26 = r18;
              continue;
            }
            r18 = r25 + 16 | 0;
            r7 = HEAP32[r18 >> 2];
            if ((r7 | 0) == 0) {
              break;
            } else {
              r25 = r7;
              r26 = r18;
            }
          }
          if (r26 >>> 0 < r9 >>> 0) {
            _abort();
          } else {
            HEAP32[r26 >> 2] = 0;
            r23 = r25, r24 = r23 >> 2;
            break;
          }
        } else {
          r18 = HEAP32[r17 + 2];
          if (r18 >>> 0 < r9 >>> 0) {
            _abort();
          }
          r7 = r18 + 12 | 0;
          if ((HEAP32[r7 >> 2] | 0) != (r4 | 0)) {
            _abort();
          }
          r12 = r6 + 8 | 0;
          if ((HEAP32[r12 >> 2] | 0) == (r4 | 0)) {
            HEAP32[r7 >> 2] = r6;
            HEAP32[r12 >> 2] = r18;
            r23 = r6, r24 = r23 >> 2;
            break;
          } else {
            _abort();
          }
        }
      } while (0);
      L532 : do {
        if ((r5 | 0) != 0) {
          r6 = r4 + 28 | 0;
          r9 = (HEAP32[r6 >> 2] << 2) + 5243408 | 0;
          do {
            if ((r4 | 0) == (HEAP32[r9 >> 2] | 0)) {
              HEAP32[r9 >> 2] = r23;
              if ((r23 | 0) != 0) {
                break;
              }
              HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r6 >> 2] ^ -1);
              break L532;
            } else {
              if (r5 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r18 = r5 + 16 | 0;
              if ((HEAP32[r18 >> 2] | 0) == (r4 | 0)) {
                HEAP32[r18 >> 2] = r23;
              } else {
                HEAP32[r5 + 20 >> 2] = r23;
              }
              if ((r23 | 0) == 0) {
                break L532;
              }
            }
          } while (0);
          if (r23 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          HEAP32[r24 + 6] = r5;
          r6 = HEAP32[r17 + 4];
          do {
            if ((r6 | 0) != 0) {
              if (r6 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              } else {
                HEAP32[r24 + 4] = r6;
                HEAP32[r6 + 24 >> 2] = r23;
                break;
              }
            }
          } while (0);
          r6 = HEAP32[r17 + 5];
          if ((r6 | 0) == 0) {
            break;
          }
          if (r6 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r24 + 5] = r6;
            HEAP32[r6 + 24 >> 2] = r23;
            break;
          }
        }
      } while (0);
      if (r11 >>> 0 < 16) {
        r5 = r11 + r3 | 0;
        HEAP32[r17 + 1] = r5 | 3;
        r6 = r5 + (r19 + 4) | 0;
        HEAP32[r6 >> 2] = HEAP32[r6 >> 2] | 1;
      } else {
        HEAP32[r17 + 1] = r3 | 3;
        HEAP32[r19 + (r3 | 4) >> 2] = r11 | 1;
        HEAP32[r19 + r11 + r3 >> 2] = r11;
        r6 = HEAP32[1310778];
        if ((r6 | 0) != 0) {
          r5 = HEAP32[1310781];
          r9 = r6 >>> 3;
          r6 = r9 << 1;
          r18 = (r6 << 2) + 5243144 | 0;
          r12 = HEAP32[1310776];
          r7 = 1 << r9;
          do {
            if ((r12 & r7 | 0) == 0) {
              HEAP32[1310776] = r12 | r7;
              r27 = r18;
              r28 = (r6 + 2 << 2) + 5243144 | 0;
            } else {
              r9 = (r6 + 2 << 2) + 5243144 | 0;
              r8 = HEAP32[r9 >> 2];
              if (r8 >>> 0 >= HEAP32[1310780] >>> 0) {
                r27 = r8;
                r28 = r9;
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[r28 >> 2] = r5;
          HEAP32[r27 + 12 >> 2] = r5;
          HEAP32[r5 + 8 >> 2] = r27;
          HEAP32[r5 + 12 >> 2] = r18;
        }
        HEAP32[1310778] = r11;
        HEAP32[1310781] = r13;
      }
      r6 = r4 + 8 | 0;
      if ((r6 | 0) == 0) {
        r15 = r3, r16 = r15 >> 2;
        break;
      } else {
        r14 = r6;
      }
      return r14;
    } else {
      if (r1 >>> 0 > 4294967231) {
        r15 = -1, r16 = r15 >> 2;
        break;
      }
      r6 = r1 + 11 | 0;
      r7 = r6 & -8, r12 = r7 >> 2;
      r19 = HEAP32[1310777];
      if ((r19 | 0) == 0) {
        r15 = r7, r16 = r15 >> 2;
        break;
      }
      r17 = -r7 | 0;
      r9 = r6 >>> 8;
      do {
        if ((r9 | 0) == 0) {
          r29 = 0;
        } else {
          if (r7 >>> 0 > 16777215) {
            r29 = 31;
            break;
          }
          r6 = (r9 + 1048320 | 0) >>> 16 & 8;
          r8 = r9 << r6;
          r10 = (r8 + 520192 | 0) >>> 16 & 4;
          r30 = r8 << r10;
          r8 = (r30 + 245760 | 0) >>> 16 & 2;
          r31 = 14 - (r10 | r6 | r8) + (r30 << r8 >>> 15) | 0;
          r29 = r7 >>> ((r31 + 7 | 0) >>> 0) & 1 | r31 << 1;
        }
      } while (0);
      r9 = HEAP32[(r29 << 2) + 5243408 >> 2];
      L340 : do {
        if ((r9 | 0) == 0) {
          r32 = 0;
          r33 = r17;
          r34 = 0;
        } else {
          if ((r29 | 0) == 31) {
            r35 = 0;
          } else {
            r35 = 25 - (r29 >>> 1) | 0;
          }
          r4 = 0;
          r13 = r17;
          r11 = r9, r18 = r11 >> 2;
          r5 = r7 << r35;
          r31 = 0;
          while (1) {
            r8 = HEAP32[r18 + 1] & -8;
            r30 = r8 - r7 | 0;
            if (r30 >>> 0 < r13 >>> 0) {
              if ((r8 | 0) == (r7 | 0)) {
                r32 = r11;
                r33 = r30;
                r34 = r11;
                break L340;
              } else {
                r36 = r11;
                r37 = r30;
              }
            } else {
              r36 = r4;
              r37 = r13;
            }
            r30 = HEAP32[r18 + 5];
            r8 = HEAP32[((r5 >>> 31 << 2) + 16 >> 2) + r18];
            r6 = (r30 | 0) == 0 | (r30 | 0) == (r8 | 0) ? r31 : r30;
            if ((r8 | 0) == 0) {
              r32 = r36;
              r33 = r37;
              r34 = r6;
              break L340;
            } else {
              r4 = r36;
              r13 = r37;
              r11 = r8, r18 = r11 >> 2;
              r5 = r5 << 1;
              r31 = r6;
            }
          }
        }
      } while (0);
      if ((r34 | 0) == 0 & (r32 | 0) == 0) {
        r9 = 2 << r29;
        r17 = r19 & (r9 | -r9);
        if ((r17 | 0) == 0) {
          r15 = r7, r16 = r15 >> 2;
          break;
        }
        r9 = (r17 & -r17) - 1 | 0;
        r17 = r9 >>> 12 & 16;
        r31 = r9 >>> (r17 >>> 0);
        r9 = r31 >>> 5 & 8;
        r5 = r31 >>> (r9 >>> 0);
        r31 = r5 >>> 2 & 4;
        r11 = r5 >>> (r31 >>> 0);
        r5 = r11 >>> 1 & 2;
        r18 = r11 >>> (r5 >>> 0);
        r11 = r18 >>> 1 & 1;
        r38 = HEAP32[((r9 | r17 | r31 | r5 | r11) + (r18 >>> (r11 >>> 0)) << 2) + 5243408 >> 2];
      } else {
        r38 = r34;
      }
      L355 : do {
        if ((r38 | 0) == 0) {
          r39 = r33;
          r40 = r32, r41 = r40 >> 2;
        } else {
          r11 = r38, r18 = r11 >> 2;
          r5 = r33;
          r31 = r32;
          while (1) {
            r17 = (HEAP32[r18 + 1] & -8) - r7 | 0;
            r9 = r17 >>> 0 < r5 >>> 0;
            r13 = r9 ? r17 : r5;
            r17 = r9 ? r11 : r31;
            r9 = HEAP32[r18 + 4];
            if ((r9 | 0) != 0) {
              r11 = r9, r18 = r11 >> 2;
              r5 = r13;
              r31 = r17;
              continue;
            }
            r9 = HEAP32[r18 + 5];
            if ((r9 | 0) == 0) {
              r39 = r13;
              r40 = r17, r41 = r40 >> 2;
              break L355;
            } else {
              r11 = r9, r18 = r11 >> 2;
              r5 = r13;
              r31 = r17;
            }
          }
        }
      } while (0);
      if ((r40 | 0) == 0) {
        r15 = r7, r16 = r15 >> 2;
        break;
      }
      if (r39 >>> 0 >= (HEAP32[1310778] - r7 | 0) >>> 0) {
        r15 = r7, r16 = r15 >> 2;
        break;
      }
      r19 = r40, r31 = r19 >> 2;
      r5 = HEAP32[1310780];
      if (r19 >>> 0 < r5 >>> 0) {
        _abort();
      }
      r11 = r19 + r7 | 0;
      r18 = r11;
      if (r19 >>> 0 >= r11 >>> 0) {
        _abort();
      }
      r17 = HEAP32[r41 + 6];
      r13 = HEAP32[r41 + 3];
      L368 : do {
        if ((r13 | 0) == (r40 | 0)) {
          r9 = r40 + 20 | 0;
          r4 = HEAP32[r9 >> 2];
          do {
            if ((r4 | 0) == 0) {
              r6 = r40 + 16 | 0;
              r8 = HEAP32[r6 >> 2];
              if ((r8 | 0) == 0) {
                r42 = 0, r43 = r42 >> 2;
                break L368;
              } else {
                r44 = r8;
                r45 = r6;
                break;
              }
            } else {
              r44 = r4;
              r45 = r9;
            }
          } while (0);
          while (1) {
            r9 = r44 + 20 | 0;
            r4 = HEAP32[r9 >> 2];
            if ((r4 | 0) != 0) {
              r44 = r4;
              r45 = r9;
              continue;
            }
            r9 = r44 + 16 | 0;
            r4 = HEAP32[r9 >> 2];
            if ((r4 | 0) == 0) {
              break;
            } else {
              r44 = r4;
              r45 = r9;
            }
          }
          if (r45 >>> 0 < r5 >>> 0) {
            _abort();
          } else {
            HEAP32[r45 >> 2] = 0;
            r42 = r44, r43 = r42 >> 2;
            break;
          }
        } else {
          r9 = HEAP32[r41 + 2];
          if (r9 >>> 0 < r5 >>> 0) {
            _abort();
          }
          r4 = r9 + 12 | 0;
          if ((HEAP32[r4 >> 2] | 0) != (r40 | 0)) {
            _abort();
          }
          r6 = r13 + 8 | 0;
          if ((HEAP32[r6 >> 2] | 0) == (r40 | 0)) {
            HEAP32[r4 >> 2] = r13;
            HEAP32[r6 >> 2] = r9;
            r42 = r13, r43 = r42 >> 2;
            break;
          } else {
            _abort();
          }
        }
      } while (0);
      L390 : do {
        if ((r17 | 0) != 0) {
          r13 = r40 + 28 | 0;
          r5 = (HEAP32[r13 >> 2] << 2) + 5243408 | 0;
          do {
            if ((r40 | 0) == (HEAP32[r5 >> 2] | 0)) {
              HEAP32[r5 >> 2] = r42;
              if ((r42 | 0) != 0) {
                break;
              }
              HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r13 >> 2] ^ -1);
              break L390;
            } else {
              if (r17 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r9 = r17 + 16 | 0;
              if ((HEAP32[r9 >> 2] | 0) == (r40 | 0)) {
                HEAP32[r9 >> 2] = r42;
              } else {
                HEAP32[r17 + 20 >> 2] = r42;
              }
              if ((r42 | 0) == 0) {
                break L390;
              }
            }
          } while (0);
          if (r42 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          HEAP32[r43 + 6] = r17;
          r13 = HEAP32[r41 + 4];
          do {
            if ((r13 | 0) != 0) {
              if (r13 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              } else {
                HEAP32[r43 + 4] = r13;
                HEAP32[r13 + 24 >> 2] = r42;
                break;
              }
            }
          } while (0);
          r13 = HEAP32[r41 + 5];
          if ((r13 | 0) == 0) {
            break;
          }
          if (r13 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r43 + 5] = r13;
            HEAP32[r13 + 24 >> 2] = r42;
            break;
          }
        }
      } while (0);
      do {
        if (r39 >>> 0 < 16) {
          r17 = r39 + r7 | 0;
          HEAP32[r41 + 1] = r17 | 3;
          r13 = r17 + (r19 + 4) | 0;
          HEAP32[r13 >> 2] = HEAP32[r13 >> 2] | 1;
        } else {
          HEAP32[r41 + 1] = r7 | 3;
          HEAP32[((r7 | 4) >> 2) + r31] = r39 | 1;
          HEAP32[(r39 >> 2) + r31 + r12] = r39;
          r13 = r39 >>> 3;
          if (r39 >>> 0 < 256) {
            r17 = r13 << 1;
            r5 = (r17 << 2) + 5243144 | 0;
            r9 = HEAP32[1310776];
            r6 = 1 << r13;
            do {
              if ((r9 & r6 | 0) == 0) {
                HEAP32[1310776] = r9 | r6;
                r46 = r5;
                r47 = (r17 + 2 << 2) + 5243144 | 0;
              } else {
                r13 = (r17 + 2 << 2) + 5243144 | 0;
                r4 = HEAP32[r13 >> 2];
                if (r4 >>> 0 >= HEAP32[1310780] >>> 0) {
                  r46 = r4;
                  r47 = r13;
                  break;
                }
                _abort();
              }
            } while (0);
            HEAP32[r47 >> 2] = r18;
            HEAP32[r46 + 12 >> 2] = r18;
            HEAP32[r12 + (r31 + 2)] = r46;
            HEAP32[r12 + (r31 + 3)] = r5;
            break;
          }
          r17 = r11;
          r6 = r39 >>> 8;
          do {
            if ((r6 | 0) == 0) {
              r48 = 0;
            } else {
              if (r39 >>> 0 > 16777215) {
                r48 = 31;
                break;
              }
              r9 = (r6 + 1048320 | 0) >>> 16 & 8;
              r13 = r6 << r9;
              r4 = (r13 + 520192 | 0) >>> 16 & 4;
              r8 = r13 << r4;
              r13 = (r8 + 245760 | 0) >>> 16 & 2;
              r30 = 14 - (r4 | r9 | r13) + (r8 << r13 >>> 15) | 0;
              r48 = r39 >>> ((r30 + 7 | 0) >>> 0) & 1 | r30 << 1;
            }
          } while (0);
          r6 = (r48 << 2) + 5243408 | 0;
          HEAP32[r12 + (r31 + 7)] = r48;
          HEAP32[r12 + (r31 + 5)] = 0;
          HEAP32[r12 + (r31 + 4)] = 0;
          r5 = HEAP32[1310777];
          r30 = 1 << r48;
          if ((r5 & r30 | 0) == 0) {
            HEAP32[1310777] = r5 | r30;
            HEAP32[r6 >> 2] = r17;
            HEAP32[r12 + (r31 + 6)] = r6;
            HEAP32[r12 + (r31 + 3)] = r17;
            HEAP32[r12 + (r31 + 2)] = r17;
            break;
          }
          if ((r48 | 0) == 31) {
            r49 = 0;
          } else {
            r49 = 25 - (r48 >>> 1) | 0;
          }
          r30 = r39 << r49;
          r5 = HEAP32[r6 >> 2];
          while (1) {
            if ((HEAP32[r5 + 4 >> 2] & -8 | 0) == (r39 | 0)) {
              break;
            }
            r50 = (r30 >>> 31 << 2) + r5 + 16 | 0;
            r6 = HEAP32[r50 >> 2];
            if ((r6 | 0) == 0) {
              r2 = 389;
              break;
            } else {
              r30 = r30 << 1;
              r5 = r6;
            }
          }
          if (r2 == 389) {
            if (r50 >>> 0 < HEAP32[1310780] >>> 0) {
              _abort();
            } else {
              HEAP32[r50 >> 2] = r17;
              HEAP32[r12 + (r31 + 6)] = r5;
              HEAP32[r12 + (r31 + 3)] = r17;
              HEAP32[r12 + (r31 + 2)] = r17;
              break;
            }
          }
          r30 = r5 + 8 | 0;
          r6 = HEAP32[r30 >> 2];
          r13 = HEAP32[1310780];
          if (r5 >>> 0 < r13 >>> 0) {
            _abort();
          }
          if (r6 >>> 0 < r13 >>> 0) {
            _abort();
          } else {
            HEAP32[r6 + 12 >> 2] = r17;
            HEAP32[r30 >> 2] = r17;
            HEAP32[r12 + (r31 + 2)] = r6;
            HEAP32[r12 + (r31 + 3)] = r5;
            HEAP32[r12 + (r31 + 6)] = 0;
            break;
          }
        }
      } while (0);
      r31 = r40 + 8 | 0;
      if ((r31 | 0) == 0) {
        r15 = r7, r16 = r15 >> 2;
        break;
      } else {
        r14 = r31;
      }
      return r14;
    }
  } while (0);
  r40 = HEAP32[1310778];
  if (r15 >>> 0 <= r40 >>> 0) {
    r50 = r40 - r15 | 0;
    r39 = HEAP32[1310781];
    if (r50 >>> 0 > 15) {
      r49 = r39;
      HEAP32[1310781] = r49 + r15 | 0;
      HEAP32[1310778] = r50;
      HEAP32[(r49 + 4 >> 2) + r16] = r50 | 1;
      HEAP32[r49 + r40 >> 2] = r50;
      HEAP32[r39 + 4 >> 2] = r15 | 3;
    } else {
      HEAP32[1310778] = 0;
      HEAP32[1310781] = 0;
      HEAP32[r39 + 4 >> 2] = r40 | 3;
      r50 = r40 + (r39 + 4) | 0;
      HEAP32[r50 >> 2] = HEAP32[r50 >> 2] | 1;
    }
    r14 = r39 + 8 | 0;
    return r14;
  }
  r39 = HEAP32[1310779];
  if (r15 >>> 0 < r39 >>> 0) {
    r50 = r39 - r15 | 0;
    HEAP32[1310779] = r50;
    r39 = HEAP32[1310782];
    r40 = r39;
    HEAP32[1310782] = r40 + r15 | 0;
    HEAP32[(r40 + 4 >> 2) + r16] = r50 | 1;
    HEAP32[r39 + 4 >> 2] = r15 | 3;
    r14 = r39 + 8 | 0;
    return r14;
  }
  do {
    if ((HEAP32[1310720] | 0) == 0) {
      r39 = _sysconf(8);
      if ((r39 - 1 & r39 | 0) == 0) {
        HEAP32[1310722] = r39;
        HEAP32[1310721] = r39;
        HEAP32[1310723] = -1;
        HEAP32[1310724] = 2097152;
        HEAP32[1310725] = 0;
        HEAP32[1310887] = 0;
        HEAP32[1310720] = _time(0) & -16 ^ 1431655768;
        break;
      } else {
        _abort();
      }
    }
  } while (0);
  r39 = r15 + 48 | 0;
  r50 = HEAP32[1310722];
  r40 = r15 + 47 | 0;
  r49 = r50 + r40 | 0;
  r48 = -r50 | 0;
  r50 = r49 & r48;
  if (r50 >>> 0 <= r15 >>> 0) {
    r14 = 0;
    return r14;
  }
  r46 = HEAP32[1310886];
  do {
    if ((r46 | 0) != 0) {
      r47 = HEAP32[1310884];
      r41 = r47 + r50 | 0;
      if (r41 >>> 0 <= r47 >>> 0 | r41 >>> 0 > r46 >>> 0) {
        r14 = 0;
      } else {
        break;
      }
      return r14;
    }
  } while (0);
  L599 : do {
    if ((HEAP32[1310887] & 4 | 0) == 0) {
      r46 = HEAP32[1310782];
      L601 : do {
        if ((r46 | 0) == 0) {
          r2 = 419;
        } else {
          r41 = r46;
          r47 = 5243552;
          while (1) {
            r51 = r47 | 0;
            r42 = HEAP32[r51 >> 2];
            if (r42 >>> 0 <= r41 >>> 0) {
              r52 = r47 + 4 | 0;
              if ((r42 + HEAP32[r52 >> 2] | 0) >>> 0 > r41 >>> 0) {
                break;
              }
            }
            r42 = HEAP32[r47 + 8 >> 2];
            if ((r42 | 0) == 0) {
              r2 = 419;
              break L601;
            } else {
              r47 = r42;
            }
          }
          if ((r47 | 0) == 0) {
            r2 = 419;
            break;
          }
          r41 = r49 - HEAP32[1310779] & r48;
          if (r41 >>> 0 >= 2147483647) {
            r53 = 0;
            break;
          }
          r5 = _sbrk(r41);
          r17 = (r5 | 0) == (HEAP32[r51 >> 2] + HEAP32[r52 >> 2] | 0);
          r54 = r17 ? r5 : -1;
          r55 = r17 ? r41 : 0;
          r56 = r5;
          r57 = r41;
          r2 = 428;
          break;
        }
      } while (0);
      do {
        if (r2 == 419) {
          r46 = _sbrk(0);
          if ((r46 | 0) == -1) {
            r53 = 0;
            break;
          }
          r7 = r46;
          r41 = HEAP32[1310721];
          r5 = r41 - 1 | 0;
          if ((r5 & r7 | 0) == 0) {
            r58 = r50;
          } else {
            r58 = r50 - r7 + (r5 + r7 & -r41) | 0;
          }
          r41 = HEAP32[1310884];
          r7 = r41 + r58 | 0;
          if (!(r58 >>> 0 > r15 >>> 0 & r58 >>> 0 < 2147483647)) {
            r53 = 0;
            break;
          }
          r5 = HEAP32[1310886];
          if ((r5 | 0) != 0) {
            if (r7 >>> 0 <= r41 >>> 0 | r7 >>> 0 > r5 >>> 0) {
              r53 = 0;
              break;
            }
          }
          r5 = _sbrk(r58);
          r7 = (r5 | 0) == (r46 | 0);
          r54 = r7 ? r46 : -1;
          r55 = r7 ? r58 : 0;
          r56 = r5;
          r57 = r58;
          r2 = 428;
          break;
        }
      } while (0);
      L621 : do {
        if (r2 == 428) {
          r5 = -r57 | 0;
          if ((r54 | 0) != -1) {
            r59 = r55, r60 = r59 >> 2;
            r61 = r54, r62 = r61 >> 2;
            r2 = 439;
            break L599;
          }
          do {
            if ((r56 | 0) != -1 & r57 >>> 0 < 2147483647 & r57 >>> 0 < r39 >>> 0) {
              r7 = HEAP32[1310722];
              r46 = r40 - r57 + r7 & -r7;
              if (r46 >>> 0 >= 2147483647) {
                r63 = r57;
                break;
              }
              if ((_sbrk(r46) | 0) == -1) {
                _sbrk(r5);
                r53 = r55;
                break L621;
              } else {
                r63 = r46 + r57 | 0;
                break;
              }
            } else {
              r63 = r57;
            }
          } while (0);
          if ((r56 | 0) == -1) {
            r53 = r55;
          } else {
            r59 = r63, r60 = r59 >> 2;
            r61 = r56, r62 = r61 >> 2;
            r2 = 439;
            break L599;
          }
        }
      } while (0);
      HEAP32[1310887] = HEAP32[1310887] | 4;
      r64 = r53;
      r2 = 436;
      break;
    } else {
      r64 = 0;
      r2 = 436;
    }
  } while (0);
  do {
    if (r2 == 436) {
      if (r50 >>> 0 >= 2147483647) {
        break;
      }
      r53 = _sbrk(r50);
      r56 = _sbrk(0);
      if (!((r56 | 0) != -1 & (r53 | 0) != -1 & r53 >>> 0 < r56 >>> 0)) {
        break;
      }
      r63 = r56 - r53 | 0;
      r56 = r63 >>> 0 > (r15 + 40 | 0) >>> 0;
      r55 = r56 ? r53 : -1;
      if ((r55 | 0) == -1) {
        break;
      } else {
        r59 = r56 ? r63 : r64, r60 = r59 >> 2;
        r61 = r55, r62 = r61 >> 2;
        r2 = 439;
        break;
      }
    }
  } while (0);
  do {
    if (r2 == 439) {
      r64 = HEAP32[1310884] + r59 | 0;
      HEAP32[1310884] = r64;
      if (r64 >>> 0 > HEAP32[1310885] >>> 0) {
        HEAP32[1310885] = r64;
      }
      r64 = HEAP32[1310782], r50 = r64 >> 2;
      L641 : do {
        if ((r64 | 0) == 0) {
          r55 = HEAP32[1310780];
          if ((r55 | 0) == 0 | r61 >>> 0 < r55 >>> 0) {
            HEAP32[1310780] = r61;
          }
          HEAP32[1310888] = r61;
          HEAP32[1310889] = r59;
          HEAP32[1310891] = 0;
          HEAP32[1310785] = HEAP32[1310720];
          HEAP32[1310784] = -1;
          r55 = 0;
          while (1) {
            r63 = r55 << 1;
            r56 = (r63 << 2) + 5243144 | 0;
            HEAP32[(r63 + 3 << 2) + 5243144 >> 2] = r56;
            HEAP32[(r63 + 2 << 2) + 5243144 >> 2] = r56;
            r56 = r55 + 1 | 0;
            if ((r56 | 0) == 32) {
              break;
            } else {
              r55 = r56;
            }
          }
          r55 = r61 + 8 | 0;
          if ((r55 & 7 | 0) == 0) {
            r65 = 0;
          } else {
            r65 = -r55 & 7;
          }
          r55 = r59 - 40 - r65 | 0;
          HEAP32[1310782] = r61 + r65 | 0;
          HEAP32[1310779] = r55;
          HEAP32[(r65 + 4 >> 2) + r62] = r55 | 1;
          HEAP32[(r59 - 36 >> 2) + r62] = 40;
          HEAP32[1310783] = HEAP32[1310724];
        } else {
          r55 = 5243552, r56 = r55 >> 2;
          while (1) {
            r66 = HEAP32[r56];
            r67 = r55 + 4 | 0;
            r68 = HEAP32[r67 >> 2];
            if ((r61 | 0) == (r66 + r68 | 0)) {
              r2 = 451;
              break;
            }
            r63 = HEAP32[r56 + 2];
            if ((r63 | 0) == 0) {
              break;
            } else {
              r55 = r63, r56 = r55 >> 2;
            }
          }
          do {
            if (r2 == 451) {
              if ((HEAP32[r56 + 3] & 8 | 0) != 0) {
                break;
              }
              r55 = r64;
              if (!(r55 >>> 0 >= r66 >>> 0 & r55 >>> 0 < r61 >>> 0)) {
                break;
              }
              HEAP32[r67 >> 2] = r68 + r59 | 0;
              r55 = HEAP32[1310782];
              r63 = HEAP32[1310779] + r59 | 0;
              r53 = r55;
              r57 = r55 + 8 | 0;
              if ((r57 & 7 | 0) == 0) {
                r69 = 0;
              } else {
                r69 = -r57 & 7;
              }
              r57 = r63 - r69 | 0;
              HEAP32[1310782] = r53 + r69 | 0;
              HEAP32[1310779] = r57;
              HEAP32[r69 + (r53 + 4) >> 2] = r57 | 1;
              HEAP32[r63 + (r53 + 4) >> 2] = 40;
              HEAP32[1310783] = HEAP32[1310724];
              break L641;
            }
          } while (0);
          if (r61 >>> 0 < HEAP32[1310780] >>> 0) {
            HEAP32[1310780] = r61;
          }
          r56 = r61 + r59 | 0;
          r53 = 5243552;
          while (1) {
            r70 = r53 | 0;
            if ((HEAP32[r70 >> 2] | 0) == (r56 | 0)) {
              r2 = 461;
              break;
            }
            r63 = HEAP32[r53 + 8 >> 2];
            if ((r63 | 0) == 0) {
              break;
            } else {
              r53 = r63;
            }
          }
          do {
            if (r2 == 461) {
              if ((HEAP32[r53 + 12 >> 2] & 8 | 0) != 0) {
                break;
              }
              HEAP32[r70 >> 2] = r61;
              r56 = r53 + 4 | 0;
              HEAP32[r56 >> 2] = HEAP32[r56 >> 2] + r59 | 0;
              r56 = r61 + 8 | 0;
              if ((r56 & 7 | 0) == 0) {
                r71 = 0;
              } else {
                r71 = -r56 & 7;
              }
              r56 = r59 + (r61 + 8) | 0;
              if ((r56 & 7 | 0) == 0) {
                r72 = 0, r73 = r72 >> 2;
              } else {
                r72 = -r56 & 7, r73 = r72 >> 2;
              }
              r56 = r61 + r72 + r59 | 0;
              r63 = r56;
              r57 = r71 + r15 | 0, r55 = r57 >> 2;
              r40 = r61 + r57 | 0;
              r57 = r40;
              r39 = r56 - (r61 + r71) - r15 | 0;
              HEAP32[(r71 + 4 >> 2) + r62] = r15 | 3;
              do {
                if ((r63 | 0) == (HEAP32[1310782] | 0)) {
                  r54 = HEAP32[1310779] + r39 | 0;
                  HEAP32[1310779] = r54;
                  HEAP32[1310782] = r57;
                  HEAP32[r55 + (r62 + 1)] = r54 | 1;
                } else {
                  if ((r63 | 0) == (HEAP32[1310781] | 0)) {
                    r54 = HEAP32[1310778] + r39 | 0;
                    HEAP32[1310778] = r54;
                    HEAP32[1310781] = r57;
                    HEAP32[r55 + (r62 + 1)] = r54 | 1;
                    HEAP32[(r54 >> 2) + r62 + r55] = r54;
                    break;
                  }
                  r54 = r59 + 4 | 0;
                  r58 = HEAP32[(r54 >> 2) + r62 + r73];
                  if ((r58 & 3 | 0) == 1) {
                    r52 = r58 & -8;
                    r51 = r58 >>> 3;
                    L686 : do {
                      if (r58 >>> 0 < 256) {
                        r48 = HEAP32[((r72 | 8) >> 2) + r62 + r60];
                        r49 = HEAP32[r73 + (r62 + (r60 + 3))];
                        r5 = (r51 << 3) + 5243144 | 0;
                        do {
                          if ((r48 | 0) != (r5 | 0)) {
                            if (r48 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            }
                            if ((HEAP32[r48 + 12 >> 2] | 0) == (r63 | 0)) {
                              break;
                            }
                            _abort();
                          }
                        } while (0);
                        if ((r49 | 0) == (r48 | 0)) {
                          HEAP32[1310776] = HEAP32[1310776] & (1 << r51 ^ -1);
                          break;
                        }
                        do {
                          if ((r49 | 0) == (r5 | 0)) {
                            r74 = r49 + 8 | 0;
                          } else {
                            if (r49 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            }
                            r47 = r49 + 8 | 0;
                            if ((HEAP32[r47 >> 2] | 0) == (r63 | 0)) {
                              r74 = r47;
                              break;
                            }
                            _abort();
                          }
                        } while (0);
                        HEAP32[r48 + 12 >> 2] = r49;
                        HEAP32[r74 >> 2] = r48;
                      } else {
                        r5 = r56;
                        r47 = HEAP32[((r72 | 24) >> 2) + r62 + r60];
                        r46 = HEAP32[r73 + (r62 + (r60 + 3))];
                        L707 : do {
                          if ((r46 | 0) == (r5 | 0)) {
                            r7 = r72 | 16;
                            r41 = r61 + r54 + r7 | 0;
                            r17 = HEAP32[r41 >> 2];
                            do {
                              if ((r17 | 0) == 0) {
                                r42 = r61 + r7 + r59 | 0;
                                r43 = HEAP32[r42 >> 2];
                                if ((r43 | 0) == 0) {
                                  r75 = 0, r76 = r75 >> 2;
                                  break L707;
                                } else {
                                  r77 = r43;
                                  r78 = r42;
                                  break;
                                }
                              } else {
                                r77 = r17;
                                r78 = r41;
                              }
                            } while (0);
                            while (1) {
                              r41 = r77 + 20 | 0;
                              r17 = HEAP32[r41 >> 2];
                              if ((r17 | 0) != 0) {
                                r77 = r17;
                                r78 = r41;
                                continue;
                              }
                              r41 = r77 + 16 | 0;
                              r17 = HEAP32[r41 >> 2];
                              if ((r17 | 0) == 0) {
                                break;
                              } else {
                                r77 = r17;
                                r78 = r41;
                              }
                            }
                            if (r78 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            } else {
                              HEAP32[r78 >> 2] = 0;
                              r75 = r77, r76 = r75 >> 2;
                              break;
                            }
                          } else {
                            r41 = HEAP32[((r72 | 8) >> 2) + r62 + r60];
                            if (r41 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            }
                            r17 = r41 + 12 | 0;
                            if ((HEAP32[r17 >> 2] | 0) != (r5 | 0)) {
                              _abort();
                            }
                            r7 = r46 + 8 | 0;
                            if ((HEAP32[r7 >> 2] | 0) == (r5 | 0)) {
                              HEAP32[r17 >> 2] = r46;
                              HEAP32[r7 >> 2] = r41;
                              r75 = r46, r76 = r75 >> 2;
                              break;
                            } else {
                              _abort();
                            }
                          }
                        } while (0);
                        if ((r47 | 0) == 0) {
                          break;
                        }
                        r46 = r72 + (r61 + (r59 + 28)) | 0;
                        r48 = (HEAP32[r46 >> 2] << 2) + 5243408 | 0;
                        do {
                          if ((r5 | 0) == (HEAP32[r48 >> 2] | 0)) {
                            HEAP32[r48 >> 2] = r75;
                            if ((r75 | 0) != 0) {
                              break;
                            }
                            HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r46 >> 2] ^ -1);
                            break L686;
                          } else {
                            if (r47 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            }
                            r49 = r47 + 16 | 0;
                            if ((HEAP32[r49 >> 2] | 0) == (r5 | 0)) {
                              HEAP32[r49 >> 2] = r75;
                            } else {
                              HEAP32[r47 + 20 >> 2] = r75;
                            }
                            if ((r75 | 0) == 0) {
                              break L686;
                            }
                          }
                        } while (0);
                        if (r75 >>> 0 < HEAP32[1310780] >>> 0) {
                          _abort();
                        }
                        HEAP32[r76 + 6] = r47;
                        r5 = r72 | 16;
                        r46 = HEAP32[(r5 >> 2) + r62 + r60];
                        do {
                          if ((r46 | 0) != 0) {
                            if (r46 >>> 0 < HEAP32[1310780] >>> 0) {
                              _abort();
                            } else {
                              HEAP32[r76 + 4] = r46;
                              HEAP32[r46 + 24 >> 2] = r75;
                              break;
                            }
                          }
                        } while (0);
                        r46 = HEAP32[(r54 + r5 >> 2) + r62];
                        if ((r46 | 0) == 0) {
                          break;
                        }
                        if (r46 >>> 0 < HEAP32[1310780] >>> 0) {
                          _abort();
                        } else {
                          HEAP32[r76 + 5] = r46;
                          HEAP32[r46 + 24 >> 2] = r75;
                          break;
                        }
                      }
                    } while (0);
                    r79 = r61 + (r52 | r72) + r59 | 0;
                    r80 = r52 + r39 | 0;
                  } else {
                    r79 = r63;
                    r80 = r39;
                  }
                  r54 = r79 + 4 | 0;
                  HEAP32[r54 >> 2] = HEAP32[r54 >> 2] & -2;
                  HEAP32[r55 + (r62 + 1)] = r80 | 1;
                  HEAP32[(r80 >> 2) + r62 + r55] = r80;
                  r54 = r80 >>> 3;
                  if (r80 >>> 0 < 256) {
                    r51 = r54 << 1;
                    r58 = (r51 << 2) + 5243144 | 0;
                    r46 = HEAP32[1310776];
                    r47 = 1 << r54;
                    do {
                      if ((r46 & r47 | 0) == 0) {
                        HEAP32[1310776] = r46 | r47;
                        r81 = r58;
                        r82 = (r51 + 2 << 2) + 5243144 | 0;
                      } else {
                        r54 = (r51 + 2 << 2) + 5243144 | 0;
                        r48 = HEAP32[r54 >> 2];
                        if (r48 >>> 0 >= HEAP32[1310780] >>> 0) {
                          r81 = r48;
                          r82 = r54;
                          break;
                        }
                        _abort();
                      }
                    } while (0);
                    HEAP32[r82 >> 2] = r57;
                    HEAP32[r81 + 12 >> 2] = r57;
                    HEAP32[r55 + (r62 + 2)] = r81;
                    HEAP32[r55 + (r62 + 3)] = r58;
                    break;
                  }
                  r51 = r40;
                  r47 = r80 >>> 8;
                  do {
                    if ((r47 | 0) == 0) {
                      r83 = 0;
                    } else {
                      if (r80 >>> 0 > 16777215) {
                        r83 = 31;
                        break;
                      }
                      r46 = (r47 + 1048320 | 0) >>> 16 & 8;
                      r52 = r47 << r46;
                      r54 = (r52 + 520192 | 0) >>> 16 & 4;
                      r48 = r52 << r54;
                      r52 = (r48 + 245760 | 0) >>> 16 & 2;
                      r49 = 14 - (r54 | r46 | r52) + (r48 << r52 >>> 15) | 0;
                      r83 = r80 >>> ((r49 + 7 | 0) >>> 0) & 1 | r49 << 1;
                    }
                  } while (0);
                  r47 = (r83 << 2) + 5243408 | 0;
                  HEAP32[r55 + (r62 + 7)] = r83;
                  HEAP32[r55 + (r62 + 5)] = 0;
                  HEAP32[r55 + (r62 + 4)] = 0;
                  r58 = HEAP32[1310777];
                  r49 = 1 << r83;
                  if ((r58 & r49 | 0) == 0) {
                    HEAP32[1310777] = r58 | r49;
                    HEAP32[r47 >> 2] = r51;
                    HEAP32[r55 + (r62 + 6)] = r47;
                    HEAP32[r55 + (r62 + 3)] = r51;
                    HEAP32[r55 + (r62 + 2)] = r51;
                    break;
                  }
                  if ((r83 | 0) == 31) {
                    r84 = 0;
                  } else {
                    r84 = 25 - (r83 >>> 1) | 0;
                  }
                  r49 = r80 << r84;
                  r58 = HEAP32[r47 >> 2];
                  while (1) {
                    if ((HEAP32[r58 + 4 >> 2] & -8 | 0) == (r80 | 0)) {
                      break;
                    }
                    r85 = (r49 >>> 31 << 2) + r58 + 16 | 0;
                    r47 = HEAP32[r85 >> 2];
                    if ((r47 | 0) == 0) {
                      r2 = 534;
                      break;
                    } else {
                      r49 = r49 << 1;
                      r58 = r47;
                    }
                  }
                  if (r2 == 534) {
                    if (r85 >>> 0 < HEAP32[1310780] >>> 0) {
                      _abort();
                    } else {
                      HEAP32[r85 >> 2] = r51;
                      HEAP32[r55 + (r62 + 6)] = r58;
                      HEAP32[r55 + (r62 + 3)] = r51;
                      HEAP32[r55 + (r62 + 2)] = r51;
                      break;
                    }
                  }
                  r49 = r58 + 8 | 0;
                  r47 = HEAP32[r49 >> 2];
                  r52 = HEAP32[1310780];
                  if (r58 >>> 0 < r52 >>> 0) {
                    _abort();
                  }
                  if (r47 >>> 0 < r52 >>> 0) {
                    _abort();
                  } else {
                    HEAP32[r47 + 12 >> 2] = r51;
                    HEAP32[r49 >> 2] = r51;
                    HEAP32[r55 + (r62 + 2)] = r47;
                    HEAP32[r55 + (r62 + 3)] = r58;
                    HEAP32[r55 + (r62 + 6)] = 0;
                    break;
                  }
                }
              } while (0);
              r14 = r61 + (r71 | 8) | 0;
              return r14;
            }
          } while (0);
          r53 = r64;
          r55 = 5243552, r40 = r55 >> 2;
          while (1) {
            r86 = HEAP32[r40];
            if (r86 >>> 0 <= r53 >>> 0) {
              r87 = HEAP32[r40 + 1];
              r88 = r86 + r87 | 0;
              if (r88 >>> 0 > r53 >>> 0) {
                break;
              }
            }
            r55 = HEAP32[r40 + 2], r40 = r55 >> 2;
          }
          r55 = r86 + (r87 - 39) | 0;
          if ((r55 & 7 | 0) == 0) {
            r89 = 0;
          } else {
            r89 = -r55 & 7;
          }
          r55 = r86 + (r87 - 47) + r89 | 0;
          r40 = r55 >>> 0 < (r64 + 16 | 0) >>> 0 ? r53 : r55;
          r55 = r40 + 8 | 0, r57 = r55 >> 2;
          r39 = r61 + 8 | 0;
          if ((r39 & 7 | 0) == 0) {
            r90 = 0;
          } else {
            r90 = -r39 & 7;
          }
          r39 = r59 - 40 - r90 | 0;
          HEAP32[1310782] = r61 + r90 | 0;
          HEAP32[1310779] = r39;
          HEAP32[(r90 + 4 >> 2) + r62] = r39 | 1;
          HEAP32[(r59 - 36 >> 2) + r62] = 40;
          HEAP32[1310783] = HEAP32[1310724];
          HEAP32[r40 + 4 >> 2] = 27;
          HEAP32[r57] = HEAP32[1310888];
          HEAP32[r57 + 1] = HEAP32[1310889];
          HEAP32[r57 + 2] = HEAP32[1310890];
          HEAP32[r57 + 3] = HEAP32[1310891];
          HEAP32[1310888] = r61;
          HEAP32[1310889] = r59;
          HEAP32[1310891] = 0;
          HEAP32[1310890] = r55;
          r55 = r40 + 28 | 0;
          HEAP32[r55 >> 2] = 7;
          L805 : do {
            if ((r40 + 32 | 0) >>> 0 < r88 >>> 0) {
              r57 = r55;
              while (1) {
                r39 = r57 + 4 | 0;
                HEAP32[r39 >> 2] = 7;
                if ((r57 + 8 | 0) >>> 0 < r88 >>> 0) {
                  r57 = r39;
                } else {
                  break L805;
                }
              }
            }
          } while (0);
          if ((r40 | 0) == (r53 | 0)) {
            break;
          }
          r55 = r40 - r64 | 0;
          r57 = r55 + (r53 + 4) | 0;
          HEAP32[r57 >> 2] = HEAP32[r57 >> 2] & -2;
          HEAP32[r50 + 1] = r55 | 1;
          HEAP32[r53 + r55 >> 2] = r55;
          r57 = r55 >>> 3;
          if (r55 >>> 0 < 256) {
            r39 = r57 << 1;
            r63 = (r39 << 2) + 5243144 | 0;
            r56 = HEAP32[1310776];
            r47 = 1 << r57;
            do {
              if ((r56 & r47 | 0) == 0) {
                HEAP32[1310776] = r56 | r47;
                r91 = r63;
                r92 = (r39 + 2 << 2) + 5243144 | 0;
              } else {
                r57 = (r39 + 2 << 2) + 5243144 | 0;
                r49 = HEAP32[r57 >> 2];
                if (r49 >>> 0 >= HEAP32[1310780] >>> 0) {
                  r91 = r49;
                  r92 = r57;
                  break;
                }
                _abort();
              }
            } while (0);
            HEAP32[r92 >> 2] = r64;
            HEAP32[r91 + 12 >> 2] = r64;
            HEAP32[r50 + 2] = r91;
            HEAP32[r50 + 3] = r63;
            break;
          }
          r39 = r64;
          r47 = r55 >>> 8;
          do {
            if ((r47 | 0) == 0) {
              r93 = 0;
            } else {
              if (r55 >>> 0 > 16777215) {
                r93 = 31;
                break;
              }
              r56 = (r47 + 1048320 | 0) >>> 16 & 8;
              r53 = r47 << r56;
              r40 = (r53 + 520192 | 0) >>> 16 & 4;
              r57 = r53 << r40;
              r53 = (r57 + 245760 | 0) >>> 16 & 2;
              r49 = 14 - (r40 | r56 | r53) + (r57 << r53 >>> 15) | 0;
              r93 = r55 >>> ((r49 + 7 | 0) >>> 0) & 1 | r49 << 1;
            }
          } while (0);
          r47 = (r93 << 2) + 5243408 | 0;
          HEAP32[r50 + 7] = r93;
          HEAP32[r50 + 5] = 0;
          HEAP32[r50 + 4] = 0;
          r63 = HEAP32[1310777];
          r49 = 1 << r93;
          if ((r63 & r49 | 0) == 0) {
            HEAP32[1310777] = r63 | r49;
            HEAP32[r47 >> 2] = r39;
            HEAP32[r50 + 6] = r47;
            HEAP32[r50 + 3] = r64;
            HEAP32[r50 + 2] = r64;
            break;
          }
          if ((r93 | 0) == 31) {
            r94 = 0;
          } else {
            r94 = 25 - (r93 >>> 1) | 0;
          }
          r49 = r55 << r94;
          r63 = HEAP32[r47 >> 2];
          while (1) {
            if ((HEAP32[r63 + 4 >> 2] & -8 | 0) == (r55 | 0)) {
              break;
            }
            r95 = (r49 >>> 31 << 2) + r63 + 16 | 0;
            r47 = HEAP32[r95 >> 2];
            if ((r47 | 0) == 0) {
              r2 = 569;
              break;
            } else {
              r49 = r49 << 1;
              r63 = r47;
            }
          }
          if (r2 == 569) {
            if (r95 >>> 0 < HEAP32[1310780] >>> 0) {
              _abort();
            } else {
              HEAP32[r95 >> 2] = r39;
              HEAP32[r50 + 6] = r63;
              HEAP32[r50 + 3] = r64;
              HEAP32[r50 + 2] = r64;
              break;
            }
          }
          r49 = r63 + 8 | 0;
          r55 = HEAP32[r49 >> 2];
          r47 = HEAP32[1310780];
          if (r63 >>> 0 < r47 >>> 0) {
            _abort();
          }
          if (r55 >>> 0 < r47 >>> 0) {
            _abort();
          } else {
            HEAP32[r55 + 12 >> 2] = r39;
            HEAP32[r49 >> 2] = r39;
            HEAP32[r50 + 2] = r55;
            HEAP32[r50 + 3] = r63;
            HEAP32[r50 + 6] = 0;
            break;
          }
        }
      } while (0);
      r50 = HEAP32[1310779];
      if (r50 >>> 0 <= r15 >>> 0) {
        break;
      }
      r64 = r50 - r15 | 0;
      HEAP32[1310779] = r64;
      r50 = HEAP32[1310782];
      r55 = r50;
      HEAP32[1310782] = r55 + r15 | 0;
      HEAP32[(r55 + 4 >> 2) + r16] = r64 | 1;
      HEAP32[r50 + 4 >> 2] = r15 | 3;
      r14 = r50 + 8 | 0;
      return r14;
    }
  } while (0);
  HEAP32[___errno_location() >> 2] = 12;
  r14 = 0;
  return r14;
}
function _free(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46;
  r2 = r1 >> 2;
  r3 = 0;
  if ((r1 | 0) == 0) {
    return;
  }
  r4 = r1 - 8 | 0;
  r5 = r4;
  r6 = HEAP32[1310780];
  if (r4 >>> 0 < r6 >>> 0) {
    _abort();
  }
  r7 = HEAP32[r1 - 4 >> 2];
  r8 = r7 & 3;
  if ((r8 | 0) == 1) {
    _abort();
  }
  r9 = r7 & -8, r10 = r9 >> 2;
  r11 = r1 + (r9 - 8) | 0;
  r12 = r11;
  L858 : do {
    if ((r7 & 1 | 0) == 0) {
      r13 = HEAP32[r4 >> 2];
      if ((r8 | 0) == 0) {
        return;
      }
      r14 = -8 - r13 | 0, r15 = r14 >> 2;
      r16 = r1 + r14 | 0;
      r17 = r16;
      r18 = r13 + r9 | 0;
      if (r16 >>> 0 < r6 >>> 0) {
        _abort();
      }
      if ((r17 | 0) == (HEAP32[1310781] | 0)) {
        r19 = (r1 + (r9 - 4) | 0) >> 2;
        if ((HEAP32[r19] & 3 | 0) != 3) {
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break;
        }
        HEAP32[1310778] = r18;
        HEAP32[r19] = HEAP32[r19] & -2;
        HEAP32[r15 + (r2 + 1)] = r18 | 1;
        HEAP32[r11 >> 2] = r18;
        return;
      }
      r19 = r13 >>> 3;
      if (r13 >>> 0 < 256) {
        r13 = HEAP32[r15 + (r2 + 2)];
        r23 = HEAP32[r15 + (r2 + 3)];
        r24 = (r19 << 3) + 5243144 | 0;
        do {
          if ((r13 | 0) != (r24 | 0)) {
            if (r13 >>> 0 < r6 >>> 0) {
              _abort();
            }
            if ((HEAP32[r13 + 12 >> 2] | 0) == (r17 | 0)) {
              break;
            }
            _abort();
          }
        } while (0);
        if ((r23 | 0) == (r13 | 0)) {
          HEAP32[1310776] = HEAP32[1310776] & (1 << r19 ^ -1);
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break;
        }
        do {
          if ((r23 | 0) == (r24 | 0)) {
            r25 = r23 + 8 | 0;
          } else {
            if (r23 >>> 0 < r6 >>> 0) {
              _abort();
            }
            r26 = r23 + 8 | 0;
            if ((HEAP32[r26 >> 2] | 0) == (r17 | 0)) {
              r25 = r26;
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[r13 + 12 >> 2] = r23;
        HEAP32[r25 >> 2] = r13;
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
      r24 = r16;
      r19 = HEAP32[r15 + (r2 + 6)];
      r26 = HEAP32[r15 + (r2 + 3)];
      L892 : do {
        if ((r26 | 0) == (r24 | 0)) {
          r27 = r14 + (r1 + 20) | 0;
          r28 = HEAP32[r27 >> 2];
          do {
            if ((r28 | 0) == 0) {
              r29 = r14 + (r1 + 16) | 0;
              r30 = HEAP32[r29 >> 2];
              if ((r30 | 0) == 0) {
                r31 = 0, r32 = r31 >> 2;
                break L892;
              } else {
                r33 = r30;
                r34 = r29;
                break;
              }
            } else {
              r33 = r28;
              r34 = r27;
            }
          } while (0);
          while (1) {
            r27 = r33 + 20 | 0;
            r28 = HEAP32[r27 >> 2];
            if ((r28 | 0) != 0) {
              r33 = r28;
              r34 = r27;
              continue;
            }
            r27 = r33 + 16 | 0;
            r28 = HEAP32[r27 >> 2];
            if ((r28 | 0) == 0) {
              break;
            } else {
              r33 = r28;
              r34 = r27;
            }
          }
          if (r34 >>> 0 < r6 >>> 0) {
            _abort();
          } else {
            HEAP32[r34 >> 2] = 0;
            r31 = r33, r32 = r31 >> 2;
            break;
          }
        } else {
          r27 = HEAP32[r15 + (r2 + 2)];
          if (r27 >>> 0 < r6 >>> 0) {
            _abort();
          }
          r28 = r27 + 12 | 0;
          if ((HEAP32[r28 >> 2] | 0) != (r24 | 0)) {
            _abort();
          }
          r29 = r26 + 8 | 0;
          if ((HEAP32[r29 >> 2] | 0) == (r24 | 0)) {
            HEAP32[r28 >> 2] = r26;
            HEAP32[r29 >> 2] = r27;
            r31 = r26, r32 = r31 >> 2;
            break;
          } else {
            _abort();
          }
        }
      } while (0);
      if ((r19 | 0) == 0) {
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
      r26 = r14 + (r1 + 28) | 0;
      r16 = (HEAP32[r26 >> 2] << 2) + 5243408 | 0;
      do {
        if ((r24 | 0) == (HEAP32[r16 >> 2] | 0)) {
          HEAP32[r16 >> 2] = r31;
          if ((r31 | 0) != 0) {
            break;
          }
          HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r26 >> 2] ^ -1);
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break L858;
        } else {
          if (r19 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          r13 = r19 + 16 | 0;
          if ((HEAP32[r13 >> 2] | 0) == (r24 | 0)) {
            HEAP32[r13 >> 2] = r31;
          } else {
            HEAP32[r19 + 20 >> 2] = r31;
          }
          if ((r31 | 0) == 0) {
            r20 = r17, r21 = r20 >> 2;
            r22 = r18;
            break L858;
          }
        }
      } while (0);
      if (r31 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      }
      HEAP32[r32 + 6] = r19;
      r24 = HEAP32[r15 + (r2 + 4)];
      do {
        if ((r24 | 0) != 0) {
          if (r24 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r32 + 4] = r24;
            HEAP32[r24 + 24 >> 2] = r31;
            break;
          }
        }
      } while (0);
      r24 = HEAP32[r15 + (r2 + 5)];
      if ((r24 | 0) == 0) {
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
      if (r24 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      } else {
        HEAP32[r32 + 5] = r24;
        HEAP32[r24 + 24 >> 2] = r31;
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
    } else {
      r20 = r5, r21 = r20 >> 2;
      r22 = r9;
    }
  } while (0);
  r5 = r20, r31 = r5 >> 2;
  if (r5 >>> 0 >= r11 >>> 0) {
    _abort();
  }
  r5 = r1 + (r9 - 4) | 0;
  r32 = HEAP32[r5 >> 2];
  if ((r32 & 1 | 0) == 0) {
    _abort();
  }
  do {
    if ((r32 & 2 | 0) == 0) {
      if ((r12 | 0) == (HEAP32[1310782] | 0)) {
        r6 = HEAP32[1310779] + r22 | 0;
        HEAP32[1310779] = r6;
        HEAP32[1310782] = r20;
        HEAP32[r21 + 1] = r6 | 1;
        if ((r20 | 0) == (HEAP32[1310781] | 0)) {
          HEAP32[1310781] = 0;
          HEAP32[1310778] = 0;
        }
        if (r6 >>> 0 <= HEAP32[1310783] >>> 0) {
          return;
        }
        _sys_trim(0);
        return;
      }
      if ((r12 | 0) == (HEAP32[1310781] | 0)) {
        r6 = HEAP32[1310778] + r22 | 0;
        HEAP32[1310778] = r6;
        HEAP32[1310781] = r20;
        HEAP32[r21 + 1] = r6 | 1;
        HEAP32[(r6 >> 2) + r31] = r6;
        return;
      }
      r6 = (r32 & -8) + r22 | 0;
      r33 = r32 >>> 3;
      L963 : do {
        if (r32 >>> 0 < 256) {
          r34 = HEAP32[r2 + r10];
          r25 = HEAP32[((r9 | 4) >> 2) + r2];
          r8 = (r33 << 3) + 5243144 | 0;
          do {
            if ((r34 | 0) != (r8 | 0)) {
              if (r34 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              if ((HEAP32[r34 + 12 >> 2] | 0) == (r12 | 0)) {
                break;
              }
              _abort();
            }
          } while (0);
          if ((r25 | 0) == (r34 | 0)) {
            HEAP32[1310776] = HEAP32[1310776] & (1 << r33 ^ -1);
            break;
          }
          do {
            if ((r25 | 0) == (r8 | 0)) {
              r35 = r25 + 8 | 0;
            } else {
              if (r25 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r4 = r25 + 8 | 0;
              if ((HEAP32[r4 >> 2] | 0) == (r12 | 0)) {
                r35 = r4;
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[r34 + 12 >> 2] = r25;
          HEAP32[r35 >> 2] = r34;
        } else {
          r8 = r11;
          r4 = HEAP32[r10 + (r2 + 4)];
          r7 = HEAP32[((r9 | 4) >> 2) + r2];
          L965 : do {
            if ((r7 | 0) == (r8 | 0)) {
              r24 = r9 + (r1 + 12) | 0;
              r19 = HEAP32[r24 >> 2];
              do {
                if ((r19 | 0) == 0) {
                  r26 = r9 + (r1 + 8) | 0;
                  r16 = HEAP32[r26 >> 2];
                  if ((r16 | 0) == 0) {
                    r36 = 0, r37 = r36 >> 2;
                    break L965;
                  } else {
                    r38 = r16;
                    r39 = r26;
                    break;
                  }
                } else {
                  r38 = r19;
                  r39 = r24;
                }
              } while (0);
              while (1) {
                r24 = r38 + 20 | 0;
                r19 = HEAP32[r24 >> 2];
                if ((r19 | 0) != 0) {
                  r38 = r19;
                  r39 = r24;
                  continue;
                }
                r24 = r38 + 16 | 0;
                r19 = HEAP32[r24 >> 2];
                if ((r19 | 0) == 0) {
                  break;
                } else {
                  r38 = r19;
                  r39 = r24;
                }
              }
              if (r39 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              } else {
                HEAP32[r39 >> 2] = 0;
                r36 = r38, r37 = r36 >> 2;
                break;
              }
            } else {
              r24 = HEAP32[r2 + r10];
              if (r24 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r19 = r24 + 12 | 0;
              if ((HEAP32[r19 >> 2] | 0) != (r8 | 0)) {
                _abort();
              }
              r26 = r7 + 8 | 0;
              if ((HEAP32[r26 >> 2] | 0) == (r8 | 0)) {
                HEAP32[r19 >> 2] = r7;
                HEAP32[r26 >> 2] = r24;
                r36 = r7, r37 = r36 >> 2;
                break;
              } else {
                _abort();
              }
            }
          } while (0);
          if ((r4 | 0) == 0) {
            break;
          }
          r7 = r9 + (r1 + 20) | 0;
          r34 = (HEAP32[r7 >> 2] << 2) + 5243408 | 0;
          do {
            if ((r8 | 0) == (HEAP32[r34 >> 2] | 0)) {
              HEAP32[r34 >> 2] = r36;
              if ((r36 | 0) != 0) {
                break;
              }
              HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r7 >> 2] ^ -1);
              break L963;
            } else {
              if (r4 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r25 = r4 + 16 | 0;
              if ((HEAP32[r25 >> 2] | 0) == (r8 | 0)) {
                HEAP32[r25 >> 2] = r36;
              } else {
                HEAP32[r4 + 20 >> 2] = r36;
              }
              if ((r36 | 0) == 0) {
                break L963;
              }
            }
          } while (0);
          if (r36 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          HEAP32[r37 + 6] = r4;
          r8 = HEAP32[r10 + (r2 + 2)];
          do {
            if ((r8 | 0) != 0) {
              if (r8 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              } else {
                HEAP32[r37 + 4] = r8;
                HEAP32[r8 + 24 >> 2] = r36;
                break;
              }
            }
          } while (0);
          r8 = HEAP32[r10 + (r2 + 3)];
          if ((r8 | 0) == 0) {
            break;
          }
          if (r8 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r37 + 5] = r8;
            HEAP32[r8 + 24 >> 2] = r36;
            break;
          }
        }
      } while (0);
      HEAP32[r21 + 1] = r6 | 1;
      HEAP32[(r6 >> 2) + r31] = r6;
      if ((r20 | 0) != (HEAP32[1310781] | 0)) {
        r40 = r6;
        break;
      }
      HEAP32[1310778] = r6;
      return;
    } else {
      HEAP32[r5 >> 2] = r32 & -2;
      HEAP32[r21 + 1] = r22 | 1;
      HEAP32[(r22 >> 2) + r31] = r22;
      r40 = r22;
    }
  } while (0);
  r22 = r40 >>> 3;
  if (r40 >>> 0 < 256) {
    r31 = r22 << 1;
    r32 = (r31 << 2) + 5243144 | 0;
    r5 = HEAP32[1310776];
    r36 = 1 << r22;
    do {
      if ((r5 & r36 | 0) == 0) {
        HEAP32[1310776] = r5 | r36;
        r41 = r32;
        r42 = (r31 + 2 << 2) + 5243144 | 0;
      } else {
        r22 = (r31 + 2 << 2) + 5243144 | 0;
        r37 = HEAP32[r22 >> 2];
        if (r37 >>> 0 >= HEAP32[1310780] >>> 0) {
          r41 = r37;
          r42 = r22;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r42 >> 2] = r20;
    HEAP32[r41 + 12 >> 2] = r20;
    HEAP32[r21 + 2] = r41;
    HEAP32[r21 + 3] = r32;
    return;
  }
  r32 = r20;
  r41 = r40 >>> 8;
  do {
    if ((r41 | 0) == 0) {
      r43 = 0;
    } else {
      if (r40 >>> 0 > 16777215) {
        r43 = 31;
        break;
      }
      r42 = (r41 + 1048320 | 0) >>> 16 & 8;
      r31 = r41 << r42;
      r36 = (r31 + 520192 | 0) >>> 16 & 4;
      r5 = r31 << r36;
      r31 = (r5 + 245760 | 0) >>> 16 & 2;
      r22 = 14 - (r36 | r42 | r31) + (r5 << r31 >>> 15) | 0;
      r43 = r40 >>> ((r22 + 7 | 0) >>> 0) & 1 | r22 << 1;
    }
  } while (0);
  r41 = (r43 << 2) + 5243408 | 0;
  HEAP32[r21 + 7] = r43;
  HEAP32[r21 + 5] = 0;
  HEAP32[r21 + 4] = 0;
  r22 = HEAP32[1310777];
  r31 = 1 << r43;
  do {
    if ((r22 & r31 | 0) == 0) {
      HEAP32[1310777] = r22 | r31;
      HEAP32[r41 >> 2] = r32;
      HEAP32[r21 + 6] = r41;
      HEAP32[r21 + 3] = r20;
      HEAP32[r21 + 2] = r20;
    } else {
      if ((r43 | 0) == 31) {
        r44 = 0;
      } else {
        r44 = 25 - (r43 >>> 1) | 0;
      }
      r5 = r40 << r44;
      r42 = HEAP32[r41 >> 2];
      while (1) {
        if ((HEAP32[r42 + 4 >> 2] & -8 | 0) == (r40 | 0)) {
          break;
        }
        r45 = (r5 >>> 31 << 2) + r42 + 16 | 0;
        r36 = HEAP32[r45 >> 2];
        if ((r36 | 0) == 0) {
          r3 = 748;
          break;
        } else {
          r5 = r5 << 1;
          r42 = r36;
        }
      }
      if (r3 == 748) {
        if (r45 >>> 0 < HEAP32[1310780] >>> 0) {
          _abort();
        } else {
          HEAP32[r45 >> 2] = r32;
          HEAP32[r21 + 6] = r42;
          HEAP32[r21 + 3] = r20;
          HEAP32[r21 + 2] = r20;
          break;
        }
      }
      r5 = r42 + 8 | 0;
      r6 = HEAP32[r5 >> 2];
      r36 = HEAP32[1310780];
      if (r42 >>> 0 < r36 >>> 0) {
        _abort();
      }
      if (r6 >>> 0 < r36 >>> 0) {
        _abort();
      } else {
        HEAP32[r6 + 12 >> 2] = r32;
        HEAP32[r5 >> 2] = r32;
        HEAP32[r21 + 2] = r6;
        HEAP32[r21 + 3] = r42;
        HEAP32[r21 + 6] = 0;
        break;
      }
    }
  } while (0);
  r21 = HEAP32[1310784] - 1 | 0;
  HEAP32[1310784] = r21;
  if ((r21 | 0) == 0) {
    r46 = 5243560;
  } else {
    return;
  }
  while (1) {
    r21 = HEAP32[r46 >> 2];
    if ((r21 | 0) == 0) {
      break;
    } else {
      r46 = r21 + 8 | 0;
    }
  }
  HEAP32[1310784] = -1;
  return;
}
function _realloc(r1, r2) {
  var r3, r4, r5, r6;
  if ((r1 | 0) == 0) {
    r3 = _malloc(r2);
    return r3;
  }
  if (r2 >>> 0 > 4294967231) {
    HEAP32[___errno_location() >> 2] = 12;
    r3 = 0;
    return r3;
  }
  if (r2 >>> 0 < 11) {
    r4 = 16;
  } else {
    r4 = r2 + 11 & -8;
  }
  r5 = _try_realloc_chunk(r1 - 8 | 0, r4);
  if ((r5 | 0) != 0) {
    r3 = r5 + 8 | 0;
    return r3;
  }
  r5 = _malloc(r2);
  if ((r5 | 0) == 0) {
    r3 = 0;
    return r3;
  }
  r4 = HEAP32[r1 - 4 >> 2];
  r6 = (r4 & -8) - ((r4 & 3 | 0) == 0 ? 8 : 4) | 0;
  _memcpy(r5, r1, r6 >>> 0 < r2 >>> 0 ? r6 : r2);
  _free(r1);
  r3 = r5;
  return r3;
}
Module["_realloc"] = _realloc;
function _sys_trim(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15;
  do {
    if ((HEAP32[1310720] | 0) == 0) {
      r2 = _sysconf(8);
      if ((r2 - 1 & r2 | 0) == 0) {
        HEAP32[1310722] = r2;
        HEAP32[1310721] = r2;
        HEAP32[1310723] = -1;
        HEAP32[1310724] = 2097152;
        HEAP32[1310725] = 0;
        HEAP32[1310887] = 0;
        HEAP32[1310720] = _time(0) & -16 ^ 1431655768;
        break;
      } else {
        _abort();
      }
    }
  } while (0);
  if (r1 >>> 0 >= 4294967232) {
    r3 = 0;
    r4 = r3 & 1;
    return r4;
  }
  r2 = HEAP32[1310782];
  if ((r2 | 0) == 0) {
    r3 = 0;
    r4 = r3 & 1;
    return r4;
  }
  r5 = HEAP32[1310779];
  do {
    if (r5 >>> 0 > (r1 + 40 | 0) >>> 0) {
      r6 = HEAP32[1310722];
      r7 = Math.imul(Math.floor(((-40 - r1 - 1 + r5 + r6 | 0) >>> 0) / (r6 >>> 0)) - 1 | 0, r6);
      r8 = r2;
      r9 = 5243552, r10 = r9 >> 2;
      while (1) {
        r11 = HEAP32[r10];
        if (r11 >>> 0 <= r8 >>> 0) {
          if ((r11 + HEAP32[r10 + 1] | 0) >>> 0 > r8 >>> 0) {
            r12 = r9;
            break;
          }
        }
        r11 = HEAP32[r10 + 2];
        if ((r11 | 0) == 0) {
          r12 = 0;
          break;
        } else {
          r9 = r11, r10 = r9 >> 2;
        }
      }
      if ((HEAP32[r12 + 12 >> 2] & 8 | 0) != 0) {
        break;
      }
      r9 = _sbrk(0);
      r10 = (r12 + 4 | 0) >> 2;
      if ((r9 | 0) != (HEAP32[r12 >> 2] + HEAP32[r10] | 0)) {
        break;
      }
      r8 = _sbrk(-(r7 >>> 0 > 2147483646 ? -2147483648 - r6 | 0 : r7) | 0);
      r11 = _sbrk(0);
      if (!((r8 | 0) != -1 & r11 >>> 0 < r9 >>> 0)) {
        break;
      }
      r8 = r9 - r11 | 0;
      if ((r9 | 0) == (r11 | 0)) {
        break;
      }
      HEAP32[r10] = HEAP32[r10] - r8 | 0;
      HEAP32[1310884] = HEAP32[1310884] - r8 | 0;
      r10 = HEAP32[1310782];
      r13 = HEAP32[1310779] - r8 | 0;
      r8 = r10;
      r14 = r10 + 8 | 0;
      if ((r14 & 7 | 0) == 0) {
        r15 = 0;
      } else {
        r15 = -r14 & 7;
      }
      r14 = r13 - r15 | 0;
      HEAP32[1310782] = r8 + r15 | 0;
      HEAP32[1310779] = r14;
      HEAP32[r15 + (r8 + 4) >> 2] = r14 | 1;
      HEAP32[r13 + (r8 + 4) >> 2] = 40;
      HEAP32[1310783] = HEAP32[1310724];
      r3 = (r9 | 0) != (r11 | 0);
      r4 = r3 & 1;
      return r4;
    }
  } while (0);
  if (HEAP32[1310779] >>> 0 <= HEAP32[1310783] >>> 0) {
    r3 = 0;
    r4 = r3 & 1;
    return r4;
  }
  HEAP32[1310783] = -1;
  r3 = 0;
  r4 = r3 & 1;
  return r4;
}
function _try_realloc_chunk(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29;
  r3 = (r1 + 4 | 0) >> 2;
  r4 = HEAP32[r3];
  r5 = r4 & -8, r6 = r5 >> 2;
  r7 = r1, r8 = r7 >> 2;
  r9 = r7 + r5 | 0;
  r10 = r9;
  r11 = HEAP32[1310780];
  if (r7 >>> 0 < r11 >>> 0) {
    _abort();
  }
  r12 = r4 & 3;
  if (!((r12 | 0) != 1 & r7 >>> 0 < r9 >>> 0)) {
    _abort();
  }
  r13 = (r7 + (r5 | 4) | 0) >> 2;
  r14 = HEAP32[r13];
  if ((r14 & 1 | 0) == 0) {
    _abort();
  }
  if ((r12 | 0) == 0) {
    if (r2 >>> 0 < 256) {
      r15 = 0;
      return r15;
    }
    do {
      if (r5 >>> 0 >= (r2 + 4 | 0) >>> 0) {
        if ((r5 - r2 | 0) >>> 0 > HEAP32[1310722] << 1 >>> 0) {
          break;
        } else {
          r15 = r1;
        }
        return r15;
      }
    } while (0);
    r15 = 0;
    return r15;
  }
  if (r5 >>> 0 >= r2 >>> 0) {
    r12 = r5 - r2 | 0;
    if (r12 >>> 0 <= 15) {
      r15 = r1;
      return r15;
    }
    HEAP32[r3] = r4 & 1 | r2 | 2;
    HEAP32[(r2 + 4 >> 2) + r8] = r12 | 3;
    HEAP32[r13] = HEAP32[r13] | 1;
    _dispose_chunk(r7 + r2 | 0, r12);
    r15 = r1;
    return r15;
  }
  if ((r10 | 0) == (HEAP32[1310782] | 0)) {
    r12 = HEAP32[1310779] + r5 | 0;
    if (r12 >>> 0 <= r2 >>> 0) {
      r15 = 0;
      return r15;
    }
    r13 = r12 - r2 | 0;
    HEAP32[r3] = r4 & 1 | r2 | 2;
    HEAP32[(r2 + 4 >> 2) + r8] = r13 | 1;
    HEAP32[1310782] = r7 + r2 | 0;
    HEAP32[1310779] = r13;
    r15 = r1;
    return r15;
  }
  if ((r10 | 0) == (HEAP32[1310781] | 0)) {
    r13 = HEAP32[1310778] + r5 | 0;
    if (r13 >>> 0 < r2 >>> 0) {
      r15 = 0;
      return r15;
    }
    r12 = r13 - r2 | 0;
    if (r12 >>> 0 > 15) {
      HEAP32[r3] = r4 & 1 | r2 | 2;
      HEAP32[(r2 + 4 >> 2) + r8] = r12 | 1;
      HEAP32[(r13 >> 2) + r8] = r12;
      r16 = r13 + (r7 + 4) | 0;
      HEAP32[r16 >> 2] = HEAP32[r16 >> 2] & -2;
      r17 = r7 + r2 | 0;
      r18 = r12;
    } else {
      HEAP32[r3] = r4 & 1 | r13 | 2;
      r4 = r13 + (r7 + 4) | 0;
      HEAP32[r4 >> 2] = HEAP32[r4 >> 2] | 1;
      r17 = 0;
      r18 = 0;
    }
    HEAP32[1310778] = r18;
    HEAP32[1310781] = r17;
    r15 = r1;
    return r15;
  }
  if ((r14 & 2 | 0) != 0) {
    r15 = 0;
    return r15;
  }
  r17 = (r14 & -8) + r5 | 0;
  if (r17 >>> 0 < r2 >>> 0) {
    r15 = 0;
    return r15;
  }
  r18 = r17 - r2 | 0;
  r4 = r14 >>> 3;
  L1184 : do {
    if (r14 >>> 0 < 256) {
      r13 = HEAP32[r6 + (r8 + 2)];
      r12 = HEAP32[r6 + (r8 + 3)];
      r16 = (r4 << 3) + 5243144 | 0;
      do {
        if ((r13 | 0) != (r16 | 0)) {
          if (r13 >>> 0 < r11 >>> 0) {
            _abort();
          }
          if ((HEAP32[r13 + 12 >> 2] | 0) == (r10 | 0)) {
            break;
          }
          _abort();
        }
      } while (0);
      if ((r12 | 0) == (r13 | 0)) {
        HEAP32[1310776] = HEAP32[1310776] & (1 << r4 ^ -1);
        break;
      }
      do {
        if ((r12 | 0) == (r16 | 0)) {
          r19 = r12 + 8 | 0;
        } else {
          if (r12 >>> 0 < r11 >>> 0) {
            _abort();
          }
          r20 = r12 + 8 | 0;
          if ((HEAP32[r20 >> 2] | 0) == (r10 | 0)) {
            r19 = r20;
            break;
          }
          _abort();
        }
      } while (0);
      HEAP32[r13 + 12 >> 2] = r12;
      HEAP32[r19 >> 2] = r13;
    } else {
      r16 = r9;
      r20 = HEAP32[r6 + (r8 + 6)];
      r21 = HEAP32[r6 + (r8 + 3)];
      L1186 : do {
        if ((r21 | 0) == (r16 | 0)) {
          r22 = r5 + (r7 + 20) | 0;
          r23 = HEAP32[r22 >> 2];
          do {
            if ((r23 | 0) == 0) {
              r24 = r5 + (r7 + 16) | 0;
              r25 = HEAP32[r24 >> 2];
              if ((r25 | 0) == 0) {
                r26 = 0, r27 = r26 >> 2;
                break L1186;
              } else {
                r28 = r25;
                r29 = r24;
                break;
              }
            } else {
              r28 = r23;
              r29 = r22;
            }
          } while (0);
          while (1) {
            r22 = r28 + 20 | 0;
            r23 = HEAP32[r22 >> 2];
            if ((r23 | 0) != 0) {
              r28 = r23;
              r29 = r22;
              continue;
            }
            r22 = r28 + 16 | 0;
            r23 = HEAP32[r22 >> 2];
            if ((r23 | 0) == 0) {
              break;
            } else {
              r28 = r23;
              r29 = r22;
            }
          }
          if (r29 >>> 0 < r11 >>> 0) {
            _abort();
          } else {
            HEAP32[r29 >> 2] = 0;
            r26 = r28, r27 = r26 >> 2;
            break;
          }
        } else {
          r22 = HEAP32[r6 + (r8 + 2)];
          if (r22 >>> 0 < r11 >>> 0) {
            _abort();
          }
          r23 = r22 + 12 | 0;
          if ((HEAP32[r23 >> 2] | 0) != (r16 | 0)) {
            _abort();
          }
          r24 = r21 + 8 | 0;
          if ((HEAP32[r24 >> 2] | 0) == (r16 | 0)) {
            HEAP32[r23 >> 2] = r21;
            HEAP32[r24 >> 2] = r22;
            r26 = r21, r27 = r26 >> 2;
            break;
          } else {
            _abort();
          }
        }
      } while (0);
      if ((r20 | 0) == 0) {
        break;
      }
      r21 = r5 + (r7 + 28) | 0;
      r13 = (HEAP32[r21 >> 2] << 2) + 5243408 | 0;
      do {
        if ((r16 | 0) == (HEAP32[r13 >> 2] | 0)) {
          HEAP32[r13 >> 2] = r26;
          if ((r26 | 0) != 0) {
            break;
          }
          HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r21 >> 2] ^ -1);
          break L1184;
        } else {
          if (r20 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          r12 = r20 + 16 | 0;
          if ((HEAP32[r12 >> 2] | 0) == (r16 | 0)) {
            HEAP32[r12 >> 2] = r26;
          } else {
            HEAP32[r20 + 20 >> 2] = r26;
          }
          if ((r26 | 0) == 0) {
            break L1184;
          }
        }
      } while (0);
      if (r26 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      }
      HEAP32[r27 + 6] = r20;
      r16 = HEAP32[r6 + (r8 + 4)];
      do {
        if ((r16 | 0) != 0) {
          if (r16 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r27 + 4] = r16;
            HEAP32[r16 + 24 >> 2] = r26;
            break;
          }
        }
      } while (0);
      r16 = HEAP32[r6 + (r8 + 5)];
      if ((r16 | 0) == 0) {
        break;
      }
      if (r16 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      } else {
        HEAP32[r27 + 5] = r16;
        HEAP32[r16 + 24 >> 2] = r26;
        break;
      }
    }
  } while (0);
  if (r18 >>> 0 < 16) {
    HEAP32[r3] = r17 | HEAP32[r3] & 1 | 2;
    r26 = r7 + (r17 | 4) | 0;
    HEAP32[r26 >> 2] = HEAP32[r26 >> 2] | 1;
    r15 = r1;
    return r15;
  } else {
    HEAP32[r3] = HEAP32[r3] & 1 | r2 | 2;
    HEAP32[(r2 + 4 >> 2) + r8] = r18 | 3;
    r8 = r7 + (r17 | 4) | 0;
    HEAP32[r8 >> 2] = HEAP32[r8 >> 2] | 1;
    _dispose_chunk(r7 + r2 | 0, r18);
    r15 = r1;
    return r15;
  }
}
function __ZNSt9bad_allocD1Ev(r1) {
  return;
}
function _dispose_chunk(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43;
  r3 = r2 >> 2;
  r4 = 0;
  r5 = r1, r6 = r5 >> 2;
  r7 = r5 + r2 | 0;
  r8 = r7;
  r9 = HEAP32[r1 + 4 >> 2];
  L1261 : do {
    if ((r9 & 1 | 0) == 0) {
      r10 = HEAP32[r1 >> 2];
      if ((r9 & 3 | 0) == 0) {
        return;
      }
      r11 = r5 + -r10 | 0;
      r12 = r11;
      r13 = r10 + r2 | 0;
      r14 = HEAP32[1310780];
      if (r11 >>> 0 < r14 >>> 0) {
        _abort();
      }
      if ((r12 | 0) == (HEAP32[1310781] | 0)) {
        r15 = (r2 + (r5 + 4) | 0) >> 2;
        if ((HEAP32[r15] & 3 | 0) != 3) {
          r16 = r12, r17 = r16 >> 2;
          r18 = r13;
          break;
        }
        HEAP32[1310778] = r13;
        HEAP32[r15] = HEAP32[r15] & -2;
        HEAP32[(4 - r10 >> 2) + r6] = r13 | 1;
        HEAP32[r7 >> 2] = r13;
        return;
      }
      r15 = r10 >>> 3;
      if (r10 >>> 0 < 256) {
        r19 = HEAP32[(8 - r10 >> 2) + r6];
        r20 = HEAP32[(12 - r10 >> 2) + r6];
        r21 = (r15 << 3) + 5243144 | 0;
        do {
          if ((r19 | 0) != (r21 | 0)) {
            if (r19 >>> 0 < r14 >>> 0) {
              _abort();
            }
            if ((HEAP32[r19 + 12 >> 2] | 0) == (r12 | 0)) {
              break;
            }
            _abort();
          }
        } while (0);
        if ((r20 | 0) == (r19 | 0)) {
          HEAP32[1310776] = HEAP32[1310776] & (1 << r15 ^ -1);
          r16 = r12, r17 = r16 >> 2;
          r18 = r13;
          break;
        }
        do {
          if ((r20 | 0) == (r21 | 0)) {
            r22 = r20 + 8 | 0;
          } else {
            if (r20 >>> 0 < r14 >>> 0) {
              _abort();
            }
            r23 = r20 + 8 | 0;
            if ((HEAP32[r23 >> 2] | 0) == (r12 | 0)) {
              r22 = r23;
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[r19 + 12 >> 2] = r20;
        HEAP32[r22 >> 2] = r19;
        r16 = r12, r17 = r16 >> 2;
        r18 = r13;
        break;
      }
      r21 = r11;
      r15 = HEAP32[(24 - r10 >> 2) + r6];
      r23 = HEAP32[(12 - r10 >> 2) + r6];
      L1295 : do {
        if ((r23 | 0) == (r21 | 0)) {
          r24 = 16 - r10 | 0;
          r25 = r24 + (r5 + 4) | 0;
          r26 = HEAP32[r25 >> 2];
          do {
            if ((r26 | 0) == 0) {
              r27 = r5 + r24 | 0;
              r28 = HEAP32[r27 >> 2];
              if ((r28 | 0) == 0) {
                r29 = 0, r30 = r29 >> 2;
                break L1295;
              } else {
                r31 = r28;
                r32 = r27;
                break;
              }
            } else {
              r31 = r26;
              r32 = r25;
            }
          } while (0);
          while (1) {
            r25 = r31 + 20 | 0;
            r26 = HEAP32[r25 >> 2];
            if ((r26 | 0) != 0) {
              r31 = r26;
              r32 = r25;
              continue;
            }
            r25 = r31 + 16 | 0;
            r26 = HEAP32[r25 >> 2];
            if ((r26 | 0) == 0) {
              break;
            } else {
              r31 = r26;
              r32 = r25;
            }
          }
          if (r32 >>> 0 < r14 >>> 0) {
            _abort();
          } else {
            HEAP32[r32 >> 2] = 0;
            r29 = r31, r30 = r29 >> 2;
            break;
          }
        } else {
          r25 = HEAP32[(8 - r10 >> 2) + r6];
          if (r25 >>> 0 < r14 >>> 0) {
            _abort();
          }
          r26 = r25 + 12 | 0;
          if ((HEAP32[r26 >> 2] | 0) != (r21 | 0)) {
            _abort();
          }
          r24 = r23 + 8 | 0;
          if ((HEAP32[r24 >> 2] | 0) == (r21 | 0)) {
            HEAP32[r26 >> 2] = r23;
            HEAP32[r24 >> 2] = r25;
            r29 = r23, r30 = r29 >> 2;
            break;
          } else {
            _abort();
          }
        }
      } while (0);
      if ((r15 | 0) == 0) {
        r16 = r12, r17 = r16 >> 2;
        r18 = r13;
        break;
      }
      r23 = r5 + (28 - r10) | 0;
      r14 = (HEAP32[r23 >> 2] << 2) + 5243408 | 0;
      do {
        if ((r21 | 0) == (HEAP32[r14 >> 2] | 0)) {
          HEAP32[r14 >> 2] = r29;
          if ((r29 | 0) != 0) {
            break;
          }
          HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r23 >> 2] ^ -1);
          r16 = r12, r17 = r16 >> 2;
          r18 = r13;
          break L1261;
        } else {
          if (r15 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          r11 = r15 + 16 | 0;
          if ((HEAP32[r11 >> 2] | 0) == (r21 | 0)) {
            HEAP32[r11 >> 2] = r29;
          } else {
            HEAP32[r15 + 20 >> 2] = r29;
          }
          if ((r29 | 0) == 0) {
            r16 = r12, r17 = r16 >> 2;
            r18 = r13;
            break L1261;
          }
        }
      } while (0);
      if (r29 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      }
      HEAP32[r30 + 6] = r15;
      r21 = 16 - r10 | 0;
      r23 = HEAP32[(r21 >> 2) + r6];
      do {
        if ((r23 | 0) != 0) {
          if (r23 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r30 + 4] = r23;
            HEAP32[r23 + 24 >> 2] = r29;
            break;
          }
        }
      } while (0);
      r23 = HEAP32[(r21 + 4 >> 2) + r6];
      if ((r23 | 0) == 0) {
        r16 = r12, r17 = r16 >> 2;
        r18 = r13;
        break;
      }
      if (r23 >>> 0 < HEAP32[1310780] >>> 0) {
        _abort();
      } else {
        HEAP32[r30 + 5] = r23;
        HEAP32[r23 + 24 >> 2] = r29;
        r16 = r12, r17 = r16 >> 2;
        r18 = r13;
        break;
      }
    } else {
      r16 = r1, r17 = r16 >> 2;
      r18 = r2;
    }
  } while (0);
  r1 = HEAP32[1310780];
  if (r7 >>> 0 < r1 >>> 0) {
    _abort();
  }
  r29 = r2 + (r5 + 4) | 0;
  r30 = HEAP32[r29 >> 2];
  do {
    if ((r30 & 2 | 0) == 0) {
      if ((r8 | 0) == (HEAP32[1310782] | 0)) {
        r31 = HEAP32[1310779] + r18 | 0;
        HEAP32[1310779] = r31;
        HEAP32[1310782] = r16;
        HEAP32[r17 + 1] = r31 | 1;
        if ((r16 | 0) != (HEAP32[1310781] | 0)) {
          return;
        }
        HEAP32[1310781] = 0;
        HEAP32[1310778] = 0;
        return;
      }
      if ((r8 | 0) == (HEAP32[1310781] | 0)) {
        r31 = HEAP32[1310778] + r18 | 0;
        HEAP32[1310778] = r31;
        HEAP32[1310781] = r16;
        HEAP32[r17 + 1] = r31 | 1;
        HEAP32[(r31 >> 2) + r17] = r31;
        return;
      }
      r31 = (r30 & -8) + r18 | 0;
      r32 = r30 >>> 3;
      L1360 : do {
        if (r30 >>> 0 < 256) {
          r22 = HEAP32[r3 + (r6 + 2)];
          r9 = HEAP32[r3 + (r6 + 3)];
          r23 = (r32 << 3) + 5243144 | 0;
          do {
            if ((r22 | 0) != (r23 | 0)) {
              if (r22 >>> 0 < r1 >>> 0) {
                _abort();
              }
              if ((HEAP32[r22 + 12 >> 2] | 0) == (r8 | 0)) {
                break;
              }
              _abort();
            }
          } while (0);
          if ((r9 | 0) == (r22 | 0)) {
            HEAP32[1310776] = HEAP32[1310776] & (1 << r32 ^ -1);
            break;
          }
          do {
            if ((r9 | 0) == (r23 | 0)) {
              r33 = r9 + 8 | 0;
            } else {
              if (r9 >>> 0 < r1 >>> 0) {
                _abort();
              }
              r10 = r9 + 8 | 0;
              if ((HEAP32[r10 >> 2] | 0) == (r8 | 0)) {
                r33 = r10;
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[r22 + 12 >> 2] = r9;
          HEAP32[r33 >> 2] = r22;
        } else {
          r23 = r7;
          r10 = HEAP32[r3 + (r6 + 6)];
          r15 = HEAP32[r3 + (r6 + 3)];
          L1362 : do {
            if ((r15 | 0) == (r23 | 0)) {
              r14 = r2 + (r5 + 20) | 0;
              r11 = HEAP32[r14 >> 2];
              do {
                if ((r11 | 0) == 0) {
                  r19 = r2 + (r5 + 16) | 0;
                  r20 = HEAP32[r19 >> 2];
                  if ((r20 | 0) == 0) {
                    r34 = 0, r35 = r34 >> 2;
                    break L1362;
                  } else {
                    r36 = r20;
                    r37 = r19;
                    break;
                  }
                } else {
                  r36 = r11;
                  r37 = r14;
                }
              } while (0);
              while (1) {
                r14 = r36 + 20 | 0;
                r11 = HEAP32[r14 >> 2];
                if ((r11 | 0) != 0) {
                  r36 = r11;
                  r37 = r14;
                  continue;
                }
                r14 = r36 + 16 | 0;
                r11 = HEAP32[r14 >> 2];
                if ((r11 | 0) == 0) {
                  break;
                } else {
                  r36 = r11;
                  r37 = r14;
                }
              }
              if (r37 >>> 0 < r1 >>> 0) {
                _abort();
              } else {
                HEAP32[r37 >> 2] = 0;
                r34 = r36, r35 = r34 >> 2;
                break;
              }
            } else {
              r14 = HEAP32[r3 + (r6 + 2)];
              if (r14 >>> 0 < r1 >>> 0) {
                _abort();
              }
              r11 = r14 + 12 | 0;
              if ((HEAP32[r11 >> 2] | 0) != (r23 | 0)) {
                _abort();
              }
              r19 = r15 + 8 | 0;
              if ((HEAP32[r19 >> 2] | 0) == (r23 | 0)) {
                HEAP32[r11 >> 2] = r15;
                HEAP32[r19 >> 2] = r14;
                r34 = r15, r35 = r34 >> 2;
                break;
              } else {
                _abort();
              }
            }
          } while (0);
          if ((r10 | 0) == 0) {
            break;
          }
          r15 = r2 + (r5 + 28) | 0;
          r22 = (HEAP32[r15 >> 2] << 2) + 5243408 | 0;
          do {
            if ((r23 | 0) == (HEAP32[r22 >> 2] | 0)) {
              HEAP32[r22 >> 2] = r34;
              if ((r34 | 0) != 0) {
                break;
              }
              HEAP32[1310777] = HEAP32[1310777] & (1 << HEAP32[r15 >> 2] ^ -1);
              break L1360;
            } else {
              if (r10 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              }
              r9 = r10 + 16 | 0;
              if ((HEAP32[r9 >> 2] | 0) == (r23 | 0)) {
                HEAP32[r9 >> 2] = r34;
              } else {
                HEAP32[r10 + 20 >> 2] = r34;
              }
              if ((r34 | 0) == 0) {
                break L1360;
              }
            }
          } while (0);
          if (r34 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          }
          HEAP32[r35 + 6] = r10;
          r23 = HEAP32[r3 + (r6 + 4)];
          do {
            if ((r23 | 0) != 0) {
              if (r23 >>> 0 < HEAP32[1310780] >>> 0) {
                _abort();
              } else {
                HEAP32[r35 + 4] = r23;
                HEAP32[r23 + 24 >> 2] = r34;
                break;
              }
            }
          } while (0);
          r23 = HEAP32[r3 + (r6 + 5)];
          if ((r23 | 0) == 0) {
            break;
          }
          if (r23 >>> 0 < HEAP32[1310780] >>> 0) {
            _abort();
          } else {
            HEAP32[r35 + 5] = r23;
            HEAP32[r23 + 24 >> 2] = r34;
            break;
          }
        }
      } while (0);
      HEAP32[r17 + 1] = r31 | 1;
      HEAP32[(r31 >> 2) + r17] = r31;
      if ((r16 | 0) != (HEAP32[1310781] | 0)) {
        r38 = r31;
        break;
      }
      HEAP32[1310778] = r31;
      return;
    } else {
      HEAP32[r29 >> 2] = r30 & -2;
      HEAP32[r17 + 1] = r18 | 1;
      HEAP32[(r18 >> 2) + r17] = r18;
      r38 = r18;
    }
  } while (0);
  r18 = r38 >>> 3;
  if (r38 >>> 0 < 256) {
    r30 = r18 << 1;
    r29 = (r30 << 2) + 5243144 | 0;
    r34 = HEAP32[1310776];
    r35 = 1 << r18;
    do {
      if ((r34 & r35 | 0) == 0) {
        HEAP32[1310776] = r34 | r35;
        r39 = r29;
        r40 = (r30 + 2 << 2) + 5243144 | 0;
      } else {
        r18 = (r30 + 2 << 2) + 5243144 | 0;
        r6 = HEAP32[r18 >> 2];
        if (r6 >>> 0 >= HEAP32[1310780] >>> 0) {
          r39 = r6;
          r40 = r18;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r40 >> 2] = r16;
    HEAP32[r39 + 12 >> 2] = r16;
    HEAP32[r17 + 2] = r39;
    HEAP32[r17 + 3] = r29;
    return;
  }
  r29 = r16;
  r39 = r38 >>> 8;
  do {
    if ((r39 | 0) == 0) {
      r41 = 0;
    } else {
      if (r38 >>> 0 > 16777215) {
        r41 = 31;
        break;
      }
      r40 = (r39 + 1048320 | 0) >>> 16 & 8;
      r30 = r39 << r40;
      r35 = (r30 + 520192 | 0) >>> 16 & 4;
      r34 = r30 << r35;
      r30 = (r34 + 245760 | 0) >>> 16 & 2;
      r18 = 14 - (r35 | r40 | r30) + (r34 << r30 >>> 15) | 0;
      r41 = r38 >>> ((r18 + 7 | 0) >>> 0) & 1 | r18 << 1;
    }
  } while (0);
  r39 = (r41 << 2) + 5243408 | 0;
  HEAP32[r17 + 7] = r41;
  HEAP32[r17 + 5] = 0;
  HEAP32[r17 + 4] = 0;
  r18 = HEAP32[1310777];
  r30 = 1 << r41;
  if ((r18 & r30 | 0) == 0) {
    HEAP32[1310777] = r18 | r30;
    HEAP32[r39 >> 2] = r29;
    HEAP32[r17 + 6] = r39;
    HEAP32[r17 + 3] = r16;
    HEAP32[r17 + 2] = r16;
    return;
  }
  if ((r41 | 0) == 31) {
    r42 = 0;
  } else {
    r42 = 25 - (r41 >>> 1) | 0;
  }
  r41 = r38 << r42;
  r42 = HEAP32[r39 >> 2];
  while (1) {
    if ((HEAP32[r42 + 4 >> 2] & -8 | 0) == (r38 | 0)) {
      break;
    }
    r43 = (r41 >>> 31 << 2) + r42 + 16 | 0;
    r39 = HEAP32[r43 >> 2];
    if ((r39 | 0) == 0) {
      r4 = 1055;
      break;
    } else {
      r41 = r41 << 1;
      r42 = r39;
    }
  }
  if (r4 == 1055) {
    if (r43 >>> 0 < HEAP32[1310780] >>> 0) {
      _abort();
    }
    HEAP32[r43 >> 2] = r29;
    HEAP32[r17 + 6] = r42;
    HEAP32[r17 + 3] = r16;
    HEAP32[r17 + 2] = r16;
    return;
  }
  r16 = r42 + 8 | 0;
  r43 = HEAP32[r16 >> 2];
  r4 = HEAP32[1310780];
  if (r42 >>> 0 < r4 >>> 0) {
    _abort();
  }
  if (r43 >>> 0 < r4 >>> 0) {
    _abort();
  }
  HEAP32[r43 + 12 >> 2] = r29;
  HEAP32[r16 >> 2] = r29;
  HEAP32[r17 + 2] = r43;
  HEAP32[r17 + 3] = r42;
  HEAP32[r17 + 6] = 0;
  return;
}
function __Znwj(r1) {
  var r2, r3, r4;
  r2 = 0;
  r3 = (r1 | 0) == 0 ? 1 : r1;
  while (1) {
    r4 = _malloc(r3);
    if ((r4 | 0) != 0) {
      r2 = 1099;
      break;
    }
    r1 = (tempValue = HEAP32[1310907], HEAP32[1310907] = tempValue, tempValue);
    if ((r1 | 0) == 0) {
      break;
    }
    FUNCTION_TABLE[r1]();
  }
  if (r2 == 1099) {
    return r4;
  }
  r4 = ___cxa_allocate_exception(4);
  HEAP32[r4 >> 2] = 5243584;
  ___cxa_throw(r4, 5243616, 4);
}
function __ZNKSt9bad_alloc4whatEv(r1) {
  return 5243044;
}
function __ZdlPv(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  _free(r1);
  return;
}
function __ZdaPv(r1) {
  __ZdlPv(r1);
  return;
}
function __ZNSt9bad_allocD0Ev(r1) {
  __ZdlPv(r1);
  return;
}
function __Znaj(r1) {
  return __Znwj(r1);
}





// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);


  var ret;

  ret = Module['_main'](argc, argv, 0);


  return ret;
}




function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

initRuntime();

var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

if (shouldRunNow) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}






  // {{MODULE_ADDITIONS}}




return ThinPlateSpline;
})();

/*var tps = new ThinPlateSpline();
tps.add_point([100,100], [200, 200]);
tps.add_point([200,200], [400, 400]);
tps.add_point([150,150], [320, 350]);
//tps.add_point(100,200,[205,412]);
tps.solve();
var ord = tps.transform([160,160]);
//console.log('honyo');
console.log(ord);
var rev = tps.transform(ord,true);
//console.log('honyo');
console.log(rev);

var serial = tps.serialize();

var fs = require('fs');

var buf = new Buffer(serial.length);
for (var i = 0; i < serial.length; ++i) {
  buf[i] = serial[i];
}
fs.writeFileSync('./serial.bin',buf);

var buf2 = fs.readFileSync('./serial.bin');
var abuf = new ArrayBuffer(buf2.length);
var serial2 = new Uint8Array(abuf);
for (var i = 0; i < buf2.length; ++i) {
  serial2[i] = buf2[i];
}

var tps2 = new ThinPlateSpline();

tps2.deserialize(serial2);

var ord2 = tps2.transform([160,160]);
//console.log('honyo');
console.log(ord2);
var rev2 = tps2.transform(ord2,true);
//console.log('honyo');
console.log(rev2);

/*var narat = new ThinPlateSpline();
var narap = require('./nara_points.json');
narat.push_points(narap);

narat.solve();

var naras = narat.serialize();

var narab = new Buffer(naras.length);
for (var i = 0; i < naras.length; ++i) {
  narab[i] = naras[i];
}
fs.writeFileSync('./nara_serial.bin',narab);*/


if (typeof importScripts === 'function') {
  /* Worker loader */
  var tps = new ThinPlateSpline();
  tps.isWorker = true;

  self.onmessage = function(event) {
    var payload = event.data;
    var method  = payload.method;
    var data    = payload.data;

    self.postMessage({'event':'echo','data':payload});

    switch (method){
      case 'push_points':
        tps.push_points(data);
        self.postMessage({'event':'solved'});
        break;
      case 'load_points':
        var xhr = new XMLHttpRequest();
        xhr.open('GET', data, true);

        xhr.onload = function(e) {
          if (this.status == 200) {
            var points = JSON.parse(this.response);
            tps.push_points(points);
            self.postMessage({'event':'solved'});
          } else {
            self.postMessage({'event':'cannotLoad'});
          }
        };
        xhr.send();
        break;
      case 'deserialize':
        //var serial = JSON.parse(data);
        tps.deserialize(data);
        self.postMessage({'event':'solved'});
        break;
      case 'load_serial':
        var xhr = new XMLHttpRequest();
        xhr.open('GET', data, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
          if (this.status == 200) {
            var serial = new Uint8Array(this.response);
            self.postMessage({'event':'serialized','serial':serial});
          } else {
            self.postMessage({'event':'cannotLoad'});
          }
        };
        xhr.send();
        break;
      case 'serialize':
        var serial = tps.serialize();
        self.postMessage({'event':'serialized','serial':serial});
        break;
      case 'transform':
        var coord = data.coord;
        var inv   = data.inv;
        var dst   = tps.transform(coord,inv);
        self.postMessage({'event':'transformed','inv':inv,'coord':dst});
        break;
      case 'echo':
        self.postMessage({'event':'echo'});
        break;
      case 'destruct':
        break;
    }
  };
}

