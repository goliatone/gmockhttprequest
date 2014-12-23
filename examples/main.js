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
    window.GMockHttpRequest = GMockHttpRequest;

	var Server = new GMockHttpRequest.Server(function(){
        console.log('server', arguments);
    });
    Server.start();
    Server.respondWith('GET', 'http://localhost:9000', 'Kaka');

    //=====================
    $.ajax({url:'http://localhost:9000'})
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        console.log('RUNNNNN')
    });
    //=====================

    Server.respond();

    window.Server = Server;
});