/*!
**  sprintf.js -- POSIX sprintf(3)-style String Formatting for JavaScript
**  Copyright (c) 2006-2014 Ralf S. Engelschall <rse@engelschall.com>
**  Partly based on Public Domain code by Jan Moesen <http://jan.moesen.nu/>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  Universal Module Definition (UMD)  */
(function (root, name, factory) {
    /* global define: false */
    /* global module: false */
    if (typeof define === "function" && typeof define.amd !== "undefined")
        /*  AMD environment  */
        define(name, function () { return factory(root); });
    else if (typeof module === "object" && typeof module.exports === "object")
        /*  CommonJS environment  */
        module.exports = factory(root);
    else
        /*  Browser environment  */
        root[name] = factory(root);
}(this, "sprintf", function (/* root */) {

    /*  the POSIX sprintf(3)-style function  */
    var sprintf = function () {
        /*  argument sanity checking  */
        if (!arguments || arguments.length < 1)
            throw new Error("sprintf: ERROR: not enough arguments");

        /*  initialize processing queue  */
        var argumentnum = 0;
        var done = "", todo = arguments[argumentnum++];

        /*  parse still to be done format string  */
        var m;
        while ((m = /^([^%]*)%(?:(\d+)\$|\((.*?)\))?([#0 +'-]+)?(\*|\d+)?(\.\*|\.\d+)?([%diouxXfFeEcs])((?:.|[\r\n])*)$/.exec(todo))) {
            var pProlog    = m[1],
                pAccessD   = m[2],
                pAccessN   = m[3],
                pFlags     = m[4],
                pMinLength = m[5],
                pPrecision = m[6],
                pType      = m[7],
                pEpilog    = m[8];

            /*  determine substitution  */
            var subst;
            if (pType === "%")
                /*  special case: escaped percent character  */
                subst = "%";
            else {
                /*  parse padding and justify aspects of flags  */
                var padWith = " ";
                var justifyRight = true;
                if (pFlags) {
                    if (pFlags.indexOf("0") >= 0)
                        padWith = "0";
                    if (pFlags.indexOf("-") >= 0) {
                        padWith = " ";
                        justifyRight = false;
                    }
                }
                else
                    pFlags = "";

                /*  determine minimum length  */
                var access;
                var minLength = -1;
                if (pMinLength) {
                    if (pMinLength === "*") {
                        access = argumentnum++;
                        if (access >= arguments.length)
                            throw new Error("sprintf: ERROR: not enough arguments");
                        minLength = arguments[access];
                    }
                    else
                        minLength = parseInt(pMinLength, 10);
                }

                /*  determine precision  */
                var precision = -1;
                if (pPrecision) {
                    if (pPrecision === ".*") {
                        access = argumentnum++;
                        if (access >= arguments.length)
                            throw new Error("sprintf: ERROR: not enough arguments");
                        precision = arguments[access];
                    }
                    else
                        precision = parseInt(pPrecision.substring(1), 10);
                }

                /*  determine how to fetch argument  */
                access = argumentnum++;
                if (pAccessD) {
                    access = parseInt(pAccessD, 10);
                    if (access >= arguments.length)
                        throw new Error("sprintf: ERROR: not enough arguments");
                    subst = arguments[access];
                }
                else if (pAccessN) {
                    if (typeof arguments[1] !== "object")
                        throw new Error("sprintf: ERROR: invalid non-object arguments for named argument");
                    subst = arguments[1][pAccessN];
                    if (typeof subst === "undefined")
                        throw new Error("sprintf: ERROR: invalid undefined value for named argument");
                }
                else {
                    if (access >= arguments.length)
                        throw new Error("sprintf: ERROR: not enough arguments");
                    subst = arguments[access];
                }

                /*  dispatch into expansions according to type  */
                var prefix = "";
                switch (pType) {
                    /*  decimal number  */
                    case "d":
                    case "i":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = subst.toString(10);
                        if (pFlags.indexOf("#") >= 0 && subst >= 0)
                            subst = "+" + subst;
                        if (pFlags.indexOf(" ") >= 0 && subst >= 0)
                            subst = " " + subst;
                        break;

                    /*  binary number  */
                    case "b":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = subst.toString(2);
                        break;

                    /*  octal number  */
                    case "o":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = subst.toString(8);
                        break;

                    /*  unsigned decimal number  */
                    case "u":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = Math.abs(subst);
                        subst = subst.toString(10);
                        break;

                    /*  (lower-case) hexadecimal number  */
                    case "x":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = subst.toString(16).toLowerCase();
                        if (pFlags.indexOf("#") >= 0)
                            prefix = "0x";
                        break;

                    /*  (upper-case) hexadecimal number  */
                    case "X":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = subst.toString(16).toUpperCase();
                        if (pFlags.indexOf("#") >= 0)
                            prefix = "0X";
                        break;

                    /*  (lower/upper-case) floating point number (fixed precision)  */
                    case "f":
                    case "F":
                        if (typeof subst !== "number")
                            subst = 0.0;
                        subst = 0.0 + subst;
                        if (precision > -1) {
                            if (subst.toFixed)
                                subst = subst.toFixed(precision);
                            else {
                                subst = (Math.round(subst * Math.pow(10, precision)) / Math.pow(10, precision));
                                subst += "0000000000";
                                subst = subst.substr(0, subst.indexOf(".") + precision + 1);
                            }
                        }
                        subst = "" + subst;
                        if (pFlags.indexOf("'") >= 0) {
                            var k = 0;
                            for (var i = (subst.length - 1) - 3; i >= 0; i -= 3) {
                                subst = subst.substring(0, i) + (k === 0 ? "." : ",") + subst.substring(i);
                                k = (k + 1) % 2;
                            }
                        }
                        break;

                    /*  (lower/upper-case) floating point number (exponential-based precision)  */
                    case "e":
                    case "E":
                        if (typeof subst !== "number")
                            subst = 0.0;
                        subst = 0.0 + subst;
                        if (precision > -1) {
                            if (subst.toExponential)
                                subst = subst.toExponential(precision);
                            else
                                throw new Error("sprintf: ERROR: toExponential() method not supported");
                        }
                        subst = "" + subst;
                        if (pType === "E")
                            subst = subst.replace(/e\+/, "E+");
                        break;

                    /*  single character  */
                    case "c":
                        if (typeof subst !== "number")
                            subst = 0;
                        subst = String.fromCharCode(subst);
                        break;

                    /*  string  */
                    case "s":
                        if (typeof subst !== "string")
                            subst = String(subst);
                        if (precision > -1)
                            subst = subst.substr(0, precision);
                        break;
                    default:
                        throw new Error("sprintf: ERROR: invalid conversion character \"" + pType + "\"");
                }

                /*  apply optional padding  */
                var padding = minLength - subst.toString().length - prefix.toString().length;
                if (padding > 0) {
                    var arrTmp = new Array(padding + 1);
                    if (justifyRight)
                        subst = arrTmp.join(padWith) + subst;
                    else
                        subst = subst + arrTmp.join(padWith);
                }

                /*  add optional prefix  */
                subst = prefix + subst;
            }

            /*  update the processing queue  */
            done = done + pProlog + subst;
            todo = pEpilog;
        }

        /*  return finally formatted string  */
        return (done + todo);
    };

    /*  brand with the version  */
    sprintf.version = { text: "1.2.3", major: 1, minor: 2, micro: 3 };

    /*  export API  */
    return sprintf;

}));

