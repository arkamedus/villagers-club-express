import {expect} from 'chai';

const request = require('request');

describe('URL Basics', () => {

    const base_url = "http://localhost";

    it('should return 200 response', (done) => {
        request({url:base_url+""}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/villagers"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/villagers/page/2"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/villagers/personality/cranky"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/furniture/ironwood-bed"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/furniture/housewares/ironwood-bed/old-brown"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/furniture/floors/ironwood-bed/old-brown"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/clothing"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/search/apollo"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/clothing/tops"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/critters/fish/page/2"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/reactions"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/reactions/love"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/tools/page/2"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/sets"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/sets/rattan"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 200 response', (done) => {
        request({url:base_url+"/search/red%20turkey"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(200);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/villager"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    /* it('should return 404 response', (done) => {
         request({url:"http://localhost/villagers/page/3/what"}, function (error, response, body) {
             expect(error).equal(null);
             expect(response.statusCode).equal(404);
             done();
         });
     });*/

    it('should return 404 response', (done) => {
        request({url:base_url+"/blah"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/equipment/tools/fudger"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/clothings"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/clothing/tops2"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/clothing/page/4002"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/search/asda/s"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

    it('should return 404 response', (done) => {
        request({url:base_url+"/furniture/ironwood-bed/s"}, function (error, response, body) {
            expect(error).equal(null);
            expect(response.statusCode).equal(404);
            done();
        });
    });

});