/*
 * gmockhttprequest
 * https://github.com/goliatone/gmockhttprequest
 * Created with gbase.
 * Copyright (c) 2014 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function (root, name, deps, factory) {
    'use strict';
    // Node
     if(typeof deps === 'function') {
        factory = deps;
        deps = [];
    }

    if (typeof exports === 'object') {
        module.exports = factory.apply(root, deps.map(require));
    } else if (typeof define === 'function' && 'amd' in define) {
        //require js, here we assume the file is named as the lower
        //case module name.
        define(name.toLowerCase(), deps, factory);
    } else {
        // Browser
        var d, i = 0, global = root, old = global[name], mod;
        while((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function(){
            global[name] = old;
            return mod;
        };
    }
}(this, 'GatewayHttpRequest', ['extend'], function(extend) {

    /**
     * Extend method.
     * @param  {Object} target Source object
     * @return {Object}        Resulting object from
     *                         meging target to params.
     */
    var _extend= extend;

    /**
     * Shim console, make sure that if no console
     * available calls do not generate errors.
     * @return {Object} Console shim.
     */
    var _shimConsole = function(con) {

        if (con) return con;

        con = {};
        var empty = {},
            noop = function() {},
            properties = 'memory'.split(','),
            methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
                'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
                'table,time,timeEnd,timeStamp,trace,warn').split(','),
            prop,
            method;

        while (method = methods.pop()) con[method] = noop;
        while (prop = properties.pop()) con[prop] = empty;

        return con;
    };




    function _startsWith(target /*, ...rest*/){
        var args = Array.prototype.slice.call(arguments, 1);
        return args.some(function(str){
            return target.indexOf(str) === 0;
        });
    }

    /**
     * Preserve references to original object,
     * we delete each key instead of overwriting
     * with new instance.
     *
     * @param  {Object} obj
     * @return {void}
     */
    function _resetObject(obj){
        Object.keys(obj).forEach(function(key){
            delete obj[key];
        });
    }

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////

    var OPTIONS = {
        autoinitialize: true,
        defaultRequestFactory: function(){
            return
        }
    };

    /**
     * ProxyHttpRequest constructor
     *
     * @param  {object} config Configuration object.
     */
    var ProxyHttpRequest = function(config){
        config = _extend({}, this.constructor.DEFAULTS, config);

        if(config.autoinitialize) this.init(config);

        if(typeof this.register === 'function') this.register(this);
    };

    ProxyHttpRequest.name = ProxyHttpRequest.prototype.name = 'ProxyHttpRequest';

    ProxyHttpRequest.VERSION = '0.0.0';


    /**
     * Make default options available so we
     * can override.
     */
    ProxyHttpRequest.DEFAULTS =  _extend({}, OPTIONS);

    ProxyHttpRequest.registerAction = function(action, handler){
        this.handlers || (this.handlers = {});
        this.handlers[action] = handler;
    };

    ProxyHttpRequest.getHandler = function(action){
        return this.handlers[action];
    };

    ProxyHttpRequest.registerRequest = function(url, action, options){
        // this.
    };

///////////////////////////////////////////////////
// PRIVATE METHODS
///////////////////////////////////////////////////

    ProxyHttpRequest.prototype.init = function(config){
        if(this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        this.reset();

        console.log('ProxyHttpRequest: Init!');
        _extend(this, config);
    };

    ProxyHttpRequest.prototype.open = function(method, url, async, user, password){
        var request = this.owner.buildRequestOpen(method, url);

        if(request && typeof this.xhr.applyTo === 'function'){
             this.xhr = this.xhr.applyTo(request);
        }

        this.xhr.open.apply(this.xhr, args);
    };

    ProxyHttpRequest.pathToRegExp = function (path, keys, options) {
        keys || (keys = []),
        options || (options = {});
        path = path
            .concat('/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional){
                if (_ === "*"){
                    keys.push(undefined);
                    return _;
                }

                keys.push({name:key});
                slash = slash || '';
                return ''
                    + (optional ? '' : slash)
                    + '(?:'
                    + (optional ? slash : '')
                    + (format || '') + (capture || '([^/]+?)') + ')'
                    + (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');

        var regexp = new RegExp('^' + path + '$', 'i');

        regexp.keys = keys;
        regexp.options = options;

        return regexp;
    };

    ProxyHttpRequest.prototype.logger = _shimConsole(console);

    return ProxyHttpRequest;
}));
