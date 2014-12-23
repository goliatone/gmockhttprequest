/*global define:true, describe:true , it:true , expect:true,
beforeEach:true, sinon:true, spyOn:true , expect:true */
/* jshint strict: false */
define(['gmockhttprequest', 'jquery'], function(GMockHttpRequest, $) {

    describe('just checking', function() {

        it('GMockHttpRequest should be loaded', function() {
            expect(GMockHttpRequest).toBeTruthy();
            var gmockhttprequest = new GMockHttpRequest();
            expect(gmockhttprequest).toBeTruthy();
        });

        it('GMockHttpRequest should initialize', function() {
            var gmockhttprequest = new GMockHttpRequest({autoinitialize:false});
            var output   = gmockhttprequest.init();
            var expected = 'This is just a stub!';
            expect(output).toEqual(expected);
        });
    });
});