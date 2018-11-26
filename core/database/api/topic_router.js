/*jshint strict: global */
/*jshint esversion: 6 */
/*jshint multistr: true */
/* globals require */
/* globals module */
/* globals console */

'use strict';

const   createRouter = require('@arangodb/foxx/router');
const   router = createRouter();
const   joi = require('joi');

const   g_db = require('@arangodb').db;
const   g_graph = require('@arangodb/general-graph')._graph('sdmsg');
const   g_lib = require('./support');

module.exports = router;


//==================== TOPIC API FUNCTIONS

router.get('/list', function (req, res) {
    try {
        var topics = g_db._query("for v in 1..1 inbound @par top return {id:v._id,title:v.title}",{par: req.queryParams.id?req.queryParams.id:"t/root" });

        res.send( topics );
    } catch( e ) {
        g_lib.handleException( e, res );
    }
})
.queryParam('id', joi.string().optional(), "ID of topic to list (omit for top-level)")
.summary('List topics')
.description('List topics with optional parent');

router.get('/link', function (req, res) {
    try {
        g_db._executeTransaction({
            collections: {
                read: ["d"],
                write: ["t","top"]
            },
            action: function() {
                if ( !g_db.d.exists( req.queryParams.id ))
                    throw g_lib.ERR_INVALID_ID;

                g_lib.topicLink( req.queryParams.topic.toLowerCase(), req.queryParams.id );
            }
        });
    } catch( e ) {
        g_lib.handleException( e, res );
    }
})
.queryParam('topic', joi.string().required(), "Topic path")
.queryParam('id', joi.string().required(), "Data ID to link")
.summary('Link topic to data')
.description('Link topic to data');

router.get('/unlink', function (req, res) {
    try {
        g_db._executeTransaction({
            collections: {
                read: ["d"],
                write: ["t","top"]
            },
            action: function() {
                if ( !g_db.d.exists( req.queryParams.id ))
                    throw g_lib.ERR_INVALID_ID;

                g_lib.topicUnlink( req.queryParams.id );
            }
        });
    } catch( e ) {
        g_lib.handleException( e, res );
    }
})
.queryParam('id', joi.string().required(), "Data ID or alias to unlink")
.summary('Unlink topic from data')
.description('Unlink topic from data');
