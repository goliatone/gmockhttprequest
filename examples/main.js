/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gmockhttprequest': 'gmockhttprequest'
    }
});

define(['gmockhttprequest', 'jquery'], function (GMockHttpRequest, $) {
    console.log('Loading');
	var gmockhttprequest = new GMockHttpRequest();
});