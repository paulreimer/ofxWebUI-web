/* 
 * DataView.js:
 * An implementation of the DataView class on top of typed arrays.
 * Useful for Firefox 4 which implements TypedArrays but not DataView.
 *
 * Copyright 2011, David Flanagan
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 *
 *   Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 *
 *   Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT 
 * OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
// This broke stuff in other non-FF browsers
//"use strict";

(function(global) {
    // If DataView already exists, do nothing
    if (global.DataView) return;

    // If ArrayBuffer is not supported, fail with an error
    if (!global.ArrayBuffer) fail("ArrayBuffer not supported");

    // If ES5 is not supported, fail
    if (!Object.defineProperties) fail("This module requires ECMAScript 5");

    // Figure if the platform is natively little-endian.
    // If the integer 0x00000001 is arranged in memory as 01 00 00 00 then
    // we're on a little endian platform. On a big-endian platform we'd get
    // get bytes 00 00 00 01 instead.
    var nativele = new Int8Array(new Int32Array([1]).buffer)[0] === 1;

    // A temporary array for copying or reversing bytes into.
    // Since js is single-threaded, we only need this one static copy
    var temp = new Uint8Array(8);

    // The DataView() constructor
    global.DataView = function DataView(buffer, offset, length) {
        if (!(buffer instanceof ArrayBuffer)) fail("Bad ArrayBuffer");

        // Default values for omitted arguments
        offset = offset || 0;
        length = length || (buffer.byteLength - offset);

        if (offset < 0 || length < 0 || offset+length > buffer.byteLength)
            fail("Illegal offset and/or length");

        // Define the 3 read-only, non-enumerable ArrayBufferView properties
        Object.defineProperties(this, {
            buffer: {
                value: buffer,
                enumerable:false, writable: false, configurable: false
            },
            byteOffset: {
                value: offset,
                enumerable:false, writable: false, configurable: false
            },
            byteLength: {
                value: length,
                enumerable:false, writable: false, configurable: false
            },
            _bytes: {
                value: new Uint8Array(buffer, offset, length),
                enumerable:false, writable: false, configurable: false
            }
        });
    }

    // The DataView prototype object
    global.DataView.prototype = {
        constructor: DataView,
        
        getInt8: function getInt8(offset) {
            return get(this, Int8Array, 1, offset);
        },
        getUint8: function getUint8(offset) {
            return get(this, Uint8Array, 1, offset);
        },
        getInt16: function getInt16(offset, le) {
            return get(this, Int16Array, 2, offset, le);
        },
        getUint16: function getUint16(offset, le) {
            return get(this, Uint16Array, 2, offset, le);
        },
        getInt32: function getInt32(offset, le) {
            return get(this, Int32Array, 4, offset, le);
        },
        getUint32: function getUint32(offset, le) {
            return get(this, Uint32Array, 4, offset, le);
        },
        getFloat32: function getFloat32(offset, le) {
            return get(this, Float32Array, 4, offset, le);
        },
        getFloat64: function getFloat32(offset, le) {
            return get(this, Float64Array, 8, offset, le);
        },

        
        setInt8: function setInt8(offset, value) {
            set(this, Int8Array, 1, offset, value);
        },
        setUint8: function setUint8(offset, value) {
            set(this, Uint8Array, 1, offset, value);
        },
        setInt16: function setInt16(offset, value, le) {
            set(this, Int16Array, 2, offset, value, le);
        },
        setUint16: function setUint16(offset, value, le) {
            set(this, Uint16Array, 2, offset, value, le);
        },
        setInt32: function setInt32(offset, value, le) {
            set(this, Int32Array, 4, offset, value, le);
        },
        setUint32: function setUint32(offset, value, le) {
            set(this, Uint32Array, 4, offset, value, le);
        },
        setFloat32: function setFloat32(offset, value, le) {
            set(this, Float32Array, 4, offset, value, le);
        },
        setFloat64: function setFloat64(offset, value, le) {
            set(this, Float64Array, 8, offset, value, le);
        }
    };

    // The get() utility function used by the get methods
    function get(view, type, size, offset, le) {
        if (offset === undefined) fail("Missing required offset argument");

        if (offset < 0 || offset + size > view.byteLength)
            fail("Invalid index: " + offset);

        if (size === 1 || !!le === nativele) { 
            // This is the easy case: the desired endianness 
            // matches the native endianness.

            // Typed arrays require proper alignment.  DataView does not.
            if ((view.byteOffset + offset) % size === 0) 
                return (new type(view.buffer, view.byteOffset+offset, 1))[0];
            else {
                // Copy bytes into the temp array, to fix alignment
                for(var i = 0; i < size; i++) 
                    temp[i] = view._bytes[offset+i];
                // Now wrap that buffer with an array of the desired type
                return (new type(temp.buffer))[0];
            }
        }
        else {
            // If the native endianness doesn't match the desired, then
            // we have to reverse the bytes
            for(var i = 0; i < size; i++)
                temp[size-i-1] = view._bytes[offset+i];
            return (new type(temp.buffer))[0];
        }
    }

    // The set() utility function used by the set methods
    function set(view, type, size, offset, value, le) {
        if (offset === undefined) fail("Missing required offset argument");
        if (value === undefined) fail("Missing required value argument");

        if (offset < 0 || offset + size > view.byteLength)
            fail("Invalid index: " + offset);

        if (size === 1 || !!le === nativele) { 
            // This is the easy case: the desired endianness 
            // matches the native endianness.
            if ((view.byteOffset + offset) % size === 0) {
                (new type(view.buffer,view.byteOffset+offset, 1))[0] = value;
            }
            else {
                (new type(temp.buffer))[0] = value;
                // Now copy the bytes into the view's buffer
                for(var i = 0; i < size; i++)
                    view._bytes[i+offset] = temp[i];
            }
        }
        else {
            // If the native endianness doesn't match the desired, then
            // we have to reverse the bytes
            
            // Store the value into our temporary buffer
            (new type(temp.buffer))[0] = value;

            // Now copy the bytes, in reverse order, into the view's buffer
            for(var i = 0; i < size; i++)
                view._bytes[offset+i] = temp[size-1-i];
        }
    }

    function fail(msg) { throw new Error(msg); }
}(this));
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
// License: New BSD License
// Reference: http://dev.w3.org/html5/websockets/
// Reference: http://tools.ietf.org/html/rfc6455

(function() {
  
  if (window.WEB_SOCKET_FORCE_FLASH) {
    // Keeps going.
  } else if (window.WebSocket) {
    return;
  } else if (window.MozWebSocket) {
    // Firefox.
    window.WebSocket = MozWebSocket;
    return;
  }
  
  var logger;
  if (window.WEB_SOCKET_LOGGER) {
    logger = WEB_SOCKET_LOGGER;
  } else if (window.console && window.console.log && window.console.error) {
    // In some environment, console is defined but console.log or console.error is missing.
    logger = window.console;
  } else {
    logger = {log: function(){ }, error: function(){ }};
  }
  
  // swfobject.hasFlashPlayerVersion("10.0.0") doesn't work with Gnash.
  if (swfobject.getFlashPlayerVersion().major < 10) {
    logger.error("Flash Player >= 10.0.0 is required.");
    return;
  }
  if (location.protocol == "file:") {
    logger.error(
      "WARNING: web-socket-js doesn't work in file:///... URL " +
      "unless you set Flash Security Settings properly. " +
      "Open the page via Web server i.e. http://...");
  }

  /**
   * Our own implementation of WebSocket class using Flash.
   * @param {string} url
   * @param {array or string} protocols
   * @param {string} proxyHost
   * @param {int} proxyPort
   * @param {string} headers
   */
  window.WebSocket = function(url, protocols, proxyHost, proxyPort, headers) {
    var self = this;
    self.__id = WebSocket.__nextId++;
    WebSocket.__instances[self.__id] = self;
    self.readyState = WebSocket.CONNECTING;
    self.bufferedAmount = 0;
    self.__events = {};
    if (!protocols) {
      protocols = [];
    } else if (typeof protocols == "string") {
      protocols = [protocols];
    }
    // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
    // Otherwise, when onopen fires immediately, onopen is called before it is set.
    self.__createTask = setTimeout(function() {
      WebSocket.__addTask(function() {
        self.__createTask = null;
        WebSocket.__flash.create(
            self.__id, url, protocols, proxyHost || null, proxyPort || 0, headers || null);
      });
    }, 0);
  };

  /**
   * Send data to the web socket.
   * @param {string} data  The data to send to the socket.
   * @return {boolean}  True for success, false for failure.
   */
  WebSocket.prototype.send = function(data) {
    if (this.readyState == WebSocket.CONNECTING) {
      throw "INVALID_STATE_ERR: Web Socket connection has not been established";
    }
    // We use encodeURIComponent() here, because FABridge doesn't work if
    // the argument includes some characters. We don't use escape() here
    // because of this:
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
    // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
    // preserve all Unicode characters either e.g. "\uffff" in Firefox.
    // Note by wtritch: Hopefully this will not be necessary using ExternalInterface.  Will require
    // additional testing.
    var result = WebSocket.__flash.send(this.__id, encodeURIComponent(data));
    if (result < 0) { // success
      return true;
    } else {
      this.bufferedAmount += result;
      return false;
    }
  };

  /**
   * Close this web socket gracefully.
   */
  WebSocket.prototype.close = function() {
    if (this.__createTask) {
      clearTimeout(this.__createTask);
      this.__createTask = null;
      this.readyState = WebSocket.CLOSED;
      return;
    }
    if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) {
      return;
    }
    this.readyState = WebSocket.CLOSING;
    WebSocket.__flash.close(this.__id);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.addEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) {
      this.__events[type] = [];
    }
    this.__events[type].push(listener);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.removeEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) return;
    var events = this.__events[type];
    for (var i = events.length - 1; i >= 0; --i) {
      if (events[i] === listener) {
        events.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {Event} event
   * @return void
   */
  WebSocket.prototype.dispatchEvent = function(event) {
    var events = this.__events[event.type] || [];
    for (var i = 0; i < events.length; ++i) {
      events[i](event);
    }
    var handler = this["on" + event.type];
    if (handler) handler.apply(this, [event]);
  };

  /**
   * Handles an event from Flash.
   * @param {Object} flashEvent
   */
  WebSocket.prototype.__handleEvent = function(flashEvent) {
    
    if ("readyState" in flashEvent) {
      this.readyState = flashEvent.readyState;
    }
    if ("protocol" in flashEvent) {
      this.protocol = flashEvent.protocol;
    }
    
    var jsEvent;
    if (flashEvent.type == "open" || flashEvent.type == "error") {
      jsEvent = this.__createSimpleEvent(flashEvent.type);
    } else if (flashEvent.type == "close") {
      jsEvent = this.__createSimpleEvent("close");
      jsEvent.wasClean = flashEvent.wasClean ? true : false;
      jsEvent.code = flashEvent.code;
      jsEvent.reason = flashEvent.reason;
    } else if (flashEvent.type == "message") {
      var data = decodeURIComponent(flashEvent.message);
      jsEvent = this.__createMessageEvent("message", data);
    } else {
      throw "unknown event type: " + flashEvent.type;
    }
    
    this.dispatchEvent(jsEvent);
    
  };
  
  WebSocket.prototype.__createSimpleEvent = function(type) {
    if (document.createEvent && window.Event) {
      var event = document.createEvent("Event");
      event.initEvent(type, false, false);
      return event;
    } else {
      return {type: type, bubbles: false, cancelable: false};
    }
  };
  
  WebSocket.prototype.__createMessageEvent = function(type, data) {
    if (document.createEvent && window.MessageEvent && !window.opera) {
      var event = document.createEvent("MessageEvent");
      event.initMessageEvent("message", false, false, data, null, null, window, null);
      return event;
    } else {
      // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
      return {type: type, data: data, bubbles: false, cancelable: false};
    }
  };
  
  /**
   * Define the WebSocket readyState enumeration.
   */
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;

  // Field to check implementation of WebSocket.
  WebSocket.__isFlashImplementation = true;
  WebSocket.__initialized = false;
  WebSocket.__flash = null;
  WebSocket.__instances = {};
  WebSocket.__tasks = [];
  WebSocket.__nextId = 0;
  
  /**
   * Load a new flash security policy file.
   * @param {string} url
   */
  WebSocket.loadFlashPolicyFile = function(url){
    WebSocket.__addTask(function() {
      WebSocket.__flash.loadManualPolicyFile(url);
    });
  };

  /**
   * Loads WebSocketMain.swf and creates WebSocketMain object in Flash.
   */
  WebSocket.__initialize = function() {
    
    if (WebSocket.__initialized) return;
    WebSocket.__initialized = true;
    
    if (WebSocket.__swfLocation) {
      // For backword compatibility.
      window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
    }
    if (!window.WEB_SOCKET_SWF_LOCATION) {
      logger.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
      return;
    }
    if (!window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR &&
        !WEB_SOCKET_SWF_LOCATION.match(/(^|\/)WebSocketMainInsecure\.swf(\?.*)?$/) &&
        WEB_SOCKET_SWF_LOCATION.match(/^\w+:\/\/([^\/]+)/)) {
      var swfHost = RegExp.$1;
      if (location.host != swfHost) {
        logger.error(
            "[WebSocket] You must host HTML and WebSocketMain.swf in the same host " +
            "('" + location.host + "' != '" + swfHost + "'). " +
            "See also 'How to host HTML file and SWF file in different domains' section " +
            "in README.md. If you use WebSocketMainInsecure.swf, you can suppress this message " +
            "by WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;");
      }
    }
    var container = document.createElement("div");
    container.id = "webSocketContainer";
    // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
    // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
    // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
    // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
    // the best we can do as far as we know now.
    container.style.position = "absolute";
    if (WebSocket.__isFlashLite()) {
      container.style.left = "0px";
      container.style.top = "0px";
    } else {
      container.style.left = "-100px";
      container.style.top = "-100px";
    }
    var holder = document.createElement("div");
    holder.id = "webSocketFlash";
    container.appendChild(holder);
    document.body.appendChild(container);
    // See this article for hasPriority:
    // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
    swfobject.embedSWF(
      WEB_SOCKET_SWF_LOCATION,
      "webSocketFlash",
      "1" /* width */,
      "1" /* height */,
      "10.0.0" /* SWF version */,
      null,
      null,
      {hasPriority: true, swliveconnect : true, allowScriptAccess: "always"},
      null,
      function(e) {
        if (!e.success) {
          logger.error("[WebSocket] swfobject.embedSWF failed");
        }
      }
    );
    
  };
  
  /**
   * Called by Flash to notify JS that it's fully loaded and ready
   * for communication.
   */
  WebSocket.__onFlashInitialized = function() {
    // We need to set a timeout here to avoid round-trip calls
    // to flash during the initialization process.
    setTimeout(function() {
      WebSocket.__flash = document.getElementById("webSocketFlash");
      WebSocket.__flash.setCallerUrl(location.href);
      WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
      for (var i = 0; i < WebSocket.__tasks.length; ++i) {
        WebSocket.__tasks[i]();
      }
      WebSocket.__tasks = [];
    }, 0);
  };
  
  /**
   * Called by Flash to notify WebSockets events are fired.
   */
  WebSocket.__onFlashEvent = function() {
    setTimeout(function() {
      try {
        // Gets events using receiveEvents() instead of getting it from event object
        // of Flash event. This is to make sure to keep message order.
        // It seems sometimes Flash events don't arrive in the same order as they are sent.
        var events = WebSocket.__flash.receiveEvents();
        for (var i = 0; i < events.length; ++i) {
          WebSocket.__instances[events[i].webSocketId].__handleEvent(events[i]);
        }
      } catch (e) {
        logger.error(e);
      }
    }, 0);
    return true;
  };
  
  // Called by Flash.
  WebSocket.__log = function(message) {
    logger.log(decodeURIComponent(message));
  };
  
  // Called by Flash.
  WebSocket.__error = function(message) {
    logger.error(decodeURIComponent(message));
  };
  
  WebSocket.__addTask = function(task) {
    if (WebSocket.__flash) {
      task();
    } else {
      WebSocket.__tasks.push(task);
    }
  };
  
  /**
   * Test if the browser is running flash lite.
   * @return {boolean} True if flash lite is running, false otherwise.
   */
  WebSocket.__isFlashLite = function() {
    if (!window.navigator || !window.navigator.mimeTypes) {
      return false;
    }
    var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
    if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) {
      return false;
    }
    return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
  };
  
  if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
    // NOTE:
    //   This fires immediately if web_socket.js is dynamically loaded after
    //   the document is loaded.
    swfobject.addDomLoadEvent(function() {
      WebSocket.__initialize();
    });
  }
  
})();
// Farbtastic 2.0 alpha
(function ($) {
  
var __debug = false;

$.fn.farbtastic = function (options) {
  $.farbtastic(this, options);
  return this;
};

$.farbtastic = function (container, options) {
  var container = $(container)[0];
  return container.farbtastic || (container.farbtastic = new $._farbtastic(container, options));
}

$._farbtastic = function (container, options) {
  var fb = this;
  
  /////////////////////////////////////////////////////

  /**
   * Link to the given element(s) or callback.
   */
  fb.linkTo = function (callback) {
    // Unbind previous nodes
    if (typeof fb.callback == 'object') {
      $(fb.callback).unbind('keyup', fb.updateValue);
    }

    // Reset color
    fb.color = null;

    // Bind callback or elements
    if (typeof callback == 'function') {
      fb.callback = callback;
    }
    else if (typeof callback == 'object' || typeof callback == 'string') {
      fb.callback = $(callback);
      fb.callback.bind('keyup', fb.updateValue);
      if (fb.callback[0].value) {
        fb.setColor(fb.callback[0].value);
      }
    }
    return this;
  }
  fb.updateValue = function (event) {
    if (this.value && this.value != fb.color) {
      fb.setColor(this.value);
    }
  }

  /**
   * Change color with HTML syntax #123456
   */
  fb.setColor = function (color) {
    var unpack = fb.unpack(color);
    if (fb.color != color && unpack) {
      fb.color = color;
      fb.rgb = unpack;
      fb.hsl = fb.RGBToHSL(fb.rgb);
      fb.updateDisplay();
    }
    return this;
  }

  /**
   * Change color with HSL triplet [0..1, 0..1, 0..1]
   */
  fb.setHSL = function (hsl) {
    fb.hsl = hsl;
    fb.rgb = fb.HSLToRGB(hsl);
    fb.color = fb.pack(fb.rgb);
    fb.updateDisplay();
    return this;
  }

  /////////////////////////////////////////////////////

  /**
   * Initialize the color picker widget.
   */
  fb.initWidget = function () {

    // Insert markup and size accordingly.
    var dim = {
      width: options.width,
      height: options.width
    };
    $(container)
      .html(
        '<div class="farbtastic" style="position: relative">' +
          '<div class="farbtastic-solid"></div>' +
          '<canvas class="farbtastic-mask"></canvas>' +
          '<canvas class="farbtastic-overlay"></canvas>' +
        '</div>'
      )
      .find('*').attr(dim).css(dim).end()
      .find('div>*').css('position', 'absolute');

    // IE Fix: Recreate canvas elements with doc.createElement and excanvas.
    $.browser.msie && $('canvas', container).each(function () {
      // Fetch info.
      var attr = { 'class': $(this).attr('class'), style: this.getAttribute('style') },
          e = document.createElement('canvas');
      // Replace element.
      $(this).before($(e).attr(attr)).remove();
      // Init with explorerCanvas.
      G_vmlCanvasManager && G_vmlCanvasManager.initElement(e);
      // Set explorerCanvas elements dimensions and absolute positioning.
      $(e).attr(dim).css(dim).css('position', 'absolute')
        .find('*').attr(dim).css(dim);
    });

    // Determine layout
    fb.radius = (options.width - options.wheelWidth) / 2 - 1;
    fb.square = Math.floor((fb.radius - options.wheelWidth / 2) * 0.7) - 1;
    fb.mid = Math.floor(options.width / 2);
    fb.markerSize = options.wheelWidth * 0.3;
    fb.solidFill = $('.farbtastic-solid', container).css({
      width: fb.square * 2 - 1,
      height: fb.square * 2 - 1,
      left: fb.mid - fb.square,
      top: fb.mid - fb.square
    });

    // Set up drawing context.
    fb.cnvMask = $('.farbtastic-mask', container);
    fb.ctxMask = fb.cnvMask[0].getContext('2d');
    fb.cnvOverlay = $('.farbtastic-overlay', container);
    fb.ctxOverlay = fb.cnvOverlay[0].getContext('2d');
    fb.ctxMask.translate(fb.mid, fb.mid);
    fb.ctxOverlay.translate(fb.mid, fb.mid);
    
    // Draw widget base layers.
    fb.drawCircle();
    fb.drawMask();
  }

  /**
   * Draw the color wheel.
   */
  fb.drawCircle = function () {
    var tm = +(new Date());
    // Draw a hue circle with a bunch of gradient-stroked beziers.
    // Have to use beziers, as gradient-stroked arcs don't work.
    var n = 24,
        r = fb.radius,
        w = options.wheelWidth,
        nudge = 8 / r / n * Math.PI, // Fudge factor for seams.
        m = fb.ctxMask,
        angle1 = 0, color1, d1;
    m.save();
    m.lineWidth = w / r;
    m.scale(r, r);
    // Each segment goes from angle1 to angle2.
    for (var i = 0; i <= n; ++i) {
      var d2 = i / n,
          angle2 = d2 * Math.PI * 2,
          // Endpoints
          x1 = Math.sin(angle1), y1 = -Math.cos(angle1);
          x2 = Math.sin(angle2), y2 = -Math.cos(angle2),
          // Midpoint chosen so that the endpoints are tangent to the circle.
          am = (angle1 + angle2) / 2,
          tan = 1 / Math.cos((angle2 - angle1) / 2),
          xm = Math.sin(am) * tan, ym = -Math.cos(am) * tan,
          // New color
          color2 = fb.pack(fb.HSLToRGB([d2, 1, 0.5]));
      if (i > 0) {
        if ($.browser.msie) {
          // IE's gradient calculations mess up the colors. Correct along the diagonals.
          var corr = (1 + Math.min(Math.abs(Math.tan(angle1)), Math.abs(Math.tan(Math.PI / 2 - angle1)))) / n;
          color1 = fb.pack(fb.HSLToRGB([d1 - 0.15 * corr, 1, 0.5]));
          color2 = fb.pack(fb.HSLToRGB([d2 + 0.15 * corr, 1, 0.5]));
          // Create gradient fill between the endpoints.
          var grad = m.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, color1);
          grad.addColorStop(1, color2);
          m.fillStyle = grad;
          // Draw quadratic curve segment as a fill.
          var r1 = (r + w / 2) / r, r2 = (r - w / 2) / r; // inner/outer radius.
          m.beginPath();
          m.moveTo(x1 * r1, y1 * r1);
          m.quadraticCurveTo(xm * r1, ym * r1, x2 * r1, y2 * r1);
          m.lineTo(x2 * r2, y2 * r2);
          m.quadraticCurveTo(xm * r2, ym * r2, x1 * r2, y1 * r2);
          m.fill();
        }
        else {
          // Create gradient fill between the endpoints.
          var grad = m.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, color1);
          grad.addColorStop(1, color2);
          m.strokeStyle = grad;
          // Draw quadratic curve segment.
          m.beginPath();
          m.moveTo(x1, y1);
          m.quadraticCurveTo(xm, ym, x2, y2);
          m.stroke();
        }
      }
      // Prevent seams where curves join.
      angle1 = angle2 - nudge; color1 = color2; d1 = d2;
    }
    m.restore();
    //__debug && $('body').append('<div>drawCircle '+ (+(new Date()) - tm) +'ms');
  };
  
  /**
   * Draw the saturation/luminance mask.
   */
  fb.drawMask = function () {
    var tm = +(new Date());

    // Iterate over sat/lum space and calculate appropriate mask pixel values.
    var size = fb.square * 2, sq = fb.square;
    function calculateMask(sizex, sizey, outputPixel) {
      var isx = 1 / sizex, isy = 1 / sizey;
      for (var y = 0; y <= sizey; ++y) {
        var l = 1 - y * isy;
        for (var x = 0; x <= sizex; ++x) {
          var s = 1 - x * isx;
          // From sat/lum to alpha and color (grayscale)
          var a = 1 - 2 * Math.min(l * s, (1 - l) * s);
          var c = (a > 0) ? ((2 * l - 1 + a) * .5 / a) : 0;
          outputPixel(x, y, c, a);
        }
      }      
    }
 
    // Method #1: direct pixel access (new Canvas).
    if (fb.ctxMask.getImageData) {
      // Create half-resolution buffer.
      var sz = Math.floor(size / 2);
      var buffer = document.createElement('canvas');
      buffer.width = buffer.height = sz + 1;
      var ctx = buffer.getContext('2d');
      var frame = ctx.getImageData(0, 0, sz + 1, sz + 1);

      var i = 0;
      calculateMask(sz, sz, function (x, y, c, a) {
        frame.data[i++] = frame.data[i++] = frame.data[i++] = c * 255;
        frame.data[i++] = a * 255;
      });

      ctx.putImageData(frame, 0, 0);
      fb.ctxMask.drawImage(buffer, 0, 0, sz + 1, sz + 1, -sq, -sq, sq * 2, sq * 2);
    }
    // Method #2: drawing commands (old Canvas).
    else if (!$.browser.msie) {
      // Render directly at half-resolution
      var sz = Math.floor(size / 2);
      calculateMask(sz, sz, function (x, y, c, a) {
        c = Math.round(c * 255);
        fb.ctxMask.fillStyle = 'rgba(' + c + ', ' + c + ', ' + c + ', ' + a +')';
        fb.ctxMask.fillRect(x * 2 - sq - 1, y * 2 - sq - 1, 2, 2);
      });
    }
    // Method #3: vertical DXImageTransform gradient strips (IE).
    else {
      var cache_last, cache, w = 6; // Each strip is 6 pixels wide.
      var sizex = Math.floor(size / w);
      // 6 vertical pieces of gradient per strip.
      calculateMask(sizex, 6, function (x, y, c, a) {
        if (x == 0) {
          cache_last = cache;
          cache = [];
        }
        c = Math.round(c * 255);
        a = Math.round(a * 255);
        // We can only start outputting gradients once we have two rows of pixels.
        if (y > 0) {
          var c_last = cache_last[x][0],
              a_last = cache_last[x][1],
              color1 = fb.packDX(c_last, a_last),
              color2 = fb.packDX(c, a),
              y1 = Math.round(fb.mid + ((y - 1) * .333 - 1) * sq),
              y2 = Math.round(fb.mid + (y * .333 - 1) * sq);
          $('<div>').css({
            position: 'absolute',
            filter: "progid:DXImageTransform.Microsoft.Gradient(StartColorStr="+ color1 +", EndColorStr="+ color2 +", GradientType=0)",
            top: y1,
            height: y2 - y1,
            // Avoid right-edge sticking out.
            left: fb.mid + (x * w - sq - 1),
            width: w - (x == sizex ? Math.round(w / 2) : 0)
          }).appendTo(fb.cnvMask);
        }
        cache.push([c, a]);
      });
    }    
    //__debug && $('body').append('<div>drawMask '+ (+(new Date()) - tm) +'ms');
  }

  /**
   * Draw the selection markers.
   */
  fb.drawMarkers = function () {
    // Determine marker dimensions
    var sz = options.width, lw = Math.ceil(fb.markerSize / 4), r = fb.markerSize - lw + 1;
    var angle = fb.hsl[0] * 6.28,
        x1 =  Math.sin(angle) * fb.radius,
        y1 = -Math.cos(angle) * fb.radius,
        x2 = 2 * fb.square * (.5 - fb.hsl[1]),
        y2 = 2 * fb.square * (.5 - fb.hsl[2]),
        c1 = fb.invert ? '#fff' : '#000',
        c2 = fb.invert ? '#000' : '#fff';
    var circles = [
      { x: x1, y: y1, r: r,             c: '#000', lw: lw + 1 },
      { x: x1, y: y1, r: fb.markerSize, c: '#fff', lw: lw },
      { x: x2, y: y2, r: r,             c: c2,     lw: lw + 1 },
      { x: x2, y: y2, r: fb.markerSize, c: c1,     lw: lw }
    ];

    // Update the overlay canvas.
    fb.ctxOverlay.clearRect(-fb.mid, -fb.mid, sz, sz);
    for (i in circles) {
      var c = circles[i];
      fb.ctxOverlay.lineWidth = c.lw;
      fb.ctxOverlay.strokeStyle = c.c;
      fb.ctxOverlay.beginPath();
      fb.ctxOverlay.arc(c.x, c.y, c.r, 0, Math.PI * 2, true);
      fb.ctxOverlay.stroke();
    }
  }

  /**
   * Update the markers and styles
   */
  fb.updateDisplay = function () {
    // Determine whether labels/markers should invert.
    fb.invert = (fb.rgb[0] * 0.3 + fb.rgb[1] * .59 + fb.rgb[2] * .11) <= 0.6;

    // Update the solid background fill.
    fb.solidFill.css('backgroundColor', fb.pack(fb.HSLToRGB([fb.hsl[0], 1, 0.5])));

    // Draw markers
    fb.drawMarkers();
    
    // Linked elements or callback
    if (typeof fb.callback == 'object') {
      // Set background/foreground color
      $(fb.callback).css({
        backgroundColor: fb.color,
        color: fb.invert ? '#fff' : '#000'
      });

      // Change linked value
      $(fb.callback).each(function() {
        if ((typeof this.value == 'string') && this.value != fb.color) {
          this.value = fb.color;
          $(this).trigger('change');
        }
      });
    }
    else if (typeof fb.callback == 'function') {
      fb.callback.call(fb, fb.color);
    }
  }
  
  /**
   * Helper for returning coordinates relative to the center.
   */
  fb.widgetCoords = function (event) {
    return {
      x: event.pageX - fb.offset.left - fb.mid,    
      y: event.pageY - fb.offset.top - fb.mid
    };    
  }

  /**
   * Mousedown handler
   */
  fb.mousedown = function (event) {
    // Capture mouse
    if (!$._farbtastic.dragging) {
      $(document).bind('mousemove', fb.mousemove).bind('mouseup', fb.mouseup);
      $._farbtastic.dragging = true;
    }

    // Update the stored offset for the widget.
    fb.offset = $(container).offset();

    // Check which area is being dragged
    var pos = fb.widgetCoords(event);
    fb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) > (fb.square + 2);

    // Process
    fb.mousemove(event);
    return false;
  }

  /**
   * Mousemove handler
   */
  fb.mousemove = function (event) {
    // Get coordinates relative to color picker center
    var pos = fb.widgetCoords(event);

    // Set new HSL parameters
    if (fb.circleDrag) {
      var hue = Math.atan2(pos.x, -pos.y) / 6.28;
      fb.setHSL([(hue + 1) % 1, fb.hsl[1], fb.hsl[2]]);
    }
    else {
      var sat = Math.max(0, Math.min(1, -(pos.x / fb.square / 2) + .5));
      var lum = Math.max(0, Math.min(1, -(pos.y / fb.square / 2) + .5));
      fb.setHSL([fb.hsl[0], sat, lum]);
    }
    return false;
  }

  /**
   * Mouseup handler
   */
  fb.mouseup = function () {
    // Uncapture mouse
    $(document).unbind('mousemove', fb.mousemove);
    $(document).unbind('mouseup', fb.mouseup);
    $._farbtastic.dragging = false;
  }

  /* Various color utility functions */
  fb.dec2hex = function (x) {
    return (x < 16 ? '0' : '') + x.toString(16);
  }

  fb.packDX = function (c, a) {
    return '#' + fb.dec2hex(a) + fb.dec2hex(c) + fb.dec2hex(c) + fb.dec2hex(c);
  };
  
  fb.pack = function (rgb) {
    var r = Math.round(rgb[0] * 255);
    var g = Math.round(rgb[1] * 255);
    var b = Math.round(rgb[2] * 255);
    return '#' + fb.dec2hex(r) + fb.dec2hex(g) + fb.dec2hex(b);
  };

  fb.unpack = function (color) {
    if (color.length == 7) {
      function x(i) {
        return parseInt(color.substring(i, i + 2), 16) / 255;
      }
      return [ x(1), x(3), x(5) ];
    }
    else if (color.length == 4) {
      function x(i) {
        return parseInt(color.substring(i, i + 1), 16) / 15;
      }
      return [ x(1), x(2), x(3) ];
    }
  };

  fb.HSLToRGB = function (hsl) {
    var m1, m2, r, g, b;
    var h = hsl[0], s = hsl[1], l = hsl[2];
    m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
    m1 = l * 2 - m2;
    return [
      this.hueToRGB(m1, m2, h + 0.33333),
      this.hueToRGB(m1, m2, h),
      this.hueToRGB(m1, m2, h - 0.33333)
    ];
  };

  fb.hueToRGB = function (m1, m2, h) {
    h = (h + 1) % 1;
    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1) return m2;
    if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  };

  fb.RGBToHSL = function (rgb) {
    var r = rgb[0], g = rgb[1], b = rgb[2],
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h = 0,
        s = 0,
        l = (min + max) / 2;
    if (l > 0 && l < 1) {
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
    }
    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [h, s, l];
  };

  //ADDED: Touch support
  $.extend($.support, {
    touch: typeof Touch == "object"
  });
  
  /**
   * Simulate mouse events for touch devices
   */
  fb.touchHandle = function (event) {
    var touches = event.originalEvent.changedTouches,
        firstTouch = touches[0],
        type = "";
        
    switch(event.type) {
        case 'touchstart': type = 'mousedown'; break;
        case 'touchmove':  type='mousemove'; break;        
        case 'touchend':   type='mouseup'; break;
        default: return;
    }

    //initMouseEvent(type, canBubble, cancelable, view, clickCount, 
    //           screenX, screenY, clientX, clientY, ctrlKey, 
    //           altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                              firstTouch.screenX, firstTouch.screenY, 
                              firstTouch.clientX, firstTouch.clientY, false, 
                              false, false, false, 0/*left*/, null);

    firstTouch.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }
  //ADDED: end Touch support

  // Parse options.
  if (!options.callback) {
    options = { callback: options };
  }
  options = $.extend({
    width: 300,
    wheelWidth: (options.width || 300) / 10,
    callback: null
  }, options);

  // Initialize.
  fb.initWidget();

  // Install mousedown handler (the others are set on the document on-demand)
  $('canvas.farbtastic-overlay', container).mousedown(fb.mousedown);

  // Install touch handlers to simulate appropriate mouse events
  if ($.support.touch) $('canvas.farbtastic-overlay', container).bind('touchstart touchmove touchend touchcancel', fb.touchHandle);

  // Set linked elements/callback
  if (options.callback) {
    fb.linkTo(options.callback);
  }
  // Set to gray.
  fb.setColor('#808080');
}

})(jQuery);
/*  ProtoJS - Protocol buffers for Javascript.
 *  protobuf.js
 *
 *  Copyright (c) 2009-2010, Patrick Reiter Horn
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of ProtoJS nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

var PROTO = {};

PROTO.IsArray = (function() {
  if (typeof(Uint8Array) != "undefined") {
    return function(arr) {
      return arr instanceof Array || arr instanceof Uint8Array;
    };
  } else {
    return function(arr) {
      return arr instanceof Array;
    };
  }
})();

PROTO.DefineProperty = (function () {
        var DefineProperty;
        if (typeof(Object.defineProperty) != "undefined") {
            /**
             * @suppress {missingProperties}
             */
            DefineProperty = function(prototype, property, getter, setter) {
                Object.defineProperty(prototype, property, {
                    'get': getter, 'set': setter,
                    'enumerable': true, 'configurable': false});
            };
        } else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) {
            DefineProperty = function(prototype, property, getter, setter) {
                if (typeof getter !== 'undefined') {
                    prototype.__defineGetter__(property, getter);
                }
                if (typeof setter !== 'undefined') {
                    prototype.__defineSetter__(property, setter);
                }
            };
        }
        // IE8's Object.defineProperty method might be broken.
        // Make sure DefineProperty works before returning it.
        if (DefineProperty) {
            try {
                /**
                 * @constructor
                 */
                var TestClass = function(){};
                DefineProperty(TestClass.prototype, "x",
                               function(){return this.xval*2;},
                               function(newx){this.xval=newx;});
                var testinst = new TestClass;
                testinst.x = 5;
                if (testinst.x != 10) {
                    PROTO.warn("DefineProperty test gave the wrong result "+testinst.x);
                    DefineProperty = undefined;
                }
            } catch (e) {
                PROTO.warn("DefineProperty should be supported, but threw "+e);
                DefineProperty = undefined;
            }
        }
        return DefineProperty;
})();

/** Clones a PROTO type object. Does not work on arbitrary javascript objects.
For example, can be used to copy the "bytes" class and make a custom toString method.
*/
PROTO.cloneType = function(f) {
    var ret = {};
    for (var x in f) {
        ret[x] = f[x];
    }
    return ret;
}

PROTO.wiretypes = {
    varint: 0,
    fixed64: 1,
    lengthdelim: 2,
    fixed32: 5
};

PROTO.optional = 'optional';
PROTO.repeated = 'repeated';
PROTO.required = 'required';
/**
 * @param {string} s
 */
PROTO.warn = function (s) {
    if (typeof(self.console)!="undefined" && self.console.log) {
        self.console.log(s);            
    }
};

/**
 * @constructor
 */
PROTO.I64 = function (msw, lsw, sign) {
    /**
     * @type {number}
     */
    this.msw = msw;
    /**
     * @type {number}
     */
    this.lsw = lsw;
    if (typeof lsw === undefined) {
        PROTO.warn("Too few arguments passed to I64 constructor: perhaps you meant PROTO.I64.fromNumber()");
        throw ("Too few arguments passed to I64 constructor: perhaps you meant PROTO.I64.fromNumber()");
    }
    if (sign === true) sign = -1;
    if (!sign) sign = 1;
    this.sign = sign;
};

PROTO.I64.prototype = {
    toNumber: function() {
        return (this.msw*4294967296 + this.lsw)*this.sign;
    },
    toString: function() {
        //return this.toNumber();
        function zeros(len){
            var retval="";
            for (var i=0;i<len;++i) {
                retval+="0";
            }
            return retval;
        }
        var firstHalf=this.msw.toString(16);
        var secondHalf=this.lsw.toString(16);
        var sign = (this.sign==-1 ? "-" : "");
        return sign+"0x"+zeros(8-firstHalf.length)+firstHalf+zeros(8-secondHalf.length)+secondHalf;
    },
    equals: function(other) {
        return this.sign==other.sign&&this.msw==other.msw&&this.lsw==other.lsw;
    },
    hash: function() {
        return (this.sign*this.msw)+"_"+this.lsw;
    },
    convertToUnsigned: function() {
        var local_lsw;
        local_lsw=this.lsw;
        var local_msw;
        if (this.sign<0) {
            local_msw=2147483647-this.msw;
            local_msw+=2147483647;
            local_msw+=1;
            local_lsw=2147483647-this.lsw;
            local_lsw+=2147483647;
            local_lsw+=2;
            if (local_lsw==4294967296) {
                local_lsw=0;
                local_msw+=1;
            }
        }else {
            local_msw=this.msw;
        }
        return new PROTO.I64(local_msw,local_lsw,1);
    },
    convertFromUnsigned:function() {
        if(this.msw>=2147483648) {
            var local_msw = 4294967295-this.msw;
            var local_lsw = 4294967295-this.lsw+1;
            if (local_lsw>4294967295) {
                local_lsw-=4294967296;
                local_msw+=1;
            }
            return new PROTO.I64(local_msw,local_lsw,-1);
        }
        return new PROTO.I64(this.msw,this.lsw,this.sign);
    },
    convertToZigzag: function() {
        var local_lsw;
        if (this.sign<0) {
            local_lsw=this.lsw*2-1;
        }else {
            local_lsw=this.lsw*2;
        }
        var local_msw=this.msw*2;
        if (local_lsw>4294967295){
            local_msw+=1;
            local_lsw-=4294967296;
        }
        if (local_lsw<0){
            local_msw-=1;
            local_lsw+=4294967296;
        }
        return new PROTO.I64(local_msw,local_lsw,1);
    },
    convertFromZigzag:function() {
        var retval;
        if(this.msw&1) {//carry the bit from the most significant to the least by adding 2^31 to lsw
            retval = new PROTO.I64((this.msw>>>1),
                                 2147483648+(this.lsw>>>1),
                                 (this.lsw&1)?-1:1);
        } else {
            retval = new PROTO.I64((this.msw>>>1),
                                   (this.lsw>>>1),
                                   (this.lsw&1)?-1:1);
        }
        if (retval.sign==-1) {
            retval.lsw+=1;
            if (retval.lsw>4294967295) {
                retval.msw+=1;
                retval.lsw-=4294967296;                
            }
        }
        return retval;
    },
    serializeToLEBase256: function() {
        var arr = new Array(8);
        var temp=this.lsw;
        for (var i = 0; i < 4; i++) {
            arr[i] = (temp&255);
            temp=(temp>>8);
        }
        temp = this.msw;
        for (var i = 4; i < 8; i++) {
            arr[i] = (temp&255);
            temp=(temp>>8);
        }
        return arr;
    },
    serializeToLEVar128: function() {
        var arr = new Array(1);
        var temp=this.lsw;
        for (var i = 0; i < 4; i++) {
            arr[i] = (temp&127);
            temp=(temp>>>7);
            if(temp==0&&this.msw==0) return arr;
            arr[i]+=128;
        }        
        arr[4] = (temp&15) | ((this.msw&7)<<4);
        temp=(this.msw>>>3);
        if (temp==0) return arr;
        arr[4]+=128;
        for (var i = 5; i<10; i++) {
            arr[i] = (temp&127);
            temp=(temp>>>7);
            if(temp==0) return arr;
            
            arr[i]+=128;
        }
        return arr;
    },
    unsigned_add:function(other) {
        var temp=this.lsw+other.lsw;
        var local_msw=this.msw+other.msw;
        var local_lsw=temp%4294967296;
        temp-=local_lsw;
        local_msw+=Math.floor(temp/4294967296);
        return new PROTO.I64(local_msw,local_lsw,this.sign);
    },
    sub : function(other) {
        if (other.sign!=this.sign) {
            return this.unsigned_add(other);
        }
        if (other.msw>this.msw || (other.msw==this.msw&&other.lsw>this.lsw)) {
            var retval=other.sub(this);
            retval.sign=-this.sign;
            return retval;
        }
        var local_lsw=this.lsw-other.lsw;
        var local_msw=this.msw-other.msw;       
        if (local_lsw<0) {
            local_lsw+=4294967296;
            local_msw-=1;
        }
        return new PROTO.I64(local_msw,local_lsw,this.sign);        
    },
    /**
     * @param {PROTO.I64} other
     */
    less:function(other){
        if (other.sign!=this.sign) {
            return this.sign<0;
        }
        /**
         * @type {PROTO.I64}
         */
        var a=this;
        /**
         * @type {PROTO.I64}
         */
        var b=other;
        if (this.sign<0) {
            b=this;a=other;
        }
        if (a.msw==b.msw)
            return a.lsw<b.lsw;
        if (a.msw<b.msw)
            return true;
        return false;
    },
    unsigned_less:function(other){
        var a=this,b=other;
        if (a.msw==b.msw)
            return a.lsw<b.lsw;
        if (a.msw<b.msw)
            return true;
        return false;
    },
    add : function(other) {
        if (other.sign<0 && this.sign>=0)
            return this.sub(new PROTO.I64(other.msw,other.lsw,-other.sign));
        if (other.sign>=0 && this.sign<0)
            return other.sub(new PROTO.I64(this.msw,this.lsw,-this.sign));
        return this.unsigned_add(other);
    }
};

PROTO.I64.fromNumber = function(mynum) {
    var sign = (mynum < 0) ? -1 : 1;
    mynum *= sign;
    var lsw = (mynum%4294967296);
    var msw = Math.floor((mynum-lsw)/4294967296);
    return new PROTO.I64(msw, lsw, sign);
};

PROTO.I64.from32pair = function(msw, lsw, sign) {
    return new PROTO.I64(msw, lsw, sign);
};
/**
 * @param {PROTO.Stream} stream
 * @param {PROTO.I64=} float64toassignto
 */
PROTO.I64.parseLEVar128 = function (stream, float64toassignto) {
    var retval = float64toassignto||new PROTO.I64(0,0,1);
    var n = 0;
    var endloop = false;
    var offset=1;
    for (var i = 0; !endloop && i < 5; i++) {
        var byt = stream.readByte();
        if (byt >= 128) {
            byt -= 128;
        } else {
            endloop = true;
        }
        n += offset*byt;
        offset *= 128;
    }
    var lsw=n%4294967296;
    var msw = Math.floor((n - lsw) / 4294967296);   
    offset=8;
    for (var i = 0; !endloop && i < 5; i++) {
        var byt = stream.readByte();
        if (byt >= 128) {
            byt -= 128;
        } else {
            endloop = true;
        }
        msw += offset*byt;
        offset *= 128;
    }
    retval.msw=msw%4294967296;
    retval.lsw=lsw;
    retval.sign=1;
    return retval;
};
/**
 * @param {PROTO.Stream} stream
 * @param {PROTO.I64=} float64toassignto
 */
PROTO.I64.parseLEBase256 = function (stream, float64toassignto) {
    var retval = float64toassignto||new PROTO.I64(0,0,1);
    var n = 0;
    var endloop = false;
    var offset=1;
    for (var i = 0; i < 4; i++) {
        var byt = stream.readByte();
        n += offset*byt;
        offset *= 256;
    }
    var lsw=n;
    var msw=0;
    offset=1;
    for (var i = 0; i < 4; i++) {
        var byt = stream.readByte();
        msw += offset*byt;
        offset *= 256;
    }
    retval.msw=msw;
    retval.lsw=lsw;
    retval.sign=1;
    return retval;
};

PROTO.I64.ONE = new PROTO.I64.fromNumber(1);
PROTO.I64.ZERO = new PROTO.I64.fromNumber(0);

/**
 * + Jonas Raoni Soares Silva
 * http://jsfromhell.com/classes/binary-parser [rev. #1]
 * @constructor
 */ 
PROTO.BinaryParser = function(bigEndian, allowExceptions){
    this.bigEndian = bigEndian, this.allowExceptions = allowExceptions;
};
    PROTO.BinaryParser.prototype.encodeFloat = function(number, precisionBits, exponentBits){
        var n;
        var bias = Math.pow(2, exponentBits - 1) - 1, minExp = -bias + 1, maxExp = bias, minUnnormExp = minExp - precisionBits,
        status = isNaN(n = parseFloat(number)) || n == -Infinity || n == +Infinity ? n : 0,
        exp = 0, len = 2 * bias + 1 + precisionBits + 3, bin = new Array(len),
        signal = (n = status !== 0 ? 0 : n) < 0;
        n = Math.abs(n);
        var intPart = Math.floor(n), floatPart = n - intPart, i, lastBit, rounded, j, result, r;
        for(i = len; i; bin[--i] = 0){}
        for(i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2)){}
        for(i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart){}
        for(i = -1; ++i < len && !bin[i];){}
        if(bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]){
            if(!(rounded = bin[lastBit]))
                for(j = lastBit + 2; !rounded && j < len; rounded = bin[j++]){}
            for(j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0)){}
        }
        for(i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];){}

        (exp = bias + 1 - i) >= minExp && exp <= maxExp ? ++i : exp < minExp &&
            (exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow"), i = bias + 1 - (exp = minExp - 1));
        (intPart || status !== 0) && (this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status),
            exp = maxExp + 1, i = bias + 2, status == -Infinity ? signal = 1 : isNaN(status) && (bin[i] = 1));
        for(n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1){}
        for(n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = [];
            i; n += (1 << j) * result.charAt(--i), j == 7 && (r[r.length] = n, n = 0), j = (j + 1) % 8){}
        
        return (this.bigEndian ? r.reverse() : r);
    };
    PROTO.BinaryParser.prototype.encodeInt = function(number, bits, signed){
        var max = Math.pow(2, bits), r = [];
        (number >= max || number < -(max >> 1)) && this.warn("encodeInt::overflow") && (number = 0);
        number < 0 && (number += max);
        for(; number; r[r.length] = number % 256, number = Math.floor(number / 256)){}
        for(bits = -(-bits >> 3) - r.length; bits--;){}
        return (this.bigEndian ? r.reverse() : r);
    };
(function () {
    var buffer8byte = new ArrayBuffer(8);
    var buffer4byte = new ArrayBuffer(4);
    var f64buffer = new DataView(buffer8byte,0,8);
    var f32buffer = new DataView(buffer4byte,0,4);
    var u8buffer64 = new Uint8Array(buffer8byte);
    var u8buffer32 = new Uint8Array(buffer4byte);
    PROTO.BinaryParser.prototype.encodeFloat32 = function(data) {
        f32buffer.setFloat32(0,data,true);
        return u8buffer32;
    }
    PROTO.BinaryParser.prototype.encodeFloat64 = function(data) {
        f64buffer.setFloat64(0,data,true);
        return u8buffer64;
    }
    PROTO.BinaryParser.prototype.decodeFloat32 = function(data) {
        var len=data.length;
        if (len>4) len=4;
        for (var i=0;i<len;++i) {
            u8buffer32[i]=data[i];
        }
        return f32buffer.getFloat32(0,true);
    }
    PROTO.BinaryParser.prototype.decodeFloat64 = function(data) {
        var len=data.length;
        if (len>8) len=8;
        for (var i=0;i<len;++i) {
            u8buffer64[i]=data[i];
        }
        return f64buffer.getFloat64(0,true);
    }
})();
    PROTO.BinaryParser.prototype.decodeFloat = function(data, precisionBits, exponentBits){
        var b = new this.Buffer(this.bigEndian, data);
        PROTO.BinaryParser.prototype.checkBuffer.call(b, precisionBits + exponentBits + 1);
        var bias = Math.pow(2, exponentBits - 1) - 1, signal = PROTO.BinaryParser.prototype.readBits.call(b,precisionBits + exponentBits, 1);
        var exponent = PROTO.BinaryParser.prototype.readBits.call(b,precisionBits, exponentBits), significand = 0;
        var divisor = 2;
        var curByte = b.buffer.length + (-precisionBits >> 3) - 1;
        var byteValue, startBit, mask;
        do
            for(byteValue = b.buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit;
                mask >>= 1; (byteValue & mask) && (significand += 1 / divisor), divisor *= 2){}
        while((precisionBits -= startBit));
        return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
            : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
            : Math.pow(2, exponent - bias) * (1 + significand) : 0);
    };
    PROTO.BinaryParser.prototype.decodeInt = function(data, bits, signed){
        var b = new this.Buffer(this.bigEndian, data), x = b.readBits(0, bits), max = Math.pow(2, bits);
        return signed && x >= max / 2 ? x - max : x;
    };
    PROTO.BinaryParser.prototype.Buffer = function(bigEndian, buffer){
        this.bigEndian = bigEndian || 0;
        this.buffer = [];
        PROTO.BinaryParser.prototype.setBuffer.call(this,buffer);
    };

        PROTO.BinaryParser.prototype.readBits = function(start, length){
            //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
            function shl(a, b){
                for(++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1){}
                return a;
            }
            if(start < 0 || length <= 0)
                return 0;
            PROTO.BinaryParser.prototype.checkBuffer.call(this, start + length);
            for(var offsetLeft, offsetRight = start % 8, curByte = this.buffer.length - (start >> 3) - 1,
                lastByte = this.buffer.length + (-(start + length) >> 3), diff = curByte - lastByte,
                sum = ((this.buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1))
                + (diff && (offsetLeft = (start + length) % 8) ? (this.buffer[ lastByte++ ] & ((1 << offsetLeft) - 1))
                << (diff-- << 3) - offsetRight : 0); diff; sum += shl(this.buffer[ lastByte++ ], (diff-- << 3) - offsetRight)
                ){}
            return sum;
        };
        PROTO.BinaryParser.prototype.setBuffer = function(data){
            if(data){
                for(var l, i = l = data.length, b = this.buffer = new Array(l); i; b[l - i] = data[--i]){}
                this.bigEndian && b.reverse();
            }
        };
        PROTO.BinaryParser.prototype.hasNeededBits = function(neededBits){
            return this.buffer.length >= -(-neededBits >> 3);
        };
        PROTO.BinaryParser.prototype.checkBuffer = function(neededBits){
            if(!PROTO.BinaryParser.prototype.hasNeededBits.call(this,neededBits))
                throw new Error("checkBuffer::missing bytes");
        };
    
    PROTO.BinaryParser.prototype.warn = function(msg){
        if(this.allowExceptions)
            throw new Error(msg);
        return 1;
    };

    PROTO.BinaryParser.prototype.toSmall = function(data){return this.decodeInt(data, 8, true);};
    PROTO.BinaryParser.prototype.fromSmall = function(number){return this.encodeInt(number, 8, true);};
    PROTO.BinaryParser.prototype.toByte = function(data){return this.decodeInt(data, 8, false);};
    PROTO.BinaryParser.prototype.fromByte = function(number){return this.encodeInt(number, 8, false);};
    PROTO.BinaryParser.prototype.toShort = function(data){return this.decodeInt(data, 16, true);};
    PROTO.BinaryParser.prototype.fromShort = function(number){return this.encodeInt(number, 16, true);};
    PROTO.BinaryParser.prototype.toWord = function(data){return this.decodeInt(data, 16, false);};
    PROTO.BinaryParser.prototype.fromWord = function(number){return this.encodeInt(number, 16, false);};
    PROTO.BinaryParser.prototype.toInt = function(data){return this.decodeInt(data, 32, true);};
    PROTO.BinaryParser.prototype.fromInt = function(number){return this.encodeInt(number, 32, true);};
    PROTO.BinaryParser.prototype.toDWord = function(data){return this.decodeInt(data, 32, false);};
    PROTO.BinaryParser.prototype.fromDWord = function(number){return this.encodeInt(number, 32, false);};
    PROTO.BinaryParser.prototype.toFloat = typeof(Float32Array) != "undefined"?PROTO.BinaryParser.prototype.decodeFloat32:function(data){return this.decodeFloat(data, 23, 8);};
    PROTO.BinaryParser.prototype.fromFloat = typeof(Float32Array) != "undefined"?PROTO.BinaryParser.prototype.encodeFloat32:function(number){return this.encodeFloat(number, 23, 8);};
    PROTO.BinaryParser.prototype.toDouble = typeof(Float64Array) != "undefined"?PROTO.BinaryParser.prototype.decodeFloat64:function(data){return this.decodeFloat(data, 52, 11);};
    PROTO.BinaryParser.prototype.fromDouble = typeof(Float64Array) != "undefined"?PROTO.BinaryParser.prototype.encodeFloat64:function(number){return this.encodeFloat(number, 52, 11);};

PROTO.binaryParser = new PROTO.BinaryParser(false,false);


PROTO.encodeUTF8 = function(str) {
    var strlen = str.length;
    var u8 = [];
    var c, nextc;
    var x, y, z;
    for (var i = 0; i < strlen; i++) {
        c = str.charCodeAt(i);
        if ((c & 0xff80) == 0) {
            // ASCII
            u8.push(c);
        } else {
            if ((c & 0xfc00) == 0xD800) {
                nextc = str.charCodeAt(i+1);
                if ((nextc & 0xfc00) == 0xDC00) {
                    // UTF-16 Surrogate pair
                    c = (((c & 0x03ff)<<10) | (nextc & 0x3ff)) + 0x10000;
                    i++;
                } else {
                    // error.
                    PROTO.warn("Error decoding surrogate pair: "+c+"; "+nextc);
                }
            }
            x = c&0xff;
            y = c&0xff00;
            z = c&0xff0000;
            // Encode UCS code into UTF-8
            if (c <= 0x0007ff) {
                u8.push(0xc0 | (y>>6) | (x>>6));
                u8.push(0x80 | (x&63));
            } else if (c <= 0x00ffff) {
                u8.push(0xe0 | (y>>12));
                u8.push(0x80 | ((y>>6)&63) | (x>>6));
                u8.push(0x80 | (x&63));
            } else if (c <= 0x10ffff) {
                u8.push(0xf0 | (z>>18));
                u8.push(0x80 | ((z>>12)&63) | (y>>12));
                u8.push(0x80 | ((y>>6)&63) | (x>>6));
                u8.push(0x80 | (x&63));
            } else {
                // error.
                PROTO.warn("Error encoding to utf8: "+c+" is greater than U+10ffff");
                u8.push("?".charCodeAt(0));
            }
        }
    }
    return u8;
}

PROTO.decodeUTF8 = function(u8) {
    var u8len = u8.length;
    var str = "";
    var c, b2, b3, b4;
    for (var i = 0; i < u8len; i++) {
        c = u8[i];
        if ((c&0x80) == 0x00) {
        } else if ((c&0xf8) == 0xf0) {
            // 4 bytes: U+10000 - U+10FFFF
            b2 = u8[i+1];
            b3 = u8[i+2];
            b4 = u8[i+3];
            if ((b2&0xc0) == 0x80 && (b3&0xc0) == 0x80 && (b4&0xc0) == 0x80) {
                c = (c&7)<<18 | (b2&63)<<12 | (b3&63)<<6 | (b4&63);
                i+=3;
            } else {
                // error.
                PROTO.warn("Error decoding from utf8: "+c+","+b2+","+b3+","+b4);
                continue;
            }
        } else if ((c&0xf0)==0xe0) {
            // 3 bytes: U+0800 - U+FFFF
            b2 = u8[i+1];
            b3 = u8[i+2];
            if ((b2&0xc0) == 0x80 && (b3&0xc0) == 0x80) {
                c = (c&15)<<12 | (b2&63)<<6 | (b3&63);
                i+=2;
            } else {
                // error.
                PROTO.warn("Error decoding from utf8: "+c+","+b2+","+b3);
                continue;
            }
        } else if ((c&0xe0)==0xc0) {
            // 2 bytes: U+0080 - U+07FF
            b2 = u8[i+1];
            if ((b2&0xc0) == 0x80) {
                c = (c&31)<<6 | (b2&63);
                i+=1;
            } else {
                // error.
                PROTO.warn("Error decoding from utf8: "+c+","+b2);
                continue;
            }
        } else {
            // error.
            // 80-BF: Second, third, or fourth byte of a multi-byte sequence
            // F5-FF: Start of 4, 5, or 6 byte sequence
            PROTO.warn("Error decoding from utf8: "+c+" encountered not in multi-byte sequence");
            continue;
        }
        if (c <= 0xffff) {
            str += String.fromCharCode(c);
        } else if (c > 0xffff && c <= 0x10ffff) {
            // Must be encoded into UTF-16 surrogate pair.
            c -= 0x10000;
            str += (String.fromCharCode(0xD800 | (c>>10)) + String.fromCharCode(0xDC00 | (c&1023)));
        } else {
            PROTO.warn("Error encoding surrogate pair: "+c+" is greater than U+10ffff");
        }
    }
    return str;
}


/**
 * @constructor
 */
PROTO.Stream = function () {
    this.write_pos_ = 0;
    this.read_pos_ = 0;
};
PROTO.Stream.prototype = {
    read: function(amt) {
        var result = [];
        for (var i = 0; i < amt; ++i) {
            var byt = this.readByte();
            if (byt === null) {
                break;
            }
            result.push(byt);
        }
        return result;
    },
    write: function(array) {
        for (var i = 0; i < array.length; i++) {
            this.writeByte(array[i]);
        }
    },
    readByte: function() {
        return null;
    },
    writeByte: function(byt) {
        this.write_pos_ += 1;
    },
    readPosition: function() {
        return this.read_pos_;
    },
    setReadPosition: function(pos) {
        this.read_pos_=pos;
    },
    writePosition: function() {
        return this.write_pos_;
    },
    valid: function() {
        return false;
    }
};
/**
 * @constructor
 * @extends {PROTO.Stream}
 * @param {Array=} arr  Existing byte array to read from, or append to.
 */
PROTO.ByteArrayStream = function(arr) {
    this.array_ = arr || new Array();
    this.read_pos_ = 0;
    this.write_pos_ = this.array_.length;
};
PROTO.ByteArrayStream.prototype = new PROTO.Stream();
PROTO.ByteArrayStream.prototype.read = function(amt) {
    if (this.read_pos_+amt > this.array_.length) {
        // incomplete stream.
        //throw new Error("Read past end of protobuf ByteArrayStream: "+
        //                this.array_.length+" < "+this.read_pos_+amt);
        return null;
    }
    var ret = this.array_.slice(this.read_pos_, this.read_pos_+amt);
    this.read_pos_ += amt;
    return ret;
};
PROTO.ByteArrayStream.prototype.write = function(arr) {
    Array.prototype.push.apply(this.array_, arr);
    this.write_pos_ = this.array_.length;
};
PROTO.ByteArrayStream.prototype.readByte = function() {
    return this.array_[this.read_pos_ ++];
};
PROTO.ByteArrayStream.prototype.writeByte = function(byt) {
    this.array_.push(byt);
    this.write_pos_ = this.array_.length;
};
PROTO.ByteArrayStream.prototype.valid = function() {
    return this.read_pos_ < this.array_.length;
};
PROTO.ByteArrayStream.prototype.getArray = function() {
    return this.array_;
};
/**
 * @constructor
 */
PROTO.Uint8ArrayStream = function(arr) {
    this.array_ = arr || new Uint8Array(4096);
    this.read_pos_ = 0;
    this.write_pos_ = 0;
}
PROTO.Uint8ArrayStream.prototype._realloc = function(new_size) {
    this.array_ = new Uint8Array(Math.max(new_size, this.array_.length)
				 + this.array_.length);
}
PROTO.Uint8ArrayStream.prototype.read = function(amt) {
    if (this.read_pos_+amt > this.array_.length) {
        return null;
    }
    var ret = this.array_.subarray(this.read_pos_, this.read_pos_+amt);
    this.read_pos_ += amt;
    return ret;
};
PROTO.Uint8ArrayStream.prototype.write = function(arr) {
    if (this.write_pos_ + arr.length > this.array_.length) {
	this._realloc(this.write_pos_ + arr.length);
    }
    this.array_.set(arr, this.write_pos_);
    this.write_pos_ += arr.length;
};
PROTO.Uint8ArrayStream.prototype.readByte = function() {
    return this.array_[this.read_pos_ ++];
};
PROTO.Uint8ArrayStream.prototype.writeByte = function(byt) {
    if (this.write_pos_ >= this.array_.length) {
	this._realloc(this.write_pos_ + 1);
    }
    this.array_[this.write_pos_++] = byt;
};
PROTO.Uint8ArrayStream.prototype.valid = function() {
    return this.read_pos_ < this.array_.length;
};
PROTO.Uint8ArrayStream.prototype.getArray = function() {
    return this.array_.subarray(0, this.write_pos_);
};

PROTO.CreateArrayStream = function(arr) {
  if (arr instanceof Array) {
    return new PROTO.ByteArrayStream(arr);
  } else {
    return new PROTO.Uint8ArrayStream(arr);
  }
};

(function(){
    var FromB64AlphaMinus43=[
        62,-1,62,-1,63,52,53,54,55,56,57,58,59,60,61,
        -1,-1,-1,-1,-1,-1,-1,
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
        17,18,19,20,21,22,23,24,25,
        -1,-1,-1,-1,63,-1,
        26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
        41,42,43,44,45,46,47,48,49,50,51];
    var ToB64Alpha=[
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
        'a','b','c','d','e','f','g','h','i','j','k','l','m',
        'n','o','p','q','r','s','t','u','v','w','x','y','z',
        '0','1','2','3','4','5','6','7','8','9','+','/'];
    var ToB64Alpha_URLSafe=[
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
        'a','b','c','d','e','f','g','h','i','j','k','l','m',
        'n','o','p','q','r','s','t','u','v','w','x','y','z',
        '0','1','2','3','4','5','6','7','8','9','-','_'];
     /**
      * @constructor
      * @extends {PROTO.Stream}
      * @param {string=} b64string  String to read from, or append to.
      */
    PROTO.Base64Stream = function(b64string) {
        this.alphabet = ToB64Alpha;
        this.string_ = b64string || '';
        this.read_pos_ = 0;
        this.read_incomplete_value_ = 0;
        this.read_needed_bits_ = 8;
        this.write_extra_bits_ = 0;
        this.write_incomplete_value_ = 0;
        this.fixString();
    };
    PROTO.Base64Stream.prototype = new PROTO.Stream();
    PROTO.Base64Stream.prototype.setURLSafe = function() {
        this.alphabet = ToB64Alpha_URLSafe;
    };
    PROTO.Base64Stream.prototype.fixString = function() {
        var len = this.string_.length;
        if (this.string_[len-1]=='=') {
            var n = 4;
            var cutoff = 2;
            if (this.string_[len-cutoff]=='=') {
                n = 2;
                cutoff = 3;
            }
            this.write_extra_bits_ = n;
            this.write_incomplete_value_ = FromB64AlphaMinus43[
                this.string_.charCodeAt(len-cutoff)-43];
            this.write_incomplete_value_ >>= (6-n);
            this.string_ = this.string_.substring(0,len-cutoff);
        }
    };
    PROTO.Base64Stream.prototype.readByte = function() {
        var next6bits;
        var n = this.read_needed_bits_;
        while (next6bits === undefined || next6bits == -1) {
            if (this.read_pos_ >= this.string_.length) {
                if (this.valid()) {
                    next6bits = this.write_incomplete_value_ << (6-n);
                    this.read_pos_++;
                    break;
                } else {
                    return null;
                }
            }
            next6bits = FromB64AlphaMinus43[
                this.string_.charCodeAt(this.read_pos_++)-43];
        }
        if (n == 8) {
            this.read_incomplete_value_ = next6bits;
            this.read_needed_bits_ = 2;
            return this.readByte();
        }
        var ret = this.read_incomplete_value_<<n;
        ret |= next6bits>>(6-n);
        this.read_incomplete_value_ = next6bits&((1<<(6-n))-1);
        this.read_needed_bits_ += 2;
        return ret;
    };

    PROTO.Base64Stream.prototype.writeByte = function(byt) {
        this.write_extra_bits_ += 2;
        var n = this.write_extra_bits_;
        this.string_ += this.alphabet[
                byt>>n | this.write_incomplete_value_<<(8-n)];
        this.write_incomplete_value_ = (byt&((1<<n)-1));
        if (n == 6) {
            this.string_ += this.alphabet[this.write_incomplete_value_];
            this.write_extra_bits_ = 0;
            this.write_incomplete_value_ = 0;
        }
        if (this.string_.length%77==76) {
            this.string_ += "\n";
        }
    };

    PROTO.Base64Stream.prototype.getString = function() {
        var len = this.string_.length;
        var retstr = this.string_;
        var n = this.write_extra_bits_;
        if (n > 0) {
            retstr += this.alphabet[this.write_incomplete_value_<<(6-n)];
            if (n==2) {
                retstr += "==";
            } else if (n==4) {
                retstr += "=";
            }
        }
        return retstr;
    };
    PROTO.Base64Stream.prototype.valid = function() {
        return (this.read_pos_ < this.string_.length) ||
               (this.read_pos_==this.string_.length && this.write_extra_bits_);
    };
})();

if (typeof(ArrayBuffer) !== "undefined" && typeof(Uint8Array) !== "undefined") {
    /**
     * @constructor
     * @extends {PROTO.Stream}
     * @param {Array|ArrayBuffer|TypedArray} arr
     * @param {number=} length
     */
    PROTO.ArrayBufferStream = function(arr, length) {
	this.array_buffer_ = arr || new ArrayBuffer(1024);
	this.length_ = length || 0;
	this.array_ = new Uint8Array(this.array_buffer_);
	this.read_pos = 0;
    };
    PROTO.ArrayBufferStream.prototype = new PROTO.Stream();
    PROTO.ArrayBufferStream.prototype._realloc = function(min_length) {
	var old_array = this.array_;
	var length = this.length_;
	var new_buf_length = old_array.length + min_length;
	this.array_buffer_ = new ArrayBuffer(new_buf_length);
	var new_array = new Uint8Array(this.array_buffer_);
	for (var i = 0; i < length; i++) {
	    new_array[i] = old_array[i];
	}
	this.array_ = new_array;
    };
    PROTO.ArrayBufferStream.prototype.read = function(amt) {
	if (this.read_pos_+amt > this.length_) {
	    // incomplete stream.
	    //throw new Error("Read past end of protobuf ArrayBufferStream: "+
	    //                this.array_.length+" < "+this.read_pos_+amt);
	    return null;
	}
	var ret = this.array_.subarray(this.read_pos_, this.read_pos_+amt);
	this.read_pos_ += amt;
	// FIXME
	var ret_as_array = new Array(amt);
	for (var i = 0; i < amt; i++) {
	    ret_as_array[i] = ret[i];
	}
	return ret_as_array;
    };
    PROTO.ArrayBufferStream.prototype.write = function(arr) {
	var si = 0;
	var di = this.length_;
	if (this.length_ + arr.length > this.array_.length) {
	    this._realloc(this.length_ + arr.length);
	}
	this.length_ += arr.length;
	var dest = this.array_;
	var len = arr.length;
	for (;si < len; si++,di++) {
	    dest[di] = arr[si];
	}
    };
    PROTO.ArrayBufferStream.prototype.readByte = function() {
	return this.array_[this.read_pos_ ++];
    };
    PROTO.ArrayBufferStream.prototype.writeByte = function(byt) {
	if (this.length_ == this.array_.length) {
	    this._realloc(this.length_ + 1);
	}
	this.array_[this.length_ ++] = byt;
    };
    PROTO.ArrayBufferStream.prototype.valid = function() {
	return this.read_pos_ < this.length_;
    };
    PROTO.ArrayBufferStream.prototype.getArrayBuffer = function() {
	return this.array_buffer_;
    };
    PROTO.ArrayBufferStream.prototype.length = function() {
	return this.length_;
    };
    (function() {
	var useBlobCons = false;
	var BlobBuilder = null;
	var slice = "slice";
	var testBlob;
	try {
	    testBlob = new self.Blob([new ArrayBuffer(1)]);
	    useBlobCons = true;
	} catch (e) {
        /**
         * @suppress {missingProperties} self
         */
	    BlobBuilder = self.BlobBuilder || 
            self["WebKitBlobBuilder"] || self["MozBlobBuilder"] || self["MSBlobBuilder"];
        try {
	        testBlob = new BlobBuilder().getBlob();
        }catch (f) {
            //in a worker in FF or blobs not supported
        }
	}
	if (testBlob && (useBlobCons || BlobBuilder)) {
	    if (testBlob.webkitSlice) {
		slice = "webkitSlice";
	    }
	    if (testBlob.mozSlice) {
		slice = "mozSlice";
	    }
	    PROTO.ArrayBufferStream.prototype.getBlob = function() {
		var fullBlob;
		if (useBlobCons) {
		    fullBlob = new self.Blob([this.array_buffer_]);
		} else {
		    var blobBuilder = new BlobBuilder();
		    blobBuilder.append(this.array_buffer_);
		    fullBlob = blobBuilder.getBlob();
		}
		return fullBlob[slice](0, this.length_);
	    };
	}
    }());
    PROTO.ArrayBufferStream.prototype.getUint8Array = function() {
	return new Uint8Array(this.array_buffer_, 0, this.length_);
    };
}

PROTO.array =
    (function() {
        /** @constructor */
        function ProtoArray(datatype, input) {
            this.datatype_ = datatype.type();
            this.length = 0;
            if (PROTO.IsArray(input)) {
                for (var i=0;i<input.length;++i) {
                    this.push(input[i]);
                }
            }
        };
        ProtoArray.IsInitialized = function IsInitialized(val) {
            return val.length > 0;
        };
        ProtoArray.prototype = {};
        ProtoArray.prototype.push = function (var_args) {
            if (arguments.length === 0) {
                if (this.datatype_.composite) {
                    var newval = new this.datatype_;
                    this[this.length++] = newval;
                    return newval;
                } else {
                    throw "Called add(undefined) for a non-composite";
                }
            } else {
                for (var i = 0; i < arguments.length; i++) {
                    var newval = this.datatype_.Convert(arguments[i]);
                    if (this.datatype_.FromProto) {
                        newval = this.datatype_.FromProto(newval);
                    }
                    this[this.length++] = newval;
                }
            }
            return arguments[0];
        }
        ProtoArray.prototype.set = function (index, newval) {
            newval = this.datatype_.Convert(newval);
            if (this.datatype_.FromProto) {
                newval = this.datatype_.FromProto(newval);
            }
            if (index < this.length && index >= 0) {
                this[index] = newval;
            } else if (index == this.length) {
                this[this.length++] = newval;
            } else {
                throw "Called ProtoArray.set with index "+index+" higher than length "+this.length;
            }
            return newval;
        }
        ProtoArray.prototype.clear = function (index, newval) {
            this.length = 0;
        }
        return ProtoArray;
    })();

PROTO.string = {
    Convert: function(str) {
        return ''+str;
    },
    wiretype: PROTO.wiretypes.lengthdelim,
    SerializeToStream: function(str, stream) {
        var arr = PROTO.encodeUTF8(str);
        return PROTO.bytes.SerializeToStream(arr, stream);
    },
    ParseFromStream: function(stream) {
        var arr = PROTO.bytes.ParseFromStream(stream);
        return PROTO.decodeUTF8(arr);
    },
    toString: function(str) {return str;}
};

PROTO.bytes = {
    Convert: function(arr) {
        if (PROTO.IsArray(arr)) {
            return arr;
        } else if (arr instanceof PROTO.ByteArrayStream) {
            return arr.getArray();
        } else if (arr.SerializeToStream) {
            /* This is useful for messages (e.g. RPC calls) that embed
             * other messages inside them using the bytes type.
             */
            // FIXME: should we always allow this? Can this cause mistakes?
            var tempStream = new PROTO.ByteArrayStream;
            arr.SerializeToStream(tempStream);
            return tempStream.getArray();
        } else {
            throw "Not a Byte Array: "+arr;
        }
    },
    wiretype: PROTO.wiretypes.lengthdelim,
    SerializeToStream: function(arr, stream) {
        PROTO.int32.SerializeToStream(arr.length, stream);
        stream.write(arr);
    },
    ParseFromStream: function(stream) {
        var len = PROTO.int32.ParseFromStream(stream);
        return stream.read(len);
    },
    toString: function(bytes) {return '['+bytes+']';}
};

(function() {
    function makeclass(converter, serializer, parser) {
        var myclass = {
            Convert: converter,
            wiretype: 0,
            SerializeToStream: serializer,
            ParseFromStream: parser,
            toString: function(val) {return "" + val}
        };
        return myclass;
    };
    function convertU32(n) { //unsigned
        if (n == NaN) {
            throw "not a number: "+n;
        }
        n = Math.round(n);
        if (n < 0) {
            throw "uint32/fixed32 does not allow negative: "+n;
        }
        if (n > 4294967295) {
            throw "uint32/fixed32 out of bounds: "+n;
        }
        return n;
    };
    function convertS32(n) { // signed
        if (n == NaN) {
            throw "not a number: "+n;
        }
        n = Math.round(n);
        if (n > 2147483647 || n < -2147483648) {
            throw "sfixed32/[s]int32 out of bounds: "+n;
        }
        return n;
    };
    function serializeFixed32(n, stream) {
        if (n<0) n += 4294967296;
        var arr = new Array(4);
        for (var i = 0; i < 4; i++) {
            arr[i] = n%256;
            n >>>= 8;
        }
        stream.write(arr);
    };
    function parseSFixed32(stream) {
        var n = 0;
        var offset=1;
        for (var i = 0; i < 4; i++) {
            n += offset*stream.readByte();
            offset *= 256;
        }
        return n;
    };
    function parseFixed32(stream) {
        var n = parseSFixed32(stream);
        if (n > 2147483647) {
            n -= 4294967296;
        }
        return n;
    };
    function serializeInt32(n, stream) {
        if (n < 0) {
            serializeInt64(PROTO.I64.fromNumber(n),stream);
            return;
        }
        // Loop once regardless of whether n is 0.
        for (var i = 0; i==0 || (n && i < 5); i++) {
            var byt = n%128;
            n >>>= 7;
            if (n) {
                byt += 128;
            }
            stream.writeByte(byt);
        }
    };
    function serializeSInt32(n, stream) {
        if (n < 0) {
            n = -n*2-1;
        } else {
            n = n*2;
        }
        serializeInt32(n, stream);
    };
    function parseUInt32(stream) {
        var n = 0;
        var endloop = false;
        var offset=1;
        for (var i = 0; !endloop && i < 5; i++) {
            var byt = stream.readByte();
            if (byt === undefined) {
                PROTO.warn("read undefined byte from stream: n is "+n);
                break;
            }
            if (byt < 128) {
                endloop = true;
            }
            n += offset*(byt&(i==4?15:127));
            offset *= 128;
        }
        return n;
    };
    var temp64num = new PROTO.I64(0,0,1);
    function parseInt32(stream) {
        var n = PROTO.I64.parseLEVar128(stream,temp64num);
        var lsw=n.lsw;
        if (lsw > 2147483647) {
            lsw -= 2147483647;
            lsw -= 2147483647;
            lsw -= 2;
        }
        return lsw;
    };
    function parseSInt32(stream) {
        var n = parseUInt32(stream);
        if (n & 1) {
            return (n+1) / -2;
        }
        return n / 2;
    }
    PROTO.sfixed32 = makeclass(convertS32, serializeFixed32, parseSFixed32);
    PROTO.fixed32 = makeclass(convertU32, serializeFixed32, parseFixed32);
    PROTO.sfixed32.wiretype = PROTO.wiretypes.fixed32;
    PROTO.fixed32.wiretype = PROTO.wiretypes.fixed32;
    PROTO.int32 = makeclass(convertS32, serializeInt32, parseInt32);
    PROTO.sint32 = makeclass(convertS32, serializeSInt32, parseSInt32);
    PROTO.uint32 = makeclass(convertU32, serializeInt32, parseUInt32);

    function convert64(n) {
        if (n instanceof PROTO.I64) {
            return n;
        }
        throw "64-bit integers must be PROTO.I64 objects!";
    };
    function serializeInt64(n, stream) {
        stream.write(n.convertToUnsigned().serializeToLEVar128());
    }
    function serializeSInt64(n, stream) {
        stream.write(n.convertFromUnsigned().convertToZigzag().serializeToLEVar128());
    }
    function serializeUInt64(n, stream) {
        stream.write(n.convertToUnsigned().serializeToLEVar128());
    }
    function serializeSFixed64(n, stream) {
        stream.write(n.convertToUnsigned().serializeToLEBase256());
    }
    function serializeFixed64(n, stream) {
        stream.write(n.serializeToLEBase256());
    }
    function parseSFixed64(stream) {
        return PROTO.I64.parseLEBase256(stream,temp64num).convertFromUnsigned();
    }
    function parseFixed64(stream) {
        return PROTO.I64.parseLEBase256(stream);
    }
    function parseSInt64(stream) {
        return PROTO.I64.parseLEVar128(stream,temp64num).convertFromZigzag();
    }
    function parseInt64(stream) {
        return PROTO.I64.parseLEVar128(stream,temp64num).convertFromUnsigned();
    }
    function parseUInt64(stream) {
        return PROTO.I64.parseLEVar128(stream);
    }
    PROTO.sfixed64 = makeclass(convert64, serializeSFixed64, parseSFixed64);
    PROTO.fixed64 = makeclass(convert64, serializeFixed64, parseFixed64);
    PROTO.sfixed64.wiretype = PROTO.wiretypes.fixed64;
    PROTO.fixed64.wiretype = PROTO.wiretypes.fixed64;
    PROTO.int64 = makeclass(convert64, serializeInt64, parseInt64);
    PROTO.sint64 = makeclass(convert64, serializeSInt64, parseSInt64);
    PROTO.uint64 = makeclass(convert64, serializeUInt64, parseUInt64);

    PROTO.bool = makeclass(function(bool) {return bool?true:false;},
                           serializeInt32,
                           parseUInt32);

    function convertFloatingPoint(f) {
        var n = parseFloat(f);
        if (n == NaN) {
            throw "not a number: "+f;
        }
        return n;
    };
    function writeFloat(flt, stream) {
        stream.write(PROTO.binaryParser.fromFloat(flt));
    };
    function readFloat(stream) {
        var arr = stream.read(4);
        return PROTO.binaryParser.toFloat(arr);
    };
    function writeDouble(flt, stream) {
        stream.write(PROTO.binaryParser.fromDouble(flt));
    };
    function readDouble(stream) {
        var arr = stream.read(8);
        return PROTO.binaryParser.toDouble(arr);
    };
    PROTO.Float = makeclass(convertFloatingPoint, writeFloat, readFloat);
    PROTO.Double = makeclass(convertFloatingPoint, writeDouble, readDouble);
    PROTO.Float.wiretype = PROTO.wiretypes.fixed32;
    PROTO.Double.wiretype = PROTO.wiretypes.fixed64;
})();


PROTO.mergeProperties = function(properties, stream, values) {
    var fidToProp = {};
    for (var key in properties) {
        fidToProp[properties[key].id] = key;
    }
    var nextfid, nexttype, nextprop, nextproptype, nextval, nextpropname;
    var incompleteTuples = {};
    while (stream.valid()) {
        nextfid = PROTO.int32.ParseFromStream(stream);
//        PROTO.warn(""+stream.read_pos_+" ; "+stream.array_.length);
        nexttype = nextfid % 8;
        nextfid >>>= 3;
        nextpropname = fidToProp[nextfid];
        nextprop = nextpropname && properties[nextpropname];
        nextproptype = nextprop && nextprop.type();
        nextval = undefined;
        switch (nexttype) {
        case PROTO.wiretypes.varint:
//        PROTO.warn("read varint field is "+nextfid);
            if (nextprop && nextproptype.wiretype == PROTO.wiretypes.varint) {
                nextval = nextproptype.ParseFromStream(stream);
            } else {
                PROTO.int64.ParseFromStream(stream);
            }
            break;
        case PROTO.wiretypes.fixed64:
//        PROTO.warn("read fixed64 field is "+nextfid);
            if (nextprop && nextproptype.wiretype == PROTO.wiretypes.fixed64) {
                nextval = nextproptype.ParseFromStream(stream);
            } else {
                PROTO.fixed64.ParseFromStream(stream);
            }
            break;
        case PROTO.wiretypes.lengthdelim:
//        PROTO.warn("read lengthdelim field is "+nextfid);
            if (nextprop) {
                if (nextproptype.wiretype != PROTO.wiretypes.lengthdelim)
                {
                    var tup;
                    if (nextproptype.cardinality>1) {
                        if (incompleteTuples[nextpropname]===undefined) {
                            incompleteTuples[nextpropname]=new Array();
                        }
                        tup = incompleteTuples[nextpropname];
                    }
                    var bytearr = PROTO.bytes.ParseFromStream(stream);
                    var bas = PROTO.CreateArrayStream(bytearr);
                    for (var j = 0; j < bytearr.length && bas.valid(); j++) {
                        var toappend = nextproptype.ParseFromStream(bas);

                        if (nextproptype.cardinality>1) {
                            tup.push(toappend);
                            if (tup.length==nextproptype.cardinality) {
                                if (nextprop.multiplicity == PROTO.repeated) {
                                    values[nextpropname].push(tup);
                                } else {
                                    values[nextpropname] =
                                        nextproptype.Convert(tup);
                                }
                                incompleteTuples[nextpropname]=new Array();
                                tup = incompleteTuples[nextpropname];
                            }
                        }else {
                            values[nextpropname].push(toappend);
                        }
                    }
                } else {
                    nextval = nextproptype.ParseFromStream(stream);
                    if (nextval == null) {
                        return false;
                    }
                }
            } else {
                PROTO.bytes.ParseFromStream(stream);
            }
            break;
        case PROTO.wiretypes.fixed32:
//        PROTO.warn("read fixed32 field is "+nextfid);
            if (nextprop && nextproptype.wiretype == PROTO.wiretypes.fixed32) {
                nextval = nextproptype.ParseFromStream(stream);
            } else {
                PROTO.fixed32.ParseFromStream(stream);
            }
            break;
        default:
            PROTO.warn("ERROR: Unknown type "+nexttype+" for "+nextfid);
            break;
        }
        if (nextval !== undefined) {
            if (values[nextpropname] === undefined && nextproptype.cardinality>1) {
                values[nextpropname] = {};
            }
            if (nextproptype.cardinality>1) {
                var tup;
                if (incompleteTuples[nextpropname]===undefined) {
                    incompleteTuples[nextpropname]=new Array();
                    tup = incompleteTuples[nextpropname];
                }
                tup.push(nextval);
                if (tup.length==nextproptype.cardinality) {
                    if (nextprop.multiplicity == PROTO.repeated) {
                        values[nextpropname].push(tup);
                    } else {
                        tup = nextproptype.Convert(tup);
                        if (!PROTO.DefineProperty && nextproptype.FromProto) {
                            tup = nextproptype.FromProto(tup);
                        }
                        values[nextpropname] = tup;
                    }
                    incompleteTuples[nextpropname] = undefined;
                }
            } else if (nextprop.multiplicity === PROTO.repeated) {
                values[nextpropname].push(nextval);
            } else {
                nextval = nextproptype.Convert(nextval);
                if (!PROTO.DefineProperty && nextproptype.FromProto) {
                    nextval = nextproptype.FromProto(nextval);
                }
                values[nextpropname] = nextval;
            }
        }
    }
    return true;
};

/*
    var str = '{';
    for (var key in property) {
        str+=key+': '+property[key]+', ';
    }
    str+='}';
    throw str;
*/

PROTO.serializeTupleProperty = function(property, stream, value) {
    var fid = property.id;
    var wiretype = property.type().wiretype;
    var wireId = fid * 8 + wiretype;
//    PROTO.warn("Serializing property "+fid+" as "+wiretype+" pos is "+stream.write_pos_);
    if (wiretype != PROTO.wiretypes.lengthdelim && property.options.packed) {
        var bytearr = new Array();
        // Don't know length beforehand.
        var bas = new PROTO.ByteArrayStream(bytearr);
        if (property.multiplicity == PROTO.repeated) {
            for (var i = 0; i < value.length; i++) {
                var val = property.type().Convert(value[i]);
                for (var j=0;j<property.type().cardinality;++j) {
                    property.type().SerializeToStream(val[j], bas);
                }
            }
        }else {
            var val = property.type().Convert(value);
            for (var j=0;j<property.type().cardinality;++j) {
                property.type().SerializeToStream(val[j], bas);
            }
        }
        wireId = fid * 8 + PROTO.wiretypes.lengthdelim;
        PROTO.int32.SerializeToStream(wireId, stream);
        PROTO.bytes.SerializeToStream(bytearr, stream);
    } else {
        if (property.multiplicity == PROTO.repeated) {
            for (var i = 0; i < value.length; i++) {
                var val = property.type().Convert(value[i]);
                for (var j=0;j<property.type().cardinality;++j) {
                    PROTO.int32.SerializeToStream(wireId, stream);
                    property.type().SerializeToStream(val[j], stream);
                }
            }
        }else {
            var val = property.type().Convert(value);
            for (var j=0;j<property.type().cardinality;++j) {
                PROTO.int32.SerializeToStream(wireId, stream);
                property.type().SerializeToStream(val[j], stream);
            }
        }
    }
};
PROTO.serializeProperty = function(property, stream, value) {
    var fid = property.id;
    if (!property.type()) return;
    if (property.type().cardinality>1) {
        PROTO.serializeTupleProperty(property,stream,value);
        return;
    }
    var wiretype = property.type().wiretype;
    var wireId = fid * 8 + wiretype;
//    PROTO.warn("Serializing property "+fid+" as "+wiretype+" pos is "+stream.write_pos_);
    if (property.multiplicity == PROTO.repeated) {
        if (wiretype != PROTO.wiretypes.lengthdelim && property.options.packed) {
            var bytearr = new Array();
            // Don't know length beforehand.
            var bas = new PROTO.ByteArrayStream(bytearr);
            for (var i = 0; i < value.length; i++) {
                var val = property.type().Convert(value[i]);
                property.type().SerializeToStream(val, bas);
            }
            wireId = fid * 8 + PROTO.wiretypes.lengthdelim;
            PROTO.int32.SerializeToStream(wireId, stream);
            PROTO.bytes.SerializeToStream(bytearr, stream);
        } else {
            for (var i = 0; i < value.length; i++) {
                PROTO.int32.SerializeToStream(wireId, stream);
                var val = property.type().Convert(value[i]);
                property.type().SerializeToStream(val, stream);
            }
        }
    } else {
        PROTO.int32.SerializeToStream(wireId, stream);
        var val = property.type().Convert(value);
        property.type().SerializeToStream(val, stream);
    }
};


PROTO.Message = function(name, properties) {
    /** @constructor */
    var Composite = function() {
        this.properties_ = Composite.properties_;
        if (!PROTO.DefineProperty) {
            this.values_ = this;
        } else {
            this.values_ = {};
        }
        this.Clear();
        this.message_type_ = name;
    };
    Composite.properties_ = {};
    for (var key in properties) {
        // HACK: classes are currently included alongside properties.
        if (properties[key].isType) {
            Composite[key] = properties[key];
        } else {
            Composite.properties_[key] = properties[key];
        }
    }
    Composite.isType = true;
    Composite.composite = true;
    Composite.wiretype = PROTO.wiretypes.lengthdelim;
    Composite.IsInitialized = function(value) {
        return value && value.IsInitialized();
    };
    Composite.Convert = function Convert(val) {
        if (!(val instanceof Composite)) {
            throw "Value not instanceof "+name+": "+typeof(val)+" : "+val;
        }
        return val;
    };
    Composite.SerializeToStream = function(value, stream) {
        var bytearr = new Array();
        var bas = new PROTO.ByteArrayStream(bytearr);
        value.SerializeToStream(bas);
        return PROTO.bytes.SerializeToStream(bytearr, stream);
    };
    Composite.ParseFromStream = function(stream) {
        var bytearr = PROTO.bytes.ParseFromStream(stream);
        var bas = PROTO.CreateArrayStream(bytearr);
        var ret = new Composite;
        ret.ParseFromStream(bas);
        return ret;
    };
    Composite.prototype = {
        computeHasFields: function computeHasFields() {
            var has_fields = {};
            for (var key in this.properties_) {
                if (this.HasField(key)) {
                    has_fields[key] = true;
                }
            }
            return has_fields;
        },
        Clear: function Clear() {
            for (var prop in this.properties_) {
                this.ClearField(prop);
            }
        },
        IsInitialized: function IsInitialized() {
            var checked_any = false;
            for (var key in this.properties_) {
                checked_any = true;
                if (this.values_[key] !== undefined) {
                    var descriptor = this.properties_[key];
                    if (!descriptor.type()) continue;
                    if (descriptor.multiplicity == PROTO.repeated) {
                        if (PROTO.array.IsInitialized(this.values_[key])) {
                            return true;
                        }
                    } else {
                        if (!descriptor.type().IsInitialized ||
                            descriptor.type().IsInitialized(this.values_[key]))
                        {
                            return true;
                        }
                    }
                }
            }
            // As a special case, if there weren't any fields, we
            // treat it as initialized. This allows us to send
            // messages that are empty, but whose presence indicates
            // something.
            if (!checked_any) return true;
            // Otherwise, we checked at least one and it failed, so we
            // must be uninitialized.
            return false;
        },
        ParseFromStream: function Parse(stream) {
            this.Clear();
            return this.MergeFromStream(stream);
        },
        MergeFromStream: function Merge(stream) {
            return PROTO.mergeProperties(this.properties_, stream, this.values_);
        },
        SerializeToStream: function Serialize(outstream) {
            var hasfields = this.computeHasFields();
            for (var key in hasfields) {
                var val = this.values_[key];
                PROTO.serializeProperty(this.properties_[key], outstream, val);
            }
        },
        SerializeToArray: function (opt_array) {
            var stream = new PROTO.ByteArrayStream(opt_array);
            this.SerializeToStream(stream);
            return stream.getArray();
        },
        MergeFromArray: function (array) {
            return this.MergeFromStream(PROTO.CreateArrayStream(array));
        },
        ParseFromArray: function (array) {
            this.Clear();
            return this.MergeFromArray(array);
        },
        // Not implemented:
        // CopyFrom, MergeFrom, SerializePartialToX,
        // RegisterExtension, Extensions, ClearExtension
        ClearField: function ClearField(propname) {
            var descriptor = this.properties_[propname];
            if (descriptor.multiplicity == PROTO.repeated) {
                this.values_[propname] = new PROTO.array(descriptor);
            } else {
                var type = descriptor.type();
                if (type && type.composite) {
                    // Don't special case this. Otherwise, we can't actually
                    // tell whether a composite child was initialized
                    // intentionally or if it just happened here.
                    //this.values_[propname] = new type();
                    delete this.values_[propname];
                } else {
                    delete this.values_[propname];
                }
            }
        },
        ListFields: function ListFields() {
            var ret = [];
            var hasfields = this.computeHasFields();
            for (var f in hasfields) {
                ret.push(f);
            }
            return ret;
        },
        GetField: function GetField(propname) {
            //PROTO.warn(propname);
            var ret = this.values_[propname];
            var type = this.properties_[propname].type();
            if (ret && type.FromProto) {
                return type.FromProto(ret);
            }
            return ret;
        },
        SetField: function SetField(propname, value) {
            //PROTO.warn(propname+"="+value);
            if (value === undefined || value === null) {
                this.ClearField(propname);
            } else {
                var prop = this.properties_[propname];
                if (prop.multiplicity == PROTO.repeated) {
                    this.ClearField(propname);
                    for (var i = 0; i < value.length; i++) {
                        this.values_[propname].push(
                                prop.type().Convert(value[i]));
                    }
                } else {
                    this.values_[propname] = prop.type().Convert(value);
                }
            }
        },
        HasField: function HasField(propname) {
            if (this.values_[propname] !== undefined) {
                var descriptor = this.properties_[propname];
                if (!descriptor.type()) {
                    return false;
                }
                if (descriptor.multiplicity == PROTO.repeated) {
                    return PROTO.array.IsInitialized(this.values_[propname]);
                } else {
                    if (!descriptor.type().IsInitialized ||
                        descriptor.type().IsInitialized(
                            this.values_[propname]))
                    {
                        return true;
                    }
                }
            }
            return false;
        },
        formatValue: function(level, spaces, propname, val) {
            var str = spaces + propname;
            var type = this.properties_[propname].type();
            if (type.composite) {
                str += " " + val.toString(level+1);
            } else if (typeof val == 'string') {
                var myval = val;
                myval = myval.replace("\"", "\\\"")
                             .replace("\n", "\\n")
                             .replace("\r","\\r");
                str += ": \"" + myval + "\"\n";
            } else {
                if (type.FromProto) {
                    val = type.FromProto(val);
                }
                if (type.toString) {
                    var myval = type.toString(val);
                    str += ": " + myval + "\n";
                } else {
                    str += ": " + val + "\n";
                }
            }
            return str;
        },
        toString: function toString(level) {
            var spaces = "";
            var str = "";
            if (level) {
                str = "{\n";
                for (var i = 0 ; i < level*2; i++) {
                    spaces += " ";
                }
            } else {
                level = 0;
            }
            for (var propname in this.properties_) {
                if (!this.properties_[propname].type()) {
                    continue; // HACK:
                }
                if (!this.HasField(propname)) {
                    continue;
                }
                if (this.properties_[propname].multiplicity == PROTO.repeated) {
                    var arr = this.values_[propname];
                    for (var i = 0; i < arr.length; i++) {
                        str += this.formatValue(level, spaces, propname, arr[i]);
                    }
                } else {
                    str += this.formatValue(level, spaces, propname,
                                            this.values_[propname]);
                }
            }
            if (level) {
                str += "}\n";
            }
            return str;
        }
    };
    if (PROTO.DefineProperty !== undefined) {
        for (var prop in Composite.properties_) {
            (function(prop){
            PROTO.DefineProperty(Composite.prototype, prop,
                           function GetProp() { return this.GetField(prop); },
                           function SetProp(newval) { this.SetField(prop, newval); });
            })(prop);
        }
    }
    return Composite;
};

/** Builds an enumeration type with a mapping of values.
@param {number=} bits  Preferred size of the enum (unused at the moment). */
PROTO.Enum = function (name, values, bits) {
    if (!bits) {
        bits = 32;
    }
    var reverseValues = {};
    var enumobj = {};
    enumobj.isType = true;
    for (var key in values) {
        reverseValues[values[key] ] = key;
        enumobj[key] = values[key];
        enumobj[values[key]] = key;
    }
    enumobj.values = values;
    enumobj.reverseValues = reverseValues;

    enumobj.Convert = function Convert(s) {
        if (typeof s == 'number') {
            // (reverseValues[s] !== undefined)
            return s;
        }
        if (values[s] !== undefined) {
            return values[s]; // Convert string -> int
        }
        throw "Not a valid "+name+" enumeration value: "+s;
    };
    enumobj.toString = function toString(num) {
        if (reverseValues[num]) {
            return reverseValues[num];
        }
        return "" + num;
    };
    enumobj.ParseFromStream = function(a,b) {
        var e = PROTO.int32.ParseFromStream(a,b);
        return e;
    }
    enumobj.SerializeToStream = function(a,b) {
        return PROTO.int32.SerializeToStream(a,b);
    }
    enumobj.wiretype = PROTO.wiretypes.varint;

    return enumobj;
};
PROTO.Flags = function(bits, name, values) {
    return PROTO.Enum(name, values, bits);
};

PROTO.Extend = function(parent, newproperties) {
    for (var key in newproperties) {
        parent.properties_[key] = newproperties[key];
    }
    return parent;
};

//////// DEBUG
if (typeof(self.console)=="undefined") self.console = {};
if (typeof(self.console.log)=="undefined") self.console.log = function(message){
    if (document && document.body)
        document.body.appendChild(document.createTextNode(message+"..."));
};
